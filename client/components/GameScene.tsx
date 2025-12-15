import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  RoundedBox,
  Environment,
  ContactShadows,
  Ring,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import { BlockData, Orientation, Player, GridState } from "@/types";
import { CUBE_SIZE, COLORS, GRID_SIZE } from "@/constants";
import { getGridBounds } from "@/utils/gameLogic";

interface BlockProps {
  x: number;
  y: number;
  orientation: Orientation;
  color: string;
  isGhost?: boolean;
  isValid?: boolean;
}

const Block3D: React.FC<BlockProps> = ({
  x,
  y,
  orientation,
  color,
  isGhost,
  isValid,
}) => {
  // Coords are now direct world space (scaled by CUBE_SIZE)

  let posX = x * CUBE_SIZE;
  let posY = y * CUBE_SIZE + CUBE_SIZE / 2; // Base sits on y=0 plane

  let sizeArgs: [number, number, number] = [1, 1, 1];

  if (orientation === "vertical") {
    sizeArgs = [CUBE_SIZE * 0.96, CUBE_SIZE * 1.96, CUBE_SIZE * 0.96];
    posY += CUBE_SIZE / 2;
  } else {
    sizeArgs = [CUBE_SIZE * 1.96, CUBE_SIZE * 0.96, CUBE_SIZE * 0.96];
    posX += CUBE_SIZE / 2;
  }

  const posZ = 0;

  const materialColor = isGhost ? (isValid ? color : COLORS.error) : color;

  // Animation Refs
  const groupRef = useRef<THREE.Group>(null!);
  const scaleRef = useRef(isGhost ? 1 : 0);
  const scaleVel = useRef(0);
  const yOffsetRef = useRef(isGhost ? 0 : 5);
  const yVel = useRef(0);

  useFrame(() => {
    if (isGhost) return;

    const tension = 0.12;
    const damping = 0.6;

    const scaleDiff = 1 - scaleRef.current;
    if (Math.abs(scaleDiff) > 0.001 || Math.abs(scaleVel.current) > 0.001) {
      scaleVel.current += scaleDiff * tension;
      scaleVel.current *= damping;
      scaleRef.current += scaleVel.current;
      groupRef.current.scale.setScalar(scaleRef.current);
    }

    const yDiff = 0 - yOffsetRef.current;
    if (Math.abs(yDiff) > 0.001 || Math.abs(yVel.current) > 0.001) {
      yVel.current += yDiff * tension;
      yVel.current *= damping;
      yOffsetRef.current += yVel.current;
      groupRef.current.position.y = posY + yOffsetRef.current;
    }
  });

  return (
    <group ref={groupRef} position={[posX, posY, posZ]}>
      <RoundedBox args={sizeArgs} radius={0.05} smoothness={4}>
        <meshStandardMaterial
          color={materialColor}
          transparent={isGhost}
          opacity={isGhost ? 0.6 : 1}
          roughness={0.7}
        />
      </RoundedBox>
      {!isGhost && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry
            args={
              orientation === "vertical" ? [1.05, 0.05, 0.5] : [0.05, 1.05, 0.5]
            }
          />
          <meshStandardMaterial color="#000" opacity={0.2} transparent />
        </mesh>
      )}
    </group>
  );
};

const WinningMarker: React.FC<{ x: number; y: number; color: string }> = ({
  x,
  y,
  color,
}) => {
  const posX = x * CUBE_SIZE;
  const posY = y * CUBE_SIZE + CUBE_SIZE / 2;
  const posZ = 0.55;

  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 5) * 0.1;
    if (ringRef.current) ringRef.current.scale.setScalar(scale);
  });

  return (
    <group position={[posX, posY, posZ]}>
      <Ring ref={ringRef} args={[0.15, 0.25, 32]}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </Ring>
      <pointLight distance={1.5} intensity={2} color={color} />
    </group>
  );
};

