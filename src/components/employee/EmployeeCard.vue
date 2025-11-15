<!-- T025: EmployeeCard 组件 - 员工卡片(移动端) -->
<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { Employee } from '@/types'
import { calculateTenure } from '@/utils/leaveCalculator'

// Props
const props = defineProps<{
  employee: Employee
  showActions?: boolean
}>()

// Emits
const emit = defineEmits<{
  view: [id: string]
  edit: [id: string]
  terminate: [id: string]
}>()

// Computed
const tenureMonths = computed(() => {
  return calculateTenure(props.employee.hireDate)
})

const tenureDisplay = computed(() => {
  const years = Math.floor(tenureMonths.value / 12)
  const months = tenureMonths.value % 12

  if (years > 0) {
    return `${years} 年 ${months} 个月`
  }
  return `${months} 个月`
})

const statusDisplay = computed(() => {
  return props.employee.status === 'active' ? '在职' : '已离职'
})

const statusClass = computed(() => {
  return props.employee.status === 'active'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
})

const hireDateDisplay = computed(() => {
  return format(props.employee.hireDate, 'yyyy-MM-dd')
})
</script>

<template>
  <div
    class="
      employee-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700
      hover:shadow-md transition-shadow cursor-pointer
    "
    @click="emit('view', employee.id)"
  >
    <!-- 头部 - 姓名和状态 -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ employee.name }}
      </h3>
      <span
        class="px-2 py-1 text-xs font-medium rounded-full"
        :class="statusClass"
      >
        {{ statusDisplay }}
      </span>
    </div>

    <!-- 信息列表 -->
    <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <div class="flex items-center gap-2">
        <span class="font-medium">入职日期:</span>
        <span>{{ hireDateDisplay }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="font-medium">工龄:</span>
        <span>{{ tenureDisplay }}</span>
      </div>

      <div v-if="employee.terminatedAt" class="flex items-center gap-2">
        <span class="font-medium">离职日期:</span>
        <span>{{ format(employee.terminatedAt, 'yyyy-MM-dd') }}</span>
      </div>
    </div>

    <!-- 操作按钮 (可选) -->
    <div v-if="showActions && employee.status === 'active'" class="mt-4 flex gap-2">
      <button
        @click.stop="emit('edit', employee.id)"
        class="
          flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded
          hover:bg-blue-50 dark:hover:bg-blue-900/20
          transition-colors
        "
      >
        编辑
      </button>
      <button
        @click.stop="emit('terminate', employee.id)"
        class="
          flex-1 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded
          hover:bg-red-50 dark:hover:bg-red-900/20
          transition-colors
        "
      >
        离职
      </button>
    </div>
  </div>
</template>
