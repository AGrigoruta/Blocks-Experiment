import { useState } from "react";
import { TIME_PRESETS } from "../constants";

interface TimeControlSelectorProps {
  isTimed: boolean;
  setIsTimed: (v: boolean) => void;
  initialTime: number;
  setInitialTime: (v: number) => void;
  increment: number;
  setIncrement: (v: number) => void;
}

export const TimeControlSelector = ({
  isTimed,
  setIsTimed,
  initialTime,
  setInitialTime,
  increment,
  setIncrement,
}: TimeControlSelectorProps) => {
  const [customMinutes, setCustomMinutes] = useState(
    Math.floor(initialTime / 60)
  );
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-4 bg-gray-900/40 p-4 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <label className="text-gray-400 text-xs uppercase tracking-widest font-bold">
          Time Control
        </label>
        <button
          onClick={() => setIsTimed(!isTimed)}
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${
            isTimed ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
          }`}
        >
          {isTimed ? "Enabled" : "Unlimited"}
        </button>
      </div>

      {isTimed && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-4 gap-2">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setInitialTime(p.value);
                  setCustomMinutes(Math.floor(p.value / 60));
                  setShowCustom(false);
                }}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  initialTime === p.value && !showCustom
                    ? "bg-blue-600 border-blue-400 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              className={`py-2 text-xs font-bold rounded-lg border transition ${
                showCustom
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Custom
            </button>
          </div>

          {showCustom && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setCustomMinutes(val);
                    setInitialTime(val * 60);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">
                  Bonus Time per Move (s)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={increment}
                  onChange={(e) =>
                    setIncrement(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
