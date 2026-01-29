import React, { useState } from "react";

interface CustomEmojiUploadProps {
  onUpload: (emoji: string, label: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomEmojiUpload: React.FC<CustomEmojiUploadProps> = ({
  onUpload,
  isOpen,
  onClose,
}) => {
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!emoji.trim()) {
      setError("Please enter an emoji");
      return;
    }
    
    if (!label.trim()) {
      setError("Please enter a label");
      return;
    }
    
    // Check if it's a valid emoji (basic check)
    const emojiRegex = /[\p{Emoji}]/u;
    if (!emojiRegex.test(emoji)) {
      setError("Please enter a valid emoji");
      return;
    }
    
    onUpload(emoji.trim(), label.trim());
    setEmoji("");
    setLabel("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Add Custom Emoji</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 hover:bg-gray-700 rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Add a custom emoji that will be available to all players for reactions!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="emoji" className="block text-white text-sm font-medium mb-2">
              Emoji
            </label>
            <input
              id="emoji"
              type="text"
              value={emoji}
              onChange={(e) => {
                setEmoji(e.target.value);
                setError("");
              }}
              placeholder="😊 (paste an emoji)"
              className="w-full bg-gray-800 border border-gray-600 text-white text-2xl text-center rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              maxLength={10}
            />
          </div>

          <div>
            <label htmlFor="label" className="block text-white text-sm font-medium mb-2">
              Label
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError("");
              }}
              placeholder="e.g., happy, excited"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-600"
              maxLength={50}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2.5 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2.5 transition font-medium"
            >
              Add Emoji
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
