# Data Model: 历史休假记录时点额度计算修复

**Feature**: 002-historical-leave-balance | **Date**: 2025-11-17
**Source**: [spec.md](./spec.md) → Key Entities section

## 概述

本Bug修复不涉及新的持久化实体，仅增强现有实体的计算能力和新增运行时类型定义。所有变更保持向后兼容，无需数据迁移。

## 现有实体（无变更）

### 1. LeaveEntitlement (年假额度)

**当前定义** (来自 001-annual-leave-system):
```typescript
interface LeaveEntitlement {
  id: string                    // UUID,唯一标识
  employeeId: string            // 关联的员工 ID
  days: number                  // 年假天数
  grantDate: Date               // 发放日期
  source: EntitlementSource     // 来源类型
  expiryDate: Date | null       // 过期日期
  status: EntitlementStatus     // 有效状态
  usedDays: number              // 已使用天数
  remainingDays: number         // 剩余天数
  adjustmentId?: string         // 关联的调整记录ID
  createdAt: Date               // 记录创建时间
}
```

**变更**: 无 - 保持现有结构

**说明**:
- `usedDays` 和 `remainingDays` 将改为基于当前日期的计算值
- 不再存储时点相关的使用情况
- 通过 `grantDate` 和 `expiryDate` 支持时点查询

### 2. LeaveUsage (年假使用记录)

**当前定义**:
```typescript
interface LeaveUsage {
  id: string                    // UUID,唯一标识
  employeeId: string            // 员工 ID
  date: Date                    // 休假日期
  days: number                  // 休假天数 (1 或 0.5)
  type: LeaveType               // 休假类型
  entitlementIds: string[]      // 扣减的额度ID列表
  notes?: string                // 备注
  createdAt: Date               // 记录创建时间
  createdBy?: string            // 操作人
}
```

**变更**: 无 - 保持现有结构

**关键字段**:
- `date`: 既是休假发生日期，也是时点计算的基准日期
- 验证逻辑将基于 `date` 字段来计算该时点的可用额度

## 新增运行时类型定义

### 3. PointInTimeBalance (时点余额快照)

**用途**: 表示某个特定日期时点的年假余额状态（仅用于计算结果，不持久化）

**TypeScript 定义**:
```typescript
interface PointInTimeBalance {
  date: Date                    // 查询的时点日期
  employeeId: string            // 员工ID
  totalDays: number             // 该时点的总额度（已发放且未过期）
  usedDays: number              // 该时点已使用天数
  remainingDays: number         // 该时点剩余天数
  entitlements: PointInTimeEntitlement[]  // 各批次额度详情
}

interface PointInTimeEntitlement {
  id: string                    // 额度ID
  days: number                  // 该批次总天数
  grantDate: Date               // 发放日期
  expiryDate: Date | null       // 过期日期
  source: EntitlementSource     // 来源类型
  usedDays: number              // 该批次在此时点的已用天数
  remainingDays: number         // 该批次在此时点的剩余天数
  isExpired: boolean            // 在该时点是否已过期
}
```

**字段说明**:
| 字段          | 类型   | 说明         | 计算规则                         |
| ------------- | ------ | ------------ | -------------------------------- |
| date          | Date   | 时点日期     | 由调用方提供（如休假记录的date） |
| employeeId    | string | 员工ID       | 由调用方提供                     |
| totalDays     | number | 时点总额度   | sum(有效额度.days)               |
| usedDays      | number | 时点已用天数 | sum(该时点前的使用记录.days)     |
| remainingDays | number | 时点剩余天数 | totalDays - usedDays             |
| entitlements  | Array  | 额度详情     | 包含各批次的分配情况             |

**计算规则**:
1. **有效额度筛选**: `grantDate <= targetDate AND (expiryDate > targetDate OR expiryDate IS NULL)`
2. **使用记录筛选**: `date < targetDate` (严格小于，不包含当天)
3. **FIFO分配**: 按 `expiryDate ASC NULLS LAST` 排序后依次扣减

### 4. 增强的验证错误类型

```typescript
interface InsufficientBalanceError extends Error {
  name: 'InsufficientBalanceError'
  message: string                    // 错误消息
  employeeId: string                 // 员工ID
  date: Date                         // 尝试记录的日期
  requested: number                  // 请求的天数
  available: number                  // 该时点可用天数
  details: PointInTimeBalance        // 时点余额详情
}

interface InvalidDateError extends Error {
  name: 'InvalidDateError'
  message: string                    // 错误消息
  date: Date                         // 无效的日期
  reason: 'before-hire' | 'future' | 'no-entitlement'
}
```

