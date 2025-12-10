/**
 * SceneContainer.tsx
 * 
 * 3Dシーンのコンテナコンポーネント
 * 
 * 概要:
 * - Three.jsベースの3Dビジュアライゼーションを管理
 * - オーディオデータに反応するパーティクルシステムを表示
 * - ポストプロセッシングエフェクト（Bloom、Vignette）を適用
 * 
 * 主な仕様:
 * - @react-three/fiberを使用してThree.jsをReactと統合
 * - @react-three/postprocessingでビジュアルエフェクトを適用
 * 
 * 制限事項:
 * - WebGL対応ブラウザが必要
 */
import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CrystalUniverse } from './WarpTunnel'; 
import { AudioData } from '../hooks/useAudio';

/**
 * SceneContainerのプロパティ
 */
interface SceneContainerProps {
  /** オーディオデータを取得する関数 */
  getAudioData: () => AudioData;
}

/**
 * 星空の背景コンポーネント
 * @react-three/dreiのStarsの代替実装
 */
const StarField: React.FC<{ count?: number }> = ({ count = 2000 }) => {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // ランダムな球面座標で星を配置
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // 白から青みがかった色
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness * (0.9 + Math.random() * 0.1);
      colors[i * 3 + 1] = brightness * (0.9 + Math.random() * 0.1);
      colors[i * 3 + 2] = brightness;
    }
    
    return { positions, colors };
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      // ゆっくりと回転
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.positions.length / 3}
          array={points.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={points.colors.length / 3}
          array={points.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation
        transparent
        opacity={0.8}
        vertexColors
      />
    </points>
  );
};

/**
 * 反射する床コンポーネント
 * シンプルな黒い床（MeshReflectorMaterialの代替）
 */
const Floor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]}>
      <planeGeometry args={[200, 500]} />
      <meshStandardMaterial
        color="#050505"
        metalness={0.9}
        roughness={0.2}
      />
    </mesh>
  );
};

/**
 * 3Dシーンのコンテナコンポーネント
 * 
 * @param props - SceneContainerProps
 * @returns Canvas要素を含むReactコンポーネント
 */
export const SceneContainer: React.FC<SceneContainerProps> = ({ getAudioData }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 90 }}
      gl={{ 
        antialias: false, 
        powerPreference: "high-performance",
        alpha: false 
      }}
      dpr={[1, 2]} 
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 10, 150]} />
      
      {/* アンビエントライト */}
      <ambientLight intensity={0.1} />
      
      {/* ポイントライト */}
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#4444ff" />

      <Suspense fallback={null}>
        {/* メインのクリスタルユニバース */}
        <CrystalUniverse getAudioData={getAudioData} />
        
        {/* 床 */}
        <Floor />
        
        {/* 天井 */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 20, 0]}>
          <planeGeometry args={[200, 500]} />
          <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
        </mesh>

        {/* 星空 */}
        <StarField count={2000} />
      </Suspense>

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.1} 
          mipmapBlur 
          intensity={1.8} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};
