import { Canvas } from "@react-three/fiber";
import { GameScene } from "./GameScene";
import { Chat, ChatMessage } from "./Chat";
import { Tutorial } from "./Tutorial";
import { LeaderboardModal } from "./LeaderboardModal";
import { LobbyModal } from "./LobbyModal";
import { PlayerCardModal } from "./PlayerCardModal";
import { ReactionOverlay } from "./ReactionOverlay";
import { formatTime } from "../utils/helpers";
import { INITIAL_CAMERA_POSITION, MAX_BLOCKS_PER_PLAYER } from "../constants";
import {
  BlockData,
  Player,
  GameMode,
  AIDifficulty,
  PlayerStats,
  LeaderboardEntry,
  RoomInfo,
} from "../types";

interface GameViewProps {
  // Game state
  blocks: BlockData[];
  currentPlayer: Player;
  winner: Player | "draw" | null;
  winningCells: { x: number; y: number }[] | null;
  whiteTime: number;
  blackTime: number;
  whiteScore: number;
  blackScore: number;
  whiteName: string;
  blackName: string;
  whiteStats: PlayerStats | null;
  blackStats: PlayerStats | null;
  isTimed: boolean;
  gameMode: GameMode;
  myPlayer: Player;
  aiPlayer: Player;
  aiDifficulty: AIDifficulty;
  canExplode: boolean;

  // Ghost/hover state
  ghost: {
    x: number;
    y: number;
    orientation: "horizontal" | "vertical";
    isValid: boolean;
  } | null;

  // Handlers
  onHover: (x: number | null) => void;
  onClick: () => void;
  onRotate: () => void;
  onReset: () => void;
  onQuit: () => void;

  // Online game state
  rematchRequested: boolean;
  opponentRematchRequested: boolean;
  onRequestRematch: () => void;

  // Chat
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  unreadCount: number;
  onSendMessage: (text: string) => void;
  myName: string;

  // Reactions
  currentReaction: { emoji: string; sender: string } | null;
  onReactionComplete: () => void;

  // Modals
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  viewStatsPlayer: Player | null;
  setViewStatsPlayer: (player: Player | null) => void;
}

