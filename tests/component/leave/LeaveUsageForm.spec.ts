// T043: LeaveUsageForm 组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LeaveUsageForm from '@/components/leave/LeaveUsageForm.vue'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { LeaveType } from '@/types'

// Mock storage utilities
vi.mock('@/utils/storage', () => ({
  load: vi.fn(() => ({
    employees: [],
    entitlements: [],
    usages: [],
    adjustments: [],
  })),
  save: vi.fn(() => true),
}))

describe('LeaveUsageForm.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('表单渲染', () => {
    it('应该正确渲染表单元素', () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      expect(wrapper.find('h3').text()).toBe('记录年假使用')
      expect(wrapper.find('input[type="date"]').exists()).toBe(true)
      expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3) // 全天、上午、下午
      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('应该显示所有休假类型选项', () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const labels = wrapper.findAll('label')
      const labelTexts = labels.map((l) => l.text()).join(' ')

      expect(labelTexts).toContain('全天休假 (1 天)')
      expect(labelTexts).toContain('上午休假 (0.5 天)')
      expect(labelTexts).toContain('下午休假 (0.5 天)')
    })

    it('应该默认选择全天休假', () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const radioInputs = wrapper.findAll('input[type="radio"]')
      const fullDayRadio = radioInputs[0]
      expect((fullDayRadio.element as HTMLInputElement).checked).toBe(true)
    })

    it('应该提示可记录未来日期', () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      expect(wrapper.text()).toContain('可记录过去或未来的休假计划')
    })
  })

  describe('表单验证', () => {
    it('日期为空时应该显示错误', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('请选择休假日期')
    })

    it('未来日期也应该被接受', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      vi.spyOn(store, 'recordUsage').mockResolvedValue(undefined)

      const future = new Date()
      future.setDate(future.getDate() + 7)
      const futureStr = future.toISOString().split('T')[0]

      await wrapper.find('input[type="date"]').setValue(futureStr)
      await wrapper.find('form').trigger('submit.prevent')
      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(store.recordUsage).toHaveBeenCalled()
      expect(wrapper.emitted('success')).toBeTruthy()
    })

    it('余额不足时应该显示错误', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 0.5, // 只有0.5天余额
        },
      })

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)

      // 选择全天休假(需要1天)
      const fullDayRadio = wrapper.findAll('input[type="radio"]')[0]
      await fullDayRadio.setValue(true)

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('年假余额不足')
    })

    it('备注超过200字符时应该显示错误', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const longText = 'a'.repeat(201)
      await wrapper.find('textarea').setValue(longText)

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('备注不能超过 200 个字符')
    })
  })

  describe('休假类型选择', () => {
    it('应该能够切换到上午休假', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const morningRadio = wrapper.findAll('input[type="radio"]')[1]
      await morningRadio.setValue(true)
      await wrapper.vm.$nextTick()

      expect((morningRadio.element as HTMLInputElement).checked).toBe(true)
    })

    it('应该能够切换到下午休假', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const afternoonRadio = wrapper.findAll('input[type="radio"]')[2]
      await afternoonRadio.setValue(true)
      await wrapper.vm.$nextTick()

      expect((afternoonRadio.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('余额预览', () => {
    it('未选择日期时不显示余额预览', () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      expect(wrapper.text()).not.toContain('余额预览')
    })

    it('选择日期后应该显示余额预览', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('余额预览')
      expect(wrapper.text()).toContain('当前余额: 10 天')
      expect(wrapper.text()).toContain('休假后: 9 天') // 全天休假
    })

    it('选择上午休假时应该显示扣除0.5天', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)

      const morningRadio = wrapper.findAll('input[type="radio"]')[1]
      await morningRadio.setValue(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('休假后: 9.5 天')
    })

    it('选择下午休假时应该显示扣除0.5天', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)

      const afternoonRadio = wrapper.findAll('input[type="radio"]')[2]
      await afternoonRadio.setValue(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('休假后: 9.5 天')
    })

    it('余额不足时应该显示警告', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 0.5,
        },
      })

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('⚠️ 余额不足,无法记录 1 天的休假')
    })
  })

  describe('表单提交', () => {
    it('提交成功后应该触发 success 事件', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      vi.spyOn(store, 'recordUsage').mockResolvedValue(undefined)

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.find('form').trigger('submit.prevent')

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('success')).toBeTruthy()
    })

    it('提交成功后应该重置表单', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      vi.spyOn(store, 'recordUsage').mockResolvedValue(undefined)

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.find('textarea').setValue('测试备注')
      await wrapper.find('form').trigger('submit.prevent')

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      const dateInput = wrapper.find('input[type="date"]').element as HTMLInputElement
      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      expect(dateInput.value).toBe('')
      expect(textarea.value).toBe('')
    })

    it('应该使用正确的参数调用 recordUsage', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-123',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      const recordUsageSpy = vi.spyOn(store, 'recordUsage').mockResolvedValue(undefined)

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.find('textarea').setValue('测试备注')

      // 选择上午休假
      const morningRadio = wrapper.findAll('input[type="radio"]')[1]
      await morningRadio.setValue(true)

      await wrapper.find('form').trigger('submit.prevent')
      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(recordUsageSpy).toHaveBeenCalledWith(
        'emp-123',
        expect.any(Date),
        LeaveType.MORNING,
        '测试备注',
      )
    })

    it('recordUsage 失败时应该显示错误信息', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      vi.spyOn(store, 'recordUsage').mockRejectedValue(new Error('记录失败'))

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.find('form').trigger('submit.prevent')

      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('记录失败')
      expect(wrapper.emitted('success')).toBeFalsy()
    })

    it('提交时如果备注为空应该传递 undefined', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      const recordUsageSpy = vi.spyOn(store, 'recordUsage').mockResolvedValue(undefined)

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.find('form').trigger('submit.prevent')

      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(recordUsageSpy).toHaveBeenCalledWith(
        'emp-1',
        expect.any(Date),
        LeaveType.FULL_DAY,
        undefined,
      )
    })
  })

  describe('表单取消', () => {
    it('点击取消按钮应该触发 cancel 事件', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === '取消')
      expect(cancelButton).toBeDefined()

      await cancelButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('取消时应该重置表单和清除错误', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      // 填写表单并触发错误
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('请选择休假日期')

      // 取消
      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === '取消')
      await cancelButton!.trigger('click')
      await wrapper.vm.$nextTick()

      // 错误应该被清除
      expect(wrapper.text()).not.toContain('请选择休假日期')
    })
  })

  describe('禁用状态', () => {
    it('提交时应该禁用所有输入', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const store = useLeaveUsageStore()
      // 模拟一个永远不会resolve的Promise来保持提交状态
      vi.spyOn(store, 'recordUsage').mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      const dateInput = wrapper.find('input[type="date"]').element as HTMLInputElement
      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      const submitButton = wrapper.find('button[type="submit"]').element as HTMLButtonElement

      expect(dateInput.disabled).toBe(true)
      expect(textarea.disabled).toBe(true)
      expect(submitButton.disabled).toBe(true)
      expect(wrapper.find('button[type="submit"]').text()).toBe('提交中...')
    })

    it('余额不足时应该禁用提交按钮', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 0.3, // 余额不足
        },
      })

      const today = new Date().toISOString().split('T')[0]
      await wrapper.find('input[type="date"]').setValue(today)
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]').element as HTMLButtonElement
      expect(submitButton.disabled).toBe(true)
    })

    it('表单无效时应该禁用提交按钮', () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      const submitButton = wrapper.find('button[type="submit"]').element as HTMLButtonElement
      expect(submitButton.disabled).toBe(true)
    })
  })

  describe('字符计数', () => {
    it('应该显示备注字符数', async () => {
      const wrapper = mount(LeaveUsageForm, {
        props: {
          employeeId: 'emp-1',
          currentBalance: 10,
        },
      })

      expect(wrapper.text()).toContain('0 / 200')

      await wrapper.find('textarea').setValue('测试')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('2 / 200')
    })
  })
})
