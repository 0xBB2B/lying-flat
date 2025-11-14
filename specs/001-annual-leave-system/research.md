# Technical Research: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-14
**Updated**: 2025-11-14 (根据澄清会议更新)

## 研究目的

在开始实现前,研究和确认关键技术决策,确保选择的技术栈和架构模式能够满足功能需求和性能目标。

## 1. 数据存储方案

### Decision: localStorage (主存储) + JSON文件导出/导入

**Rationale**:
- **澄清结果**: 用户明确选择localStorage作为主存储,JSON文件用于备份和迁移
- 无需后端服务器,降低部署复杂度
- 适合小型团队 (~100 员工) 的数据规模
- 支持离线使用
- localStorage API简单,浏览器原生支持

**实现方案**:
- 主存储: localStorage (key: `annual-leave-system:data`)
- 数据结构: 单一JSON对象包含所有实体
- 备份/迁移: 提供导出到JSON文件和从JSON文件导入的功能
- 版本控制: 数据包含版本号,支持未来迁移

**Alternatives considered**:
- **IndexedDB**: 功能强大但对于简单数据结构过于复杂
- **纯JSON文件**: 无法实时持久化,每次都需要用户手动保存
- **后端 API + 数据库**: 违反"纯前端"约束,增加部署复杂度

## 2. 日期处理库选择

### Decision: date-fns

**Rationale**:
- 年假计算涉及复杂的日期运算(周年计算、日期差值、有效期)
- date-fns提供tree-shakable的函数式API,只打包使用的函数
- TypeScript支持完善,类型安全
- Immutable设计,避免Date对象突变的副作用
- 比原生Date API更直观易读,减少错误

**Key Functions**:
- `addMonths`, `addYears`: 计算入职周年日
- `differenceInYears`, `differenceInMonths`, `differenceInDays`: 计算雇用年限
- `isAfter`, `isBefore`, `isSameDay`: 日期比较
- `format`, `parseISO`: 日期格式化和解析
- `startOfMonth`, `endOfMonth`, `eachDayOfInterval`: 日历视图辅助

**实现示例**:
```typescript
import { differenceInYears, differenceInMonths, addMonths, addYears, isAfter } from 'date-fns';

// 计算入职时长(以年和月表示)
function calculateTenure(hireDate: Date, currentDate: Date) {
  const years = differenceInYears(currentDate, hireDate);
  const months = differenceInMonths(currentDate, hireDate) % 12;
  return { years, months, totalMonths: differenceInMonths(currentDate, hireDate) };
}

// 根据入职月数获取年假天数
function getAnnualLeaveDays(totalMonths: number): number {
  if (totalMonths < 6) return 0;
  if (totalMonths < 18) return 10;
  if (totalMonths < 30) return 11;
  if (totalMonths < 42) return 12;
  if (totalMonths < 54) return 14;
  if (totalMonths < 66) return 16;
  if (totalMonths < 78) return 18;
  return 20;
}

// 计算年假有效期(获得日期+2年)
function getExpiryDate(grantDate: Date): Date {
  return addYears(grantDate, 2);
}
```

**Alternatives considered**:
- **原生Date API**: 容易出错(月份从0开始,时区问题),代码可读性差
- **Day.js**: 体积小但TypeScript支持一般,API与Moment类似(链式调用)
- **Luxon**: 功能强大但体积大(~67KB),对时区的强调超出项目需求

## 3. 日历组件方案

### Decision: 自定义日历组件 (基于 CSS Grid)

**Rationale**:
- 需求相对简单:显示月度视图,标记休假日期,区分全天/半天
- 使用 CSS Grid 可轻松实现日历布局 (7列 × N行)
- 完全控制样式和交互逻辑
- 避免引入大型日历库 (如 FullCalendar),减少包体积

**核心实现思路**:
```vue
<template>
  <div class="calendar-grid">
    <div class="calendar-header">
      <button @click="prevMonth">上月</button>
      <span>{{ currentMonth }}</span>
      <button @click="nextMonth">下月</button>
    </div>
    <div class="calendar-days">
      <div v-for="day in calendarDays" :key="day.date"
           :class="getDayClass(day)">
        {{ day.dayOfMonth }}
        <span v-if="hasLeave(day)" class="leave-indicator">
          {{ getLeaveType(day) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
</style>
```

**Alternatives considered**:
- **FullCalendar**: 功能强大但体积大 (~200KB),对于简单月视图来说过于复杂
- **Vue Cal**: Vue 专用日历库,但功能超出需求,且维护活跃度一般
- **v-calendar**: 功能全面但自定义样式较复杂

## 4. 状态管理架构

### Decision: Pinia stores 按功能域划分

**Rationale**:
- 遵循项目 [CLAUDE.md](../../CLAUDE.md) 要求,使用 Pinia Composition API 风格
- 按业务域划分 store,清晰的职责边界
- 支持模块化和独立测试

**Store 设计**:

```typescript
// employeeStore.ts
export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref<Employee[]>([]);
  const activeEmployees = computed(() =>
    employees.value.filter(e => e.status === 'active')
  );

  async function loadEmployees() { /* ... */ }
  async function addEmployee(employee: Employee) { /* ... */ }
  async function updateEmployee(id: string, updates: Partial<Employee>) { /* ... */ }
  async function terminateEmployee(id: string) { /* ... */ }

  return { employees, activeEmployees, loadEmployees, addEmployee, updateEmployee, terminateEmployee };
});

// leaveStore.ts
export const useLeaveStore = defineStore('leave', () => {
  const entitlements = ref<LeaveEntitlement[]>([]);
  const usages = ref<LeaveUsage[]>([]);
  const adjustments = ref<LeaveAdjustment[]>([]);

  function calculateBalance(employeeId: string): LeaveBalance { /* ... */ }
  async function recordLeaveUsage(usage: LeaveUsage) { /* ... */ }
  async function adjustLeave(adjustment: LeaveAdjustment) { /* ... */ }
  function checkExpiry() { /* ... */ }

  return { entitlements, usages, adjustments, calculateBalance, recordLeaveUsage, adjustLeave, checkExpiry };
});
```

**Alternatives considered**:
- **单一大 store**: 所有状态集中管理,不利于代码组织和测试
- **Vuex**: Vue 2 时代的状态管理,Pinia 是 Vue 3 官方推荐

## 5. 测试策略

### Decision: 业务逻辑单元测试 + 关键组件测试

**Rationale**:
- 年假计算逻辑复杂,必须通过单元测试保证正确性
- 日历组件涉及复杂的日期渲染,需要组件测试验证
- 使用 Vitest (Vite 原生支持) 获得最佳开发体验

**测试优先级**:
1. **高优先级 (必须测试)**:
   - `leaveCalculator.ts`: 年假计算规则
   - `leaveValidator.ts`: 余额验证、日期验证
   - `expiryManager.ts`: 有效期计算和过期处理
   - `dateUtils.ts`: 日期计算工具函数

2. **中优先级 (推荐测试)**:
   - `CalendarView.vue`: 日历渲染和交互
   - `EmployeeList.vue`: 列表过滤和排序
   - stores 的核心方法

3. **低优先级 (可选)**:
   - 简单的表单组件
   - UI 纯展示组件

**测试示例**:
```typescript
// leaveCalculator.spec.ts
describe('LeaveCalculator', () => {
  it('should calculate 10 days for employee with 6 months tenure', () => {
    const hireDate = new Date('2025-01-01');
    const currentDate = new Date('2025-07-01');
    const days = calculateAnnualLeaveDays(hireDate, currentDate);
    expect(days).toBe(10);
  });

  it('should calculate 20 days (cap) for employee with 7 years tenure', () => {
    const hireDate = new Date('2018-01-01');
    const currentDate = new Date('2025-11-13');
    const days = calculateAnnualLeaveDays(hireDate, currentDate);
    expect(days).toBe(20);
  });
});
```

**Alternatives considered**:
- **Jest**: 功能相似但需要额外配置,Vitest 与 Vite 原生集成更顺畅
- **端到端测试 (Cypress/Playwright)**: 对于小型内部工具来说成本过高,单元+组件测试已足够

## 6. UI 组件库选择

### Decision: Shadcn-vue

**Rationale**:
- **澄清结果**: 用户选择使用基于TailwindCSS的组件库
- Shadcn-vue是Vue 3原生的实现,基于Radix Vue(无头组件)
- 组件通过CLI复制到项目中,完全可控,无运行时依赖
- 使用TailwindCSS样式,与项目技术栈完美契合
- TypeScript原生支持,类型安全
- 内置可访问性(ARIA)支持

**Key Components**:
- Button, Input, Select: 表单基础组件
- Dialog/Modal: 弹窗组件
- Table: 员工列表展示
- Alert/Toast: 提示和通知
- Tabs: 多标签页切换

**安装方式**:
```bash
npx shadcn-vue@latest init
npx shadcn-vue@latest add button input select dialog table alert
```

**Alternatives considered**:
- **Headless UI**: Tailwind官方,但需要大量自定义样式工作
- **DaisyUI**: 主要针对静态HTML,Vue集成不够原生
- **纯手写组件**: 开发时间长,可访问性难以保证

## 7. 数据验证方案

### Decision: TypeScript + 自定义验证函数

**Rationale**:
- TypeScript 提供编译时类型检查
- 运行时验证通过专用 validator 函数实现
- 验证逻辑清晰,易于测试

