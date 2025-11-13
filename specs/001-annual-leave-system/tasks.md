# Tasks: 员工年假统计系统

**Input**: Design documents from `/specs/001-annual-leave-system/`
**Prerequisites**: plan.md (tech stack), spec.md (user stories), data-model.md (entities), contracts/ (services)

**Tests**: 本项目包含测试任务。所有测试任务标注为可选,按照 TDD 原则应在实现前编写。

**Organization**: 任务按用户故事分组,每个故事可独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行 (不同文件,无依赖)
- **[Story]**: 所属用户故事 (US1, US2, US3, US4, US5)
- 所有描述包含精确文件路径

## Path Conventions

- **项目类型**: Vue 3 单页应用 (SPA)
- **源码路径**: `src/` (根目录)
- **测试路径**: `tests/` (根目录)
- **数据文件**: `public/data/` (JSON 存储)

---

## Phase 1: Setup (项目初始化)

**Purpose**: 项目基础设施和开发环境配置

- [ ] T001 验证 Node.js 版本 (^20.19.0 或 >=22.12.0) 和 pnpm 已安装
- [ ] T002 初始化 Vite + Vue 3 + TypeScript 项目 (如未初始化)
- [ ] T003 [P] 配置 TypeScript strict mode 在 tsconfig.json
- [ ] T004 [P] 配置 ESLint + Prettier 在 eslint.config.js
- [ ] T005 [P] 配置 Vitest 测试框架在 vitest.config.ts
- [ ] T006 [P] 安装 Pinia 3.x 和 Vue Router 4.x 依赖
- [ ] T007 [P] 安装 Vue Test Utils 和 @vitest/ui 开发依赖
- [ ] T008 创建项目目录结构: src/{models,stores,services,components,views,utils,router}, tests/{unit,component}, public/data

---

## Phase 2: Foundational (核心基础设施)

**Purpose**: 所有用户故事依赖的核心基础代码

**⚠️ CRITICAL**: 此阶段完成前,不能开始任何用户故事实现

### 数据模型定义

- [ ] T009 [P] 创建 Employee 接口和 EmployeeStatus 枚举在 src/models/Employee.ts
- [ ] T010 [P] 创建 LeaveEntitlement 接口和 EntitlementStatus 枚举在 src/models/LeaveEntitlement.ts
- [ ] T011 [P] 创建 LeaveUsage 接口和 LeaveType 枚举在 src/models/LeaveUsage.ts
- [ ] T012 [P] 创建 LeaveAdjustment 接口和 AdjustmentType 枚举在 src/models/LeaveAdjustment.ts
- [ ] T013 [P] 创建 LeaveBalance 聚合接口在 src/models/LeaveBalance.ts

### 核心工具函数

- [ ] T014 [P] 实现日期工具函数在 src/utils/dateUtils.ts (日期加减、差值计算、周年日计算)
- [ ] T015 [P] 实现验证器函数在 src/utils/validators.ts (员工信息验证、年假使用验证)
- [ ] T016 [P] 实现 UUID 生成函数在 src/utils/idGenerator.ts

### 测试基础设施

- [ ] T017 [P] 创建 dateUtils 单元测试在 tests/unit/utils/dateUtils.spec.ts
- [ ] T018 [P] 创建 validators 单元测试在 tests/unit/utils/validators.spec.ts

### 核心服务层

- [ ] T019 实现 leaveCalculator 服务在 src/services/leaveCalculator.ts (calculateTenure, getAnnualLeaveDays, calculateNextLeaveGrantDate, calculateLeaveEntitlements, calculateLeaveBalance)
- [ ] T020 [P] 实现 leaveValidator 服务在 src/services/leaveValidator.ts (validateEmployee, validateLeaveUsage, validateLeaveAdjustment)
- [ ] T021 [P] 实现 expiryManager 服务在 src/services/expiryManager.ts (checkExpiry, getExpiringSoon, sortByExpiry)
- [ ] T022 实现 storageService 服务在 src/services/storageService.ts (loadEmployees, saveEmployees, loadLeaves, saveLeaves, exportToJSON, importFromJSON)

