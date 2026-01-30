import React, { useState, useEffect } from "react";

interface CustomEmojiUploadProps {
  onUpload: (emoji: string, label: string, isImage: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  serverError?: string | null;
}

export const CustomEmojiUpload: React.FC<CustomEmojiUploadProps> = ({
  onUpload,
  isOpen,
  onClose,
  serverError,
}) => {
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [uploadType, setUploadType] = useState<"emoji" | "image">("image");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Update error when server error changes
  useEffect(() => {
    if (serverError) {
      setError(serverError);
    }
  }, [serverError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow safe image formats (no SVG for security)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (PNG, JPEG, GIF, or WebP only)");
      return;
    }

    // Validate file size (1.5MB to account for base64 encoding overhead)
    if (file.size > 1.5 * 1024 * 1024) {
      setError("Image is too large (max 1.5MB to account for encoding)");
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEmoji(dataUrl);
      setImagePreview(dataUrl);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!emoji.trim()) {
      setError(uploadType === "image" ? "Please select an image" : "Please enter an emoji");
      return;
    }
    
    if (!label.trim()) {
      setError("Please enter a label");
      return;
    }
    
    if (uploadType === "emoji") {
      // Trim the emoji to handle whitespace
      const trimmedEmoji = emoji.trim();
      
      // Check if it's a valid emoji (basic check)
      const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Presentation}]+$/u;
      if (!emojiRegex.test(trimmedEmoji)) {
        setError("Please enter a valid emoji (no text)");
        return;
      }
      
      // Limit emoji to max 5 codepoints for reasonable length
      const codepointCount = [...trimmedEmoji].length;
      if (codepointCount > 5) {
        setError("Please use a single emoji or short emoji sequence (max 5 characters)");
        return;
      }
      
      onUpload(trimmedEmoji, label.trim(), false);
    } else {
      // Upload image
      onUpload(emoji, label.trim(), true);
    }
    // Don't close modal or clear form here - wait for server response
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Reset form when modal closes successfully
  useEffect(() => {
    if (!isOpen) {
      setEmoji("");
      setLabel("");
      setError("");
      setImagePreview(null);
      setUploadType("image");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Add Custom Emoji</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 hover:bg-gray-700 rounded-full"
            aria-label="Close modal"
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
          {/* Upload Type Selection */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setUploadType("image");
                setEmoji("");
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                uploadType === "image"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadType("emoji");
                setEmoji("");
                setImagePreview(null);
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                uploadType === "emoji"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Emoji Unicode
            </button>
          </div>

          {uploadType === "image" ? (
            <div>
              <label htmlFor="image" className="block text-white text-sm font-medium mb-2">
                Image
              </label>
              <div className="flex flex-col items-center gap-3">
                {imagePreview && (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-800 rounded-lg border-2 border-gray-600">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <input
                  id="image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
                />
              </div>
            </div>
          ) : (
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
          )}

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
