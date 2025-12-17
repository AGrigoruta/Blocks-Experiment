import {
  GridState,
  BlockData,
  Player,
  Orientation,
  AIDifficulty,
} from "../types";
import { GRID_SIZE, WIN_LENGTH } from "../constants";
import {
  findDropPosition,
  validateMove,
  applyBlockToGrid,
  checkWin,
  getGridBounds,
} from "./gameLogic";

const SCORES = {
  WIN: 100000,
  FOUR: 500,
  THREE: 50,
  TWO: 5,
  CENTER: 2,
};

const getHeuristicScore = (grid: GridState, player: Player): number => {
  const opponent: Player = player === "white" ? "black" : "white";
  let score = 0;

  const checkLine = (x: number, y: number, dx: number, dy: number) => {
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (let i = 0; i < WIN_LENGTH; i++) {
      const cell = grid.get(`${x + dx * i},${y + dy * i}`);
      if (cell) {
        if (cell.player === player) playerCount++;
        else opponentCount++;
      } else {
        emptyCount++;
      }
    }

    if (playerCount > 0 && opponentCount === 0) {
      if (playerCount === 5) return SCORES.WIN;
      if (playerCount === 4) return SCORES.FOUR;
      if (playerCount === 3) return SCORES.THREE;
      if (playerCount === 2) return SCORES.TWO;
    }
    if (opponentCount > 0 && playerCount === 0) {
      if (opponentCount === 5) return -SCORES.WIN;
      if (opponentCount === 4) return -SCORES.FOUR * 1.5; // Prioritize blocking
      if (opponentCount === 3) return -SCORES.THREE;
      if (opponentCount === 2) return -SCORES.TWO;
    }
    return 0;
  };

  const { minX, maxX } = getGridBounds(grid);
  const startX = minX - 1;
  const endX = maxX + 1;
  const startY = 0;
  const endY = GRID_SIZE;

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      score += checkLine(x, y, 1, 0); // H
      score += checkLine(x, y, 0, 1); // V
      score += checkLine(x, y, 1, 1); // D1
      score += checkLine(x, y, 1, -1); // D2

      // Central preference
      const cell = grid.get(`${x},${y}`);
      if (cell && cell.player === player) {
        const distFromCenter = Math.abs(x - 0);
        score += Math.max(0, 5 - distFromCenter) * SCORES.CENTER;
      }
    }
  }

  return score;
};

const getAllPossibleMoves = (grid: GridState, player: Player): BlockData[] => {
  const moves: BlockData[] = [];
  const { minX, maxX } = getGridBounds(grid);

  // Search range expanded to possible next valid placements
  const startX = grid.size === 0 ? 0 : minX - 1;
  const endX = grid.size === 0 ? 0 : maxX + 1;

  const orientations: Orientation[] = ["vertical", "horizontal"];

  for (let x = startX; x <= endX; x++) {
    for (const orientation of orientations) {
      const y = findDropPosition(grid, x, orientation);
      if (validateMove(grid, x, y, orientation, player)) {
        moves.push({
          id: `ai-${Math.random()}`,
          x,
          y,
          orientation,
          player,
        });
      }
    }
  }
  return moves;
};

const minimax = (
  grid: GridState,
  depth: number,
  isMaximizing: boolean,
  player: Player,
  alpha: number,
  beta: number
): number => {
  const opponent = player === "white" ? "black" : "white";
  const winner = checkWin(grid, isMaximizing ? player : opponent);

  if (winner) return isMaximizing ? SCORES.WIN + depth : -SCORES.WIN - depth;
  if (depth === 0) return getHeuristicScore(grid, player);

  const moves = getAllPossibleMoves(grid, isMaximizing ? player : opponent);
  if (moves.length === 0) return 0; // Draw or no moves

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newGrid = applyBlockToGrid(grid, move);
      const evalValue = minimax(newGrid, depth - 1, false, player, alpha, beta);
      maxEval = Math.max(maxEval, evalValue);
      alpha = Math.max(alpha, evalValue);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newGrid = applyBlockToGrid(grid, move);
      const evalValue = minimax(newGrid, depth - 1, true, player, alpha, beta);
      minEval = Math.min(minEval, evalValue);
      beta = Math.min(beta, evalValue);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (
  grid: GridState,
  player: Player,
  difficulty: AIDifficulty
): BlockData | null => {
  const moves = getAllPossibleMoves(grid, player);
  if (moves.length === 0) return null;

  if (difficulty === "easy") {
    // Random move from valid moves
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Medium or Hard: Search
  const depth = difficulty === "medium" ? 1 : 2;
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const newGrid = applyBlockToGrid(grid, move);
    const score = minimax(newGrid, depth, false, player, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};
