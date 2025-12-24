import { useState, useCallback, useMemo } from "react";
import {
  createEmptyGrid,
  findDropPosition,
  validateMove,
  applyBlockToGrid,
  checkWin,
  hasValidMove,
  rebuildGridFromBlocks,
} from "../utils/gameLogic";
import { GridState, BlockData, Player, Orientation, GameMode } from "../types";
import { MAX_BLOCKS_PER_PLAYER } from "../constants";

interface UseGameStateOptions {
  isTimed: boolean;
  initialTimeSetting: number;
  incrementSetting: number;
  gameMode: GameMode;
  myPlayer: Player;
  aiPlayer: Player;
  onSendNetworkAction?: (action: any) => void;
}

export const useGameState = (options: UseGameStateOptions) => {
  const [grid, setGrid] = useState<GridState>(createEmptyGrid());
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("white");
  const [previousLoser, setPreviousLoser] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<
    { x: number; y: number }[] | null
  >(null);
  const [whiteTime, setWhiteTime] = useState(options.initialTimeSetting);
  const [blackTime, setBlackTime] = useState(options.initialTimeSetting);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("vertical");

  const getGhost = useCallback(() => {
    if (hoverX === null || winner) return null;

    if (options.gameMode === "online" && currentPlayer !== options.myPlayer)
      return null;
    if (options.gameMode === "ai" && currentPlayer === options.aiPlayer)
      return null;

    const validX = hoverX;
    const targetY = findDropPosition(grid, validX, orientation);
    const isValid = validateMove(
      grid,
      validX,
      targetY,
      orientation,
      currentPlayer
    );

    return {
      x: validX,
      y: targetY,
      orientation,
      isValid: targetY !== -1 && isValid,
    };
  }, [
    hoverX,
    orientation,
    grid,
    currentPlayer,
    winner,
    options.gameMode,
    options.myPlayer,
    options.aiPlayer,
  ]);

  const applyNewBlock = useCallback(
    (newBlock: BlockData) => {
      // Build new blocks array
      const newBlocks = [...blocks, newBlock];

      // Rebuild grid from all blocks to match network behavior
      const newGrid = rebuildGridFromBlocks(newBlocks);

      setGrid(newGrid);
      setBlocks(newBlocks);

      let newWhiteTime = whiteTime;
      let newBlackTime = blackTime;
      if (options.isTimed) {
        if (currentPlayer === "white") newWhiteTime += options.incrementSetting;
        else newBlackTime += options.incrementSetting;

        if (currentPlayer === "white") setWhiteTime(newWhiteTime);
        else setBlackTime(newBlackTime);
      }

      const winResult = checkWin(newGrid, currentPlayer);
      let nextPlayer: Player = currentPlayer === "white" ? "black" : "white";
      let isDraw = false;
      let gameEnded = false;

      if (winResult) {
        setWinner(currentPlayer);
        setWinningCells(winResult);
        gameEnded = true;
      } else {
        const whiteBlockCount = newBlocks.filter(
          (b) => b.player === "white"
        ).length;
        const blackBlockCount = newBlocks.filter(
          (b) => b.player === "black"
        ).length;

        const nextCanMove = hasValidMove(newGrid, nextPlayer);
        const nextPlayerBlockCount =
          nextPlayer === "white" ? whiteBlockCount : blackBlockCount;

        if (!nextCanMove) {
          if (nextPlayerBlockCount >= MAX_BLOCKS_PER_PLAYER) {
            const currentCanMove = hasValidMove(newGrid, currentPlayer);
            const currentPlayerBlockCount =
              currentPlayer === "white" ? whiteBlockCount : blackBlockCount;

            if (
              !currentCanMove ||
              currentPlayerBlockCount >= MAX_BLOCKS_PER_PLAYER
            ) {
              setWinner("draw");
              isDraw = true;
              gameEnded = true;
            }
          } else {
            setWinner(currentPlayer);
            gameEnded = true;
          }
        } else {
          const currentPlayerBlockCount =
            currentPlayer === "white" ? whiteBlockCount : blackBlockCount;
          if (currentPlayerBlockCount >= MAX_BLOCKS_PER_PLAYER) {
            const currentCanMove = hasValidMove(newGrid, currentPlayer);
            if (!currentCanMove) {
              setWinner(nextPlayer);
              gameEnded = true;
            }
          }
        }

        if (!gameEnded) {
          setCurrentPlayer(nextPlayer);
        }
      }

      if (options.gameMode === "online" && options.onSendNetworkAction) {
        options.onSendNetworkAction({
          type: "MOVE",
          block: newBlock,
          nextPlayer,
          wTime: newWhiteTime,
          bTime: newBlackTime,
          isDraw,
          gameEnded,
        });
      }

      return { newGrid, newBlocks, nextPlayer, isDraw, gameEnded };
    },
    [grid, blocks, currentPlayer, whiteTime, blackTime, options]
  );

  const handleRotate = useCallback(() => {
    if (winner) return;
    if (options.gameMode === "online" && currentPlayer !== options.myPlayer)
      return;
    if (options.gameMode === "ai" && currentPlayer === options.aiPlayer) return;
    setOrientation((prev) => (prev === "vertical" ? "horizontal" : "vertical"));
  }, [
    winner,
    options.gameMode,
    currentPlayer,
    options.myPlayer,
    options.aiPlayer,
  ]);

  const handlePlace = useCallback(() => {
    const ghost = getGhost();
    if (!ghost || !ghost.isValid || winner) return;
    if (options.gameMode === "online" && currentPlayer !== options.myPlayer)
      return;

    const newBlock: BlockData = {
      id: Math.random().toString(36).substr(2, 9),
      x: ghost.x,
      y: ghost.y,
      orientation: ghost.orientation,
      player: currentPlayer,
    };

    applyNewBlock(newBlock);
  }, [
    getGhost,
    winner,
    options.gameMode,
    currentPlayer,
    options.myPlayer,
    applyNewBlock,
  ]);

  const resetGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setBlocks([]);
    setCurrentPlayer(previousLoser || "white");
    setWinner(null);
    setWinningCells(null);
    setOrientation("vertical");
    setHoverX(null);
    const startVal = options.isTimed ? options.initialTimeSetting : 999999;
    setWhiteTime(startVal);
    setBlackTime(startVal);
    setGameStartTime(Date.now());

    if (options.gameMode === "online" && options.onSendNetworkAction) {
      options.onSendNetworkAction({ type: "RESET" });
    }
  }, [previousLoser, options]);

  const canExplode = useMemo(() => {
    if (!winner) return false;
    if (winner === "draw") return true;
    if (options.gameMode === "local" || options.gameMode === "ai") return true;
    return options.myPlayer !== winner;
  }, [winner, options.gameMode, options.myPlayer]);

  return {
    grid,
    blocks,
    currentPlayer,
    previousLoser,
    winner,
    winningCells,
    whiteTime,
    blackTime,
    gameStartTime,
    hoverX,
    orientation,
    setGrid,
    setBlocks,
    setCurrentPlayer,
    setPreviousLoser,
    setWinner,
    setWinningCells,
    setWhiteTime,
    setBlackTime,
    setGameStartTime,
    setHoverX,
    setOrientation,
    getGhost,
    handleRotate,
    handlePlace,
    applyNewBlock,
    resetGame,
    canExplode,
  };
};
