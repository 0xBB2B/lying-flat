# Quickstart: 历史休假记录时点额度计算修复

**Feature**: 002-historical-leave-balance | **Date**: 2025-11-17

## 开发概述

本文档提供快速开始指南，帮助开发者理解和实现此Bug修复。

## 核心问题

**现象**: 补录历史日期的休假时，系统使用当前日期的年假额度进行验证，导致计算错误。

**示例**:
- 员工张三，2021年4月1日入职
- 当前日期：2025年11月17日（累计获得多批年假，部分已过期）
- 补录2024年9月15日的休假时
- ❌ 错误：系统检查2025年11月的余额
- ✅ 正确：应检查2024年9月15日的余额

## 技术方案

### 解决思路

1. 新增时点余额计算函数 `calculateBalanceAtDate(employeeId, targetDate)`
2. 修改 `recordUsage` 验证逻辑，使用休假日期而非当前日期
3. 正确处理年假有效期和FIFO扣减原则
4. 保持数据结构不变，确保向后兼容

### 关键文件

```
src/
├── stores/
│   ├── leaveEntitlement.ts    # 新增 calculateBalanceAtDate 方法
│   └── leaveUsage.ts          # 修改 recordUsage 验证逻辑
├── utils/
│   ├── leaveCalculator.ts     # 新增时点计算辅助函数
│   └── dateUtils.ts           # 新增日期标准化函数
└── types/
    ├── leave.ts               # 新增 PointInTimeBalance 类型
    └── errors.ts              # 新增错误类型定义（新文件）
```

## 实施步骤

### Step 1: 添加类型定义

**文件**: `src/types/leave.ts`

```typescript
// 添加到现有文件末尾

/**
 * 时点余额快照（运行时计算结果，不持久化）
 */
export interface PointInTimeBalance {
  date: Date                    // 查询的时点
  employeeId: string            // 员工ID
  totalDays: number             // 该时点总额度
  usedDays: number              // 该时点已用天数
  remainingDays: number         // 该时点剩余天数
  entitlements: PointInTimeEntitlement[]
}

export interface PointInTimeEntitlement {
  id: string
  days: number
  grantDate: Date
  expiryDate: Date | null
  source: EntitlementSource
  usedDays: number              // 该批次在该时点的已用天数
  remainingDays: number         // 该批次在该时点的剩余天数
  isExpired: boolean            // 在该时点是否已过期
}
```

**文件**: `src/types/errors.ts` (新建)

```typescript
import type { PointInTimeBalance } from './leave'

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

### Step 2: 添加工具函数

**文件**: `src/utils/dateUtils.ts`

```typescript
// 在现有文件中添加

/**
 * 标准化日期为当天00:00:00
 */
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}
```

**文件**: `src/utils/leaveCalculator.ts`

```typescript
// 在现有文件中添加

import { isBefore, isAfter } from 'date-fns'

/**
 * 判断额度在指定时点是否已过期
 */
export function isLeaveExpiredAtDate(
  expiryDate: Date | null,
  targetDate: Date
): boolean {
  if (expiryDate === null) return false // 永久有效
  return isBefore(expiryDate, targetDate) || expiryDate.getTime() === targetDate.getTime()
}

/**
 * 计算截至指定日期应发放的所有额度
 */
export function calculateAllLeaveEntitlementsUpToDate(
  hireDate: Date,
  targetDate: Date
): Array<{
  grantNumber: number
  grantDate: Date
  days: number
  expiryDate: Date
}> {
  const allEntitlements = calculateAllLeaveEntitlements(hireDate, targetDate)
  return allEntitlements.filter(e => !isAfter(e.grantDate, targetDate))
}
```

### Step 3: 修改 LeaveEntitlementStore

**文件**: `src/stores/leaveEntitlement.ts`

在store中添加新方法：

```typescript
import type { PointInTimeBalance, PointInTimeEntitlement } from '@/types/leave'
import { normalizeDate } from '@/utils/dateUtils'
import { isLeaveExpiredAtDate } from '@/utils/leaveCalculator'

// 在 defineStore 内部添加：

/**
 * 计算指定员工在特定时点的年假余额
 */
