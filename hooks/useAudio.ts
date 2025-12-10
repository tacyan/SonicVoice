import { useRef, useState, useCallback } from 'react';

export interface AudioData {
  frequency: Uint8Array;
  analyser: AnalyserNode | null;
  getAverage: (startIndex?: number, endIndex?: number) => number;
}

export const useAudio = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // Controls resolution. 256 bins.
      analyser.smoothingTimeConstant = 0.8; // Smooths out the jitter
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      setReady(true);
      setError(null);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or not available. Please allow permissions.");
    }
  }, []);

  const getAudioData = useCallback((): AudioData => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { 
        frequency: new Uint8Array(0), 
        analyser: null, 
        getAverage: () => 0 
      };
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const getAverage = (startIndex = 0, endIndex = dataArrayRef.current.length) => {
      let sum = 0;
      const count = endIndex - startIndex;
      if (count <= 0) return 0;
      
      for (let i = startIndex; i < endIndex; i++) {
        sum += dataArrayRef.current![i];
      }
      return sum / count;
    };

    return {
      frequency: dataArrayRef.current,
      analyser: analyserRef.current,
      getAverage
    };
  }, []);

  return { ready, error, start, getAudioData };
};