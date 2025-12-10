import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { MeshReflectorMaterial, Stars } from '@react-three/drei';
import { Vector2 } from 'three';
import { CrystalUniverse } from './WarpTunnel'; 
import { AudioData } from '../hooks/useAudio';

interface SceneContainerProps {
  getAudioData: () => AudioData;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({ getAudioData }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 90 }} // Closer camera for "Cockpit" feel
      gl={{ 
        antialias: false, 
        powerPreference: "high-performance",
        alpha: false 
      }}
      dpr={[1, 2]} 
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 10, 150]} />

      <Suspense fallback={null}>
        <CrystalUniverse getAudioData={getAudioData} />
        
        {/* Mirror Floor: Adds to the "Diamond" infinite reflection feel */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]}>
          <planeGeometry args={[200, 500]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={80} // High reflection for crystal look
            roughness={0.2}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.9}
            mirror={1} 
          />
        </mesh>
        
        {/* Subtle Ceiling reflection for full immersion */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 20, 0]}>
             <planeGeometry args={[200, 500]} />
             <meshBasicMaterial color="#000" side={2} />
        </mesh>

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={3} />
      </Suspense>

      <EffectComposer disableNormalPass>
        {/* 
           Bloom: High intensity to make the "Diamond" sparkles blind slightly.
           This is key for the "video-like" quality.
        */}
        <Bloom 
          luminanceThreshold={0.1} 
          mipmapBlur 
          intensity={1.8} 
          radius={0.6}
        />
        {/* Chromatic Aberration: Adds the prism/lens effect at edges */}
        <ChromaticAberration 
            offset={new Vector2(0.003, 0.003)}
            radialModulation={true}
            modulationOffset={0.3}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};