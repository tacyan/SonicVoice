/**
 * useAudio.ts
 * 
 * オーディオ入力を処理し、周波数データを取得するカスタムフック
 * 
 * 概要:
 * - マイクからの音声入力をリアルタイムで分析
 * - 周波数データを取得し、ビジュアライゼーションに使用
 * - マイクアクセスが失敗した場合でもシミュレートされたデータを提供
 * 
 * 主な仕様:
 * - Web Audio APIを使用して周波数分析を行う
 * - FFTサイズは512（256ビン）
 * - スムージング係数は0.8
 * 
 * 制限事項:
 * - マイクアクセスにはユーザーの許可が必要
 * - HTTPSまたはlocalhostでのみ動作
 */
import { useRef, useState, useCallback } from 'react';

/**
 * オーディオデータインターフェース
 */
export interface AudioData {
  /** 周波数データ配列 */
  frequency: Uint8Array;
  /** Web Audio APIのAnalyserNode（nullの場合はシミュレートモード） */
  analyser: AnalyserNode | null;
  /** 指定範囲の平均値を取得する関数 */
  getAverage: (startIndex?: number, endIndex?: number) => number;
}

/**
 * start関数の戻り値
 */
interface StartResult {
  /** マイクアクセスが成功したかどうか */
  success: boolean;
  /** エラーメッセージ（失敗時のみ） */
  errorMessage?: string;
}

/**
 * オーディオ入力を処理するカスタムフック
 * 
 * @returns ready - オーディオ処理の準備ができているか
 * @returns error - エラーメッセージ（ある場合）
 * @returns start - オーディオ処理を開始する関数
 * @returns getAudioData - 現在のオーディオデータを取得する関数
 * @returns isSimulated - シミュレートモードかどうか
 */
export const useAudio = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  /** シミュレート用のアニメーションフレームカウンター */
  const simulatedTimeRef = useRef<number>(0);

  /**
   * オーディオ処理を開始する
   * マイクアクセスが失敗した場合はシミュレートモードで動作
   * 
   * @returns 開始結果（成功/失敗とエラーメッセージ）
   */
  const start = useCallback(async (): Promise<StartResult> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // 256 bins
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      setReady(true);
      setError(null);
      setIsSimulated(false);
      
      return { success: true };
    } catch (err: any) {
      console.warn("マイクアクセスに失敗しました。シミュレートモードで動作します:", err?.message || err);
      
      // マイクがなくてもシミュレートモードで動作
      dataArrayRef.current = new Uint8Array(256);
      setReady(true);
      setIsSimulated(true);
      setError("マイクアクセスなし - シミュレートモードで動作中");
      
      return { 
        success: false, 
        errorMessage: "マイクアクセスに失敗しました。デモモードで動作します。"
      };
    }
  }, []);

  /**
   * 現在のオーディオデータを取得する
   * マイクがない場合はシミュレートされたデータを返す
   * 
   * @returns AudioDataオブジェクト
   */
  const getAudioData = useCallback((): AudioData => {
    // シミュレートモードの場合
    if (isSimulated && dataArrayRef.current) {
      simulatedTimeRef.current += 0.016; // 約60FPS想定
      const time = simulatedTimeRef.current;
      
      // シミュレートされた周波数データを生成
      // 音楽のような動的なパターンを作成
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        // 低周波数（ベース）: ゆっくりした大きな波
        const bassWave = Math.sin(time * 2 + i * 0.02) * 0.5 + 0.5;
        // 中周波数（ミッド）: 中程度の波
        const midWave = Math.sin(time * 4 + i * 0.1) * 0.3 + 0.5;
        // 高周波数（ハイ）: 速い小さな波
        const highWave = Math.sin(time * 8 + i * 0.3) * 0.2 + 0.3;
        
        // 周波数帯域によって異なるパターン
        let value: number;
        if (i < 20) {
          // 低周波数帯（ベース）
          value = bassWave * 200 + Math.random() * 30;
        } else if (i < 100) {
          // 中周波数帯（ミッド）
          value = midWave * 150 + Math.random() * 40;
        } else {
          // 高周波数帯（ハイ）
          value = highWave * 100 + Math.random() * 20;
        }
        
        // ビートのようなパルスを追加
        const beat = Math.sin(time * 3) > 0.7 ? 50 : 0;
        value = Math.min(255, Math.max(0, value + beat));
        
        dataArrayRef.current[i] = value;
      }
      
      const getAverage = (startIndex = 0, endIndex = dataArrayRef.current!.length) => {
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
        analyser: null,
        getAverage
      };
    }
    
    // 通常モード（マイク入力あり）
    if (!analyserRef.current || !dataArrayRef.current) {
      return { 
        frequency: new Uint8Array(0), 
        analyser: null, 
        getAverage: () => 0 
      };
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const getAverage = (startIndex = 0, endIndex = dataArrayRef.current!.length) => {
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
  }, [isSimulated]);

  return { ready, error, start, getAudioData, isSimulated };
};
