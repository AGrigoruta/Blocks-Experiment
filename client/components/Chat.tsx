import React, { useState, useEffect, useRef } from "react";
import { REACTION_LABELS } from "../constants";
import { isImageEmoji } from "../utils/emojiUtils";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myName: string;
  reactions: string[];
  onOpenEmojiUpload: () => void;
}

export const Chat: React.FC<ChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  myName,
  reactions,
  onOpenEmojiUpload,
}) => {
  const [inputText, setInputText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText("");
    }
  };

  const handleReactionClick = (reaction: string) => {
    onSendMessage(reaction);
    setShowReactions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto absolute bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] h-80 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-2xl">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-blue-400"
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
          Game Chat
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition p-1 hover:bg-gray-700 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-xs italic mt-4">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          const isReaction = reactions.includes(msg.text);
          const isImageReaction = isReaction && isImageEmoji(msg.text);
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`${isReaction ? (isImageReaction ? "" : "text-4xl") : "max-w-[85%] px-3 py-2 rounded-xl text-sm break-words shadow-sm"} ${
                  isReaction ? "" : isMe
                    ? "bg-blue-600/90 text-white rounded-tr-none"
                    : "bg-gray-700/80 text-gray-200 rounded-tl-none"
                }`}
              >
                {isImageReaction ? (
                  <img src={msg.text} alt="Custom emoji reaction" className="w-12 h-12 object-contain" />
                ) : (
                  msg.text
                )}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1 opacity-70">
                {isMe ? "You" : msg.sender}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-700 bg-gray-800/30 rounded-b-2xl"
      >
        {/* Reaction Picker */}
        {showReactions && (
          <div className="p-2 bg-gray-900/50 border-b border-gray-700">
            <div className="flex gap-2 justify-center flex-wrap mb-2">
              {reactions.map((reaction) => {
                const isImage = isImageEmoji(reaction);
                return (
                  <button
                    key={reaction}
                    type="button"
                    onClick={() => handleReactionClick(reaction)}
                    className={`${isImage ? "w-10 h-10" : "text-2xl"} hover:scale-125 transition-transform p-1 hover:bg-gray-700/50 rounded flex items-center justify-center`}
                    aria-label={`Send ${REACTION_LABELS[reaction] || "emoji"} reaction`}
                  >
                    {isImage ? (
                      <img src={reaction} alt="Custom emoji" className="w-full h-full object-contain" />
                    ) : (
                      reaction
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onOpenEmojiUpload}
              className="w-full text-blue-400 hover:text-blue-300 text-xs font-medium py-1.5 hover:bg-gray-700/50 rounded transition"
            >
              + Add Custom Emoji
            </button>
          </div>
        )}
        <div className="p-3 flex gap-2">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className="bg-gray-900/50 hover:bg-gray-700 text-white p-2 rounded-lg transition"
            title="Reactions"
            aria-label="Open reaction picker"
          >
            <span className="text-xl">😊</span>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type..."
            className="flex-1 bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputText.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
