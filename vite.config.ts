import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(() => ({
  // 动态 base 路径配置：
  // - 开发环境: /
  // - 默认构建: / (独立域名)
  // - GitHub Pages: /lying-flat/ (通过环境变量 VITE_BASE_URL 设置)
  base: process.env.VITE_BASE_URL || '/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
}))
