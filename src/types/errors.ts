// T004: 自定义错误类型 - 用于时点余额计算和验证

import type { PointInTimeBalance } from './leave'

/**
 * 余额不足错误
 * 当尝试记录休假但时点余额不足时抛出
 */
export class InsufficientBalanceError extends Error {
  name = 'InsufficientBalanceError'
  employeeId: string
  date: Date
  requested: number
  available: number
  details: PointInTimeBalance

  constructor(
    message: string,
    context: {
      employeeId: string
      date: Date
      requested: number
      available: number
      details: PointInTimeBalance
    },
  ) {
    super(message)
    this.employeeId = context.employeeId
    this.date = context.date
    this.requested = context.requested
    this.available = context.available
    this.details = context.details
  }
}

/**
 * 无效日期错误
 * 当休假日期不符合业务规则时抛出
 */
export class InvalidDateError extends Error {
  name = 'InvalidDateError'
  date: Date
  reason: 'before-hire' | 'future' | 'no-entitlement'

  constructor(
    message: string,
    context: { date: Date; reason: 'before-hire' | 'future' | 'no-entitlement' },
  ) {
    super(message)
    this.date = context.date
    this.reason = context.reason
  }
}
