<!-- T040: LeaveUsageTable 组件 - 年假使用历史表格 -->
<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { LeaveUsage } from '@/types'

// Props
const props = defineProps<{
  usages: LeaveUsage[]
  limit?: number
  showDelete?: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

// Computed
const displayUsages = computed(() => {
  if (props.limit) {
    return props.usages.slice(0, props.limit)
  }
  return props.usages
})

const hasUsages = computed(() => displayUsages.value.length > 0)

// Methods
function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm')
}

function getLeaveTypeLabel(type: string): string {
  switch (type) {
    case 'full_day':
      return '全天'
    case 'morning':
      return '上午'
    case 'afternoon':
      return '下午'
    default:
      return type
  }
}

function getLeaveTypeBadgeClass(type: string): string {
  switch (type) {
    case 'full_day':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'morning':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'afternoon':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

function handleDelete(id: string) {
  if (confirm('确定要删除这条休假记录吗?删除后需要手动调整年假余额。')) {
    emit('delete', id)
  }
}
</script>

<template>
  <div class="leave-usage-table bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 class="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
      休假记录
      <span v-if="limit && usages.length > limit" class="text-sm font-normal text-gray-500 dark:text-gray-400">
        (最近 {{ limit }} 条)
      </span>
    </h3>

    <!-- 空状态 -->
    <div v-if="!hasUsages" class="empty-state text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        暂无休假记录
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        该员工尚未记录任何休假
      </p>
    </div>

    <!-- 使用记录列表 -->
    <div v-else class="space-y-4">
      <div
        v-for="usage in displayUsages"
        :key="usage.id"
        class="
          usage-item
          border border-gray-200 dark:border-gray-700
          rounded-lg p-4
          hover:bg-gray-50 dark:hover:bg-gray-700/50
          transition-colors
        "
      >
        <!-- 头部:日期和类型 -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
                {{ formatDate(usage.date) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                记录于 {{ formatDateTime(usage.createdAt) }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getLeaveTypeBadgeClass(usage.type)"
              >
                {{ getLeaveTypeLabel(usage.type) }}
              </span>
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {{ usage.days }} 天
              </span>
            </div>
          </div>

          <!-- 删除按钮 -->
          <button
            v-if="showDelete"
            @click="handleDelete(usage.id)"
            class="
              p-1 text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-900/20
              rounded transition-colors
            "
            title="删除记录"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <!-- 备注 -->
        <div v-if="usage.notes" class="mb-3">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            <span class="font-medium text-gray-500 dark:text-gray-400">备注:</span>
            {{ usage.notes }}
          </p>
        </div>

        <!-- 额度来源 -->
        <div v-if="usage.entitlementIds && usage.entitlementIds.length > 0" class="mb-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <span class="font-medium">扣减自:</span>
            {{ usage.entitlementIds.length }} 个额度
            <span class="text-gray-400 dark:text-gray-600">
              ({{ usage.entitlementIds.join(', ').substring(0, 50) }}{{ usage.entitlementIds.join(', ').length > 50 ? '...' : '' }})
            </span>
          </p>
        </div>

        <!-- 操作人 -->
        <div v-if="usage.createdBy" class="flex items-center justify-end">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            操作人: {{ usage.createdBy }}
          </span>
        </div>
      </div>

      <!-- 查看更多提示 -->
      <div
        v-if="limit && usages.length > limit"
        class="text-center pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          还有 {{ usages.length - limit }} 条历史记录未显示
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-item {
  transition: transform 0.2s;
}

.usage-item:hover {
  transform: translateX(2px);
}
</style>
