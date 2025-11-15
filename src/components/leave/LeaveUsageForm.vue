<!-- T039: LeaveUsageForm 组件 - 年假使用记录表单 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { LeaveType } from '@/types'

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
const usageStore = useLeaveUsageStore()

// Form state
const date = ref<string>('')
const leaveType = ref<LeaveType>(LeaveType.FULL_DAY)
const notes = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

// Validation
const dateError = ref<string | null>(null)
const notesError = ref<string | null>(null)

// Computed
const isValid = computed(() => {
  return date.value.trim().length > 0 && leaveType.value
})

const selectedDays = computed(() => {
  return leaveType.value === LeaveType.FULL_DAY ? 1 : 0.5
})

const previewBalance = computed(() => {
  return props.currentBalance - selectedDays.value
})

const previewBalanceValid = computed(() => {
  return props.currentBalance >= selectedDays.value
})

// Methods
function validateForm(): boolean {
  dateError.value = null
  notesError.value = null
  error.value = null

  if (!date.value.trim()) {
    dateError.value = '请选择休假日期'
    return false
  }

  // 验证日期不能是未来
  const selectedDate = new Date(date.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate > today) {
    dateError.value = '休假日期不能晚于今天'
    return false
  }

  // 验证余额是否充足
  if (!previewBalanceValid.value) {
    error.value = `年假余额不足。当前余额: ${props.currentBalance} 天,需要: ${selectedDays.value} 天`
    return false
  }

  // 备注长度验证(可选)
  if (notes.value.trim().length > 200) {
    notesError.value = '备注不能超过 200 个字符'
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
    const usageDate = new Date(date.value)
    usageDate.setHours(0, 0, 0, 0)

    await usageStore.recordUsage(
      props.employeeId,
      usageDate,
      leaveType.value,
      notes.value.trim() || undefined,
    )

    // 重置表单
    date.value = ''
    leaveType.value = LeaveType.FULL_DAY
    notes.value = ''
    dateError.value = null
    notesError.value = null

    // 触发成功事件
    emit('success')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '记录年假使用失败'
    console.error('Failed to record usage:', e)
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  date.value = ''
  leaveType.value = LeaveType.FULL_DAY
  notes.value = ''
  dateError.value = null
  notesError.value = null
  error.value = null
  emit('cancel')
}
</script>

<template>
  <div class="leave-usage-form p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">记录年假使用</h3>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 休假日期 -->
      <div class="form-group">
        <label
          for="date"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          休假日期 <span class="text-red-500">*</span>
        </label>
        <input
          id="date"
          v-model="date"
          type="date"
          :disabled="submitting"
          :max="new Date().toISOString().split('T')[0]"
          class="
            w-full px-4 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
          "
          :class="{
            'border-red-500': dateError,
            'border-gray-300': !dateError,
          }"
        />
        <p v-if="dateError" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ dateError }}
        </p>
        <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          只能选择今天或之前的日期
        </p>
      </div>

      <!-- 休假类型 -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          休假类型 <span class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="leaveType"
              type="radio"
              :value="LeaveType.FULL_DAY"
              :disabled="submitting"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              全天休假 (1 天)
            </span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              v-model="leaveType"
              type="radio"
              :value="LeaveType.MORNING"
              :disabled="submitting"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              上午休假 (0.5 天)
            </span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              v-model="leaveType"
              type="radio"
              :value="LeaveType.AFTERNOON"
              :disabled="submitting"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              下午休假 (0.5 天)
            </span>
          </label>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-group">
        <label
          for="notes"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          备注 (可选)
        </label>
        <textarea
          id="notes"
          v-model="notes"
          rows="3"
          placeholder="请输入备注信息 (可选)"
          :disabled="submitting"
          class="
            w-full px-4 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
          "
          :class="{
            'border-red-500': notesError,
            'border-gray-300': !notesError,
          }"
        ></textarea>
        <div class="flex justify-between mt-1">
          <p v-if="notesError" class="text-sm text-red-600 dark:text-red-400">
            {{ notesError }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {{ notes.length }} / 200
          </p>
        </div>
      </div>

      <!-- 余额预览 -->
      <div
        v-if="date && leaveType"
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
            休假后: <strong>{{ previewBalance }}</strong> 天
          </span>
        </div>
        <p v-if="!previewBalanceValid" class="text-xs text-red-600 dark:text-red-400 mt-2">
          ⚠️ 余额不足,无法记录 {{ selectedDays }} 天的休假
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
          <span v-else>确认记录</span>
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
