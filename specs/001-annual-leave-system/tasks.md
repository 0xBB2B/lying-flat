# Tasks: 员工年假统计系统

**Input**: Design documents from `/specs/001-annual-leave-system/`
**Branch**: `001-annual-leave-system`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 测试任务已包含在内(根据plan.md要求使用Vitest进行单元测试和组件测试)

**Organization**: 任务按用户故事组织,确保每个故事可以独立实现和测试

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行(不同文件,无依赖)
- **[Story]**: 用户故事标签(US1, US2, US3等,映射到spec.md中的User Story)
- 所有任务描述包含具体文件路径

---

## Phase 1: Setup (项目初始化)

**目的**: 安装依赖和配置开发环境

- [ ] T001 安装date-fns依赖: `pnpm add date-fns`
- [ ] T002 安装Shadcn-vue组件库: `npx shadcn-vue@latest init`
- [ ] T003 [P] 添加Shadcn-vue核心组件: `npx shadcn-vue@latest add button input select dialog table alert tabs`
- [ ] T004 [P] 配置Vitest测试环境在vite.config.ts
- [ ] T005 创建基础目录结构: src/types/, src/utils/, src/stores/, src/composables/, src/components/, src/views/

---

## Phase 2: Foundational (基础设施 - 阻塞所有用户故事)

**目的**: 核心类型定义、工具函数和存储服务 - 必须在任何用户故事之前完成

**⚠️ 关键**: 此阶段完成前,所有用户故事工作均不能开始

### 类型定义

- [ ] T006 [P] 创建Employee类型定义在src/types/employee.ts
- [ ] T007 [P] 创建LeaveEntitlement类型定义在src/types/leave.ts
- [ ] T008 [P] 创建LeaveUsage类型定义在src/types/leave.ts
- [ ] T009 [P] 创建LeaveAdjustment类型定义在src/types/leave.ts
- [ ] T010 [P] 创建LeaveBalance聚合类型在src/types/leave.ts
- [ ] T011 导出所有类型在src/types/index.ts

### 核心工具函数

- [ ] T012 [P] 实现日期工具函数在src/utils/dateUtils.ts (基于date-fns)
- [ ] T013 [P] 实现年假计算引擎在src/utils/leaveCalculator.ts (calculateTenure, getAnnualLeaveDays, calculateNextLeaveGrantDate)
- [ ] T014 [P] 实现数据验证工具在src/utils/validation.ts (validateEmployee, validateLeaveUsage, validateLeaveAdjustment)
- [ ] T015 [P] 实现localStorage封装在src/utils/storage.ts (load, save, exportToJSON, importFromJSON)

### 核心工具函数测试

- [ ] T016 [P] 编写dateUtils单元测试在tests/unit/utils/dateUtils.spec.ts
- [ ] T017 [P] 编写leaveCalculator单元测试在tests/unit/utils/leaveCalculator.spec.ts (覆盖所有年假计算规则)
- [ ] T018 [P] 编写validation单元测试在tests/unit/utils/validation.spec.ts

### 有效期管理

- [ ] T019 实现年假有效期管理在src/composables/useLeaveExpiry.ts (checkExpiry, getExpiringSoon, sortByExpiry)

**Checkpoint**: 基础设施完成 - 用户故事实现现在可以并行开始

---

## Phase 3: User Story 1 - 添加员工并自动计算年假额度 (Priority: P1) 🎯 MVP

**目标**: HR管理员可以添加员工,系统根据入职日期自动计算年假额度

**独立测试标准**: 可以添加员工记录并验证系统是否正确计算年假额度,即使没有其他功能,这也能展示核心价值

### Pinia Store实现

- [ ] T020 [P] [US1] 创建employeeStore在src/stores/employee.ts (state, getters, actions: loadEmployees, addEmployee)
- [ ] T021 [P] [US1] 创建leaveEntitlementStore在src/stores/leaveEntitlement.ts (state, getters, actions: loadEntitlements, grantLeave, calculateBalance)
- [ ] T022 [US1] 编写employeeStore单元测试在tests/unit/stores/employee.spec.ts

