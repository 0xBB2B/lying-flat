<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import ReminderBanner from '@/components/common/ReminderBanner.vue'
import { useLeaveReminder } from '@/composables/useLeaveReminder'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { useLeaveAdjustmentStore } from '@/stores/leaveAdjustment'

const { checkReminders } = useLeaveReminder()
const employeeStore = useEmployeeStore()
const leaveEntitlementStore = useLeaveEntitlementStore()
const leaveUsageStore = useLeaveUsageStore()
const leaveAdjustmentStore = useLeaveAdjustmentStore()

// 应用启动时加载数据并检查提醒
onMounted(async () => {
  try {
    // 加载所有数据
    await Promise.all([
      employeeStore.loadEmployees(),
      leaveEntitlementStore.loadEntitlements(),
      leaveUsageStore.loadUsages(),
      leaveAdjustmentStore.loadAdjustments(),
    ])

    // 检查提醒
    checkReminders()

    // 设置定期检查(每小时检查一次)
    setInterval(() => {
      checkReminders()
    }, 60 * 60 * 1000) // 1小时
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
})
</script>

<template>
  <div class="app min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 全局提醒横幅 -->
    <ReminderBanner />

    <!-- 导航栏 -->
    <header class="bg-white dark:bg-gray-800 shadow">
      <nav class="container mx-auto px-4 py-3 md:py-4">
        <div class="flex items-center justify-between">
          <!-- Logo 和标题 -->
          <div class="flex items-center gap-4">
            <h1 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              年假统计系统
            </h1>
          </div>

          <!-- 导航链接 -->
          <div class="flex gap-2 md:gap-4">
            <RouterLink
              to="/"
              class="px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-blue-600 text-white hover:bg-blue-700': $route.path === '/',
                'text-gray-700 dark:text-gray-300': $route.path !== '/',
              }"
            >
              首页
            </RouterLink>
            <RouterLink
              to="/employees"
              class="px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-blue-600 text-white hover:bg-blue-700': $route.path.startsWith('/employees'),
                'text-gray-700 dark:text-gray-300': !$route.path.startsWith('/employees'),
              }"
            >
              员工管理
            </RouterLink>
            <RouterLink
              to="/calendar"
              class="px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-blue-600 text-white hover:bg-blue-700': $route.path === '/calendar',
                'text-gray-700 dark:text-gray-300': $route.path !== '/calendar',
              }"
            >
              日历
            </RouterLink>
            <RouterLink
              to="/settings"
              class="px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-blue-600 text-white hover:bg-blue-700': $route.path === '/settings',
                'text-gray-700 dark:text-gray-300': $route.path !== '/settings',
              }"
            >
              设置
            </RouterLink>
          </div>
        </div>
      </nav>
    </header>

    <!-- 主内容区域 -->
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* 应用全局样式已由 Tailwind CSS 处理 */
</style>
