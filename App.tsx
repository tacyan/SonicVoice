import React, { useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { SceneContainer } from './components/SceneContainer';
import { Mic, Play, Info, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const { ready, error, start, getAudioData } = useAudio();
  const [started, setStarted] = useState(false);

  const handleStart = async () => {
    await start();
    if (!error) {
      setStarted(true);
    }
  };

  return (
    <div className="relative w-full h-full text-white overflow-hidden bg-black select-none font-sans">
      
      {/* 3D Scene Layer */}
      {started && ready && (
        <div className="absolute inset-0 z-0">
          <SceneContainer getAudioData={getAudioData} />
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
              className="group relative flex items-center justify-center w-20 h-20 bg-white text-black rounded-full hover:scale-110 transition-transform duration-500 shadow-[0_0_50px_rgba(255,255,255,0.6)]"
            >
               <Play className="w-8 h-8 ml-1 fill-current" />
            </button>
            <span className="text-xs tracking-widest text-gray-400 uppercase">Enter the Void</span>
          </div>
          
          {error && (
             <div className="text-red-400 text-xs tracking-widest border-b border-red-500 pb-1">
               {error}
             </div>
          )}
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
              <Mic size={12} className="animate-pulse text-white" />
              <span>AUDIO SENSOR ACTIVE</span>
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