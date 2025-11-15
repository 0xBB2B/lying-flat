<script setup lang="ts">
import { computed } from 'vue'

export interface StatisticsCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const props = withDefaults(defineProps<StatisticsCardProps>(), {
  color: 'blue',
  trend: 'neutral'
})

const colorClasses = computed(() => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  }
  return colors[props.color]
})

const trendIcon = computed(() => {
  if (props.trend === 'up') return '↑'
  if (props.trend === 'down') return '↓'
  return '→'
})

const trendColorClass = computed(() => {
  if (props.trend === 'up') return 'text-green-600'
  if (props.trend === 'down') return 'text-red-600'
  return 'text-gray-600'
})
</script>

<template>
  <div
    class="rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-md"
    :class="colorClasses"
  >
    <!-- 头部:标题和图标 -->
    <div class="flex items-start justify-between">
      <h3 class="text-sm font-medium text-gray-600">{{ title }}</h3>
      <span v-if="icon" class="text-2xl">{{ icon }}</span>
    </div>

    <!-- 主要数值 -->
    <div class="mt-3">
      <p class="text-3xl font-bold">{{ value }}</p>
    </div>

    <!-- 描述和趋势 -->
    <div v-if="description || trendValue" class="mt-3 flex items-center justify-between text-sm">
      <p v-if="description" class="text-gray-600">{{ description }}</p>
      <div v-if="trendValue" class="flex items-center gap-1" :class="trendColorClass">
        <span class="font-semibold">{{ trendIcon }}</span>
        <span>{{ trendValue }}</span>
      </div>
    </div>
  </div>
</template>
