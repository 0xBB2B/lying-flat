// T069: storage单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { save, load, exportToJSON, importFromJSON, clear } from '@/utils/storage'
import type { Employee, LeaveEntitlement, LeaveUsage, LeaveAdjustment } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('storage.ts', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('save()', () => {
    it('应该成功保存数据到localStorage', () => {
      const data = {
        employees: [] as Employee[],
        entitlements: [] as LeaveEntitlement[],
        usages: [] as LeaveUsage[],
        adjustments: [] as LeaveAdjustment[],
      }

      const result = save(data)

      expect(result).toBe(true)
      expect(localStorage.getItem('annual-leave-system:data')).toBeTruthy()
    })

    it('保存的数据应该包含version和lastUpdated字段', () => {
      const data = {
        employees: [] as Employee[],
        entitlements: [] as LeaveEntitlement[],
        usages: [] as LeaveUsage[],
        adjustments: [] as LeaveAdjustment[],
      }

      save(data)

      const savedData = JSON.parse(localStorage.getItem('annual-leave-system:data')!)
      expect(savedData.version).toBe('1.0.0')
      expect(savedData.lastUpdated).toBeDefined()
      expect(new Date(savedData.lastUpdated).getTime()).toBeGreaterThan(0)
    })

    it('应该正确序列化Date对象', () => {
      const employee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'active',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
      }

      const data = {
        employees: [employee],
        entitlements: [] as LeaveEntitlement[],
        usages: [] as LeaveUsage[],
        adjustments: [] as LeaveAdjustment[],
      }

      save(data)

      const savedData = JSON.parse(localStorage.getItem('annual-leave-system:data')!)
      expect(savedData.employees[0].hireDate).toBe('2023-01-01T00:00:00.000Z')
    })

    it('应该在localStorage抛出异常时返回false', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full')
      })

      const data = {
        employees: [] as Employee[],
        entitlements: [] as LeaveEntitlement[],
        usages: [] as LeaveUsage[],
        adjustments: [] as LeaveAdjustment[],
      }

      const result = save(data)

      expect(result).toBe(false)
    })
  })

  describe('load()', () => {
    it('localStorage为空时应返回null', () => {
      const result = load()
      expect(result).toBeNull()
    })

    it('应该成功加载并解析数据', () => {
      const employee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'active',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
      }

      save({
        employees: [employee],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      const loaded = load()

      expect(loaded).not.toBeNull()
      expect(loaded!.employees).toHaveLength(1)
      expect(loaded!.employees[0].name).toBe('张三')
    })

    it('应该正确恢复Date对象', () => {
      const employee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'active',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
      }

      save({
        employees: [employee],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      const loaded = load()

      expect(loaded!.employees[0].hireDate).toBeInstanceOf(Date)
      expect(loaded!.employees[0].hireDate.getTime()).toBe(new Date('2023-01-01').getTime())
    })

    it('应该正确恢复可选的terminatedAt日期', () => {
      const employee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'terminated',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
        terminatedAt: new Date('2025-06-01'),
      }

      save({
        employees: [employee],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      const loaded = load()

      expect(loaded!.employees[0].terminatedAt).toBeInstanceOf(Date)
      expect(loaded!.employees[0].terminatedAt!.getTime()).toBe(new Date('2025-06-01').getTime())
    })

    it('应该正确恢复LeaveEntitlement的日期字段', () => {
      const entitlement: LeaveEntitlement = {
        id: 'ent-1',
        employeeId: 'emp-1',
        days: 10,
        grantDate: new Date('2023-07-01'),
        source: 'auto',
        expiryDate: new Date('2025-07-01'),
        status: 'active',
        usedDays: 0,
        remainingDays: 10,
        createdAt: new Date('2023-07-01'),
      }

      save({
        employees: [],
        entitlements: [entitlement],
        usages: [],
        adjustments: [],
      })

      const loaded = load()

      expect(loaded!.entitlements[0].grantDate).toBeInstanceOf(Date)
      expect(loaded!.entitlements[0].expiryDate).toBeInstanceOf(Date)
    })

    it('应该正确恢复LeaveEntitlement的null expiryDate(手动调整)', () => {
      const entitlement: LeaveEntitlement = {
        id: 'ent-1',
        employeeId: 'emp-1',
        days: 5,
        grantDate: new Date('2025-01-01'),
        source: 'manual',
        expiryDate: null, // 永久有效
        status: 'active',
        usedDays: 0,
        remainingDays: 5,
        createdAt: new Date('2025-01-01'),
        adjustmentId: 'adj-1',
      }

      save({
        employees: [],
        entitlements: [entitlement],
        usages: [],
        adjustments: [],
      })

      const loaded = load()

      expect(loaded!.entitlements[0].expiryDate).toBeNull()
    })

    it('应该正确恢复LeaveUsage的日期字段', () => {
      const usage: LeaveUsage = {
        id: 'usage-1',
        employeeId: 'emp-1',
        date: new Date('2025-11-10'),
        days: 1,
        type: 'full_day',
        entitlementIds: ['ent-1'],
        createdAt: new Date('2025-11-10'),
      }

      save({
        employees: [],
        entitlements: [],
        usages: [usage],
        adjustments: [],
      })

      const loaded = load()

      expect(loaded!.usages[0].date).toBeInstanceOf(Date)
      expect(loaded!.usages[0].createdAt).toBeInstanceOf(Date)
    })

    it('应该正确恢复LeaveAdjustment的日期字段', () => {
      const adjustment: LeaveAdjustment = {
        id: 'adj-1',
        employeeId: 'emp-1',
        adjustmentType: 'add',
        days: 2,
        reason: '加班补偿',
        balanceBefore: 10,
        balanceAfter: 12,
        createdAt: new Date('2025-11-12'),
      }

      save({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [adjustment],
      })

      const loaded = load()

      expect(loaded!.adjustments[0].createdAt).toBeInstanceOf(Date)
    })

    it('应该在数据格式无效时返回null', () => {
      localStorage.setItem('annual-leave-system:data', '{"invalid": true}')

      const result = load()

      expect(result).toBeNull()
    })

    it('应该在JSON解析失败时返回null', () => {
      localStorage.setItem('annual-leave-system:data', 'invalid json')

      const result = load()

      expect(result).toBeNull()
    })
  })

  describe('exportToJSON()', () => {
    it('localStorage为空时应导出空数据结构', () => {
      const json = exportToJSON()
      const data = JSON.parse(json)

      expect(data.version).toBe('1.0.0')
      expect(data.employees).toEqual([])
      expect(data.entitlements).toEqual([])
      expect(data.usages).toEqual([])
      expect(data.adjustments).toEqual([])
    })

    it('应该导出格式化的JSON字符串', () => {
      save({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      const json = exportToJSON()

      expect(json).toContain('\n') // 包含换行,说明已格式化
      expect(JSON.parse(json)).toBeDefined()
    })

    it('应该导出完整的数据', () => {
      const employee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'active',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
      }

      save({
        employees: [employee],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      const json = exportToJSON()
      const data = JSON.parse(json)

      expect(data.employees).toHaveLength(1)
      expect(data.employees[0].name).toBe('张三')
    })
  })

  describe('importFromJSON()', () => {
    it('应该成功导入有效的JSON数据', () => {
      const validData = {
        version: '1.0.0',
        employees: [
          {
            id: 'emp-1',
            name: '张三',
            hireDate: '2023-01-01T00:00:00.000Z',
            status: 'active',
            createdAt: '2025-11-13T00:00:00.000Z',
            updatedAt: '2025-11-13T00:00:00.000Z',
          },
        ],
        entitlements: [],
        usages: [],
        adjustments: [],
        lastUpdated: '2025-11-13T00:00:00.000Z',
      }

      const result = importFromJSON(JSON.stringify(validData))

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      // 验证数据已保存
      const loaded = load()
      expect(loaded!.employees).toHaveLength(1)
      expect(loaded!.employees[0].name).toBe('张三')
    })

    it('应该在缺少version字段时返回错误', () => {
      const invalidData = {
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      }

      const result = importFromJSON(JSON.stringify(invalidData))

      expect(result.success).toBe(false)
      expect(result.error).toBe('缺少版本信息')
    })

    it('应该在employees字段格式错误时返回错误', () => {
      const invalidData = {
        version: '1.0.0',
        employees: 'not-an-array',
        entitlements: [],
        usages: [],
        adjustments: [],
      }

      const result = importFromJSON(JSON.stringify(invalidData))

      expect(result.success).toBe(false)
      expect(result.error).toBe('employees 字段格式错误')
    })

    it('应该在entitlements字段格式错误时返回错误', () => {
      const invalidData = {
        version: '1.0.0',
        employees: [],
        entitlements: 'not-an-array',
        usages: [],
        adjustments: [],
      }

      const result = importFromJSON(JSON.stringify(invalidData))

      expect(result.success).toBe(false)
      expect(result.error).toBe('entitlements 字段格式错误')
    })

    it('应该在usages字段格式错误时返回错误', () => {
      const invalidData = {
        version: '1.0.0',
        employees: [],
        entitlements: [],
        usages: 'not-an-array',
        adjustments: [],
      }

      const result = importFromJSON(JSON.stringify(invalidData))

      expect(result.success).toBe(false)
      expect(result.error).toBe('usages 字段格式错误')
    })

    it('应该在adjustments字段格式错误时返回错误', () => {
      const invalidData = {
        version: '1.0.0',
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: 'not-an-array',
      }

      const result = importFromJSON(JSON.stringify(invalidData))

      expect(result.success).toBe(false)
      expect(result.error).toBe('adjustments 字段格式错误')
    })

    it('应该在JSON解析失败时返回错误', () => {
      const result = importFromJSON('invalid json')

      expect(result.success).toBe(false)
      expect(result.error).toContain('解析 JSON 失败')
    })

    it('应该正确恢复Date对象', () => {
      const validData = {
        version: '1.0.0',
        employees: [
          {
            id: 'emp-1',
            name: '张三',
            hireDate: '2023-01-01T00:00:00.000Z',
            status: 'active',
            createdAt: '2025-11-13T00:00:00.000Z',
            updatedAt: '2025-11-13T00:00:00.000Z',
          },
        ],
        entitlements: [],
        usages: [],
        adjustments: [],
        lastUpdated: '2025-11-13T00:00:00.000Z',
      }

      importFromJSON(JSON.stringify(validData))

      const loaded = load()
      expect(loaded!.employees[0].hireDate).toBeInstanceOf(Date)
    })
  })

  describe('clear()', () => {
    it('应该清空localStorage中的数据', () => {
      save({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      expect(localStorage.getItem('annual-leave-system:data')).toBeTruthy()

      clear()

      expect(localStorage.getItem('annual-leave-system:data')).toBeNull()
    })

    it('调用clear后load应返回null', () => {
      save({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      clear()

      const result = load()
      expect(result).toBeNull()
    })
  })

  describe('综合测试', () => {
    it('完整流程: save → load → export → import', () => {
      // 1. 保存数据
      const originalEmployee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'active',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
      }

      save({
        employees: [originalEmployee],
        entitlements: [],
        usages: [],
        adjustments: [],
      })

      // 2. 加载数据
      const loaded = load()
      expect(loaded!.employees[0].name).toBe('张三')

      // 3. 导出JSON
      const json = exportToJSON()
      expect(json).toBeTruthy()

      // 4. 清空数据
      clear()
      expect(load()).toBeNull()

      // 5. 从JSON导入
      const result = importFromJSON(json)
      expect(result.success).toBe(true)

      // 6. 验证导入后的数据
      const reloaded = load()
      expect(reloaded!.employees[0].name).toBe('张三')
      expect(reloaded!.employees[0].hireDate).toBeInstanceOf(Date)
    })

    it('应该处理包含所有实体类型的复杂数据', () => {
      const employee: Employee = {
        id: 'emp-1',
        name: '张三',
        hireDate: new Date('2023-01-01'),
        status: 'active',
        createdAt: new Date('2025-11-13'),
        updatedAt: new Date('2025-11-13'),
      }

      const entitlement: LeaveEntitlement = {
        id: 'ent-1',
        employeeId: 'emp-1',
        days: 10,
        grantDate: new Date('2023-07-01'),
        source: 'auto',
        expiryDate: new Date('2025-07-01'),
        status: 'active',
        usedDays: 2,
        remainingDays: 8,
        createdAt: new Date('2023-07-01'),
      }

      const usage: LeaveUsage = {
        id: 'usage-1',
        employeeId: 'emp-1',
        date: new Date('2025-11-10'),
        days: 1,
        type: 'full_day',
        entitlementIds: ['ent-1'],
        createdAt: new Date('2025-11-10'),
      }

      const adjustment: LeaveAdjustment = {
        id: 'adj-1',
        employeeId: 'emp-1',
        adjustmentType: 'add',
        days: 2,
        reason: '加班补偿',
        balanceBefore: 10,
        balanceAfter: 12,
        createdAt: new Date('2025-11-12'),
      }

      save({
        employees: [employee],
        entitlements: [entitlement],
        usages: [usage],
        adjustments: [adjustment],
      })

      const loaded = load()

      expect(loaded!.employees).toHaveLength(1)
      expect(loaded!.entitlements).toHaveLength(1)
      expect(loaded!.usages).toHaveLength(1)
      expect(loaded!.adjustments).toHaveLength(1)

      // 验证所有Date对象都已正确恢复
      expect(loaded!.employees[0].hireDate).toBeInstanceOf(Date)
      expect(loaded!.entitlements[0].grantDate).toBeInstanceOf(Date)
      expect(loaded!.usages[0].date).toBeInstanceOf(Date)
      expect(loaded!.adjustments[0].createdAt).toBeInstanceOf(Date)
    })
  })
})
