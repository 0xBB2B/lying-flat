// T037: leaveUsageStore - 年假使用记录状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LeaveUsage, LeaveType } from '@/types'
import { load, save } from '@/utils/storage'
import { useLeaveEntitlementStore } from './leaveEntitlement'
import { useEmployeeStore } from './employee'

export const useLeaveUsageStore = defineStore('leaveUsage', () => {
  // State
  const usages = ref<LeaveUsage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters

  /**
   * 获取员工的所有年假使用记录
   */
  const getUsagesByEmployeeId = computed(() => {
    return (employeeId: string) =>
      usages.value
        .filter((u) => u.employeeId === employeeId)
        .sort((a, b) => b.date.getTime() - a.date.getTime()) // 最新的在前
  })

  /**
   * 获取指定日期的年假使用记录
   */
  const getUsagesByDate = computed(() => {
    return (employeeId: string, date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      return usages.value.filter((u) => {
        const usageDateStr = u.date.toISOString().split('T')[0]
        return u.employeeId === employeeId && usageDateStr === dateStr
      })
    }
  })

  /**
   * 检查指定日期是否已有休假记录
   */
  const hasUsageOnDate = computed(() => {
    return (employeeId: string, date: Date, type: LeaveType) => {
      const existing = getUsagesByDate.value(employeeId, date)

      if (existing.length === 0) return false

      // 如果已经有全天休假,不能再添加任何类型
      if (existing.some((u) => u.type === 'full_day')) return true

      // 如果要添加全天休假,但已有任何半天休假,也不能添加
      if (type === 'full_day' && existing.length > 0) return true

      // 如果要添加半天休假,检查是否已有相同类型的半天
      if (type !== 'full_day') {
        return existing.some((u) => u.type === type)
      }

      return false
    }
  })

  /**
   * 获取最近的年假使用记录
   */
  const getRecentUsages = computed(() => {
    return (limit: number = 10) =>
      [...usages.value].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)
  })

  // Actions

  /**
   * 从 localStorage 加载年假使用记录数据
   */
  async function loadUsages(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = load()
      if (data && data.usages) {
        usages.value = data.usages
      } else {
        usages.value = []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载年假使用记录失败'
      console.error('Failed to load usages:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 记录年假使用
   * @param employeeId 员工 ID
   * @param date 休假日期
   * @param type 休假类型 (全天/上午/下午)
   * @param notes 备注 (可选)
   * @param createdBy 操作人 (可选)
   */
  async function recordUsage(
    employeeId: string,
    date: Date,
    type: LeaveType,
    notes?: string,
    createdBy?: string,
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 验证员工是否存在
      const employeeStore = useEmployeeStore()
      const employee = employeeStore.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error(`员工 ID ${employeeId} 不存在`)
      }

      const usageDate = new Date(date)
      usageDate.setHours(0, 0, 0, 0)

      // 检查是否有重复的休假记录
      if (hasUsageOnDate.value(employeeId, usageDate, type)) {
        throw new Error(`${usageDate.toISOString().split('T')[0]} 已有${type === 'full_day' ? '全天' : type === 'morning' ? '上午' : '下午'}休假记录`)
      }

      // 计算休假天数
      const days = type === 'full_day' ? 1 : 0.5

      // 验证年假余额是否足够并扣减
      const leaveEntitlementStore = useLeaveEntitlementStore()
      const deductedEntitlementIds = await leaveEntitlementStore.deductUsage(employeeId, days)

      // 创建使用记录
      const newUsage: LeaveUsage = {
        id: `usage-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        employeeId,
        date: usageDate,
        days,
        type,
        entitlementIds: deductedEntitlementIds, // 记录扣减的额度ID
        notes,
        createdAt: new Date(),
        createdBy,
      }

      usages.value.push(newUsage)

      // 持久化
      await saveUsages()

      // 重新计算所有额度的使用情况
      await leaveEntitlementStore.loadEntitlements()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '记录年假使用失败'
      console.error('Failed to record usage:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除年假使用记录 (慎用)
   * @param id 使用记录 ID
   */
  async function deleteUsage(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const index = usages.value.findIndex((u) => u.id === id)
      if (index === -1) {
        throw new Error(`使用记录 ID ${id} 不存在`)
      }

      // 删除使用记录
      usages.value.splice(index, 1)

      // 持久化
      await saveUsages()

      // 重新计算所有额度的使用情况
      const leaveEntitlementStore = useLeaveEntitlementStore()
      await leaveEntitlementStore.loadEntitlements()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除使用记录失败'
      console.error('Failed to delete usage:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 持久化年假使用记录数据到 localStorage
   */
  async function saveUsages(): Promise<void> {
    try {
      const data = load() || {
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      }

      const success = save({
        ...data,
        usages: usages.value,
      })

      if (!success) {
        throw new Error('保存数据到 localStorage 失败')
      }
    } catch (e) {
      console.error('Failed to save usages:', e)
      throw e
    }
  }

  return {
    // State
    usages,
    loading,
    error,

    // Getters
    getUsagesByEmployeeId,
    getUsagesByDate,
    hasUsageOnDate,
    getRecentUsages,

    // Actions
    loadUsages,
    recordUsage,
    deleteUsage,
  }
})