### UI组件实现

- [ ] T023 [P] [US1] 创建EmployeeForm组件在src/components/employee/EmployeeForm.vue (姓名、入职日期输入,表单验证)
- [ ] T024 [P] [US1] 创建EmployeeList组件在src/components/employee/EmployeeList.vue (员工列表展示,支持筛选)
- [ ] T025 [P] [US1] 创建EmployeeCard组件在src/components/employee/EmployeeCard.vue (移动端卡片布局)

### 页面级组件

- [ ] T026 [US1] 创建EmployeeManagement视图在src/views/EmployeeManagement.vue (集成EmployeeList和EmployeeForm)
- [ ] T027 [US1] 配置路由在src/router/index.ts (添加/employees路由)

### 组件测试

- [ ] T028 [US1] 编写EmployeeForm组件测试在tests/component/employee/EmployeeForm.spec.ts

**Checkpoint**: 此时User Story 1应该完全可用且可独立测试 - 可以添加员工并看到自动计算的年假额度

---

## Phase 4: User Story 2 - 查看和管理员工年假余额 (Priority: P1)

**目标**: 管理员可以查看每个员工的年假余额信息,并手动调整年假以应对特殊情况

**独立测试标准**: 可以查看员工列表、检查年假余额显示是否正确,以及执行手动增减操作

### Pinia Store扩展

- [ ] T029 [P] [US2] 创建leaveAdjustmentStore在src/stores/leaveAdjustment.ts (state, getters, actions: loadAdjustments, addLeave, deductLeave)
- [ ] T030 [US2] 扩展leaveEntitlementStore添加addManualEntitlement和deductUsage方法

### UI组件实现

- [ ] T031 [P] [US2] 创建LeaveBalance组件在src/components/leave/LeaveBalance.vue (显示总额度、已使用、剩余、即将过期提醒)
- [ ] T032 [P] [US2] 创建LeaveAdjustmentForm组件在src/components/leave/LeaveAdjustmentForm.vue (手动增减年假表单)
- [ ] T033 [P] [US2] 创建LeaveHistory组件在src/components/leave/LeaveHistory.vue (显示调整历史)

### 页面级组件

- [ ] T034 [US2] 创建EmployeeDetail视图在src/views/EmployeeDetail.vue (显示员工详情、年假余额、调整表单)
- [ ] T035 [US2] 更新路由配置在src/router/index.ts (添加/employees/:id路由)

### 组件测试

- [ ] T036 [US2] 编写LeaveBalance组件测试在tests/component/leave/LeaveBalance.spec.ts

**Checkpoint**: User Story 1和2都应该独立工作 - 可以添加员工、查看余额、手动调整年假

---

## Phase 5: User Story 3 - 申请和记录年假使用 (Priority: P2)

**目标**: 员工或管理员可以记录年假使用,支持按整天或半天申请,系统自动扣减余额

**独立测试标准**: 可以为员工提交休假申请,并验证余额是否正确扣减

### Pinia Store扩展

- [ ] T037 [P] [US3] 创建leaveUsageStore在src/stores/leaveUsage.ts (state, getters, actions: loadUsages, recordUsage, deleteUsage)
- [ ] T038 [US3] 实现年假扣减逻辑(FIFO)在leaveEntitlementStore

### UI组件实现

- [ ] T039 [P] [US3] 创建LeaveUsageForm组件在src/components/leave/LeaveUsageForm.vue (日期选择、类型选择:全天/上午/下午)
- [ ] T040 [P] [US3] 创建LeaveUsageTable组件在src/components/leave/LeaveUsageTable.vue (显示使用历史)

### 页面级组件

- [ ] T041 [US3] 扩展EmployeeDetail视图添加"记录休假"功能和使用历史显示
- [ ] T042 [US3] 实现同一天重复休假验证逻辑

### 组件测试