### 服务层测试

- [ ] T023 [P] 创建 leaveCalculator 单元测试在 tests/unit/services/leaveCalculator.spec.ts
- [ ] T024 [P] 创建 leaveValidator 单元测试在 tests/unit/services/leaveValidator.spec.ts
- [ ] T025 [P] 创建 expiryManager 单元测试在 tests/unit/services/expiryManager.spec.ts

### 应用基础设施

- [ ] T026 配置 Pinia store 在 src/main.ts
- [ ] T027 配置 Vue Router 在 src/router/index.ts (创建基础路由结构)
- [ ] T028 [P] 创建 App.vue 根组件 (包含导航和 RouterView)
- [ ] T029 [P] 创建初始 JSON 数据文件在 public/data/employees.json 和 public/data/leaves.json

**Checkpoint**: 基础设施完成 - 用户故事可以并行开始实现

---

## Phase 3: User Story 1 - 添加员工并自动计算年假额度 (Priority: P1) 🎯 MVP

**Goal**: HR管理员能够添加员工,系统自动根据入职日期计算年假额度

**Independent Test**: 添加员工 → 验证年假额度计算正确 → 验证不满6个月员工显示0天并提示下次发放日期

### 状态管理

- [ ] T030 [US1] 创建 employeeStore 在 src/stores/employeeStore.ts (employees state, activeEmployees computed, loadEmployees, addEmployee, updateEmployee, terminateEmployee 方法)

### UI 组件

- [ ] T031 [P] [US1] 创建 EmployeeForm 组件在 src/components/EmployeeForm.vue (姓名和入职日期表单,实时验证,提交/取消事件)
- [ ] T032 [P] [US1] 创建 EmployeeList 组件在 src/components/EmployeeList.vue (员工列表显示,年假额度显示,筛选在职/离职,select-employee 和 add-employee 事件)

### 页面视图

- [ ] T033 [US1] 创建 EmployeeListView 页面在 src/views/EmployeeListView.vue (集成 EmployeeList 和 EmployeeForm,调用 employeeStore)
- [ ] T034 [US1] 配置路由 /employees 指向 EmployeeListView 在 src/router/index.ts

### 组件测试

- [ ] T035 [P] [US1] 创建 EmployeeForm 组件测试在 tests/component/EmployeeForm.spec.ts
- [ ] T036 [P] [US1] 创建 EmployeeList 组件测试在 tests/component/EmployeeList.spec.ts

**Checkpoint**: 此时 User Story 1 完全可用 - 可添加员工,自动计算年假,可独立测试和演示

---

## Phase 4: User Story 2 - 查看和管理员工年假余额 (Priority: P1)

**Goal**: 管理员能查看员工年假余额详情,并支持手动调整

**Independent Test**: 查看员工年假余额 → 手动增加/减少年假 → 验证调整历史记录 → 验证余额更新正确

### 状态管理

- [ ] T037 [US2] 创建 leaveStore 在 src/stores/leaveStore.ts (entitlements, usages, adjustments state, calculateBalance, adjustLeave, recordLeaveUsage, checkExpiry 方法)

### UI 组件

- [ ] T038 [P] [US2] 创建 LeaveBalance 组件在 src/components/LeaveBalance.vue (显示总额度/已使用/剩余,下次发放日期,过期提醒,adjust-leave 和 view-history 事件)
- [ ] T039 [P] [US2] 创建 LeaveAdjustmentForm 组件在 src/components/LeaveAdjustmentForm.vue (调整类型选择,天数输入,原因输入,余额预览)
- [ ] T040 [P] [US2] 创建 LeaveHistoryTable 组件在 src/components/LeaveHistoryTable.vue (显示使用记录和调整记录,按时间降序,分页)
- [ ] T041 [P] [US2] 创建 ExpiryWarningCard 组件在 src/components/ExpiryWarningCard.vue (即将过期年假警告,倒计时显示)

### 页面视图

