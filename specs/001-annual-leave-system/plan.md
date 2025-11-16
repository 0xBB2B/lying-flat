# Implementation Plan: 员工年假统计系统

**Branch**: `001-annual-leave-system` | **Date**: 2025-11-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-annual-leave-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个公司内部员工年假统计系统,允许HR管理员管理员工信息、自动计算年假额度、记录年假使用、查看日历视图,并处理年假有效期和过期提醒。系统采用Vue 3 + TypeScript + Vite技术栈,使用TailwindCSS实现响应式UI,数据存储于localStorage,支持JSON导入导出。

## Technical Context

**Language/Version**: TypeScript 5.9+ (严格模式)
**Framework**: Vue 3.5+ (Composition API with `<script setup>`)
**Primary Dependencies**:
- Vue 3.5+ (核心框架)
- Pinia 3.x (状态管理)
- Vue Router 4.x (路由)
- TailwindCSS 3.x (样式)
- **Shadcn-vue** (UI组件库 - 基于Radix Vue + TailwindCSS)
- **自定义日历组件** (使用CSS Grid + date-fns)
- **date-fns** (日期处理 - tree-shakable, TypeScript友好)

**Build Tool**: Vite 7.x
**Storage**: localStorage (主存储) + JSON文件导入导出 (备份/迁移)
**Testing**: Vitest (单元测试) + Vue Test Utils (组件测试)
**Target Platform**: 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web (单页应用 SPA)
**Performance Goals**:
- 页面加载时间 <2秒
- 日历视图渲染 <2秒 (50名员工数据)
- 操作响应时间 <200ms (添加员工、记录休假等)

**Constraints**:
- 响应式设计 (移动端 <768px, 桌面端 ≥768px)
- 纯前端应用,无后端API
- 数据持久化仅依赖浏览器localStorage
- 单管理员使用,无并发控制

**Scale/Scope**:
- 支持 ~100名员工数据
- ~10个主要页面/视图
- localStorage存储限制 ~5-10MB (足够)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (无项目宪法定义,使用Vue 3最佳实践)

本项目遵循以下原则:
1. **Composition API优先**: 所有组件使用 `<script setup lang="ts">` 语法
2. **类型安全**: 启用TypeScript严格模式,所有数据结构明确类型定义
3. **响应式设计**: 移动优先策略,使用Tailwind响应式断点
4. **单一职责**: 组件、Store、工具函数明确职责划分
5. **可测试性**: 业务逻辑与UI分离,便于单元测试

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.ts                    # 应用入口
├── App.vue                    # 根组件
├── router/
│   └── index.ts              # 路由配置
├── stores/
│   ├── employee.ts           # 员工状态管理
│   ├── leaveEntitlement.ts   # 年假额度管理
│   ├── leaveUsage.ts         # 年假使用记录管理
│   └── leaveAdjustment.ts    # 年假调整记录管理
├── types/
│   ├── employee.ts           # 员工类型定义
│   ├── leave.ts              # 年假相关类型定义
│   └── index.ts              # 类型导出
├── utils/
│   ├── leaveCalculator.ts    # 年假计算逻辑
│   ├── dateUtils.ts          # 日期处理工具
│   ├── storage.ts            # localStorage封装
│   └── validation.ts         # 数据验证
├── composables/
│   ├── useLeaveExpiry.ts     # 年假过期逻辑
│   ├── useLeaveReminder.ts   # 提醒逻辑
│   └── useResponsive.ts      # 响应式断点Hook
├── components/
│   ├── common/               # 通用组件
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Modal.vue
│   │   └── Alert.vue
│   ├── employee/             # 员工相关组件
│   │   ├── EmployeeList.vue
│   │   ├── EmployeeForm.vue
│   │   └── EmployeeCard.vue
│   ├── leave/                # 年假相关组件
│   │   ├── LeaveBalance.vue
│   │   ├── LeaveUsageForm.vue
│   │   ├── LeaveAdjustmentForm.vue
│   │   └── LeaveHistory.vue
│   └── calendar/             # 日历相关组件
│       ├── CalendarView.vue
│       └── CalendarDay.vue
└── views/
    ├── Home.vue              # 首页/仪表板
    ├── EmployeeManagement.vue # 员工管理页
    ├── LeaveCalendar.vue     # 日历视图页
    └── Settings.vue          # 设置页(导入导出)

tests/
├── unit/
│   ├── utils/
│   │   ├── leaveCalculator.spec.ts
│   │   └── dateUtils.spec.ts
│   └── stores/
│       └── employee.spec.ts
└── components/
    └── employee/
        └── EmployeeForm.spec.ts
```

**Structure Decision**: 采用标准Vue 3单页应用结构,按功能模块组织代码。核心业务逻辑封装在utils中,状态管理使用Pinia stores,UI组件按领域划分,确保代码可维护性和可测试性。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - 无宪法违规项需要说明
