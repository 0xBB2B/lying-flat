<!-- T034: EmployeeDetail 视图 - 员工详情页 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import { useLeaveAdjustmentStore } from '@/stores/leaveAdjustment'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import LeaveBalance from '@/components/leave/LeaveBalance.vue'
import LeaveAdjustmentForm from '@/components/leave/LeaveAdjustmentForm.vue'
import LeaveHistory from '@/components/leave/LeaveHistory.vue'
import LeaveUsageForm from '@/components/leave/LeaveUsageForm.vue'
import LeaveUsageTable from '@/components/leave/LeaveUsageTable.vue'
import ExpiryWarningCard from '@/components/leave/ExpiryWarningCard.vue'
import { useLeaveReminder } from '@/composables/useLeaveReminder'

// Router & Stores
const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()
const leaveEntitlementStore = useLeaveEntitlementStore()
const leaveAdjustmentStore = useLeaveAdjustmentStore()
const leaveUsageStore = useLeaveUsageStore()
const { getEmployeeReminders, dismissReminder } = useLeaveReminder()

// State
const loading = ref(false)
const showAdjustmentForm = ref(false)
const showUsageForm = ref(false)
const showTerminateConfirm = ref(false)
const terminateDate = ref(format(new Date(), 'yyyy-MM-dd'))

// Computed
const employeeId = computed(() => route.params.id as string)

const employee = computed(() => employeeStore.getEmployeeById(employeeId.value))

const leaveBalance = computed(() => {
  if (!employee.value) return null
  try {
    return leaveEntitlementStore.calculateBalance(employeeId.value)
  } catch (e) {
    console.error('Failed to calculate balance:', e)
    return null
  }
})

const adjustmentHistory = computed(() =>
  leaveAdjustmentStore.getAdjustmentsByEmployeeId(employeeId.value),
)

const usageHistory = computed(() =>
  leaveUsageStore.getUsagesByEmployeeId(employeeId.value),
)

const employeeStatusLabel = computed(() => {
  if (!employee.value) return ''
  return employee.value.status === 'active' ? '在职' : '离职'
})

const employeeStatusClass = computed(() => {
  if (!employee.value) return ''
  return employee.value.status === 'active'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
})

// 获取该员工的提醒
const employeeReminders = computed(() => {
  if (!employee.value) return []
  return getEmployeeReminders(employeeId.value)
})

// 获取即将过期的年假额度
const expiringSoonEntitlements = computed(() => {
  if (!leaveBalance.value) return []
  return leaveBalance.value.expiringSoon
})

// Methods
function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function handleAdjustmentSuccess() {
  showAdjustmentForm.value = false
  // 刷新余额数据
  leaveEntitlementStore.loadEntitlements()
  leaveAdjustmentStore.loadAdjustments()
}

function handleAdjustmentCancel() {
  showAdjustmentForm.value = false
}

function handleUsageSuccess() {
  showUsageForm.value = false
  // 刷新余额和使用记录
  leaveEntitlementStore.loadEntitlements()
  leaveUsageStore.loadUsages()
}

function handleUsageCancel() {
  showUsageForm.value = false
}

async function handleDeleteUsage(id: string) {
  try {
    await leaveUsageStore.deleteUsage(id)
    // 刷新数据 - 需要同时刷新额度和使用记录
    await Promise.all([
      leaveEntitlementStore.loadEntitlements(),
      leaveUsageStore.loadUsages()
    ])
  } catch (e) {
    console.error('Failed to delete usage:', e)
    alert(e instanceof Error ? e.message : '删除失败')
  }
}

async function handleDeleteAdjustment(id: string) {
  try {
    await leaveAdjustmentStore.deleteAdjustment(id)
    // 刷新数据 - 需要同时刷新额度和调整记录
    await Promise.all([
      leaveEntitlementStore.loadEntitlements(),
      leaveAdjustmentStore.loadAdjustments()
    ])
  } catch (e) {
    console.error('Failed to delete adjustment:', e)
    alert(e instanceof Error ? e.message : '删除调整记录失败')
  }
}

