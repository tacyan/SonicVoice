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
      camera={{ position: [0, 0, 10], fov: 90 }} // High FOV for speed sensation, camera inside tunnel
      gl={{ 
        antialias: false, 
        powerPreference: "high-performance",
        alpha: false 
      }}
      dpr={[1, 2]} 
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 0, 80]} />

      <Suspense fallback={null}>
        <CrystalUniverse getAudioData={getAudioData} />
        
        {/* Floor Reflection - Subtle to enhance tunnel depth */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
          <planeGeometry args={[100, 300]} />
          <MeshReflectorMaterial
            blur={[400, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={40}
            roughness={0.4}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.8}
            mirror={1} 
          />
        </mesh>
        
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={2} />
      </Suspense>
      
      {/* No OrbitControls: We want to control the "Head" with mouse position in the component, purely visual ride */}

      <EffectComposer disableNormalPass>
        {/* Stronger Bloom for the "Impact" */}
        <Bloom 
          luminanceThreshold={0.15} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.7}
        />
        <ChromaticAberration 
            offset={new Vector2(0.002, 0.002)}
            radialModulation={true}
            modulationOffset={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </Canvas>
  );
};