## 实体关系

```
Employee (1) ─────< (N) LeaveEntitlement
                         │
                         │ (通过 employeeId + grantDate/expiryDate)
                         │
                         └─── 计算 ──> PointInTimeBalance (运行时)
                                            ↑
                                            │
Employee (1) ─────< (N) LeaveUsage ────────┘
                         (通过 date 字段确定时点)
```

**关系说明**:
- `PointInTimeBalance` 不是持久化实体，而是计算结果
- 通过 `LeaveEntitlement` 和 `LeaveUsage` 的时间字段动态计算
- 每次查询都重新计算，保证数据一致性

## 数据流

### 记录历史休假的数据流

```
1. UI: 用户输入 employeeId + date (2024-09-15) + days (1)
   ↓
2. Store.recordUsage():
   ├─ 验证: date >= employee.hireDate
   ├─ 计算时点余额: calculateBalanceAtDate(employeeId, date)
   │  ├─ 获取 date 时点前的所有额度
   │  ├─ 过滤 date 时点已过期的额度
   │  ├─ 获取 date 前的所有使用记录
   │  └─ 按 FIFO 分配计算剩余额度
   ├─ 验证: remainingDays >= days
   ├─ 通过: 创建 LeaveUsage 记录
   └─ 重算: 调用 recalculateAllEntitlements() 更新当前余额
   ↓
3. Store.recalculateAllEntitlements():
   ├─ 重置所有 LeaveEntitlement.usedDays = 0
   ├─ 遍历所有 LeaveUsage（按 date ASC）
   ├─ 按 FIFO 分配每条使用记录
   └─ 更新所有 LeaveEntitlement.usedDays/remainingDays
   ↓
4. UI: 显示更新后的余额
```

### 查询时点余额的数据流

```
1. 调用: calculateBalanceAtDate(employeeId, targetDate)
   ↓
2. 数据获取:
   ├─ entitlements = LeaveEntitlement
   │                 .filter(e => e.employeeId === id)
   │                 .filter(e => e.grantDate <= targetDate)
   │                 .filter(e => !isExpiredAtDate(e.expiryDate, targetDate))
   │
   └─ usages = LeaveUsage
                .filter(u => u.employeeId === id)
                .filter(u => u.date < targetDate)
   ↓
3. FIFO 分配:
   ├─ 按过期日期排序额度（null 排最后）
   ├─ 按日期排序使用记录
   └─ 依次扣减，计算每批次的 usedDays
   ↓
4. 返回: PointInTimeBalance {
     totalDays, usedDays, remainingDays, entitlements[]
   }
```

## 业务规则

### 时点余额计算规则

1. **额度有效性判断**:
   ```
   isValid = (grantDate <= targetDate) AND
             (expiryDate > targetDate OR expiryDate IS NULL)
   ```

2. **使用记录时间范围**:
   ```
   relevantUsages = usages.filter(u => u.date < targetDate)
   ```
   注意：不包含 targetDate 当天，因为要计算"该时点的余额"

3. **FIFO 扣减顺序**:
   ```
   sortOrder:
     1. expiryDate ASC (最早过期的优先)
     2. NULL 值排最后（永久有效的最后使用）
     3. 相同 expiryDate 按 grantDate ASC
   ```

4. **过期判断**:
   ```
   isExpired = (expiryDate !== null) AND (expiryDate <= targetDate)
   ```

### 验证规则

| 验证项         | 规则                                                           | 错误类型                 |
| -------------- | -------------------------------------------------------------- | ------------------------ |
| 日期不早于入职 | `usage.date >= employee.hireDate`                              | InvalidDateError         |
| 时点有可用额度 | `calculateBalanceAtDate(id, date).totalDays > 0`               | InvalidDateError         |
| 余额足够       | `calculateBalanceAtDate(id, date).remainingDays >= usage.days` | InsufficientBalanceError |
| 不重复记录     | `!existsUsageOnDate(id, date, type)`                           | DuplicateUsageError      |

## 迁移说明

**现有数据兼容性**: ✅ 完全兼容

- 不需要数据迁移脚本
- 不需要修改 localStorage 结构
- 现有数据可以直接使用

**变更影响**:
- `LeaveEntitlement.usedDays/remainingDays` 的计算逻辑变更
- 从"存储值"变为"计算值"（基于当前日期）
- 对外部调用者透明（接口不变）

**测试策略**:
- 单元测试：时点计算函数的各种边界情况
- 集成测试：完整的记录流程验证
- 回归测试：确保现有功能不受影响
