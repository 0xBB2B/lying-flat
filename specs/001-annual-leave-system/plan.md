# Implementation Plan: 员工年假统计系统

**Branch**: `001-annual-leave-system` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-annual-leave-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个员工年假统计系统,自动根据员工入职日期计算并管理年假额度。系统使用 Vue 3 + TypeScript + Vite 构建单页应用,数据存储在本地 JSON 文件中。核心功能包括:员工管理、年假自动计算(按入职周年发放)、手动调整、休假记录、日历视图、以及年假有效期管理(2年)。

## Technical Context

**Language/Version**: TypeScript 5.9+ / Vue 3.5+
**Primary Dependencies**: Vue 3 (Composition API), Pinia 3.x (状态管理), Vue Router 4.x, Vite 7.x
**Storage**: 本地 JSON 文件存储 (localStorage 作为备选)
**Testing**: Vitest (Vue 生态标准测试框架) + Vue Test Utils
**Target Platform**: 现代浏览器 (支持 ES2020+)
**Project Type**: Web (单页应用)
**Performance Goals**: 日历视图 <2s 加载,支持 50+ 员工数据;操作响应 <200ms
**Constraints**: 纯前端实现,无后端依赖;离线可用;数据持久化在客户端
**Scale/Scope**: 小型团队使用 (50-100 员工),约 10-15 个 Vue 组件,5-8 个页面视图

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

由于项目 constitution 为模板状态,采用 Vue 生态最佳实践进行检查:

| 检查项 | 状态 | 说明 |
|--------|------|------|
| **组件化设计** | ✅ PASS | 采用 Vue 3 Composition API,遵循单一职责原则 |
| **类型安全** | ✅ PASS | TypeScript 严格模式,所有实体和 API 都有类型定义 |
| **测试策略** | ✅ PASS | 使用 Vitest + Vue Test Utils,关键业务逻辑需单元测试 |
| **状态管理** | ✅ PASS | Pinia stores 使用 setup 语法,状态与组件分离 |
| **代码质量** | ✅ PASS | ESLint + Prettier 保证代码一致性 |
| **性能考虑** | ✅ PASS | 路由懒加载,大列表虚拟滚动(如需要) |

**结论**: 所有检查项通过,可以进入 Phase 0 研究阶段。

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
├── models/               # TypeScript 类型定义和数据模型
│   ├── Employee.ts      # 员工实体
│   ├── LeaveEntitlement.ts  # 年假额度实体
│   ├── LeaveUsage.ts    # 年假使用记录
│   └── LeaveAdjustment.ts   # 年假调整记录
├── stores/              # Pinia 状态管理
│   ├── employeeStore.ts # 员工数据管理
│   └── leaveStore.ts    # 年假数据管理
├── services/            # 业务逻辑层
│   ├── leaveCalculator.ts   # 年假计算引擎
│   ├── leaveValidator.ts    # 年假验证逻辑
│   ├── expiryManager.ts     # 年假有效期管理
│   └── storageService.ts    # 本地存储服务 (JSON)
├── components/          # Vue 可复用组件
│   ├── EmployeeList.vue     # 员工列表
│   ├── EmployeeForm.vue     # 员工表单
│   ├── LeaveBalance.vue     # 年假余额显示
│   ├── LeaveAdjustmentForm.vue  # 年假调整表单
│   ├── LeaveUsageForm.vue   # 休假记录表单
│   └── CalendarView.vue     # 日历视图
├── views/               # 页面级组件
│   ├── EmployeeListView.vue    # 员工列表页
│   ├── EmployeeDetailView.vue  # 员工详情页
│   ├── LeaveCalendarView.vue   # 年假日历页
│   └── LeaveReportsView.vue    # 年假报表页
├── router/
│   └── index.ts         # 路由配置
├── utils/               # 工具函数
│   ├── dateUtils.ts     # 日期计算工具
│   └── validators.ts    # 通用验证器
├── App.vue
└── main.ts

tests/
├── unit/                # 单元测试
│   ├── services/
│   │   ├── leaveCalculator.spec.ts
│   │   ├── leaveValidator.spec.ts
│   │   └── expiryManager.spec.ts
│   └── utils/
│       └── dateUtils.spec.ts
└── component/           # 组件测试
    ├── EmployeeList.spec.ts
    └── CalendarView.spec.ts

public/
└── data/                # 本地 JSON 数据文件
    ├── employees.json   # 员工数据
    └── leaves.json      # 年假记录数据
```

**Structure Decision**: 采用标准 Vue 3 单页应用架构,遵循 [CLAUDE.md](../../CLAUDE.md) 中定义的项目结构。关键设计决策:
- **Models**: 纯 TypeScript 接口/类型定义,与 Vue 无关,便于复用和测试
- **Services**: 业务逻辑与视图分离,核心计算引擎可独立测试
- **Stores**: 使用 Pinia Composition API 风格 (setup syntax)
- **Components vs Views**: Components 为可复用组件,Views 为路由页面
- **Storage**: JSON 文件存储在 public/data/ 下,通过 storageService 统一访问

## Complexity Tracking

无需填写 - Constitution Check 全部通过,无违规项需要说明。