- [ ] T042 [US2] 创建 EmployeeDetailView 页面在 src/views/EmployeeDetailView.vue (员工基本信息,集成 LeaveBalance, LeaveHistoryTable, LeaveAdjustmentForm)
- [ ] T043 [US2] 配置路由 /employees/:id 指向 EmployeeDetailView 在 src/router/index.ts

### 组件测试

- [ ] T044 [P] [US2] 创建 LeaveBalance 组件测试在 tests/component/LeaveBalance.spec.ts
- [ ] T045 [P] [US2] 创建 LeaveAdjustmentForm 组件测试在 tests/component/LeaveAdjustmentForm.spec.ts

**Checkpoint**: User Stories 1 和 2 都完全可用 - 可查看余额,手动调整,查看历史

---

## Phase 5: User Story 3 - 申请和记录年假使用 (Priority: P2)

**Goal**: 管理员能记录员工年假使用,系统自动扣减余额

**Independent Test**: 记录全天休假 → 验证余额扣减 → 记录半天休假 → 验证小数计算 → 尝试超额使用 → 验证拒绝

### UI 组件

- [ ] T046 [P] [US3] 创建 LeaveUsageForm 组件在 src/components/LeaveUsageForm.vue (日期选择,类型选择(全天/上午/下午),备注输入,余额验证)

### 扩展功能

- [ ] T047 [US3] 在 leaveStore 中实现 recordLeaveUsage 方法 (FIFO 扣减逻辑,更新 usages 和 entitlements)
- [ ] T048 [US3] 在 EmployeeDetailView 中集成 LeaveUsageForm (添加"记录休假"按钮和模态框)

### 业务逻辑增强

- [ ] T049 [US3] 实现日期冲突检测在 leaveValidator.ts (同一天不能重复全天休假,半天不能重复)
- [ ] T050 [US3] 实现 FIFO 年假扣减逻辑在 leaveStore (优先扣减最早过期的额度)

### 组件测试

- [ ] T051 [P] [US3] 创建 LeaveUsageForm 组件测试在 tests/component/LeaveUsageForm.spec.ts

**Checkpoint**: User Stories 1, 2, 3 都完全可用 - 可记录休假,自动扣减,验证余额

---

## Phase 6: User Story 4 - 日历视图查看休假记录 (Priority: P2)

**Goal**: 通过日历可视化查看员工或团队的休假安排

**Independent Test**: 查看单人日历 → 验证休假标记正确 → 切换到团队日历 → 点击日期查看详情

### UI 组件

- [ ] T052 [US4] 创建 CalendarView 组件在 src/components/CalendarView.vue (月度日历 CSS Grid 布局,单人/团队模式,全天/半天视觉区分,日期点击事件)

### 页面视图

- [ ] T053 [US4] 创建 LeaveCalendarView 页面在 src/views/LeaveCalendarView.vue (集成 CalendarView,月份切换,模式切换,日期详情面板)
- [ ] T054 [US4] 配置路由 /calendar 指向 LeaveCalendarView 在 src/router/index.ts

### 日历逻辑

- [ ] T055 [US4] 实现日历数据计算函数在 src/utils/calendarUtils.ts (生成月度日期数组,按日期聚合休假记录)

### 组件测试

- [ ] T056 [P] [US4] 创建 CalendarView 组件测试在 tests/component/CalendarView.spec.ts

**Checkpoint**: User Stories 1-4 都完全可用 - 可视化查看休假安排,支持单人和团队模式

---

## Phase 7: User Story 5 - 年假有效期管理 (Priority: P3)

**Goal**: 系统自动检查年假有效期,提醒即将过期,自动标记过期

**Independent Test**: 创建即将过期年假 → 验证30天内提醒显示 → 模拟日期超过有效期 → 验证自动失效

### 有效期管理

- [ ] T057 [US5] 在 leaveStore 中实现定期检查过期年假逻辑 (应用启动时调用 checkExpiry)
- [ ] T058 [US5] 在 LeaveBalance 组件中集成 ExpiryWarningCard (显示即将过期提醒)
- [ ] T059 [US5] 在 main.ts 中添加应用启动时执行过期检查

