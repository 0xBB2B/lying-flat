<!-- T031: LeaveBalance 组件 - 年假余额展示 -->
<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { LeaveBalance } from '@/types'

// Props
const props = defineProps<{
  balance: LeaveBalance
}>()

// Computed
const hasExpiringSoon = computed(() => props.balance.expiringSoon.length > 0)

const expiryWarningText = computed(() => {
  if (!hasExpiringSoon.value) return ''
  const count = props.balance.expiringSoon.length
  const totalDays = props.balance.expiringSoon.reduce((sum, e) => sum + e.remainingDays, 0)
  return `有 ${count} 条额度(共 ${totalDays} 天)即将过期`
})

const utilizationRate = computed(() => {
  if (props.balance.totalEntitlement === 0) return 0
  return Math.round((props.balance.usedDays / props.balance.totalEntitlement) * 100)
})

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
</script>

<template>
  <div class="leave-balance bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 class="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">年假余额</h3>

    <!-- 余额统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- 总额度 -->
      <div class="stat-card bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="text-sm text-blue-600 dark:text-blue-400 mb-1">总额度</div>
        <div class="text-3xl font-bold text-blue-700 dark:text-blue-300">
          {{ balance.totalEntitlement }}
        </div>
        <div class="text-xs text-blue-500 dark:text-blue-400 mt-1">天</div>
      </div>

      <!-- 已使用 -->
      <div class="stat-card bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
        <div class="text-sm text-orange-600 dark:text-orange-400 mb-1">已使用</div>
        <div class="text-3xl font-bold text-orange-700 dark:text-orange-300">
          {{ balance.usedDays }}
        </div>
        <div class="text-xs text-orange-500 dark:text-orange-400 mt-1">
          使用率 {{ utilizationRate }}%
        </div>
      </div>

      <!-- 剩余 -->
      <div class="stat-card bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div class="text-sm text-green-600 dark:text-green-400 mb-1">剩余</div>
        <div class="text-3xl font-bold text-green-700 dark:text-green-300">
          {{ balance.remainingDays }}
        </div>
        <div class="text-xs text-green-500 dark:text-green-400 mt-1">可用天数</div>
      </div>
    </div>

    <!-- 即将过期提醒 -->
    <div
      v-if="hasExpiringSoon"
      class="expiry-warning bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
    >
      <div class="flex items-start">
        <svg
          class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            ⚠️ 年假即将过期
          </h4>
          <p class="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
            {{ expiryWarningText }}
          </p>
          <ul class="space-y-2">
            <li
              v-for="ent in balance.expiringSoon"
              :key="ent.id"
              class="text-xs text-yellow-700 dark:text-yellow-400 flex items-center justify-between bg-yellow-100 dark:bg-yellow-900/30 rounded px-3 py-2"
            >
              <span>
                发放日期: {{ formatDate(ent.grantDate) }} | 剩余:
                <strong>{{ ent.remainingDays }}</strong> 天
              </span>
              <span class="text-red-600 dark:text-red-400 font-medium">
                {{ ent.expiryDate ? formatDate(ent.expiryDate) + ' 过期' : '' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 下次发放信息 -->
    <div class="next-grant bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">下次发放</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(balance.nextGrantDate) }}
          </p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ balance.nextGrantDays }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">天</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
