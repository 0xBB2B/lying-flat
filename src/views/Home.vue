<!-- T075: 首页仪表板 - 统计数据、快速操作、提醒 -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { useLeaveReminderStore } from '@/stores/reminder'
import StatisticsCard from '@/components/common/StatisticsCard.vue'
import ReminderBanner from '@/components/common/ReminderBanner.vue'

const router = useRouter()
const employeeStore = useEmployeeStore()
const entitlementStore = useLeaveEntitlementStore()
const usageStore = useLeaveUsageStore()
const reminderStore = useLeaveReminderStore()

// 加载数据
onMounted(() => {
  employeeStore.loadEmployees()
  entitlementStore.loadEntitlements()
  usageStore.loadUsages()
  reminderStore.checkReminders()
})

// 统计数据
const stats = computed(() => {
  const activeEmployees = employeeStore.activeEmployees
  const totalEmployees = activeEmployees.length

  // 计算总年假额度和使用情况
  let totalEntitlement = 0
  let totalUsed = 0
  let totalRemaining = 0

  activeEmployees.forEach((emp) => {
    const balance = entitlementStore.calculateBalance(emp.id)
    totalEntitlement += balance.totalEntitlement
    totalUsed += balance.usedDays
    totalRemaining += balance.remainingDays
  })

  // 计算使用率
  const usageRate = totalEntitlement > 0 ? Math.round((totalUsed / totalEntitlement) * 100) : 0

  // 即将过期的年假总数
  const expiringSoonCount = activeEmployees.reduce((count, emp) => {
    const balance = entitlementStore.calculateBalance(emp.id)
    return count + balance.expiringSoon.length
  }, 0)

  return {
    totalEmployees,
    totalEntitlement: totalEntitlement.toFixed(1),
    totalUsed: totalUsed.toFixed(1),
    totalRemaining: totalRemaining.toFixed(1),
    usageRate,
    expiringSoonCount,
  }
})

// 快速操作
function navigateToEmployees() {
  router.push('/employees')
}

function navigateToCalendar() {
  router.push('/calendar')
}

function navigateToSettings() {
  router.push('/settings')
}
</script>

<template>
  <div class="home-view container mx-auto px-4 py-6 md:py-8">
    <!-- 全局提醒横幅 -->
    <ReminderBanner class="mb-6" />

    <!-- 标题区域 -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">仪表板</h1>
      <p class="text-gray-600 dark:text-gray-400">员工年假统计系统概览</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <StatisticsCard
        title="在职员工"
        :value="stats.totalEmployees"
        description="当前活跃员工数"
        icon="👥"
        color="blue"
      />

      <StatisticsCard
        title="总年假额度"
        :value="`${stats.totalEntitlement} 天`"
        description="所有员工总额度"
        icon="📊"
        color="green"
      />

      <StatisticsCard
        title="已使用"
        :value="`${stats.totalUsed} 天`"
        :description="`使用率: ${stats.usageRate}%`"
        icon="✓"
        color="purple"
      />

      <StatisticsCard
        title="即将过期"
        :value="stats.expiringSoonCount"
        description="30天内过期的年假批次"
        icon="⚠️"
        color="yellow"
      />
    </div>

    <!-- 快速操作 -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">快速操作</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 员工管理 -->
        <button
          @click="navigateToEmployees"
          class="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500 text-left"
        >
          <div class="text-4xl">📝</div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">员工管理</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">查看和管理员工信息</p>
          </div>
        </button>

        <!-- 日历视图 -->
        <button
          @click="navigateToCalendar"
          class="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500 text-left"
        >
          <div class="text-4xl">📅</div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">日历视图</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">查看休假安排日历</p>
          </div>
        </button>

        <!-- 数据管理 -->
        <button
          @click="navigateToSettings"
          class="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500 text-left"
        >
          <div class="text-4xl">⚙️</div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">数据管理</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">导入导出和统计报表</p>
          </div>
        </button>
      </div>
    </div>

    <!-- 系统特性 (可选,在没有数据时显示) -->
    <div
      v-if="stats.totalEmployees === 0"
      class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 md:p-8 rounded-lg"
    >
      <h2
        class="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-6 text-center"
      >
        开始使用
      </h2>
      <p class="text-center text-gray-700 dark:text-gray-300 mb-6">
        您还没有添加任何员工,点击上方"员工管理"开始添加员工信息
      </p>
      <ul
        class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base text-gray-700 dark:text-gray-300"
      >
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
          <span>根据劳动基准法自动计算年假额度</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
          <span>支持手动调整年假(增加/减少)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
          <span>年假有效期管理(2年自动过期)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
          <span>即将过期年假提醒</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
          <span>数据本地存储,支持导入导出</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
          <span>响应式设计,支持移动端和桌面端</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