- [ ] T043 [US3] 编写LeaveUsageForm组件测试在tests/component/leave/LeaveUsageForm.spec.ts
- [ ] T044 [US3] 编写leaveUsageStore单元测试在tests/unit/stores/leaveUsage.spec.ts

**Checkpoint**: User Story 1、2、3都应该独立工作 - 完整的年假管理流程(添加、查看、调整、使用)

---

## Phase 6: User Story 4 - 日历视图查看休假记录 (Priority: P2)

**目标**: 管理员和员工可以通过日历视图直观查看休假安排

**独立测试标准**: 可以查看日历并验证已记录的休假是否正确显示

### 日历组件实现

- [ ] T045 [P] [US4] 创建CalendarView组件在src/components/calendar/CalendarView.vue (CSS Grid布局,月度视图)
- [ ] T046 [P] [US4] 创建CalendarDay组件在src/components/calendar/CalendarDay.vue (日期格子,显示休假标记)
- [ ] T047 [US4] 实现日历数据转换逻辑(usages → calendar events)

### 页面级组件

- [ ] T048 [US4] 创建LeaveCalendar视图在src/views/LeaveCalendar.vue (集成CalendarView,支持单人/团队模式切换)
- [ ] T049 [US4] 更新路由配置在src/router/index.ts (添加/calendar路由)
- [ ] T050 [US4] 实现日历筛选逻辑(按员工、按月份)

### 响应式优化

- [ ] T051 [US4] 实现响应式断点Hook在src/composables/useResponsive.ts
- [ ] T052 [US4] 优化CalendarView移动端显示(紧凑布局、滑动支持)

### 组件测试

- [ ] T053 [US4] 编写CalendarView组件测试在tests/component/calendar/CalendarView.spec.ts

**Checkpoint**: 日历视图完全可用 - 可以直观查看所有员工的休假安排

---

## Phase 7: User Story 5 - 年假有效期管理 (Priority: P3)

**目标**: 系统跟踪年假有效期(2年),提醒即将过期的年假,过期后自动失效

**独立测试标准**: 可以设置不同有效期的年假记录,并验证系统是否正确提醒和处理过期年假

### 提醒逻辑实现

- [ ] T054 [P] [US5] 创建leaveReminderStore在src/stores/reminder.ts (state, getters, actions: checkReminders, dismissReminder)
- [ ] T055 [P] [US5] 实现年假过期检查composable在src/composables/useLeaveExpiry.ts (扩展已有逻辑)
- [ ] T056 [US5] 实现年假提醒composable在src/composables/useLeaveReminder.ts (即将过期提醒、年度最低使用提醒)

### UI组件实现

- [ ] T057 [P] [US5] 创建ExpiryWarningCard组件在src/components/leave/ExpiryWarningCard.vue (显示过期警告)
- [ ] T058 [P] [US5] 创建ReminderBanner组件在src/components/common/ReminderBanner.vue (顶部提醒横幅)

### 集成到现有页面

- [ ] T059 [US5] 在EmployeeDetail视图集成过期提醒显示
- [ ] T060 [US5] 在App.vue添加全局提醒检查(应用启动时、每日检查)
- [ ] T061 [US5] 实现年度最低使用提醒逻辑(10-12月期间检查当年消耗<5天的员工)

**Checkpoint**: 年假有效期管理完全可用 - 系统自动提醒过期和即将过期的年假

---

## Phase 8: 数据导入导出和统计报表 (增强功能)

**目的**: 提供数据备份、迁移和统计功能

### 存储服务扩展

- [ ] T062 [P] 创建storageStore在src/stores/storage.ts (saveAll, loadAll, exportData, importData)
- [ ] T063 [P] 实现JSON导出功能(触发浏览器下载)
- [ ] T064 实现JSON导入功能(文件验证、数据格式检查)

### UI组件实现

- [ ] T065 [P] 创建StatisticsCard组件在src/components/common/StatisticsCard.vue (显示统计数据)
- [ ] T066 [P] 创建ImportExportPanel组件在src/components/settings/ImportExportPanel.vue (导入导出按钮和说明)

