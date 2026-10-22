import { defineConfig } from 'vite';

// Production build configuration ensuring JS & CSS minification
export default defineConfig({
  build: {
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2022',
  },
});
