// T012: 日期工具函数 (基于date-fns)

import {
  addMonths,
  addYears,
  differenceInMonths,
  differenceInYears,
  differenceInDays,
  isAfter,
  isBefore,
  isSameDay,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns'

/**
 * 计算两个日期之间的月份差
 */
export function getMonthsDifference(startDate: Date, endDate: Date): number {
  return differenceInMonths(endDate, startDate)
}

/**
 * 计算两个日期之间的年份差
 */
export function getYearsDifference(startDate: Date, endDate: Date): number {
  return differenceInYears(endDate, startDate)
}

/**
 * 计算两个日期之间的天数差
 */
export function getDaysDifference(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate)
}

/**
 * 在日期上添加指定月数
 */
export function addMonthsToDate(date: Date, months: number): Date {
  return addMonths(date, months)
}

/**
 * 在日期上添加指定年数
 */
export function addYearsToDate(date: Date, years: number): Date {
  return addYears(date, years)
}

/**
 * 判断日期1是否在日期2之后
 */
export function isDateAfter(date1: Date, date2: Date): boolean {
  return isAfter(date1, date2)
}

/**
 * 判断日期1是否在日期2之前
 */
export function isDateBefore(date1: Date, date2: Date): boolean {
  return isBefore(date1, date2)
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDayAs(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2)
}

/**
 * 格式化日期为字符串
 */
export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr)
}

/**
 * 解析ISO日期字符串
 */
export function parseISODate(dateStr: string): Date {
  return parseISO(dateStr)
}

/**
 * 获取月份的第一天
 */
export function getStartOfMonth(date: Date): Date {
  return startOfMonth(date)
}

/**
 * 获取月份的最后一天
 */
export function getEndOfMonth(date: Date): Date {
  return endOfMonth(date)
}

/**
 * 获取日期区间内的所有天数
 */
export function getDaysInInterval(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end })
}

/**
 * 检查日期是否在指定天数内即将到来
 * @param date 要检查的日期
 * @param daysFromNow 从现在开始的天数
 * @param currentDate 当前日期 (可选,用于测试)
 */
export function isDateWithinDays(
  date: Date,
  daysFromNow: number,
  currentDate: Date = new Date(),
): boolean {
  const diffDays = differenceInDays(date, currentDate)
  return diffDays >= 0 && diffDays <= daysFromNow
}

/**
 * 将Date对象序列化为ISO字符串 (用于JSON存储)
 */
export function serializeDate(date: Date): string {
  return date.toISOString()
}

/**
 * 将ISO字符串反序列化为Date对象 (从JSON存储恢复)
 */
export function deserializeDate(dateStr: string): Date {
  return new Date(dateStr)
}