// Re-implemented GridBase that shows dynamic bounds
const DynamicGridBase: React.FC<{ blocks: BlockData[] }> = ({ blocks }) => {
  // Create a grid map to calculate bounds (could optimize by passing grid directly, but blocks is okay)
  const gridStateForBounds = useMemo(() => {
    const map = new Map();
    blocks.forEach((b) => {
      // Just populate keys for bounds calculation
      map.set(`${b.x},${b.y}`, {});
      if (b.orientation === "horizontal") map.set(`${b.x + 1},${b.y}`, {});
      else map.set(`${b.x},${b.y + 1}`, {});
    });
    return map;
  }, [blocks]);

  const { minX, maxX } = getGridBounds(gridStateForBounds);

  // Calculate Valid Range
  // The structure width is (maxX - minX) + 1.
  // Max width is GRID_SIZE (9).
  // So valid new placements must keep (newMax - newMin) + 1 <= 9.
  // The absolute left limit is: maxX - 8.
  // The absolute right limit is: minX + 8.

  // If grid is empty, allow a default range centered at 0
  const effectiveMinX = blocks.length > 0 ? minX : 0;
  const effectiveMaxX = blocks.length > 0 ? maxX : 0;

  const validStart = effectiveMaxX - (GRID_SIZE - 1);
  const validEnd = effectiveMinX + (GRID_SIZE - 1);

  // We want to visualize this range.
  // Let's draw grid lines for x from validStart to validEnd.

  const gridLines = [];

  // Vertical lines (Columns)
  // We draw lines for X boundaries of cells, so from x to x+1
  for (let x = validStart; x <= validEnd + 1; x++) {
    const xPos = x * CUBE_SIZE - CUBE_SIZE / 2;
    gridLines.push(
      <mesh key={`vline-${x}`} position={[xPos, 4.5, -0.55]}>
        <boxGeometry args={[0.02, 9, 0.02]} />
        <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
      </mesh>
    );
  }

  // Horizontal lines (Rows) - Fixed height 0 to 9
  for (let y = 0; y <= GRID_SIZE; y++) {
    const yPos = y * CUBE_SIZE;
    // Width of horizontal lines should span the dynamic width
    // Center of line:
    const width = (validEnd - validStart + 1) * CUBE_SIZE;
    const centerX =
      ((validStart + validEnd + 1) / 2) * CUBE_SIZE - CUBE_SIZE / 2;

    gridLines.push(
      <mesh
        key={`hline-${y}`}
        position={[centerX, yPos, -0.55]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <boxGeometry args={[0.02, width, 0.02]} />
        <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
      </mesh>
    );
  }

  // Highlight Limits (Red walls at the ends?)
  // Let's just put markers at the absolute limits
  const leftLimitX = validStart * CUBE_SIZE - CUBE_SIZE / 2; // Left edge of leftmost valid cell
  const rightLimitX = (validEnd + 1) * CUBE_SIZE - CUBE_SIZE / 2; // Right edge of rightmost valid cell

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={COLORS.background} />
      </mesh>

      {/* Grid Lines */}
      <group position={[0, 0, -0.1]}>{gridLines}</group>

      {/* Dynamic Limits Visuals */}
      {blocks.length > 0 && (
        <>
          {/* Left Limit Indicator */}
          <mesh position={[leftLimitX, 0, 0]}>
            <boxGeometry args={[0.05, 0.1, 1]} />
            <meshBasicMaterial color="#ef4444" opacity={0.5} transparent />
          </mesh>
          <Text
            position={[leftLimitX, -0.2, 0]}
            fontSize={0.2}
            color="#ef4444"
            anchorX="center"
          >
            LIMIT
          </Text>

          {/* Right Limit Indicator */}
          <mesh position={[rightLimitX, 0, 0]}>
            <boxGeometry args={[0.05, 0.1, 1]} />
            <meshBasicMaterial color="#ef4444" opacity={0.5} transparent />
          </mesh>
          <Text
            position={[rightLimitX, -0.2, 0]}
            fontSize={0.2}
            color="#ef4444"
            anchorX="center"
          >
            LIMIT
          </Text>
        </>
      )}

      {/* Starting Center Indicator */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};

interface GameSceneProps {
  blocks: BlockData[];
  ghost: {
    x: number;
    y: number;
    orientation: Orientation;
    isValid: boolean;
  } | null;
  currentPlayer: Player;
  onHover: (x: number) => void;
  onClick: () => void;
  winningCells: { x: number; y: number }[] | null;
}

export const GameScene: React.FC<GameSceneProps> = ({
  blocks,
  ghost,
  currentPlayer,
  onHover,
  onClick,
  winningCells,
}) => {
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerInteraction = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    const gridX = Math.round(point.x / CUBE_SIZE);
    onHover(gridX);
  };

  const handlePointerDown = (e: any) => {
    dragStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
  };

  const handlePlaneClick = (e: any) => {
    e.stopPropagation();
    const dx = e.nativeEvent.clientX - dragStart.current.x;
    const dy = e.nativeEvent.clientY - dragStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) return;

    const point = e.point;
    const gridX = Math.round(point.x / CUBE_SIZE);
    onHover(gridX);

    if (e.pointerType === "mouse") {
      onClick();
    }
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Environment preset="city" />

      <OrbitControls
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.1}
        enablePan={true}
        target={[0, 4, 0]} // Center camera slightly higher
        maxDistance={40}
        minDistance={5}
      />

      <group>
        {blocks.map((b) => (
          <Block3D
            key={b.id}
            x={b.x}
            y={b.y}
            orientation={b.orientation}
            color={b.player === "white" ? COLORS.white : COLORS.black}
          />
        ))}

        {ghost && (
          <Block3D
            x={ghost.x}
            y={ghost.y}
            orientation={ghost.orientation}
            color={currentPlayer === "white" ? COLORS.white : COLORS.black}
            isGhost={true}
            isValid={ghost.isValid}
          />
        )}

        {winningCells &&
          winningCells.map((cell, idx) => (
            <WinningMarker
              key={`win-${idx}`}
              x={cell.x}
              y={cell.y}
              color={COLORS.highlight}
            />
          ))}

        {/* Interaction Plane */}
        <mesh
          position={[0, 4.5, 0.5]}
          visible={false}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse") handlePointerInteraction(e);
          }}
          onPointerDown={handlePointerDown}
          onClick={handlePlaneClick}
        >
          <planeGeometry args={[100, 20]} />
        </mesh>

        <DynamicGridBase blocks={blocks} />

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.5}
          scale={50}
          blur={2}
          far={4}
        />
      </group>
    </>
  );
};
