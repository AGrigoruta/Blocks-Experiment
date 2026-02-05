import React, { useEffect, useState } from "react";
import { isImageEmoji } from "../utils/emojiUtils";

interface Reaction {
  id: string;
  emoji: string;
  sender: string;
}

interface ReactionOverlayProps {
  reactions: Reaction[];
  onComplete: (id: string) => void;
}

const ReactionItem: React.FC<{
  reaction: Reaction;
  index: number;
  onComplete: () => void;
}> = ({ reaction, index, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade in immediately
    setIsVisible(true);

    // Start fade out after 700ms (to complete in 1 second total)
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2700);

    // Complete and remove after fade out animation (300ms)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div
      className="transition-all duration-300"
      style={{
        opacity: isVisible ? 0.7 : 0,
        transform: `translateY(${index * 80}px) translateX(${isVisible ? 0 : 32}px)`,
      }}
      role="status"
      aria-live="polite"
      aria-label={`${reaction.sender} sent reaction ${reaction.emoji}`}
    >
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-white/10">
        <div className="animate-in zoom-in-50 fade-in duration-200 w-12 h-12 flex items-center justify-center">
          {isImageEmoji(reaction.emoji) ? (
            <img
              src={reaction.emoji}
              alt="Custom emoji reaction"
              className="w-full h-full object-contain"
            />
          ) : (
            <span style={{ fontSize: "48px" }}>{reaction.emoji}</span>
          )}
        </div>
        <div className="text-white text-sm font-semibold max-w-[100px] truncate">
          {reaction.sender}
        </div>
      </div>
    </div>
  );
};

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({
  reactions,
  onComplete,
}) => {
  if (reactions.length === 0) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 pointer-events-none z-30">
      {reactions.map((reaction, index) => (
        <ReactionItem
          key={reaction.id}
          reaction={reaction}
          index={index}
          onComplete={() => onComplete(reaction.id)}
        />
      ))}
    </div>
  );
};
