// T016: dateUtils单元测试

import { describe, it, expect } from 'vitest'
import {
  getMonthsDifference,
  getYearsDifference,
  getDaysDifference,
  addMonthsToDate,
  addYearsToDate,
  isDateAfter,
  isDateBefore,
  isSameDayAs,
  formatDate,
  parseISODate,
  isDateWithinDays,
  serializeDate,
  deserializeDate,
} from '@/utils/dateUtils'

describe('dateUtils', () => {
  describe('getMonthsDifference', () => {
    it('应该正确计算月份差', () => {
      const start = new Date('2023-01-01')
      const end = new Date('2023-07-01')
      expect(getMonthsDifference(start, end)).toBe(6)
    })

    it('应该处理跨年的情况', () => {
      const start = new Date('2023-11-01')
      const end = new Date('2024-02-01')
      expect(getMonthsDifference(start, end)).toBe(3)
    })
  })

  describe('getYearsDifference', () => {
    it('应该正确计算年份差', () => {
      const start = new Date('2020-01-01')
      const end = new Date('2023-01-01')
      expect(getYearsDifference(start, end)).toBe(3)
    })

    it('应该对不满一年的返回0', () => {
      const start = new Date('2023-01-01')
      const end = new Date('2023-11-01')
      expect(getYearsDifference(start, end)).toBe(0)
    })
  })

  describe('getDaysDifference', () => {
    it('应该正确计算天数差', () => {
      const start = new Date('2023-01-01')
      const end = new Date('2023-01-11')
      expect(getDaysDifference(start, end)).toBe(10)
    })
  })

  describe('addMonthsToDate', () => {
    it('应该正确添加月份', () => {
      const date = new Date('2023-01-15')
      const result = addMonthsToDate(date, 6)
      expect(result.getMonth()).toBe(6) // July (0-indexed)
      expect(result.getDate()).toBe(15)
    })

    it('应该处理跨年的情况', () => {
      const date = new Date('2023-11-15')
      const result = addMonthsToDate(date, 3)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(1) // February
    })
  })

  describe('addYearsToDate', () => {
    it('应该正确添加年份', () => {
      const date = new Date('2023-01-15')
      const result = addYearsToDate(date, 2)
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })
  })

  describe('isDateAfter', () => {
    it('日期1在日期2之后应该返回true', () => {
      const date1 = new Date('2023-02-01')
      const date2 = new Date('2023-01-01')
      expect(isDateAfter(date1, date2)).toBe(true)
    })

    it('日期1在日期2之前应该返回false', () => {
      const date1 = new Date('2023-01-01')
      const date2 = new Date('2023-02-01')
      expect(isDateAfter(date1, date2)).toBe(false)
    })
  })

  describe('isDateBefore', () => {
    it('日期1在日期2之前应该返回true', () => {
      const date1 = new Date('2023-01-01')
      const date2 = new Date('2023-02-01')
      expect(isDateBefore(date1, date2)).toBe(true)
    })

    it('日期1在日期2之后应该返回false', () => {
      const date1 = new Date('2023-02-01')
      const date2 = new Date('2023-01-01')
      expect(isDateBefore(date1, date2)).toBe(false)
    })
  })

  describe('isSameDayAs', () => {
    it('相同日期应该返回true', () => {
      const date1 = new Date('2023-01-15T10:00:00')
      const date2 = new Date('2023-01-15T18:00:00')
      expect(isSameDayAs(date1, date2)).toBe(true)
    })

    it('不同日期应该返回false', () => {
      const date1 = new Date('2023-01-15')
      const date2 = new Date('2023-01-16')
      expect(isSameDayAs(date1, date2)).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('应该使用默认格式格式化日期', () => {
      const date = new Date('2023-01-15')
      expect(formatDate(date)).toBe('2023-01-15')
    })

    it('应该使用自定义格式格式化日期', () => {
      const date = new Date('2023-01-15')
      expect(formatDate(date, 'yyyy/MM/dd')).toBe('2023/01/15')
    })
  })

  describe('parseISODate', () => {
    it('应该正确解析ISO日期字符串', () => {
      const dateStr = '2023-01-15T00:00:00.000Z'
      const result = parseISODate(dateStr)
      expect(result.toISOString()).toBe(dateStr)
    })
  })

  describe('isDateWithinDays', () => {
    it('30天内的日期应该返回true', () => {
      const current = new Date('2023-01-01')
      const target = new Date('2023-01-25')
      expect(isDateWithinDays(target, 30, current)).toBe(true)
    })

    it('超过30天的日期应该返回false', () => {
      const current = new Date('2023-01-01')
      const target = new Date('2023-02-05')
      expect(isDateWithinDays(target, 30, current)).toBe(false)
    })

    it('过去的日期应该返回false', () => {
      const current = new Date('2023-01-15')
      const target = new Date('2023-01-01')
      expect(isDateWithinDays(target, 30, current)).toBe(false)
    })
  })

  describe('序列化和反序列化', () => {
    it('应该能够序列化和反序列化日期', () => {
      const original = new Date('2023-01-15T10:30:00.000Z')
      const serialized = serializeDate(original)
      const deserialized = deserializeDate(serialized)

      expect(deserialized.getTime()).toBe(original.getTime())
    })
  })
})
