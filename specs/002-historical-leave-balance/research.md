# Technical Research: 历史休假记录时点额度计算修复

**Feature**: 002-historical-leave-balance | **Date**: 2025-11-17
**Research Phase**: Phase 0 - 技术决策与设计方案

## 研究目标

本Bug修复不涉及新技术选型，主要研究以下技术决策点：
1. 时点余额计算算法设计
2. 数据结构是否需要变更
3. 性能优化策略
4. 向后兼容性保证

## 技术决策

### 决策 1: 时点余额计算方法

**问题**: 如何在不改变现有数据结构的前提下，实现基于任意历史时点的余额计算？

**选项评估**:

| 方案                                | 优点                       | 缺点                                           | 决策   |
| ----------------------------------- | -------------------------- | ---------------------------------------------- | ------ |
| A. 在数据库中存储每个时点的余额快照 | 查询快速                   | 存储空间大，维护复杂，与localStorage方案不匹配 | ❌ 拒绝 |
| B. 实时计算：遍历所有额度和使用记录 | 无需额外存储，数据一致性强 | 每次查询都需要重新计算                         | ✅ 采用 |
| C. 缓存计算结果                     | 平衡性能和存储             | 缓存失效逻辑复杂，可能导致不一致               | ❌ 拒绝 |

**最终决策**: 方案B - 实时计算

**理由**:
- 符合现有localStorage架构（无服务器端）
- 数据量小（~100员工），计算成本可接受
- 保证数据一致性，无缓存失效问题
- 测试和维护更简单

**实现要点**:
```typescript
// 时点余额计算算法伪代码
function calculateBalanceAtDate(employeeId: string, targetDate: Date): PointInTimeBalance {
  // 1. 获取该时点前（含当天）所有已发放的额度
  const entitlements = getEntitlementsUpToDate(employeeId, targetDate)

  // 2. 过滤掉在该时点已过期的额度
  const activeEntitlements = filterExpiredAtDate(entitlements, targetDate)

  // 3. 获取该时点前所有的使用记录
  const usages = getUsagesBeforeDate(employeeId, targetDate)

  // 4. 按FIFO原则分配使用记录到额度批次
  const allocatedEntitlements = allocateUsagesToEntitlements(activeEntitlements, usages)

  // 5. 计算总余额
  return {
    totalDays: sum(activeEntitlements.days),
    usedDays: sum(usages.days),
    remainingDays: totalDays - usedDays,
    entitlements: allocatedEntitlements
  }
}
```

### 决策 2: 数据结构变更

**问题**: 是否需要修改LeaveEntitlement或LeaveUsage的数据结构？

**评估**:
- 现有`LeaveEntitlement`已包含：id, employeeId, days, grantDate, expiryDate, usedDays, remainingDays
- 现有`LeaveUsage`已包含：id, employeeId, date, days, type
- 这些字段足以支持时点计算

**最终决策**: 不修改存储的数据结构，仅添加运行时计算的类型定义

**理由**:
- 现有字段已足够
- 避免数据迁移
- 保持向后兼容性

**新增类型定义**:
```typescript
// 仅用于运行时计算结果，不存储
interface PointInTimeBalance {
  date: Date                    // 查询的时点
  employeeId: string            // 员工ID
  totalDays: number             // 该时点的总额度
  usedDays: number              // 该时点已使用天数
  remainingDays: number         // 该时点剩余天数
  entitlements: Array<{         // 各批次额度详情
    id: string
    days: number
    grantDate: Date
    expiryDate: Date | null
    usedDays: number            // 该批次在此时点的已用天数
    remainingDays: number       // 该批次在此时点的剩余天数
  }>
}
```

### 决策 3: FIFO扣减算法实现

**问题**: 如何在历史时点正确应用FIFO（先过期先使用）原则？

