import { TimeControlSelector } from "./TimeControlSelector";

interface LocalGameSetupProps {
  localWhiteName: string;
  setLocalWhiteName: (name: string) => void;
  localBlackName: string;
  setLocalBlackName: (name: string) => void;
  isTimed: boolean;
  setIsTimed: (v: boolean) => void;
  initialTimeSetting: number;
  setInitialTimeSetting: (v: number) => void;
  incrementSetting: number;
  setIncrementSetting: (v: number) => void;
  onBack: () => void;
  onStart: () => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
}

export const LocalGameSetup = ({
  localWhiteName,
  setLocalWhiteName,
  localBlackName,
  setLocalBlackName,
  isTimed,
  setIsTimed,
  initialTimeSetting,
  setInitialTimeSetting,
  incrementSetting,
  setIncrementSetting,
  onBack,
  onStart,
}: LocalGameSetupProps) => {
  return (
    <div className="w-full h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Local Game Setup
        </h2>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
                White (1st)
              </label>
              <input
                type="text"
                value={localWhiteName}
                onChange={(e) => setLocalWhiteName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Player 1"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
                Black (2nd)
              </label>
              <input
                type="text"
                value={localBlackName}
                onChange={(e) => setLocalBlackName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Player 2"
              />
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
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};
