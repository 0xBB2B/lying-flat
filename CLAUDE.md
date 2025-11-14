# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个使用 Vue 3 + TypeScript + Vite 构建的现代 Web 应用程序。项目使用 Composition API、Pinia 状态管理和 Vue Router 进行路由管理。

## 技术栈

- **框架**: Vue 3.5+ (Composition API)
- **构建工具**: Vite 7.x
- **语言**: TypeScript 5.9+
- **状态管理**: Pinia 3.x
- **路由**: Vue Router 4.x
- **代码质量**: ESLint + Prettier
- **Node 版本要求**: ^20.19.0 或 >=22.12.0

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（带热重载）
pnpm dev

# 构建生产版本（包含类型检查）
pnpm build

# 仅构建（不进行类型检查）
pnpm build-only

# 类型检查
pnpm type-check

# 代码检查和自动修复
pnpm lint

# 代码格式化
pnpm format

# 预览生产构建
pnpm preview
```

## 项目架构

### 目录结构
- `src/main.ts` - 应用入口，初始化 Pinia 和 Router
- `src/App.vue` - 根组件，包含导航和路由视图
- `src/router/index.ts` - 路由配置，支持代码分割和懒加载
- `src/stores/` - Pinia store，使用 Composition API 风格（setup syntax）
- `src/views/` - 页面级组件
- `src/components/` - 可复用组件

### 关键配置
- **路径别名**: `@` 映射到 `src/` 目录（配置在 vite.config.ts）
- **TypeScript**: 项目引用配置分为 node 和 app 两部分
- **ESLint**: 使用 flat config 格式，配置了 Vue 和 TypeScript 规则
- **开发工具**: 集成了 Vue DevTools 插件

### 状态管理模式
Pinia stores 使用 Composition API 风格（setup 语法），而非传统的 options API。示例：
```typescript
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, doubleCount, increment }
})
```

### 路由配置
- 支持代码分割：about 页面使用动态导入实现懒加载
- 使用 Web History 模式

## 开发注意事项

- IDE 推荐使用 VS Code + Volar（禁用 Vetur）
- 使用 `vue-tsc` 而非 `tsc` 进行类型检查，以支持 `.vue` 文件
- 新建组件时优先使用 `<script setup lang="ts">` 语法
- 添加新路由时考虑是否需要代码分割（懒加载）

## Active Technologies
- TypeScript 5.9+ / Vue 3.5+ + Vue 3 (Composition API), Pinia 3.x (状态管理), Vue Router 4.x, Vite 7.x (001-annual-leave-system)
- 本地 JSON 文件存储 (localStorage 作为备选) (001-annual-leave-system)
- TypeScript 5.9+ (严格模式) (001-annual-leave-system)
- localStorage (主存储) + JSON文件导入导出 (备份/迁移) (001-annual-leave-system)

## Recent Changes
- 001-annual-leave-system: Added TypeScript 5.9+ / Vue 3.5+ + Vue 3 (Composition API), Pinia 3.x (状态管理), Vue Router 4.x, Vite 7.x
