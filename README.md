# 躺平 (Lying Flat) - 员工年假统计系统

[![Vue 3](https://img.shields.io/badge/Vue-3.5+-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-3.x-FFD859?logo=pinia&logoColor=white)](https://pinia.vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个现代化的员工年假管理系统，基于日本劳动基准法的年次有给休暇制度。纯前端应用，数据本地存储，无需服务器。

## ✨ 特性

- 🎯 **自动计算年假**：根据入职时长自动发放年假（6个月起10天，最高20天）
- 📅 **日历视图**：直观展示团队休假安排
- ⏰ **过期提醒**：自动追踪2年有效期，智能提醒
- 💾 **数据备份**：支持 JSON 导出/导入，本地存储
- 📱 **响应式设计**：完美适配移动端和桌面端
- 🧪 **完整测试**：85%+ 代码覆盖率

## 📊 年假规则

| 入职年限 | 年假天数 | 说明     |
| -------- | -------- | -------- |
| 6 个月   | 10 天    | 首次发放 |
| 1.5 年   | 11 天    |          |
| 2.5 年   | 12 天    |          |
| 3.5 年   | 14 天    |          |
| 4.5 年   | 16 天    |          |
| 5.5 年   | 18 天    |          |
| 6.5 年+  | 20 天    | 上限     |

- ⏱️ **有效期**：2年（手动调整的年假永久有效）
- 🔄 **发放机制**：周年日自动发放，累加不覆盖
- 📝 **使用方式**：整天或半天（0.5天）

## 🚀 快速开始

### 在线体验

🌐 **[立即访问](https://0xBB2B.github.io/lying-flat/)** - 无需安装，在线使用

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:5173

### 部署

#### GitHub Pages（自动部署）

Push 到 `main` 分支后，GitHub Actions 会自动构建并部署。

**首次设置**：
1. 进入仓库 `Settings` → `Pages`
2. Source 选择 `GitHub Actions`
3. Push 代码后自动触发部署

#### 独立域名部署

默认构建即可：

```bash
# 构建（默认 base: /）
pnpm build

# 将 dist/ 目录部署到你的服务器
```

#### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 或手动构建
docker build -t lying-flat .
docker run -d -p 8080:80 lying-flat
```

### 常用命令

```bash
pnpm build          # 构建生产版本（独立域名，base: /）
pnpm build:github   # 构建 GitHub Pages 版本（base: /lying-flat/）
pnpm test:unit      # 运行测试
pnpm type-check     # 类型检查
pnpm lint           # 代码检查
```

## 📁 项目结构

```
src/
├── components/      # 22个 Vue 组件
│   ├── calendar/    # 日历视图
│   ├── employee/    # 员工管理
│   └── leave/       # 年假相关
├── stores/          # Pinia 状态管理
├── views/           # 页面组件
├── utils/           # 工具函数（年假计算、日期等）
└── types/           # TypeScript 类型定义
```

## 🛠️ 技术栈

- **Vue 3.5+** - Composition API + `<script setup>`
- **TypeScript 5.9+** - 严格模式
- **Vite 7.x** - 构建工具
- **Pinia 3.x** - 状态管理
- **Tailwind CSS + shadcn-vue** - UI 框架
- **Vitest** - 测试框架

## ❓ 常见问题

<details>
<summary><b>数据存储在哪里？</b></summary>

使用 localStorage 本地存储，支持 JSON 文件导出/导入备份。
</details>

<details>
<summary><b>年假如何自动更新？</b></summary>

系统在员工入职周年日自动计算并发放年假，累加不覆盖。
</details>

<details>
<summary><b>手动调整的年假会过期吗？</b></summary>

不会。手动调整的年假永久有效，只有系统自动发放的年假受 2 年有效期限制。
</details>

<details>
<summary><b>如何备份数据？</b></summary>

进入"设置"页面，点击"导出数据"按钮，下载 JSON 文件。
</details>

## 📚 文档

详细文档位于 `specs/001-annual-leave-system/` 目录：

- **[功能规格](specs/001-annual-leave-system/spec.md)** - 完整需求说明
- **[开发指南](specs/001-annual-leave-system/quickstart.md)** - 开发者快速上手
- **[数据模型](specs/001-annual-leave-system/data-model.md)** - 数据结构设计
- **[接口契约](specs/001-annual-leave-system/contracts/)** - API 和组件接口
- **[年假制度](annual_leave_rules.md)** - 日本年假详细规则

## 🤝 贡献

欢迎 PR！建议先阅读 [开发指南](specs/001-annual-leave-system/quickstart.md)。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**快速上手：`pnpm dev` 启动开发！** 🚀
