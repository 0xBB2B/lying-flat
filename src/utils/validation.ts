// T014: 数据验证工具

import type { Employee, LeaveUsage, LeaveAdjustment, LeaveType } from '@/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 验证员工数据
 */
export function validateEmployee(data: Partial<Employee>): ValidationResult {
  const errors: string[] = []

  // 验证姓名
  if (!data.name || data.name.trim().length === 0) {
    errors.push('员工姓名不能为空')
  } else if (data.name.length > 50) {
    errors.push('员工姓名长度不能超过50个字符')
  }

  // 验证入职日期
  if (!data.hireDate) {
    errors.push('入职日期不能为空')
  } else {
    // 检查日期是否有效
    if (isNaN(data.hireDate.getTime())) {
      errors.push('入职日期无效')
    } else if (data.hireDate > new Date()) {
      errors.push('入职日期不能晚于当前日期')
    }
  }

  // 验证离职日期 (如果存在)
  if (data.terminatedAt) {
    if (isNaN(data.terminatedAt.getTime())) {
      errors.push('离职日期无效')
    } else if (data.hireDate && data.terminatedAt < data.hireDate) {
      errors.push('离职日期不能早于入职日期')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 验证年假使用数据
 */
export function validateLeaveUsage(
  usage: Partial<LeaveUsage>,
  availableBalance: number,
): ValidationResult {
  const errors: string[] = []

  // 验证休假日期
  if (!usage.date) {
    errors.push('休假日期不能为空')
  } else if (isNaN(usage.date.getTime())) {
    errors.push('休假日期无效')
  }

  // 验证休假天数
  if (usage.days === undefined || usage.days === null) {
    errors.push('休假天数不能为空')
  } else if (usage.days !== 0.5 && usage.days !== 1) {
    errors.push('休假天数必须为 0.5 或 1')
  }

  // 验证休假类型
  if (!usage.type) {
    errors.push('休假类型不能为空')
  } else {
    const validTypes = ['full_day', 'morning', 'afternoon']
    if (!validTypes.includes(usage.type)) {
      errors.push('休假类型无效')
    }

    // 验证休假类型与天数的一致性
    if (usage.type === 'full_day' && usage.days !== 1) {
      errors.push('全天休假应该是 1 天')
    } else if (
      (usage.type === 'morning' || usage.type === 'afternoon') &&
      usage.days !== 0.5
    ) {
      errors.push('半天休假应该是 0.5 天')
    }
  }

  // 验证年假余额
  if (usage.days && usage.days > availableBalance) {
    errors.push(`年假余额不足,剩余 ${availableBalance} 天,申请 ${usage.days} 天`)
  }

  // 验证备注长度
  if (usage.notes && usage.notes.length > 200) {
    errors.push('备注长度不能超过200个字符')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 验证年假调整数据
 */
export function validateLeaveAdjustment(
  adjustment: Partial<LeaveAdjustment>,
  currentBalance: number,
): ValidationResult {
  const errors: string[] = []

  // 验证调整类型
  if (!adjustment.adjustmentType) {
    errors.push('调整类型不能为空')
  } else {
    const validTypes = ['add', 'deduct']
    if (!validTypes.includes(adjustment.adjustmentType)) {
      errors.push('调整类型无效')
    }
  }

  // 验证调整天数
  if (adjustment.days === undefined || adjustment.days === null) {
    errors.push('调整天数不能为空')
  } else if (adjustment.days <= 0) {
    errors.push('调整天数必须大于 0')
  } else if (adjustment.days > 50) {
    errors.push('调整天数不能超过50天')
  }

  // 验证减少操作时的余额是否足够
  if (adjustment.adjustmentType === 'deduct' && adjustment.days) {
    if (adjustment.days > currentBalance) {
      errors.push(`无法减少 ${adjustment.days} 天,当前余额仅剩 ${currentBalance} 天`)
    }
  }

  // 验证原因
  if (!adjustment.reason || adjustment.reason.trim().length === 0) {
    errors.push('调整原因不能为空')
  } else if (adjustment.reason.length > 200) {
    errors.push('调整原因长度不能超过200个字符')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 验证同一天是否已经有相同类型的休假记录
 */
export function validateDuplicateLeave(
  date: Date,
  type: LeaveType,
  existingUsages: LeaveUsage[],
): ValidationResult {
  const errors: string[] = []

  // 检查同一天是否已有记录
  const sameDay = existingUsages.filter(
    (u) => u.date.toDateString() === date.toDateString(),
  )

  // 如果是全天休假,同一天不能有任何记录
  if (type === 'full_day' && sameDay.length > 0) {
    errors.push('该日期已有休假记录,不能再申请全天休假')
  }

  // 如果是半天休假,检查是否已有相同时段的记录
  if (type === 'morning' || type === 'afternoon') {
    const sameType = sameDay.filter((u) => u.type === type)
    if (sameType.length > 0) {
      errors.push(`该日期已有${type === 'morning' ? '上午' : '下午'}的休假记录`)
    }

    // 检查是否已有全天休假
    const fullDay = sameDay.filter((u) => u.type === 'full_day')
    if (fullDay.length > 0) {
      errors.push('该日期已有全天休假记录')
    }
  }

  return { valid: errors.length === 0, errors }
}
