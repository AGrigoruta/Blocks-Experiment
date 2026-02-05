import "dotenv/config";
import { Server } from "socket.io";
import {
  saveMatch,
  getAllMatches,
  getMatchesByPlayer,
  getPlayerStats,
  getLeaderboard,
  saveCustomEmoji,
  getAllCustomEmojis,
} from "./db.js";

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const io = new Server(PORT, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  host: "0.0.0.0",
});

// HTTP server for REST endpoints
const httpServer = io.httpServer || io.engine.server;

// Add HTTP endpoint for leaderboard - must be registered before Socket.IO handles requests
if (httpServer) {
  const originalEmit = httpServer.emit;
  httpServer.emit = function (event, req, res) {
    if (event === "request") {
      // Only handle our specific endpoint
      if (req.url === "/leaderboard") {
        // Handle CORS preflight
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === "GET") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Content-Type", "application/json");

          getLeaderboard(10)
            .then((leaderboard) => {
              res.writeHead(200);
              res.end(JSON.stringify({ leaderboard }));
            })
            .catch((error) => {
              res.writeHead(500);
              res.end(JSON.stringify({ error: error.message }));
            });
          return;
        }
      }
    }
    // Let Socket.IO handle all other requests
    return originalEmit.apply(this, arguments);
  };
}

console.log(`Game Server running on port ${PORT}`);

// State
const rooms = new Map();
// Room Structure:
// {
//   id: string,
//   isPrivate: boolean,
//   roomCode: string (only for private rooms),
//   white: socketId,
//   whiteName: string,
//   black: socketId,
//   blackName: string,
//   spectators: [],
//   whiteRematch: boolean,
//   blackRematch: boolean,
//   whiteScore: number,
//   blackScore: number,
//   lastWinner: string | null (tracks who won the last game: 'white', 'black', or 'draw'),
//   timeSettings: { isTimed: boolean, initialTime: number, increment: number },
//   createdAt: timestamp,
//   gameStarted: boolean (tracks if at least one move has been made),
//   gameStartTime: number | null (timestamp when first move is made),
//   whiteBlocks: number (count of white player's blocks),
//   blackBlocks: number (count of black player's blocks),
//   disconnectMatchSaved: boolean (prevents duplicate saves on disconnect),
//   blocks: array (tracks all placed blocks for state sync),
//   currentPlayer: string (tracks whose turn it is),
//   whiteTime: number (tracks remaining time for white in seconds),
//   blackTime: number (tracks remaining time for black in seconds)
// }

