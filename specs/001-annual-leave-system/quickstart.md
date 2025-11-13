# Quick Start Guide: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-13
**Branch**: `001-annual-leave-system`

## 目标受众

- **开发者**: 准备实现此功能的工程师
- **测试人员**: 了解系统功能以编写测试用例
- **产品经理**: 快速了解实现方案

## 前置条件

在开始开发前,确保已经:
1. ✅ 阅读 [spec.md](./spec.md) - 功能需求规格
2. ✅ 阅读 [plan.md](./plan.md) - 实现计划概览
3. ✅ 阅读 [research.md](./research.md) - 技术决策
4. ✅ Node.js 已安装 (^20.19.0 或 >=22.12.0)
5. ✅ pnpm 已安装 (`npm install -g pnpm`)

## 快速开始

### 1. 切换到功能分支

```bash
git checkout 001-annual-leave-system
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173 查看应用。

---

## 项目结构速览

```
src/
├── models/               # 数据模型定义
│   ├── Employee.ts
│   ├── LeaveEntitlement.ts
│   ├── LeaveUsage.ts
│   └── LeaveAdjustment.ts
├── services/             # 业务逻辑层
│   ├── leaveCalculator.ts   # 年假计算引擎
│   ├── leaveValidator.ts    # 验证逻辑
│   ├── expiryManager.ts     # 有效期管理
│   └── storageService.ts    # 本地存储
├── stores/               # Pinia 状态管理
│   ├── employeeStore.ts
│   └── leaveStore.ts
├── components/           # Vue 组件
│   ├── EmployeeList.vue
│   ├── EmployeeForm.vue
│   ├── LeaveBalance.vue
│   ├── CalendarView.vue
│   └── ...
├── views/                # 页面级组件
│   ├── EmployeeListView.vue
│   ├── EmployeeDetailView.vue
│   ├── LeaveCalendarView.vue
│   └── LeaveReportsView.vue
└── router/
    └── index.ts          # 路由配置

public/data/              # 本地 JSON 数据
├── employees.json
└── leaves.json

