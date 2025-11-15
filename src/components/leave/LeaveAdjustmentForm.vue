<!-- T032: LeaveAdjustmentForm 组件 - 年假手动调整表单 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLeaveAdjustmentStore } from '@/stores/leaveAdjustment'
import { AdjustmentType } from '@/types'

// Props & Emits
const props = defineProps<{
  employeeId: string
  currentBalance: number
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

// Store
const adjustmentStore = useLeaveAdjustmentStore()

// Form state
const adjustmentType = ref<AdjustmentType>(AdjustmentType.ADD)
const days = ref<number | ''>('')
const reason = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

// Validation
const daysError = ref<string | null>(null)
const reasonError = ref<string | null>(null)

// Computed
const isValid = computed(() => {
  return (
    adjustmentType.value &&
    typeof days.value === 'number' &&
    days.value > 0 &&
    reason.value.trim().length > 0
  )
})

const previewBalance = computed(() => {
  if (typeof days.value !== 'number') return props.currentBalance
  if (adjustmentType.value === AdjustmentType.ADD) {
    return props.currentBalance + days.value
  } else {
    return props.currentBalance - days.value
  }
})

const previewBalanceValid = computed(() => {
  if (adjustmentType.value === AdjustmentType.DEDUCT && typeof days.value === 'number') {
    return props.currentBalance >= days.value
  }
  return true
})

// Methods
function validateForm(): boolean {
  daysError.value = null
  reasonError.value = null
  error.value = null

  if (days.value === '' || typeof days.value !== 'number') {
    daysError.value = '请输入调整天数'
    return false
  }

  if (days.value <= 0) {
    daysError.value = '调整天数必须大于 0'
    return false
  }

  if (days.value > 365) {
    daysError.value = '调整天数不能超过 365 天'
    return false
  }

  if (adjustmentType.value === AdjustmentType.DEDUCT && days.value > props.currentBalance) {
    daysError.value = `扣减天数不能超过当前余额 ${props.currentBalance} 天`
    return false
  }

  if (!reason.value.trim()) {
    reasonError.value = '请输入调整原因'
    return false
  }

  if (reason.value.trim().length < 5) {
    reasonError.value = '调整原因至少需要 5 个字符'
    return false
  }

  if (reason.value.trim().length > 200) {
    reasonError.value = '调整原因不能超过 200 个字符'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  error.value = null

  try {
    const daysValue = days.value as number

    if (adjustmentType.value === AdjustmentType.ADD) {
      await adjustmentStore.addLeave(props.employeeId, daysValue, reason.value.trim())
    } else {
      await adjustmentStore.deductLeave(props.employeeId, daysValue, reason.value.trim())
    }

    // 重置表单
    adjustmentType.value = AdjustmentType.ADD
    days.value = ''
    reason.value = ''
    daysError.value = null
    reasonError.value = null

    // 触发成功事件
    emit('success')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '调整年假失败'
    console.error('Failed to adjust leave:', e)
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  adjustmentType.value = AdjustmentType.ADD
  days.value = ''
  reason.value = ''
  daysError.value = null
  reasonError.value = null
  error.value = null
  emit('cancel')
}
</script>

<template>
  <div
    class="leave-adjustment-form p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
  >
    <h3 class="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
      手动调整年假
    </h3>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 调整类型 -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          调整类型 <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-4">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="adjustmentType"
              type="radio"
              :value="AdjustmentType.ADD"
              :disabled="submitting"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              增加年假 ➕
            </span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              v-model="adjustmentType"
              type="radio"
              :value="AdjustmentType.DEDUCT"
              :disabled="submitting"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              扣减年假 ➖
            </span>
          </label>
        </div>
      </div>

      <!-- 调整天数 -->
      <div class="form-group">
        <label
          for="days"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          调整天数 <span class="text-red-500">*</span>
        </label>
        <input
          id="days"
          v-model.number="days"
          type="number"
          min="0.5"
          step="0.5"
          placeholder="请输入天数 (支持半天,如 0.5)"
          :disabled="submitting"
          class="
            w-full px-4 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
          "
          :class="{
            'border-red-500': daysError,
            'border-gray-300': !daysError,
          }"
        />
        <p v-if="daysError" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ daysError }}
        </p>
      </div>

      <!-- 调整原因 -->
      <div class="form-group">
        <label
          for="reason"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          调整原因 <span class="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          v-model="reason"
          rows="3"
          placeholder="请输入调整原因 (至少 5 个字符)"
          :disabled="submitting"
          class="
            w-full px-4 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
          "
          :class="{
            'border-red-500': reasonError,
            'border-gray-300': !reasonError,
          }"
        ></textarea>
        <div class="flex justify-between mt-1">
          <p v-if="reasonError" class="text-sm text-red-600 dark:text-red-400">
            {{ reasonError }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {{ reason.length }} / 200
          </p>
        </div>
      </div>

      <!-- 余额预览 -->
      <div
        v-if="typeof days === 'number' && days > 0"
        class="preview-box rounded-lg p-4"
        :class="{
          'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800':
            previewBalanceValid,
          'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800':
            !previewBalanceValid,
        }"
      >
        <h4
          class="text-sm font-medium mb-2"
          :class="{
            'text-green-800 dark:text-green-300': previewBalanceValid,
            'text-red-800 dark:text-red-300': !previewBalanceValid,
          }"
        >
          余额预览
        </h4>
        <div class="flex items-center justify-between text-sm">
          <span
            :class="{
              'text-green-700 dark:text-green-400': previewBalanceValid,
              'text-red-700 dark:text-red-400': !previewBalanceValid,
            }"
          >
            当前余额: <strong>{{ currentBalance }}</strong> 天
          </span>
          <span class="mx-2">→</span>
          <span
            :class="{
              'text-green-700 dark:text-green-400': previewBalanceValid,
              'text-red-700 dark:text-red-400': !previewBalanceValid,
            }"
          >
            调整后: <strong>{{ previewBalance }}</strong> 天
          </span>
        </div>
        <p
          v-if="!previewBalanceValid"
          class="text-xs text-red-600 dark:text-red-400 mt-2"
        >
          ⚠️ 余额不足,无法扣减 {{ days }} 天
        </p>
      </div>

      <!-- 错误信息 -->
      <div
        v-if="error"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
      >
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- 按钮组 -->
      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="!isValid || submitting || !previewBalanceValid"
          class="
            flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-md
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500
            transition-colors
          "
        >
          <span v-if="submitting">提交中...</span>
          <span v-else>确认调整</span>
        </button>

        <button
          type="button"
          @click="handleCancel"
          :disabled="submitting"
          class="
            px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md
            hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
            transition-colors
          "
        >
          取消
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* 可选:添加自定义样式 */
</style>
