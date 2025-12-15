export type Player = 'white' | 'black';

export type Orientation = 'horizontal' | 'vertical';

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
  part: 'origin' | 'extension'; 
}

export type GridState = (CellData | null)[][]; // 9x9 grid

export interface GameState {
  grid: GridState;
  blocks: BlockData[];
  currentPlayer: Player;
  winner: Player | null;
  history: BlockData[]; // For undo potential (not implemented yet but good structure)
}

// --- Network Types ---

export type GameMode = 'local' | 'online';
export type NetworkRole = 'host' | 'client' | null;

export type NetworkMessage = 
  | { type: 'SYNC_STATE'; grid: GridState; blocks: BlockData[]; currentPlayer: Player; whiteTime: number; blackTime: number }
  | { type: 'MOVE'; block: BlockData; nextPlayer: Player; whiteTime: number; blackTime: number }
  | { type: 'RESET' }
  | { type: 'OPPONENT_RESIGNED' };