tests/                    # 测试文件
├── unit/
│   ├── services/
│   └── utils/
└── component/
```

---

## 开发顺序建议

按照以下顺序实现功能,每个阶段都是可独立测试的:

### Phase 1: 核心数据模型和服务 (P1 - 最高优先级)

**目标**: 实现年假计算引擎和数据存储

**任务**:
1. 创建数据模型接口 (`src/models/`)
   - `Employee.ts`
   - `LeaveEntitlement.ts`
   - `LeaveUsage.ts`
   - `LeaveAdjustment.ts`

2. 实现核心服务 (`src/services/`)
   - `leaveCalculator.ts` - 年假计算逻辑
     - `calculateTenure()`
     - `getAnnualLeaveDays()`
     - `calculateNextLeaveGrantDate()`
     - `calculateLeaveEntitlements()`
   - `dateUtils.ts` - 日期工具函数

3. 编写单元测试
   - `tests/unit/services/leaveCalculator.spec.ts`
   - `tests/unit/utils/dateUtils.spec.ts`

**验收标准**:
- ✅ 所有年假计算规则的单元测试通过 (见 spec.md FR-002)
- ✅ 日期计算精确到天,考虑闰年
- ✅ 测试覆盖率 >= 90%

**预计时间**: 1-2 天

---

### Phase 2: 员工管理功能 (P1)

**目标**: 实现员工的添加、查看、离职操作

**任务**:
1. 实现存储服务
   - `storageService.ts` - localStorage + JSON 文件导入/导出

2. 创建 Pinia store
   - `employeeStore.ts`
     - `loadEmployees()`
     - `addEmployee()`
     - `updateEmployee()`
     - `terminateEmployee()`

3. 实现 UI 组件
   - `EmployeeList.vue` - 员工列表
   - `EmployeeForm.vue` - 员工表单
   - `EmployeeListView.vue` - 列表页面

4. 配置路由
   - `/employees` - 员工列表页

**验收标准**:
- ✅ 能够添加员工并自动计算年假额度 (User Story 1)
- ✅ 数据持久化到 localStorage
- ✅ 离职员工不在列表中显示,但可通过筛选查看

**预计时间**: 2-3 天

---

### Phase 3: 年假余额管理 (P1)

**目标**: 显示年假余额,支持手动调整

**任务**:
1. 创建 Pinia store
   - `leaveStore.ts`
     - `calculateBalance()`
     - `adjustLeave()`
     - `loadLeaveData()`

2. 实现验证服务
   - `leaveValidator.ts`
     - `validateLeaveAdjustment()`

3. 实现 UI 组件
   - `LeaveBalance.vue` - 年假余额卡片
   - `LeaveAdjustmentForm.vue` - 手动调整表单
   - `EmployeeDetailView.vue` - 员工详情页

4. 配置路由
   - `/employees/:id` - 员工详情页

**验收标准**:
- ✅ 余额显示准确 (总额度、已使用、剩余) (User Story 2)
- ✅ 手动调整功能正常,记录审计日志
- ✅ 即将过期年假显示警告

**预计时间**: 2-3 天

---

### Phase 4: 年假使用记录 (P2)

**目标**: 记录年假使用,自动扣减余额

**任务**:
1. 扩展 leaveStore
   - `recordLeaveUsage()`
   - `validateLeaveUsage()`

2. 实现 UI 组件
   - `LeaveUsageForm.vue` - 休假记录表单
   - `LeaveHistoryTable.vue` - 历史记录表

3. 扩展员工详情页
   - 添加"记录休假"按钮和历史记录显示

**验收标准**:
- ✅ 能够记录全天和半天休假 (User Story 3)
- ✅ 余额不足时阻止提交
- ✅ 同一天不能重复记录
- ✅ 优先扣减即将过期的年假 (FIFO)

**预计时间**: 2-3 天

---

### Phase 5: 日历视图 (P2)

**目标**: 可视化显示休假安排

**任务**:
1. 实现日历组件
   - `CalendarView.vue` - 月度日历
     - CSS Grid 布局
     - 支持团队/单人模式切换
     - 区分全天/半天显示

2. 创建日历页面
   - `LeaveCalendarView.vue`

3. 配置路由
   - `/calendar` - 日历页面

**验收标准**:
- ✅ 日历正确显示休假记录 (User Story 4)
- ✅ 全天/半天休假有视觉区分
- ✅ 点击日期可查看详情
- ✅ 加载时间 < 2s (50 员工数据)

**预计时间**: 3-4 天

---

### Phase 6: 年假有效期管理 (P3)

**目标**: 自动处理年假过期,提醒即将过期

**任务**:
1. 实现过期管理服务
   - `expiryManager.ts`
     - `checkExpiry()`
     - `getExpiringSoon()`

2. 实现 UI 组件
   - `ExpiryWarningCard.vue` - 过期提醒卡片

3. 添加定时任务
   - 应用启动时检查过期
   - (可选) 使用 Web Worker 定期检查

**验收标准**:
- ✅ 过期年假自动失效 (User Story 5)
- ✅ 30 天内过期的年假显示提醒
- ✅ 使用年假时优先扣减即将过期的额度

**预计时间**: 1-2 天

---

### Phase 7: 报表和导入/导出 (增强功能)

**目标**: 提供数据导入/导出和统计报表

**任务**:
1. 扩展 storageService
   - `exportToJSON()`
   - `importFromJSON()`

2. 创建报表页面
   - `LeaveReportsView.vue`
   - `StatisticsCard.vue` - 统计卡片

3. 配置路由
   - `/reports` - 报表页面

**验收标准**:
- ✅ 能够导出员工和年假数据为 JSON
- ✅ 能够导入 JSON 文件恢复数据
- ✅ 显示关键统计指标 (总员工、总年假、使用率等)

**预计时间**: 1-2 天

---

## 测试策略

### 单元测试 (必须)

**覆盖范围**:
- 所有 `services/` 下的业务逻辑
- 所有 `utils/` 下的工具函数

**工具**: Vitest

**运行命令**:
```bash
pnpm test:unit
```

**目标覆盖率**: >= 80%

---

### 组件测试 (推荐)

**覆盖范围**:
- 关键组件: `CalendarView.vue`, `EmployeeList.vue`
- 表单组件: `EmployeeForm.vue`, `LeaveUsageForm.vue`

**工具**: Vitest + Vue Test Utils

**运行命令**:
```bash
pnpm test:component
```

---

### 手动测试

**关键测试场景**:
1. **年假计算准确性**:
   - 添加不同入职日期的员工,验证年假天数正确
   - 测试边界情况 (入职正好 6 个月、6.5 年等)

2. **年假使用和扣减**:
   - 记录年假使用,验证余额正确扣减
   - 验证 FIFO 扣减逻辑 (优先扣减即将过期的额度)

3. **有效期管理**:
   - 修改系统日期模拟过期场景
   - 验证过期年假不再计入余额

4. **数据持久化**:
   - 刷新页面,验证数据仍然存在
   - 导出和导入 JSON,验证数据完整性

---

## 数据示例

### 初始化测试数据

创建 `public/data/employees.json`:
```json
{
  "employees": [
    {
      "id": "emp-001",
      "name": "张三",
      "hireDate": "2023-05-15T00:00:00.000Z",
      "status": "active",
      "createdAt": "2025-11-13T00:00:00.000Z",
      "updatedAt": "2025-11-13T00:00:00.000Z"
    },
    {
      "id": "emp-002",
      "name": "李四",
      "hireDate": "2019-01-01T00:00:00.000Z",
      "status": "active",
      "createdAt": "2025-11-13T00:00:00.000Z",
      "updatedAt": "2025-11-13T00:00:00.000Z"
    }
  ]
}
```

创建 `public/data/leaves.json`:
```json
{
  "entitlements": [
    {
      "id": "ent-001",
      "employeeId": "emp-001",
      "days": 10,
      "grantDate": "2023-11-15T00:00:00.000Z",
      "expiryDate": "2025-11-15T00:00:00.000Z",
      "status": "active",
      "usedDays": 0,
      "remainingDays": 10,
      "createdAt": "2023-11-15T00:00:00.000Z"
    }
  ],
  "usages": [],
  "adjustments": []
}
```

---

## 常见问题

### Q1: 如何模拟不同的当前日期进行测试?

A: 在 `leaveCalculator.ts` 中,所有需要当前日期的函数都接受 `currentDate` 参数,测试时传入模拟日期即可:

```typescript
// 生产代码
const balance = calculateLeaveBalance(employee, entitlements, new Date());

