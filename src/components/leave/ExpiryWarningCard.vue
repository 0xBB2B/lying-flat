<script setup lang="ts">
import { computed } from 'vue'
import type { LeaveEntitlement } from '@/types'
import { differenceInDays, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  entitlements: LeaveEntitlement[]
  employeeName?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
}>()

// 计算总的即将过期天数
const totalExpiringDays = computed(() => {
  return props.entitlements.reduce((sum, ent) => sum + ent.remainingDays, 0)
})

// 找出最早过期的日期
const earliestExpiryDate = computed(() => {
  const dates = props.entitlements
    .map((ent) => ent.expiryDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())

  return dates[0] || null
})

// 计算距离过期的天数
const daysUntilExpiry = computed(() => {
  if (!earliestExpiryDate.value) return null
  return differenceInDays(earliestExpiryDate.value, new Date())
})

// 格式化过期日期
const formattedExpiryDate = computed(() => {
  if (!earliestExpiryDate.value) return ''
  return format(earliestExpiryDate.value, 'yyyy年MM月dd日', { locale: zhCN })
})

// 根据剩余天数确定严重程度
const severity = computed<'error' | 'warning' | 'info'>(() => {
  if (!daysUntilExpiry.value) return 'info'
  if (daysUntilExpiry.value <= 7) return 'error'
  if (daysUntilExpiry.value <= 14) return 'warning'
  return 'info'
})

// 根据严重程度返回样式类
const cardClass = computed(() => {
  switch (severity.value) {
    case 'error':
      return 'bg-red-50 border-red-200'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200'
    case 'info':
      return 'bg-blue-50 border-blue-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
})

const iconClass = computed(() => {
  switch (severity.value) {
    case 'error':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    case 'info':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
})

const icon = computed(() => {
  switch (severity.value) {
    case 'error':
      return '⚠️'
    case 'warning':
      return '⏰'
    case 'info':
      return 'ℹ️'
    default:
      return '📢'
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-lg border-2 p-4 mb-4 transition-all duration-300',
      cardClass
    ]"
    role="alert"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-start space-x-3 flex-1">
        <div :class="['text-2xl', iconClass]">
          {{ icon }}
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 mb-1">
            年假即将过期提醒
          </h3>
          <p class="text-sm text-gray-700 mb-2">
            <span v-if="employeeName" class="font-medium">{{ employeeName }}</span>
            有
            <span class="font-bold">{{ totalExpiringDays.toFixed(1) }}</span>
            天年假将在
            <span v-if="daysUntilExpiry !== null" class="font-bold">
              {{ daysUntilExpiry }}
            </span>
            天后过期
            <span v-if="formattedExpiryDate" class="text-xs text-gray-600">
              ({{ formattedExpiryDate }})
            </span>
          </p>
          <div v-if="entitlements.length > 1" class="text-xs text-gray-600">
            <details class="cursor-pointer">
              <summary class="hover:text-gray-900">
                查看详情 ({{ entitlements.length }} 批年假)
              </summary>
              <ul class="mt-2 space-y-1 ml-4">
                <li
                  v-for="ent in entitlements"
                  :key="ent.id"
                  class="flex items-center justify-between"
                >
                  <span>
                    {{ format(ent.grantDate, 'yyyy-MM-dd') }} 发放:
                    {{ ent.remainingDays.toFixed(1) }} 天
                  </span>
                  <span v-if="ent.expiryDate" class="text-gray-500">
                    过期: {{ format(ent.expiryDate, 'yyyy-MM-dd') }}
                  </span>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>
      <button
        @click="emit('dismiss')"
        class="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="关闭提醒"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
