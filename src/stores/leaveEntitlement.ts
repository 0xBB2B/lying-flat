// T021: leaveEntitlementStore - 年假额度状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LeaveEntitlement, LeaveBalance, EntitlementSource, EntitlementStatus } from '@/types'
import { load, save } from '@/utils/storage'
import {
  calculateAllLeaveEntitlements,
  calculateExpiryDate,
  isLeaveExpired,
  calculateNextLeaveGrantDate,
  getAnnualLeaveDaysByGrantNumber,
} from '@/utils/leaveCalculator'
import { useEmployeeStore } from './employee'

export const useLeaveEntitlementStore = defineStore('leaveEntitlement', () => {
  // State
  const entitlements = ref<LeaveEntitlement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters

  /**
   * 获取员工的所有年假额度
   */
  const getEntitlementsByEmployeeId = computed(() => {
    return (employeeId: string) => entitlements.value.filter((e) => e.employeeId === employeeId)
  })

  /**
   * 获取员工的有效年假额度 (未过期)
   */
  const getActiveEntitlementsByEmployeeId = computed(() => {
    return (employeeId: string) => {
      const currentDate = new Date()
      return entitlements.value.filter(
        (e) =>
          e.employeeId === employeeId &&
          e.status === 'active' &&
          !isLeaveExpired(e.expiryDate, currentDate),
      )
    }
  })

  // Actions

  /**
   * 从 localStorage 加载年假额度数据
   */
  async function loadEntitlements(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = load()
      if (data && data.entitlements) {
        entitlements.value = data.entitlements

        // 先清理孤立的manual额度
        await cleanupOrphanedManualEntitlements()

        // 加载后重新计算所有额度的使用情况
        await recalculateAllEntitlements()
      } else {
        entitlements.value = []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载年假额度数据失败'
      console.error('Failed to load entitlements:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 为员工自动发放年假
   * @param employeeId 员工 ID
   * @param hireDate 入职日期
   * @param currentDate 当前日期 (可选,用于测试)
   */
  async function grantLeave(
    employeeId: string,
    hireDate: Date,
    currentDate: Date = new Date(),
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 计算应该发放的所有年假额度
      const expectedEntitlements = calculateAllLeaveEntitlements(hireDate, currentDate)

      // 获取已存在的自动发放记录
      const existingGrants = entitlements.value
        .filter((e) => e.employeeId === employeeId && e.source === 'auto')
        .sort((a, b) => a.grantDate.getTime() - b.grantDate.getTime())

      // 找出需要新增的额度
      for (const expected of expectedEntitlements) {
        const exists = existingGrants.some(
          (e) => e.grantDate.getTime() === expected.grantDate.getTime(),
        )

        if (!exists) {
          // 创建新的年假额度记录
          const newEntitlement: LeaveEntitlement = {
            id: `ent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            employeeId,
            days: expected.days,
            grantDate: expected.grantDate,
            source: 'auto' as EntitlementSource,
            expiryDate: expected.expiryDate,
            status: 'active' as EntitlementStatus,
            usedDays: 0,
            remainingDays: expected.days,
            createdAt: new Date(),
          }

          entitlements.value.push(newEntitlement)
        }
      }

      // 持久化
      await saveEntitlements()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '发放年假失败'
      console.error('Failed to grant leave:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 计算员工的年假余额
   * @param employeeId 员工 ID
   * @returns 年假余额信息
   */
  function calculateBalance(employeeId: string): LeaveBalance {
    const employeeStore = useEmployeeStore()
    const employee = employeeStore.getEmployeeById(employeeId)

    if (!employee) {
      throw new Error(`员工 ID ${employeeId} 不存在`)
    }

    const currentDate = new Date()
    const activeEnts = getActiveEntitlementsByEmployeeId.value(employeeId)

    // 计算总额度
    const totalEntitlement = activeEnts.reduce((sum, e) => sum + e.days, 0)

    // 从实际使用记录和调整记录重新计算已使用天数 (防止数据不一致)
    const data = load()

    // 1. 实际休假使用的天数
    const usedFromUsages =
      data && data.usages
        ? data.usages
            .filter((usage: any) => usage.employeeId === employeeId)
            .reduce((sum: number, usage: any) => sum + (usage.days || 0), 0)
        : 0

    // 2. 手动扣减的天数
    const deductedFromAdjustments =
      data && data.adjustments
        ? data.adjustments
            .filter((adj: any) => adj.employeeId === employeeId && adj.adjustmentType === 'deduct')
            .reduce((sum: number, adj: any) => sum + (adj.days || 0), 0)
        : 0

    // 总已使用 = 实际休假 + 手动扣减
    const actualUsedDays = usedFromUsages + deductedFromAdjustments

    // 剩余天数 = 总额度 - 实际已使用
    const remainingDays = totalEntitlement - actualUsedDays

    // 找出即将过期的额度 (30天内)
    const thirtyDaysLater = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = activeEnts.filter(
      (e) => e.expiryDate && e.expiryDate <= thirtyDaysLater && e.expiryDate > currentDate,
    )

    // 计算下次发放信息
    const nextGrantDate = calculateNextLeaveGrantDate(employee.hireDate, currentDate)

    // 计算下次发放的付与次数
    const allEntitlements = calculateAllLeaveEntitlements(employee.hireDate, currentDate)
    const nextGrantNumber = allEntitlements.length + 1
    const nextGrantDays = getAnnualLeaveDaysByGrantNumber(nextGrantNumber)

    return {
      employeeId,
      totalEntitlement,
      usedDays: actualUsedDays,
      remainingDays,
      expiringSoon,
      nextGrantDate,
      nextGrantDays,
    }
  }

  /**
   * 手动添加年假额度 (永久有效)
   * @param employeeId 员工 ID
   * @param days 年假天数
   * @param reason 调整原因
   * @param adjustmentId 调整记录 ID
   */
  async function addManualEntitlement(
    employeeId: string,
    days: number,
    reason: string,
    adjustmentId: string,
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const newEntitlement: LeaveEntitlement = {
        id: `ent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        employeeId,
        days,
        grantDate: new Date(),
        source: 'manual' as EntitlementSource,
        expiryDate: null, // 手动调整的年假永久有效
        status: 'active' as EntitlementStatus,
        usedDays: 0,
        remainingDays: days,
        adjustmentId,
        createdAt: new Date(),
      }

      entitlements.value.push(newEntitlement)

      // 持久化
      await saveEntitlements()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加年假额度失败'
      console.error('Failed to add manual entitlement:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 扣减年假使用量 (FIFO: 优先扣减最早过期的额度)
   * 注意:这个方法已废弃,实际的扣减通过 LeaveUsage 记录来跟踪
   * 这里只是验证余额是否足够,实际的 usedDays 会在 recalculateAllEntitlements 中重新计算
   * @param employeeId 员工 ID
   * @param days 扣减天数
   * @returns 被扣减的额度 ID 列表
   */
  async function deductUsage(employeeId: string, days: number): Promise<string[]> {
    loading.value = true
    error.value = null

    try {
      // 验证余额是否足够
      const balance = calculateBalance(employeeId)
      if (balance.remainingDays < days) {
        throw new Error(`年假余额不足,当前剩余 ${balance.remainingDays} 天,需要 ${days} 天`)
      }

      // 不再手动更新 usedDays 和 remainingDays
      // 这些值会在添加 LeaveUsage 记录后,通过 recalculateAllEntitlements 自动重新计算

      // 返回空数组,因为我们不再跟踪具体哪些额度被扣减了
      return []
    } catch (e) {
      error.value = e instanceof Error ? e.message : '扣减年假失败'
      console.error('Failed to deduct usage:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 持久化年假额度数据到 localStorage
   */
  async function saveEntitlements(): Promise<void> {
    try {
      const data = load() || {
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
      }

      const success = save({
        ...data,
        entitlements: entitlements.value,
      })

      if (!success) {
        throw new Error('保存数据到 localStorage 失败')
      }
    } catch (e) {
      console.error('Failed to save entitlements:', e)
      throw e
    }
  }

  /**
   * 重新计算所有额度的使用情况
   * 这个方法会从 usages 记录中完整重新计算每个额度的 usedDays 和 remainingDays
   */
  async function recalculateAllEntitlements(): Promise<void> {
    try {
      const data = load()
      if (!data) return

      // 重置所有额度的使用情况
      for (const ent of entitlements.value) {
        ent.usedDays = 0
        ent.remainingDays = ent.days
      }

      // 如果没有使用记录,直接返回
      if (!data.usages || data.usages.length === 0) {
        await saveEntitlements()
        return
      }

      // 按员工分组处理使用记录
      const usagesByEmployee = new Map<string, any[]>()
      for (const usage of data.usages) {
        if (!usagesByEmployee.has(usage.employeeId)) {
          usagesByEmployee.set(usage.employeeId, [])
        }
        usagesByEmployee.get(usage.employeeId)?.push(usage)
      }

      // 为每个员工重新计算额度使用情况
      for (const [employeeId, usages] of usagesByEmployee) {
        // 获取该员工的所有有效额度,按FIFO排序
        const employeeEnts = entitlements.value
          .filter((e) => e.employeeId === employeeId && e.status === 'active')
          .sort((a, b) => {
            // 优先使用即将过期的
            if (a.expiryDate === null && b.expiryDate === null) return 0
            if (a.expiryDate === null) return 1
            if (b.expiryDate === null) return -1
            return a.expiryDate.getTime() - b.expiryDate.getTime()
          })

        // 计算该员工的总使用天数
        const totalUsedDays = usages.reduce((sum: number, u: any) => sum + (u.days || 0), 0)

        // 按FIFO原则分配使用天数到各个额度
        let remainingToAllocate = totalUsedDays
        for (const ent of employeeEnts) {
          if (remainingToAllocate <= 0) break

          const canAllocate = Math.min(ent.days, remainingToAllocate)
          ent.usedDays = canAllocate
          ent.remainingDays = ent.days - canAllocate
          remainingToAllocate -= canAllocate
        }
      }

      // 持久化更新后的额度
      await saveEntitlements()
    } catch (e) {
      console.error('Failed to recalculate entitlements:', e)
      throw e
    }
  }

  /**
   * 删除手动添加的年假额度 (用于回滚调整记录)
   * @param adjustmentId 调整记录 ID
   */
  async function deleteManualEntitlementByAdjustmentId(adjustmentId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const index = entitlements.value.findIndex(
        (e) => e.source === 'manual' && e.adjustmentId === adjustmentId,
      )

      if (index === -1) {
        throw new Error(`未找到调整记录 ${adjustmentId} 对应的年假额度`)
      }

      // 检查该额度是否已被使用
      const entitlement = entitlements.value[index]

      if (entitlement && entitlement.usedDays > 0) {
        throw new Error(
          `该调整记录对应的年假额度已被使用 ${entitlement.usedDays} 天，无法删除。请先删除相关的休假使用记录。`,
        )
      }

      // 删除额度
      entitlements.value.splice(index, 1)

      // 持久化并重新计算
      await saveEntitlements()
      await recalculateAllEntitlements()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除年假额度失败'
      console.error('Failed to delete manual entitlement:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 标记年假额度为已过期
   * @param entitlementId 额度 ID
   */
  function markAsExpired(entitlementId: string): void {
    const entitlement = entitlements.value.find((e) => e.id === entitlementId)
    if (entitlement) {
      entitlement.status = 'expired' as EntitlementStatus
      saveEntitlements()
    }
  }

  /**
   * 获取员工某年的已使用天数
   * @param employeeId 员工 ID
   * @param year 年份
   * @returns 该年已使用的年假天数
   */
  function getUsedDaysInYear(employeeId: string, year: number): number {
    // 从 storage 直接读取 LeaveUsage 记录,统计该年实际使用的年假天数
    // 避免循环依赖 leaveUsageStore
    const data = load()
    if (!data || !data.usages) {
      return 0
    }

    return data.usages
      .filter((usage: any) => {
        if (usage.employeeId !== employeeId) return false
        const usageDate = new Date(usage.date)
        return usageDate.getFullYear() === year
      })
      .reduce((sum: number, usage: any) => sum + (usage.days || 0), 0)
  }

  /**
   * 获取员工的年假额度列表(非computed版本,供其他store调用)
   * @param employeeId 员工 ID
   * @returns 年假额度列表
   */
  function getEntitlementsByEmployee(employeeId: string): LeaveEntitlement[] {
    return entitlements.value.filter((e) => e.employeeId === employeeId)
  }

  /**
   * 清理孤立的manual额度(没有对应调整记录的)
   * 这是一个修复工具函数,用于修复数据不一致的情况
   */
  async function cleanupOrphanedManualEntitlements(): Promise<number> {
    try {
      const data = load()
      if (!data) return 0

      // 获取所有调整记录的ID
      const adjustmentIds = new Set((data.adjustments || []).map((adj: any) => adj.id))

      // 找出所有孤立的manual额度
      const orphaned = entitlements.value.filter(
        (e) => e.source === 'manual' && e.adjustmentId && !adjustmentIds.has(e.adjustmentId),
      )

      if (orphaned.length === 0) return 0

      // 删除孤立的额度
      entitlements.value = entitlements.value.filter(
        (e) => !(e.source === 'manual' && e.adjustmentId && !adjustmentIds.has(e.adjustmentId)),
      )

      // 持久化
      await saveEntitlements()

      return orphaned.length
    } catch (e) {
      console.error('Failed to cleanup orphaned entitlements:', e)
      return 0
    }
  }

  return {
    // State
    entitlements,
    loading,
    error,

    // Getters
    getEntitlementsByEmployeeId,
    getActiveEntitlementsByEmployeeId,

    // Actions
    loadEntitlements,
    grantLeave,
    calculateBalance,
    addManualEntitlement,
    deleteManualEntitlementByAdjustmentId,
    deductUsage,
    markAsExpired,
    getUsedDaysInYear,
    getEntitlementsByEmployee,
    cleanupOrphanedManualEntitlements,
  }
})
