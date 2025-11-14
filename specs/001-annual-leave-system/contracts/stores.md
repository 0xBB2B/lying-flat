# Pinia Store Contracts: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-14
**Purpose**: 定义Pinia stores的接口契约,确保类型安全与数据流一致性

## 概述

1. 每个领域实体对应一个store,遵循Composition API风格(setup语法);所有Pinia stores都定义清晰的state、getters、actions接口

---

## 1. Employee Store (员工管理)

**文件路径**: `src/stores/employee.ts`

### State

```typescript
interface EmployeeStoreState {
  employees: Employee[]
  loading: boolean
  error: string | null
}
```

### Getters

```typescript
interface EmployeeStoreGetters {
  // 获取在职员工列表(status=active)
  activeEmployees: ComputedRef<Employee[]>

  // 已离职员工列表
  terminatedEmployees: ComputedRef<Employee[]>

  // 根据ID查找员工
  getEmployeeById: (id: string) => Employee | undefined

  // 员工统计数量
  totalCount: ComputedRef<number>
  activeCount: ComputedRef<number>
  terminatedCount: ComputedRef<number>
}
```

### Actions

```typescript
interface EmployeeStoreActions {
  // 加载所有员工数据(从localStorage)
  loadEmployees(): Promise<void>

  // 新增员工
  addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee>

  // 更新员工信息
  updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee>

  // 标记员工离职
  terminateEmployee(id: string, terminatedAt: Date): Promise<Employee>

  // 删除员工记录(仅用于测试,生产环境禁止物理删除数据)
  deleteEmployee(id: string): Promise<void>
}
```

**实现要点**:
- `addEmployee`: 自动生成UUID,初始化status为active,设置时间戳
- `terminateEmployee`: 更新status为terminated,记录terminatedAt时间
- `loadEmployees`: 从localStorage加载数据,反序列化Date字段

---

## 2. Leave Entitlement Store (年假额度管理)

**文件路径**: `src/stores/leaveEntitlement.ts`

### State

```typescript
interface LeaveEntitlementStoreState {
  entitlements: LeaveEntitlement[]
  loading: boolean
  error: string | null
}
```

### Getters

```typescript
interface LeaveEntitlementStoreGetters {
  // 获取某员工所有有效额度(未过期)
  getActiveEntitlements: (employeeId: string) => LeaveEntitlement[]

  // 获取某员工即将过期的额度(30天内)
  getExpiringSoon: (employeeId: string) => LeaveEntitlement[]

  // 计算某员工年假余额
  calculateBalance: (employeeId: string) => LeaveBalance
}
```

### Actions

```typescript
interface LeaveEntitlementStoreActions {
  // 加载所有额度数据
  loadEntitlements(): Promise<void>

  // 发放自动年假(员工周年日触发或手动补发)
  grantLeave(employeeId: string, days: number, grantDate: Date): Promise<LeaveEntitlement>

  // 添加手动年假额度(管理员调整)
  addManualEntitlement(employeeId: string, days: number, reason: string): Promise<LeaveEntitlement>

  // 扣减已使用额度(由LeaveUsageStore调用)
  deductUsage(employeeId: string, days: number, usageDate: Date): Promise<string[]>

  // 检查并标记过期额度(定时任务,每日运行)
  checkExpiry(): void
}
```

**实现要点**:
- `grantLeave`: 创建source=auto的额度,expiryDate=grantDate+2年
- `addManualEntitlement`: 创建source=manual的额度,expiryDate=null(永久有效)
- `deductUsage`: 优先扣减最早过期的额度,返回被扣减的entitlementIds数组
- `checkExpiry`: 遍历所有额度,标记已过期记录(不删除数据)

---

## 3. Leave Usage Store (年假使用记录)

**文件路径**: `src/stores/leaveUsage.ts`

### State

```typescript
interface LeaveUsageStoreState {
  usages: LeaveUsage[]
  loading: boolean
  error: string | null
}
```

### Getters

```typescript
interface LeaveUsageStoreGetters {
  // 获取某员工所有使用记录
  getUsagesByEmployee: (employeeId: string) => LeaveUsage[]

  // 获取特定日期的使用记录(用于日历视图)
  getUsagesByDate: (date: Date) => LeaveUsage[]

  // 获取某月的使用记录
  getUsagesByMonth: (year: number, month: number) => LeaveUsage[]

  // 检查某员工在指定日期是否已有使用记录
  hasUsageOn: (employeeId: string, date: Date) => boolean
}
```

### Actions

```typescript
interface LeaveUsageStoreActions {
  // 加载所有使用记录
  loadUsages(): Promise<void>

  // 记录年假使用
  recordUsage(usage: Omit<LeaveUsage, 'id' | 'createdAt' | 'entitlementIds'>): Promise<LeaveUsage>

  // 删除使用记录(允许撤销)
  deleteUsage(id: string): Promise<void>

  // 获取员工年度统计(用于报表生成)
  getAnnualUsageStats(employeeId: string, year: number): { totalDays: number, usageCount: number }
}
```

**实现要点**:
- `recordUsage`:
  1. 验证余额是否充足
  2. 创建使用记录对象
  3. 调用entitlementStore.deductUsage()扣减额度
  4. 保存entitlementIds到使用记录
- `deleteUsage`: 需要恢复entitlement的usedDays计数

---

## 4. Leave Adjustment Store (年假调整记录)

