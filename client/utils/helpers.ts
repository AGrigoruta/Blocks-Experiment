export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatTime = (seconds: number) => {
  if (seconds >= 999999) return "∞";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};
