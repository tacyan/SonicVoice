import React, { useState } from 'react';
import { useAudio } from './hooks/useAudio';
import { SceneContainer } from './components/SceneContainer';
import { Mic, Play, Info } from 'lucide-react';

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
    <div className="relative w-full h-full text-white overflow-hidden bg-black select-none">
      
      {/* 3D Scene Layer */}
      {started && ready && (
        <div className="absolute inset-0 z-0">
          <SceneContainer getAudioData={getAudioData} />
        </div>
      )}

      {/* Overlay UI Layer */}
      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-1000 ${started ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Background gradient for the menu */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-black pointer-events-none" />

        <div className="relative z-20 max-w-md w-full p-8 text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              SONIC WARP
            </h1>
            <p className="text-gray-400 text-sm tracking-widest uppercase">
              Interactive Audio Visualizer
            </p>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <p className="mb-6 text-gray-300 leading-relaxed">
              Experience an immersive 3D light tunnel that reacts to your music or voice.
              <br/><br/>
              <span className="text-xs font-mono text-cyan-400 block mt-2">
                <Info size={14} className="inline mr-1 mb-1"/>
                Microphone access required for audio analysis.
              </span>
            </p>

            {error ? (
               <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm mb-4">
                 {error}
               </div>
            ) : null}

            <button
              onClick={handleStart}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-transparent border-2 border-white/20 rounded-full hover:bg-white/10 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <span className="absolute inset-0 w-full h-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-md"></span>
              <Play className="w-5 h-5 mr-2 fill-current" />
              ENTER EXPERIENCE
            </button>
          </div>

          <div className="text-xs text-gray-600 font-mono">
            Inspired by teamLab & Digital Art Installations
          </div>
        </div>
      </div>

      {/* Persistent Controls (Visible after start) */}
      {started && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs font-mono text-cyan-300">
            <Mic size={14} className="animate-pulse" />
            LISTENING
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Play music or speak
          </p>
        </div>
      )}
    </div>
  );
};

export default App;