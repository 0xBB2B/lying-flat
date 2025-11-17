import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LeaveCalendar from '@/views/LeaveCalendar.vue'
import { EmployeeStatus, type LeaveUsage } from '@/types'

// Stub stores so the view can mount without touching real storage
const mockEmployees = [
  {
    id: 'emp-1',
    name: 'Alice',
    status: EmployeeStatus.ACTIVE,
    hireDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

const mockUsages: LeaveUsage[] = []

vi.mock('@/stores/employee', () => {
  return {
    useEmployeeStore: () => ({
      employees: mockEmployees,
      loadEmployees: vi.fn().mockResolvedValue(undefined),
      getEmployeeById: (id: string) => mockEmployees.find((e) => e.id === id),
    }),
  }
})

vi.mock('@/stores/leaveUsage', () => {
  return {
    useLeaveUsageStore: () => ({
      usages: mockUsages,
      loadUsages: vi.fn().mockResolvedValue(undefined),
      recordUsage: vi.fn().mockResolvedValue(undefined),
    }),
  }
})

// Keep calendar rendering simple for these interaction tests
const CalendarViewStub = {
  template:
    '<div class="calendar-view-stub" @click="$emit(\'day-click\', new Date(\'2025-01-01\'))"></div>',
  props: ['usages', 'currentMonth'],
}

describe('LeaveCalendar quick add form', () => {
  it('默认收起快速添加表单, 即使选中日期', async () => {
    const wrapper = mount(LeaveCalendar, {
      global: {
        stubs: {
          CalendarView: CalendarViewStub,
        },
      },
    })

    // 打开某一天
    await wrapper.find('.calendar-view-stub').trigger('click')
    await nextTick()

    // 模态中只出现开关按钮, 不出现表单
    expect(wrapper.text()).toContain('添加休假记录')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('点击开关按钮后应展示快速添加表单', async () => {
    const wrapper = mount(LeaveCalendar, {
      global: {
        stubs: {
          CalendarView: CalendarViewStub,
        },
      },
    })

    await wrapper.find('.calendar-view-stub').trigger('click')
    await nextTick()

    const toggleButton = wrapper.findAll('button').find((btn) => btn.text().includes('添加休假记录'))
    expect(toggleButton).toBeTruthy()
    await toggleButton!.trigger('click')
    await nextTick()

    // 表单渲染且可填写
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('休假类型')
  })
})
