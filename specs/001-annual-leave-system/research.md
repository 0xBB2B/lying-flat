# Technical Research: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-13

## 研究目的

在开始实现前,研究和确认关键技术决策,确保选择的技术栈和架构模式能够满足功能需求和性能目标。

## 1. 数据存储方案

### Decision: 本地 JSON 文件 + localStorage 备份

**Rationale**:
- 需求明确要求"数据存储在本地,保存格式为json"
- 无需后端服务器,降低部署复杂度
- 适合小型团队 (50-100 员工) 的数据规模
- 支持离线使用
- 浏览器刷新时可快速加载

**实现方案**:
- 主存储: `public/data/employees.json` 和 `public/data/leaves.json`
- 实时缓存: localStorage 作为运行时缓存和备份
- 数据同步: 用户操作时更新 localStorage,提供"导出/导入"功能保存到文件

**Alternatives considered**:
- **IndexedDB**: 功能强大但对于简单数据结构过于复杂,JSON 已满足需求
- **纯 localStorage**: 存储限制 (5-10MB),不利于数据备份和迁移
- **后端 API + 数据库**: 违反"纯前端"约束,增加部署复杂度

## 2. 日期计算与年假计算引擎

### Decision: 使用原生 JavaScript Date API + 自定义计算逻辑

**Rationale**:
- 年假计算规则复杂 (入职周年、有效期、优先扣减),需要精确的日期计算
- 原生 Date API 足够处理年月日计算
- 避免引入重量级日期库 (如 moment.js) 增加包体积
- TypeScript 类型安全保证计算正确性

**实现关键逻辑**:
```typescript
// 计算入职时长 (以年为单位,精确到小数)
function calculateTenure(hireDate: Date, currentDate: Date): number {
  const diffMs = currentDate.getTime() - hireDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25); // 考虑闰年
}

// 根据入职时长获取年假天数
function getAnnualLeaveDays(tenure: number): number {
  if (tenure < 0.5) return 0;
  if (tenure < 1.5) return 10;
  if (tenure < 2.5) return 11;
  if (tenure < 3.5) return 12;
  if (tenure < 4.5) return 14;
  if (tenure < 5.5) return 16;
  if (tenure < 6.5) return 18;
  return 20; // 上限
}

// 计算下次年假发放日期
function getNextLeaveGrantDate(hireDate: Date, currentDate: Date): Date {
  // 逻辑: 找到最近的入职周年日 (每半年一次)
}

// 计算年假有效期
function getExpiryDate(grantDate: Date): Date {
  const expiry = new Date(grantDate);
  expiry.setFullYear(expiry.getFullYear() + 2);
  return expiry;
}
```

**Alternatives considered**:
- **date-fns**: 轻量级,但对于本项目的简单日期计算来说仍然是额外依赖
- **Day.js**: 类似 date-fns,未采用原因相同
- **Luxon**: 功能强大但包体积较大

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

### Decision: 不使用第三方 UI 组件库,自定义简洁 UI

**Rationale**:
- 需求界面相对简单:表单、列表、日历
- 自定义 UI 可以精确控制样式和交互
- 避免引入大型 UI 库 (Element Plus, Ant Design Vue) 的额外体积
- 练习和展示 Vue 3 Composition API 能力

**实现方式**:
- 使用原生 HTML 表单元素 + CSS 样式
- 公共样式通过 CSS 变量管理主题
- 简单的 loading/toast 提示组件自行实现

**Alternatives considered**:
- **Element Plus**: 功能全面但体积大 (~500KB),包含大量不需要的组件
- **Naive UI**: 轻量级但仍然引入不必要的依赖
- **Headless UI**: 适合需要完全自定义样式的场景,但对于简单需求来说过于抽象

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

## 总结

所有技术决策已明确,主要选择:
- **存储**: 本地 JSON + localStorage
- **日期计算**: 原生 Date API + 自定义逻辑
- **日历**: 自定义 CSS Grid 组件
- **状态管理**: Pinia (Composition API)
- **测试**: Vitest + Vue Test Utils,重点测试业务逻辑
- **UI**: 无第三方库,自定义简洁界面
- **验证**: TypeScript + 自定义验证函数
- **性能**: 按需优化,关注日历和列表

所有技术选择均符合项目约束 (纯前端、本地存储、Vue 3 生态),无需进一步研究。可以进入 Phase 1 设计阶段。
