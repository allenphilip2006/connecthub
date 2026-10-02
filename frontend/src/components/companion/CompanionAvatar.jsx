import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Companion 3D Avatar Component
const CompanionModel = ({ emotion, activity, onInteraction }) => {
  const modelRef = useRef();
  const [hovered, setHovered] = useState(false);
  const emotionColors = {
    'happy': 0x10b981,    // green
    'excited': 0xf59e0b,  // amber
    'curious': 0x3b82f6,  // blue
    'thinking': 0x8b5cf6, // purple
    'neutral': 0x6b7280,  // gray
    'sad': 0x6366f1,      // indigo
    'angry': 0xef4444,    // red
  };

  const baseColor = emotionColors[emotion] || emotionColors.neutral;

  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Gentle floating animation
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.1;
      
      // Rotation based on activity
      if (activity === 'listening') {
        modelRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
      } else if (activity === 'responding') {
        modelRef.current.rotation.y += 0.02;
      } else {
        modelRef.current.rotation.y += 0.005;
      }
      
      // Emotion-based pulsing
      const pulseScale = emotion === 'excited' ? 1.1 + Math.sin(time * 3) * 0.05 : 1;
      modelRef.current.scale.setScalar(pulseScale);
    }
  });

  // Activity-based animations
  const getActivityAnimation = () => {
    switch (activity) {
      case 'typing':
        return { scale: [1, 0.8, 1], rotation: [0, 0, 0.1] };
      case 'thinking':
        return { scale: [1.1, 1.1, 1.1], rotation: [0.1, 0, 0] };
      case 'listening':
        return { scale: [0.9, 1.1, 0.9], rotation: [0, 0.2, 0] };
      default:
        return { scale: [1, 1, 1], rotation: [0, 0, 0] };
    }
  };

  const activityTransform = getActivityAnimation();

  return (
    <group>
      {/* Main companion body */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh
          ref={modelRef}
          onClick={onInteraction}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.1 : 1}
          position={activityTransform.position}
          rotation={activityTransform.rotation}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={hovered ? 0.4 : 0.2}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </Float>

      {/* Eyes */}
      <group position={[0, 0.1, 0.45]}>
        <mesh position={[-0.15, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        
        {/* Eye highlights */}
        <mesh position={[-0.13, 0.02, 0.03]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[0.17, 0.02, 0.03]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
      </group>

      {/* Activity indicator */}
      {activity === 'typing' && (
        <mesh position={[0, -0.3, 0.5]}>
          <planeGeometry args={[0.3, 0.1]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={0.8} />
        </mesh>
      )}
      
      {activity === 'thinking' && (
        <mesh position={[0.2, 0.3, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={0xfbbf24} />
        </mesh>
      )}
    </group>
  );
};

// Companion container with background
const CompanionAvatar = ({ emotion = 'neutral', activity = 'idle', onInteraction, position = [2, 1, 0] }) => {
  return (
    <group position={position}>
      {/* Glow effect */}
      <mesh position={[0, 0, -0.2]} scale={1.5}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial 
          color={emotion === 'excited' ? 0xf59e0b : 0x3b82f6} 
          transparent 
          opacity={0.2} 
        />
      </mesh>
      
      <CompanionModel 
        emotion={emotion} 
        activity={activity} 
        onInteraction={onInteraction} 
      />
    </group>
  );
};

export default CompanionAvatar;
