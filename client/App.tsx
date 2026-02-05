import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tutorial } from "@/components/Tutorial";
import { LeaderboardModal } from "@/components/LeaderboardModal";
import { LobbyModal } from "@/components/LobbyModal";
import { LocalGameSetup } from "@/components/LocalGameSetup";
import { AIGameSetup } from "@/components/AIGameSetup";
import { MainMenu } from "@/components/MainMenu";
import { GameView } from "@/components/GameView";
import { useSocket } from "@/hooks/useSocket";
import { useGameState } from "@/hooks/useGameState";
import { getBestMove } from "@/utils/aiPlayer";
import {
  hasValidMove,
  applyBlockToGrid,
  checkWin,
  createEmptyGrid,
  rebuildGridFromBlocks,
} from "@/utils/gameLogic";
import { ChatMessage } from "@/components/Chat";
import {
  GameMode,
  AIDifficulty,
  PlayerStats,
  LeaderboardEntry,
  RoomInfo,
  Player,
} from "@/types";
import {
  INITIAL_TIME_SECONDS,
  INCREMENT_SECONDS,
  MAX_BLOCKS_PER_PLAYER,
  DEFAULT_REACTIONS,
} from "@/constants";
import { CustomEmoji } from "@/types";
import { CustomEmojiUpload } from "@/components/CustomEmojiUpload";

const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL || "http://localhost:3000";

