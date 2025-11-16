# Component Contracts: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-13
**Type**: Vue 组件接口契约

## 概述

本文档定义系统所有 Vue 组件的 Props、Events、Slots 和暴露方法契约。所有组件使用 Vue 3 Composition API (`<script setup lang="ts">`)。

---

## 1. EmployeeList.vue

**职责**: 显示员工列表,支持筛选、排序和快速操作

### Props

```typescript
interface EmployeeListProps {
  employees: Employee[];          // 员工数组
  showTerminated?: boolean;       // 是否显示离职员工 (默认 false)
  highlightExpiring?: boolean;    // 是否高亮即将过期年假的员工 (默认 true)
}
```

### Events

```typescript
interface EmployeeListEmits {
  'select-employee': (employee: Employee) => void;  // 用户点击员工
  'add-employee': () => void;                       // 用户点击"添加员工"按钮
  'terminate-employee': (employeeId: string) => void; // 用户点击"离职"
}
```

### Slots

```typescript
// 自定义表格列
<slot name="actions" :employee="Employee">
  <!-- 默认: 查看详情、离职按钮 -->
</slot>
```

### 示例用法

```vue
<EmployeeList
  :employees="activeEmployees"
  :show-terminated="false"
  @select-employee="handleSelectEmployee"
  @add-employee="showAddEmployeeModal"
/>
```

---

## 2. EmployeeForm.vue

**职责**: 员工信息录入/编辑表单

### Props

```typescript
interface EmployeeFormProps {
  employee?: Employee;            // 编辑模式时传入现有员工
  mode: 'create' | 'edit';        // 表单模式
}
```

### Events

```typescript
interface EmployeeFormEmits {
  'submit': (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  'cancel': () => void;
}
```

### 表单验证

- 姓名: 必填,1-50 字符
- 入职日期: 必填,不能晚于当前日期
- 实时验证,提交前阻止非法数据

### 示例用法

```vue
<EmployeeForm
  mode="create"
  @submit="handleCreateEmployee"
  @cancel="closeModal"
/>
```

---

## 3. LeaveBalance.vue

**职责**: 显示员工年假余额卡片,包含总额度、已使用、剩余、即将过期提醒

### Props

```typescript
interface LeaveBalanceProps {
  employeeId: string;             // 员工 ID
  balance: LeaveBalance;          // 年假余额数据
  showDetails?: boolean;          // 是否显示详细批次信息 (默认 false)
}
```

### Events

```typescript
interface LeaveBalanceEmits {
  'adjust-leave': (employeeId: string) => void;  // 用户点击"手动调整"
  'view-history': (employeeId: string) => void;  // 用户点击"查看历史"
}
```

### 显示内容

- 总额度、已使用、剩余 (大数字突出显示)
- 下次发放日期和天数
- 即将过期提醒 (如有,红色警告图标)
- 操作按钮: "手动调整"、"查看历史"

### 示例用法

```vue
<LeaveBalance
  :employee-id="employee.id"
  :balance="leaveBalance"
  :show-details="true"
  @adjust-leave="showAdjustModal"
/>
```

---

## 4. LeaveAdjustmentForm.vue

**职责**: 手动调整年假的表单

### Props

```typescript
interface LeaveAdjustmentFormProps {
  employeeId: string;             // 员工 ID
  currentBalance: number;         // 当前余额
}
```

### Events

```typescript
interface LeaveAdjustmentFormEmits {
  'submit': (adjustment: Omit<LeaveAdjustment, 'id' | 'balanceBefore' | 'balanceAfter' | 'createdAt'>) => void;
  'cancel': () => void;
}
```

### 表单字段

- 调整类型: 单选 (增加/减少)
- 调整天数: 数字输入,支持 0.5 步进
- 调整原因: 文本框,必填,1-200 字符
- 预览: 显示"调整前余额 → 调整后余额"

### 示例用法

```vue
<LeaveAdjustmentForm
  :employee-id="employee.id"
  :current-balance="balance.remainingDays"
  @submit="handleAdjustLeave"
  @cancel="closeModal"
/>
```