// 测试代码
const balance = calculateLeaveBalance(
  employee,
  entitlements,
  new Date('2025-12-31') // 模拟特定日期
);
```

---

### Q2: 如何处理闰年?

A: 使用 365.25 作为平均年天数:

```typescript
function calculateTenure(hireDate: Date, currentDate: Date): number {
  const diffMs = currentDate.getTime() - hireDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}
```

---

### Q3: 数据存储在哪里?

A: 双重存储策略:
- **运行时**: localStorage (快速访问)
- **持久化**: JSON 文件 (通过导出/导入功能)

用户可以定期导出 JSON 文件作为备份。

---

### Q4: 如何添加新的年假规则?

A: 修改 `leaveCalculator.ts` 中的 `getAnnualLeaveDays()` 函数和对应的单元测试。所有依赖此函数的代码会自动使用新规则。

---

### Q5: 如何支持多语言?

A: 当前版本仅支持中文。如需多语言,可以引入 `vue-i18n` 库,将所有字符串提取到语言包中。

---

## 进一步阅读

- [spec.md](./spec.md) - 完整功能规格
- [plan.md](./plan.md) - 实现计划详情
- [data-model.md](./data-model.md) - 数据模型详解
- [contracts/service-contracts.md](./contracts/service-contracts.md) - 服务接口契约
- [contracts/component-contracts.md](./contracts/component-contracts.md) - 组件接口契约
- [research.md](./research.md) - 技术决策背景

---

## 联系和反馈

如有问题或建议,请在项目中创建 Issue 或联系开发团队。

**开始开发**: 建议从 Phase 1 开始,逐步实现各个功能模块! 🚀
