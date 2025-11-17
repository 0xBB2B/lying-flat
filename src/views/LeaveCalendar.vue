<!-- T048: LeaveCalendar 视图 - 年假日历页面 -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveUsageStore } from '@/stores/leaveUsage'
import { LeaveType } from '@/types'
import CalendarView from '@/components/calendar/CalendarView.vue'

// Stores
const employeeStore = useEmployeeStore()
const usageStore = useLeaveUsageStore()

// State
const loading = ref(false)
const selectedEmployeeId = ref<string>('all')
const currentMonth = ref<Date>(new Date())
const showDayDetail = ref(false)
const selectedDate = ref<Date | null>(null)
const isAddingUsage = ref(true)
const addUsageLoading = ref(false)
const addUsageError = ref<string | null>(null)
const addUsageSuccess = ref<string | null>(null)
const newUsageEmployeeId = ref<string>('')
const newUsageType = ref<LeaveType>(LeaveType.FULL_DAY)
const newUsageNotes = ref('')

// Computed
const activeEmployees = computed(() =>
  employeeStore.employees.filter((emp) => emp.status === 'active'),
)

const filteredUsages = computed(() => {
  if (selectedEmployeeId.value === 'all') {
    return usageStore.usages
  }
  return usageStore.usages.filter((usage) => usage.employeeId === selectedEmployeeId.value)
})

const selectedDayUsages = computed(() => {
  if (!selectedDate.value) return []

  const dateStr = selectedDate.value.toISOString().split('T')[0]
  return filteredUsages.value.filter((usage) => {
    const usageStr = usage.date.toISOString().split('T')[0]
    return usageStr === dateStr
  })
})

const totalUsagesInMonth = computed(() => filteredUsages.value.length)
const employeeOptions = computed(() => {
  if (selectedEmployeeId.value === 'all') {
    return activeEmployees.value
  }
  const selected = activeEmployees.value.find((emp) => emp.id === selectedEmployeeId.value)
  return selected ? [selected] : activeEmployees.value
})
const employeeSelectDisabled = computed(
  () => selectedEmployeeId.value !== 'all' && employeeOptions.value.length === 1,
)
const canAddUsage = computed(() => activeEmployees.value.length > 0)

// Methods
function handleMonthChange(newMonth: Date) {
  currentMonth.value = newMonth
}

function handleDayClick(date: Date) {
  selectedDate.value = date
  showDayDetail.value = true
  openAddUsageForm()
}

function closeDayDetail() {
  showDayDetail.value = false
  selectedDate.value = null
  isAddingUsage.value = true
  resetAddUsageState()
}

function resetAddUsageState() {
  addUsageError.value = null
  addUsageSuccess.value = null
  newUsageNotes.value = ''
  newUsageType.value = LeaveType.FULL_DAY
  syncDefaultEmployee()
}

function syncDefaultEmployee(force = false) {
  if (selectedEmployeeId.value !== 'all') {
    newUsageEmployeeId.value = selectedEmployeeId.value
    return
  }

  const employees = activeEmployees.value
  if (!employees.length) {
    newUsageEmployeeId.value = ''
    return
  }

  const exists = employees.some((emp) => emp.id === newUsageEmployeeId.value)
  if (force || !exists) {
    newUsageEmployeeId.value = employees[0]!.id
  }
}

function openAddUsageForm() {
  if (!canAddUsage.value) return
  isAddingUsage.value = true
  resetAddUsageState()
}

function toggleAddUsageForm() {
  if (!canAddUsage.value) return
  if (!isAddingUsage.value) {
    openAddUsageForm()
    return
  }
  isAddingUsage.value = false
}

async function submitDayUsage() {
  if (!selectedDate.value) return
  if (!newUsageEmployeeId.value) {
    addUsageError.value = '请选择需要记录的员工'
    return
  }

  addUsageError.value = null
  addUsageSuccess.value = null
  addUsageLoading.value = true

  try {
    const usageDate = new Date(selectedDate.value)
    usageDate.setHours(0, 0, 0, 0)

    await usageStore.recordUsage(
      newUsageEmployeeId.value,
      usageDate,
      newUsageType.value,
      newUsageNotes.value.trim() || undefined,
    )

    addUsageSuccess.value = '已记录休假'
    newUsageNotes.value = ''
    newUsageType.value = LeaveType.FULL_DAY
    syncDefaultEmployee()
  } catch (error) {
    addUsageError.value =
      error instanceof Error ? error.message : '记录休假时出现问题,请稍后再试'
  } finally {
    addUsageLoading.value = false
  }
}

