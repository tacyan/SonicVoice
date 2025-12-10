import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioData } from '../hooks/useAudio';

interface CrystalUniverseProps {
  getAudioData: () => AudioData;
}

const COUNT = 8000; // Dense particles for "Perfect" look
const TUNNEL_LENGTH = 300; // Long tunnel for depth
const TUNNEL_RADIUS = 15; // Wide enough to fly through

export const CrystalUniverse: React.FC<CrystalUniverseProps> = ({ getAudioData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const mousePos = useMemo(() => new THREE.Vector3(), []);

  // Initialize Particles
  const particles = useMemo(() => {
    return new Array(COUNT).fill(0).map((_, i) => {
      // Cylindrical tunnel distribution
      const theta = Math.random() * Math.PI * 2;
      const r = TUNNEL_RADIUS * (0.3 + Math.random() * 0.7); // Hollow center
      const z = Math.random() * TUNNEL_LENGTH - (TUNNEL_LENGTH / 2);
      
      return {
        // Base coordinates relative to tunnel center
        theta,
        r,
        z, // Current Z position
        speedSpeed: 0.5 + Math.random() * 1.0, // Parallax effect
        id: i,
        // For Stained Glass color patterns
        noiseOffset: Math.random() * 100
      };
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // --- INPUTS ---
    const time = state.clock.elapsedTime;
    const { getAverage } = getAudioData();
    const bass = getAverage(0, 10) / 255;
    const mids = getAverage(10, 100) / 255;
    const highs = getAverage(100, 200) / 255;
    const volume = Math.min((bass + mids + highs) / 3 * 2, 1);

    // --- MOUSE ---
    // Smoothly interpolate mouse position for fluid camera feel
    mousePos.x += (state.pointer.x * 5 - mousePos.x) * 0.05;
    mousePos.y += (state.pointer.y * 5 - mousePos.y) * 0.05;

    // --- INTRO IMPACT LOGIC ---
    // First 4 seconds: WARP SPEED
    const introDuration = 4.0;
    const isIntro = time < introDuration;
    // Speed curve: Starts insane, slows down to cruise
    const baseSpeed = isIntro 
      ? 150 * (1 - time / introDuration) + 20 
      : 20 + bass * 30;

    // Camera Rotation based on Mouse (Flight simulator feel)
    // Rotate the entire mesh container or offset particles? Offset particles is cheaper usually.
    // Actually, let's just move the camera slightly in the SceneContainer, 
    // but here we distort the tunnel based on mouse.

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];

      // 1. INFINITE SCROLL Z
      // Move particles towards positive Z (camera looks down -Z effectively)
      p.z += baseSpeed * p.speedSpeed * 0.016; 
      if (p.z > TUNNEL_LENGTH / 2) {
        p.z -= TUNNEL_LENGTH;
      }

      // 2. CALCULATE POSITION
      let r = p.r;
      // Audio reactivity: Tunnel breathes/expands with bass
      r += Math.sin(p.z * 0.1 + time * 2) * bass * 2;
      
      // Tunnel curvature (snake effect)
      const curveX = Math.sin(time * 0.5 + p.z * 0.02) * 5;
      const curveY = Math.cos(time * 0.3 + p.z * 0.02) * 5;

      const x = curveX + Math.cos(p.theta) * r;
      const y = curveY + Math.sin(p.theta) * r;
      const z = p.z;

      // Interaction: Mouse repels/attracts slightly
      const dx = x - mousePos.x;
      const dy = y - mousePos.y;
      // const dist = Math.sqrt(dx*dx + dy*dy);
      // const force = Math.max(0, 5 - dist) / 5;
      
      dummy.position.set(
        x + dx * -0.1, // Slight parallax follow
        y + dy * -0.1, 
        z
      );

      // 3. ROTATION (Align with Z axis for speed streaks)
      dummy.rotation.x = Math.PI / 2; // Point along Z
      
      // 4. SCALE (Stretch on speed)
      const stretch = isIntro ? 10 : 1 + bass * 5 + volume * 2;
      dummy.scale.set(1, stretch, 1); // Stretch Y in local space (which is Z in world due to rotation)

      // 5. COLOR (Stained Glass / Crystal)
      if (isIntro) {
         // Blinding white/cyan intro
         const brightness = 0.5 + Math.random() * 0.5;
         color.setHSL(0.6, 0.8, brightness); 
      } else {
         // Complex Stained Glass Gradients
         // Use spatial coordinates to create patches of color
         const hueNoise = Math.sin(p.theta * 3 + p.z * 0.05 + time * 0.2);
         const hueBase = (time * 0.05) % 1; // Slowly shifting base hue
         
         const h = hueBase + hueNoise * 0.1; 
         const s = 0.8 + highs * 0.2;
         const l = 0.4 + highs * 0.6 + volume * 0.2;

         color.setHSL(h, s, l);
         
         // Sparkle effect
         if (Math.random() < 0.01 * highs) {
            color.setHSL(Math.random(), 1, 1);
         }
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      {/* Extremely thin cylinder for delicate "fiber optic" look */}
      <cylinderGeometry args={[0.02, 0.02, 1.5, 5]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.8} />
    </instancedMesh>
  );
};