### 自动年假发放

- [ ] T060 [US5] 在 leaveStore 中实现 autoGrantLeave 方法 (检查所有员工的入职周年日,自动创建新的 LeaveEntitlement)
- [ ] T061 [US5] 在 main.ts 中添加应用启动时执行自动发放检查

**Checkpoint**: 所有 5 个用户故事完全实现 - 完整的年假管理系统

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的优化和完善

### 报表功能

- [ ] T062 [P] 创建 StatisticsCard 组件在 src/components/StatisticsCard.vue (统计数据卡片:总员工、总年假、已使用等)
- [ ] T063 创建 LeaveReportsView 页面在 src/views/LeaveReportsView.vue (统计卡片,导出 CSV/JSON 功能)
- [ ] T064 配置路由 /reports 指向 LeaveReportsView 在 src/router/index.ts

### 数据导入/导出

- [ ] T065 [P] 在 storageService 中完善 exportToJSON 功能 (触发浏览器下载)
- [ ] T066 [P] 在 storageService 中完善 importFromJSON 功能 (文件上传,数据验证,合并策略)
- [ ] T067 在 LeaveReportsView 中添加导入/导出按钮

### UI/UX 优化

- [ ] T068 [P] 创建全局 CSS 变量和主题在 src/styles/theme.css
- [ ] T069 [P] 添加 loading 状态组件在 src/components/LoadingSpinner.vue
- [ ] T070 [P] 添加 toast 提示组件在 src/components/ToastNotification.vue
- [ ] T071 实现全局错误处理在 src/utils/errorHandler.ts

### 性能优化

- [ ] T072 [P] 为路由添加懒加载 (views 使用动态 import)
- [ ] T073 [P] 为 CalendarView 添加 v-memo 优化
- [ ] T074 [P] 实现 localStorage 和文件存储的 debounce 保存机制

### 文档和测试完善

- [ ] T075 [P] 添加 README.md 使用说明
- [ ] T076 [P] 补充关键业务逻辑的单元测试 (达到 80% 覆盖率)
- [ ] T077 运行 quickstart.md 中的手动测试场景,验证所有功能

### 代码质量

- [ ] T078 [P] 运行 `pnpm lint` 修复所有 linting 警告
- [ ] T079 [P] 运行 `pnpm type-check` 修复所有类型错误
- [ ] T080 运行 `pnpm build` 确保生产构建成功

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational ← BLOCKS all user stories
    ↓
Phase 3: User Story 1 (P1) ← MVP
    ↓ (optional, can be parallel)
Phase 4: User Story 2 (P1)
    ↓ (can be parallel)
Phase 5: User Story 3 (P2)
    ↓ (can be parallel)
Phase 6: User Story 4 (P2)
    ↓ (can be parallel)
Phase 7: User Story 5 (P3)
    ↓
Phase 8: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: 依赖 Phase 2 完成 - 无其他故事依赖
- **User Story 2 (P1)**: 依赖 Phase 2 和 User Story 1 (需要 employeeStore) - 可在 US1 完成后立即开始
- **User Story 3 (P2)**: 依赖 Phase 2 和 User Story 2 (需要 leaveStore) - 可在 US2 完成后立即开始
- **User Story 4 (P2)**: 依赖 Phase 2 和 User Story 3 (需要 usages 数据) - 可在 US3 完成后立即开始
- **User Story 5 (P3)**: 依赖 Phase 2 (需要 expiryManager) - 理论上可与其他故事并行,但建议在 US1-4 稳定后实施

### Within Each Phase

- 标记 [P] 的任务可以并行执行 (不同文件)
- 测试应在实现前编写 (TDD 原则)
- 组件测试可在组件实现后立即执行
- 每个 Phase 完成后有明确的 Checkpoint 可验证

---

## Parallel Opportunities

### Phase 1: Setup (8 tasks, 6 可并行)

```bash
# 可并行执行:
T003, T004, T005, T006, T007 (配置和依赖安装)
# 顺序执行:
T001 → T002 → T008
```

