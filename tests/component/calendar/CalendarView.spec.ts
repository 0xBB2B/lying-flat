// T053: CalendarView 组件测试
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarView from '@/components/calendar/CalendarView.vue'
import CalendarDay from '@/components/calendar/CalendarDay.vue'
import type { LeaveUsage } from '@/types'

// Mock useResponsive composable
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => ({
    windowWidth: { value: 1024 },
    breakpoint: { value: 'desktop' },
    isMobile: { value: false },
    isTablet: { value: false },
    isDesktop: { value: true },
    isMobileOrTablet: { value: false },
  }),
}))

describe('CalendarView', () => {
  const mockUsages: LeaveUsage[] = [
    {
      id: '1',
      employeeId: 'emp-1',
      date: new Date('2025-01-15'),
      type: 'full_day',
      days: 1,
      notes: 'Test leave',
      createdAt: new Date(),
    },
    {
      id: '2',
      employeeId: 'emp-2',
      date: new Date('2025-01-15'),
      type: 'morning',
      days: 0.5,
      notes: '',
      createdAt: new Date(),
    },
    {
      id: '3',
      employeeId: 'emp-1',
      date: new Date('2025-01-20'),
      type: 'afternoon',
      days: 0.5,
      notes: '',
      createdAt: new Date(),
    },
  ]

  describe('Rendering', () => {
    it('应该正确渲染日历组件', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
        },
      })

      expect(wrapper.find('.calendar-view').exists()).toBe(true)
      expect(wrapper.find('.calendar-header').exists()).toBe(true)
      expect(wrapper.find('.calendar-grid').exists()).toBe(true)
      expect(wrapper.find('.calendar-legend').exists()).toBe(true)
    })

    it('应该显示当前月份标签', () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      expect(wrapper.text()).toContain('2025年01月')
    })

    it('应该渲染星期标题', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
        },
      })

      const weekDays = ['日', '一', '二', '三', '四', '五', '六']
      weekDays.forEach((day) => {
        expect(wrapper.text()).toContain(day)
      })
    })

    it('应该渲染正确数量的日期格子 (42个)', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)
      // 日历网格总是显示 6 周 × 7 天 = 42 个格子
      expect(calendarDays.length).toBe(42)
    })

    it('应该显示图例', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
        },
      })

      expect(wrapper.text()).toContain('全天休假')
      expect(wrapper.text()).toContain('上午休假')
      expect(wrapper.text()).toContain('下午休假')
    })
  })

  describe('Navigation', () => {
    it('点击上个月按钮应该触发 monthChange 事件', async () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const prevButton = wrapper.findAll('button')[0]
      await prevButton.trigger('click')

      expect(wrapper.emitted('monthChange')).toBeTruthy()
      const emittedMonth = wrapper.emitted('monthChange')![0][0] as Date
      expect(emittedMonth.getMonth()).toBe(11) // December (0-indexed)
      expect(emittedMonth.getFullYear()).toBe(2024)
    })

    it('点击下个月按钮应该触发 monthChange 事件', async () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const nextButton = wrapper.findAll('button')[2] // Last button
      await nextButton.trigger('click')

      expect(wrapper.emitted('monthChange')).toBeTruthy()
      const emittedMonth = wrapper.emitted('monthChange')![0][0] as Date
      expect(emittedMonth.getMonth()).toBe(1) // February (0-indexed)
      expect(emittedMonth.getFullYear()).toBe(2025)
    })

    it('点击今天按钮应该回到当前月', async () => {
      const currentMonth = new Date('2020-01-15') // 过去的日期
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const todayButton = wrapper.findAll('button')[1]
      await todayButton.trigger('click')

      expect(wrapper.emitted('monthChange')).toBeTruthy()
      const emittedMonth = wrapper.emitted('monthChange')![0][0] as Date
      const now = new Date()
      expect(emittedMonth.getMonth()).toBe(now.getMonth())
      expect(emittedMonth.getFullYear()).toBe(now.getFullYear())
    })
  })

  describe('Usage Data Display', () => {
    it('应该将休假数据传递给相应的日期格子', () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: mockUsages,
          currentMonth,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)

      // 找到 1月15日的格子 (有2条记录)
      const day15 = calendarDays.find((day) => {
        const usages = day.props('usages') as LeaveUsage[]
        return usages.length === 2
      })
      expect(day15).toBeTruthy()

      // 找到 1月20日的格子 (有1条记录)
      const day20 = calendarDays.find((day) => {
        const usages = day.props('usages') as LeaveUsage[]
        return usages.length === 1 && usages[0].id === '3'
      })
      expect(day20).toBeTruthy()
    })

    it('空数据应该传递空数组给所有日期格子', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)
      calendarDays.forEach((day) => {
        expect(day.props('usages')).toEqual([])
      })
    })
  })

  describe('Day Click Events', () => {
    it('点击日期格子应该触发 dayClick 事件', async () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: mockUsages,
          currentMonth,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)
      await calendarDays[15].vm.$emit('click') // 点击某个日期

      expect(wrapper.emitted('dayClick')).toBeTruthy()
      expect(wrapper.emitted('dayClick')![0][0]).toBeInstanceOf(Date)
    })
  })

  describe('Current Month Prop', () => {
    it('应该响应 currentMonth prop 的变化', async () => {
      const initialMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth: initialMonth,
        },
      })

      expect(wrapper.text()).toContain('2025年01月')

      // 更新 prop
      const newMonth = new Date('2025-06-15')
      await wrapper.setProps({ currentMonth: newMonth })

      expect(wrapper.text()).toContain('2025年06月')
    })

    it('未提供 currentMonth 时应该使用当前日期', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
        },
      })

      const now = new Date()
      const expectedYear = now.getFullYear()
      const expectedMonth = String(now.getMonth() + 1).padStart(2, '0')

      expect(wrapper.text()).toContain(`${expectedYear}年${expectedMonth}月`)
    })
  })

  describe('Calendar Grid Coverage', () => {
    it('应该包含上个月的填充日期', () => {
      const currentMonth = new Date('2025-02-15') // February 2025
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)

      // February 2025 starts on Saturday, so we expect 6 days from January
      const prevMonthDays = calendarDays.filter((day) => {
        return day.props('isCurrentMonth') === false
      })

      expect(prevMonthDays.length).toBeGreaterThan(0)
    })

    it('应该包含下个月的填充日期', () => {
      const currentMonth = new Date('2025-01-15') // January 2025
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)

      // 42个格子中,非当月的日期应该存在
      const nextMonthDays = calendarDays.filter((day) => {
        return day.props('isCurrentMonth') === false
      })

      expect(nextMonthDays.length).toBeGreaterThan(0)
    })
  })

  describe('Props Validation', () => {
    it('usages prop 应该传递正确的类型', () => {
      const wrapper = mount(CalendarView, {
        props: {
          usages: mockUsages,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)
      const dayWithUsage = calendarDays.find((day) => {
        const usages = day.props('usages') as LeaveUsage[]
        return usages.length > 0
      })

      if (dayWithUsage) {
        const usages = dayWithUsage.props('usages') as LeaveUsage[]
        expect(usages[0]).toHaveProperty('id')
        expect(usages[0]).toHaveProperty('employeeId')
        expect(usages[0]).toHaveProperty('date')
        expect(usages[0]).toHaveProperty('type')
        expect(usages[0]).toHaveProperty('days')
      }
    })

    it('每个 CalendarDay 应该接收正确的 date prop', () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)
      calendarDays.forEach((day) => {
        expect(day.props('date')).toBeInstanceOf(Date)
      })
    })

    it('每个 CalendarDay 应该接收 isCurrentMonth prop', () => {
      const currentMonth = new Date('2025-01-15')
      const wrapper = mount(CalendarView, {
        props: {
          usages: [],
          currentMonth,
        },
      })

      const calendarDays = wrapper.findAllComponents(CalendarDay)
      calendarDays.forEach((day) => {
        expect(typeof day.props('isCurrentMonth')).toBe('boolean')
      })
    })
  })
})
