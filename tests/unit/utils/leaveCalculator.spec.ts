// T017: leaveCalculator单元测试 (日本年次有給休暇规则)

import { describe, it, expect } from 'vitest'
import {
  calculateTenure,
  getAnnualLeaveDays,
  getAnnualLeaveDaysByGrantNumber,
  calculateGrantDate,
  calculateNextLeaveGrantDate,
  calculateExpiryDate,
  isLeaveExpired,
  calculateAllLeaveEntitlements,
} from '@/utils/leaveCalculator'

describe('leaveCalculator (日本年休规则)', () => {
  describe('calculateTenure', () => {
    it('应该计算正确的入职月数', () => {
      const hireDate = new Date('2023-01-01')
      const currentDate = new Date('2023-07-01')
      expect(calculateTenure(hireDate, currentDate)).toBe(6)
    })

    it('应该处理跨年的情况', () => {
      const hireDate = new Date('2022-11-01')
      const currentDate = new Date('2023-05-01')
      expect(calculateTenure(hireDate, currentDate)).toBe(6)
    })

    it('应该对不满1个月的返回0', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2023-02-10')
      expect(calculateTenure(hireDate, currentDate)).toBe(0)
    })
  })

  describe('getAnnualLeaveDaysByGrantNumber', () => {
    it('第1次付与(6个月)应该返回10天', () => {
      expect(getAnnualLeaveDaysByGrantNumber(1)).toBe(10)
    })

    it('第2次付与(1.5年)应该返回11天', () => {
      expect(getAnnualLeaveDaysByGrantNumber(2)).toBe(11)
    })

    it('第3次付与(2.5年)应该返回12天', () => {
      expect(getAnnualLeaveDaysByGrantNumber(3)).toBe(12)
    })

    it('第4次付与(3.5年)应该返回14天', () => {
      expect(getAnnualLeaveDaysByGrantNumber(4)).toBe(14)
    })

    it('第5次付与(4.5年)应该返回16天', () => {
      expect(getAnnualLeaveDaysByGrantNumber(5)).toBe(16)
    })

    it('第6次付与(5.5年)应该返回18天', () => {
      expect(getAnnualLeaveDaysByGrantNumber(6)).toBe(18)
    })

    it('第7次及以后付与应该返回20天(上限)', () => {
      expect(getAnnualLeaveDaysByGrantNumber(7)).toBe(20)
      expect(getAnnualLeaveDaysByGrantNumber(8)).toBe(20)
      expect(getAnnualLeaveDaysByGrantNumber(10)).toBe(20)
    })
  })

  describe('calculateGrantDate', () => {
    it('第1次付与日期应该是入职后6个月', () => {
      const hireDate = new Date('2023-01-15')
      const result = calculateGrantDate(hireDate, 1)

      expect(result.getFullYear()).toBe(2023)
      expect(result.getMonth()).toBe(6) // July (0-indexed)
      expect(result.getDate()).toBe(15)
    })

    it('第2次付与日期应该是入职后1.5年', () => {
      const hireDate = new Date('2023-01-15')
      const result = calculateGrantDate(hireDate, 2)

      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })

    it('第3次付与日期应该是入职后2.5年', () => {
      const hireDate = new Date('2023-01-15')
      const result = calculateGrantDate(hireDate, 3)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })

    it('第7次付与日期应该是入职后6.5年', () => {
      const hireDate = new Date('2023-01-15')
      const result = calculateGrantDate(hireDate, 7)

      expect(result.getFullYear()).toBe(2029)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })
  })

  describe('calculateNextLeaveGrantDate', () => {
    it('入职不满6个月时下次发放日期应该是入职后6个月', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2023-04-01') // 入职2.5个月
      const result = calculateNextLeaveGrantDate(hireDate, currentDate)

      expect(result.getFullYear()).toBe(2023)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })

    it('入职刚满6个月时下次发放日期应该是1.5年后', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2023-07-15') // 入职6个月
      const result = calculateNextLeaveGrantDate(hireDate, currentDate)

      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })

    it('入职10个月时下次发放日期应该是1.5年后', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2023-11-15') // 入职10个月
      const result = calculateNextLeaveGrantDate(hireDate, currentDate)

      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })

    it('入职18个月时下次发放日期应该是2.5年后', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2024-07-15') // 入职18个月
      const result = calculateNextLeaveGrantDate(hireDate, currentDate)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(15)
    })
  })

  describe('calculateExpiryDate', () => {
    it('应该返回付与日期后2年-1天的日期', () => {
      const grantDate = new Date('2023-01-15')
      const result = calculateExpiryDate(grantDate)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(14) // 2年后的前一天
    })

    it('应该处理跨年的情况', () => {
      const grantDate = new Date('2023-11-15')
      const result = calculateExpiryDate(grantDate)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(10) // November
      expect(result.getDate()).toBe(14)
    })
  })

  describe('isLeaveExpired', () => {
    it('过期日期在当前日期之前应该返回true', () => {
      const expiryDate = new Date('2023-01-01')
      const currentDate = new Date('2023-06-01')
      expect(isLeaveExpired(expiryDate, currentDate)).toBe(true)
    })

    it('过期日期在当前日期之后应该返回false', () => {
      const expiryDate = new Date('2023-12-01')
      const currentDate = new Date('2023-06-01')
      expect(isLeaveExpired(expiryDate, currentDate)).toBe(false)
    })

    it('null过期日期(永久有效)应该返回false', () => {
      const currentDate = new Date('2023-06-01')
      expect(isLeaveExpired(null, currentDate)).toBe(false)
    })

    it('过期日期等于当前日期应该返回false', () => {
      const expiryDate = new Date('2023-06-01T00:00:00')
      const currentDate = new Date('2023-06-01T00:00:00')
      expect(isLeaveExpired(expiryDate, currentDate)).toBe(false)
    })
  })

  describe('calculateAllLeaveEntitlements', () => {
    it('入职不满6个月应该返回空数组', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2023-05-01') // 不满6个月
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      expect(result).toEqual([])
    })

    it('入职刚满6个月应该返回1条记录(10天)', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2023-07-15') // 满6个月
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      expect(result.length).toBe(1)
      expect(result[0].days).toBe(10)
      expect(result[0].grantNumber).toBe(1)
      expect(result[0].grantDate.getMonth()).toBe(6) // July
    })

    it('入职1.5年应该返回2条记录(10天+11天)', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2024-07-15') // 满1.5年
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      expect(result.length).toBe(2)
      expect(result[0].days).toBe(10) // 第1次: 6个月时
      expect(result[0].grantNumber).toBe(1)
      expect(result[1].days).toBe(11) // 第2次: 1.5年时
      expect(result[1].grantNumber).toBe(2)
    })

    it('入职2.5年应该返回3条记录(10+11+12天)', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2025-07-15') // 满2.5年
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      expect(result.length).toBe(3)
      expect(result[0].days).toBe(10) // 第1次: 0.5年
      expect(result[1].days).toBe(11) // 第2次: 1.5年
      expect(result[2].days).toBe(12) // 第3次: 2.5年
    })

    it('入职6.5年应该包含20天(上限)的记录', () => {
      const hireDate = new Date('2017-01-15')
      const currentDate = new Date('2023-07-15') // 6.5年
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      // 应该有7条记录: 0.5年, 1.5年, 2.5年, 3.5年, 4.5年, 5.5年, 6.5年
      expect(result.length).toBe(7)

      // 最后一条记录应该是20天
      const lastRecord = result[result.length - 1]
      expect(lastRecord.days).toBe(20)
      expect(lastRecord.grantNumber).toBe(7)
    })

    it('每条记录都应该有正确的过期日期', () => {
      const hireDate = new Date('2023-01-15')
      const currentDate = new Date('2024-07-15') // 1.5年
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      result.forEach((entitlement) => {
        const expectedExpiry = calculateExpiryDate(entitlement.grantDate)
        expect(entitlement.expiryDate.getTime()).toBe(expectedExpiry.getTime())
      })
    })

    it('付与记录应该按付与日期升序排列', () => {
      const hireDate = new Date('2020-01-15')
      const currentDate = new Date('2024-01-15') // 4年
      const result = calculateAllLeaveEntitlements(hireDate, currentDate)

      for (let i = 1; i < result.length; i++) {
        expect(result[i].grantDate.getTime()).toBeGreaterThan(result[i - 1].grantDate.getTime())
      }
    })
  })

  describe('getAnnualLeaveDays (向后兼容)', () => {
    it('入职不满6个月应该返回0天', () => {
      expect(getAnnualLeaveDays(0)).toBe(0)
      expect(getAnnualLeaveDays(3)).toBe(0)
      expect(getAnnualLeaveDays(5)).toBe(0)
    })

    it('入职6-17个月应该返回10天', () => {
      expect(getAnnualLeaveDays(6)).toBe(10)
      expect(getAnnualLeaveDays(12)).toBe(10)
      expect(getAnnualLeaveDays(17)).toBe(10)
    })

    it('入职18-29个月应该返回11天', () => {
      expect(getAnnualLeaveDays(18)).toBe(11)
      expect(getAnnualLeaveDays(24)).toBe(11)
      expect(getAnnualLeaveDays(29)).toBe(11)
    })

    it('入职30-41个月应该返回12天', () => {
      expect(getAnnualLeaveDays(30)).toBe(12)
      expect(getAnnualLeaveDays(36)).toBe(12)
      expect(getAnnualLeaveDays(41)).toBe(12)
    })

    it('入职78个月及以上应该返回20天(上限)', () => {
      expect(getAnnualLeaveDays(78)).toBe(20)
      expect(getAnnualLeaveDays(84)).toBe(20)
      expect(getAnnualLeaveDays(120)).toBe(20)
    })
  })
})
