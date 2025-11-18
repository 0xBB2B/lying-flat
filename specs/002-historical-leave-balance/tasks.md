# Tasks: 历史休假记录时点额度计算修复

**Input**: Design documents from `/specs/002-historical-leave-balance/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (项目准备)

**Purpose**: 准备开发环境和类型定义

- [X] T001 Review existing codebase structure in src/stores/, src/utils/, src/types/
- [X] T002 Create feature branch 002-historical-leave-balance from main

---

## Phase 2: Foundational (基础类型定义)

**Purpose**: 定义新的类型和错误类，这些是所有用户故事的基础

**⚠️ CRITICAL**: 必须完成后才能开始用户故事实现

- [X] T003 [P] Add PointInTimeBalance and PointInTimeEntitlement types to src/types/leave.ts
- [X] T004 [P] Create src/types/errors.ts with InsufficientBalanceError and InvalidDateError classes
- [X] T005 [P] Add normalizeDate utility function to src/utils/dateUtils.ts
- [X] T006 [P] Add isLeaveExpiredAtDate function to src/utils/leaveCalculator.ts

**Checkpoint**: 基础类型已定义，可以开始实现核心逻辑

---

## Phase 3: User Story 1 - 正确计算历史休假记录的可用额度 (Priority: P1) 🎯 MVP

**Goal**: 实现基于时点的余额计算和验证，确保补录历史休假时使用正确时点的额度

**Independent Test**: 创建2021年4月1日入职的员工，补录2024年9月15日的1天休假，验证系统使用2024年9月15日时点的23天余额（而非当前2025年11月的额度）

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement calculateBalanceAtDate method in src/stores/leaveEntitlement.ts
- [X] T008 [US1] Modify calculateBalance to use calculateBalanceAtDate(employeeId, new Date()) in src/stores/leaveEntitlement.ts
- [X] T009 [US1] Update recordUsage validation logic to use calculateBalanceAtDate in src/stores/leaveUsage.ts
- [X] T010 [US1] Add date validation (not before hire date) in src/stores/leaveUsage.ts
- [X] T011 [US1] Add entitlement availability check (not before first grant) in src/stores/leaveUsage.ts
- [X] T012 [US1] Update error messages to use new error types with detailed context in src/stores/leaveUsage.ts

### Tests for User Story 1

- [X] T013 [P] [US1] Unit test: calculateBalanceAtDate with historical date (2024-09-15) in tests/unit/stores/leaveEntitlement.spec.ts
- [X] T014 [P] [US1] Unit test: calculateBalanceAtDate filters expired entitlements correctly in tests/unit/stores/leaveEntitlement.spec.ts
- [X] T015 [P] [US1] Unit test: calculateBalanceAtDate with date before first grant returns 0 in tests/unit/stores/leaveEntitlement.spec.ts
- [X] T016 [P] [US1] Unit test: recordUsage allows historical date with sufficient balance in tests/unit/stores/leaveUsage.spec.ts
- [X] T017 [P] [US1] Unit test: recordUsage blocks historical date with insufficient balance in tests/unit/stores/leaveUsage.spec.ts
- [X] T018 [P] [US1] Unit test: recordUsage blocks date before hire date in tests/unit/stores/leaveUsage.spec.ts
- [X] T019 [P] [US1] Unit test: recordUsage blocks date before first entitlement in tests/unit/stores/leaveUsage.spec.ts

**Checkpoint**: 时点余额计算功能完整，历史休假记录验证正确

---

## Phase 4: User Story 2 - 历史休假记录对当前余额的正确影响 (Priority: P1)

**Goal**: 确保补录/删除历史记录后，当前余额计算正确反映历史变更

**Independent Test**: 补录历史休假后，验证当前余额正确扣减；删除历史记录后，验证余额正确恢复

### Implementation for User Story 2

- [X] T020 [US2] Verify recalculateAllEntitlements correctly processes historical usages in src/stores/leaveEntitlement.ts
- [X] T021 [US2] Ensure deleteUsage triggers recalculation correctly in src/stores/leaveUsage.ts
- [X] T022 [US2] Verify loadEntitlements recalculates on data load in src/stores/leaveEntitlement.ts

### Tests for User Story 2

- [X] T023 [P] [US2] Integration test: Add historical usage, verify current balance updated in tests/unit/stores/leaveUsage.spec.ts
- [X] T024 [P] [US2] Integration test: Add historical usage of expired entitlement, verify current balance unchanged in tests/unit/stores/leaveUsage.spec.ts
- [X] T025 [P] [US2] Integration test: Delete historical usage, verify current balance restored in tests/unit/stores/leaveUsage.spec.ts
- [X] T026 [US2] End-to-end test: Multiple historical records affect current balance correctly in tests/component/leave/LeaveUsageForm.spec.ts

**Checkpoint**: 历史记录与当前余额的一致性得到保证

---

## Phase 5: User Story 3 - 跨年度历史记录的正确处理 (Priority: P2)

**Goal**: 验证FIFO扣减逻辑在历史时点和跨多个额度批次时的正确性

**Independent Test**: 为长期在职员工补录跨越多个年假发放周期的休假，验证FIFO分配正确

### Implementation for User Story 3

- [X] T027 [US3] Review and validate FIFO allocation logic in calculateBalanceAtDate in src/stores/leaveEntitlement.ts
- [X] T028 [US3] Ensure entitlement sorting (by expiry date) is correct in src/stores/leaveEntitlement.ts
- [X] T029 [US3] Verify manual adjustments (permanent entitlements) are allocated last in src/stores/leaveEntitlement.ts

### Tests for User Story 3

- [X] T030 [P] [US3] Unit test: FIFO allocation across multiple entitlement batches in tests/unit/stores/leaveEntitlement.spec.ts
- [X] T031 [P] [US3] Unit test: Historical usage consumes earliest expiring entitlement first in tests/unit/stores/leaveEntitlement.spec.ts
- [X] T032 [P] [US3] Unit test: Manual entitlements (null expiry) are consumed last in tests/unit/stores/leaveEntitlement.spec.ts
- [X] T033 [US3] Integration test: Multiple historical records across years allocate correctly in tests/unit/stores/leaveUsage.spec.ts

**Checkpoint**: 跨年度和多批次额度的FIFO分配逻辑验证通过

---

## Phase 6: UI Enhancement (Optional - 可选)

**Purpose**: 改进用户界面以显示时点余额信息（提升用户体验，但非必需）

- [ ] T034 [P] Display point-in-time balance when date is selected in src/components/leave/LeaveUsageForm.vue
- [ ] T035 [P] Show detailed balance breakdown in error messages in src/components/leave/LeaveUsageForm.vue
- [ ] T036 Update LeaveUsageForm component tests in tests/component/leave/LeaveUsageForm.spec.ts

---

## Phase 7: Polish & Validation

**Purpose**: 最终验证、文档和代码质量

- [X] T037 [P] Run all existing tests to ensure no regression (npm run test)
- [X] T038 [P] Run type checking (npm run type-check)
- [X] T039 [P] Run linter (npm run lint)
- [ ] T040 Manual test: Scenario 1 from spec.md - 张三 2024-09-15 历史记录
- [ ] T041 Manual test: Scenario 2 from spec.md - 李四 入职不满6个月
- [ ] T042 Manual test: Scenario 3 from spec.md - 王五 余额不足
- [ ] T043 Manual test: Scenario 4 from spec.md - 赵六 多次历史记录
- [ ] T044 Manual test: US2 Scenario 1 - 补录后当前余额变化
- [ ] T045 Manual test: US2 Scenario 2 - 已过期额度扣减
- [ ] T046 Manual test: US2 Scenario 3 - 删除后余额恢复
- [ ] T047 Code review and refactoring
- [ ] T048 Update CHANGELOG.md or README.md if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 可立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - 阻塞所有用户故事
- **User Story 1 (Phase 3)**: 依赖Foundational完成 - 核心功能，优先级最高
- **User Story 2 (Phase 4)**: 依赖US1完成 - 验证US1的副作用
- **User Story 3 (Phase 5)**: 依赖US1完成 - 可与US2并行
- **UI Enhancement (Phase 6)**: 依赖US1完成 - 完全可选
- **Polish (Phase 7)**: 依赖所有必需功能完成

### User Story Dependencies

- **User Story 1 (P1)**: 基础功能，无依赖其他用户故事
- **User Story 2 (P1)**: 依赖US1的实现，验证其正确性
- **User Story 3 (P2)**: 依赖US1的实现，可与US2并行进行

### Within Each Phase

- Phase 2: 所有标记[P]的任务可并行执行（不同文件）
- Phase 3-5: 实现任务按顺序执行（同一文件），测试任务可并行
- Phase 7: 自动化测试可并行，手动测试需按顺序

### Parallel Opportunities

```bash
# Phase 2 - 可同时进行:
T003: types/leave.ts
T004: types/errors.ts
T005: utils/dateUtils.ts
T006: utils/leaveCalculator.ts

