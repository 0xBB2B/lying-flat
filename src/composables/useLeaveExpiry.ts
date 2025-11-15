// T019: 年假有效期管理

import type { LeaveEntitlement } from '@/types'
import { isLeaveExpired } from '@/utils/leaveCalculator'
import { differenceInDays } from 'date-fns'

/**
 * 年假有效期管理 composable
 */
export function useLeaveExpiry() {
  /**
   * 检查年假是否已过期
   */
  const checkExpiry = (entitlement: LeaveEntitlement, currentDate: Date = new Date()): boolean => {
    return isLeaveExpired(entitlement.expiryDate, currentDate)
  }

  /**
   * 获取即将过期的年假额度 (30天内)
   */
  const getExpiringSoon = (
    entitlements: LeaveEntitlement[],
    days: number = 30,
    currentDate: Date = new Date(),
  ): LeaveEntitlement[] => {
    return entitlements.filter((e) => {
      if (e.expiryDate === null) return false // 永久有效的年假不会过期
      if (isLeaveExpired(e.expiryDate, currentDate)) return false // 已过期的不算

      const daysUntilExpiry = differenceInDays(e.expiryDate, currentDate)
      return daysUntilExpiry >= 0 && daysUntilExpiry <= days
    })
  }

  /**
   * 按过期日期排序 (最早过期的在前)
   * 永久有效的年假排在最后
   */
  const sortByExpiry = (entitlements: LeaveEntitlement[]): LeaveEntitlement[] => {
    return [...entitlements].sort((a, b) => {
      // 永久有效的排在最后
      if (a.expiryDate === null && b.expiryDate === null) return 0
      if (a.expiryDate === null) return 1
      if (b.expiryDate === null) return -1

      // 按过期日期排序
      return a.expiryDate.getTime() - b.expiryDate.getTime()
    })
  }

  /**
   * 获取过期的年假额度
   */
  const getExpiredEntitlements = (
    entitlements: LeaveEntitlement[],
    currentDate: Date = new Date(),
  ): LeaveEntitlement[] => {
    return entitlements.filter((e) => checkExpiry(e, currentDate))
  }

  /**
   * 获取有效的年假额度 (未过期且有剩余)
   */
  const getActiveEntitlements = (
    entitlements: LeaveEntitlement[],
    currentDate: Date = new Date(),
  ): LeaveEntitlement[] => {
    return entitlements.filter((e) => !checkExpiry(e, currentDate) && e.remainingDays > 0)
  }

  return {
    checkExpiry,
    getExpiringSoon,
    sortByExpiry,
    getExpiredEntitlements,
    getActiveEntitlements,
  }
}
