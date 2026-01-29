import React, { useEffect, useState } from "react";

interface ReactionOverlayProps {
  reaction: string | null;
  sender: string;
  onComplete: () => void;
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({
  reaction,
  sender,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reaction) {
      setIsVisible(true);
      let completeTimer: number | undefined;
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
        completeTimer = setTimeout(onComplete, 300) as unknown as number;
      }, 2000);
      return () => {
        clearTimeout(fadeOutTimer);
        if (completeTimer) clearTimeout(completeTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction]); // Only re-run when reaction changes, not when onComplete changes

  if (!reaction) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-30 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`${sender} sent reaction ${reaction}`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-50 fade-in duration-300">
        <div className="text-[120px] md:text-[180px] drop-shadow-2xl animate-bounce">
          {reaction}
        </div>
        <div className="text-white text-lg md:text-xl font-bold bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full mt-4">
          {sender}
        </div>
      </div>
    </div>
  );
};
