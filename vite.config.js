import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const productionCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

function productionCspPlugin() {
  return {
    name: 'production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${productionCsp}" />`,
      )
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), productionCspPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5178,
  },
})
