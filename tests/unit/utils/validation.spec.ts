// T018: validation单元测试

import { describe, it, expect } from 'vitest'
import {
  validateEmployee,
  validateLeaveUsage,
  validateLeaveAdjustment,
  validateDuplicateLeave,
} from '@/utils/validation'
import { EmployeeStatus, LeaveType, AdjustmentType } from '@/types'
import type { LeaveUsage } from '@/types'

describe('validation', () => {
  describe('validateEmployee', () => {
    it('合法的员工数据应该通过验证', () => {
      const employee = {
        name: '张三',
        hireDate: new Date('2023-01-15'),
        status: EmployeeStatus.ACTIVE,
      }

      const result = validateEmployee(employee)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('姓名为空应该失败', () => {
      const employee = {
        name: '',
        hireDate: new Date('2023-01-15'),
      }

      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('员工姓名不能为空')
    })

    it('姓名超过50个字符应该失败', () => {
      const employee = {
        name: 'a'.repeat(51),
        hireDate: new Date('2023-01-15'),
      }

      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('员工姓名长度不能超过50个字符')
    })

    it('入职日期晚于当前日期应该失败', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const employee = {
        name: '张三',
        hireDate: futureDate,
      }

      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('入职日期不能晚于当前日期')
    })

    it('离职日期早于入职日期应该失败', () => {
      const employee = {
        name: '张三',
        hireDate: new Date('2023-06-01'),
        terminatedAt: new Date('2023-01-01'),
      }

      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('离职日期不能早于入职日期')
    })
  })

  describe('validateLeaveUsage', () => {
    it('合法的休假数据应该通过验证', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 1,
        type: LeaveType.FULL_DAY,
      }

      const result = validateLeaveUsage(usage, 10)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('休假天数为0.5(半天)应该通过验证', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 0.5,
        type: LeaveType.MORNING,
      }

      const result = validateLeaveUsage(usage, 10)
      expect(result.valid).toBe(true)
    })

    it('休假天数不是0.5或1应该失败', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 2,
        type: LeaveType.FULL_DAY,
      }

      const result = validateLeaveUsage(usage, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('休假天数必须为 0.5 或 1')
    })

    it('余额不足应该失败', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 1,
        type: LeaveType.FULL_DAY,
      }

      const result = validateLeaveUsage(usage, 0.5)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('年假余额不足')
    })

    it('全天休假天数不是1应该失败', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 0.5,
        type: LeaveType.FULL_DAY,
      }

      const result = validateLeaveUsage(usage, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('全天休假应该是 1 天')
    })

    it('半天休假天数不是0.5应该失败', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 1,
        type: LeaveType.MORNING,
      }

      const result = validateLeaveUsage(usage, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('半天休假应该是 0.5 天')
    })

    it('备注超过200字符应该失败', () => {
      const usage = {
        date: new Date('2023-06-15'),
        days: 1,
        type: LeaveType.FULL_DAY,
        notes: 'a'.repeat(201),
      }

      const result = validateLeaveUsage(usage, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('备注长度不能超过200个字符')
    })
  })

  describe('validateLeaveAdjustment', () => {
    it('合法的调整数据应该通过验证', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.ADD,
        days: 5,
        reason: '加班补偿',
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('调整天数为0应该失败', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.ADD,
        days: 0,
        reason: '测试',
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('调整天数必须大于 0')
    })

    it('调整天数为负数应该失败', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.ADD,
        days: -5,
        reason: '测试',
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('调整天数必须大于 0')
    })

    it('调整天数超过50应该失败', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.ADD,
        days: 51,
        reason: '测试',
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('调整天数不能超过50天')
    })

    it('减少天数超过余额应该失败', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.DEDUCT,
        days: 15,
        reason: '测试',
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('无法减少')
    })

    it('原因为空应该失败', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.ADD,
        days: 5,
        reason: '',
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('调整原因不能为空')
    })

    it('原因超过200字符应该失败', () => {
      const adjustment = {
        adjustmentType: AdjustmentType.ADD,
        days: 5,
        reason: 'a'.repeat(201),
      }

      const result = validateLeaveAdjustment(adjustment, 10)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('调整原因长度不能超过200个字符')
    })
  })

  describe('validateDuplicateLeave', () => {
    it('同一天没有记录应该通过验证', () => {
      const date = new Date('2023-06-15')
      const type = LeaveType.FULL_DAY
      const existingUsages: LeaveUsage[] = []

      const result = validateDuplicateLeave(date, type, existingUsages)
      expect(result.valid).toBe(true)
    })

    it('同一天申请全天休假但已有记录应该失败', () => {
      const date = new Date('2023-06-15')
      const type = LeaveType.FULL_DAY
      const existingUsages: LeaveUsage[] = [
        {
          id: '1',
          employeeId: 'emp1',
          date: new Date('2023-06-15'),
          days: 0.5,
          type: LeaveType.MORNING,
          entitlementIds: [],
          createdAt: new Date(),
        },
      ]

      const result = validateDuplicateLeave(date, type, existingUsages)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('已有休假记录')
    })

    it('同一天申请上午半天但已有上午记录应该失败', () => {
      const date = new Date('2023-06-15')
      const type = LeaveType.MORNING
      const existingUsages: LeaveUsage[] = [
        {
          id: '1',
          employeeId: 'emp1',
          date: new Date('2023-06-15'),
          days: 0.5,
          type: LeaveType.MORNING,
          entitlementIds: [],
          createdAt: new Date(),
        },
      ]

      const result = validateDuplicateLeave(date, type, existingUsages)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('已有上午的休假记录')
    })

    it('同一天申请下午半天但已有全天记录应该失败', () => {
      const date = new Date('2023-06-15')
      const type = LeaveType.AFTERNOON
      const existingUsages: LeaveUsage[] = [
        {
          id: '1',
          employeeId: 'emp1',
          date: new Date('2023-06-15'),
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: [],
          createdAt: new Date(),
        },
      ]

      const result = validateDuplicateLeave(date, type, existingUsages)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('已有全天休假记录')
    })

    it('同一天申请上午半天且已有下午记录应该通过', () => {
      const date = new Date('2023-06-15')
      const type = LeaveType.MORNING
      const existingUsages: LeaveUsage[] = [
        {
          id: '1',
          employeeId: 'emp1',
          date: new Date('2023-06-15'),
          days: 0.5,
          type: LeaveType.AFTERNOON,
          entitlementIds: [],
          createdAt: new Date(),
        },
      ]

      const result = validateDuplicateLeave(date, type, existingUsages)
      expect(result.valid).toBe(true)
    })
  })
})