---

## 5. LeaveUsageForm.vue

**职责**: 记录年假使用的表单

### Props

```typescript
interface LeaveUsageFormProps {
  employeeId: string;             // 员工 ID
  currentBalance: number;         // 当前剩余余额
  existingUsages?: LeaveUsage[];  // 已有的休假记录 (用于验证日期冲突)
}
```

### Events

```typescript
interface LeaveUsageFormEmits {
  'submit': (usage: Omit<LeaveUsage, 'id' | 'entitlementIds' | 'createdAt'>) => void;
  'cancel': () => void;
}
```

### 表单字段

- 休假日期: 日期选择器
- 休假类型: 单选 (全天/上午半天/下午半天)
- 休假天数: 自动计算 (全天=1, 半天=0.5),只读
- 备注: 文本框,可选

### 验证

- 日期不能是未来日期
- 余额不足时阻止提交
- 检测同一天的休假冲突

### 示例用法

```vue
<LeaveUsageForm
  :employee-id="employee.id"
  :current-balance="balance.remainingDays"
  :existing-usages="usages"
  @submit="handleRecordLeave"
  @cancel="closeModal"
/>
```

---

## 6. CalendarView.vue

**职责**: 月度日历视图,显示休假记录

### Props

```typescript
interface CalendarViewProps {
  usages: LeaveUsage[];           // 休假记录数组
  employees: Employee[];          // 员工列表 (用于显示姓名)
  currentMonth?: Date;            // 当前显示的月份 (默认当前月)
  mode?: 'single' | 'team';       // 显示模式 (单人/团队,默认 team)
  filterEmployeeId?: string;      // 单人模式时的员工 ID
}
```

### Events

```typescript
interface CalendarViewEmits {
  'select-date': (date: Date) => void;           // 用户点击日期
  'prev-month': () => void;                      // 切换到上个月
  'next-month': () => void;                      // 切换到下个月
  'view-details': (usage: LeaveUsage) => void;   // 查看休假详情
}
```

### 显示逻辑

- **团队模式 (`team`)**:
  - 每个日期格子显示当天休假的员工数量
  - 点击日期弹出当天休假的员工列表

- **单人模式 (`single`)**:
  - 只显示指定员工的休假
  - 全天休假: 整个格子填充颜色
  - 半天休假: 格子上半部分/下半部分填充颜色

### 样式

- 全天休假: 蓝色背景
- 上午半天: 蓝色渐变 (上半部分)
- 下午半天: 蓝色渐变 (下半部分)
- 周末: 灰色背景
- 今天: 边框高亮

### 示例用法

```vue
<CalendarView
  :usages="allUsages"
  :employees="employees"
  mode="team"
  @select-date="handleSelectDate"
/>
```

---

## 7. LeaveHistoryTable.vue

**职责**: 显示员工的年假历史记录 (使用、调整)

### Props

```typescript
interface LeaveHistoryTableProps {
  employeeId: string;
  usages: LeaveUsage[];
  adjustments: LeaveAdjustment[];
  entitlements: LeaveEntitlement[];
}
```

### Events

```typescript
interface LeaveHistoryTableEmits {
  'delete-usage': (usageId: string) => void;  // 删除休假记录 (可选功能)
}
```

### 显示内容

- 混合显示使用记录和调整记录,按时间降序
- 列: 时间、类型 (使用/调整)、天数、原因/备注、余额变化
- 支持分页 (如果记录超过 50 条)

### 示例用法

```vue
<LeaveHistoryTable
  :employee-id="employee.id"
  :usages="usages"
  :adjustments="adjustments"
  :entitlements="entitlements"
/>
```

---

## 8. ExpiryWarningCard.vue

**职责**: 显示即将过期年假的警告卡片

### Props

```typescript
interface ExpiryWarningCardProps {
  expiringSoon: LeaveEntitlement[];  // 即将过期的额度
  employeeName: string;              // 员工姓名
}
```

### Events

