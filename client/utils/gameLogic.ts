import { GridState, BlockData, Orientation, Player, CellData } from "../types";
import { GRID_SIZE, WIN_LENGTH } from "../constants";

export const createEmptyGrid = (): GridState => {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
};

/**
 * Calculates the landing Y position for a block given X and orientation.
 * Returns -1 if the column is full or invalid.
 */
export const findDropPosition = (
  grid: GridState,
  x: number,
  orientation: Orientation
): number => {
  if (x < 0 || x >= GRID_SIZE) return -1;

  if (orientation === "vertical") {
    // Needs 1 column width.
    // Find highest occupied cell in column x.
    let y = 0;
    while (y < GRID_SIZE && grid[x][y] !== null) {
      y++;
    }
    // Vertical block takes y and y+1. Ensure y+1 is within bounds.
    if (y + 1 < GRID_SIZE) {
      return y;
    }
  } else {
    // Horizontal: Needs column x and x+1.
    if (x + 1 >= GRID_SIZE) return -1;

    // Find highest occupied cell in both columns.
    let y1 = 0;
    while (y1 < GRID_SIZE && grid[x][y1] !== null) {
      y1++;
    }
    let y2 = 0;
    while (y2 < GRID_SIZE && grid[x + 1][y2] !== null) {
      y2++;
    }

    // The block must rest on the higher stack to be "flat".
    // Wait, gravity physics: It stops when ANY part hits something.
    // So the Y is the maximum of the two available floor heights.
    const targetY = Math.max(y1, y2);

    // However, we cannot have "floating" parts.
    // In real wooden blocks, if you place a block on uneven heights, it tilts.
    // In this game (Kwinty/Turris), you usually cannot bridge a gap if one side has no support at the same level.
    // But strict digital implementation usually simplifies:
    // Option A: Strictly needs support under BOTH halves (y1 === y2).
    // Option B: Needs support under AT LEAST ONE half (standard Tetris-like drop).
    // Looking at the "X" rule in the manual image (middle X), it implies you cannot bridge a gap?
    // Actually, typically in these abstract implementations, we assume "stable placement".
    // Let's enforce: MUST have support under both OR be on ground (y=0).
    // This means y1 must equal y2.

    if (targetY < GRID_SIZE && y1 === y2) {
      return targetY;
    }
  }

  return -1;
};

/**
 * Checks if a block is connected to any existing block on the board.
 * Returns true if connected, false otherwise.
 */
const isConnectedToExisting = (
  grid: GridState,
  x: number,
  y: number,
  orientation: Orientation
): boolean => {
  // Check all 4 adjacent positions for each cell the block occupies
  const checkPositions: Array<[number, number]> = [];

  if (orientation === "vertical") {
    // Block occupies (x, y) and (x, y+1)
    // Check all adjacent cells (left, right, top, bottom)
    checkPositions.push(
      [x - 1, y], // Left of bottom cell
      [x + 1, y], // Right of bottom cell
      [x, y - 1], // Below bottom cell
      [x - 1, y + 1], // Left of top cell
      [x + 1, y + 1], // Right of top cell
      [x, y + 2] // Above top cell
    );
  } else {
    // Block occupies (x, y) and (x+1, y)
    // Check all adjacent cells
    checkPositions.push(
      [x - 1, y], // Left of left cell
      [x, y - 1], // Below left cell
      [x, y + 1], // Above left cell
      [x + 1, y - 1], // Below right cell
      [x + 1, y + 1], // Above right cell
      [x + 2, y] // Right of right cell
    );
  }

  // Check if any adjacent position has an existing block
  for (const [checkX, checkY] of checkPositions) {
    if (
      checkX >= 0 &&
      checkX < GRID_SIZE &&
      checkY >= 0 &&
      checkY < GRID_SIZE
    ) {
      if (grid[checkX][checkY] !== null) {
        return true; // Found an adjacent block
      }
    }
  }

  return false; // No adjacent blocks found
};

/**
 * Checks if a move is valid based on game rules.
 * 1. Bounds (handled by findDropPosition mostly)
 * 2. "Short Sides" constraint: Same color short sides cannot touch.
 * 3. Connectivity: All blocks (except the first) must be connected to existing blocks.
 */
