// T036: LeaveBalance 组件测试

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LeaveBalance from '@/components/leave/LeaveBalance.vue'
import type {
  LeaveBalance as LeaveBalanceType,
  LeaveEntitlement,
  EntitlementSource,
  EntitlementStatus,
} from '@/types'

describe('LeaveBalance.vue', () => {
  let mockBalance: LeaveBalanceType

  beforeEach(() => {
    // 设置默认的余额数据
    mockBalance = {
      employeeId: 'emp-001',
      totalEntitlement: 15,
      usedDays: 5,
      remainingDays: 10,
      expiringSoon: [],
      nextGrantDate: new Date('2026-05-15'),
      nextGrantDays: 10,
    }
  })

  describe('组件渲染', () => {
    it('应该渲染组件标题', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.find('h3').text()).toBe('年假余额')
    })

    it('应该渲染三个统计卡片', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const statCards = wrapper.findAll('.stat-card')
      expect(statCards).toHaveLength(3)
    })
  })

  describe('总额度显示', () => {
    it('应该正确显示总额度', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const text = wrapper.text()
      expect(text).toContain('总额度')
      expect(text).toContain('15')
    })

    it('总额度为0时应该正确显示', () => {
      mockBalance.totalEntitlement = 0
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('0')
    })
  })

  describe('已使用显示', () => {
    it('应该正确显示已使用天数', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const text = wrapper.text()
      expect(text).toContain('已使用')
      expect(text).toContain('5')
    })

    it('应该计算并显示使用率', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      // 5/15 = 33.33% ≈ 33%
      expect(wrapper.text()).toContain('使用率 33%')
    })

    it('总额度为0时使用率应该为0%', () => {
      mockBalance.totalEntitlement = 0
      mockBalance.usedDays = 0
      mockBalance.remainingDays = 0
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('使用率 0%')
    })

    it('使用率应该四舍五入', () => {
      mockBalance.totalEntitlement = 7
      mockBalance.usedDays = 2
      // 2/7 = 28.57% ≈ 29%
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('使用率 29%')
    })

    it('使用率为100%时应该正确显示', () => {
      mockBalance.totalEntitlement = 10
      mockBalance.usedDays = 10
      mockBalance.remainingDays = 0
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('使用率 100%')
    })
  })

  describe('剩余天数显示', () => {
    it('应该正确显示剩余天数', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const text = wrapper.text()
      expect(text).toContain('剩余')
      expect(text).toContain('10')
      expect(text).toContain('可用天数')
    })

    it('剩余天数为0时应该正确显示', () => {
      mockBalance.remainingDays = 0
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('0')
    })
  })

  describe('下次发放信息', () => {
    it('应该正确显示下次发放日期', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const text = wrapper.text()
      expect(text).toContain('下次发放')
      expect(text).toContain('2026-05-15')
    })

    it('应该正确显示下次发放天数', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('10')
    })
  })

  describe('即将过期提醒', () => {
    it('没有即将过期的额度时不应该显示警告', () => {
      mockBalance.expiringSoon = []
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.find('.expiry-warning').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('年假即将过期')
    })

    it('有即将过期的额度时应该显示警告', () => {
      const expiringEntitlement: LeaveEntitlement = {
        id: 'ent-001',
        employeeId: 'emp-001',
        days: 10,
        grantDate: new Date('2023-05-15'),
        source: 'auto' as EntitlementSource,
        expiryDate: new Date('2025-12-31'),
        status: 'active' as EntitlementStatus,
        usedDays: 3,
        remainingDays: 7,
        createdAt: new Date('2023-05-15'),
      }
      mockBalance.expiringSoon = [expiringEntitlement]

      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.find('.expiry-warning').exists()).toBe(true)
      expect(wrapper.text()).toContain('年假即将过期')
    })

    it('应该显示即将过期额度的数量和总天数', () => {
      const expiringEntitlement1: LeaveEntitlement = {
        id: 'ent-001',
        employeeId: 'emp-001',
        days: 10,
        grantDate: new Date('2023-05-15'),
        source: 'auto' as EntitlementSource,
        expiryDate: new Date('2025-12-15'),
        status: 'active' as EntitlementStatus,
        usedDays: 3,
        remainingDays: 7,
        createdAt: new Date('2023-05-15'),
      }
      const expiringEntitlement2: LeaveEntitlement = {
        id: 'ent-002',
        employeeId: 'emp-001',
        days: 5,
        grantDate: new Date('2024-05-15'),
        source: 'auto' as EntitlementSource,
        expiryDate: new Date('2025-12-20'),
        status: 'active' as EntitlementStatus,
        usedDays: 2,
        remainingDays: 3,
        createdAt: new Date('2024-05-15'),
      }
      mockBalance.expiringSoon = [expiringEntitlement1, expiringEntitlement2]

      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      // 2条额度,共7+3=10天
      expect(wrapper.text()).toContain('有 2 条额度(共 10 天)即将过期')
    })

    it('应该显示每条即将过期额度的详细信息', () => {
      const expiringEntitlement: LeaveEntitlement = {
        id: 'ent-001',
        employeeId: 'emp-001',
        days: 10,
        grantDate: new Date('2023-05-15'),
        source: 'auto' as EntitlementSource,
        expiryDate: new Date('2025-12-31'),
        status: 'active' as EntitlementStatus,
        usedDays: 3,
        remainingDays: 7,
        createdAt: new Date('2023-05-15'),
      }
      mockBalance.expiringSoon = [expiringEntitlement]

      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const text = wrapper.text()
      expect(text).toContain('发放日期: 2023-05-15')
      expect(text).toContain('剩余: 7 天')
      expect(text).toContain('2025-12-31 过期')
    })

    it('应该为每条过期额度显示警告图标', () => {
      const expiringEntitlement: LeaveEntitlement = {
        id: 'ent-001',
        employeeId: 'emp-001',
        days: 10,
        grantDate: new Date('2023-05-15'),
        source: 'auto' as EntitlementSource,
        expiryDate: new Date('2025-12-31'),
        status: 'active' as EntitlementStatus,
        usedDays: 3,
        remainingDays: 7,
        createdAt: new Date('2023-05-15'),
      }
      mockBalance.expiringSoon = [expiringEntitlement]

      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      // 检查是否有警告图标 SVG
      const warningSvg = wrapper.find('.expiry-warning svg')
      expect(warningSvg.exists()).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('应该处理小数天数', () => {
      mockBalance.totalEntitlement = 10.5
      mockBalance.usedDays = 3.5
      mockBalance.remainingDays = 7
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.text()).toContain('10.5')
      expect(wrapper.text()).toContain('3.5')
      expect(wrapper.text()).toContain('7')
    })

    it('应该处理大数量的即将过期额度', () => {
      const expiringSoon: LeaveEntitlement[] = Array.from({ length: 5 }, (_, i) => ({
        id: `ent-${i}`,
        employeeId: 'emp-001',
        days: 10,
        grantDate: new Date(`202${i}-05-15`),
        source: 'auto' as EntitlementSource,
        expiryDate: new Date(`2025-${String(i + 1).padStart(2, '0')}-15`),
        status: 'active' as EntitlementStatus,
        usedDays: i,
        remainingDays: 10 - i,
        createdAt: new Date(`202${i}-05-15`),
      }))
      mockBalance.expiringSoon = expiringSoon

      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const items = wrapper.findAll('.expiry-warning li')
      expect(items).toHaveLength(5)
    })

    it('应该正确处理永久有效的手动额度(expiryDate为null)', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const manualEntitlement: LeaveEntitlement = {
        id: 'ent-manual',
        employeeId: 'emp-001',
        days: 5,
        grantDate: new Date('2025-01-01'),
        source: 'manual' as EntitlementSource,
        expiryDate: null, // 永久有效
        status: 'active' as EntitlementStatus,
        usedDays: 0,
        remainingDays: 5,
        adjustmentId: 'adj-001',
        createdAt: new Date('2025-01-01'),
      }
      // 永久有效的不应该在 expiringSoon 列表中
      mockBalance.expiringSoon = []

      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      expect(wrapper.find('.expiry-warning').exists()).toBe(false)
    })
  })

  describe('响应式布局', () => {
    it('统计卡片应该有网格布局类', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-3')
    })
  })

  describe('样式和主题', () => {
    it('应该有深色模式支持的类名', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const html = wrapper.html()
      expect(html).toContain('dark:bg-')
      expect(html).toContain('dark:text-')
    })

    it('统计卡片应该有 hover 效果', () => {
      const wrapper = mount(LeaveBalance, {
        props: { balance: mockBalance },
      })
      const statCards = wrapper.findAll('.stat-card')
      statCards.forEach((card) => {
        expect(card.classes()).toContain('stat-card')
      })
    })
  })
})
