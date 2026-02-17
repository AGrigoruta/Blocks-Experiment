import { AIDifficulty } from "../types";
import { TimeControlSelector } from "./TimeControlSelector";

interface AIGameSetupProps {
  aiDifficulty: AIDifficulty;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  aiPlayer: "white" | "black";
  setAIPlayer: (player: "white" | "black") => void;
  isTimed: boolean;
  setIsTimed: (v: boolean) => void;
  initialTimeSetting: number;
  setInitialTimeSetting: (v: number) => void;
  incrementSetting: number;
  setIncrementSetting: (v: number) => void;
  onBack: () => void;
  onStart: () => void;
}

export const AIGameSetup = ({
  aiDifficulty,
  setAIDifficulty,
  aiPlayer,
  setAIPlayer,
  isTimed,
  setIsTimed,
  initialTimeSetting,
  setInitialTimeSetting,
  incrementSetting,
  setIncrementSetting,
  onBack,
  onStart,
}: AIGameSetupProps) => {
  return (
    <div className="w-full h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Solo Challenge
        </h2>

        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">
                Difficulty
              </label>
              <div className="flex flex-col gap-1">
                {(["easy", "medium", "hard"] as AIDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setAIDifficulty(d)}
                    className={`py-2 text-[10px] font-bold rounded-lg border transition uppercase tracking-tighter ${
                      aiDifficulty === d
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-lg"
                        : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">
                Play As
              </label>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setAIPlayer("black")}
                  className={`py-2 text-[10px] rounded-lg border flex items-center justify-center gap-2 transition font-bold uppercase ${
                    aiPlayer === "black"
                      ? "bg-amber-600 border-amber-400 text-white shadow-lg"
                      : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setAIPlayer("white")}
                  className={`py-2 text-[10px] rounded-lg border flex items-center justify-center gap-2 transition font-bold uppercase ${
                    aiPlayer === "white"
                      ? "bg-neutral-600 border-neutral-400 text-white shadow-lg"
                      : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"
                  }`}
                >
                  Black
                </button>
              </div>
            </div>
          </div>

          <TimeControlSelector
            isTimed={isTimed}
            setIsTimed={setIsTimed}
            initialTime={initialTimeSetting}
            setInitialTime={setInitialTimeSetting}
            increment={incrementSetting}
            setIncrement={setIncrementSetting}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition"
          >
            Back
          </button>
          <button
            onClick={onStart}
            className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg"
          >
            Launch Match
          </button>
        </div>
      </div>
    </div>
  );
};