function goBack() {
  router.push('/employees')
}

// T071: 离职处理
function handleTerminateClick() {
  showTerminateConfirm.value = true
}

async function confirmTerminate() {
  try {
    const date = new Date(terminateDate.value)
    await employeeStore.terminateEmployee(employeeId.value, date)
    showTerminateConfirm.value = false
    // 刷新员工数据
    await employeeStore.loadEmployees()
  } catch (e) {
    console.error('Failed to terminate employee:', e)
    alert(e instanceof Error ? e.message : '标记离职失败')
  }
}

function cancelTerminate() {
  showTerminateConfirm.value = false
  terminateDate.value = format(new Date(), 'yyyy-MM-dd')
}

// T073: 计算离职时未使用的年假
const unusedLeaveOnTermination = computed(() => {
  if (!employee.value || employee.value.status !== 'terminated' || !leaveBalance.value) {
    return null
  }

  return {
    totalRemaining: leaveBalance.value.remainingDays,
    totalEntitlement: leaveBalance.value.totalEntitlement,
    totalUsed: leaveBalance.value.usedDays,
    terminatedAt: employee.value.terminatedAt
  }
})

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      employeeStore.loadEmployees(),
      leaveEntitlementStore.loadEntitlements(),
      leaveAdjustmentStore.loadAdjustments(),
      leaveUsageStore.loadUsages(),
    ])

    // 检查员工是否存在
    if (!employee.value) {
      console.error(`Employee ${employeeId.value} not found`)
      router.push('/employees')
    }
  } catch (e) {
    console.error('Failed to load data:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="employee-detail min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>

      <!-- 员工不存在 -->
      <div v-else-if="!employee" class="text-center py-12">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">员工不存在</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          未找到 ID 为 {{ employeeId }} 的员工
        </p>
        <div class="mt-6">
          <button
            @click="goBack"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回员工列表
          </button>
        </div>
      </div>

      <!-- 员工详情 -->
      <div v-else class="space-y-6">
        <!-- 头部:返回按钮和员工信息 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div class="flex items-start justify-between mb-6">
            <button
              @click="goBack"
              class="
                flex items-center text-gray-600 dark:text-gray-400
                hover:text-gray-900 dark:hover:text-gray-100
                transition-colors
              "
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              返回列表
            </button>
            <span
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="employeeStatusClass"
            >
              {{ employeeStatusLabel }}
            </span>
          </div>

          <div class="space-y-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ employee.name }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                员工 ID: {{ employee.id }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div class="flex items-center">
                <svg
                  class="w-5 h-5 text-gray-400 dark:text-gray-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">入职日期</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDate(employee.hireDate) }}
                  </p>
                </div>
              </div>

              <div v-if="employee.terminatedAt" class="flex items-center">
                <svg
                  class="w-5 h-5 text-gray-400 dark:text-gray-600 mr-3"
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
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">离职日期</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDate(employee.terminatedAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年假过期提醒 -->
        <ExpiryWarningCard
          v-if="expiringSoonEntitlements.length > 0"
          :entitlements="expiringSoonEntitlements"
          :employee-name="employee.name"
          @dismiss="() => {}"
        />

        <!-- 年假余额 -->
        <LeaveBalance v-if="leaveBalance" :balance="leaveBalance" />

        <!-- 操作按钮组 -->
        <div v-if="employee.status === 'active'" class="flex gap-4 justify-end flex-wrap">
          <button
            v-if="!showUsageForm"
            @click="showUsageForm = true"
            class="
              px-6 py-2 bg-green-600 text-white font-medium rounded-md
              hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              transition-colors
            "
          >
            📅 记录休假
          </button>
          <button
            v-if="!showAdjustmentForm"
            @click="showAdjustmentForm = true"
            class="
              px-6 py-2 bg-blue-600 text-white font-medium rounded-md
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-colors
            "
          >
            ✏️ 手动调整年假
          </button>
          <button
            @click="handleTerminateClick"
            class="
              px-6 py-2 bg-red-600 text-white font-medium rounded-md
              hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              transition-colors
            "
          >
            🚪 标记离职
          </button>
        </div>

        <!-- 年假使用表单 -->
        <LeaveUsageForm
          v-if="showUsageForm && leaveBalance"
          :employee-id="employeeId"
          :current-balance="leaveBalance.remainingDays"
          @success="handleUsageSuccess"
          @cancel="handleUsageCancel"
        />

        <!-- 年假调整表单 -->
        <LeaveAdjustmentForm
          v-if="showAdjustmentForm && leaveBalance"
          :employee-id="employeeId"
          :current-balance="leaveBalance.remainingDays"
          @success="handleAdjustmentSuccess"
          @cancel="handleAdjustmentCancel"
        />

        <!-- T073: 离职时未使用年假显示 -->
        <div
          v-if="unusedLeaveOnTermination"
          class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-6"
        >
          <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4">
            📊 离职时年假结算
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-yellow-700 dark:text-yellow-300">总额度</p>
              <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {{ unusedLeaveOnTermination.totalEntitlement }} 天
              </p>
            </div>
            <div>
              <p class="text-yellow-700 dark:text-yellow-300">已使用</p>
              <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {{ unusedLeaveOnTermination.totalUsed }} 天
              </p>
            </div>
            <div>
              <p class="text-yellow-700 dark:text-yellow-300">未使用(供HR参考)</p>
              <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {{ unusedLeaveOnTermination.totalRemaining }} 天
              </p>
            </div>
          </div>
          <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-4">
            离职日期: {{ formatDate(unusedLeaveOnTermination.terminatedAt!) }}
          </p>
        </div>

        <!-- 休假使用历史 -->
        <LeaveUsageTable
          :usages="usageHistory"
          :limit="10"
          :show-delete="true"
          @delete="handleDeleteUsage"
        />

        <!-- 调整历史 -->
        <LeaveHistory
          :adjustments="adjustmentHistory"
          :limit="10"
          :show-delete="true"
          @delete="handleDeleteAdjustment"
        />
      </div>
    </div>

    <!-- T071: 离职确认对话框 -->
    <div
      v-if="showTerminateConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click.self="cancelTerminate"
    >
      <div class="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          确认标记员工离职
        </h3>

        <div class="mb-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 此操作将标记员工离职,离职后的员工将不在活跃员工列表中显示,但保留所有历史记录。
          </p>
        </div>

        <div v-if="employee" class="mb-4 space-y-3">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">员工姓名</p>
            <p class="text-base font-medium text-gray-900 dark:text-gray-100">
              {{ employee.name }}
            </p>
          </div>

          <div>
            <label
              for="terminate-date"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              离职日期
            </label>
            <input
              id="terminate-date"
              v-model="terminateDate"
              type="date"
              class="
                w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500
                dark:bg-gray-700 dark:text-gray-100
              "
              :max="format(new Date(), 'yyyy-MM-dd')"
            />
          </div>

          <div v-if="leaveBalance" class="text-sm text-gray-600 dark:text-gray-400">
            <p>当前剩余年假: <span class="font-medium">{{ leaveBalance.remainingDays }} 天</span></p>
            <p class="text-xs mt-1">离职后将记录未使用天数供HR参考</p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="cancelTerminate"
            class="
              flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100
              rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors
            "
          >
            取消
          </button>
          <button
            @click="confirmTerminate"
            class="
              flex-1 px-4 py-2 bg-red-600 text-white rounded-md
              hover:bg-red-700 transition-colors
            "
          >
            确认离职
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 可选:添加自定义样式 */
</style>