function calculateBalanceAtDate(
  employeeId: string,
  targetDate: Date
): PointInTimeBalance {
  const employeeStore = useEmployeeStore()
  const employee = employeeStore.getEmployeeById(employeeId)

  if (!employee) {
    throw new Error(`员工 ID ${employeeId} 不存在`)
  }

  const normalizedDate = normalizeDate(targetDate)

  // 1. 获取该时点前（含当天）已发放的所有额度
  const allEntitlements = entitlements.value
    .filter(e => e.employeeId === employeeId)
    .filter(e => !isAfter(e.grantDate, normalizedDate))

  // 2. 过滤掉在该时点已过期的额度
  const activeEntitlements = allEntitlements.filter(
    e => !isLeaveExpiredAtDate(e.expiryDate, normalizedDate)
  )

  // 3. 获取该时点前（不含当天）的所有使用记录
  const data = load()
  const usages = (data?.usages || [])
    .filter(u => u.employeeId === employeeId)
    .filter(u => isBefore(u.date, normalizedDate))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  // 4. 按FIFO原则分配使用记录到额度批次
  const sortedEntitlements = [...activeEntitlements].sort((a, b) => {
    if (a.expiryDate === null && b.expiryDate === null) return 0
    if (a.expiryDate === null) return 1
    if (b.expiryDate === null) return -1
    return a.expiryDate.getTime() - b.expiryDate.getTime()
  })

  const allocatedEntitlements: PointInTimeEntitlement[] = sortedEntitlements.map(e => ({
    id: e.id,
    days: e.days,
    grantDate: e.grantDate,
    expiryDate: e.expiryDate,
    source: e.source,
    usedDays: 0,
    remainingDays: e.days,
    isExpired: false
  }))

  // 分配使用记录
  for (const usage of usages) {
    let remainingToAllocate = usage.days

    for (const ent of allocatedEntitlements) {
      if (remainingToAllocate <= 0) break
      if (ent.remainingDays <= 0) continue

      const toDeduct = Math.min(remainingToAllocate, ent.remainingDays)
      ent.usedDays += toDeduct
      ent.remainingDays -= toDeduct
      remainingToAllocate -= toDeduct
    }
  }

  // 5. 计算总余额
  const totalDays = allocatedEntitlements.reduce((sum, e) => sum + e.days, 0)
  const usedDays = allocatedEntitlements.reduce((sum, e) => sum + e.usedDays, 0)

  return {
    date: normalizedDate,
    employeeId,
    totalDays,
    usedDays,
    remainingDays: totalDays - usedDays,
    entitlements: allocatedEntitlements
  }
}

// 修改现有的 calculateBalance 方法：
function calculateBalance(employeeId: string): LeaveBalance {
  const pointInTimeBalance = calculateBalanceAtDate(employeeId, new Date())

  return {
    employeeId,
    totalDays: pointInTimeBalance.totalDays,
    usedDays: pointInTimeBalance.usedDays,
    remainingDays: pointInTimeBalance.remainingDays,
    nextGrantDate: calculateNextLeaveGrantDate(/* ... */),
    expiringEntitlements: /* ... */
  }
}

// 在 return 语句中导出新方法：
return {
  // ... 现有导出
  calculateBalanceAtDate, // 新增
}
```

### Step 4: 修改 LeaveUsageStore

**文件**: `src/stores/leaveUsage.ts`

修改 `recordUsage` 方法：

```typescript
import { InsufficientBalanceError, InvalidDateError } from '@/types/errors'

