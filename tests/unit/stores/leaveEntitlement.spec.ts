// T013-T015: leaveEntitlementStore.calculateBalanceAtDate 单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import { useEmployeeStore } from '@/stores/employee'
import type { Employee, LeaveEntitlement, PointInTimeEntitlement } from '@/types'
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

describe('leaveEntitlementStore - calculateBalanceAtDate', () => {
  let entitlementStore: ReturnType<typeof useLeaveEntitlementStore>
  let employeeStore: ReturnType<typeof useEmployeeStore>

  // Mock 员工：2021年4月1日入职
  const mockEmployee: Employee = {
    id: 'emp-001',
    name: '张三',
    hireDate: new Date('2021-04-01'),
    status: 'active',
    terminatedAt: null,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    entitlementStore = useLeaveEntitlementStore()
    employeeStore = useEmployeeStore()
    vi.clearAllMocks()

    // 设置员工数据
    employeeStore.employees = [mockEmployee]
  })

  describe('T013: calculateBalanceAtDate with historical date (2024-09-15)', () => {
    it('应该正确计算2024年9月15日时点的余额', () => {
      // 设置额度数据
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2021-10-01'), // 首次发放
          expiryDate: new Date('2023-10-01'), // 已过期
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          createdAt: new Date(),
        },
        {
          id: 'ent-002',
          employeeId: 'emp-001',
          days: 11,
          grantDate: new Date('2022-10-01'), // 第二次发放
          expiryDate: new Date('2024-10-01'), // 2024-09-15时有效
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 11,
          createdAt: new Date(),
        },
        {
          id: 'ent-003',
          employeeId: 'emp-001',
          days: 12,
          grantDate: new Date('2023-10-01'), // 第三次发放
          expiryDate: new Date('2025-10-01'), // 2024-09-15时有效
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 12,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      // 设置使用记录（2024-09-15之前使用了5天）
      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [
          {
            id: 'usage-001',
            employeeId: 'emp-001',
            date: new Date('2024-08-01'),
            days: 3,
            type: 'full_day',
            entitlementIds: [],
            createdAt: new Date(),
          },
          {
            id: 'usage-002',
            employeeId: 'emp-001',
            date: new Date('2024-08-15'),
            days: 2,
            type: 'full_day',
            entitlementIds: [],
            createdAt: new Date(),
          },
        ],
        adjustments: [],
      })

      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2024-09-15'))

      // 2024-09-15时点：
      // - 2021年批次已过期，不计入
      // - 2022年批次11天有效
      // - 2023年批次12天有效
      // - 总额度: 11 + 12 = 23天
      // - 已使用: 5天
      // - 剩余: 18天
      expect(balance.totalDays).toBe(23)
      expect(balance.usedDays).toBe(5)
      expect(balance.remainingDays).toBe(18)
      expect(balance.employeeId).toBe('emp-001')
      // 检查日期是否为2024-09-15的午夜（本地时间）
      const expectedDate = new Date('2024-09-15')
      expectedDate.setHours(0, 0, 0, 0)
      expect(balance.date.getTime()).toBe(expectedDate.getTime())
      expect(balance.entitlements).toHaveLength(2) // 2个有效批次
    })
  })

  describe('T014: calculateBalanceAtDate filters expired entitlements correctly', () => {
    it('应该正确过滤在目标时点已过期的额度', () => {
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2021-10-01'),
          expiryDate: new Date('2023-10-01'), // 在2024-09-15时已过期
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          createdAt: new Date(),
        },
        {
          id: 'ent-002',
          employeeId: 'emp-001',
          days: 11,
          grantDate: new Date('2022-10-01'),
          expiryDate: new Date('2024-10-01'), // 在2024-09-15时有效
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 11,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [],
        adjustments: [],
      })

      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2024-09-15'))

      // 只有第二批次有效
      expect(balance.totalDays).toBe(11)
      expect(balance.entitlements).toHaveLength(1)
      expect(balance.entitlements[0].id).toBe('ent-002')
    })

    it('永久有效的额度（expiryDate为null）不应该被过滤', () => {
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2022-01-01'),
          expiryDate: null, // 永久有效
          source: 'manual',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          adjustmentId: 'adj-001',
          createdAt: new Date(),
        },
        {
          id: 'ent-002',
          employeeId: 'emp-001',
          days: 11,
          grantDate: new Date('2022-10-01'),
          expiryDate: new Date('2023-10-01'), // 已过期
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 11,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [],
        adjustments: [],
      })

      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2024-09-15'))

      // 只有永久有效的额度
      expect(balance.totalDays).toBe(10)
      expect(balance.entitlements).toHaveLength(1)
      expect(balance.entitlements[0].expiryDate).toBeNull()
    })
  })

  describe('T015: calculateBalanceAtDate with date before first grant returns correct result', () => {
    it('入职未满6个月时，总额度应该为0', () => {
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2021-10-01'), // 入职6个月后发放
          expiryDate: new Date('2023-10-01'),
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [],
        adjustments: [],
      })

      // 查询2021年9月1日时点（入职5个月，首次发放前）
      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2021-09-01'))

      expect(balance.totalDays).toBe(0)
      expect(balance.usedDays).toBe(0)
      expect(balance.remainingDays).toBe(0)
      expect(balance.entitlements).toHaveLength(0)
    })

    it('查询首次发放当天，应该有额度', () => {
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2021-10-01'),
          expiryDate: new Date('2023-10-01'),
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [],
        adjustments: [],
      })

      // 查询首次发放当天
      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2021-10-01'))

      expect(balance.totalDays).toBe(10)
      expect(balance.remainingDays).toBe(10)
    })
  })

  describe('FIFO allocation', () => {
    it('应该优先从最早过期的额度扣减', () => {
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2022-10-01'),
          expiryDate: new Date('2024-10-01'), // 最早过期
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          createdAt: new Date(),
        },
        {
          id: 'ent-002',
          employeeId: 'emp-001',
          days: 12,
          grantDate: new Date('2023-10-01'),
          expiryDate: new Date('2025-10-01'), // 较晚过期
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 12,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      // 使用了5天
      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [
          {
            id: 'usage-001',
            employeeId: 'emp-001',
            date: new Date('2024-08-01'),
            days: 5,
            type: 'full_day',
            entitlementIds: [],
            createdAt: new Date(),
          },
        ],
        adjustments: [],
      })

      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2024-09-01'))

      // FIFO: 应该先从ent-001扣减5天
      const ent001 = balance.entitlements.find((e: PointInTimeEntitlement) => e.id === 'ent-001')
      const ent002 = balance.entitlements.find((e: PointInTimeEntitlement) => e.id === 'ent-002')

      expect(ent001?.usedDays).toBe(5)
      expect(ent001?.remainingDays).toBe(5)
      expect(ent002?.usedDays).toBe(0)
      expect(ent002?.remainingDays).toBe(12)
    })

    it('永久有效的额度应该最后扣减', () => {
      const entitlements: LeaveEntitlement[] = [
        {
          id: 'ent-001',
          employeeId: 'emp-001',
          days: 5,
          grantDate: new Date('2022-01-01'),
          expiryDate: null, // 永久有效
          source: 'manual',
          status: 'active',
          usedDays: 0,
          remainingDays: 5,
          adjustmentId: 'adj-001',
          createdAt: new Date(),
        },
        {
          id: 'ent-002',
          employeeId: 'emp-001',
          days: 10,
          grantDate: new Date('2022-10-01'),
          expiryDate: new Date('2024-10-01'), // 会过期
          source: 'auto',
          status: 'active',
          usedDays: 0,
          remainingDays: 10,
          createdAt: new Date(),
        },
      ]

      entitlementStore.entitlements = entitlements

      // 使用了8天
      vi.mocked(storage.load).mockReturnValue({
        employees: [mockEmployee],
        entitlements,
        usages: [
          {
            id: 'usage-001',
            employeeId: 'emp-001',
            date: new Date('2024-08-01'),
            days: 8,
            type: 'full_day',
            entitlementIds: [],
            createdAt: new Date(),
          },
        ],
        adjustments: [],
      })

      const balance = entitlementStore.calculateBalanceAtDate('emp-001', new Date('2024-09-01'))

      // FIFO: 先扣减会过期的ent-002（10天全部扣完不够），再扣减永久的
      // 但是ent-002只有10天，还差不够，不会扣减永久的
      const ent001 = balance.entitlements.find((e: PointInTimeEntitlement) => e.id === 'ent-001')
      const ent002 = balance.entitlements.find((e: PointInTimeEntitlement) => e.id === 'ent-002')

      expect(ent002?.usedDays).toBe(8) // 先扣8天
      expect(ent002?.remainingDays).toBe(2)
      expect(ent001?.usedDays).toBe(0) // 永久的还没用到
      expect(ent001?.remainingDays).toBe(5)
    })
  })
})
