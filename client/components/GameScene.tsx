import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Text, Environment, ContactShadows, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { BlockData, Orientation, Player } from '../types';
import { CUBE_SIZE, BOARD_OFFSET, COLORS, GRID_SIZE } from '../constants';

interface BlockProps {
  x: number;
  y: number;
  orientation: Orientation;
  color: string;
  isGhost?: boolean;
  isValid?: boolean;
}

const Block3D: React.FC<BlockProps> = ({ x, y, orientation, color, isGhost, isValid }) => {
  // Convert grid coords to 3D coords
  // Board is centered at 0,0,0
  // x=0 maps to -BOARD_OFFSET
  
  // Pivot adjustment:
  // Vertical (1x2): Center is at x, y+0.5
  // Horizontal (2x1): Center is at x+0.5, y
  
  let posX = (x * CUBE_SIZE) - BOARD_OFFSET;
  let posY = (y * CUBE_SIZE) + (CUBE_SIZE / 2); // Base sits on y=0 plane
  
  let sizeArgs: [number, number, number] = [1, 1, 1]; // Placeholder

  if (orientation === 'vertical') {
    // 1 unit wide, 2 units high, 1 unit deep
    sizeArgs = [CUBE_SIZE * 0.96, CUBE_SIZE * 1.96, CUBE_SIZE * 0.96]; // Slightly smaller for gaps
    posY += CUBE_SIZE / 2; // Shift up because height is 2
  } else {
    // 2 units wide, 1 unit high, 1 unit deep
    sizeArgs = [CUBE_SIZE * 1.96, CUBE_SIZE * 0.96, CUBE_SIZE * 0.96];
    posX += CUBE_SIZE / 2; // Shift right because width is 2
  }
  
  // Z is constant 0 for the single layer, but let's just use 0
  const posZ = 0;

  const materialColor = isGhost 
    ? (isValid ? color : COLORS.error) 
    : color;

  // Animation Refs
  const groupRef = useRef<THREE.Group>(null!);
  // Initialize scale to 0 for new blocks (pop-in effect), 1 for ghosts
  const scaleRef = useRef(isGhost ? 1 : 0);
  const scaleVel = useRef(0);
  // Initialize Y offset for drop effect
  const yOffsetRef = useRef(isGhost ? 0 : 5);
  const yVel = useRef(0);

  useFrame(() => {
    // Ghosts don't animate in, they just exist/move
    if (isGhost) return;

    // Spring constants
    const tension = 0.12;
    const damping = 0.6;

    // 1. Scale Animation (Target: 1)
    const scaleDiff = 1 - scaleRef.current;
    if (Math.abs(scaleDiff) > 0.001 || Math.abs(scaleVel.current) > 0.001) {
      scaleVel.current += scaleDiff * tension;
      scaleVel.current *= damping;
      scaleRef.current += scaleVel.current;
      groupRef.current.scale.setScalar(scaleRef.current);
    }

    // 2. Drop Animation (Target Offset: 0)
    const yDiff = 0 - yOffsetRef.current;
    if (Math.abs(yDiff) > 0.001 || Math.abs(yVel.current) > 0.001) {
        yVel.current += yDiff * tension;
        yVel.current *= damping;
        yOffsetRef.current += yVel.current;
        
        // Update Y position (Base Y + Offset)
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
      {/* Decorative groove in the middle to show it's two cubes joined */}
      {!isGhost && (
        <mesh position={[0, 0, 0]}>
           <boxGeometry args={orientation === 'vertical' ? [1.05, 0.05, 0.5] : [0.05, 1.05, 0.5]} />
           <meshStandardMaterial color="#000" opacity={0.2} transparent />
        </mesh>
      )}
    </group>
  );
};

const WinningMarker: React.FC<{ x: number, y: number, color: string }> = ({ x, y, color }) => {
  // Center of the 1x1 cell
  const posX = (x * CUBE_SIZE) - BOARD_OFFSET;
  const posY = (y * CUBE_SIZE) + (CUBE_SIZE / 2);
  const posZ = 0.55; // Slightly in front of the block

  // Pulse animation
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
       {/* Glow effect */}
       <pointLight distance={1.5} intensity={2} color={color} />
    </group>
  );
};

const GridBase = () => {
  // Visual guide for columns
  const lines = [];
  for (let i = 0; i <= GRID_SIZE; i++) {
    const x = (i * CUBE_SIZE) - BOARD_OFFSET - (CUBE_SIZE/2);
    lines.push(
      <mesh key={`line-${i}`} position={[x, 4.5, -0.55]} rotation={[0,0,0]}>
        <boxGeometry args={[0.02, 9, 0.02]} />
        <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
      </mesh>
    );
  }

  // Horizontal lines
  for (let i = 0; i <= GRID_SIZE; i++) {
     const y = (i * CUBE_SIZE);
     lines.push(
       <mesh key={`hline-${i}`} position={[-0.5 * CUBE_SIZE, y, -0.55]} rotation={[0,0,Math.PI/2]}>
         <boxGeometry args={[0.02, 9, 0.02]} />
         <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
       </mesh>
     );
  }

  return (
    <group>
       {/* Floor/Table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={COLORS.background} />
      </mesh>
      
      {/* The 9 point width base indicator */}
      <mesh position={[-0.5 * CUBE_SIZE, -0.1, 0]}>
         <boxGeometry args={[GRID_SIZE * CUBE_SIZE, 0.1, CUBE_SIZE]} />
         <meshStandardMaterial color="#444" />
      </mesh>

      {/* Grid Lines Overlay behind blocks */}
      <group position={[0,0,-0.1]}>
        {lines}
      </group>
    </group>
  );
};

interface GameSceneProps {
  blocks: BlockData[];
  ghost: { x: number; y: number; orientation: Orientation; isValid: boolean } | null;
  currentPlayer: Player;
  onHover: (x: number) => void;
  onClick: () => void;
  winningCells: { x: number, y: number }[] | null;
}

export const GameScene: React.FC<GameSceneProps> = ({ blocks, ghost, currentPlayer, onHover, onClick, winningCells }) => {
  const { camera } = useThree();
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerInteraction = (e: any) => {
    e.stopPropagation();
    const point = e.point; 
    const rawX = (point.x + BOARD_OFFSET);
    const gridX = Math.round(rawX);
    onHover(gridX);
  };

  const handlePointerDown = (e: any) => {
    // Record start position to distinguish click from drag
    dragStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
  };

  const handlePlaneClick = (e: any) => {
    e.stopPropagation();

    // Check distance moved
    const dx = e.nativeEvent.clientX - dragStart.current.x;
    const dy = e.nativeEvent.clientY - dragStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 10 pixels, assume it's a drag (camera orbit) and ignore click
    if (dist > 10) return;

    // On touch devices, a tap should just select/move the ghost (aiming).
    // On mouse devices, a click usually means "do it" (aim + fire).
    // The pointerType check helps separate these intents.
    
    // Always update hover position first to ensure ghost is where user tapped
    const point = e.point; 
    const rawX = (point.x + BOARD_OFFSET);
    const gridX = Math.round(rawX);
    onHover(gridX);

    if (e.pointerType === 'mouse') {
      onClick(); // Confirm place
    }
    // For touch, we do nothing here regarding placement. 
    // The user will use the UI "Place" button.
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment preset="city" />

      <OrbitControls 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.1} 
        enablePan={false}
        target={[0, 4, 0]}
        maxDistance={25}
        minDistance={5}
      />

      <group>
        {/* Render Placed Blocks */}
        {blocks.map((b) => (
          <Block3D 
            key={b.id} 
            x={b.x} 
            y={b.y} 
            orientation={b.orientation} 
            color={b.player === 'white' ? COLORS.white : COLORS.black} 
          />
        ))}

        {/* Render Ghost Block */}
        {ghost && (
          <Block3D
            x={ghost.x}
            y={ghost.y}
            orientation={ghost.orientation}
            color={currentPlayer === 'white' ? COLORS.white : COLORS.black}
            isGhost={true}
            isValid={ghost.isValid}
          />
        )}
        
        {/* Winning Markers */}
        {winningCells && winningCells.map((cell, idx) => (
           <WinningMarker key={`win-${idx}`} x={cell.x} y={cell.y} color={COLORS.highlight} />
        ))}

        {/* Interaction Plane */}
        <mesh 
          position={[-0.5, 4.5, 0.5]} 
          visible={false}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse') handlePointerInteraction(e);
          }}
          onPointerDown={handlePointerDown}
          onClick={handlePlaneClick}
        >
          <planeGeometry args={[14, 14]} />
        </mesh>

        <GridBase />
        
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={4} />
      </group>
    </>
  );
};