### Phase 2: Foundational (21 tasks, 18 可并行)

**数据模型** (5 可并行):
```bash
T009, T010, T011, T012, T013
```

**工具函数** (3 可并行):
```bash
T014, T015, T016
```

**工具函数测试** (2 可并行):
```bash
T017, T018
```

**服务层** (顺序执行核心服务,其他并行):
```bash
T019 (leaveCalculator) → T020, T021 (并行) → T022 (storageService)
```

**服务层测试** (3 可并行):
```bash
T023, T024, T025
```

**应用基础** (部分并行):
```bash
T026 → T027, T028, T029 (后三者可并行)
```

### Phase 3: User Story 1 (7 tasks, 4 可并行)

```bash
T030 → T031, T032 (并行) → T033 → T034 → T035, T036 (并行)
```

### Phase 4: User Story 2 (9 tasks, 6 可并行)

```bash
T037 → T038, T039, T040, T041 (4个组件并行) → T042 → T043 → T044, T045 (并行)
```

### Phase 5: User Story 3 (6 tasks, 2 可并行)

```bash
T046 (组件) 与 T047, T048, T049, T050 (逻辑) 可部分并行
最后 T051 (测试)
```

### Phase 6: User Story 4 (5 tasks, 2 可并行)

```bash
T052, T055 (并行) → T053 → T054 → T056
```

### Phase 7: User Story 5 (5 tasks, 顺序执行)

```bash
T057 → T058 → T059 → T060 → T061
```

### Phase 8: Polish (19 tasks, 13 可并行)

```bash
# 报表功能:
T062 → T063 → T064

# 导入导出:
T065, T066 (并行) → T067

# UI/UX:
T068, T069, T070 (并行) → T071

# 性能:
T072, T073, T074 (并行)

# 文档测试:
T075, T076 (并行) → T077

# 代码质量:
T078, T079 (并行) → T080
```

---

## Parallel Example: Phase 2 Foundational

在 Phase 2 中,可以大幅度并行执行以加速开发:

