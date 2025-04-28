import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import the 'path' module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Add this alias configuration
      '@': path.resolve(__dirname, './src'), 
    },
  },
  server: {
    // Optional: Configure server settings if needed, e.g., proxy
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5000', // Your backend server URL
    //     changeOrigin: true,
    //   }
    // }
  }
});