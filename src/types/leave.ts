// T007-T010: Leave相关类型定义
// T003: 增加时点余额相关类型定义 (PointInTimeBalance, PointInTimeEntitlement)

// LeaveEntitlement (年假额度)
export enum EntitlementSource {
  AUTO = 'auto', // 系统自动发放
  MANUAL = 'manual', // 手动调整增加
}

export enum EntitlementStatus {
  ACTIVE = 'active', // 有效
  EXPIRED = 'expired', // 已过期
}

export interface LeaveEntitlement {
  id: string // UUID,唯一标识
  employeeId: string // 关联的员工 ID
  days: number // 年假天数
  grantDate: Date // 发放日期
  source: EntitlementSource // 来源类型 (系统自动/手动调整)
  expiryDate: Date | null // 过期日期 (系统自动:grantDate+2年;手动调整:null/永久有效)
  status: EntitlementStatus // 有效状态
  usedDays: number // 已使用天数
  remainingDays: number // 剩余天数 (days - usedDays)
  adjustmentId?: string // 关联的调整记录ID(仅当source=manual时)
  createdAt: Date // 记录创建时间
}

// LeaveUsage (年假使用记录)
export enum LeaveType {
  FULL_DAY = 'full_day', // 全天
  MORNING = 'morning', // 上午半天
  AFTERNOON = 'afternoon', // 下午半天
}

export interface LeaveUsage {
  id: string // UUID,唯一标识
  employeeId: string // 关联的员工 ID
  date: Date // 休假日期
  days: number // 休假天数 (1 或 0.5)
  type: LeaveType // 休假类型
  entitlementIds: string[] // 扣减的年假额度 ID 列表
  notes?: string // 备注 (可选)
  createdAt: Date // 记录创建时间
  createdBy?: string // 操作人 (可选,用于审计)
}

// LeaveAdjustment (年假调整记录)
export enum AdjustmentType {
  ADD = 'add', // 增加
  DEDUCT = 'deduct', // 减少
}

export interface LeaveAdjustment {
  id: string // UUID,唯一标识
  employeeId: string // 关联的员工 ID
  adjustmentType: AdjustmentType // 调整类型
  days: number // 调整天数 (绝对值)
  reason: string // 调整原因
  balanceBefore: number // 调整前余额
  balanceAfter: number // 调整后余额
  createdAt: Date // 操作时间
  createdBy?: string // 操作人 (可选)
}

// LeaveBalance (年假余额聚合视图)
export interface LeaveBalance {
  employeeId: string
  totalEntitlement: number // 总额度 (所有有效额度之和)
  usedDays: number // 已使用天数
  remainingDays: number // 剩余天数
  expiringSoon: LeaveEntitlement[] // 即将过期的额度 (30天内)
  nextGrantDate: Date // 下次发放日期
  nextGrantDays: number // 下次发放天数
}

// PointInTimeBalance (时点余额快照) - 运行时类型，不持久化
export interface PointInTimeBalance {
  date: Date // 查询的时点日期
  employeeId: string // 员工ID
  totalDays: number // 该时点的总额度（已发放且未过期）
  usedDays: number // 该时点已使用天数
  remainingDays: number // 该时点剩余天数
  entitlements: PointInTimeEntitlement[] // 各批次额度详情
}

// PointInTimeEntitlement (时点额度详情) - 运行时类型，不持久化
export interface PointInTimeEntitlement {
  id: string // 额度ID
  days: number // 该批次总天数
  grantDate: Date // 发放日期
  expiryDate: Date | null // 过期日期
  source: EntitlementSource // 来源类型
  usedDays: number // 该批次在此时点的已用天数
  remainingDays: number // 该批次在此时点的剩余天数
  isExpired: boolean // 在该时点是否已过期
}
