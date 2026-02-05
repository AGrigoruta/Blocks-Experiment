import { PlayerStats } from "../types";

interface BothPlayersStatsModalProps {
  whiteName: string;
  blackName: string;
  whiteStats: PlayerStats;
  blackStats: PlayerStats;
  onClose: () => void;
}

export const BothPlayersStatsModal = ({
  whiteName,
  blackName,
  whiteStats,
  blackStats,
  onClose,
}: BothPlayersStatsModalProps) => {
  const whiteWinRate =
    whiteStats.totalMatches > 0
      ? Math.round((whiteStats.wins / whiteStats.totalMatches) * 100)
      : 0;
  const blackWinRate =
    blackStats.totalMatches > 0
      ? Math.round((blackStats.wins / blackStats.totalMatches) * 100)
      : 0;

  const whiteAvgBlocks = Math.round(whiteStats.avgBlocks * 10) / 10;
  const blackAvgBlocks = Math.round(blackStats.avgBlocks * 10) / 10;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-gray-900 border-2 border-purple-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-white transition z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span className="text-purple-400">👥</span> Player Statistics
          </h2>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
            Match Overview
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          {/* White Player */}
          <div className="w-full md:flex-1 bg-gray-800/30 rounded-xl p-4 sm:p-6 border-2 border-amber-500/30">
            <div className="flex flex-col items-center mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-600 flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg mb-2 sm:mb-3 text-white ring-4 ring-black">
                {whiteName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-400">
                {whiteName}
              </h3>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                White Player
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span className="text-lg sm:text-xl font-mono font-bold text-white">
                  {whiteStats.totalMatches}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  Matches
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span
                  className={`text-lg sm:text-xl font-mono font-bold ${
                    whiteWinRate >= 50 ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {whiteWinRate}%
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  Win Rate
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {whiteStats.wins} - {whiteStats.losses}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  W - L
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {whiteAvgBlocks}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  Avg Blocks
                </span>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center shrink-0">
            <div className="text-2xl sm:text-3xl font-bold text-gray-600 uppercase tracking-wider px-4">
              VS
            </div>
          </div>

          {/* Black Player */}
          <div className="w-full md:flex-1 bg-gray-800/30 rounded-xl p-4 sm:p-6 border-2 border-gray-500/30">
            <div className="flex flex-col items-center mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg mb-2 sm:mb-3 text-white ring-4 ring-black">
                {blackName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-300">
                {blackName}
              </h3>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                Black Player
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span className="text-lg sm:text-xl font-mono font-bold text-white">
                  {blackStats.totalMatches}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  Matches
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span
                  className={`text-lg sm:text-xl font-mono font-bold ${
                    blackWinRate >= 50 ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {blackWinRate}%
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  Win Rate
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {blackStats.wins} - {blackStats.losses}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  W - L
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border border-gray-700">
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {blackAvgBlocks}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">
                  Avg Blocks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