export const GameView = ({
  blocks,
  currentPlayer,
  winner,
  winningCells,
  whiteTime,
  blackTime,
  whiteScore,
  blackScore,
  whiteName,
  blackName,
  whiteStats,
  blackStats,
  isTimed,
  gameMode,
  myPlayer,
  aiPlayer,
  aiDifficulty,
  canExplode,
  ghost,
  onHover,
  onClick,
  onRotate,
  onReset,
  onQuit,
  rematchRequested,
  opponentRematchRequested,
  onRequestRematch,
  isChatOpen,
  setIsChatOpen,
  chatMessages,
  unreadCount,
  onSendMessage,
  myName,
  currentReaction,
  onReactionComplete,
  showTutorial,
  setShowTutorial,
  viewStatsPlayer,
  setViewStatsPlayer,
}: GameViewProps) => {
  const isAiThinking =
    gameMode === "ai" && currentPlayer === aiPlayer && !winner;

  return (
    <div className="relative w-full h-[100dvh] bg-gray-900 font-sans select-none overflow-hidden touch-none">
      <Tutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {viewStatsPlayer && (
        <PlayerCardModal
          player={viewStatsPlayer}
          name={viewStatsPlayer === "white" ? whiteName : blackName}
          stats={viewStatsPlayer === "white" ? whiteStats! : blackStats!}
          onClose={() => setViewStatsPlayer(null)}
        />
      )}

      {/* Reaction Overlay */}
      {currentReaction && (
        <ReactionOverlay
          reaction={currentReaction.emoji}
          sender={currentReaction.sender}
          onComplete={onReactionComplete}
        />
      )}

      <Canvas
        shadows
        camera={{ position: INITIAL_CAMERA_POSITION, fov: 45 }}
        dpr={[1, 2]}
        className="touch-none"
      >
        <GameScene
          blocks={blocks}
          ghost={ghost}
          currentPlayer={currentPlayer}
          onHover={onHover}
          onClick={onClick}
          winningCells={winningCells}
          canExplode={canExplode}
        />
      </Canvas>

      {/* Top Bar - Player Info */}
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl text-white shadow-xl border border-white/10 flex items-center gap-6 md:gap-8 min-w-[300px] justify-between">
          {/* White Player Info */}
          <div
            className={`flex items-center gap-3 transition-opacity duration-300 relative group ${
              currentPlayer === "white" && !winner
                ? "opacity-100 scale-105"
                : "opacity-40"
            }`}
          >
            <div className="relative cursor-help">
              <div
                className={`w-4 h-4 rounded-full bg-amber-600 shadow-sm ${
                  currentPlayer === "white" && !winner
                    ? "ring-2 ring-white/50"
                    : ""
                }`}
              />
              {currentPlayer === "white" && !winner && (
                <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75"></div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  {whiteName}
                </span>
                {gameMode === "online" && whiteStats && (
                  <button
                    onClick={() => setViewStatsPlayer("white")}
                    className="pointer-events-auto text-gray-500 hover:text-white transition p-1 hover:bg-white/10 rounded"
                    title="View Stats"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                )}
                <span className="text-xs bg-gray-700 px-1.5 rounded text-white">
                  {whiteScore}
                </span>
              </div>
              <span
                className={`font-mono text-xl font-bold ${
                  whiteTime < 30 ? "text-red-400" : "text-white"
                }`}
              >
                {isTimed ? formatTime(whiteTime) : "∞"}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {blocks.filter((b) => b.player === "white").length}/
                {MAX_BLOCKS_PER_PLAYER} blocks
              </span>
              {(gameMode === "online" || gameMode === "ai") && (
                <span className="text-[10px] text-gray-500 uppercase">
                  {gameMode === "ai"
                    ? aiPlayer === "white"
                      ? "CPU"
                      : "YOU"
                    : myPlayer === "white"
                    ? "YOU"
                    : "OPP"}
                </span>
              )}
            </div>
          </div>

          <div className="text-white/20 font-bold text-sm flex flex-col items-center">
            <span>VS</span>
            {gameMode === "online" && (
              <span className="text-[10px] text-green-500 tracking-wider">
                LIVE
              </span>
            )}
            {gameMode === "ai" && (
              <span className="text-[10px] text-indigo-400 tracking-wider uppercase">
                {aiDifficulty}
              </span>
            )}
          </div>

          {/* Black Player Info */}
          <div
            className={`flex items-center gap-3 transition-opacity duration-300 relative group ${
              currentPlayer === "black" && !winner
                ? "opacity-100 scale-105"
                : "opacity-40"
            }`}
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-700 px-1.5 rounded text-white">
                  {blackScore}
                </span>
                {gameMode === "online" && blackStats && (
                  <button
                    onClick={() => setViewStatsPlayer("black")}
                    className="pointer-events-auto text-gray-500 hover:text-white transition p-1 hover:bg-white/10 rounded"
                    title="View Stats"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                )}
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  {blackName}
                </span>
              </div>
              <span
                className={`font-mono text-xl font-bold ${
                  blackTime < 30 ? "text-red-400" : "text-white"
                }`}
              >
                {isTimed ? formatTime(blackTime) : "∞"}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {blocks.filter((b) => b.player === "black").length}/
                {MAX_BLOCKS_PER_PLAYER} blocks
              </span>
              {(gameMode === "online" || gameMode === "ai") && (
                <span className="text-[10px] text-gray-500 uppercase">
                  {gameMode === "ai"
                    ? aiPlayer === "black"
                      ? "CPU"
                      : "YOU"
                    : myPlayer === "black"
                    ? "YOU"
                    : "OPP"}
                </span>
              )}
            </div>
            <div className="relative cursor-help">
              <div
                className={`w-4 h-4 rounded-full bg-neutral-800 border border-gray-500 shadow-sm ${
                  currentPlayer === "black" && !winner
                    ? "ring-2 ring-white/50"
                    : ""
                }`}
              />
              {currentPlayer === "black" && !winner && (
                <div className="absolute inset-0 bg-gray-600 rounded-full animate-ping opacity-75"></div>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={() => setShowTutorial(true)}
            className="w-10 h-10 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 text-blue-400 rounded-lg transition border border-gray-700 backdrop-blur-md"
            title="How to Play"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            onClick={onQuit}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition text-sm font-medium border border-red-500/20 backdrop-blur-md"
          >
            Quit
          </button>
          {(gameMode === "local" || gameMode === "ai") && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition text-sm font-medium border border-white/10 backdrop-blur-md"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 pointer-events-none z-20 animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-br from-green-500/90 to-emerald-600/90 backdrop-blur-md px-10 py-6 rounded-2xl shadow-2xl border-2 border-green-300/50 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-md whitespace-nowrap text-center">
              {winner === "draw"
                ? "GAME DRAWN"
                : `${
                    winner === "white"
                      ? whiteName.toUpperCase()
                      : blackName.toUpperCase()
                  } WINS!`}
            </h2>
            <div className="text-green-50 text-sm font-bold tracking-widest uppercase mt-2">
              {winner === "draw"
                ? "NO MOVES POSSIBLE"
                : isTimed && (whiteTime === 0 || blackTime === 0)
                ? "ON TIME"
                : "BY CONNECT FIVE"}
            </div>
            {(gameMode === "online" || gameMode === "ai") &&
              winner !== "draw" &&
              winner ===
                (gameMode === "ai"
                  ? aiPlayer === "white"
                    ? "black"
                    : "white"
                  : myPlayer) && (
                <div className="mt-2 text-xs bg-white/20 px-2 py-1 rounded text-white font-bold">
                  VICTORY
                </div>
              )}
            {canExplode && (
              <div className="mt-4 text-xs text-white/50 animate-pulse uppercase tracking-widest font-mono">
                Click board to explode
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Button */}
      {gameMode === "online" && !winner && (
        <div className="absolute bottom-32 right-4 pointer-events-auto z-50">
          {!isChatOpen && (
            <button
              onClick={() => {
                setIsChatOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Chat */}
      {gameMode === "online" && (
        <Chat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={onSendMessage}
          myName={myName}
        />
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none z-10 flex flex-col items-center gap-4 pb-[max(2rem,env(safe-area-inset-bottom))] md:pb-4">
        {!winner && (
          <div className="hidden md:block text-white/50 text-xs bg-black/40 px-3 py-1 rounded backdrop-blur-sm">
            {gameMode === "online" && currentPlayer !== myPlayer ? (
              <span className="text-yellow-400 animate-pulse">
                {currentPlayer === "white" ? whiteName : blackName} is
                thinking...
              </span>
            ) : isAiThinking ? (
              <span className="text-indigo-400 animate-pulse">
                AI is calculating...
              </span>
            ) : (
              <span>Rotate: Right Click / Space • Place: Left Click</span>
            )}
          </div>
        )}

        <div className="pointer-events-auto w-full max-w-lg flex items-center justify-between gap-4">
          {!winner ? (
            <>
              <button
                onClick={onRotate}
                disabled={
                  (gameMode === "online" && currentPlayer !== myPlayer) ||
                  isAiThinking
                }
                className={`flex-1 h-14 font-bold rounded-2xl shadow-lg backdrop-blur-sm border border-white/10 transition-transform active:scale-95 flex items-center justify-center gap-2
                  ${
                    (gameMode === "online" && currentPlayer !== myPlayer) ||
                    isAiThinking
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600/90 hover:bg-blue-500 active:bg-blue-400 text-white"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                ROTATE
              </button>

              <button
                onClick={onClick}
                disabled={
                  !ghost?.isValid ||
                  (gameMode === "online" && currentPlayer !== myPlayer) ||
                  isAiThinking
                }
                className={`flex-[2] h-14 font-bold rounded-2xl shadow-lg backdrop-blur-sm border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2
                  ${
                    ghost?.isValid &&
                    (gameMode !== "online" || currentPlayer === myPlayer) &&
                    !isAiThinking
                      ? "bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-400 text-white cursor-pointer"
                      : "bg-gray-700/50 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                PLACE BLOCK
              </button>
            </>
          ) : (
            <div className="w-full flex gap-3">
              {gameMode === "local" || gameMode === "ai" ? (
                <button
                  onClick={onReset}
                  className="w-full h-16 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xl font-bold rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  PLAY AGAIN
                </button>
              ) : (
                <>
                  <button
                    onClick={onQuit}
                    className="flex-1 h-16 bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-md text-white text-lg font-bold rounded-2xl shadow-xl transition-all border border-white/10"
                  >
                    EXIT
                  </button>
                  <button
                    onClick={onRequestRematch}
                    disabled={rematchRequested}
                    className={`flex-[2] h-16 text-white text-xl font-bold rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 ${
                      rematchRequested
                        ? "bg-amber-800/80 cursor-default"
                        : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600"
                    }`}
                  >
                    {rematchRequested ? (
                      <span>WAITING...</span>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        REMATCH
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
          {winner &&
            opponentRematchRequested &&
            !rematchRequested &&
            gameMode === "online" && (
              <div className="absolute -top-12 left-0 w-full text-center">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold animate-bounce text-sm">
                  Opponent wants a rematch!
                </span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
