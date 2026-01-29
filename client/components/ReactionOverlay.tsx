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
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Wait for fade-out animation
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [reaction, onComplete]);

  if (!reaction) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-30 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
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
