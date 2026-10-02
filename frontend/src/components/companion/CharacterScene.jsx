import React, { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCharacter } from "./useCharacter";
import { getEmotionConfig } from "./characterEmotions";
import { getGestureInfo } from "./characterGestures";

const CharacterCore = () => {
  const { emotion, gestureRef, minimized } = useCharacter();

  const bodyRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const chestRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  const targetRef = useRef(getEmotionConfig(emotion));
  const currentRef = useRef(getEmotionConfig(emotion));

  useEffect(() => {
    targetRef.current = getEmotionConfig(emotion);
  }, [emotion]);

  useFrame((state, delta) => {
    const t = Math.min(delta * 6, 1);
    const target = targetRef.current;
    const cur = currentRef.current;

    const lerp = (a, b, f) => a + (b - a) * f;

    cur.bodyTilt = lerp(cur.bodyTilt || 0, target.bodyTilt || 0, t);
    cur.headTilt = lerp(cur.headTilt || 0, target.headTilt || 0, t);
    cur.eyeOpen = lerp(cur.eyeOpen || 1, target.eyeOpen || 1, t);
    cur.glow = lerp(cur.glow || 0.6, target.glow || 0.6, t);

    const gesture = gestureRef.current;
    let jumpOffset = 0;
    let spin = 0;
    let armWave = 0;
    let thumbsUp = 0;

    if (gesture && !minimized) {
      const info = getGestureInfo(gesture.name);
      const elapsed = performance.now() - gesture.startedAt;
      const progress = Math.min(1, elapsed / (info.duration || 1000));
      const easeOut = 1 - Math.pow(1 - progress, 3);

      switch (gesture.name) {
        case "wave":
          armWave = Math.sin(easeOut * Math.PI * 3) * 0.6;
          break;
        case "thumbsUp":
          thumbsUp = easeOut;
          break;
        case "jump":
        case "celebrate":
          jumpOffset = Math.sin(easeOut * Math.PI) * 0.6;
          break;
        case "spin180":
          spin = easeOut * Math.PI;
          break;
        case "spin360":
          spin = easeOut * Math.PI * 2;
          break;
        case "stretch":
          cur.bodyTilt += Math.sin(easeOut * Math.PI) * 0.1;
          break;
        case "sleep":
          cur.eyeOpen = lerp(cur.eyeOpen, 0.05, t);
          break;
        default:
          break;
      }

      if (progress >= 1) {
        gestureRef.current = null;
      }
    }

    const time = state.clock.getElapsedTime();
    const breathing = Math.sin(time * 1.2) * 0.06;

    if (bodyRef.current) {
      bodyRef.current.rotation.z = cur.bodyTilt || 0;
      bodyRef.current.position.y = 0.2 + breathing + jumpOffset;
      bodyRef.current.rotation.y = spin;
    }
    if (headRef.current) {
      headRef.current.rotation.z = cur.headTilt || 0;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = -0.2 - armWave * 0.6;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z =
        0.2 + (armWave || 0) + thumbsUp * -0.8;
      rightArmRef.current.rotation.x = thumbsUp * -0.6;
    }
    if (chestRef.current) {
      const glow = cur.glow || 0.6;
      chestRef.current.material.emissiveIntensity = glow;
      chestRef.current.material.color.setRGB(1, 0.6 + glow * 0.3, 1);
    }
    const eyeScale = Math.max(0.1, cur.eyeOpen || 1);
    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = eyeScale;
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = eyeScale;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 4]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.6} />

      <group ref={bodyRef} position={[0, -0.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            color="#18181b"
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>

        <mesh ref={chestRef} position={[0, 0.15, 0.55]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>

        <mesh ref={headRef} position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial
            color="#020617"
            metalness={0.8}
            roughness={0.15}
          />
        </mesh>

        <mesh ref={leftArmRef} position={[-0.7, 0.1, 0]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#4f46e5" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.7, 0.1, 0]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#ec4899" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh ref={leftEyeRef} position={[-0.16, 0.9, 0.42]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.16, 0.9, 0.42]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        <mesh position={[0, 0.9, 0.48]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

const CharacterScene = () => {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  const dpr = isMobile ? 1 : 1.5;

  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.2], fov: 40 }}
      dpr={dpr}
      gl={{ antialias: !isMobile }}
    >
      <color attach="background" args={["#020617"]} />
      <CharacterCore />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </Canvas>
  );
};

export default CharacterScene;