### 页面级组件

- [ ] T067 创建Settings视图在src/views/Settings.vue (数据导入导出、统计报表)
- [ ] T068 更新路由配置在src/router/index.ts (添加/settings路由)

### 功能测试

- [ ] T069 编写storage单元测试在tests/unit/utils/storage.spec.ts (导出、导入、数据验证)

**Checkpoint**: 完整的数据管理功能 - 可以导出备份和导入数据

---

## Phase 9: 离职员工管理和UI完善

**目的**: 实现离职员工处理和全局UI优化

### 离职功能

- [ ] T070 [P] 扩展employeeStore添加terminateEmployee方法
- [ ] T071 [P] 在EmployeeDetail视图添加"标记离职"按钮
- [ ] T072 实现离职员工筛选逻辑(在EmployeeList中隐藏,可切换显示)
- [ ] T073 实现离职时未使用年假计算和显示

### 导航和布局

- [ ] T074 [P] 更新App.vue添加导航菜单(响应式:移动端汉堡菜单,桌面端侧边栏)
- [ ] T075 [P] 创建Home视图在src/views/Home.vue (仪表板:统计卡片、快速操作、提醒)
- [ ] T076 更新路由配置添加首页路由(/)

### 响应式UI优化

- [ ] T077 [P] 优化所有页面的移动端布局(使用Tailwind响应式断点)
- [ ] T078 [P] 优化EmployeeList移动端显示(卡片布局)和桌面端显示(表格布局)
- [ ] T079 实现表单组件的响应式布局(移动端单列,桌面端双列)

---

## Phase 10: Polish & Cross-Cutting Concerns

**目的**: 最终优化和质量保证

### 错误处理和用户体验

- [ ] T080 [P] 实现全局错误处理在App.vue (捕获未处理错误,显示友好提示)
- [ ] T081 [P] 添加Loading状态显示(所有异步操作)
- [ ] T082 [P] 添加Toast通知组件在src/components/common/Toast.vue (成功、错误、警告提示)
- [ ] T083 实现表单提交防重复逻辑

### 性能优化

- [ ] T084 [P] 优化CalendarView性能(使用v-memo缓存日期格子)
- [ ] T085 [P] 实现日历数据按日期索引(O(1)查询)
- [ ] T086 添加debounce到localStorage保存操作

### 自动化任务

- [ ] T087 实现自动年假发放逻辑(应用启动时检查并发放到期年假)
- [ ] T088 实现定期数据保存(用户操作后自动保存到localStorage)

### 代码质量

- [ ] T089 [P] 代码格式化和ESLint检查: `pnpm lint`
- [ ] T090 [P] TypeScript类型检查: `pnpm type-check`
- [ ] T091 运行所有测试并确保通过: `pnpm test`

### 文档和验证

- [ ] T092 根据quickstart.md验证所有测试场景
- [ ] T093 构建生产版本: `pnpm build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-7)**: 全部依赖Foundational阶段完成
  - 用户故事可以并行进行(如果有多人团队)
  - 或按优先级顺序执行(P1 → P2 → P3)
- **增强功能 (Phase 8-9)**: 依赖核心用户故事完成
- **Polish (Phase 10)**: 依赖所有期望的用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 在Foundational完成后可开始 - 无其他故事依赖
- **User Story 2 (P1)**: 在Foundational完成后可开始 - 与US1集成但可独立测试
- **User Story 3 (P2)**: 在Foundational完成后可开始 - 与US1/US2集成但可独立测试
- **User Story 4 (P2)**: 在US3完成后开始(需要休假记录数据) - 可独立测试日历显示
- **User Story 5 (P3)**: 在US1/US2完成后可开始 - 独立的提醒功能

### Within Each User Story

- Store实现 → UI组件实现 → 页面集成
- 测试可以与实现并行(先写测试,确保失败,然后实现)
- 标记[P]的任务可在用户故事内并行执行

### Parallel Opportunities

- **Phase 1**: T003, T004可并行
- **Phase 2类型定义**: T006-T010可并行
- **Phase 2工具函数**: T012-T015可并行
- **Phase 2测试**: T016-T018可并行
- **每个用户故事内**: 所有标记[P]的store、组件、测试可并行
- **用户故事间**: US1, US2可完全并行(不同团队成员);US3需要US1/US2的基础但可早期并行

---

## Parallel Example: Foundational Phase

```bash
# 同时创建所有类型定义:
Task: T006 - Employee类型
Task: T007 - LeaveEntitlement类型
Task: T008 - LeaveUsage类型
Task: T009 - LeaveAdjustment类型
Task: T010 - LeaveBalance类型

