# Store Methods Contract: 历史休假记录时点额度计算

**Feature**: 002-historical-leave-balance | **Date**: 2025-11-17

## 概述

本文档定义 Pinia Store 的方法签名变更和新增接口。重点关注 `leaveEntitlementStore` 和 `leaveUsageStore` 的修改。

## LeaveEntitlementStore 修改

### 新增方法

#### `calculateBalanceAtDate`

**用途**: 计算指定员工在特定时点的年假余额

**签名**:
```typescript
calculateBalanceAtDate(
  employeeId: string,
  targetDate: Date
): PointInTimeBalance
```

**参数**:
- `employeeId`: 员工ID
- `targetDate`: 目标时点日期（会被标准化为当天00:00:00）

**返回值**: `PointInTimeBalance` 对象，包含：
- `date`: 时点日期
- `employeeId`: 员工ID
- `totalDays`: 该时点的总额度
- `usedDays`: 该时点已使用天数
- `remainingDays`: 该时点剩余天数
- `entitlements`: 各批次额度的详细分配情况

**异常**:
- `Error('员工不存在')`: 当 employeeId 无效时
- 不抛出余额不足异常（由调用方判断）

**行为**:
1. 获取员工在 `targetDate` 时点前（含当天）已发放的所有额度
2. 过滤掉在 `targetDate` 时点已过期的额度
3. 获取 `targetDate` 之前（不含当天）的所有使用记录
4. 按FIFO原则分配使用记录到各批次额度
5. 返回计算结果

**示例**:
```typescript
// 查询2024年9月15日时点的余额
const balance = leaveEntitlementStore.calculateBalanceAtDate(
  'emp-001',
  new Date('2024-09-15')
)

console.log(balance)
// {
//   date: Date('2024-09-15T00:00:00'),
//   employeeId: 'emp-001',
//   totalDays: 23,
//   usedDays: 5,
//   remainingDays: 18,
//   entitlements: [
//     {
//       id: 'ent-001',
//       days: 11,
//       grantDate: Date('2022-10-01'),
//       expiryDate: Date('2024-10-01'),
//       source: 'auto',
//       usedDays: 5,
//       remainingDays: 6,
//       isExpired: false
//     },
//     {
//       id: 'ent-002',
//       days: 12,
//       grantDate: Date('2023-10-01'),
//       expiryDate: Date('2025-10-01'),
//       source: 'auto',
//       usedDays: 0,
//       remainingDays: 12,
//       isExpired: false
//     }
//   ]
// }
```

### 修改方法

#### `calculateBalance` (现有方法)

**变更说明**: 内部实现改为调用 `calculateBalanceAtDate(employeeId, new Date())`

**签名**: 保持不变
```typescript
calculateBalance(employeeId: string): LeaveBalance
```

**向后兼容**: ✅ 完全兼容，外部调用无需修改

## LeaveUsageStore 修改

### 修改方法

#### `recordUsage`

**变更说明**: 修改验证逻辑，使用时点余额计算

**签名**: 保持不变
```typescript
async recordUsage(
  employeeId: string,
  date: Date,
  type: LeaveType,
  notes?: string,
  createdBy?: string
): Promise<void>
```

**行为变更**:
```typescript
// 旧逻辑（错误）:
const balance = leaveEntitlementStore.calculateBalance(employeeId) // 使用当前日期
if (balance.remainingDays < days) throw Error('余额不足')

// 新逻辑（正确）:
const balanceAtDate = leaveEntitlementStore.calculateBalanceAtDate(employeeId, date) // 使用休假日期
if (balanceAtDate.remainingDays < days) {
  throw new InsufficientBalanceError(
    `该日期时点年假余额不足（可用${balanceAtDate.remainingDays}天，需要${days}天）`,
    { employeeId, date, requested: days, available: balanceAtDate.remainingDays, details: balanceAtDate }
  )
}
```

**新增验证**:
1. **日期不早于入职**: `date >= employee.hireDate`
2. **时点有额度**: `balanceAtDate.totalDays > 0`（入职未满6个月时为0）
3. **余额足够**: `balanceAtDate.remainingDays >= days`

**异常增强**:
```typescript
// 新增详细的错误类型
throw new InvalidDateError(
  '休假日期不能早于入职日期',
  { date, reason: 'before-hire' }
)

throw new InvalidDateError(
  '该日期时点尚未获得年假额度',
  { date, reason: 'no-entitlement' }
)

throw new InsufficientBalanceError(
  `该日期时点年假余额不足（可用${available}天，需要${requested}天）`,
  { employeeId, date, requested, available, details: balanceAtDate }
)
```

**向后兼容**: ⚠️ 部分兼容
- 方法签名不变
- 对于当前日期的记录，行为基本不变
- 对于历史日期的记录，验证逻辑变更（这正是要修复的）
- 错误消息更详细（可能影响依赖错误文本的代码）

## Utils 层新增函数

### `calculateAllLeaveEntitlementsUpToDate`

**文件**: `src/utils/leaveCalculator.ts`

