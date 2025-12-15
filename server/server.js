import { Server } from "socket.io";

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

console.log(`Game Server running on port ${PORT}`);

// State
const rooms = new Map();
// Room Structure:
// {
//   id: string,
//   white: socketId,
//   black: socketId,
//   spectators: []
// }

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("create_room", () => {
    const roomId = Math.random().toString(36).substr(2, 4).toUpperCase();
    rooms.set(roomId, {
      id: roomId,
      white: socket.id,
      black: null,
      spectators: [],
    });

    socket.join(roomId);
    socket.emit("room_created", { roomId });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on("join_room", (roomId) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    // If room has no black player, join as black
    if (!room.black) {
      room.black = socket.id;
      socket.join(roomId);

      // Notify everyone game starts
      io.to(roomId).emit("game_start", {
        whiteId: room.white,
        blackId: room.black,
      });
      console.log(`Game started in room ${roomId}`);
    } else {
      // Room full
      socket.emit("error", { message: "Room is full" });
    }
  });

  socket.on("game_action", (payload) => {
    const { roomId, type, ...data } = payload;
    // Relay to everyone else in the room
    socket.to(roomId).emit("game_action", { type, ...data });
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    handleDisconnect(socket, roomId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Find rooms this socket was in and clean up
    rooms.forEach((room, roomId) => {
      if (room.white === socket.id || room.black === socket.id) {
        handleDisconnect(socket, roomId);
      }
    });
  });
});

function handleDisconnect(socket, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    io.to(roomId).emit("opponent_left");
    rooms.delete(roomId);
    console.log(`Room ${roomId} closed due to disconnect`);
  }
}
