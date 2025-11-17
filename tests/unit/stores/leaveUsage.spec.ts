// T044: leaveUsageStore 单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import { LeaveType, type Employee, type LeaveEntitlement } from '@/types'
import * as storage from '@/utils/storage'

// Mock storage utilities
vi.mock('@/utils/storage', () => ({
  load: vi.fn(() => ({
    employees: [],
    entitlements: [],
    usages: [],
    adjustments: [],
  })),
  save: vi.fn(() => true),
}))

describe('leaveUsageStore', () => {
  let usageStore: ReturnType<typeof useLeaveUsageStore>
  let employeeStore: ReturnType<typeof useEmployeeStore>
  let entitlementStore: ReturnType<typeof useLeaveEntitlementStore>

  const mockEmployee: Employee = {
    id: 'emp-1',
    name: '测试员工',
    hireDate: new Date('2023-01-01'),
    status: 'active',
    terminatedAt: null,
  }

  const mockEntitlement: LeaveEntitlement = {
    id: 'ent-1',
    employeeId: 'emp-1',
    grantDate: new Date('2024-01-01'),
    expiryDate: new Date('2025-12-31'),
    days: 10,
    usedDays: 0,
    remainingDays: 10,
    grantNumber: 1,
    source: 'annual',
    adjustmentId: null,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    usageStore = useLeaveUsageStore()
    employeeStore = useEmployeeStore()
    entitlementStore = useLeaveEntitlementStore()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(usageStore.usages).toEqual([])
      expect(usageStore.loading).toBe(false)
      expect(usageStore.error).toBe(null)
    })
  })

  describe('loadUsages', () => {
    it('应该从 storage 加载使用记录', async () => {
      const mockUsages = [
        {
          id: 'usage-1',
          employeeId: 'emp-1',
          date: new Date('2024-01-15'),
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: new Date(),
        },
      ]

      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: mockUsages,
        adjustments: [],
      })

      await usageStore.loadUsages()

      expect(usageStore.usages).toEqual(mockUsages)
      expect(usageStore.loading).toBe(false)
      expect(usageStore.error).toBe(null)
    })

    it('storage 为空时应该返回空数组', async () => {
      vi.mocked(storage.load).mockReturnValue(null)

      await usageStore.loadUsages()

      expect(usageStore.usages).toEqual([])
    })

    it('加载失败时应该设置错误', async () => {
      vi.mocked(storage.load).mockImplementation(() => {
        throw new Error('加载失败')
      })

      await usageStore.loadUsages()

      expect(usageStore.error).toBe('加载失败')
      expect(usageStore.usages).toEqual([])
    })
  })

  describe('getUsagesByEmployeeId', () => {
    beforeEach(async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      usageStore.usages = [
        {
          id: 'usage-1',
          employeeId: 'emp-1',
          date: yesterday,
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: yesterday,
        },
        {
          id: 'usage-2',
          employeeId: 'emp-1',
          date: today,
          days: 0.5,
          type: LeaveType.MORNING,
          entitlementIds: ['ent-1'],
          createdAt: today,
        },
        {
          id: 'usage-3',
          employeeId: 'emp-2',
          date: today,
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-2'],
          createdAt: today,
        },
      ]
    })

    it('应该返回指定员工的所有使用记录', () => {
      const result = usageStore.getUsagesByEmployeeId('emp-1')
      expect(result).toHaveLength(2)
      expect(result.every((u) => u.employeeId === 'emp-1')).toBe(true)
    })

    it('应该按日期降序排序(最新的在前)', () => {
      const result = usageStore.getUsagesByEmployeeId('emp-1')
      expect(result[0].id).toBe('usage-2') // today
      expect(result[1].id).toBe('usage-1') // yesterday
    })

    it('员工没有使用记录时应该返回空数组', () => {
      const result = usageStore.getUsagesByEmployeeId('emp-999')
      expect(result).toEqual([])
    })
  })

  describe('getUsagesByDate', () => {
    beforeEach(() => {
      const targetDate = new Date('2024-01-15')
      const otherDate = new Date('2024-01-16')

      usageStore.usages = [
        {
          id: 'usage-1',
          employeeId: 'emp-1',
          date: targetDate,
          days: 0.5,
          type: LeaveType.MORNING,
          entitlementIds: ['ent-1'],
          createdAt: targetDate,
        },
        {
          id: 'usage-2',
          employeeId: 'emp-1',
          date: targetDate,
          days: 0.5,
          type: LeaveType.AFTERNOON,
          entitlementIds: ['ent-1'],
          createdAt: targetDate,
        },
        {
          id: 'usage-3',
          employeeId: 'emp-1',
          date: otherDate,
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: otherDate,
        },
      ]
    })

    it('应该返回指定员工在指定日期的所有使用记录', () => {
      const date = new Date('2024-01-15')
      const result = usageStore.getUsagesByDate('emp-1', date)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('usage-1')
      expect(result[1].id).toBe('usage-2')
    })

    it('没有记录时应该返回空数组', () => {
      const date = new Date('2024-01-20')
      const result = usageStore.getUsagesByDate('emp-1', date)

      expect(result).toEqual([])
    })
  })

  describe('hasUsageOnDate', () => {
    beforeEach(() => {
      const targetDate = new Date('2024-01-15')

      usageStore.usages = [
        {
          id: 'usage-1',
          employeeId: 'emp-1',
          date: targetDate,
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: targetDate,
        },
        {
          id: 'usage-2',
          employeeId: 'emp-2',
          date: targetDate,
          days: 0.5,
          type: LeaveType.MORNING,
          entitlementIds: ['ent-2'],
          createdAt: targetDate,
        },
      ]
    })

    it('已有全天休假时,任何类型都应返回 true', () => {
      const date = new Date('2024-01-15')

      expect(usageStore.hasUsageOnDate('emp-1', date, LeaveType.FULL_DAY)).toBe(true)
      expect(usageStore.hasUsageOnDate('emp-1', date, LeaveType.MORNING)).toBe(true)
      expect(usageStore.hasUsageOnDate('emp-1', date, LeaveType.AFTERNOON)).toBe(true)
    })

    it('已有上午休假时,再次添加上午应返回 true', () => {
      const date = new Date('2024-01-15')

      expect(usageStore.hasUsageOnDate('emp-2', date, LeaveType.MORNING)).toBe(true)
    })

    it('已有上午休假时,添加下午应返回 false', () => {
      const date = new Date('2024-01-15')

      expect(usageStore.hasUsageOnDate('emp-2', date, LeaveType.AFTERNOON)).toBe(false)
    })

    it('已有上午休假时,添加全天应返回 true', () => {
      const date = new Date('2024-01-15')

      expect(usageStore.hasUsageOnDate('emp-2', date, LeaveType.FULL_DAY)).toBe(true)
    })

    it('没有记录时应返回 false', () => {
      const date = new Date('2024-01-20')

      expect(usageStore.hasUsageOnDate('emp-1', date, LeaveType.FULL_DAY)).toBe(false)
    })
  })

  describe('getRecentUsages', () => {
    beforeEach(() => {
      usageStore.usages = Array.from({ length: 15 }, (_, i) => {
        const date = new Date('2024-01-01')
        date.setDate(date.getDate() + i)
        return {
          id: `usage-${i}`,
          employeeId: 'emp-1',
          date,
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: date,
        }
      })
    })

    it('应该返回最近的 10 条记录(默认)', () => {
      const result = usageStore.getRecentUsages()
      expect(result).toHaveLength(10)
    })

    it('应该按日期降序排序', () => {
      const result = usageStore.getRecentUsages()
      expect(result[0].id).toBe('usage-14')
      expect(result[9].id).toBe('usage-5')
    })

    it('应该支持自定义数量', () => {
      const result = usageStore.getRecentUsages(5)
      expect(result).toHaveLength(5)
      expect(result[0].id).toBe('usage-14')
      expect(result[4].id).toBe('usage-10')
    })
  })

  describe('recordUsage', () => {
    beforeEach(async () => {
      // Reset storage.load mock
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      // 设置员工
      employeeStore.employees = [mockEmployee]

      // 设置额度
      entitlementStore.entitlements = [mockEntitlement]
    })

    it('应该成功记录全天休假', async () => {
      // Mock deductUsage to return entitlement IDs
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      const date = new Date('2024-01-15')

      await usageStore.recordUsage('emp-1', date, LeaveType.FULL_DAY, '测试备注')

      expect(usageStore.usages).toHaveLength(1)
      expect(usageStore.usages[0].employeeId).toBe('emp-1')
      expect(usageStore.usages[0].days).toBe(1)
      expect(usageStore.usages[0].type).toBe(LeaveType.FULL_DAY)
      expect(usageStore.usages[0].notes).toBe('测试备注')
      expect(storage.save).toHaveBeenCalled()
    })

    it('应该成功记录半天休假', async () => {
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      const date = new Date('2024-01-15')

      await usageStore.recordUsage('emp-1', date, LeaveType.MORNING)

      expect(usageStore.usages).toHaveLength(1)
      expect(usageStore.usages[0].days).toBe(0.5)
      expect(usageStore.usages[0].type).toBe(LeaveType.MORNING)
    })

    it('应该调用 entitlementStore.deductUsage 扣减余额', async () => {
      const deductUsageSpy = vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      const date = new Date('2024-01-15')
      await usageStore.recordUsage('emp-1', date, LeaveType.FULL_DAY)

      expect(deductUsageSpy).toHaveBeenCalledWith('emp-1', 1)
      expect(usageStore.usages[0].entitlementIds).toEqual(['ent-1'])
    })

    it('员工不存在时应该抛出错误', async () => {
      const date = new Date('2024-01-15')

      await expect(usageStore.recordUsage('emp-999', date, LeaveType.FULL_DAY)).rejects.toThrow(
        '员工 ID emp-999 不存在',
      )

      expect(usageStore.usages).toHaveLength(0)
    })

    it('应该允许记录未来的休假日期', async () => {
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      const future = new Date()
      future.setDate(future.getDate() + 5)
      future.setHours(0, 0, 0, 0)

      await usageStore.recordUsage('emp-1', future, LeaveType.FULL_DAY)

      expect(usageStore.usages).toHaveLength(1)
      expect(usageStore.usages[0].date.getTime()).toBe(future.getTime())
    })

    it('同一天已有全天休假时应该抛出错误', async () => {
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      // Use yesterday to ensure it's not in the future
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      // 先记录一个全天休假
      await usageStore.recordUsage('emp-1', yesterday, LeaveType.FULL_DAY)

      // 确认记录已添加
      expect(usageStore.usages).toHaveLength(1)

      // 尝试再次记录应该抛出错误(使用同一个date对象)
      await expect(usageStore.recordUsage('emp-1', yesterday, LeaveType.MORNING)).rejects.toThrow(
        '已有',
      )
    })

    it('同一天已有上午休假时,再记录上午应该抛出错误', async () => {
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      // Use yesterday to ensure it's not in the future
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      // 先记录上午
      await usageStore.recordUsage('emp-1', yesterday, LeaveType.MORNING)

      // 确认记录已添加
      expect(usageStore.usages).toHaveLength(1)

      // 尝试再次记录上午应该抛出错误(使用同一个date对象)
      await expect(usageStore.recordUsage('emp-1', yesterday, LeaveType.MORNING)).rejects.toThrow(
        '已有',
      )
    })

    it('同一天已有上午休假时,可以记录下午', async () => {
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      const date = new Date('2024-01-15')

      // 先记录上午
      await usageStore.recordUsage('emp-1', date, LeaveType.MORNING)

      // 记录下午应该成功
      await usageStore.recordUsage('emp-1', date, LeaveType.AFTERNOON)

      expect(usageStore.usages).toHaveLength(2)
    })

    it('应该设置 createdBy 参数', async () => {
      vi.spyOn(entitlementStore, 'deductUsage').mockResolvedValue(['ent-1'])

      const date = new Date('2024-01-15')

      await usageStore.recordUsage('emp-1', date, LeaveType.FULL_DAY, undefined, 'admin')

      expect(usageStore.usages[0].createdBy).toBe('admin')
    })

    it('余额不足时应该抛出错误', async () => {
      // Mock deductUsage 抛出余额不足错误
      vi.spyOn(entitlementStore, 'deductUsage').mockRejectedValue(new Error('年假余额不足'))

      const date = new Date('2024-01-15')

      await expect(usageStore.recordUsage('emp-1', date, LeaveType.FULL_DAY)).rejects.toThrow(
        '年假余额不足',
      )

      expect(usageStore.usages).toHaveLength(0)
    })
  })

  describe('deleteUsage', () => {
    beforeEach(() => {
      // Reset storage.load mock to return proper data
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      usageStore.usages = [
        {
          id: 'usage-1',
          employeeId: 'emp-1',
          date: new Date('2024-01-15'),
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: new Date(),
        },
        {
          id: 'usage-2',
          employeeId: 'emp-1',
          date: new Date('2024-01-16'),
          days: 0.5,
          type: LeaveType.MORNING,
          entitlementIds: ['ent-1'],
          createdAt: new Date(),
        },
      ]
    })

    it('应该成功删除使用记录', async () => {
      await usageStore.deleteUsage('usage-1')

      expect(usageStore.usages).toHaveLength(1)
      expect(usageStore.usages[0].id).toBe('usage-2')
      expect(storage.save).toHaveBeenCalled()
    })

    it('记录不存在时应该抛出错误', async () => {
      await expect(usageStore.deleteUsage('usage-999')).rejects.toThrow(
        '使用记录 ID usage-999 不存在',
      )

      expect(usageStore.usages).toHaveLength(2)
    })

    it('删除后应该持久化数据', async () => {
      await usageStore.deleteUsage('usage-1')

      expect(storage.save).toHaveBeenCalledWith({
        employees: [],
        entitlements: [],
        usages: usageStore.usages,
        adjustments: [],
      })
    })
  })

  describe('error handling', () => {
    it('recordUsage 失败时应该设置 error', async () => {
      employeeStore.employees = [mockEmployee]

      // Mock deductUsage 失败
      vi.spyOn(entitlementStore, 'deductUsage').mockRejectedValue(new Error('扣减失败'))

      const date = new Date('2024-01-15')

      await expect(usageStore.recordUsage('emp-1', date, LeaveType.FULL_DAY)).rejects.toThrow()

      expect(usageStore.error).toBeTruthy()
    })

    it('deleteUsage 失败时应该设置 error', async () => {
      vi.mocked(storage.save).mockReturnValue(false)

      usageStore.usages = [
        {
          id: 'usage-1',
          employeeId: 'emp-1',
          date: new Date('2024-01-15'),
          days: 1,
          type: LeaveType.FULL_DAY,
          entitlementIds: ['ent-1'],
          createdAt: new Date(),
        },
      ]

      await expect(usageStore.deleteUsage('usage-1')).rejects.toThrow()

      expect(usageStore.error).toBeTruthy()
    })
  })
})
