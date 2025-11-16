import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(() => ({
  // 动态 base 路径配置：
  // - 开发环境: /
  // - 默认构建: / (独立域名)
  // - GitHub Pages: /lying-flat/ (通过构建时环境变量 VITE_BASE_URL 设置)
  // 注意: process.env 仅在 Vite 配置文件(构建时)中可用,不会暴露到客户端代码
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