function App() {
  // UI State
  const [isInLobby, setIsInLobby] = useState(true);
  const [showLocalSetup, setShowLocalSetup] = useState(false);
  const [showAISetup, setShowAISetup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [viewStatsPlayer, setViewStatsPlayer] = useState<Player | null>(null);

  // Game Mode & Settings
  const [gameMode, setGameMode] = useState<GameMode>("local");
  const [isTimed, setIsTimed] = useState(true);
  const [initialTimeSetting, setInitialTimeSetting] =
    useState(INITIAL_TIME_SECONDS);
  const [incrementSetting, setIncrementSetting] = useState(INCREMENT_SECONDS);

  // Player Names & Scores
  const [myName, setMyName] = useState("Player");
  const [whiteName, setWhiteName] = useState("White");
  const [blackName, setBlackName] = useState("Black");
  const [localWhiteName, setLocalWhiteName] = useState("Player 1");
  const [localBlackName, setLocalBlackName] = useState("Player 2");
  const [whiteScore, setWhiteScore] = useState(0);
  const [blackScore, setBlackScore] = useState(0);

  // AI Settings
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>("medium");
  const [aiPlayer, setAIPlayer] = useState<Player>("black");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Online Game State
  const [myPlayer, setMyPlayer] = useState<Player>("white");
  const [whiteStats, setWhiteStats] = useState<PlayerStats | null>(null);
  const [blackStats, setBlackStats] = useState<PlayerStats | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRematchRequested, setOpponentRematchRequested] =
    useState(false);

  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Reactions
  const [activeReactions, setActiveReactions] = useState<
    {
      id: string;
      emoji: string;
      sender: string;
    }[]
  >([]);

  // Custom Emojis
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [allReactions, setAllReactions] = useState<string[]>(DEFAULT_REACTIONS);
  const [showEmojiUpload, setShowEmojiUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Lobby
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  const hasShownStatsRef = useRef(false);
  const isChatOpenRef = useRef(isChatOpen);
  const lastProcessedWinnerRef = useRef<string | null>(null);

  // Socket Hook
  const socket = useSocket({
    myName,
    onGameStart: (data) => {
      setIsInLobby(false);
      setWhiteName(data.whiteName || "White");
      setBlackName(data.blackName || "Black");
      setWhiteStats(data.whiteStats);
      setBlackStats(data.blackStats);

      if (data.timeSettings) {
        setIsTimed(data.timeSettings.isTimed);
        setInitialTimeSetting(data.timeSettings.initialTime);
        setIncrementSetting(data.timeSettings.increment);
      }

      hasShownStatsRef.current = false;
      lastProcessedWinnerRef.current = null; // Reset winner tracking for new game

      if (socket.socketRef.current?.id === data.blackId) {
        setMyPlayer("black");
      } else {
        setMyPlayer("white");
      }

      setRematchRequested(false);
      setOpponentRematchRequested(false);

      // Reset game state with correct time settings
      const timeToSet = data.timeSettings?.isTimed
        ? data.timeSettings.initialTime
        : 999999;
      gameState.setGrid(createEmptyGrid());
      gameState.setBlocks([]);
      gameState.setCurrentPlayer(data.startingPlayer || "white");
      gameState.setWinner(null);
      gameState.setWinningCells(null);
      gameState.setOrientation("vertical");
      gameState.setHoverX(null);
      gameState.setWhiteTime(timeToSet);
      gameState.setBlackTime(timeToSet);
      gameState.setGameStartTime(Date.now());
    },
    onGameAction: (data) => {
      if (data.type === "MOVE") {
        const { block, nextPlayer, wTime, bTime, isDraw, gameEnded } = data;

        // Add block and rebuild grid from all blocks to ensure sync
        const newBlocks = [...gameState.blocks, block];
        const newGrid = rebuildGridFromBlocks(newBlocks);

        gameState.setGrid(newGrid);
        gameState.setBlocks(newBlocks);
        gameState.setWhiteTime(wTime);
        gameState.setBlackTime(bTime);

        // Check win conditions
        const win = checkWin(newGrid, block.player);
        if (win) {
          gameState.setWinner(block.player);
          gameState.setWinningCells(win);
        } else if (isDraw) {
          gameState.setWinner("draw");
        } else if (gameEnded) {
          const nextCanMove = hasValidMove(newGrid, nextPlayer);
          const nextPlayerBlockCount = newBlocks.filter(
            (b) => b.player === nextPlayer,
          ).length;

          if (!nextCanMove && nextPlayerBlockCount < MAX_BLOCKS_PER_PLAYER) {
            gameState.setWinner(block.player);
          }
        }

        if (!gameEnded && !win && !isDraw) {
          gameState.setCurrentPlayer(nextPlayer);
        }
      } else if (data.type === "RESET") {
        gameState.resetGame();
      }
    },
    onReceiveMessage: (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      // Check if message is a reaction emoji
      if (allReactions.includes(msg.text)) {
        setActiveReactions((prev) => [
          ...prev,
          { id: msg.id, emoji: msg.text, sender: msg.sender },
        ]);
      }
      if (!isChatOpenRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    onRematchRequested: () => {
      setOpponentRematchRequested(true);
    },
    onOpponentLeft: () => {
      alert("Opponent disconnected.");
      setIsInLobby(true);
      gameState.resetGame();
      setWhiteScore(0);
      setBlackScore(0);
      setChatMessages([]);
      hasShownStatsRef.current = false;
    },
    onRoomCreated: (data) => {
      setWhiteScore(0);
      setBlackScore(0);
      setChatMessages([]);
      setWhiteStats(null);
      setBlackStats(null);
      hasShownStatsRef.current = false;
    },
    onRoomList: (rooms) => {
      setRooms(rooms);
      setIsRoomsLoading(false);
    },
    onError: (message) => {
      alert(message);
      setIsInLobby(true);
    },
  });

  // Game State Hook
  const gameState = useGameState({
    isTimed,
    initialTimeSetting,
    incrementSetting,
    gameMode,
    myPlayer,
    aiPlayer,
    onSendNetworkAction: socket.sendGameAction,
  });

  // Update refs
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Fetch and listen for custom emojis
  useEffect(() => {
    const socketInstance = socket.socketRef.current;
    if (!socketInstance || !socketInstance.connected) return;

    // Fetch custom emojis on mount
    socketInstance.emit("get_custom_emojis");

    // Listen for custom emoji updates
    const handleCustomEmojisData = (data: { emojis: CustomEmoji[] }) => {
      setCustomEmojis(data.emojis);
    };

    const handleCustomEmojiAdded = (emoji: CustomEmoji) => {
      setCustomEmojis((prev) => {
        // Check if emoji already exists
        if (prev.some((e) => e.id === emoji.id)) return prev;
        return [...prev, emoji];
      });
    };

    const handleCustomEmojiUploaded = (data: {
      success: boolean;
      error?: string;
      emoji?: CustomEmoji;
    }) => {
      if (!data.success) {
        setUploadError(data.error || "Failed to upload emoji");
      } else {
        // Success - close modal
        setShowEmojiUpload(false);
        setUploadError(null);
      }
    };

    socketInstance.on("custom_emojis_data", handleCustomEmojisData);
    socketInstance.on("custom_emoji_added", handleCustomEmojiAdded);
    socketInstance.on("custom_emoji_uploaded", handleCustomEmojiUploaded);

    return () => {
      socketInstance.off("custom_emojis_data", handleCustomEmojisData);
      socketInstance.off("custom_emoji_added", handleCustomEmojiAdded);
      socketInstance.off("custom_emoji_uploaded", handleCustomEmojiUploaded);
    };
  }, [socket.connectionStatus]); // Use connectionStatus as dependency instead of socketRef.current

  // Update allReactions whenever customEmojis changes
  useEffect(() => {
    const customEmojiList = customEmojis.map((e) => e.emoji);
    setAllReactions([...DEFAULT_REACTIONS, ...customEmojiList]);
  }, [customEmojis]);

  // Handle winner/score updates
  useEffect(() => {
    // Create a unique key for this winner state (includes winner and game start time to track each game)
    const winnerKey = gameState.winner
      ? `${gameState.winner}-${gameState.gameStartTime}`
      : null;

    // Only process if we have a winner and haven't already processed this specific winner
    if (winnerKey && winnerKey !== lastProcessedWinnerRef.current) {
      lastProcessedWinnerRef.current = winnerKey;

      if (gameState.winner !== "draw") {
        if (gameState.winner === "white") {
          setWhiteScore((s) => s + 1);
          gameState.setPreviousLoser("black");
        } else {
          setBlackScore((s) => s + 1);
          gameState.setPreviousLoser("white");
        }

        // Send score update to server for online games
        if (gameMode === "online" && socket.socketRef.current) {
          socket.socketRef.current.emit("update_score", {
            roomId: socket.roomId,
            winner: gameState.winner,
          });
        }
      } else {
        gameState.setPreviousLoser(gameState.previousLoser || "white");
      }
    }
  }, [gameState.winner, gameState.gameStartTime, gameMode, socket.roomId]);

  // Timer effect
  useEffect(() => {
    if (
      gameState.winner ||
      isInLobby ||
      showLocalSetup ||
      showAISetup ||
      !isTimed
    )
      return;

    const interval = setInterval(() => {
      if (gameState.currentPlayer === "white") {
        gameState.setWhiteTime((prev) => {
          if (prev <= 1) {
            gameState.setWinner("black");
            return 0;
          }
          return prev - 1;
        });
      } else {
        gameState.setBlackTime((prev) => {
          if (prev <= 1) {
            gameState.setWinner("white");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameState.winner,
    isInLobby,
    showLocalSetup,
    showAISetup,
    isTimed,
    gameState.currentPlayer,
  ]);

  // AI turn logic
  useEffect(() => {
    if (
      gameMode === "ai" &&
      gameState.currentPlayer === aiPlayer &&
      !gameState.winner &&
      !isInLobby
    ) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const bestMove = getBestMove(gameState.grid, aiPlayer, aiDifficulty);
        if (bestMove) {
          gameState.applyNewBlock(bestMove);
        }
        // Note: applyNewBlock already handles all win/draw conditions,
        // so we don't need to set winner here
        setIsAiThinking(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [
    gameMode,
    gameState.currentPlayer,
    aiPlayer,
    gameState.winner,
    isInLobby,
    gameState.grid,
    aiDifficulty,
  ]);

  // Show opponent stats
  useEffect(() => {
    if (gameMode === "online" && !isInLobby && !hasShownStatsRef.current) {
      const opponent = myPlayer === "white" ? "black" : "white";
      if (opponent === "white" && whiteStats) {
        setViewStatsPlayer("white");
        hasShownStatsRef.current = true;
      } else if (opponent === "black" && blackStats) {
        setViewStatsPlayer("black");
        hasShownStatsRef.current = true;
      }
    }
  }, [isInLobby, gameMode, myPlayer, whiteStats, blackStats]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(() => {
    setIsLeaderboardLoading(true);
    fetch(`${SERVER_URL}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        setIsLeaderboardLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch leaderboard:", error);
        setIsLeaderboardLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isInLobby || showLeaderboard) {
      fetchLeaderboard();
    }
  }, [isInLobby, showLeaderboard, fetchLeaderboard]);

  // Keyboard controls for rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (isInLobby || showLocalSetup || showAISetup) return;

      if (e.code === "Space" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        gameState.handleRotate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isInLobby, showLocalSetup, showAISetup]);

  // Right-click for rotation
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!isInLobby && !showLocalSetup && !showAISetup) {
        e.preventDefault();
        gameState.handleRotate();
      }
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, [gameState, isInLobby, showLocalSetup, showAISetup]);

  // Lobby management
  const openLobby = () => {
    if (!myName.trim()) {
      alert("Please enter your name first");
      return;
    }
    setShowLobby(true);
    setIsRoomsLoading(true);
    socket.connectSocket();
    socket.getRooms();
  };

  // Auto-refresh room list when lobby is open
  useEffect(() => {
    if (!showLobby) return;

    // Initial fetch
    socket.getRooms();

    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      socket.getRooms();
    }, 3000);

    return () => clearInterval(interval);
  }, [showLobby, socket]);

  const closeLobby = () => {
    setShowLobby(false);
    setRooms([]);

    // If we opened lobby without hosting/joining, disconnect the socket
    if (
      socket.connectionStatus === "connecting" ||
      (socket.connectionStatus === "idle" &&
        socket.socketRef.current?.connected)
    ) {
      socket.cancelHosting();
    }
  };

  const handleJoinFromLobby = (
    roomId: string,
    roomCode?: string,
    asSpectator?: boolean,
  ) => {
    closeLobby();
    setGameMode("online");
    socket.joinGame(roomId, roomCode, asSpectator);
  };

  // Menu handlers
  const handleStartLocal = () => {
    setShowLocalSetup(true);
  };

  const handleStartAI = () => {
    setShowAISetup(true);
  };

  const handlePublicOnline = () => {
    if (!myName.trim()) {
      alert("Please enter your name first");
      return;
    }
    setGameMode("online");
    socket.startHost(false, {
      isTimed,
      initialTime: initialTimeSetting,
      increment: incrementSetting,
    });
    setWhiteName(myName);
    setBlackName("Waiting...");
  };

  const handlePrivateOnline = () => {
    if (!myName.trim()) {
      alert("Please enter your name first");
      return;
    }
    setGameMode("online");
    socket.startHost(true, {
      isTimed,
      initialTime: initialTimeSetting,
      increment: incrementSetting,
    });
    setWhiteName(myName);
    setBlackName("Waiting...");
    setIsCreatingPrivate(true);
  };

  const handleQuit = () => {
    socket.cancelHosting();
    setIsInLobby(true);
    setWhiteScore(0);
    setBlackScore(0);
  };

  // Setup confirmations
  const handleLocalConfirm = () => {
    setGameMode("local");
    setWhiteName(localWhiteName);
    setBlackName(localBlackName);
    setShowLocalSetup(false);
    setIsInLobby(false);
    gameState.resetGame();
  };

  const handleAIConfirm = () => {
    setGameMode("ai");
    if (aiPlayer === "white") {
      setWhiteName("AI");
      setBlackName(myName);
      setMyPlayer("black");
    } else {
      setWhiteName(myName);
      setBlackName("AI");
      setMyPlayer("white");
    }
    setShowAISetup(false);
    setIsInLobby(false);
    gameState.resetGame();
  };

  const handleCustomEmojiUpload = (
    emoji: string,
    label: string,
    isImage: boolean,
  ) => {
    if (!socket.socketRef.current) {
      setUploadError(
        "You are not connected to the server. Please reconnect before uploading.",
      );
      return;
    }

    socket.socketRef.current.emit("upload_custom_emoji", {
      emoji,
      label,
      uploadedBy: myName,
      isImage,
    });
  };

  // Render lobby
  if (isInLobby) {
    return (
      <>
        <Tutorial
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
        />
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          entries={leaderboard}
          isLoading={isLeaderboardLoading}
        />
        <LobbyModal
          isOpen={showLobby}
          onClose={closeLobby}
          rooms={rooms}
          isLoading={isRoomsLoading}
          onJoinRoom={handleJoinFromLobby}
        />
        {showLocalSetup && (
          <LocalGameSetup
            localWhiteName={localWhiteName}
            setLocalWhiteName={setLocalWhiteName}
            localBlackName={localBlackName}
            setLocalBlackName={setLocalBlackName}
            isTimed={isTimed}
            setIsTimed={setIsTimed}
            initialTimeSetting={initialTimeSetting}
            setInitialTimeSetting={setInitialTimeSetting}
            incrementSetting={incrementSetting}
            setIncrementSetting={setIncrementSetting}
            onStart={handleLocalConfirm}
            onBack={() => setShowLocalSetup(false)}
            showTutorial={showTutorial}
            setShowTutorial={setShowTutorial}
          />
        )}
        {showAISetup && (
          <AIGameSetup
            myName={myName}
            setMyName={setMyName}
            aiPlayer={aiPlayer}
            setAIPlayer={setAIPlayer}
            aiDifficulty={aiDifficulty}
            setAIDifficulty={setAIDifficulty}
            isTimed={isTimed}
            setIsTimed={setIsTimed}
            initialTimeSetting={initialTimeSetting}
            setInitialTimeSetting={setInitialTimeSetting}
            incrementSetting={incrementSetting}
            setIncrementSetting={setIncrementSetting}
            onStart={handleAIConfirm}
            onBack={() => setShowAISetup(false)}
          />
        )}
        <MainMenu
          myName={myName}
          setMyName={setMyName}
          showTutorial={showTutorial}
          setShowTutorial={setShowTutorial}
          showLeaderboard={showLeaderboard}
          setShowLeaderboard={setShowLeaderboard}
          showLobby={showLobby}
          leaderboard={leaderboard}
          isLeaderboardLoading={isLeaderboardLoading}
          rooms={rooms}
          isRoomsLoading={isRoomsLoading}
          connectionStatus={socket.connectionStatus}
          errorMessage={socket.errorMessage}
          networkRole={socket.networkRole}
          isCreatingPrivate={isCreatingPrivate}
          hostRoomCode={socket.hostRoomCode}
          isTimed={isTimed}
          setIsTimed={setIsTimed}
          initialTimeSetting={initialTimeSetting}
          setInitialTimeSetting={setInitialTimeSetting}
          incrementSetting={incrementSetting}
          setIncrementSetting={setIncrementSetting}
          onShowAISetup={handleStartAI}
          onShowLocalSetup={handleStartLocal}
          onStartHost={(isPrivate) => {
            if (isPrivate) {
              handlePrivateOnline();
            } else {
              handlePublicOnline();
            }
          }}
          onOpenLobby={openLobby}
          onCloseLobby={closeLobby}
          onJoinFromLobby={handleJoinFromLobby}
          onCancelHosting={socket.cancelHosting}
          onCopyCode={() => {
            if (socket.hostRoomCode) {
              navigator.clipboard.writeText(socket.hostRoomCode);
              alert("Room code copied to clipboard!");
            }
          }}
          setGameMode={setGameMode}
        />
      </>
    );
  }

  // Render game
  return (
    <>
      <GameView
        blocks={gameState.blocks}
        currentPlayer={gameState.currentPlayer}
        winner={gameState.winner}
        winningCells={gameState.winningCells}
        whiteTime={gameState.whiteTime}
        blackTime={gameState.blackTime}
        whiteScore={whiteScore}
        blackScore={blackScore}
        whiteName={whiteName}
        blackName={blackName}
        whiteStats={whiteStats}
        blackStats={blackStats}
        isTimed={isTimed}
        gameMode={gameMode}
        myPlayer={myPlayer}
        aiPlayer={aiPlayer}
        aiDifficulty={aiDifficulty}
        canExplode={gameState.canExplode}
        isSpectator={socket.networkRole === "spectator"}
        ghost={gameState.getGhost()}
        onHover={(x) => gameState.setHoverX(x)}
        onClick={gameState.handlePlace}
        onRotate={gameState.handleRotate}
        onReset={gameState.resetGame}
        onQuit={handleQuit}
        rematchRequested={rematchRequested}
        opponentRematchRequested={opponentRematchRequested}
        onRequestRematch={() => {
          setRematchRequested(true);
          socket.requestRematch();
        }}
        isChatOpen={isChatOpen}
        setIsChatOpen={(open) => {
          setIsChatOpen(open);
          if (open) setUnreadCount(0);
        }}
        chatMessages={chatMessages}
        unreadCount={unreadCount}
        onSendMessage={socket.sendMessage}
        myName={myName}
        reactions={allReactions}
        onOpenEmojiUpload={() => setShowEmojiUpload(true)}
        activeReactions={activeReactions}
        onReactionComplete={(id) =>
          setActiveReactions((prev) => prev.filter((r) => r.id !== id))
        }
        showTutorial={showTutorial}
        setShowTutorial={setShowTutorial}
        viewStatsPlayer={viewStatsPlayer}
        setViewStatsPlayer={setViewStatsPlayer}
      />
      <CustomEmojiUpload
        isOpen={showEmojiUpload}
        onClose={() => {
          setShowEmojiUpload(false);
          setUploadError(null);
        }}
        onUpload={handleCustomEmojiUpload}
        serverError={uploadError}
      />
    </>
  );
}

export default App;