function getEmployeeName(employeeId: string): string {
  const employee = employeeStore.getEmployeeById(employeeId)
  return employee?.name || '未知员工'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function getLeaveTypeLabel(type: string): string {
  switch (type) {
    case 'full_day':
      return '全天'
    case 'morning':
      return '上午'
    case 'afternoon':
      return '下午'
    default:
      return type
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([employeeStore.loadEmployees(), usageStore.loadUsages()])
  } catch (e) {
    console.error('Failed to load data:', e)
  } finally {
    loading.value = false
  }
})

watch(
  () => selectedEmployeeId.value,
  () => {
    if (selectedEmployeeId.value === 'all') {
      syncDefaultEmployee()
    } else {
      newUsageEmployeeId.value = selectedEmployeeId.value
    }
  },
)

watch(
  () => employeeOptions.value,
  () => {
    if (isAddingUsage.value) {
      syncDefaultEmployee()
    }
  },
)
</script>

<template>
  <div class="leave-calendar bg-gray-50 dark:bg-gray-900 py-3 md:py-4">
    <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>

      <!-- Calendar Content -->
      <div v-else class="space-y-3 md:space-y-4">
        <!-- Filters and Stats -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Employee Filter -->
            <div class="flex-1 max-w-md">
              <label
                for="employee-filter"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                筛选员工
              </label>
              <select
                id="employee-filter"
                v-model="selectedEmployeeId"
                class="w-full px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm md:text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部员工</option>
                <option v-for="employee in activeEmployees" :key="employee.id" :value="employee.id">
                  {{ employee.name }}
                </option>
              </select>
            </div>

            <!-- Stats -->
            <div class="flex items-center justify-around md:gap-6">
              <div class="text-center">
                <div class="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ totalUsagesInMonth }}
                </div>
                <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400">本月休假记录</div>
              </div>
              <div class="text-center">
                <div class="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ activeEmployees.length }}
                </div>
                <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400">在职员工</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar -->
        <CalendarView
          :usages="filteredUsages"
          :current-month="currentMonth"
          @month-change="handleMonthChange"
          @day-click="handleDayClick"
        />
      </div>
    </div>

    <!-- Day Detail Modal -->
    <div
      v-if="showDayDetail && selectedDate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4"
      @click.self="closeDayDetail"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] md:max-h-[80vh] overflow-y-auto p-4 md:p-6"
      >
        <!-- Modal Header -->
        <div class="flex items-start justify-between mb-4 md:mb-6">
          <div>
            <h3 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ formatDate(selectedDate) }}
            </h3>
            <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              共 {{ selectedDayUsages.length }} 条休假记录
            </p>
          </div>
          <button
            @click="closeDayDetail"
            class="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              class="w-5 h-5 md:w-6 md:h-6"
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

        <!-- Quick Add -->
        <div class="mb-4 md:mb-5 space-y-3">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              点击日期后可直接在此记录新的休假,系统会立即更新下方列表。
            </p>
            <div class="flex gap-2">
              <button
                @click="toggleAddUsageForm"
                :disabled="!canAddUsage"
                class="px-3 py-1.5 text-xs md:text-sm rounded-md font-medium transition-colors"
                :class="[
                  canAddUsage
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                ]"
              >
                {{ isAddingUsage ? '收起休假表单' : '添加休假记录' }}
              </button>
            </div>
          </div>
          <p v-if="!canAddUsage" class="text-xs text-red-500 dark:text-red-400">
            当前没有在职员工,无法记录休假。
          </p>
        </div>

        <div
          v-if="isAddingUsage && canAddUsage"
          class="bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 mb-4"
        >
          <form class="space-y-3" @submit.prevent="submitDayUsage">
            <div>
              <label for="newUsageEmployeeId" class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                选择员工
              </label>
              <select
                id="newUsageEmployeeId"
                v-model="newUsageEmployeeId"
                :disabled="addUsageLoading || employeeSelectDisabled"
                class="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
              >
                <option v-if="selectedEmployeeId === 'all'" value="">请选择员工</option>
                <option
                  v-for="employee in employeeOptions"
                  :key="employee.id"
                  :value="employee.id"
                >
                  {{ employee.name }}
                </option>
              </select>
              <p
                v-if="employeeSelectDisabled"
                class="text-xs text-gray-500 dark:text-gray-400 mt-1"
              >
                由于启用了员工筛选,当前仅能为该员工新增休假。
              </p>
            </div>

            <fieldset>
              <legend class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                休假类型
              </legend>
              <div class="grid grid-cols-3 gap-2 text-xs md:text-sm">
                <label
                  class="flex items-center gap-1.5 rounded-md border px-2 py-1.5 cursor-pointer"
                  :class="
                    newUsageType === LeaveType.FULL_DAY
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  "
                >
                  <input
                    v-model="newUsageType"
                    :disabled="addUsageLoading"
                    class="text-blue-600 focus:ring-blue-500"
                    name="add-usage-type"
                    type="radio"
                    :value="LeaveType.FULL_DAY"
                  />
                  <span>全天 (1 天)</span>
                </label>
                <label
                  class="flex items-center gap-1.5 rounded-md border px-2 py-1.5 cursor-pointer"
                  :class="
                    newUsageType === LeaveType.MORNING
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  "
                >
                  <input
                    v-model="newUsageType"
                    :disabled="addUsageLoading"
                    class="text-purple-600 focus:ring-purple-500"
                    name="add-usage-type"
                    type="radio"
                    :value="LeaveType.MORNING"
                  />
                  <span>上午 (0.5 天)</span>
                </label>
                <label
                  class="flex items-center gap-1.5 rounded-md border px-2 py-1.5 cursor-pointer"
                  :class="
                    newUsageType === LeaveType.AFTERNOON
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  "
                >
                  <input
                    v-model="newUsageType"
                    :disabled="addUsageLoading"
                    class="text-indigo-600 focus:ring-indigo-500"
                    name="add-usage-type"
                    type="radio"
                    :value="LeaveType.AFTERNOON"
                  />
                  <span>下午 (0.5 天)</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label for="newUsageNotes" class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                备注 (可选)
              </label>
              <textarea
                id="newUsageNotes"
                v-model="newUsageNotes"
                :disabled="addUsageLoading"
                rows="2"
                class="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                placeholder="例如: 请假原因、审批人等"
              ></textarea>
            </div>

            <div v-if="addUsageError" class="text-xs text-red-600 dark:text-red-400">
              {{ addUsageError }}
            </div>
            <div v-if="addUsageSuccess" class="text-xs text-green-600 dark:text-green-400">
              {{ addUsageSuccess }}
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-md text-xs md:text-sm border border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                :disabled="addUsageLoading"
                @click="toggleAddUsageForm"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-1.5 rounded-md text-xs md:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                :disabled="addUsageLoading || !newUsageEmployeeId"
              >
                {{ addUsageLoading ? '提交中...' : '确认记录' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Usage List -->
        <div v-if="selectedDayUsages.length > 0" class="space-y-2 md:space-y-3">
          <div
            v-for="usage in selectedDayUsages"
            :key="usage.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
              <div>
                <div class="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
                  {{ getEmployeeName(usage.employeeId) }}
                </div>
                <div class="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  员工 ID: {{ usage.employeeId }}
                </div>
              </div>
              <span
                class="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap self-start"
                :class="{
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300':
                    usage.type === 'full_day',
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300':
                    usage.type === 'morning',
                  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300':
                    usage.type === 'afternoon',
                }"
              >
                {{ getLeaveTypeLabel(usage.type) }} ({{ usage.days }} 天)
              </span>
            </div>

            <div v-if="usage.notes" class="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">备注:</span> {{ usage.notes }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">这一天没有休假记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 可选:添加自定义样式 */
</style>