export const validateMove = (
  grid: GridState,
  x: number,
  y: number,
  orientation: Orientation,
  player: Player
): boolean => {
  if (y === -1) return false;

  // Check if this is the first move (board is empty)
  let boardIsEmpty = true;
  for (let i = 0; i < GRID_SIZE && boardIsEmpty; i++) {
    for (let j = 0; j < GRID_SIZE && boardIsEmpty; j++) {
      if (grid[i][j] !== null) {
        boardIsEmpty = false;
      }
    }
  }

  // If not the first move, check connectivity
  if (!boardIsEmpty) {
    if (!isConnectedToExisting(grid, x, y, orientation)) {
      return false; // Block must be connected to existing blocks
    }
  }

  // Constraint: "The short sides of the same-colored game blocks may not make contact."
  // Vertical Block: Short sides are Bottom (y) and Top (y+1).
  // Horizontal Block: Short sides are Left (x) and Right (x+1).

  if (orientation === "vertical") {
    // Check Bottom Contact (at x, y-1)
    if (y > 0) {
      const cellBelow = grid[x][y - 1];
      if (
        cellBelow &&
        cellBelow.player === player &&
        cellBelow.orientation === "vertical"
      ) {
        // We are touching the top (short side) of the block below with our bottom (short side).
        return false;
      }
    }
    // Check Top Contact (at x, y+2) if there were a block there (unlikely during drop, but possible if we slot in?)
    // Since we drop from top, we only really care about what's below us usually.
    // But wait, "cannot place blocks on their ends".
    // The rule is about the resulting state.

    // Let's stick to: Does my short side touch a neighbor's short side of same color?

    // Vertical Block checks:
    // 1. Below (x, y-1): If neighbor is SAME COLOR and VERTICAL => Invalid (Short-to-Short).
    // 2. Above (x, y+2): If neighbor is SAME COLOR and VERTICAL => Invalid. (Not possible when dropping, but hypothetically).

    if (y > 0) {
      const below = grid[x][y - 1];
      if (below && below.player === player && below.orientation === "vertical")
        return false;
    }
  } else {
    // Horizontal Block checks:
    // Occupies (x,y) and (x+1,y).
    // Short sides are at Left (x) and Right (x+1).

    // 1. Check Left neighbor (x-1, y)
    if (x > 0) {
      const left = grid[x - 1][y];
      // If neighbor is same color and horizontal, its Right side is touching our Left side.
      if (left && left.player === player && left.orientation === "horizontal")
        return false;
    }

    // 2. Check Right neighbor (x+2, y)
    if (x + 2 < GRID_SIZE) {
      const right = grid[x + 2][y];
      // If neighbor is same color and horizontal, its Left side is touching our Right side.
      if (
        right &&
        right.player === player &&
        right.orientation === "horizontal"
      )
        return false;
    }
  }

  return true;
};

/**
 * Checks for a winner. 5 points (unit cubes) in a row.
 * Returns the winning coordinates if found, or null.
 */
export const checkWin = (
  grid: GridState,
  player: Player
): { x: number; y: number }[] | null => {
  // Directions: [dx, dy]
  const directions = [
    [1, 0], // Horizontal
    [0, 1], // Vertical
    [1, 1], // Diagonal /
    [1, -1], // Diagonal \
  ];

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const cell = grid[x][y];
      if (cell && cell.player === player) {
        for (const [dx, dy] of directions) {
          const cells = [{ x, y }];

          // Look forward
          for (let step = 1; step < WIN_LENGTH; step++) {
            const nx = x + dx * step;
            const ny = y + dy * step;

            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const nextCell = grid[nx][ny];
              if (nextCell && nextCell.player === player) {
                cells.push({ x: nx, y: ny });
              } else {
                break;
              }
            } else {
              break;
            }
          }

          if (cells.length >= WIN_LENGTH) {
            return cells;
          }
        }
      }
    }
  }

  return null;
};

export const applyBlockToGrid = (
  grid: GridState,
  block: BlockData
): GridState => {
  const newGrid = grid.map((col) => [...col]); // Deep copy columns
  const { x, y, orientation, player, id } = block;

  const cellDataOrigin: CellData = {
    player,
    orientation,
    blockId: id,
    part: "origin",
  };
  const cellDataExt: CellData = {
    player,
    orientation,
    blockId: id,
    part: "extension",
  };

  if (orientation === "vertical") {
    newGrid[x][y] = cellDataOrigin; // Bottom
    newGrid[x][y + 1] = cellDataExt; // Top
  } else {
    newGrid[x][y] = cellDataOrigin; // Left
    newGrid[x + 1][y] = cellDataExt; // Right
  }

  return newGrid;
};