```bash
# 1. 启动所有数据模型创建 (5 个并行):
Task: "创建 Employee 接口在 src/models/Employee.ts"
Task: "创建 LeaveEntitlement 接口在 src/models/LeaveEntitlement.ts"
Task: "创建 LeaveUsage 接口在 src/models/LeaveUsage.ts"
Task: "创建 LeaveAdjustment 接口在 src/models/LeaveAdjustment.ts"
Task: "创建 LeaveBalance 接口在 src/models/LeaveBalance.ts"

# 2. 启动所有工具函数创建 (3 个并行):
Task: "实现日期工具函数在 src/utils/dateUtils.ts"
Task: "实现验证器函数在 src/utils/validators.ts"
Task: "实现 UUID 生成函数在 src/utils/idGenerator.ts"

# 3. 工具函数完成后,启动测试 (2 个并行):
Task: "创建 dateUtils 单元测试在 tests/unit/utils/dateUtils.spec.ts"
Task: "创建 validators 单元测试在 tests/unit/utils/validators.spec.ts"

# 4. 服务层有依赖,需部分顺序:
Task: "实现 leaveCalculator 服务" (先执行,其他服务依赖它)
然后并行:
Task: "实现 leaveValidator 服务"
Task: "实现 expiryManager 服务"
最后:
Task: "实现 storageService 服务"

# 5. 服务层测试可并行:
Task: "创建 leaveCalculator 单元测试"
Task: "创建 leaveValidator 单元测试"
Task: "创建 expiryManager 单元测试"
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

**目标**: 最快时间验证核心价值

1. ✅ Complete Phase 1: Setup (1-2 hours)
2. ✅ Complete Phase 2: Foundational (1-2 days, 可大量并行)
3. ✅ Complete Phase 3: User Story 1 (1 day)
4. **STOP and VALIDATE**:
   - 添加员工 → 验证年假计算
   - 测试边界情况 (6个月、6.5年、20天上限)
   - 演示给用户
5. 如果满意,继续 User Story 2

**MVP 交付物**: 可添加员工并自动计算年假的基础系统

---

### Incremental Delivery (逐步交付所有故事)

**推荐策略**: 按优先级逐步交付,每个故事都能独立演示

1. **Foundation** (Setup + Foundational) → 1-2 天
   - 交付物: 完整的类型定义、工具函数、核心服务、测试基础

2. **+ User Story 1** → 1 天
   - 交付物: MVP - 可添加员工,自动计算年假
   - 演示: 展示年假计算的准确性

3. **+ User Story 2** → 1 天
   - 交付物: 可查看余额详情,手动调整年假
   - 演示: 展示调整功能和历史追踪

4. **+ User Story 3** → 1 天
   - 交付物: 可记录年假使用,自动扣减
   - 演示: 展示全天/半天休假和余额扣减

5. **+ User Story 4** → 1-2 天
   - 交付物: 日历视图可视化
   - 演示: 展示单人和团队日历

6. **+ User Story 5** → 1 天
   - 交付物: 有效期管理和提醒
   - 演示: 展示过期检测和自动失效

7. **+ Polish** → 1-2 天
   - 交付物: 报表、导入/导出、性能优化
   - 演示: 完整系统演示

**总计**: 8-11 天 (单人开发)

---

### Parallel Team Strategy (多人协作)

**假设**: 3 名开发者,Phase 2 后可并行

1. **All Together**: Phase 1 + Phase 2 (1-2 天)
   - 共同完成基础设施
   - 代码审查确保一致性

2. **Parallel Development** (Foundation 完成后):
   - **Developer A**: User Story 1 + User Story 2 (2 天)
   - **Developer B**: User Story 3 + User Story 4 (2-3 天)
   - **Developer C**: User Story 5 + Polish (2-3 天)

3. **Integration & Testing** (1 天)
   - 集成所有故事
   - 运行完整测试套件
   - 修复集成问题

**总计**: 4-6 天 (3 人协作)

---

## Notes

- **[P] 标记**: 任务可并行执行,无文件冲突和依赖阻塞
- **[Story] 标记**: 任务归属的用户故事,便于追踪
- **独立性**: 每个用户故事设计为可独立实现和测试
- **TDD 原则**: 测试任务应在实现前编写并确保失败
- **Checkpoint**: 每个 Phase 结束有明确的验证点
- **提交策略**: 建议每完成一个任务或逻辑组提交一次
- **文件路径**: 所有任务包含精确的文件路径,可直接执行
- **避免**: 模糊任务、文件冲突、跨故事的强依赖

---

## Task Count Summary

| Phase | 任务数 | 可并行 | 预计时间 (单人) |
|-------|--------|--------|-----------------|
| Phase 1: Setup | 8 | 6 | 1-2 hours |
| Phase 2: Foundational | 21 | 18 | 1-2 days |
| Phase 3: User Story 1 | 7 | 4 | 1 day |
| Phase 4: User Story 2 | 9 | 6 | 1 day |
| Phase 5: User Story 3 | 6 | 2 | 1 day |
| Phase 6: User Story 4 | 5 | 2 | 1-2 days |
| Phase 7: User Story 5 | 5 | 0 | 1 day |
| Phase 8: Polish | 19 | 13 | 1-2 days |
| **总计** | **80** | **51 (64%)** | **8-11 days** |

**MVP (仅 US1)**: 36 任务,预计 2-3 天
**核心功能 (US1+US2)**: 45 任务,预计 3-4 天
**完整系统 (所有故事)**: 80 任务,预计 8-11 天

---

## Suggested Next Steps

1. **开始 MVP**: 执行 Phase 1 → Phase 2 → Phase 3
2. **验证 MVP**: 测试 User Story 1 的所有验收场景
3. **演示给用户**: 获取反馈,确认方向正确
4. **继续迭代**: 按优先级实现 User Story 2-5
5. **最终优化**: 完成 Phase 8 Polish

🚀 **准备好开始了!** 建议从 T001 开始,按顺序执行 Phase 1 和 Phase 2。
