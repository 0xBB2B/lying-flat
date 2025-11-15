<script setup lang="ts">
import { computed } from 'vue'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { useLeaveAdjustmentStore } from '@/stores/leaveAdjustment'
import StatisticsCard from '@/components/common/StatisticsCard.vue'
import ImportExportPanel from '@/components/settings/ImportExportPanel.vue'
import { differenceInDays } from 'date-fns'

const employeeStore = useEmployeeStore()
const entitlementStore = useLeaveEntitlementStore()
const usageStore = useLeaveUsageStore()
const adjustmentStore = useLeaveAdjustmentStore()

// 浏览器信息
const browserInfo = window.navigator.userAgent.split(' ')[0]

// 统计数据计算
const totalEmployees = computed(() => employeeStore.activeEmployees.length)

const totalLeaveEntitlement = computed(() => {
  return entitlementStore.entitlements
    .filter((e) => e.status === 'active')
    .reduce((sum, e) => sum + e.days, 0)
})

const totalLeaveUsed = computed(() => {
  return usageStore.usages.reduce((sum, u) => sum + u.days, 0)
})

const totalLeaveRemaining = computed(() => {
  return entitlementStore.entitlements
    .filter((e) => e.status === 'active')
    .reduce((sum, e) => sum + e.remainingDays, 0)
})

const utilizationRate = computed(() => {
  if (totalLeaveEntitlement.value === 0) return '0%'
  const rate = (totalLeaveUsed.value / totalLeaveEntitlement.value) * 100
  return rate.toFixed(1) + '%'
})

const expiringSoonCount = computed(() => {
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return entitlementStore.entitlements.filter((e) => {
    if (e.status !== 'active' || !e.expiryDate) return false
    const expiryDate = new Date(e.expiryDate)
    return expiryDate >= now && expiryDate <= thirtyDaysLater && e.remainingDays > 0
  }).length
})

const totalAdjustments = computed(() => adjustmentStore.adjustments.length)

// 近30天的年假使用量
const recentUsage = computed(() => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return usageStore.usages
    .filter((u) => new Date(u.date) >= thirtyDaysAgo)
    .reduce((sum, u) => sum + u.days, 0)
})

// 平均每人剩余年假
const avgRemainingPerEmployee = computed(() => {
  if (totalEmployees.value === 0) return '0'
  return (totalLeaveRemaining.value / totalEmployees.value).toFixed(1)
})
</script>

<template>
  <div class="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
    <!-- 页面标题 -->
    <div class="border-b border-gray-200 pb-4">
      <h1 class="text-2xl font-bold text-gray-900 md:text-3xl">系统设置</h1>
      <p class="mt-1 text-sm text-gray-600">数据统计、导入导出和系统配置</p>
    </div>

    <!-- 统计概览 -->
    <section>
      <h2 class="mb-4 text-lg font-semibold text-gray-900">数据统计</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          title="在职员工"
          :value="totalEmployees"
          description="当前在职人数"
          icon="👥"
          color="blue"
        />

        <StatisticsCard
          title="年假总额度"
          :value="`${totalLeaveEntitlement} 天`"
          description="所有员工年假总和"
          icon="📅"
          color="green"
        />

        <StatisticsCard
          title="已使用年假"
          :value="`${totalLeaveUsed} 天`"
          :description="`使用率: ${utilizationRate}`"
          icon="✓"
          color="yellow"
        />

        <StatisticsCard
          title="剩余年假"
          :value="`${totalLeaveRemaining} 天`"
          :description="`平均每人: ${avgRemainingPerEmployee} 天`"
          icon="⏳"
          color="purple"
        />
      </div>
    </section>

    <!-- 额外统计 -->
    <section>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatisticsCard
          title="即将过期"
          :value="`${expiringSoonCount} 批`"
          description="30天内过期的年假额度"
          icon="⚠️"
          color="red"
        />

        <StatisticsCard
          title="手动调整"
          :value="`${totalAdjustments} 次`"
          description="历史调整记录总数"
          icon="✏️"
          color="blue"
        />

        <StatisticsCard
          title="近30天使用"
          :value="`${recentUsage} 天`"
          description="最近一个月的年假使用量"
          icon="📊"
          color="green"
        />
      </div>
    </section>

    <!-- 数据导入导出 -->
    <section>
      <h2 class="mb-4 text-lg font-semibold text-gray-900">数据管理</h2>
      <ImportExportPanel />
    </section>

    <!-- 系统信息 -->
    <section>
      <h2 class="mb-4 text-lg font-semibold text-gray-900">系统信息</h2>
      <div class="rounded-lg border border-gray-200 bg-white p-6">
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">系统版本</span>
            <span class="font-medium text-gray-900">v1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">数据存储</span>
            <span class="font-medium text-gray-900">localStorage + JSON 导入导出</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">浏览器</span>
            <span class="font-medium text-gray-900">{{ browserInfo }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">数据记录总数</span>
            <span class="font-medium text-gray-900">
              员工: {{ employeeStore.employees.length }}, 额度:
              {{ entitlementStore.entitlements.length }}, 使用: {{ usageStore.usages.length }},
              调整: {{ adjustmentStore.adjustments.length }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用提示 -->
    <section>
      <h2 class="mb-4 text-lg font-semibold text-gray-900">使用提示</h2>
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <ul class="space-y-2 text-sm text-blue-900">
          <li class="flex items-start gap-2">
            <span>💡</span>
            <span>建议定期导出数据作为备份,防止浏览器缓存清理导致数据丢失</span>
          </li>
          <li class="flex items-start gap-2">
            <span>💡</span>
            <span>导出的 JSON 文件可用于在不同设备间迁移数据</span>
          </li>
          <li class="flex items-start gap-2">
            <span>💡</span>
            <span>导入时请选择正确的模式:覆盖模式会删除现有数据,合并模式会保留现有数据</span>
          </li>
          <li class="flex items-start gap-2">
            <span>💡</span>
            <span>系统会自动检查年假过期情况,无需手动操作</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
