# Implementation Plan: 历史休假记录时点额度计算修复

**Branch**: `002-historical-leave-balance` | **Date**: 2025-11-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-historical-leave-balance/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修复年假系统中历史休假记录的额度计算逻辑，确保在补录历史日期的休假时，系统基于该日期时点的年假额度进行验证和扣减，而不是使用当前时间的额度。主要涉及修改`leaveEntitlement.ts`和`leaveUsage.ts`存储层的余额计算逻辑，增加时点查询功能，确保正确处理年假有效期和FIFO扣减原则。

## Technical Context

**Language/Version**: TypeScript 5.9+ (严格模式)
**Framework**: Vue 3.5+ (Composition API with `<script setup>`)
**Primary Dependencies**:
- Vue 3.5+ (核心框架)
- Pinia 3.x (状态管理 - 需修改leaveEntitlementStore和leaveUsageStore)
- date-fns 4.x (日期处理 - 用于时点计算)
- Vitest (单元测试 - 需为时点计算逻辑添加测试)

**Storage**: localStorage (无需变更存储结构，仅修改计算逻辑)
**Testing**: Vitest + Vue Test Utils (需添加时点计算测试用例)
**Target Platform**: 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web (单页应用 SPA - Bug修复，无新UI)
**Performance Goals**:
- 时点余额计算 <1秒
- 余额重新计算 <2秒
- 不影响现有功能性能

**Constraints**:
- 保持数据结构兼容性（不能破坏现有localStorage数据）
- 不引入新的依赖包
- 仅修改计算逻辑，不改变UI交互流程

**Scale/Scope**:
- 修改文件数: ~3-5个 (stores + utils)
- 新增测试用例: ~8-10个
- 影响范围: 休假记录功能（LeaveUsageForm组件）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (无项目宪法定义，遵循Vue 3最佳实践)

本项目遵循以下原则（继承自主项目）:
1. **Composition API优先**: 所有组件使用 `<script setup lang="ts">` 语法
2. **类型安全**: 启用TypeScript严格模式，所有数据结构明确类型定义
3. **响应式设计**: 移动优先策略，使用Tailwind响应式断点
4. **单一职责**: 组件、Store、工具函数明确职责划分
5. **可测试性**: 业务逻辑与UI分离，便于单元测试

**此功能的合规性**:
- ✅ 仅修改Store层和Utils层，保持业务逻辑与UI分离
- ✅ 使用TypeScript严格类型定义时点余额计算接口
- ✅ 新增完整的单元测试覆盖时点计算逻辑
- ✅ 不引入新的架构模式，保持代码一致性

## Project Structure

### Documentation (this feature)

```text
specs/002-historical-leave-balance/
├── spec.md              # 功能规格（已完成）
├── plan.md              # 本文件（实施计划）
├── research.md          # Phase 0 输出（技术研究）
├── data-model.md        # Phase 1 输出（数据模型增强）
├── quickstart.md        # Phase 1 输出（开发指南）
├── contracts/           # Phase 1 输出（接口合约）
│   └── store-methods.md # Store方法签名定义
└── checklists/
    └── requirements.md  # 需求检查清单（已完成）
```

### Source Code (repository root)

```text
src/
├── stores/
│   ├── leaveEntitlement.ts    # 【需修改】增加时点余额计算方法
│   └── leaveUsage.ts          # 【需修改】修改recordUsage验证逻辑
├── utils/
│   └── leaveCalculator.ts     # 【需修改】增加时点额度计算函数
├── types/
│   └── leave.ts               # 【需修改】增加时点余额快照类型定义
└── components/
    └── leave/
        └── LeaveUsageForm.vue # 【可能需修改】增加时点余额显示

tests/
├── unit/
│   ├── utils/
│   │   └── leaveCalculator.spec.ts  # 【需增加】时点计算测试
│   └── stores/
│       ├── leaveEntitlement.spec.ts # 【需增加】时点余额查询测试
│       └── leaveUsage.spec.ts       # 【需增加】历史记录验证测试
└── component/
    └── leave/
        └── LeaveUsageForm.spec.ts   # 【需更新】集成测试
```

**Structure Decision**: 这是一个Bug修复功能，不涉及新的组件或页面。主要修改集中在数据层（stores）和工具层（utils），增强现有的余额计算逻辑以支持历史时点查询。所有修改保持在现有的项目结构内，确保最小化变更范围。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - 无宪法违规项需要说明
