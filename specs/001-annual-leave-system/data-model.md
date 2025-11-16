# Data Model: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-14
**Updated**: 2025-11-14 (根据澄清会议更新)
**Source**: [spec.md](./spec.md) → Key Entities section

## 概述

本文档定义系统的核心数据实体、字段类型、验证规则和实体关系。所有类型定义使用 TypeScript 接口。

## 核心实体

### 1. Employee (员工)

**描述**: 代表公司员工的基本信息和状态

**TypeScript 定义**:
```typescript
interface Employee {
  id: string;                    // UUID,唯一标识
  name: string;                  // 员工姓名
  hireDate: Date;                // 入职日期
  status: EmployeeStatus;        // 在职状态
  createdAt: Date;               // 记录创建时间
  updatedAt: Date;               // 记录更新时间
  terminatedAt?: Date;           // 离职日期 (可选)
}

enum EmployeeStatus {
  ACTIVE = 'active',             // 在职
  TERMINATED = 'terminated'      // 已离职
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| id | string | ✅ | 员工唯一标识 | UUID v4 格式 |
| name | string | ✅ | 员工姓名 | 长度 1-50 字符,不能为空白 |
| hireDate | Date | ✅ | 入职日期 | 不能晚于当前日期 |
| status | EmployeeStatus | ✅ | 在职状态 | 枚举值: active 或 terminated |
| createdAt | Date | ✅ | 创建时间 | 自动生成 |
| updatedAt | Date | ✅ | 更新时间 | 自动更新 |
| terminatedAt | Date | ❌ | 离职日期 | 仅当 status=terminated 时必填;不能早于 hireDate |

**计算字段** (不存储,运行时计算):
```typescript
interface EmployeeComputed {
  tenure: number;                 // 连续雇用年限 (精确到小数,单位:年)
  nextLeaveGrantDate: Date;       // 下次年假发放日期 (入职周年日)
  currentLeaveEntitlement: number; // 当前应有的年假总额度 (天)
}
```

**业务规则**:
- 员工离职时,`status` 变更为 `terminated`,`terminatedAt` 设置为离职日期
- 离职员工不在活跃员工列表中显示,但保留所有历史记录
- `tenure` 计算公式: `(currentDate - hireDate) / 365.25` (考虑闰年)
- `nextLeaveGrantDate` 根据入职日期和当前时间计算最近的周年日 (每半年一次)

### 2. LeaveEntitlement (年假额度)

**描述**: 代表员工在特定时间获得的年假额度,每批额度独立跟踪有效期

**TypeScript 定义**:
```typescript
interface LeaveEntitlement {
  id: string;                    // UUID,唯一标识
  employeeId: string;            // 关联的员工 ID
  days: number;                  // 年假天数
  grantDate: Date;               // 发放日期
  source: EntitlementSource;     // 来源类型 (系统自动/手动调整)
  expiryDate: Date | null;       // 过期日期 (系统自动:grantDate+2年;手动调整:null/永久有效)
  status: EntitlementStatus;     // 有效状态
  usedDays: number;              // 已使用天数
  remainingDays: number;         // 剩余天数 (days - usedDays)
  adjustmentId?: string;         // 关联的调整记录ID(仅当source=manual时)
  createdAt: Date;               // 记录创建时间
}

enum EntitlementSource {
  AUTO = 'auto',                 // 系统自动发放
  MANUAL = 'manual'              // 手动调整增加
}