**实现示例**:
```typescript
// validators.ts
export function validateEmployee(data: Partial<Employee>): ValidationResult {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('员工姓名不能为空');
  }

  if (!data.hireDate || isNaN(data.hireDate.getTime())) {
    errors.push('入职日期无效');
  }

  if (data.hireDate && data.hireDate > new Date()) {
    errors.push('入职日期不能晚于当前日期');
  }

  return { valid: errors.length === 0, errors };
}

export function validateLeaveUsage(usage: LeaveUsage, balance: number): ValidationResult {
  const errors: string[] = [];

  if (usage.days > balance) {
    errors.push(`年假余额不足,剩余 ${balance} 天,申请 ${usage.days} 天`);
  }

  if (usage.days !== 0.5 && usage.days !== 1) {
    errors.push('休假天数必须为 0.5 或 1');
  }

  return { valid: errors.length === 0, errors };
}
```

**Alternatives considered**:
- **Zod**: 强大的 schema 验证库,但对于简单验证来说引入额外依赖
- **Yup**: 类似 Zod,功能重叠但本项目验证逻辑简单,不需要完整 schema 库
- **Vuelidate/VeeValidate**: Vue 表单验证库,适合复杂表单,但本项目表单简单

## 8. 性能优化策略

### Decision: 按需优化,关注日历视图和列表渲染

**Rationale**:
- 数据规模小 (50-100 员工),大部分场景无需特殊优化
- 日历视图是唯一可能有性能瓶颈的部分 (渲染 30+ 天 × N 员工)

**优化措施**:
1. **日历视图**:
   - 使用 `v-memo` 缓存日历格子,避免不必要的重新渲染
   - 只渲染当前月份,上下月延迟加载
   - 休假数据按日期索引,O(1) 查询

2. **员工列表**:
   - 如果员工数超过 100,考虑虚拟滚动 (vue-virtual-scroller)
   - 默认只显示在职员工,离职员工按需加载

3. **数据加载**:
   - 首次加载从 localStorage 读取 (同步),避免等待文件加载
   - 定期保存到 JSON 文件 (用户操作后 debounce 保存)

**监控指标**:
- 日历视图首次渲染时间 < 2s
- 列表操作响应时间 < 200ms
- 页面切换时间 < 500ms

**Alternatives considered**:
- **提前全面优化**: 过度工程化,应在遇到实际性能问题时再优化
- **Web Worker**: 数据量不足以需要后台计算

## 9. 响应式设计策略

### Decision: 移动优先(Mobile-First) + Tailwind响应式断点

**Rationale**:
- **澄清结果**: 用户要求UI在手机和电脑上都能完美展示
- Tailwind提供完善的响应式断点系统
- 移动优先策略确保基础功能在小屏幕上可用
- 渐进增强,利用大屏幕空间优化布局

**Tailwind Breakpoints**:
```css
/* 默认: <640px (移动端) */
sm: 640px   /* 小平板 */
md: 768px   /* 平板/小桌面 */
lg: 1024px  /* 桌面 */
xl: 1280px  /* 大桌面 */
```

**响应式策略**:

1. **导航布局**:
   - 移动端(<768px): 汉堡菜单 + 抽屉导航
   - 桌面端(≥768px): 侧边栏导航

2. **员工列表**:
   - 移动端: 卡片布局(垂直堆叠)
   - 桌面端: 表格布局(多列展示)

3. **日历视图**:
   - 移动端: 紧凑月视图,可滑动
   - 桌面端: 完整月视图 + 侧边栏详情

4. **表单**:
   - 移动端: 单列布局,全屏对话框
   - 桌面端: 双列布局,居中对话框

**实现示例**:
```vue
<!-- 响应式网格布局 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <EmployeeCard v-for="emp in employees" :key="emp.id" :employee="emp" />
</div>

<!-- 响应式导航 -->
<nav class="fixed md:static bottom-0 md:bottom-auto w-full md:w-64">
  <!-- 移动端底部导航,桌面端侧边栏 -->
</nav>

<!-- 响应式表格/卡片切换 -->
<div class="block md:hidden">
  <EmployeeCard /> <!-- 移动端卡片 -->
</div>
<div class="hidden md:block">
  <EmployeeTable /> <!-- 桌面端表格 -->
</div>
```

**测试设备目标**:
- 移动端: iPhone SE (375px), iPhone 14 (390px), Android (360px)
- 平板: iPad (768px), iPad Pro (1024px)
- 桌面: MacBook (1280px), 外接显示器 (1920px)

**Alternatives considered**:
- **固定布局**: 不适配移动端,用户体验差
- **独立移动版**: 开发成本高,维护困难

---

## 总结

所有技术决策已明确,主要选择:
- **存储**: localStorage (主) + JSON文件导出导入
- **日期计算**: date-fns (tree-shakable, TypeScript友好)
- **日历**: 自定义CSS Grid组件
- **状态管理**: Pinia (Composition API)
- **测试**: Vitest + Vue Test Utils,重点测试业务逻辑
- **UI组件库**: Shadcn-vue (TailwindCSS + Radix Vue)
- **样式**: TailwindCSS 3.x (移动优先,响应式断点)
- **验证**: TypeScript + 自定义验证函数
- **性能**: 按需优化,关注日历和列表

所有技术选择均符合项目约束(纯前端、本地存储、Vue 3生态、响应式),无需进一步研究。可以进入Phase 1设计阶段。
