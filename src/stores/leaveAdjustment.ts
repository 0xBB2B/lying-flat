// T029: leaveAdjustmentStore - 年假调整记录状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LeaveAdjustment, AdjustmentType } from '@/types'
import { load, save } from '@/utils/storage'
import { useLeaveEntitlementStore } from './leaveEntitlement'
import { useEmployeeStore } from './employee'

export const useLeaveAdjustmentStore = defineStore('leaveAdjustment', () => {
  // State
  const adjustments = ref<LeaveAdjustment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters

  /**
   * 获取员工的所有调整记录
   */
  const getAdjustmentsByEmployeeId = computed(() => {
    return (employeeId: string) =>
      adjustments.value
        .filter((a) => a.employeeId === employeeId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // 最新的在前
  })

  /**
   * 获取最近的调整记录 (限制数量)
   */
  const getRecentAdjustments = computed(() => {
    return (limit: number = 10) =>
      [...adjustments.value].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  })

  // Actions

  /**
   * 从 localStorage 加载调整记录数据
   */
  async function loadAdjustments(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = load()
      if (data && data.adjustments) {
        adjustments.value = data.adjustments
      } else {
        adjustments.value = []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载调整记录数据失败'
      console.error('Failed to load adjustments:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加年假 (手动增加)
   * @param employeeId 员工 ID
   * @param days 增加天数
   * @param reason 调整原因
   * @param createdBy 操作人 (可选)
   */
  async function addLeave(
    employeeId: string,
    days: number,
    reason: string,
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

      // 验证天数
      if (days <= 0) {
        throw new Error('增加的天数必须大于 0')
      }

      if (days > 365) {
        throw new Error('增加的天数不能超过 365 天')
      }

      // 计算调整前后余额
      const leaveEntitlementStore = useLeaveEntitlementStore()
      const balance = leaveEntitlementStore.calculateBalance(employeeId)
      const balanceBefore = balance.remainingDays
      const balanceAfter = balanceBefore + days

      // 创建调整记录
      const newAdjustment: LeaveAdjustment = {
        id: `adj-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        employeeId,
        adjustmentType: 'add' as AdjustmentType,
        days,
        reason,
        balanceBefore,
        balanceAfter,
        createdAt: new Date(),
        createdBy,
      }

      adjustments.value.push(newAdjustment)

      // 在 leaveEntitlement 中添加手动额度
      await leaveEntitlementStore.addManualEntitlement(employeeId, days, reason, newAdjustment.id)

      // 持久化
      await saveAdjustments()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加年假失败'
      console.error('Failed to add leave:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 扣减年假 (手动减少)
   * @param employeeId 员工 ID
   * @param days 扣减天数
   * @param reason 调整原因
   * @param createdBy 操作人 (可选)
   */
  async function deductLeave(
    employeeId: string,
    days: number,
    reason: string,
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

      // 验证天数
      if (days <= 0) {
        throw new Error('扣减的天数必须大于 0')
      }

      // 计算调整前后余额
      const leaveEntitlementStore = useLeaveEntitlementStore()
      const balance = leaveEntitlementStore.calculateBalance(employeeId)
      const balanceBefore = balance.remainingDays

      if (balanceBefore < days) {
        throw new Error(`年假余额不足,当前余额 ${balanceBefore} 天,需要扣减 ${days} 天`)
      }

      const balanceAfter = balanceBefore - days

      // 创建调整记录
      const newAdjustment: LeaveAdjustment = {
        id: `adj-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        employeeId,
        adjustmentType: 'deduct' as AdjustmentType,
        days,
        reason,
        balanceBefore,
        balanceAfter,
        createdAt: new Date(),
        createdBy,
      }

      adjustments.value.push(newAdjustment)

      // 在 leaveEntitlement 中扣减年假
      await leaveEntitlementStore.deductUsage(employeeId, days)

      // 持久化
      await saveAdjustments()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '扣减年假失败'
      console.error('Failed to deduct leave:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除调整记录 (慎用,仅用于修正错误)
   * @param id 调整记录 ID
   */
  async function deleteAdjustment(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      console.log(`[deleteAdjustment] 尝试删除调整记录 ${id}`)

      const index = adjustments.value.findIndex((a) => a.id === id)
      if (index === -1) {
        throw new Error(`调整记录 ID ${id} 不存在`)
      }

      const adjustment = adjustments.value[index]
      if (!adjustment) {
        throw new Error(`调整记录 ID ${id} 不存在`)
      }

      console.log(`[deleteAdjustment] 调整记录详情:`, {
        id: adjustment.id,
        type: adjustment.adjustmentType,
        days: adjustment.days
      })

      const leaveEntitlementStore = useLeaveEntitlementStore()

      // 根据调整类型回滚年假额度变化
      if (adjustment.adjustmentType === 'add') {
        // 如果是增加类型,需要删除对应的手动额度记录
        console.log(`[deleteAdjustment] 这是增加类型,需要删除对应的手动额度`)
        await leaveEntitlementStore.deleteManualEntitlementByAdjustmentId(id)
      } else if (adjustment.adjustmentType === 'deduct') {
        // 如果是扣减类型,由于扣减是通过 calculateBalance 计算实现的,
        // 删除调整记录后自动会重新计算,余额会自动恢复
        // 不需要额外操作
        console.log(`[deleteAdjustment] 这是扣减类型,不需要删除额度`)
      }

      // 删除调整记录
      adjustments.value.splice(index, 1)
      console.log(`[deleteAdjustment] 已从数组中删除调整记录`)

      // 持久化
      await saveAdjustments()
      console.log(`[deleteAdjustment] 已持久化调整记录`)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除调整记录失败'
      console.error('Failed to delete adjustment:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 持久化调整记录数据到 localStorage
   */
  async function saveAdjustments(): Promise<void> {
    try {
      const data = load() || {
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      }

      const success = save({
        ...data,
        adjustments: adjustments.value,
      })

      if (!success) {
        throw new Error('保存数据到 localStorage 失败')
      }
    } catch (e) {
      console.error('Failed to save adjustments:', e)
      throw e
    }
  }

  return {
    // State
    adjustments,
    loading,
    error,

    // Getters
    getAdjustmentsByEmployeeId,
    getRecentAdjustments,

    // Actions
    loadAdjustments,
    addLeave,
    deductLeave,
    deleteAdjustment,
  }
})