**文件路径**: `src/stores/leaveAdjustment.ts`

### State

```typescript
interface LeaveAdjustmentStoreState {
  adjustments: LeaveAdjustment[]
  loading: boolean
  error: string | null
}
```

### Getters

```typescript
interface LeaveAdjustmentStoreGetters {
  // 获取某员工所有调整记录
  getAdjustmentsByEmployee: (employeeId: string) => LeaveAdjustment[]

  // 获取最近N条调整记录(用于审计)
  getRecentAdjustments: (limit: number) => LeaveAdjustment[]
}
```

### Actions

```typescript
interface LeaveAdjustmentStoreActions {
  // 加载所有调整记录
  loadAdjustments(): Promise<void>

  // 增加年假
  addLeave(employeeId: string, days: number, reason: string): Promise<LeaveAdjustment>

  // 扣减年假
  deductLeave(employeeId: string, days: number, reason: string): Promise<LeaveAdjustment>
}
```

**实现要点**:
- `addLeave`:
  1. 记录调整类型为add的记录
  2. 调用entitlementStore.addManualEntitlement()创建永久有效额度
  3. 保存调整记录
- `deductLeave`:
  1. 记录调整类型为deduct的记录
  2. 在当前余额中优先扣减最早的额度
  3. 保存调整记录

---

## 5. Storage Store (存储管理)

**文件路径**: `src/stores/storage.ts`

### Actions

```typescript
interface StorageStoreActions {
  // 保存所有数据到localStorage
  saveAll(): Promise<void>

  // 从localStorage加载所有数据
  loadAll(): Promise<void>

  // 导出为JSON文件
  exportData(): Promise<Blob>

  // 从JSON文件导入
  importData(file: File): Promise<void>

  // 清空所有数据(仅测试使用)
  clearAll(): Promise<void>
}
```

**localStorage keys**:
- `annual-leave-system:data` - 所有业务数据的集合对象

**数据格式**:
```typescript
interface StorageData {
  version: string  // 'v1.0.0'
  employees: Employee[]
  entitlements: LeaveEntitlement[]
  usages: LeaveUsage[]
  adjustments: LeaveAdjustment[]
  lastUpdated: string  // ISO timestamp
}
```

**实现要点**:
- `saveAll`: 收集所有stores的状态数据(debounce 500ms)
- `loadAll`: 反序列化后加载到各个stores
- `exportData`: 生成JSON blob供下载
- `importData`: 验证数据格式后替换,覆盖前警告用户并备份当前数据

---

## 6. Reminder Store (提醒通知)

**文件路径**: `src/stores/reminder.ts`

### State

```typescript
interface ReminderStoreState {
  reminders: Reminder[]
}

interface Reminder {
  id: string
  type: 'expiry' | 'min_usage'  // 过期提醒 或 最低使用提醒
  employeeId: string
  message: string
  createdAt: Date
  dismissed: boolean
}
```

### Getters

```typescript
interface ReminderStoreGetters {
  // 获取未关闭的提醒
  activeReminders: ComputedRef<Reminder[]>

  // 过期提醒
  expiryReminders: ComputedRef<Reminder[]>

  // 最低使用提醒
  minUsageReminders: ComputedRef<Reminder[]>
}
```

### Actions

```typescript
interface ReminderStoreActions {
  // 检查并生成提醒
  checkReminders(): void

  // 关闭提醒
  dismissReminder(id: string): void

  // 清空所有提醒
  clearAll(): void
}
```

**实现要点**:
- `checkReminders`:
  1. 检查即将过期的年假额度(30天内)→生成expiry提醒
  2. 在10-12月期间,检查当年年假使用率低于5天的员工→生成min_usage提醒
- 提醒管理不持久化,仅内存状态

---

## Store依赖关系图

```
StorageStore
    ↑ (保存/加载)
             ↓              ↓               ↓               ↓
 Employee     Entitlement   Usage          Adjustment
             ↑              ↑               ↑               ↑
                    ↓               ↓               ↓
                ReminderStore (读取数据生成提醒)
```

**调用链路**:
1. `UsageStore.recordUsage` → 调用 `EntitlementStore.deductUsage`
2. `AdjustmentStore.addLeave` → 调用 `EntitlementStore.addManualEntitlement`
3. 所有数据变更 → 调用 `StorageStore.saveAll`

---

## 错误处理

所有async actions必须使用try-catch包裹,错误信息设置到store的error字段:

```typescript
async addEmployee(data) {
  this.loading = true
  this.error = null
  try {
    // 业务逻辑
    const employee = { ...data, id: uuid(), createdAt: new Date(), updatedAt: new Date() }
    this.employees.push(employee)
    await storageStore.saveAll()
    return employee
  } catch (err) {
    this.error = err.message
    throw err
  } finally {
    this.loading = false
  }
}
```

---

## 测试边界条件

每个store的关键actions都需要单元测试覆盖以下场景:

**EmployeeStore**:
- 新增重名员工
- 更新不存在的员工
- 标记已离职员工

**EntitlementStore**:
- 发放自动年假
- 添加手动年假(永久有效)
- 扣减逻辑(优先扣减最早过期)
- 余额不足场景

**UsageStore**:
- 记录使用(扣减额度)
- 余额不足拒绝
- 删除使用记录恢复

**AdjustmentStore**:
- 增加/扣减年假
- 余额不足时的处理

**StorageStore**:
- 导出/导入数据
- 导入格式校验