// Rate limiting for custom emoji uploads
const uploadRateLimits = new Map();
const UPLOAD_RATE_LIMIT = 5; // Max uploads per window
const UPLOAD_RATE_WINDOW = 60000; // 1 minute in milliseconds

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("create_room", (data) => {
    const playerName = data?.playerName || "White";
    const isPrivate = data?.isPrivate || false;
    const timeSettings = data?.timeSettings || {
      isTimed: true,
      initialTime: 300,
      increment: 5,
    };
    const roomId = Math.random().toString(36).substr(2, 4).toUpperCase();
    const roomCode = isPrivate
      ? Math.random().toString(36).substr(2, 4).toUpperCase()
      : null;

    rooms.set(roomId, {
      id: roomId,
      isPrivate,
      roomCode,
      white: socket.id,
      whiteName: playerName,
      black: null,
      blackName: null,
      spectators: [],
      whiteRematch: false,
      blackRematch: false,
      whiteScore: 0,
      blackScore: 0,
      lastWinner: null,
      timeSettings,
      createdAt: Date.now(),
      gameStarted: false,
      gameStartTime: null,
      whiteBlocks: 0,
      blackBlocks: 0,
      disconnectMatchSaved: false,
      blocks: [],
      currentPlayer: "white",
      whiteTime: timeSettings.isTimed ? timeSettings.initialTime : 999999,
      blackTime: timeSettings.isTimed ? timeSettings.initialTime : 999999,
    });

    socket.join(roomId);
    socket.emit("room_created", { roomId, roomCode });
    console.log(
      `Room ${roomId} created by ${socket.id} (${playerName}) - ${
        isPrivate ? "Private" : "Public"
      } with time settings`,
      timeSettings,
    );

    // Broadcast updated room list to all clients
    broadcastRoomList();
  });

  socket.on("get_rooms", () => {
    sendRoomList(socket);
  });

  socket.on("join_room", async (data) => {
    const roomId = typeof data === "string" ? data : data.roomId;
    const playerName = typeof data === "object" ? data.playerName : "Black";
    const roomCode = typeof data === "object" ? data.roomCode : null;
    const asSpectator = typeof data === "object" ? data.asSpectator : false;

    const room = rooms.get(roomId);

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    // Check if room is private and room code is required
    if (room.isPrivate && room.roomCode !== roomCode) {
      socket.emit("error", { message: "Invalid room code" });
      return;
    }

    // Handle spectator join
    if (asSpectator) {
      // Only allow spectators in games that have started (both players present)
      if (!room.black || !room.white) {
        socket.emit("error", {
          message: "Cannot spectate - game hasn't started yet",
        });
        return;
      }

      room.spectators.push(socket.id);
      socket.join(roomId);

      // Send current game state to spectator
      let whiteStats = null;
      let blackStats = null;
      try {
        whiteStats = await getPlayerStats(room.whiteName);
        blackStats = await getPlayerStats(room.blackName);
      } catch (err) {
        console.error("Error fetching stats for spectator:", err);
      }

      socket.emit("joined_as_spectator", {
        roomId,
        whiteId: room.white,
        blackId: room.black,
        whiteName: room.whiteName,
        blackName: room.blackName,
        whiteStats,
        blackStats,
        timeSettings: room.timeSettings,
        gameStarted: room.gameStarted,
        blocks: room.blocks,
        currentPlayer: room.currentPlayer,
        whiteTime: room.whiteTime,
        blackTime: room.blackTime,
      });

      console.log(`Spectator ${socket.id} joined room ${roomId}`);
      return;
    }

    // Check if joining player has the same name as the host
    if (room.whiteName.toLowerCase() === playerName.toLowerCase()) {
      socket.emit("error", {
        message: "You cannot use the same name as the host",
      });
      return;
    }

    if (!room.black) {
      room.black = socket.id;
      room.blackName = playerName;
      socket.join(roomId);

      let whiteStats = null;
      let blackStats = null;
      try {
        whiteStats = await getPlayerStats(room.whiteName);
        blackStats = await getPlayerStats(room.blackName);
      } catch (err) {
        console.error("Error fetching stats on game start:", err);
      }

      io.to(roomId).emit("game_start", {
        whiteId: room.white,
        blackId: room.black,
        whiteName: room.whiteName,
        blackName: room.blackName,
        whiteStats,
        blackStats,
        timeSettings: room.timeSettings,
        startingPlayer: "white",
      });
      console.log(
        `Game started in room ${roomId}. ${room.whiteName} vs ${room.blackName}`,
      );

      // Broadcast updated room list to all clients
      broadcastRoomList();
    } else {
      socket.emit("error", { message: "Room is full" });
    }
  });

  socket.on("game_action", async (payload) => {
    const { roomId, type, ...data } = payload;
    const room = rooms.get(roomId);

    // Validate that the sender is an actual player, not a spectator
    if (room && socket.id !== room.white && socket.id !== room.black) {
      console.log(
        `Spectator ${socket.id} attempted to send game action - blocked`,
      );
      return;
    }

    // Mark game as started when first move is made and track the start time
    if (room && type === "MOVE") {
      if (!room.gameStarted) {
        room.gameStarted = true;
        room.gameStartTime = Date.now();
      }

      // Store the block in room state for spectator sync
      if (data.block) {
        room.blocks.push(data.block);
      }

      // Update current player
      if (data.nextPlayer) {
        room.currentPlayer = data.nextPlayer;
      }

      // Update times
      if (data.wTime !== undefined) {
        room.whiteTime = data.wTime;
      }
      if (data.bTime !== undefined) {
        room.blackTime = data.bTime;
      }

      // Track block counts
      if (data.block && data.block.player) {
        if (data.block.player === "white") {
          room.whiteBlocks++;
        } else if (data.block.player === "black") {
          room.blackBlocks++;
        }
      }

      // Check if game has ended and save match using server-side tracked data
      if (
        data.gameEnded &&
        data.winner &&
        room.gameStartTime &&
        !room.disconnectMatchSaved
      ) {
        room.disconnectMatchSaved = true; // Mark as saved to prevent duplicates

        const matchTime = Math.round((Date.now() - room.gameStartTime) / 1000);

        const matchData = {
          whiteName: room.whiteName,
          blackName: room.blackName,
          winner: data.winner,
          matchTime: matchTime,
          whiteNumberOfBlocks: room.whiteBlocks,
          blackNumberOfBlocks: room.blackBlocks,
          matchEndTimestamp: new Date().toISOString(),
        };

        try {
          await saveMatch(matchData);
          console.log(
            `Match saved. Winner: ${data.winner}. Time: ${matchTime}s, White blocks: ${room.whiteBlocks}, Black blocks: ${room.blackBlocks}`,
          );
        } catch (error) {
          console.error("Error saving match on game end:", error);
        }
      }
    }

    // Reset game state when RESET action is received
    if (room && type === "RESET") {
      room.gameStarted = false;
      room.gameStartTime = null;
      room.whiteBlocks = 0;
      room.blackBlocks = 0;
      room.disconnectMatchSaved = false;
      room.blocks = [];
      room.currentPlayer = "white";
      room.whiteTime = room.timeSettings.isTimed
        ? room.timeSettings.initialTime
        : 999999;
      room.blackTime = room.timeSettings.isTimed
        ? room.timeSettings.initialTime
        : 999999;
    }

    socket.to(roomId).emit("game_action", { type, ...data });
  });

  socket.on("send_message", (data) => {
    const { roomId, message, playerName } = data;
    if (!roomId) return;

    const room = rooms.get(roomId);

    // Prevent spectators from sending messages (they are nameless and could cause confusion)
    if (room && room.spectators.includes(socket.id)) {
      console.log(`Spectator ${socket.id} attempted to send message - blocked`);
      return;
    }

    io.to(roomId).emit("receive_message", {
      sender: playerName,
      text: message,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    });
  });

  socket.on("request_rematch", async ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Only allow players to request rematch, not spectators
    if (socket.id !== room.white && socket.id !== room.black) {
      return;
    }

    if (socket.id === room.white) room.whiteRematch = true;
    if (socket.id === room.black) room.blackRematch = true;

    socket.to(roomId).emit("rematch_requested");

    if (room.whiteRematch && room.blackRematch) {
      // Determine starting player: loser of previous match goes first
      // If previous game was a draw or no previous game, white (host) starts
      let startingPlayer = "white";
      if (room.lastWinner === "white") {
        startingPlayer = "black"; // White won last, so black (loser) starts
      } else if (room.lastWinner === "black") {
        startingPlayer = "white"; // Black won last, so white (loser) starts
      }
      // If lastWinner is null or "draw", white starts (default)

      // Reset rematch flags and game state
      room.whiteRematch = false;
      room.blackRematch = false;
      room.gameStarted = false;
      room.gameStartTime = null;
      room.whiteBlocks = 0;
      room.blackBlocks = 0;
      room.disconnectMatchSaved = false;
      room.blocks = [];
      room.currentPlayer = startingPlayer;
      room.whiteTime = room.timeSettings.isTimed
        ? room.timeSettings.initialTime
        : 999999;
      room.blackTime = room.timeSettings.isTimed
        ? room.timeSettings.initialTime
        : 999999;

      let whiteStats = null;
      let blackStats = null;
      try {
        whiteStats = await getPlayerStats(room.whiteName);
        blackStats = await getPlayerStats(room.blackName);
      } catch (err) {
        console.error("Error fetching stats on rematch:", err);
      }

      io.to(roomId).emit("game_start", {
        whiteId: room.white,
        blackId: room.black,
        whiteName: room.whiteName,
        blackName: room.blackName,
        whiteStats,
        blackStats,
        timeSettings: room.timeSettings,
        startingPlayer,
      });
    }
  });

  socket.on("save_match", (matchData) => {
    saveMatch(matchData)
      .then((savedMatch) => {
        socket.emit("match_saved", { success: true, matchId: savedMatch.id });
      })
      .catch((error) => {
        socket.emit("match_saved", { success: false, error: error.message });
      });
  });

  socket.on("update_score", ({ roomId, winner }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Track the last winner for rematch starting player logic
    room.lastWinner = winner;

    // Update scores
    if (winner === "white") {
      room.whiteScore++;
    } else if (winner === "black") {
      room.blackScore++;
    }
    // No score update for draw, but lastWinner is still set to "draw"
  });

  socket.on("get_matches", (data) => {
    const { playerName, limit } = data || {};
    const matchesPromise = playerName
      ? getMatchesByPlayer(playerName, limit)
      : getAllMatches(limit);

    matchesPromise
      .then((matches) => {
        socket.emit("matches_data", { matches });
      })
      .catch((error) => {
        socket.emit("matches_data", { matches: [], error: error.message });
      });
  });

  socket.on("get_player_stats", (data) => {
    const { playerName } = data;
    getPlayerStats(playerName)
      .then((stats) => {
        socket.emit("player_stats", { stats });
      })
      .catch((error) => {
        socket.emit("player_stats", { stats: null, error: error.message });
      });
  });

  socket.on("upload_custom_emoji", (data) => {
    const { emoji, label, uploadedBy, isImage } = data;

    // Validate isImage parameter type
    if (isImage !== undefined && typeof isImage !== "boolean") {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Invalid isImage parameter",
      });
      return;
    }

    // Validate input before rate limiting
    if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Emoji is required",
      });
      return;
    }

    if (!label || typeof label !== "string" || label.trim().length === 0) {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Label is required",
      });
      return;
    }

    if (
      !uploadedBy ||
      typeof uploadedBy !== "string" ||
      uploadedBy.trim().length === 0
    ) {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Uploader name is required",
      });
      return;
    }

    // Trim inputs for validation and storage
    const trimmedEmoji = emoji.trim();
    const trimmedLabel = label.trim();
    const trimmedUploadedBy = uploadedBy.trim();

    // Different validation for images vs emoji unicode
    if (isImage) {
      // Validate data URL format for images
      const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
      if (!dataUrlRegex.test(trimmedEmoji)) {
        socket.emit("custom_emoji_uploaded", {
          success: false,
          error:
            "Invalid image format. Only PNG, JPEG, GIF, and WebP images are supported (no SVG)",
        });
        return;
      }

      // Block SVG images to prevent XSS attacks
      if (trimmedEmoji.includes("data:image/svg")) {
        socket.emit("custom_emoji_uploaded", {
          success: false,
          error: "SVG images are not supported for security reasons",
        });
        return;
      }

      // Check image size limit (~2MB raw image → ~2.8MB base64-encoded)
      // Adjusted to account for base64 overhead (≈1.37x)
      if (trimmedEmoji.length > 2.8 * 1024 * 1024) {
        socket.emit("custom_emoji_uploaded", {
          success: false,
          error:
            "Image is too large (max ~2MB before encoding, ~2.8MB as base64)",
        });
        return;
      }
    } else {
      // Validate emoji unicode
      const codepointCount = [...trimmedEmoji].length;
      if (codepointCount > 5) {
        socket.emit("custom_emoji_uploaded", {
          success: false,
          error: "Emoji is too long (max 5 characters)",
        });
        return;
      }

      // Emoji validation - require the entire string to be composed of emoji characters
      const emojiRegex =
        /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Presentation}]+$/u;
      if (!emojiRegex.test(trimmedEmoji)) {
        socket.emit("custom_emoji_uploaded", {
          success: false,
          error: "Please provide a valid emoji",
        });
        return;
      }
    }

    if (trimmedLabel.length > 50) {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Label is too long (max 50 characters)",
      });
      return;
    }

    if (trimmedUploadedBy.length > 100) {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Uploader name is too long (max 100 characters)",
      });
      return;
    }

    // Rate limiting check after validation
    const now = Date.now();
    const socketLimits = uploadRateLimits.get(socket.id) || {
      count: 0,
      windowStart: now,
    };

    // Reset window if expired
    if (now - socketLimits.windowStart > UPLOAD_RATE_WINDOW) {
      socketLimits.count = 0;
      socketLimits.windowStart = now;
    }

    // Check if limit exceeded
    if (socketLimits.count >= UPLOAD_RATE_LIMIT) {
      socket.emit("custom_emoji_uploaded", {
        success: false,
        error: "Too many upload attempts. Please wait a moment and try again.",
      });
      return;
    }

    // Increment counter only after validation
    socketLimits.count++;
    uploadRateLimits.set(socket.id, socketLimits);

    saveCustomEmoji({
      emoji: trimmedEmoji,
      label: trimmedLabel,
      uploadedBy: trimmedUploadedBy,
      isImage: isImage || false,
    })
      .then((savedEmoji) => {
        if (savedEmoji === null) {
          // Emoji already exists
          socket.emit("custom_emoji_uploaded", {
            success: false,
            error: "This emoji has already been added",
          });
          return;
        }
        // Broadcast to all clients that a new emoji is available
        io.emit("custom_emoji_added", savedEmoji);
        socket.emit("custom_emoji_uploaded", {
          success: true,
          emoji: savedEmoji,
        });
      })
      .catch((error) => {
        console.error("Error saving custom emoji:", error);
        socket.emit("custom_emoji_uploaded", {
          success: false,
          error: "Failed to save emoji. Please try again.",
        });
      });
  });

  socket.on("get_custom_emojis", () => {
    getAllCustomEmojis()
      .then((emojis) => {
        socket.emit("custom_emojis_data", { emojis });
      })
      .catch((error) => {
        console.error("Error fetching custom emojis:", error);
        socket.emit("custom_emojis_data", {
          emojis: [],
          error: "Failed to load custom emojis",
        });
      });
  });

  socket.on("leave_room", (roomId) => {
    const room = rooms.get(roomId);

    // Check if the leaving socket is a spectator
    if (room && room.spectators.includes(socket.id)) {
      // Remove spectator from room without ending the game
      room.spectators = room.spectators.filter((id) => id !== socket.id);
      socket.leave(roomId);
      console.log(`Spectator ${socket.id} left room ${roomId}`);
      return;
    }

    // For players, handle disconnect normally
    socket.leave(roomId);
    handleDisconnect(socket, roomId);
  });

  socket.on("disconnect", () => {
    // Clean up rate limiting data
    uploadRateLimits.delete(socket.id);

    rooms.forEach((room, roomId) => {
      if (room.white === socket.id || room.black === socket.id) {
        handleDisconnect(socket, roomId);
      } else if (room.spectators.includes(socket.id)) {
        // Remove spectator from room
        room.spectators = room.spectators.filter((id) => id !== socket.id);
        console.log(`Spectator ${socket.id} left room ${roomId}`);
      }
    });
  });
});

