export const GRID_SIZE = 9;
export const WIN_LENGTH = 5;

// Visual scaling
export const CUBE_SIZE = 1;
export const BOARD_OFFSET = (GRID_SIZE * CUBE_SIZE) / 2 - (CUBE_SIZE / 2);

export const COLORS = {
  white: '#e3cba8', // Light wood
  black: '#2d2d2d', // Dark wood
  whiteGhost: '#e3cba880',
  blackGhost: '#2d2d2d80',
  highlight: '#4ade80', // Green for valid move
  error: '#ef4444',     // Red for invalid
  background: '#1f2937'
};

export const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 12, 16];

// Timer Settings
export const INITIAL_TIME_SECONDS = 300; // 5 minutes
export const INCREMENT_SECONDS = 5;      // 5 seconds added per turn