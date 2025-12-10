/**
 * vite.config.ts
 * 
 * Vite設定ファイル
 * Three.js関連の重い依存関係の最適化設定を含む
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        // 重い依存関係を事前にバンドル
        include: [
          'three',
          '@react-three/fiber',
          '@react-three/drei',
          '@react-three/postprocessing',
          'react',
          'react-dom'
        ],
        // 依存関係の検出を強制
        force: true
      },
      build: {
        // チャンクサイズの警告しきい値を上げる（大きなライブラリのため）
        chunkSizeWarningLimit: 2000,
      }
    };
});