**算法设计**:
```typescript
function allocateUsagesToEntitlements(
  entitlements: LeaveEntitlement[],
  usages: LeaveUsage[]
): AllocatedEntitlement[] {
  // 1. 按过期日期排序额度（null=永久有效排最后）
  const sorted = entitlements.sort((a, b) => {
    if (a.expiryDate === null) return 1
    if (b.expiryDate === null) return -1
    return a.expiryDate.getTime() - b.expiryDate.getTime()
  })

  // 2. 初始化每批额度的已用天数为0
  const allocated = sorted.map(e => ({ ...e, usedDays: 0, remainingDays: e.days }))

  // 3. 按时间顺序处理使用记录
  const sortedUsages = usages.sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const usage of sortedUsages) {
    let remainingToAllocate = usage.days

    // 4. 从最早过期的额度开始扣减
    for (const ent of allocated) {
      if (remainingToAllocate <= 0) break
      if (ent.remainingDays <= 0) continue

      const toDeduct = Math.min(remainingToAllocate, ent.remainingDays)
      ent.usedDays += toDeduct
      ent.remainingDays -= toDeduct
      remainingToAllocate -= toDeduct
    }

    // 5. 如果还有剩余，说明余额不足（不应该发生）
    if (remainingToAllocate > 0) {
      throw new Error('Insufficient balance - data inconsistency detected')
    }
  }

  return allocated
}
```

**验证策略**:
- 单元测试覆盖各种边界情况
- 集成测试验证多批次额度的扣减顺序
- 性能测试确保在100员工x100条记录规模下<1秒

### 决策 4: 性能优化策略

**问题**: 如何确保时点计算在1秒内完成？

**优化方案**:

1. **日期比较优化**
   - 使用 `date.getTime()` 进行数值比较，避免字符串转换
   - 预计算时间戳，减少重复调用

2. **数据过滤优化**
   - 一次性过滤而不是多次遍历
   - 使用Array.filter和Array.reduce的链式调用

3. **避免深拷贝**
   - 仅在必要时复制对象
   - 使用浅拷贝代替深拷贝

4. **懒加载**
   - 只计算当前需要的员工的余额
   - 不预先计算所有员工

**预期性能**:
- 单个员工时点计算: <50ms
- 批量删除/添加后重新计算: <500ms
- 目标：远低于1秒的性能要求

### 决策 5: 向后兼容性保证

**问题**: 如何确保修复不影响现有功能和数据？

**兼容性策略**:

1. **数据兼容**
   - 不修改localStorage的数据结构
   - 不添加新的存储字段
   - 现有数据无需迁移

2. **API兼容**
   - 保留所有现有Store方法的签名
   - 新增方法不影响现有调用
   - 修改内部逻辑，不改变外部接口

3. **行为兼容**
   - 对于当前日期的休假记录，行为保持不变
   - 仅修复历史日期的计算逻辑
   - 所有现有测试用例应继续通过

**验证方法**:
- 运行完整的现有测试套件
- 手动测试现有功能流程
- 使用真实数据进行回归测试

## 替代方案（已拒绝）

### 方案A: 事件溯源（Event Sourcing）

**描述**: 存储所有状态变更事件，通过重放事件计算任意时点状态

**拒绝理由**:
- 过度设计，不符合项目规模
- 需要重构整个数据层
- localStorage不适合存储大量事件

### 方案C: 预计算快照表

**描述**: 每天生成一次所有员工的余额快照

**拒绝理由**:
- 需要定时任务（前端应用无服务器端）
- 无法处理任意时点查询
- 增加数据管理复杂度

## 最佳实践参考

### Date-fns使用

```typescript
import {
  isBefore,
  isAfter,
  compareAsc,
  differenceInMonths
} from 'date-fns'

// 时点比较
const isBeforeOrEqual = (date1: Date, date2: Date) =>
  !isAfter(date1, date2)

// 过期判断
const isExpiredAtDate = (expiryDate: Date | null, targetDate: Date) =>
  expiryDate !== null && isBefore(expiryDate, targetDate)
```

### TypeScript类型安全

```typescript
// 使用品牌类型确保日期已标准化
type NormalizedDate = Date & { __normalized: true }

function normalizeDate(date: Date): NormalizedDate {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized as NormalizedDate
}
```

## 总结

本次修复采用实时计算方案，在不改变数据结构的前提下，通过增强计算逻辑实现时点余额查询。主要变更集中在：

1. **Utils层**: 新增时点计算函数
2. **Store层**: 修改验证逻辑使用时点计算
3. **Types层**: 新增运行时类型定义
4. **Tests层**: 完整覆盖时点计算场景

所有决策优先考虑：
- 简单性（Simple > Complex）
- 可测试性（Testable > Clever）
- 可维护性（Explicit > Implicit）
- 兼容性（Compatible > Breaking）
