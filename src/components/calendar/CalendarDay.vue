<!-- T046: CalendarDay 组件 - 日历日期格子 -->
<script setup lang="ts">
import { computed } from 'vue'
import { format, isToday as checkIsToday, isWeekend as checkIsWeekend } from 'date-fns'
import type { LeaveUsage, LeaveType } from '@/types'
import { useResponsive } from '@/composables/useResponsive'

// T052: 响应式支持
const { isMobile } = useResponsive()

// Props
const props = defineProps<{
  date: Date
  isCurrentMonth: boolean
  usages: LeaveUsage[]
  isHoliday: boolean
  holidayName?: string | null
}>()

const emit = defineEmits<{
  click: []
}>()

// Computed
const dayNumber = computed(() => format(props.date, 'd'))

const isToday = computed(() => {
  return checkIsToday(props.date)
})

const isWeekend = computed(() => checkIsWeekend(props.date))
const isHoliday = computed(() => props.isHoliday)
const holidayLabel = computed(() => props.holidayName || '')

const hasUsages = computed(() => props.usages.length > 0)

// Group usages by type
const usagesByType = computed(() => {
  const grouped: Record<LeaveType, number> = {
    full_day: 0,
    morning: 0,
    afternoon: 0,
  }

  props.usages.forEach(usage => {
    grouped[usage.type]++
  })

  return grouped
})

const hasFullDay = computed(() => usagesByType.value.full_day > 0)
const hasMorning = computed(() => usagesByType.value.morning > 0)
const hasAfternoon = computed(() => usagesByType.value.afternoon > 0)

// CSS classes
const dayClasses = computed(() => {
  const classes = [
    'calendar-day',
    'relative',
    // T052: 移动端紧凑布局
    isMobile.value ? 'p-1 min-h-[60px]' : 'p-2 min-h-[80px]',
    'border rounded cursor-pointer',
    'transition-all duration-200',
  ]

  if (!props.isCurrentMonth) {
    classes.push('bg-gray-50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600')
    if (isHoliday.value) {
      classes.push('text-amber-500 dark:text-amber-400')
    } else if (isWeekend.value) {
      classes.push('text-rose-400 dark:text-rose-500')
    }
  } else if (isHoliday.value) {
    classes.push('bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100')
    classes.push('hover:bg-amber-100 dark:hover:bg-amber-900/30')
  } else if (isWeekend.value) {
    classes.push('bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100')
    classes.push('hover:bg-rose-100 dark:hover:bg-rose-900/30')
  } else {
    classes.push('bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100')
    classes.push('hover:bg-gray-50 dark:hover:bg-gray-700/50')
  }

  if (isToday.value) {
    classes.push('border-blue-500 border-2')
  } else {
    classes.push('border-gray-200 dark:border-gray-700')
  }

  if (hasUsages.value && props.isCurrentMonth) {
    classes.push('ring-1 md:ring-2 ring-blue-200 dark:ring-blue-900/30')
  }

  return classes.join(' ')
})
</script>

<template>
  <div :class="dayClasses" @click="emit('click')">
    <!-- Day Number -->
    <div class="flex items-start justify-between mb-0.5 md:mb-1">
      <span
        :class="[
          isMobile ? 'text-xs' : 'text-sm',
          'font-medium',
          {
            'text-amber-700 dark:text-amber-200': !isToday && isHoliday,
            'text-rose-600 dark:text-rose-300': !isToday && isWeekend && !isHoliday,
            'bg-blue-500 text-white rounded-full flex items-center justify-center':
              isToday,
            'w-5 h-5 text-[10px]': isToday && isMobile,
            'w-6 h-6 text-xs': isToday && !isMobile,
          }
        ]"
      >
        {{ dayNumber }}
      </span>
    </div>

    <!-- Holiday label -->
    <div
      v-if="holidayLabel"
      :class="[
        isMobile ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-1',
        'mb-0.5',
        'rounded bg-amber-100 text-amber-800',
        'dark:bg-amber-900/30 dark:text-amber-200',
        'truncate'
      ]"
      :title="holidayLabel"
    >
      {{ holidayLabel }}
    </div>

    <!-- Usage Indicators -->
    <div v-if="hasUsages && isCurrentMonth" :class="isMobile ? 'space-y-0.5' : 'space-y-1'">
      <!-- Full Day Leave -->
      <div
        v-if="hasFullDay"
        :class="[
          isMobile ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-1',
          'rounded bg-blue-100 text-blue-800',
          'dark:bg-blue-900/30 dark:text-blue-300',
          'truncate leading-tight'
        ]"
        :title="`${usagesByType.full_day} 个全天休假`"
      >
        {{ isMobile ? '全' : '全天' }} {{ usagesByType.full_day > 1 ? `×${usagesByType.full_day}` : '' }}
      </div>

      <!-- Morning Leave -->
      <div
        v-if="hasMorning"
        :class="[
          isMobile ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-1',
          'rounded bg-purple-100 text-purple-800',
          'dark:bg-purple-900/30 dark:text-purple-300',
          'truncate leading-tight'
        ]"
        :title="`${usagesByType.morning} 个上午休假`"
      >
        {{ isMobile ? '上' : '上午' }} {{ usagesByType.morning > 1 ? `×${usagesByType.morning}` : '' }}
      </div>

      <!-- Afternoon Leave -->
      <div
        v-if="hasAfternoon"
        :class="[
          isMobile ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-1',
          'rounded bg-indigo-100 text-indigo-800',
          'dark:bg-indigo-900/30 dark:text-indigo-300',
          'truncate leading-tight'
        ]"
        :title="`${usagesByType.afternoon} 个下午休假`"
      >
        {{ isMobile ? '下' : '下午' }} {{ usagesByType.afternoon > 1 ? `×${usagesByType.afternoon}` : '' }}
      </div>
    </div>

    <!-- Total count badge for multiple usages -->
    <div
      v-if="usages.length > 3 && isCurrentMonth"
      :class="[
        'absolute bg-gray-200 dark:bg-gray-700',
        'text-gray-700 dark:text-gray-300',
        'rounded-full flex items-center justify-center',
        isMobile ? 'bottom-0.5 right-0.5 w-4 h-4 text-[9px]' : 'bottom-1 right-1 w-5 h-5 text-xs'
      ]"
      :title="`共 ${usages.length} 条记录`"
    >
      {{ usages.length }}
    </div>
  </div>
</template>

<style scoped>
.calendar-day {
  overflow: hidden;
}

/* T052: 桌面端才有 hover 缩放效果 */
@media (min-width: 768px) {
  .calendar-day:hover {
    transform: scale(1.02);
  }
}
</style>
