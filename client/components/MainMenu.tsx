import { LeaderboardEntry, RoomInfo } from "../types";
import { Tutorial } from "./Tutorial";
import { LeaderboardModal } from "./LeaderboardModal";
import { LobbyModal } from "./LobbyModal";
import { TimeControlSelector } from "./TimeControlSelector";

interface MainMenuProps {
  myName: string;
  setMyName: (name: string) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  showLobby: boolean;
  leaderboard: LeaderboardEntry[];
  isLeaderboardLoading: boolean;
  rooms: RoomInfo[];
  isRoomsLoading: boolean;
  connectionStatus: "idle" | "connecting" | "waiting" | "connected" | "error";
  errorMessage: string | null;
  networkRole: "host" | "client" | null;
  isCreatingPrivate: boolean;
  hostRoomCode: string | null;
  isTimed: boolean;
  setIsTimed: (v: boolean) => void;
  initialTimeSetting: number;
  setInitialTimeSetting: (v: number) => void;
  incrementSetting: number;
  setIncrementSetting: (v: number) => void;
  onShowAISetup: () => void;
  onShowLocalSetup: () => void;
  onStartHost: (isPrivate: boolean) => void;
  onOpenLobby: () => void;
  onCloseLobby: () => void;
  onJoinFromLobby: (roomId: string, roomCode?: string) => void;
  onCancelHosting: () => void;
  onCopyCode: () => void;
  setGameMode: (mode: "local" | "online" | "ai") => void;
}

export const MainMenu = ({
  myName,
  setMyName,
  showTutorial,
  setShowTutorial,
  showLeaderboard,
  setShowLeaderboard,
  showLobby,
  leaderboard,
  isLeaderboardLoading,
  rooms,
  isRoomsLoading,
  connectionStatus,
  errorMessage,
  networkRole,
  isCreatingPrivate,
  hostRoomCode,
  isTimed,
  setIsTimed,
  initialTimeSetting,
  setInitialTimeSetting,
  incrementSetting,
  setIncrementSetting,
  onShowAISetup,
  onShowLocalSetup,
  onStartHost,
  onOpenLobby,
  onCloseLobby,
  onJoinFromLobby,
  onCancelHosting,
  onCopyCode,
  setGameMode,
}: MainMenuProps) => {
  return (
    <div className="w-full h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
      <Tutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        entries={leaderboard}
        isLoading={isLeaderboardLoading}
      />

      <LobbyModal
        isOpen={showLobby}
        onClose={onCloseLobby}
        rooms={rooms}
        onJoinRoom={onJoinFromLobby}
        isLoading={isRoomsLoading}
      />

      {/* Main Menu */}
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>

        <h1 className="text-4xl font-black text-white text-center mb-1 tracking-tight">
          BLOCKS 3D
        </h1>
        <p className="text-gray-500 text-center mb-8 uppercase text-[10px] tracking-[0.3em] font-black">
          Structural Strategy
        </p>

        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={() => setShowTutorial(true)}
            className="text-gray-400 text-xs hover:text-blue-400 font-black flex items-center gap-1.5 transition-all uppercase tracking-widest"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            Guide
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="text-gray-400 text-xs hover:text-yellow-400 font-black flex items-center gap-1.5 transition-all uppercase tracking-widest"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Hall of Fame
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onShowAISetup}
              className="py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-lg flex flex-col items-center justify-center gap-2 group"
            >
              <div className="p-2 bg-indigo-700/50 rounded-lg group-hover:scale-110 transition-transform">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest">
                Solo AI
              </span>
            </button>

            <button
              onClick={onShowLocalSetup}
              className="py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl transition shadow-lg flex flex-col items-center justify-center gap-2 group"
            >
              <div className="p-2 bg-amber-700/50 rounded-lg group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest">
                Local VS
              </span>
            </button>
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-700/50"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black">
              Online Arena
            </span>
            <div className="flex-grow border-t border-gray-700/50"></div>
          </div>

          <div className="mb-2">
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 text-center font-bold"
              placeholder="YOUR NAME"
              maxLength={12}
            />
          </div>

          {connectionStatus === "error" && (
            <div className="bg-red-500/20 text-red-300 text-[10px] p-3 rounded-xl border border-red-500/30 mb-2 uppercase font-bold text-center">
              {errorMessage || "Connection Error"}
            </div>
          )}

          {connectionStatus === "idle" || connectionStatus === "error" ? (
            <div className="space-y-4">
              <TimeControlSelector
                isTimed={isTimed}
                setIsTimed={setIsTimed}
                initialTime={initialTimeSetting}
                setInitialTime={setInitialTimeSetting}
                increment={incrementSetting}
                setIncrement={setIncrementSetting}
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setGameMode("online");
                    onStartHost(false);
                  }}
                  className="py-4 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-2xl transition shadow-xl flex flex-col items-center justify-center gap-2 border border-blue-400/20 group"
                >
                  <span className="bg-blue-400/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </span>
                  <span className="text-xs uppercase tracking-widest">
                    Public Game
                  </span>
                </button>

                <button
                  onClick={() => {
                    setGameMode("online");
                    onStartHost(true);
                  }}
                  className="py-4 bg-amber-700 hover:bg-amber-600 text-white font-black rounded-2xl transition shadow-xl flex flex-col items-center justify-center gap-2 border border-amber-400/20 group"
                >
                  <span className="bg-amber-400/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>
                  <span className="text-xs uppercase tracking-widest">
                    Private Game
                  </span>
                </button>
              </div>

              <button
                onClick={onOpenLobby}
                className="w-full py-4 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-3 border border-purple-400/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                VIEW LOBBY
              </button>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-900/80 rounded-2xl border border-blue-500/30 animate-in fade-in zoom-in duration-500 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
              {networkRole === "host" ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                      {isCreatingPrivate && (
                        <span className="text-amber-400">🔒</span>
                      )}
                      {isCreatingPrivate ? "Private Game" : "Public Game"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Awaiting structural opponent...
                    </p>
                  </div>
                  {isCreatingPrivate && hostRoomCode ? (
                    <>
                      <div className="text-5xl text-white font-mono font-black tracking-[0.3em] bg-gray-950/80 py-4 rounded-2xl mx-6 border border-gray-800 shadow-inner">
                        {hostRoomCode}
                      </div>
                      <div className="text-xs text-gray-500 bg-amber-600/10 py-2 px-4 rounded-lg border border-amber-600/20 mx-6">
                        Share this code with your opponent
                      </div>
                    </>
                  ) : (
                    <div className="py-8 mx-6">
                      <div className="text-6xl mb-4 opacity-50">🌐</div>
                      <p className="text-blue-400 text-lg font-bold">
                        Visible in Lobby
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        Anyone can join your game
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-4">
                    {isCreatingPrivate && hostRoomCode && (
                      <button
                        onClick={onCopyCode}
                        className="text-amber-500 bg-amber-500/10 border-amber-500/20 text-[10px] uppercase font-black hover:text-opacity-80 transition tracking-widest px-4 py-2 rounded-full border"
                      >
                        Copy Code
                      </button>
                    )}
                    <button
                      onClick={onCancelHosting}
                      className="text-red-500 text-[10px] uppercase font-black hover:text-red-400 transition tracking-widest"
                    >
                      Cancel Match
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="text-white font-black uppercase tracking-widest text-sm">
                    Synchronizing...
                  </div>
                  <button
                    onClick={onCancelHosting}
                    className="text-red-500 text-[10px] uppercase font-black hover:text-red-400 transition tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
