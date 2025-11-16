<!-- T023: EmployeeForm 组件 - 员工表单 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import type { Employee, EmployeeStatus } from '@/types'
import { validateEmployee } from '@/utils/validation'

// Props & Emits
const emit = defineEmits<{
  success: []
  cancel: []
}>()

// Stores
const employeeStore = useEmployeeStore()
const leaveEntitlementStore = useLeaveEntitlementStore()

// Form state
const name = ref('')
const hireDate = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

// Validation
const nameError = ref<string | null>(null)
const hireDateError = ref<string | null>(null)

// Computed
const isValid = computed(() => {
  return name.value.trim().length > 0 && hireDate.value.length > 0
})

// Methods
function validateForm(): boolean {
  nameError.value = null
  hireDateError.value = null
  error.value = null

  if (!name.value.trim()) {
    nameError.value = '请输入员工姓名'
    return false
  }

  if (name.value.trim().length > 50) {
    nameError.value = '员工姓名不能超过 50 个字符'
    return false
  }

  if (!hireDate.value) {
    hireDateError.value = '请选择入职日期'
    return false
  }

  const selectedDate = new Date(hireDate.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate > today) {
    hireDateError.value = '入职日期不能晚于今天'
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
    // 创建员工对象
    const newEmployee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name.value.trim(),
      hireDate: new Date(hireDate.value),
      status: 'active' as EmployeeStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 验证员工数据
    const validation = validateEmployee(newEmployee)
    if (!validation.valid) {
      error.value = validation.errors.join('; ')
      return
    }

    // 添加员工
    await employeeStore.addEmployee(newEmployee)

    // 自动发放年假
    await leaveEntitlementStore.grantLeave(newEmployee.id, newEmployee.hireDate)

    // 重置表单
    name.value = ''
    hireDate.value = ''
    nameError.value = null
    hireDateError.value = null

    // 触发成功事件
    emit('success')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '添加员工失败'
    console.error('Failed to add employee:', e)
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  name.value = ''
  hireDate.value = ''
  nameError.value = null
  hireDateError.value = null
  error.value = null
  emit('cancel')
}

// 设置默认日期为今天
const todayStr = format(new Date(), 'yyyy-MM-dd')

// Expose for testing
defineExpose({
  name,
  hireDate,
  submitting,
  error,
  nameError,
  hireDateError,
  isValid,
  handleSubmit,
  handleCancel,
})
</script>

<template>
  <div class="employee-form p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">添加新员工</h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 员工姓名 -->
      <div class="form-group">
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          员工姓名 <span class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="name"
          type="text"
          placeholder="请输入员工姓名"
          :disabled="submitting"
          class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          :class="{
            'border-red-500': nameError,
            'border-gray-300': !nameError,
          }"
        />
        <p v-if="nameError" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ nameError }}
        </p>
      </div>

      <!-- 入职日期 -->
      <div class="form-group">
        <label
          for="hireDate"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          入职日期 <span class="text-red-500">*</span>
        </label>
        <input
          id="hireDate"
          v-model="hireDate"
          type="date"
          :max="todayStr"
          :disabled="submitting"
          class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          :class="{
            'border-red-500': hireDateError,
            'border-gray-300': !hireDateError,
          }"
        />
        <p v-if="hireDateError" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ hireDateError }}
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
          :disabled="!isValid || submitting"
          class="flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 transition-colors"
        >
          <span v-if="submitting">提交中...</span>
          <span v-else>添加员工</span>
        </button>

        <button
          type="button"
          @click="handleCancel"
          :disabled="submitting"
          class="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
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
