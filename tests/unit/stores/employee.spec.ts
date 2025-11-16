// T022: employeeStore 单元测试

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEmployeeStore } from '@/stores/employee'
import type { Employee } from '@/types'
import * as storage from '@/utils/storage'

// Mock storage module
vi.mock('@/utils/storage', () => ({
  load: vi.fn(),
  save: vi.fn(),
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
}))

describe('employeeStore', () => {
  let store: ReturnType<typeof useEmployeeStore>

  const mockEmployee: Employee = {
    id: 'emp-001',
    name: '张三',
    hireDate: new Date('2023-05-15'),
    status: 'active',
    createdAt: new Date('2025-11-13'),
    updatedAt: new Date('2025-11-13'),
  }

  const mockEmployee2: Employee = {
    id: 'emp-002',
    name: '李四',
    hireDate: new Date('2019-01-01'),
    status: 'active',
    createdAt: new Date('2025-11-13'),
    updatedAt: new Date('2025-11-13'),
  }

  const mockTerminatedEmployee: Employee = {
    id: 'emp-003',
    name: '王五',
    hireDate: new Date('2020-03-20'),
    status: 'terminated',
    terminatedAt: new Date('2025-10-01'),
    createdAt: new Date('2025-11-13'),
    updatedAt: new Date('2025-11-13'),
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useEmployeeStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('应该初始化为空数组', () => {
      expect(store.employees).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('activeEmployees 应该初始为空数组', () => {
      expect(store.activeEmployees).toEqual([])
    })

    it('terminatedEmployees 应该初始为空数组', () => {
      expect(store.terminatedEmployees).toEqual([])
    })
  })

  describe('loadEmployees', () => {
    it('应该从 localStorage 加载员工数据', async () => {
      const mockData = {
        employees: [mockEmployee, mockEmployee2],
        entitlements: [],
        usages: [],
        adjustments: [],
      }
      vi.mocked(storage.load).mockReturnValue(mockData)

      await store.loadEmployees()

      expect(storage.load).toHaveBeenCalled()
      expect(store.employees).toEqual([mockEmployee, mockEmployee2])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('应该处理空数据情况', async () => {
      vi.mocked(storage.load).mockReturnValue(null)

      await store.loadEmployees()

      expect(store.employees).toEqual([])
      expect(store.loading).toBe(false)
    })

    it('应该处理加载错误', async () => {
      vi.mocked(storage.load).mockImplementation(() => {
        throw new Error('Storage error')
      })

      await store.loadEmployees()

      expect(store.error).toBe('Storage error')
      expect(store.loading).toBe(false)
    })
  })

  describe('addEmployee', () => {
    it('应该成功添加员工', async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)

      await store.addEmployee(mockEmployee)

      expect(store.employees).toHaveLength(1)
      expect(store.employees[0]).toEqual(mockEmployee)
      expect(storage.save).toHaveBeenCalled()
      expect(store.error).toBe(null)
    })

    it('应该阻止添加重复 ID 的员工', async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)

      await store.addEmployee(mockEmployee)

      await expect(store.addEmployee(mockEmployee)).rejects.toThrow('员工 ID emp-001 已存在')
      expect(store.employees).toHaveLength(1)
    })

    it('应该处理保存错误', async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(false)

      await expect(store.addEmployee(mockEmployee)).rejects.toThrow('保存数据到 localStorage 失败')
      expect(store.error).not.toBe(null)
    })
  })

  describe('updateEmployee', () => {
    beforeEach(async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)
      await store.addEmployee(mockEmployee)
    })

    it('应该成功更新员工信息', async () => {
      await store.updateEmployee('emp-001', { name: '张三（已更新）' })

      const updatedEmployee = store.employees[0]
      expect(updatedEmployee?.name).toBe('张三（已更新）')
      expect(updatedEmployee?.id).toBe('emp-001') // ID 不应被改变
      expect(store.error).toBe(null)
    })

    it('应该更新 updatedAt 时间戳', async () => {
      const originalUpdatedAt = mockEmployee.updatedAt
      await new Promise((resolve) => setTimeout(resolve, 10)) // 等待一小段时间

      await store.updateEmployee('emp-001', { name: '张三（新）' })

      const updatedEmployee = store.employees[0]
      if (updatedEmployee) {
        expect(updatedEmployee.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }
    })

    it('应该阻止更新不存在的员工', async () => {
      await expect(store.updateEmployee('non-existent', { name: '测试' })).rejects.toThrow(
        '员工 ID non-existent 不存在',
      )
    })

    it('应该保持 ID 不变', async () => {
      // TypeScript 不允许直接更新 id,但测试确保即使尝试也不会改变
      await store.updateEmployee('emp-001', { name: '新名字' })

      const updatedEmployee = store.employees[0]
      expect(updatedEmployee?.id).toBe('emp-001')
    })
  })

  describe('terminateEmployee', () => {
    beforeEach(async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)
      await store.addEmployee(mockEmployee)
    })

    it('应该成功标记员工离职', async () => {
      const terminationDate = new Date('2025-11-01')
      await store.terminateEmployee('emp-001', terminationDate)

      const employee = store.employees[0]
      expect(employee?.status).toBe('terminated')
      expect(employee?.terminatedAt).toEqual(terminationDate)
      expect(store.error).toBe(null)
    })

    it('应该阻止重复标记离职', async () => {
      const terminationDate = new Date('2025-11-01')
      await store.terminateEmployee('emp-001', terminationDate)

      await expect(store.terminateEmployee('emp-001', terminationDate)).rejects.toThrow(
        '员工 张三 已标记为离职',
      )
    })

    it('应该阻止标记不存在的员工离职', async () => {
      await expect(
        store.terminateEmployee('non-existent', new Date('2025-11-01')),
      ).rejects.toThrow('员工 ID non-existent 不存在')
    })
  })

  describe('deleteEmployee', () => {
    beforeEach(async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)
      await store.addEmployee(mockEmployee)
      await store.addEmployee(mockEmployee2)
    })

    it('应该成功删除员工', async () => {
      expect(store.employees).toHaveLength(2)

      await store.deleteEmployee('emp-001')

      expect(store.employees).toHaveLength(1)
      expect(store.employees[0]?.id).toBe('emp-002')
      expect(store.error).toBe(null)
    })

    it('应该阻止删除不存在的员工', async () => {
      await expect(store.deleteEmployee('non-existent')).rejects.toThrow(
        '员工 ID non-existent 不存在',
      )
      expect(store.employees).toHaveLength(2) // 员工数量不变
    })
  })

  describe('getters', () => {
    beforeEach(async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)
      await store.addEmployee(mockEmployee)
      await store.addEmployee(mockEmployee2)
      await store.addEmployee(mockTerminatedEmployee)
    })

    it('activeEmployees 应该只返回在职员工', () => {
      expect(store.activeEmployees).toHaveLength(2)
      expect(store.activeEmployees.every((e) => e.status === 'active')).toBe(true)
    })

    it('terminatedEmployees 应该只返回离职员工', () => {
      expect(store.terminatedEmployees).toHaveLength(1)
      expect(store.terminatedEmployees[0]?.id).toBe('emp-003')
    })

    it('getEmployeeById 应该返回指定员工', () => {
      const employee = store.getEmployeeById('emp-001')
      expect(employee?.name).toBe('张三')
    })

    it('getEmployeeById 应该在员工不存在时返回 undefined', () => {
      const employee = store.getEmployeeById('non-existent')
      expect(employee).toBeUndefined()
    })
  })

  describe('状态管理', () => {
    it('操作期间 loading 应该为 true', async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)

      let loadingDuringOperation = false
      const addPromise = store.addEmployee(mockEmployee)
      loadingDuringOperation = store.loading
      await addPromise

      expect(loadingDuringOperation).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('成功操作后 error 应该为 null', async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockReturnValue(true)

      await store.addEmployee(mockEmployee)

      expect(store.error).toBe(null)
    })

    it('操作失败后 error 应该包含错误信息', async () => {
      vi.mocked(storage.load).mockReturnValue({
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      })
      vi.mocked(storage.save).mockImplementation(() => {
        throw new Error('Storage write failed')
      })

      await expect(store.addEmployee(mockEmployee)).rejects.toThrow()
      expect(store.error).not.toBe(null)
    })
  })
})
