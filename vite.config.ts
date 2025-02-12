import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/face-index/',
  plugins: [
    svelte({
      compilerOptions: {
        dev: true
      }
    })
  ]
});