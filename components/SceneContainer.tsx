import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { WarpTunnel } from './WarpTunnel';
import { AudioData } from '../hooks/useAudio';
import { OrbitControls } from '@react-three/drei';

interface SceneContainerProps {
  getAudioData: () => AudioData;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({ getAudioData }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, -20], fov: 60 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      dpr={[1, 2]} // Handle high DPI screens
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 10, 60]} />

      <Suspense fallback={null}>
        <WarpTunnel getAudioData={getAudioData} />
      </Suspense>
      
      <OrbitControls 
         enableZoom={false} 
         enablePan={false} 
         autoRotate={false} 
         maxPolarAngle={Math.PI / 1.5}
         minPolarAngle={Math.PI / 3}
      />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};