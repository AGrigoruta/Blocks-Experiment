import { Player, PlayerStats } from "../types";

interface PlayerCardModalProps {
  player: Player;
  name: string;
  stats: PlayerStats;
  onClose: () => void;
}

export const PlayerCardModal = ({
  player,
  name,
  stats,
  onClose,
}: PlayerCardModalProps) => {
  const winRate =
    stats.totalMatches > 0
      ? Math.round((stats.wins / stats.totalMatches) * 100)
      : 0;
  const avgTime = Math.round(stats.avgMatchTime / 60);
  const avgBlocks = Math.round(stats.avgBlocks * 10) / 10;

  const borderColor =
    player === "white" ? "border-amber-500/50" : "border-gray-500/50";
  const textColor = player === "white" ? "text-amber-400" : "text-gray-300";
  const avatarColor = player === "white" ? "bg-amber-600" : "bg-gray-700";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm bg-gray-900 border-2 ${borderColor} rounded-2xl p-8 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex flex-col items-center mb-8">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg mb-4 ${avatarColor} text-white ring-4 ring-black`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <h2 className={`text-2xl font-bold ${textColor}`}>{name}</h2>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
            Player Statistics
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-700">
            <span className="text-2xl font-mono font-bold text-white">
              {stats.totalMatches}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
              Matches
            </span>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-700">
            <span
              className={`text-2xl font-mono font-bold ${
                winRate >= 50 ? "text-green-400" : "text-orange-400"
              }`}
            >
              {winRate}%
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
              Win Rate
            </span>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-700">
            <span className="text-xl font-mono font-bold text-white">
              {stats.wins} - {stats.losses}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
              W - L
            </span>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-700">
            <span className="text-xl font-mono font-bold text-white">
              {avgBlocks}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
              Avg Blocks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
