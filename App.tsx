/**
 * App.tsx
 * 
 * SonicVoice アプリケーションのメインコンポーネント
 * 
 * 概要:
 * - マイク入力を使用した音声反応型3Dビジュアライザー
 * - イントロ画面とメインビジュアライゼーションの2つの状態を管理
 * - マイクアクセスが失敗した場合はシミュレートモードで動作
 * 
 * 主な仕様:
 * - ユーザーがPlay ボタンをクリックすると、マイクアクセスを要求
 * - マイクアクセス許可後、3Dシーンが表示される
 * - マイクがなくてもシミュレートされたデータでアニメーションが動作
 * 
 * 制限事項:
 * - WebGL対応ブラウザが必要
 */
import React, { useState, Suspense, lazy } from 'react';
import { useAudio } from './hooks/useAudio';
import { Mic, MicOff, Play, Sparkles } from 'lucide-react';

/**
 * 3DシーンコンポーネントのLazy読み込み
 * 重い依存関係（@react-three/drei, three.js等）を遅延ロードすることで
 * 初期画面の表示速度を向上させる
 */
const SceneContainer = lazy(() => 
  import('./components/SceneContainer').then(module => ({ 
    default: module.SceneContainer 
  }))
);

/**
 * ローディングスピナーコンポーネント
 * 3Dシーンの読み込み中に表示される
 */
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <span className="text-xs tracking-widest text-gray-400 uppercase">Loading Universe...</span>
    </div>
  </div>
);

/**
 * メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  const { ready, start, getAudioData, isSimulated } = useAudio();
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Playボタンクリック時のハンドラー
   * マイクアクセスを開始し、成功・失敗に関わらずビジュアライゼーションを開始する
   */
  const handleStart = async () => {
    setIsLoading(true);
    
    try {
      await start();
      // マイクアクセスの成功・失敗に関わらず、startedをtrueにする
      // useAudioがシミュレートモードに切り替えるため、readyは常にtrueになる
      setStarted(true);
    } catch (e) {
      console.error("予期しないエラー:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen text-white overflow-hidden bg-black select-none font-sans">
      
      {/* 3D Scene Layer - Lazy Loaded */}
      {started && ready && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<LoadingSpinner />}>
            <SceneContainer getAudioData={getAudioData} />
          </Suspense>
        </div>
      )}

      {/* Intro / Overlay UI */}
      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-1000 ${started ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-black to-black pointer-events-none" />

        <div className="relative z-20 flex flex-col items-center space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-8xl font-thin tracking-[0.2em] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              CRYSTAL
            </h1>
            <h2 className="text-xl md:text-2xl font-light tracking-[0.5em] text-blue-200 uppercase opacity-80">
              Infinite Universe
            </h2>
          </div>

          <div className="p-10 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_0_100px_rgba(0,100,255,0.2)] flex flex-col items-center gap-6">
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="group relative flex items-center justify-center w-20 h-20 bg-white text-black rounded-full hover:scale-110 transition-transform duration-500 shadow-[0_0_50px_rgba(255,255,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
              ) : (
                <Play className="w-8 h-8 ml-1 fill-current" />
              )}
            </button>
            <span className="text-xs tracking-widest text-gray-400 uppercase">
              {isLoading ? 'Initializing...' : 'Enter the Void'}
            </span>
          </div>
        </div>
        
        <div className="absolute bottom-10 text-[10px] text-gray-600 tracking-[0.3em] uppercase">
           Interactive Digital Installation
        </div>
      </div>

      {/* Persistent HUD (Visible after start) */}
      {started && (
        <>
          <div className="absolute bottom-8 left-8 z-20 flex items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-300 opacity-70">
              {isSimulated ? (
                <>
                  <MicOff size={12} className="text-yellow-400" />
                  <span className="text-yellow-400">DEMO MODE</span>
                </>
              ) : (
                <>
                  <Mic size={12} className="animate-pulse text-white" />
                  <span>AUDIO SENSOR ACTIVE</span>
                </>
              )}
            </div>
          </div>
          
          <div className="absolute top-8 right-8 z-20 text-right mix-blend-difference">
             <div className="text-[10px] font-mono text-white/50 tracking-widest mb-1">MODE SEQUENCE</div>
             <div className="text-white font-bold tracking-widest text-sm flex items-center justify-end gap-2">
               AUTO <Sparkles size={10} className="text-blue-400" />
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
