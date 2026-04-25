import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [svgr({ svgrOptions: { icon: true } }), react()],
  server: {
    proxy: { '/api': 'http://localhost:8000' },
    fs: { allow: ['..'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype') ||
            id.includes('unified') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('node_modules/bail') ||
            id.includes('decode-named-character-reference')
          ) {
            return 'vendor-markdown'
          }
          if (id.includes('lightweight-charts')) {
            return 'vendor-charts'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor-react'
          }
          // K-049 Phase 3: route-level chunking. Vite auto-splits lazy()
          // imports, but an explicit page-file branch guarantees a distinct
          // chunk per top-level route (AC-049-SUSPENSE-1: dist/assets/*.js
          // count ≥ 6 = 5 routes + vendor).
          if (
            id.includes('/frontend/src/pages/') ||
            id.includes('/frontend/src/AppPage.tsx')
          ) {
            const match = id.match(/\/(HomePage|AppPage|AboutPage|DiaryPage|BusinessLogicPage)\.tsx/)
            if (match) return `page-${match[1].toLowerCase()}`
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
