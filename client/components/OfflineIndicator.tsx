import React, { useState, useEffect, useRef } from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOffline = useOfflineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On initial render, only show if offline; skip the "Back online" flash on page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOffline) return;
      // Starting offline: show banner immediately and keep it visible
      setShowBanner(true);
      return;
    }

    if (isOffline) {
      // Going offline: show banner persistently until back online
      setShowBanner(true);
    } else {
      // Coming back online: show banner briefly then hide
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

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
