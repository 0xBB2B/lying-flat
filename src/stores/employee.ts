// T020: employeeStore - 员工状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Employee, EmployeeStatus } from '@/types'
import { load, save } from '@/utils/storage'

export const useEmployeeStore = defineStore('employee', () => {
  // State
  const employees = ref<Employee[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeEmployees = computed(() =>
    employees.value.filter((e) => e.status === 'active'),
  )

  const terminatedEmployees = computed(() =>
    employees.value.filter((e) => e.status === 'terminated'),
  )

  const getEmployeeById = computed(() => {
    return (id: string) => employees.value.find((e) => e.id === id)
  })

  // Actions

  /**
   * 从 localStorage 加载员工数据
   */
  async function loadEmployees(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = load()
      if (data && data.employees) {
        employees.value = data.employees
      } else {
        employees.value = []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载员工数据失败'
      console.error('Failed to load employees:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加新员工
   * @param employee 员工数据
   */
  async function addEmployee(employee: Employee): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 检查员工ID是否已存在
      if (employees.value.some((e) => e.id === employee.id)) {
        throw new Error(`员工 ID ${employee.id} 已存在`)
      }

      // 添加员工
      employees.value.push(employee)

      // 持久化
      await saveEmployees()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加员工失败'
      console.error('Failed to add employee:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新员工信息
   * @param id 员工 ID
   * @param updates 更新的字段
   */
  async function updateEmployee(
    id: string,
    updates: Partial<Omit<Employee, 'id'>>,
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const index = employees.value.findIndex((e) => e.id === id)
      if (index === -1) {
        throw new Error(`员工 ID ${id} 不存在`)
      }

      const currentEmployee = employees.value[index]
      if (!currentEmployee) {
        throw new Error(`员工 ID ${id} 不存在`)
      }

      // 更新员工信息
      employees.value[index] = {
        ...currentEmployee,
        ...updates,
        id: currentEmployee.id, // 确保 ID 不被覆盖
        updatedAt: new Date(),
      }

      // 持久化
      await saveEmployees()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新员工信息失败'
      console.error('Failed to update employee:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 标记员工离职
   * @param id 员工 ID
   * @param terminatedAt 离职日期
   */
  async function terminateEmployee(id: string, terminatedAt: Date): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const index = employees.value.findIndex((e) => e.id === id)
      if (index === -1) {
        throw new Error(`员工 ID ${id} 不存在`)
      }

      const employee = employees.value[index]
      if (!employee) {
        throw new Error(`员工 ID ${id} 不存在`)
      }

      if (employee.status === 'terminated') {
        throw new Error(`员工 ${employee.name} 已标记为离职`)
      }

      // 更新状态
      employees.value[index] = {
        ...employee,
        status: 'terminated' as EmployeeStatus,
        terminatedAt,
        updatedAt: new Date(),
      }

      // 持久化
      await saveEmployees()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '标记员工离职失败'
      console.error('Failed to terminate employee:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除员工 (物理删除,慎用)
   * @param id 员工 ID
   */
  async function deleteEmployee(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const index = employees.value.findIndex((e) => e.id === id)
      if (index === -1) {
        throw new Error(`员工 ID ${id} 不存在`)
      }

      // 删除员工
      employees.value.splice(index, 1)

      // 持久化
      await saveEmployees()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除员工失败'
      console.error('Failed to delete employee:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 持久化员工数据到 localStorage
   */
  async function saveEmployees(): Promise<void> {
    try {
      const data = load() || {
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      }

      const success = save({
        ...data,
        employees: employees.value,
      })

      if (!success) {
        throw new Error('保存数据到 localStorage 失败')
      }
    } catch (e) {
      console.error('Failed to save employees:', e)
      throw e
    }
  }

  return {
    // State
    employees,
    loading,
    error,

    // Getters
    activeEmployees,
    terminatedEmployees,
    getEmployeeById,

    // Actions
    loadEmployees,
    addEmployee,
    updateEmployee,
    terminateEmployee,
    deleteEmployee,
  }
})