# Phase 3 Tests - 可同时编写:
T013-T019: 7个单元测试（不同describe块）

# Phase 4 Tests - 可同时编写:
T023-T025: 3个集成测试

# Phase 5 Tests - 可同时编写:
T030-T032: 3个FIFO测试

# Phase 7 - 自动化测试可同时运行:
T037: npm run test
T038: npm run type-check
T039: npm run lint
```

---

## Parallel Example: User Story 1

```bash
# 1. 并行编写基础类型（Phase 2）
Task T003: types/leave.ts
Task T004: types/errors.ts
Task T005: utils/dateUtils.ts
Task T006: utils/leaveCalculator.ts

# 2. 实现核心逻辑（Phase 3 - 串行，因为在同一文件）
Task T007: calculateBalanceAtDate
Task T008: modify calculateBalance
Task T009-T012: update recordUsage

# 3. 并行编写所有测试（Phase 3）
Task T013: calculateBalanceAtDate with historical date
Task T014: filter expired entitlements
Task T015: date before first grant
Task T016: allow sufficient balance
Task T017: block insufficient balance
Task T018: block before hire date
Task T019: block before entitlement
```

---

## Implementation Strategy

### MVP First (最小可行产品)

1. ✅ Complete Phase 1: Setup (1小时)
2. ✅ Complete Phase 2: Foundational (2-3小时)
3. ✅ Complete Phase 3: User Story 1 (3-4小时)
4. **STOP and VALIDATE**: 测试所有US1场景
5. 如果通过，这已经是一个可用的Bug修复

### Incremental Delivery (增量交付)

1. Phase 1-3 → **MVP**: 时点计算功能完整 ✅
2. + Phase 4 → **v1.1**: 余额一致性验证完整 ✅
3. + Phase 5 → **v1.2**: FIFO逻辑完全验证 ✅
4. + Phase 6 → **v1.3**: UI体验增强（可选）
5. + Phase 7 → **v1.4**: 最终发布版本

### Suggested Approach (建议方案)

**Day 1 (4-6小时)**:
- Phase 1: Setup (30分钟)
- Phase 2: Foundational (2小时)
- Phase 3: User Story 1 Implementation (2-3小时)
- 中间Checkpoint: 运行T013-T019测试

**Day 2 (2-4小时)**:
- Phase 3: User Story 1 Tests (1-2小时)
- Phase 4: User Story 2 (1小时)
- Phase 5: User Story 3 (1小时)
- Phase 7: Validation (1小时)

**Total Estimated Time**: 6-10小时（1-2个工作日）

---

## Notes

- [P] 标记的任务可以并行执行（不同文件）
- [Story] 标签将任务映射到具体的用户故事
- 每个用户故事都应该可以独立完成和测试
- 建议在实现前先编写测试（TDD）
- 每完成一个checkpoint就提交代码
- Phase 6 (UI Enhancement) 完全可选，不影响核心功能
- 优先完成Phase 1-5，Phase 6可以后续迭代添加

---

## Success Criteria Checklist

完成以下所有项即可认为功能完整：

- [X] **SC-001**: HR管理员能够正确补录任意历史日期的休假记录，验证准确率100%
- [X] **SC-002**: 补录历史休假记录后，员工当前年假余额计算准确率100%
- [X] **SC-003**: 系统能够在1秒内完成基于任意历史时点的年假余额计算
- [X] **SC-004**: 用户在补录历史休假时能看到详细的错误提示信息
- [X] **SC-005**: 删除历史休假记录后，系统能够在2秒内完成余额重新计算
- [X] **SC-006**: 系统正确处理100%的边界情况（入职前、有效期外、余额不足）
- [X] **SC-007**: 所有现有测试继续通过（无回归）
