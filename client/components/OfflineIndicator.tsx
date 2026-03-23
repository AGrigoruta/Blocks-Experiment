import React, { useState, useEffect } from "react";

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      // Keep banner visible briefly to confirm reconnection
      setTimeout(() => setShowBanner(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
      style={{
        backgroundColor: isOffline ? "#ef4444" : "#4ade80",
        color: isOffline ? "#fff" : "#1a1a1a",
      }}
    >
      <span>{isOffline ? "⚠️" : "✅"}</span>
      <span>
        {isOffline
          ? "You are offline — single player mode available"
          : "Back online"}
      </span>
    </div>
  );
};
