// T013: 年假计算引擎 (日本年次有給休暇规则)

import { addMonths, addDays, differenceInMonths } from 'date-fns'

/**
 * 计算员工的连续雇用时长 (以月为单位)
 * @param hireDate 入职日期
 * @param currentDate 当前日期 (可选,用于测试)
 * @returns 入职月数
 */
export function calculateTenure(hireDate: Date, currentDate: Date = new Date()): number {
  return differenceInMonths(currentDate, hireDate)
}

/**
 * 根据付与次数获取年假天数 (日本劳动基准法)
 * 规则:
 * N=1: 10天 (入职6个月)
 * N=2: 11天 (入职1.5年)
 * N=3: 12天 (入职2.5年)
 * N=4: 14天 (入职3.5年)
 * N=5: 16天 (入职4.5年)
 * N=6: 18天 (入职5.5年)
 * N>=7: 20天 (入职6.5年及以后)
 *
 * @param grantNumber 付与次数 (从1开始)
 * @returns 年假天数
 */
export function getAnnualLeaveDaysByGrantNumber(grantNumber: number): number {
  if (grantNumber === 1) return 10
  if (grantNumber === 2) return 11
  if (grantNumber === 3) return 12
  if (grantNumber === 4) return 14
  if (grantNumber === 5) return 16
  if (grantNumber === 6) return 18
  return 20 // N >= 7
}

/**
 * 计算付与日期 (grant_date)
 * 规则:
 * N=1: hire_date + 6个月 (0.5年)
 * N=2: hire_date + 1.5年 (18个月)
 * N=3: hire_date + 2.5年 (30个月)
 * N>=2: hire_date + (N - 0.5)年
 *
 * @param hireDate 入职日期
 * @param grantNumber 付与次数 (从1开始)
 * @returns 付与日期
 */
export function calculateGrantDate(hireDate: Date, grantNumber: number): Date {
  if (grantNumber === 1) {
    return addMonths(hireDate, 6) // 0.5年 = 6个月
  }
  // N >= 2: hire_date + (N - 0.5)年
  const months = Math.round((grantNumber - 0.5) * 12)
  return addMonths(hireDate, months)
}

/**
 * (废弃 - 保留用于向后兼容) 根据入职月数获取年假天数
 * 请使用 getAnnualLeaveDaysByGrantNumber
 */
export function getAnnualLeaveDays(totalMonths: number): number {
  // 根据月数推算付与次数
  if (totalMonths < 6) return 0

  // 计算付与次数: 第一次在6个月,之后每12个月一次
  const grantNumber = Math.floor((totalMonths - 6) / 12) + 1
  return getAnnualLeaveDaysByGrantNumber(grantNumber)
}

/**
 * 计算下次年假发放日期
 * 规则: 首次在入职满6个月时发放,之后每隔1年(12个月)发放一次
 *
 * @param hireDate 入职日期
 * @param currentDate 当前日期 (可选,用于测试)
 * @returns 下次年假发放日期
 */
export function calculateNextLeaveGrantDate(hireDate: Date, currentDate: Date = new Date()): Date {
  const tenureMonths = calculateTenure(hireDate, currentDate)

  // 如果不满6个月,下次发放是6个月后
  if (tenureMonths < 6) {
    return addMonths(hireDate, 6)
  }

  // 计算已经过了多少个付与周期
  const monthsSince6 = tenureMonths - 6
  const cyclesPassed = Math.floor(monthsSince6 / 12)

  // 下一次付与是在下一个周期
  const nextGrantMonths = 6 + (cyclesPassed + 1) * 12

  return addMonths(hireDate, nextGrantMonths)
}

/**
 * 计算年假有效期 (付与日期 + 2年 - 1天)
 * 根据日本劳动基准法: expire_date = grant_date + 2 years - 1 day
 *
 * @param grantDate 付与日期
 * @returns 过期日期
 */
export function calculateExpiryDate(grantDate: Date): Date {
  // grant_date + 2 years - 1 day
  const twoYearsLater = addMonths(grantDate, 24)
  return addDays(twoYearsLater, -1)
}

/**
 * 检查年假是否已过期
 * @param expiryDate 过期日期
 * @param currentDate 当前日期 (可选,用于测试)
 * @returns 是否已过期
 */
export function isLeaveExpired(expiryDate: Date | null, currentDate: Date = new Date()): boolean {
  if (expiryDate === null) return false // 永久有效的年假不过期
  return currentDate > expiryDate
}

/**
 * 检查年假在指定时点是否已过期
 * @param expiryDate 过期日期
 * @param targetDate 目标时点日期
 * @returns 在该时点是否已过期
 */
export function isLeaveExpiredAtDate(expiryDate: Date | null, targetDate: Date): boolean {
  if (expiryDate === null) return false // 永久有效的年假不过期
  return targetDate > expiryDate
}

/**
 * 计算员工应该拥有的所有年假额度
 * 返回一个数组,每个元素表示一次付与的年假额度
 *
 * 规则: 首次6个月后,之后每隔1年付与一次
 *
 * @param hireDate 入职日期
 * @param currentDate 当前日期 (可选,用于测试)
 * @returns 年假发放记录数组 [{grantDate, days, expiryDate, grantNumber}]
 */
export function calculateAllLeaveEntitlements(
  hireDate: Date,
  currentDate: Date = new Date(),
): Array<{ grantDate: Date; days: number; expiryDate: Date; grantNumber: number }> {
  const entitlements: Array<{
    grantDate: Date
    days: number
    expiryDate: Date
    grantNumber: number
  }> = []

  let grantNumber = 1

  while (true) {
    const grantDate = calculateGrantDate(hireDate, grantNumber)

    // 如果付与日期在未来,停止
    if (grantDate > currentDate) {
      break
    }

    const days = getAnnualLeaveDaysByGrantNumber(grantNumber)
    const expiryDate = calculateExpiryDate(grantDate)

    entitlements.push({
      grantDate,
      days,
      expiryDate,
      grantNumber,
    })

    grantNumber++

    // 安全限制:最多计算100次付与
    if (grantNumber > 100) break
  }

  return entitlements
}

/**
 * 计算截至指定日期的所有应发放额度
 * @param hireDate 入职日期
 * @param targetDate 目标日期
 * @returns 截至目标日期的年假发放记录数组
 */
export function calculateAllLeaveEntitlementsUpToDate(
  hireDate: Date,
  targetDate: Date,
): Array<{ grantDate: Date; days: number; expiryDate: Date; grantNumber: number }> {
  return calculateAllLeaveEntitlements(hireDate, targetDate)
}
