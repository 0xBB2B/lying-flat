import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useEmployeeStore } from './employee'
import { useLeaveEntitlementStore } from './leaveEntitlement'
import type { LeaveEntitlement } from '@/types/leave'
import { differenceInDays, isBefore } from 'date-fns'

export interface LeaveReminder {
  id: string
  employeeId: string
  employeeName: string
  type: 'expiring_soon' | 'expired' | 'low_usage'
  message: string
  severity: 'warning' | 'error' | 'info'
  entitlements?: LeaveEntitlement[]
  daysRemaining?: number
  createdAt: Date
  dismissed: boolean
}

export const useLeaveReminderStore = defineStore('leaveReminder', () => {
  const reminders = ref<LeaveReminder[]>([])
  const employeeStore = useEmployeeStore()
  const leaveEntitlementStore = useLeaveEntitlementStore()

  // 获取活跃的提醒(未被忽略的)
  const activeReminders = computed(() => {
    return reminders.value.filter((r) => !r.dismissed)
  })

  // 按严重程度分组
  const remindersBySeverity = computed(() => {
    return {
      error: activeReminders.value.filter((r) => r.severity === 'error'),
      warning: activeReminders.value.filter((r) => r.severity === 'warning'),
      info: activeReminders.value.filter((r) => r.severity === 'info')
    }
  })

  // 检查即将过期的年假(30天内)
  function checkExpiringSoon(): void {
    const now = new Date()
    const activeEmployees = employeeStore.employees.filter((emp) => emp.status === 'active')

    activeEmployees.forEach((employee) => {
      const entitlements = leaveEntitlementStore.getEntitlementsByEmployee(employee.id)
      const expiringSoon = entitlements.filter((ent) => {
        if (!ent.expiryDate || ent.status === 'expired' || ent.remainingDays <= 0) {
          return false
        }

        const daysUntilExpiry = differenceInDays(new Date(ent.expiryDate), now)
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30
      })

      if (expiringSoon.length > 0) {
        const totalDays = expiringSoon.reduce((sum, ent) => sum + ent.remainingDays, 0)
        const minDaysUntilExpiry = Math.min(
          ...expiringSoon.map((ent) =>
            differenceInDays(new Date(ent.expiryDate!), now)
          )
        )

        addReminder({
          id: `expiring-${employee.id}-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          type: 'expiring_soon',
          message: `${employee.name} 有 ${totalDays.toFixed(1)} 天年假将在 ${minDaysUntilExpiry} 天后过期`,
          severity: minDaysUntilExpiry <= 7 ? 'error' : 'warning',
          entitlements: expiringSoon,
          daysRemaining: minDaysUntilExpiry,
          createdAt: now,
          dismissed: false
        })
      }
    })
  }

  // 检查已过期的年假
  function checkExpired(): void {
    const now = new Date()
    const activeEmployees = employeeStore.employees.filter((emp) => emp.status === 'active')

    activeEmployees.forEach((employee) => {
      const entitlements = leaveEntitlementStore.getEntitlementsByEmployee(employee.id)
      const expired = entitlements.filter((ent) => {
        if (!ent.expiryDate || ent.status === 'expired') {
          return false
        }

        return isBefore(new Date(ent.expiryDate), now) && ent.remainingDays > 0
      })

      if (expired.length > 0) {
        const totalDays = expired.reduce((sum, ent) => sum + ent.remainingDays, 0)

        addReminder({
          id: `expired-${employee.id}-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          type: 'expired',
          message: `${employee.name} 有 ${totalDays.toFixed(1)} 天年假已过期`,
          severity: 'error',
          entitlements: expired,
          createdAt: now,
          dismissed: false
        })

        // 标记这些额度为已过期
        expired.forEach((ent) => {
          leaveEntitlementStore.markAsExpired(ent.id)
        })
      }
    })
  }

  // 检查年度最低使用(10-12月期间,当年使用<5天的员工)
  function checkLowUsage(): void {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()

    // 只在10-12月检查
    if (currentMonth < 10) {
      return
    }

    const activeEmployees = employeeStore.employees.filter((emp) => emp.status === 'active')

    activeEmployees.forEach((employee) => {
      const balance = leaveEntitlementStore.calculateBalance(employee.id)
      const usedThisYear = leaveEntitlementStore.getUsedDaysInYear(employee.id, currentYear)

      if (usedThisYear < 5) {
        addReminder({
          id: `low-usage-${employee.id}-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          type: 'low_usage',
          message: `${employee.name} 今年仅使用了 ${usedThisYear.toFixed(1)} 天年假,建议使用剩余 ${balance.remainingDays.toFixed(1)} 天`,
          severity: 'info',
          daysRemaining: balance.remainingDays,
          createdAt: now,
          dismissed: false
        })
      }
    })
  }

  // 执行所有检查
  function checkReminders(): void {
    // 清除旧的提醒
    clearOldReminders()

    // 执行各项检查
    checkExpired()
    checkExpiringSoon()
    checkLowUsage()
  }

  // 添加提醒
  function addReminder(reminder: LeaveReminder): void {
    // 避免重复添加相同的提醒
    const existing = reminders.value.find(
      (r) =>
        r.employeeId === reminder.employeeId &&
        r.type === reminder.type &&
        !r.dismissed
    )

    if (!existing) {
      reminders.value.push(reminder)
    }
  }

  // 忽略提醒
  function dismissReminder(reminderId: string): void {
    const reminder = reminders.value.find((r) => r.id === reminderId)
    if (reminder) {
      reminder.dismissed = true
    }
  }

  // 忽略某个员工的所有提醒
  function dismissAllForEmployee(employeeId: string): void {
    reminders.value.forEach((r) => {
      if (r.employeeId === employeeId) {
        r.dismissed = true
      }
    })
  }

  // 清除旧的提醒(超过7天的已忽略提醒)
  function clearOldReminders(): void {
    const now = new Date()
    reminders.value = reminders.value.filter((r) => {
      if (!r.dismissed) {
        return true // 保留未忽略的提醒
      }

      const daysSinceDismissed = differenceInDays(now, new Date(r.createdAt))
      return daysSinceDismissed < 7 // 只保留7天内的已忽略提醒
    })
  }

  // 获取某个员工的提醒
  function getRemindersByEmployee(employeeId: string): LeaveReminder[] {
    return activeReminders.value.filter((r) => r.employeeId === employeeId)
  }

  // 重置所有提醒
  function resetReminders(): void {
    reminders.value = []
  }

  return {
    reminders,
    activeReminders,
    remindersBySeverity,
    checkReminders,
    checkExpiringSoon,
    checkExpired,
    checkLowUsage,
    dismissReminder,
    dismissAllForEmployee,
    getRemindersByEmployee,
    resetReminders
  }
})
