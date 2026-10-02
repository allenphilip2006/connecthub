import React, { useRef, useEffect, memo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, PerspectiveCamera, Image } from '@react-three/drei';
import * as THREE from 'three';
import CompanionAvatar from '../companion/CompanionAvatar';

// Participant Orb Component
const ParticipantOrb = ({ participant, index, total, spotlightUserId, onClick }) => {
  const orbRef = useRef();
  const radius = 5;
  const isSpotlight = spotlightUserId === (participant.id || participant.email);
  const isTool = participant.isTool;

  useFrame((state) => {
    if (orbRef.current) {
      const time = state.clock.getElapsedTime();
      const angle = (index / total) * Math.PI * 2 + time * 0.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(time * 0.5 + index) * 0.5;
      orbRef.current.position.set(x, y, z);
      
      // Look at camera for the avatar image
      orbRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  const avatarUrl = participant.avatar 
    ? `http://localhost:62223${participant.avatar}` 
    : "/placeholder-avatar.svg";

  return (
    <group ref={orbRef}>
      <mesh onClick={() => onClick(participant)}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial 
          color={isTool ? (participant.username === 'Board' ? 0xec4899 : 0x10b981) : (isSpotlight ? 0xfacc15 : 0x22d3ee)} 
          emissive={isTool ? (participant.username === 'Board' ? 0xec4899 : 0x10b981) : (isSpotlight ? 0xfacc15 : 0x22d3ee)}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Avatar Image inside the orb (skip for tools) */}
      {!isTool && (
        <Image
          url={avatarUrl}
          scale={[0.6, 0.6]}
          position={[0, 0, 0.01]}
          transparent
          opacity={1}
        />
      )}

      {/* Tool Icon for tools */}
      {isTool && (
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {participant.isHelp ? '?' : (participant.username === 'Board' ? '✎' : '⚙')}
        </Text>
      )}

      <Text
        position={[0, -0.6, 0]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {participant.username || "Orbit"}
      </Text>
    </group>
  );
};

// 3D Orb Component
const Orb = ({ orbState, currentMood, onOrbClick }) => {
  const orbRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Re-sync renderer state if context was lost
  const { gl } = useThree();
  useEffect(() => {
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL Context Lost. Attempting recovery...');
    };
    const handleContextRestored = () => {
      console.info('WebGL Context Restored.');
    };
    gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    gl.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
      gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  const moodColors = {
    'Chill': 0x10b981, // teal-500
    'Focus': 0x3b82f6, // blue-500
    'Energy': 0xf59e0b, // amber-500
    'Vibe': 0x8b5cf6, // purple-500
  };
  const baseColor = moodColors[currentMood] || 0x10b981;

  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += 0.002;
      
      // Pulse animation based on state
      const time = state.clock.getElapsedTime();
      const pulse = orbState === 'typing' ? 1.1 + Math.sin(time * 5) * 0.05 : 1 + Math.sin(time * 2) * 0.02;
      orbRef.current.scale.set(pulse, pulse, pulse);
    }

    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.001;
    }
  });

  return (
    <group>
      {/* Main Orb */}
      <mesh
        ref={orbRef}
        onClick={onOrbClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.05 : 1}
      >
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={hovered ? 0.6 : 0.4}
          shininess={100}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Atmosphere Glow */}
      <mesh ref={glowRef} scale={1.1}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          color={baseColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Saturn-like Ring */}
      <mesh rotation={[Math.PI / 2.2, Math.PI / 8, 0]}>
        <torusGeometry args={[3.2, 0.02, 16, 100]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};

// 3D Button Component
const OrbitButton = ({ position, icon, label, color, onClick, index }) => {
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef();

  useFrame((state) => {
    if (buttonRef.current) {
      const time = state.clock.getElapsedTime();
      buttonRef.current.position.y = position[1] + Math.sin(time + index) * 0.05;
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh
          ref={buttonRef}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.15 : 1}
        >
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.3 : 0.1}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </Float>
      
      {/* Label only on hover for cleaner UI */}
      {hovered && (
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

// Starfield Component
const Starfield = () => {
  const starsRef = useRef();
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0002;
    }
  });

  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 2000;
  const posArray = new Float32Array(starsCount * 3);
  
  for (let i = 0; i < starsCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 20;
  }
  
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  return (
    <points ref={starsRef} geometry={starsGeometry}>
      <pointsMaterial size={0.015} color={0xffffff} transparent opacity={0.5} />
    </points>
  );
};

// Main Scene Component
const Scene = ({ orbState, currentMood, onOrbClick, onMenuAction, companionState, onCompanionInteraction, participants, spotlightUserId, onParticipantClick }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 12]} />
      <OrbitControls enableZoom={false} enablePan={false} />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -2, 2]} color={0x3b82f6} intensity={1} />
      
      {/* Starfield Background */}
      <Starfield />
      
      {/* Main Orb */}
      <Orb orbState={orbState} currentMood={currentMood} onOrbClick={onOrbClick} />
      
      {/* Participants and functional orbs revolving together */}
      <group>
        {participants?.map((p, i) => (
          <ParticipantOrb
            key={p.id || p.email || i}
            participant={p}
            index={i}
            total={(participants?.length || 0) + 2}
            spotlightUserId={spotlightUserId}
            onClick={onParticipantClick}
          />
        ))}
        
        {/* Subtle Functional Orbs in the same orbit */}
      <ParticipantOrb 
        participant={{ username: 'Board', isTool: true }}
        index={participants?.length || 0}
        total={(participants?.length || 0) + 3}
        onClick={() => onMenuAction('board')}
      />
      <ParticipantOrb 
        participant={{ username: 'Mood', isTool: true }}
        index={(participants?.length || 0) + 1}
        total={(participants?.length || 0) + 3}
        onClick={() => onMenuAction('mood')}
      />
      {/* Help/Instruction Orb in the center orbit */}
      <ParticipantOrb 
        participant={{ username: 'Help', isTool: true, isHelp: true }}
        index={(participants?.length || 0) + 2}
        total={(participants?.length || 0) + 3}
        onClick={() => onMenuAction('help')}
      />
    </group>
      
      {/* Companion Avatar */}
      <CompanionAvatar 
        emotion={companionState?.emotion || 'neutral'}
        activity={companionState?.activity || 'idle'}
        onInteraction={onCompanionInteraction}
        position={[3, -1, 1]}
      />
    </>
  );
};

const OrbScene3D = memo(({ orbState = 'active', onOrbClick, currentMood = 'Chill', onMenuAction, companionState, onCompanionInteraction, participants, spotlightUserId, onParticipantClick }) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 12], fov: 60 }}>
        <Scene 
          orbState={orbState}
          currentMood={currentMood}
          onOrbClick={onOrbClick}
          onMenuAction={onMenuAction}
          companionState={companionState}
          onCompanionInteraction={onCompanionInteraction}
          participants={participants}
          spotlightUserId={spotlightUserId}
          onParticipantClick={onParticipantClick}
        />
      </Canvas>
    </div>
  );
});

export default OrbScene3D;
