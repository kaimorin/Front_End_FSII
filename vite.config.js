import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lee BACKEND_URL desde tu archivo .env local (no se sube a Git)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    server: { proxy: { '/api': env.BACKEND_URL || 'http://localhost:9005' } },
    plugins: [
      react(),
      !process.env.VITEST && babel({ presets: [reactCompilerPreset()] }),
    ].filter(Boolean),
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      include: ['src/**/*.test.{js,jsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/main.jsx'],
        thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  }
})