async function recordUsage(
  employeeId: string,
  date: Date,
  type: LeaveType,
  notes?: string,
  createdBy?: string
): Promise<void> {
  loading.value = true
  error.value = null

  try {
    // 验证员工是否存在
    const employeeStore = useEmployeeStore()
    const employee = employeeStore.getEmployeeById(employeeId)
    if (!employee) {
      throw new Error(`员工 ID ${employeeId} 不存在`)
    }

    const usageDate = normalizeDate(date)

    // 新增：验证日期不早于入职日期
    if (isBefore(usageDate, employee.hireDate)) {
      throw new InvalidDateError(
        '休假日期不能早于入职日期',
        { date: usageDate, reason: 'before-hire' }
      )
    }

    // 检查是否有重复的休假记录
    if (hasUsageOnDate.value(employeeId, usageDate, type)) {
      throw new Error(`${usageDate.toISOString().split('T')[0]} 已有${type === 'full_day' ? '全天' : type === 'morning' ? '上午' : '下午'}休假记录`)
    }

    // 计算休假天数
    const days = type === 'full_day' ? 1 : 0.5

    // 【关键修改】使用时点余额验证
    const leaveEntitlementStore = useLeaveEntitlementStore()
    const balanceAtDate = leaveEntitlementStore.calculateBalanceAtDate(employeeId, usageDate)

    // 验证该时点是否有可用额度
    if (balanceAtDate.totalDays === 0) {
      throw new InvalidDateError(
        '该日期时点尚未获得年假额度',
        { date: usageDate, reason: 'no-entitlement' }
      )
    }

    // 验证余额是否足够
    if (balanceAtDate.remainingDays < days) {
      throw new InsufficientBalanceError(
        `该日期时点年假余额不足（可用${balanceAtDate.remainingDays}天，需要${days}天）`,
        {
          employeeId,
          date: usageDate,
          requested: days,
          available: balanceAtDate.remainingDays,
          details: balanceAtDate
        }
      )
    }

    // 创建使用记录
    const newUsage: LeaveUsage = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      employeeId,
      date: usageDate,
      days,
      type,
      entitlementIds: [], // 不再需要预先计算扣减的额度ID
      notes,
      createdAt: new Date(),
      createdBy,
    }

    usages.value.push(newUsage)

    // 持久化
    await saveUsages()

    // 重新计算所有额度的使用情况
    await leaveEntitlementStore.loadEntitlements()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '记录年假使用失败'
    console.error('Failed to record usage:', e)
    throw e
  } finally {
    loading.value = false
  }
}
```

### Step 5: 编写测试

**文件**: `tests/unit/stores/leaveEntitlement.spec.ts`

```typescript
describe('calculateBalanceAtDate', () => {
  it('应该正确计算2024年9月15日的时点余额', () => {
    // 设置：员工2021年4月1日入职
    // 2021/10/1获得10天，2022/10/1获得11天，2023/10/1获得12天
    // 在2024/9/15时点，2021年的已过期，应有11+12=23天

    const balance = store.calculateBalanceAtDate('emp-001', new Date('2024-09-15'))

    expect(balance.totalDays).toBe(23)
    expect(balance.entitlements).toHaveLength(2)
    expect(balance.entitlements[0].days).toBe(11)
    expect(balance.entitlements[1].days).toBe(12)
  })

  it('应该在时点计算中排除已过期额度', () => {
    // 测试过期逻辑
  })

  it('应该按FIFO原则分配使用记录', () => {
    // 测试FIFO分配
  })
})
```

**文件**: `tests/unit/stores/leaveUsage.spec.ts`

```typescript
describe('recordUsage - 时点验证', () => {
  it('应该允许记录历史日期的休假（余额充足时）', async () => {
    await expect(
      store.recordUsage('emp-001', new Date('2024-09-15'), 'full_day')
    ).resolves.not.toThrow()
  })

  it('应该阻止历史日期的休假（余额不足时）', async () => {
    await expect(
      store.recordUsage('emp-001', new Date('2023-06-01'), 'full_day')
    ).rejects.toThrow(InsufficientBalanceError)
  })

  it('应该阻止早于入职日期的休假', async () => {
    await expect(
      store.recordUsage('emp-001', new Date('2021-01-01'), 'full_day')
    ).rejects.toThrow(InvalidDateError)
  })
})
```

## 测试策略

### 单元测试

```bash
npm run test:unit -- leaveCalculator
npm run test:unit -- leaveEntitlement
npm run test:unit -- leaveUsage
```

### 手动测试场景

1. **场景1：补录历史休假（余额充足）**
   - 添加员工：2021年4月1日入职
   - 记录休假：2024年9月15日，1天
   - 预期：成功记录，使用2024年9月15日时点的23天余额

2. **场景2：补录历史休假（余额不足）**
   - 记录休假：2023年6月1日，1天
   - 预期：失败，提示"该日期时点尚未获得年假额度"

3. **场景3：入职前日期**
   - 记录休假：2021年1月1日，1天
   - 预期：失败，提示"休假日期不能早于入职日期"

4. **场景4：删除历史记录后余额更新**
   - 删除2024年9月15日的记录
   - 预期：当前余额增加1天

## 调试技巧

### 启用详细日志

```typescript
// 在 calculateBalanceAtDate 中添加
console.log('Time point balance calculation:', {
  employeeId,
  targetDate: normalizedDate,
  activeEntitlements: activeEntitlements.map(e => ({
    id: e.id,
    days: e.days,
    grantDate: e.grantDate,
    expiryDate: e.expiryDate
  })),
  usages: usages.map(u => ({
    date: u.date,
    days: u.days
  })),
  result: {
    totalDays,
    usedDays,
    remainingDays: totalDays - usedDays
  }
})
```

### Vue DevTools

使用 Pinia DevTools 查看 Store 状态：
- 监控 `calculateBalanceAtDate` 调用
- 检查额度和使用记录的状态
- 验证FIFO分配结果

## 常见问题

### Q: 为什么不在数据库中存储时点余额？

A:
- 项目使用localStorage，不适合存储大量快照
- 实时计算保证数据一致性
- 数据量小（~100员工），性能可接受

### Q: FIFO分配逻辑如何测试？

A:
- 创建多批额度，模拟不同过期日期
- 添加多条使用记录
- 验证每批额度的usedDays分配是否正确

### Q: 如何确保向后兼容？

A:
- 不修改数据结构
- 保留所有现有方法签名
- 运行完整测试套件确保无回归

## 参考资料

- [data-model.md](./data-model.md) - 数据模型详细说明
- [contracts/store-methods.md](./contracts/store-methods.md) - API合约
- [research.md](./research.md) - 技术决策文档
- [spec.md](./spec.md) - 功能规格
