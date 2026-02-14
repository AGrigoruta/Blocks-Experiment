export type Player = "white" | "black";

export type Orientation = "horizontal" | "vertical";

export interface BlockData {
  id: string;
  x: number;
  y: number;
  orientation: Orientation;
  player: Player;
}

// The grid stores which player occupies a specific 1x1 cell
// We also store the orientation of the block that occupies this cell
// to enforce the "short side" constraint.
export interface CellData {
  player: Player;
  orientation: Orientation;
  // A unique ID to identify if two cells belong to the same block
  blockId: string;
  // Helps identify which part of the block this is (e.g. for horizontal: 'left' | 'right', vertical: 'bottom' | 'top')
  part: "origin" | "extension";
}

// Changed from 2D array to Map to support infinite/dynamic grid
// Key format: "x,y"
export type GridState = Map<string, CellData>;

export interface GameState {
  grid: GridState;
  blocks: BlockData[];
  currentPlayer: Player;
  winner: Player | null;
  history: BlockData[]; // For undo potential (not implemented yet but good structure)
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  avgMatchTime: number;
  avgBlocks: number;
}

export interface LeaderboardEntry {
  playername: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface RoomInfo {
  roomId: string;
  hostName: string;
  isPrivate: boolean;
  playerCount: number;
  maxPlayers: number;
  timeSettings: {
    isTimed: boolean;
    initialTime: number;
    increment: number;
  };
}

export interface TimeSettings {
  isTimed: boolean;
  initialTime: number;
  increment: number;
}

export interface CustomEmoji {
  id: number;
  emoji: string;
  label: string;
  uploadedBy: string;
  isImage?: boolean;
  createdAt: string;
}

// --- Authentication Types ---

export interface User {
  id: number;
  displayName: string;
  discriminator: string;
  email?: string;
  avatarUrl?: string;
  isGuest: boolean;
  provider: 'google' | 'github' | 'guest';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export type AuthProvider = 'google' | 'github' | 'guest';

// --- Network Types ---

export type GameMode = "local" | "online" | "ai";
export type AIDifficulty = "easy" | "medium" | "hard";
export type NetworkRole = "host" | "client" | null;

// SYNC_STATE only sends blocks now; clients reconstruct the grid.
export type NetworkMessage =
  | {
      type: "SYNC_STATE";
      blocks: BlockData[];
      currentPlayer: Player;
      whiteTime: number;
      blackTime: number;
    }
  | {
      type: "MOVE";
      block: BlockData;
      nextPlayer: Player;
      whiteTime: number;
      blackTime: number;
      isDraw?: boolean;
    }
  | { type: "RESET" }
  | { type: "OPPONENT_RESIGNED" };
