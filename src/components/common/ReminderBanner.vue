<script setup lang="ts">
import { computed } from 'vue'
import { useLeaveReminder } from '@/composables/useLeaveReminder'
import { useRouter } from 'vue-router'

const router = useRouter()
const {
  activeReminders,
  errorReminders,
  warningReminders,
  infoReminders,
  dismissReminder,
  getSeverityColor,
  getSeverityIcon,
} = useLeaveReminder()

// 是否显示横幅
const showBanner = computed(() => activeReminders.value.length > 0)

// 显示的提醒 (优先显示错误级别)
const displayedReminder = computed(() => {
  if (errorReminders.value.length > 0) {
    return errorReminders.value[0]
  }
  if (warningReminders.value.length > 0) {
    return warningReminders.value[0]
  }
  if (infoReminders.value.length > 0) {
    return infoReminders.value[0]
  }
  return null
})

// 提醒总数
const totalReminders = computed(() => activeReminders.value.length)

// 导航到员工详情页
const navigateToEmployee = (employeeId: string) => {
  router.push(`/employees/${employeeId}`)
}

// 关闭横幅
const closeBanner = () => {
  if (displayedReminder.value) {
    dismissReminder(displayedReminder.value.id)
  }
}
</script>

<template>
  <transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div
      v-if="showBanner && displayedReminder"
      :class="[
        'fixed top-0 left-0 right-0 z-50 border-b-2 shadow-lg',
        getSeverityColor(displayedReminder.severity)
      ]"
      role="alert"
      aria-live="polite"
    >
      <div class="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between flex-wrap">
          <div class="flex items-center flex-1 min-w-0">
            <span class="text-2xl mr-3">
              {{ getSeverityIcon(displayedReminder.severity) }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ displayedReminder.message }}
              </p>
              <p v-if="totalReminders > 1" class="text-xs opacity-75 mt-1">
                还有 {{ totalReminders - 1 }} 条提醒
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2 mt-2 sm:mt-0 ml-3">
            <button
              @click="navigateToEmployee(displayedReminder.employeeId)"
              class="px-3 py-1 text-sm font-medium rounded-md bg-white/80 hover:bg-white transition-colors shadow-sm"
            >
              查看详情
            </button>
            <button
              @click="closeBanner"
              class="p-1 rounded-md hover:bg-white/50 transition-colors"
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
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 确保横幅在最顶层 */
.z-50 {
  z-index: 50;
}
</style>