enum EntitlementStatus {
  ACTIVE = 'active',             // 有效
  EXPIRED = 'expired'            // 已过期
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| id | string | ✅ | 额度唯一标识 | UUID v4 格式 |
| employeeId | string | ✅ | 员工 ID | 必须存在于 Employee 表 |
| days | number | ✅ | 发放天数 | 整数,范围 10-20 |
| grantDate | Date | ✅ | 发放日期 | 通常为入职周年日或手动调整日期 |
| source | EntitlementSource | ✅ | 来源类型 | 枚举值: auto 或 manual |
| expiryDate | Date\|null | ✅ | 过期日期 | auto: grantDate+2年; manual: null(永久有效) |
| status | EntitlementStatus | ✅ | 有效状态 | 枚举值: active 或 expired |
| usedDays | number | ✅ | 已使用天数 | >= 0, <= days,支持小数 (0.5) |
| remainingDays | number | ✅ | 剩余天数 | days - usedDays,自动计算 |
| adjustmentId | string | ❌ | 调整记录ID | 仅source=manual时必填 |
| createdAt | Date | ✅ | 创建时间 | 自动生成 |

**业务规则** (根据澄清会议更新):
- 每个员工在每个入职周年日自动创建一条 `source=auto` 的 `LeaveEntitlement` 记录
- 系统自动发放的额度: `expiryDate` 为 `grantDate` 的 2 年后同一日期
- **手动调整增加的额度**: `source=manual`, `expiryDate=null` (永久有效,不过期)
- 过期判定在页面加载时实时计算,不物理修改数据
- 当 `currentDate > expiryDate` 且 `expiryDate != null` 时,该额度被视为过期,不计入可用余额
- 使用年假时优先扣减最早即将过期的额度 (FIFO),手动调整的永久有效额度最后扣减

**发放规则对照表**:
| 入职时长 | 发放天数 | 触发时间 |
|----------|----------|----------|
| 满 0.5 年 | 10 天 | 入职日期 + 6个月 |
| 满 1.5 年 | 11 天 | 入职日期 + 1年6个月 |
| 满 2.5 年 | 12 天 | 入职日期 + 2年6个月 |
| 满 3.5 年 | 14 天 | 入职日期 + 3年6个月 |
| 满 4.5 年 | 16 天 | 入职日期 + 4年6个月 |
| 满 5.5 年 | 18 天 | 入职日期 + 5年6个月 |
| 满 6.5 年及以后 | 20 天 (上限) | 入职日期 + N年6个月 |

### 3. LeaveUsage (年假使用记录)

**描述**: 记录员工实际休年假的情况

**TypeScript 定义**:
```typescript
interface LeaveUsage {
  id: string;                    // UUID,唯一标识
  employeeId: string;            // 关联的员工 ID
  date: Date;                    // 休假日期
  days: number;                  // 休假天数 (1 或 0.5)
  type: LeaveType;               // 休假类型
  entitlementIds: string[];      // 扣减的年假额度 ID 列表
  notes?: string;                // 备注 (可选)
  createdAt: Date;               // 记录创建时间
  createdBy?: string;            // 操作人 (可选,用于审计)
}

enum LeaveType {
  FULL_DAY = 'full_day',         // 全天
  MORNING = 'morning',           // 上午半天
  AFTERNOON = 'afternoon'        // 下午半天
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| id | string | ✅ | 记录唯一标识 | UUID v4 格式 |
| employeeId | string | ✅ | 员工 ID | 必须存在于 Employee 表 |
| date | Date | ✅ | 休假日期 | 不能是未来日期 |
| days | number | ✅ | 休假天数 | 必须为 0.5 或 1 |
| type | LeaveType | ✅ | 休假类型 | 枚举值: full_day, morning, afternoon |
| entitlementIds | string[] | ✅ | 扣减的额度 ID | 至少一个 ID |
| notes | string | ❌ | 备注信息 | 最大长度 200 字符 |
| createdAt | Date | ✅ | 创建时间 | 自动生成 |
| createdBy | string | ❌ | 操作人 | 用于审计 |

**业务规则**:
- 同一员工同一天不能有多条 `FULL_DAY` 记录
- 同一员工同一天可以有一条 `MORNING` 和一条 `AFTERNOON`,但不能重复
- 创建记录前必须验证员工剩余年假余额 >= `days`
- 记录创建后自动从对应的 `LeaveEntitlement` 记录中扣减 `usedDays`
- 优先扣减即将过期的额度 (按 `expiryDate` 升序)

**扣减逻辑示例**:
```
员工有 3 批年假额度:
- Entitlement A: 剩余 3 天,2026-01-01 过期
- Entitlement B: 剩余 5 天,2026-07-01 过期
- Entitlement C: 剩余 10 天,2027-01-01 过期

员工申请 1 天年假:
→ 从 Entitlement A 扣减 1 天 (优先最早过期)

员工申请 4 天年假:
→ 从 Entitlement A 扣减 3 天 (A 剩余全部)
→ 从 Entitlement B 扣减 1 天 (剩余部分)
```

### 4. LeaveAdjustment (年假调整记录)

**描述**: 记录管理员手动调整员工年假的操作,用于特殊情况处理和审计

**TypeScript 定义**:
```typescript
interface LeaveAdjustment {
  id: string;                    // UUID,唯一标识
  employeeId: string;            // 关联的员工 ID
  adjustmentType: AdjustmentType; // 调整类型
  days: number;                  // 调整天数 (绝对值)
  reason: string;                // 调整原因
  balanceBefore: number;         // 调整前余额
  balanceAfter: number;          // 调整后余额
  createdAt: Date;               // 操作时间
  createdBy?: string;            // 操作人 (可选)
}

enum AdjustmentType {
  ADD = 'add',                   // 增加
  DEDUCT = 'deduct'              // 减少
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| id | string | ✅ | 调整记录唯一标识 | UUID v4 格式 |
| employeeId | string | ✅ | 员工 ID | 必须存在于 Employee 表 |
| adjustmentType | AdjustmentType | ✅ | 调整类型 | 枚举值: add 或 deduct |
| days | number | ✅ | 调整天数 | > 0,支持小数 (0.5) |
| reason | string | ✅ | 调整原因 | 长度 1-200 字符,不能为空 |
| balanceBefore | number | ✅ | 调整前余额 | >= 0,支持小数 |
| balanceAfter | number | ✅ | 调整后余额 | >= 0,支持小数 |
| createdAt | Date | ✅ | 操作时间 | 自动生成 |
| createdBy | string | ❌ | 操作人 | 用于审计 |

**业务规则**:
- `reason` 字段必填,防止恶意或误操作
- `balanceBefore` 和 `balanceAfter` 自动记录,便于审计和回溯
- 增加年假时,创建一条新的 `LeaveEntitlement` 记录 (标注为手动调整)
- 减少年假时,从最早过期的额度中扣减
- 所有调整都记录在案,支持导出和审计

## 实体关系图

```
Employee (1) ──────< (N) LeaveEntitlement
    │                        │
    │                        │ (扣减)
    │                        │
    └──< (N) LeaveUsage ─────┘
    │
    └──< (N) LeaveAdjustment
```

**关系说明**:
- 一个 `Employee` 可以有多条 `LeaveEntitlement` 记录 (每年发放一次)
- 一个 `Employee` 可以有多条 `LeaveUsage` 记录 (每次休假)
- 一个 `Employee` 可以有多条 `LeaveAdjustment` 记录 (每次手动调整)
- 一条 `LeaveUsage` 可以关联多条 `LeaveEntitlement` (跨额度扣减)

## 聚合视图 (Computed Views)

### LeaveBalance (年假余额)

**描述**: 员工当前年假余额的聚合视图,不持久化存储,实时计算

```typescript
interface LeaveBalance {
  employeeId: string;
  totalEntitlement: number;      // 总额度 (所有有效额度之和)
  usedDays: number;              // 已使用天数
  remainingDays: number;         // 剩余天数
  expiringSoon: LeaveEntitlement[]; // 即将过期的额度 (30天内)
  nextGrantDate: Date;           // 下次发放日期
  nextGrantDays: number;         // 下次发放天数
}
```

**计算逻辑**:
```typescript
function calculateLeaveBalance(employeeId: string): LeaveBalance {
  const employee = getEmployee(employeeId);
  const entitlements = getActiveEntitlements(employeeId); // 只包含 status=active

  const totalEntitlement = entitlements.reduce((sum, e) => sum + e.days, 0);
  const usedDays = entitlements.reduce((sum, e) => sum + e.usedDays, 0);
  const remainingDays = entitlements.reduce((sum, e) => sum + e.remainingDays, 0);

  const now = new Date();
  const expiringSoon = entitlements.filter(e =>
    e.expiryDate > now &&
    (e.expiryDate.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000 // 30天
  );

  const nextGrantDate = calculateNextLeaveGrantDate(employee.hireDate, now);
  const nextGrantDays = getAnnualLeaveDays(calculateTenure(employee.hireDate, nextGrantDate));

  return {
    employeeId,
    totalEntitlement,
    usedDays,
    remainingDays,
    expiringSoon,
    nextGrantDate,
    nextGrantDays
  };
}
```

## 数据存储格式

### JSON 文件结构

**employees.json**:
```json
{
  "employees": [
    {
      "id": "uuid-1",
      "name": "张三",
      "hireDate": "2023-05-15T00:00:00.000Z",
      "status": "active",
      "createdAt": "2025-11-13T10:00:00.000Z",
      "updatedAt": "2025-11-13T10:00:00.000Z"
    }
  ]
}
```

**leaves.json**:
```json
{
  "entitlements": [
    {
      "id": "uuid-ent-1",
      "employeeId": "uuid-1",
      "days": 10,
      "grantDate": "2023-11-15T00:00:00.000Z",
      "expiryDate": "2025-11-15T00:00:00.000Z",
      "status": "active",
      "usedDays": 3,
      "remainingDays": 7,
      "createdAt": "2023-11-15T00:00:00.000Z"
    }
  ],
  "usages": [
    {
      "id": "uuid-usage-1",
      "employeeId": "uuid-1",
      "date": "2025-11-10T00:00:00.000Z",
      "days": 1,
      "type": "full_day",
      "entitlementIds": ["uuid-ent-1"],
      "createdAt": "2025-11-10T08:00:00.000Z"
    }
  ],
  "adjustments": [
    {
      "id": "uuid-adj-1",
      "employeeId": "uuid-1",
      "adjustmentType": "add",
      "days": 2,
      "reason": "加班补偿",
      "balanceBefore": 7,
      "balanceAfter": 9,
      "createdAt": "2025-11-12T14:00:00.000Z",
      "createdBy": "admin"
    }
  ]
}
```

## 数据迁移和版本控制

**版本**: v1.0.0

如未来需要调整数据结构,在 JSON 文件中增加 `version` 字段:
```json
{
  "version": "1.0.0",
  "employees": [...]
}
```

迁移脚本检测 `version` 字段,自动执行数据转换。
