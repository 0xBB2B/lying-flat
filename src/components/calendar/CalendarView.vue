<!-- T045: CalendarView 组件 - 月度日历视图 -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, format, addMonths, subMonths } from 'date-fns'
import CalendarDay from './CalendarDay.vue'
import type { LeaveUsage } from '@/types'
import { useResponsive } from '@/composables/useResponsive'

// T052: 响应式支持
const { isMobile } = useResponsive()

// Props
const props = defineProps<{
  usages: LeaveUsage[]
  currentMonth?: Date
}>()

const emit = defineEmits<{
  monthChange: [date: Date]
  dayClick: [date: Date]
}>()

// State
const displayMonth = ref<Date>(props.currentMonth || new Date())

// Computed
const monthStart = computed(() => startOfMonth(displayMonth.value))
const monthEnd = computed(() => endOfMonth(displayMonth.value))

// Get calendar grid (including padding days from prev/next month)
const calendarDays = computed(() => {
  const start = startOfWeek(monthStart.value) // Start from Sunday/Monday
  const end = endOfWeek(monthEnd.value)

  return eachDayOfInterval({ start, end })
})

const monthLabel = computed(() => {
  // T052: 移动端使用简短格式
  return isMobile.value
    ? format(displayMonth.value, 'yy/MM')
    : format(displayMonth.value, 'yyyy年MM月')
})

// Get usages for a specific day
const getUsagesForDay = (day: Date) => {
  const dayStr = format(day, 'yyyy-MM-dd')
  return props.usages.filter(usage => {
    const usageStr = format(usage.date, 'yyyy-MM-dd')
    return usageStr === dayStr
  })
}

// Watch for external month changes
watch(() => props.currentMonth, (newMonth) => {
  if (newMonth) {
    displayMonth.value = newMonth
  }
})

// Methods
function prevMonth() {
  displayMonth.value = subMonths(displayMonth.value, 1)
  emit('monthChange', displayMonth.value)
}

function nextMonth() {
  displayMonth.value = addMonths(displayMonth.value, 1)
  emit('monthChange', displayMonth.value)
}

function goToToday() {
  displayMonth.value = new Date()
  emit('monthChange', displayMonth.value)
}

function handleDayClick(day: Date) {
  emit('dayClick', day)
}
</script>

<template>
  <div class="calendar-view bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-6">
    <!-- Calendar Header -->
    <div class="calendar-header flex items-center justify-between mb-2 md:mb-4">
      <button
        @click="prevMonth"
        class="
          p-1.5 md:p-2 rounded-md text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors
        "
        title="上个月"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-2 md:gap-4">
        <h2 class="text-base md:text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ monthLabel }}
        </h2>
        <button
          @click="goToToday"
          class="
            px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm bg-blue-100 text-blue-700 rounded-md
            hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50
            transition-colors
          "
        >
          今天
        </button>
      </div>

      <button
        @click="nextMonth"
        class="
          p-1.5 md:p-2 rounded-md text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors
        "
        title="下个月"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Week Day Headers -->
    <div class="calendar-grid grid grid-cols-7 gap-0.5 md:gap-1 mb-1">
      <div
        v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
        :key="day"
        class="text-center text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 py-1 md:py-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Days Grid -->
    <div class="calendar-grid grid grid-cols-7 gap-0.5 md:gap-1">
      <CalendarDay
        v-for="day in calendarDays"
        :key="day.toISOString()"
        :date="day"
        :is-current-month="isSameMonth(day, displayMonth)"
        :usages="getUsagesForDay(day)"
        @click="handleDayClick(day)"
      />
    </div>

    <!-- Legend -->
    <div class="calendar-legend mt-3 md:mt-4 pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
        <div class="flex items-center gap-1.5 md:gap-2">
          <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500"></div>
          <span class="text-gray-600 dark:text-gray-400">全天休假</span>
        </div>
        <div class="flex items-center gap-1.5 md:gap-2">
          <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-purple-500"></div>
          <span class="text-gray-600 dark:text-gray-400">上午休假</span>
        </div>
        <div class="flex items-center gap-1.5 md:gap-2">
          <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-500"></div>
          <span class="text-gray-600 dark:text-gray-400">下午休假</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 日历网格样式 - 让高度自适应内容 */
</style>
