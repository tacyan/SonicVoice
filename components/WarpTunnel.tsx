import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioData } from '../hooks/useAudio';

interface WarpTunnelProps {
  getAudioData: () => AudioData;
}

const COUNT = 2000;
const RADIUS = 15;
const LENGTH = 100;

export const WarpTunnel: React.FC<WarpTunnelProps> = ({ getAudioData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Create dummy object for calculating matrices efficiently
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Store initial random positions
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      // Random angle
      const theta = Math.random() * Math.PI * 2;
      // Random radius (with a hole in the middle)
      const r = Math.random() * RADIUS + 2; 
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = (Math.random() - 0.5) * LENGTH * 2; // Spread along Z
      
      // Random speed modifier per particle
      const speedMod = 0.5 + Math.random() * 0.5;

      temp.push({ x, y, z, originalZ: z, speedMod, colorPhase: Math.random() });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 1. Analyze Audio
    const { getAverage } = getAudioData();
    // Low freqs (bass) drive speed
    const bass = getAverage(0, 10); 
    // Mid-highs drive color/stretch
    const mids = getAverage(10, 100);
    const highs = getAverage(100, 200);

    // Normalizing values (0.0 to 1.0 approx)
    const normalizedBass = Math.min(bass / 255, 1);
    const normalizedMids = Math.min(mids / 255, 1);
    const intensity = (normalizedBass * 0.8 + normalizedMids * 0.2);

    // Dynamic Parameters driven by audio
    const baseSpeed = 20 + (intensity * 150); // Speed up significantly on loud parts
    const stretchFactor = 1 + (intensity * 20); // Stretch long on loud parts
    
    // Color Palette Shift
    // Quiet: Blue/Purple. Loud: Pink/Red/White.
    const time = state.clock.elapsedTime;
    const hueBase = 0.6 + (Math.sin(time * 0.2) * 0.1) - (intensity * 0.2); 
    // 0.6 is blueish. -0.2 shifts to magenta/pink.

    const color = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];

      // Update Z position
      p.z += baseSpeed * p.speedMod * delta;

      // Loop particles seamlessly
      if (p.z > LENGTH) {
        p.z -= LENGTH * 2;
      }

      // Positioning
      dummy.position.set(p.x, p.y, p.z);
      
      // Scaling: Stretch along Z axis to simulate warp speed light trails
      // Add a bit of pulse to thickness (x, y) based on highs
      const thickness = 1 + (highs / 255) * 0.5;
      dummy.scale.set(thickness, thickness, stretchFactor * p.speedMod);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Coloring
      // Mix hue based on individual phase + audio intensity
      const particleHue = (hueBase + p.colorPhase * 0.1) % 1;
      const lightness = 0.5 + (intensity * 0.4); // Brighter when loud
      color.setHSL(particleHue, 1.0, lightness);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
    // Rotate the entire tunnel slowly for vertigo effect
    meshRef.current.rotation.z += delta * 0.1 * (1 + intensity);

    // Pulse ambient light
    if (lightRef.current) {
        lightRef.current.intensity = 1 + intensity * 5;
        lightRef.current.color.setHSL(hueBase, 0.8, 0.5);
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[0.1, 0.1, 1]} />
        <meshBasicMaterial toneMapped={false} /> {/* ToneMapped false helps bloom shine brighter */}
      </instancedMesh>
      <pointLight ref={lightRef} distance={20} decay={2} />
    </>
  );
};