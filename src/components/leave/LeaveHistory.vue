<!-- T033: LeaveHistory 组件 - 年假调整历史 -->
<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { LeaveAdjustment } from '@/types'

// Props
const props = defineProps<{
  adjustments: LeaveAdjustment[]
  limit?: number
  showDelete?: boolean
}>()

// Emits
const emit = defineEmits<{
  delete: [id: string]
}>()

// Computed
const displayAdjustments = computed(() => {
  if (props.limit) {
    return props.adjustments.slice(0, props.limit)
  }
  return props.adjustments
})

const hasAdjustments = computed(() => displayAdjustments.value.length > 0)

// Methods
function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm')
}

function getAdjustmentTypeLabel(type: string): string {
  return type === 'add' ? '增加' : '扣减'
}

function getAdjustmentTypeClass(type: string): string {
  return type === 'add' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
}

function getAdjustmentTypeBadgeClass(type: string): string {
  return type === 'add'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

function handleDelete(id: string) {
  if (confirm('确认删除此调整记录吗?\n\n⚠️ 删除后将回滚年假额度变化,此操作不可恢复。')) {
    emit('delete', id)
  }
}
</script>

<template>
  <div class="leave-history bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 class="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
      调整历史
      <span v-if="limit && adjustments.length > limit" class="text-sm font-normal text-gray-500 dark:text-gray-400">
        (最近 {{ limit }} 条)
      </span>
    </h3>

    <!-- 空状态 -->
    <div
      v-if="!hasAdjustments"
      class="empty-state text-center py-12"
    >
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        暂无调整记录
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        该员工尚未进行过年假调整
      </p>
    </div>

    <!-- 调整记录列表 -->
    <div v-else class="space-y-4">
      <div
        v-for="adjustment in displayAdjustments"
        :key="adjustment.id"
        class="
          adjustment-item
          border border-gray-200 dark:border-gray-700
          rounded-lg p-4
          hover:bg-gray-50 dark:hover:bg-gray-700/50
          transition-colors
        "
      >
        <!-- 头部:类型和时间 -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getAdjustmentTypeBadgeClass(adjustment.adjustmentType)"
            >
              {{ getAdjustmentTypeLabel(adjustment.adjustmentType) }}
            </span>
            <span
              class="text-lg font-bold"
              :class="getAdjustmentTypeClass(adjustment.adjustmentType)"
            >
              {{ adjustment.adjustmentType === 'add' ? '+' : '-' }}{{ adjustment.days }} 天
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(adjustment.createdAt) }}
            </span>
            <button
              v-if="showDelete"
              @click="handleDelete(adjustment.id)"
              class="
                p-1 text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                rounded transition-colors
              "
              title="删除调整记录"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- 原因 -->
        <div class="mb-3">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            <span class="font-medium text-gray-500 dark:text-gray-400">原因:</span>
            {{ adjustment.reason }}
          </p>
        </div>

        <!-- 余额变化 -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-600 dark:text-gray-400">
              余额: {{ adjustment.balanceBefore }} 天
            </span>
            <svg
              class="w-4 h-4 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span
              class="font-semibold"
              :class="getAdjustmentTypeClass(adjustment.adjustmentType)"
            >
              {{ adjustment.balanceAfter }} 天
            </span>
          </div>
          <span v-if="adjustment.createdBy" class="text-xs text-gray-500 dark:text-gray-400">
            操作人: {{ adjustment.createdBy }}
          </span>
        </div>
      </div>

      <!-- 查看更多提示 -->
      <div
        v-if="limit && adjustments.length > limit"
        class="text-center pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          还有 {{ adjustments.length - limit }} 条历史记录未显示
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adjustment-item {
  transition: transform 0.2s;
}

.adjustment-item:hover {
  transform: translateX(2px);
}
</style>