# 同时实现所有工具函数:
Task: T012 - dateUtils
Task: T013 - leaveCalculator
Task: T014 - validation
Task: T015 - storage

# 同时运行所有测试:
Task: T016 - dateUtils测试
Task: T017 - leaveCalculator测试
Task: T018 - validation测试
```

---

## Parallel Example: User Story 1

```bash
# 同时创建stores:
Task: T020 - employeeStore
Task: T021 - leaveEntitlementStore

# 同时创建UI组件:
Task: T023 - EmployeeForm
Task: T024 - EmployeeList
Task: T025 - EmployeeCard
```

---

## Implementation Strategy

### MVP First (仅User Story 1和2)

1. 完成Phase 1: Setup
2. 完成Phase 2: Foundational (关键 - 阻塞所有故事)
3. 完成Phase 3: User Story 1 (添加员工并计算年假)
4. 完成Phase 4: User Story 2 (查看余额和手动调整)
5. **停止并验证**: 独立测试US1和US2
6. 如果满意则部署/演示MVP

### Incremental Delivery (推荐)

1. Setup + Foundational → 基础完成
2. 添加US1 → 独立测试 → 部署/演示 (MVP!)
3. 添加US2 → 独立测试 → 部署/演示
4. 添加US3 → 独立测试 → 部署/演示 (完整年假管理)
5. 添加US4 → 独立测试 → 部署/演示 (增加日历视图)
6. 添加US5 → 独立测试 → 部署/演示 (完整功能)
7. 每个故事都增加价值而不破坏之前的故事

### Parallel Team Strategy (多人团队)

如果有多个开发者:

1. 团队一起完成Setup + Foundational
2. Foundational完成后:
   - 开发者A: User Story 1 + User Story 2 (核心功能)
   - 开发者B: User Story 3 (年假使用)
   - 开发者C: User Story 4 (日历视图)
3. 故事独立完成并集成

---

## Summary

**总任务数**: 93个任务
**按用户故事分布**:
- Phase 1 (Setup): 5个任务
- Phase 2 (Foundational): 14个任务 ⚠️ 阻塞所有用户故事
- Phase 3 (US1 - P1): 9个任务
- Phase 4 (US2 - P1): 8个任务
- Phase 5 (US3 - P2): 8个任务
- Phase 6 (US4 - P2): 9个任务
- Phase 7 (US5 - P3): 8个任务
- Phase 8 (增强): 8个任务
- Phase 9 (离职和UI): 9个任务
- Phase 10 (Polish): 14个任务

**并行机会**: 47个任务标记为[P],可在各自阶段内并行执行

**建议MVP范围**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2) = 36个任务
这提供了核心价值:添加员工、自动计算年假、查看余额、手动调整

**独立测试标准**: 每个用户故事都有明确的独立测试标准,确保可以单独验证功能

---

## Notes

- [P] = 可并行执行的任务(不同文件,无依赖)
- [Story] = 用户故事标签,用于追溯性
- 每个用户故事都应该可以独立完成和测试
- 测试先于实现,确保测试先失败
- 每个任务或逻辑组完成后提交代码
- 在任何检查点停止以独立验证故事
- 避免:模糊任务、同文件冲突、破坏独立性的跨故事依赖
