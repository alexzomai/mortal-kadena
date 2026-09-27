import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Phaser сам по себе ~1.2 МБ — это нормально для игры.
  build: { chunkSizeWarningLimit: 1500 },
});
