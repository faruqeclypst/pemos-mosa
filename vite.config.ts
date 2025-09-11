import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // kalau host tunnelnya tetap
    allowedHosts: [
      'localhost',
      'https://accepted-du-valuable-automatic.trycloudflare.com/'
    ],

    // kalau sering berubah (pakai ngrok/trycloudflare random subdomain)
    // allowedHosts: ['.trycloudflare.com']
  }
})