**用途**: 计算截至指定日期的所有应发放额度

**签名**:
```typescript
export function calculateAllLeaveEntitlementsUpToDate(
  hireDate: Date,
  targetDate: Date
): Array<{
  grantNumber: number
  grantDate: Date
  days: number
  expiryDate: Date
}>
```

**行为**:
- 类似现有的 `calculateAllLeaveEntitlements`
- 但只返回 `grantDate <= targetDate` 的额度

### `isLeaveExpiredAtDate`

**文件**: `src/utils/leaveCalculator.ts`

**用途**: 判断额度在指定时点是否已过期

**签名**:
```typescript
export function isLeaveExpiredAtDate(
  expiryDate: Date | null,
  targetDate: Date
): boolean
```

**逻辑**:
```typescript
if (expiryDate === null) return false // 永久有效
return expiryDate <= targetDate
```

### `normalizeDate`

**文件**: `src/utils/dateUtils.ts`

**用途**: 标准化日期为当天00:00:00

**签名**:
```typescript
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}
```

## 类型定义新增

### `PointInTimeBalance`

**文件**: `src/types/leave.ts`

```typescript
export interface PointInTimeBalance {
  date: Date
  employeeId: string
  totalDays: number
  usedDays: number
  remainingDays: number
  entitlements: PointInTimeEntitlement[]
}

export interface PointInTimeEntitlement {
  id: string
  days: number
  grantDate: Date
  expiryDate: Date | null
  source: EntitlementSource
  usedDays: number
  remainingDays: number
  isExpired: boolean
}
```

### 错误类型

**文件**: `src/types/errors.ts` (新建)

```typescript
export class InsufficientBalanceError extends Error {
  name = 'InsufficientBalanceError'
  employeeId: string
  date: Date
  requested: number
  available: number
  details: PointInTimeBalance

  constructor(message: string, data: {
    employeeId: string
    date: Date
    requested: number
    available: number
    details: PointInTimeBalance
  }) {
    super(message)
    Object.assign(this, data)
  }
}

export class InvalidDateError extends Error {
  name = 'InvalidDateError'
  date: Date
  reason: 'before-hire' | 'future' | 'no-entitlement'

  constructor(message: string, data: {
    date: Date
    reason: 'before-hire' | 'future' | 'no-entitlement'
  }) {
    super(message)
    Object.assign(this, data)
  }
}
```

## 测试合约

### 单元测试要求

**文件**: `tests/unit/utils/leaveCalculator.spec.ts`

必须覆盖的测试用例：
```typescript
describe('calculateBalanceAtDate', () => {
  it('应该计算历史时点的余额（含已过期额度的过滤）')
  it('应该正确处理该时点尚未发放的额度')
  it('应该按FIFO原则分配历史使用记录')
  it('应该处理手动调整的永久有效额度')
  it('应该在入职不满6个月时返回0额度')
})

describe('recordUsage - 时点验证', () => {
  it('应该允许记录当前日期的休假')
  it('应该允许记录历史日期的休假（余额充足时）')
  it('应该阻止历史日期的休假（余额不足时）')
  it('应该阻止早于入职日期的休假')
  it('应该阻止在未获得额度前的休假（入职<6个月）')
  it('应该提供详细的错误信息')
})
```

**文件**: `tests/unit/stores/leaveEntitlement.spec.ts`

```typescript
describe('LeaveEntitlementStore - 时点计算', () => {
  it('应该正确计算2024年9月15日的时点余额')
  it('应该在时点计算中排除已过期额度')
  it('应该在时点计算中包含未来发放的额度（如果grantDate已到）')
  it('应该处理跨越多个额度批次的使用记录')
})
```

### 集成测试要求

**文件**: `tests/component/leave/LeaveUsageForm.spec.ts`

```typescript
describe('LeaveUsageForm - 历史记录', () => {
  it('应该显示选中日期的时点可用余额')
  it('应该在余额不足时禁用提交按钮')
  it('应该显示详细的余额不足错误')
  it('应该成功记录历史日期的休假')
})
```

## 向后兼容性总结

| 接口/方法          | 变更类型     | 兼容性     | 说明                         |
| ------------------ | ------------ | ---------- | ---------------------------- |
| `calculateBalance` | 实现变更     | ✅ 完全兼容 | 签名不变，行为对外透明       |
| `recordUsage`      | 验证逻辑变更 | ⚠️ 部分兼容 | 签名不变，历史记录验证更严格 |
| LeaveEntitlement   | 无变更       | ✅ 完全兼容 | 数据结构不变                 |
| LeaveUsage         | 无变更       | ✅ 完全兼容 | 数据结构不变                 |
| 错误类型           | 新增         | ✅ 向前兼容 | 新增类型，不影响现有代码     |

**迁移建议**:
- 现有代码无需修改（除非依赖错误消息文本）
- UI组件可选择性地使用新的 `calculateBalanceAtDate` 方法显示时点余额
- 建议更新错误处理以利用新的错误类型（非必需）
