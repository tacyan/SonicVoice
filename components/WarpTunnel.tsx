import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioData } from '../hooks/useAudio';

interface CrystalUniverseProps {
  getAudioData: () => AudioData;
}

// 3 Distinct Visual Modes
enum TunnelMode {
  COSMIC_WARP = 0,   // Fast, straight, blue/purple, aligned
  DIAMOND_CAVE = 1,  // Chaotic rotation, white/rainbow, sharp angles
  PRISM_STREAM = 2   // Wavy, saturated colors, flowing
}

const COUNT = 10000; // Maximum density for "Perfect" look
const TUNNEL_LENGTH = 400; 
const TUNNEL_RADIUS = 20;

export const CrystalUniverse: React.FC<CrystalUniverseProps> = ({ getAudioData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Reusable objects for GC optimization
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const mousePos = useMemo(() => new THREE.Vector3(), []); // Smooth mouse
  const targetMouse = useMemo(() => new THREE.Vector3(), []); // Raw mouse input

  // Initialize Particles
  const particles = useMemo(() => {
    return new Array(COUNT).fill(0).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radiusOffset = Math.random();
      
      return {
        // Base coordinate system
        angle,
        radiusBase: TUNNEL_RADIUS * (0.4 + radiusOffset * 1.5), // Multi-layered tunnel
        z: Math.random() * TUNNEL_LENGTH - TUNNEL_LENGTH / 2,
        
        // Physics attributes
        speedOffset: 0.5 + Math.random() * 1.5,
        rotationSpeed: (Math.random() - 0.5) * 2,
        
        // Aesthetic attributes
        id: i,
        randomColor: Math.random(),
      };
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // --- 1. SENSORY INPUTS ---
    const time = state.clock.elapsedTime;
    const { getAverage } = getAudioData();
    const bass = getAverage(0, 10) / 255;       // Scale / Boom
    const mids = getAverage(10, 100) / 255;     // Distortion
    const highs = getAverage(100, 200) / 255;   // Sparkle / brightness

    // --- 2. DYNAMIC FLIGHT CONTROL (Mouse Physics) ---
    // Smoothly interpolate mouse for "weighty" flight feel
    targetMouse.set((state.pointer.x * 30), (state.pointer.y * 30), 0);
    mousePos.lerp(targetMouse, 0.05); // Ease factor

    // Camera Bank/Roll effect based on horizontal movement
    // We rotate the camera slightly to simulate banking into a turn
    state.camera.rotation.z = THREE.MathUtils.lerp(state.camera.rotation.z, -state.pointer.x * 0.2, 0.05);
    // Slight FOV change based on speed/bass
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, 90 + bass * 10, 0.1);
    state.camera.updateProjectionMatrix();

    // --- 3. MODE SWITCHING ---
    const cycleDuration = 20; // Seconds per mode
    const modeIndex = Math.floor(time / cycleDuration) % 3;
    const currentMode = modeIndex as TunnelMode;

    // --- 4. PARTICLE LOOP ---
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];

      // -- Z-Movement (Infinite Tunnel) --
      // Base speed varies by mode
      let speed = 20; 
      if (currentMode === TunnelMode.COSMIC_WARP) speed = 60 + bass * 50;
      if (currentMode === TunnelMode.DIAMOND_CAVE) speed = 15 + bass * 10;
      if (currentMode === TunnelMode.PRISM_STREAM) speed = 30 + mids * 30;

      p.z += speed * p.speedOffset * 0.016; 
      if (p.z > TUNNEL_LENGTH / 2) {
        p.z -= TUNNEL_LENGTH;
      }

      // -- Tunnel Shaping (The "Snake" Effect) --
      // We bend the tunnel based on mouse position to simulate turning
      // The further away (z), the more the tunnel bends towards the mouse
      const zFactor = (p.z + TUNNEL_LENGTH/2) / TUNNEL_LENGTH; // 0 to 1
      
      // Calculate curve offset
      const curveX = Math.sin(time * 0.5 + p.z * 0.01) * 5 + (mousePos.x * zFactor * 2);
      const curveY = Math.cos(time * 0.3 + p.z * 0.01) * 5 + (mousePos.y * zFactor * 2);

      // Base Position
      let r = p.radiusBase;
      // Audio-reactive expansion
      r += bass * 5 * Math.sin(p.z * 0.1 + time * 3);

      const x = curveX + Math.cos(p.angle) * r;
      const y = curveY + Math.sin(p.angle) * r;
      const z = p.z;

      dummy.position.set(x, y, z);

      // -- MODE SPECIFIC STYLING --
      
      if (currentMode === TunnelMode.COSMIC_WARP) {
        // [COSMIC]: Aligned with Z, streaky, Blue/Purple
        dummy.rotation.x = Math.PI / 2; // Point forward
        dummy.rotation.z = p.angle;
        dummy.rotation.y = 0;
        
        dummy.scale.set(1, 10 + bass * 20, 1); // Long streaks

        // Deep Space Colors
        const hue = 0.6 + Math.sin(p.z * 0.05 + time) * 0.15; // Blue-ish
        color.setHSL(hue, 0.9, 0.4 + highs * 0.6);

      } else if (currentMode === TunnelMode.DIAMOND_CAVE) {
        // [DIAMOND]: Chaotic rotation, Shards, White/Cyan/Rainbow
        dummy.rotation.x = time * p.rotationSpeed;
        dummy.rotation.y = time * p.rotationSpeed;
        dummy.rotation.z = time * p.rotationSpeed;
        
        const scale = 1 + bass * 3;
        dummy.scale.set(scale, scale * 4, scale); // Shards

        // Diamond Colors: Mostly white/cyan, occasional rainbow flash
        const sparkle = Math.random() < (0.02 + highs * 0.1); 
        if (sparkle) {
            color.setHSL(Math.random(), 1, 0.9); // Rainbow flash
        } else {
            // Icy White/Blue
            color.setHSL(0.55, 0.4, 0.1 + bass * 0.4 + highs * 0.5);
        }

      } else {
        // [PRISM STREAM]: Wave alignment, Saturated Gradients
        dummy.lookAt(state.camera.position); // Billboarding for soft look
        dummy.scale.set(2, 2, 2);

        // Gradient Colors based on angle and time
        const hue = (p.angle / (Math.PI*2) + time * 0.1 + p.z * 0.01) % 1;
        color.setHSL(hue, 1.0, 0.5 + mids * 0.5);
      }

      // -- INTERACTIVE "FORCE FIELD" --
      // If cursor is close to particle (in XY plane primarily), repel or light up
      // Project particle to screen space roughly
      const dx = (x - mousePos.x * 0.2); // Adjust for parallax
      const dy = (y - mousePos.y * 0.2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 8) {
          // Mouse interaction effect
          const force = (8 - dist) / 8;
          dummy.scale.multiplyScalar(1 + force * 2); // Grow
          color.setHSL(Math.random(), 1, 0.8); // Turn into pure light
          
          // Slight repulsion
          dummy.position.x += dx * force * 0.5;
          dummy.position.y += dy * force * 0.5;
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
      {/* 
         Cylinder Geometry:
         Using 4 radial segments makes it a "Crystal Prism" shape (Diamond-like cross section)
         instead of a smooth cylinder.
      */}
      <cylinderGeometry args={[0.05, 0.05, 2.0, 4]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.8} />
    </instancedMesh>
  );
};