// T056: 年假提醒 composable

import { computed } from 'vue'
import { useLeaveReminderStore } from '@/stores/reminder'
import type { LeaveReminder } from '@/stores/reminder'

/**
 * 年假提醒 composable
 * 提供便捷的提醒访问和操作方法
 */
export function useLeaveReminder() {
  const reminderStore = useLeaveReminderStore()

  /**
   * 所有活跃的提醒
   */
  const activeReminders = computed(() => reminderStore.activeReminders)

  /**
   * 按严重程度分组的提醒
   */
  const remindersBySeverity = computed(() => reminderStore.remindersBySeverity)

  /**
   * 错误级别的提醒
   */
  const errorReminders = computed(() => reminderStore.remindersBySeverity.error)

  /**
   * 警告级别的提醒
   */
  const warningReminders = computed(() => reminderStore.remindersBySeverity.warning)

  /**
   * 信息级别的提醒
   */
  const infoReminders = computed(() => reminderStore.remindersBySeverity.info)

  /**
   * 是否有活跃的提醒
   */
  const hasReminders = computed(() => activeReminders.value.length > 0)

  /**
   * 是否有错误级别的提醒
   */
  const hasErrors = computed(() => errorReminders.value.length > 0)

  /**
   * 是否有警告级别的提醒
   */
  const hasWarnings = computed(() => warningReminders.value.length > 0)

  /**
   * 获取某个员工的提醒
   */
  const getEmployeeReminders = (employeeId: string): LeaveReminder[] => {
    return reminderStore.getRemindersByEmployee(employeeId)
  }

  /**
   * 检查并生成所有提醒
   */
  const checkReminders = (): void => {
    reminderStore.checkReminders()
  }

  /**
   * 忽略某个提醒
   */
  const dismissReminder = (reminderId: string): void => {
    reminderStore.dismissReminder(reminderId)
  }

  /**
   * 忽略某个员工的所有提醒
   */
  const dismissAllForEmployee = (employeeId: string): void => {
    reminderStore.dismissAllForEmployee(employeeId)
  }

  /**
   * 重置所有提醒
   */
  const resetReminders = (): void => {
    reminderStore.resetReminders()
  }

  /**
   * 获取提醒的严重程度颜色
   */
  const getSeverityColor = (severity: 'error' | 'warning' | 'info'): string => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  /**
   * 获取提醒的图标
   */
  const getSeverityIcon = (severity: 'error' | 'warning' | 'info'): string => {
    switch (severity) {
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  return {
    // 计算属性
    activeReminders,
    remindersBySeverity,
    errorReminders,
    warningReminders,
    infoReminders,
    hasReminders,
    hasErrors,
    hasWarnings,

    // 方法
    getEmployeeReminders,
    checkReminders,
    dismissReminder,
    dismissAllForEmployee,
    resetReminders,
    getSeverityColor,
    getSeverityIcon,
  }
}