```typescript
interface ExpiryWarningCardEmits {
  'dismiss': () => void;                        // 用户关闭提醒
  'view-details': (entitlement: LeaveEntitlement) => void;
}
```

### 显示逻辑

- 如果 `expiringSoon` 为空,不渲染
- 显示每批即将过期的年假和剩余天数
- 警告图标和倒计时 (如 "15 天后过期")

### 示例用法

```vue
<ExpiryWarningCard
  v-if="balance.expiringSoon.length > 0"
  :expiring-soon="balance.expiringSoon"
  :employee-name="employee.name"
  @dismiss="hideWarning"
/>
```

---

## 9. StatisticsCard.vue

**职责**: 显示统计数据卡片 (如总员工数、总年假使用天数等)

### Props

```typescript
interface StatisticsCardProps {
  title: string;                  // 卡片标题
  value: number | string;         // 主要数值
  subtitle?: string;              // 副标题
  trend?: 'up' | 'down' | 'neutral'; // 趋势 (可选)
  icon?: string;                  // 图标 (可选)
}
```

### 示例用法

```vue
<StatisticsCard
  title="在职员工"
  :value="activeEmployees.length"
  subtitle="总员工"
  :trend="'up'"
  icon="users"
/>
```

---

## 页面级组件 (Views)

页面组件不定义 Props/Events,而是直接使用 stores 和组合上述基础组件。

### EmployeeListView.vue

**职责**: 员工列表页面

**布局**:
- 顶部: 搜索框、筛选器、"添加员工"按钮
- 主体: `<EmployeeList>` 组件
- 侧边栏 (可选): 快速统计

**使用的 stores**:
- `useEmployeeStore()`
- `useLeaveStore()`

---

### EmployeeDetailView.vue

**职责**: 员工详情页面

**布局**:
- 顶部: 员工基本信息卡片
- 左侧: `<LeaveBalance>` 组件
- 右侧: `<LeaveHistoryTable>` 组件
- 底部: 操作按钮 (记录休假、手动调整、编辑员工)

**路由参数**: `employeeId`

---

### LeaveCalendarView.vue

**职责**: 年假日历页面

**布局**:
- 顶部: 月份切换、视图模式切换 (团队/单人)
- 主体: `<CalendarView>` 组件
- 侧边栏: 日期详情面板 (点击日期后显示)

---

### LeaveReportsView.vue

**职责**: 年假报表页面

**布局**:
- 顶部: 统计卡片 (总员工、总年假、已使用、剩余)
- 中部: 图表 (可选,如年假使用趋势)
- 底部: 导出按钮 (导出 CSV/JSON)

---

## 通用组件规范

### 命名约定

- 组件文件名: PascalCase (如 `EmployeeList.vue`)
- Props: camelCase (如 `showTerminated`)
- Events: kebab-case (如 `select-employee`)

### 类型安全

- 所有 Props 必须定义 TypeScript 类型
- 使用 `defineProps<T>()` 和 `defineEmits<T>()`

### 示例组件模板

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { Employee } from '@/models/Employee';

interface Props {
  employees: Employee[];
  showTerminated?: boolean;
}

interface Emits {
  (e: 'select-employee', employee: Employee): void;
  (e: 'add-employee'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showTerminated: false
});

const emit = defineEmits<Emits>();

const filteredEmployees = computed(() => {
  if (props.showTerminated) return props.employees;
  return props.employees.filter(e => e.status === 'active');
});

function handleSelect(employee: Employee) {
  emit('select-employee', employee);
}
</script>

<template>
  <div class="employee-list">
    <!-- 组件内容 -->
  </div>
</template>

<style scoped>
/* 组件样式 */
</style>
```

---

## 组件测试要求

每个组件应有对应的测试文件 (`ComponentName.spec.ts`),覆盖:
1. Props 渲染正确性
2. Events 触发逻辑
3. 用户交互 (点击、输入等)
4. 边界条件 (空数据、极值等)

使用 `@vue/test-utils` 进行组件测试。