async function handleDisconnect(socket, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    // Check if game was in progress:
    // 1. Both players must have joined
    // 2. At least one move must have been made (gameStarted flag)
    // 3. Match shouldn't have been saved already (prevents duplicates)
    // 4. Socket must be one of the players (not a spectator or invalid)
    const isPlayer = socket.id === room.white || socket.id === room.black;

    if (
      room.white &&
      room.black &&
      room.gameStarted &&
      !room.disconnectMatchSaved &&
      isPlayer
    ) {
      // Determine who disconnected and who is the winner
      const disconnectedPlayer = socket.id === room.white ? "white" : "black";
      const winner = disconnectedPlayer === "white" ? "black" : "white";

      // Mark as saved to prevent duplicate saves
      room.disconnectMatchSaved = true;

      // Calculate match time from game start time
      const matchTime = room.gameStartTime
        ? Math.round((Date.now() - room.gameStartTime) / 1000)
        : 0;

      // Save match to database with disconnecting player as loser
      const matchData = {
        whiteName: room.whiteName,
        blackName: room.blackName,
        winner: winner,
        matchTime: matchTime,
        whiteNumberOfBlocks: room.whiteBlocks,
        blackNumberOfBlocks: room.blackBlocks,
        matchEndTimestamp: new Date().toISOString(),
      };

      try {
        await saveMatch(matchData);
        console.log(
          `Match saved due to ${disconnectedPlayer} (${room[disconnectedPlayer + "Name"]}) disconnect. Winner: ${winner} (${room[winner + "Name"]}). Time: ${matchTime}s, White blocks: ${room.whiteBlocks}, Black blocks: ${room.blackBlocks}`,
        );
      } catch (error) {
        console.error("Error saving match on disconnect:", error);
      }
    }

    io.to(roomId).emit("opponent_left");
    rooms.delete(roomId);
    console.log(`Room ${roomId} closed due to disconnect`);

    // Broadcast updated room list to all clients
    broadcastRoomList();
  }
}

function sendRoomList(socket) {
  const roomList = Array.from(rooms.values()).map((room) => ({
    roomId: room.id,
    hostName: room.whiteName,
    isPrivate: room.isPrivate,
    playerCount: room.black ? 2 : 1,
    maxPlayers: 2,
    timeSettings: room.timeSettings,
    canSpectate: room.black !== null, // Can spectate if game has started
  }));

  socket.emit("room_list", { rooms: roomList });
}

function broadcastRoomList() {
  const roomList = Array.from(rooms.values()).map((room) => ({
    roomId: room.id,
    hostName: room.whiteName,
    isPrivate: room.isPrivate,
    playerCount: room.black ? 2 : 1,
    maxPlayers: 2,
    timeSettings: room.timeSettings,
    canSpectate: room.black !== null, // Can spectate if game has started
  }));

  io.emit("room_list", { rooms: roomList });
}
