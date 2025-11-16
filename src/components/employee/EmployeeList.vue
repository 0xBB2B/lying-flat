<!-- T024: EmployeeList 组件 - 员工列表 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import type { Employee } from '@/types'
import { calculateTenure } from '@/utils/leaveCalculator'
import EmployeeCard from './EmployeeCard.vue'

// Props
const props = defineProps<{
  employees: Employee[]
  loading?: boolean
}>()

// Emits
const emit = defineEmits<{
  view: [id: string]
  add: []
}>()

// State
const showTerminated = ref(false)
const searchQuery = ref('')

// Computed
const filteredEmployees = computed(() => {
  let result = props.employees

  // 筛选在职/离职
  if (!showTerminated.value) {
    result = result.filter((e) => e.status === 'active')
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter((e) => e.name.toLowerCase().includes(query))
  }

  // 按入职日期排序 (最新的在前)
  return result.sort((a, b) => b.hireDate.getTime() - a.hireDate.getTime())
})

const activeCount = computed(() => {
  return props.employees.filter((e) => e.status === 'active').length
})

const terminatedCount = computed(() => {
  return props.employees.filter((e) => e.status === 'terminated').length
})

// Methods
function getTenureDisplay(employee: Employee): string {
  const months = calculateTenure(employee.hireDate)
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years > 0) {
    return `${years} 年 ${remainingMonths} 个月`
  }
  return `${remainingMonths} 个月`
}

function handleView(id: string) {
  emit('view', id)
}
</script>

<template>
  <div class="employee-list">
    <!-- 头部 - 搜索和筛选 -->
    <div class="mb-6 space-y-4">
      <!-- 统计信息 -->
      <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div class="flex items-center gap-2">
          <span class="font-medium">在职员工:</span>
          <span class="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full font-semibold">
            {{ activeCount }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-medium">离职员工:</span>
          <span class="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 rounded-full font-semibold">
            {{ terminatedCount }}
          </span>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="flex flex-col md:flex-row gap-4">
        <!-- 搜索框 -->
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索员工姓名..."
            class="
              w-full px-4 py-2 border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
            "
          />
        </div>

        <!-- 显示离职员工开关 -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="showTerminated"
            type="checkbox"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            显示离职员工
          </span>
        </label>

        <!-- 添加员工按钮 -->
        <button
          @click="emit('add')"
          class="
            px-6 py-2 bg-blue-600 text-white font-medium rounded-md
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            whitespace-nowrap
            transition-colors
          "
        >
          + 添加员工
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="filteredEmployees.length === 0"
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      <p v-if="searchQuery.trim()">没有找到匹配的员工</p>
      <p v-else-if="!showTerminated && terminatedCount > 0">
        暂无在职员工,开启"显示离职员工"查看离职记录
      </p>
      <p v-else>暂无员工记录,点击"添加员工"开始添加</p>
    </div>

    <!-- 卡片视图 (移动端) -->
    <div class="block md:hidden space-y-4">
      <EmployeeCard
        v-for="employee in filteredEmployees"
        :key="employee.id"
        :employee="employee"
        :show-actions="false"
        @view="handleView"
      />
    </div>

    <!-- 表格视图 (桌面端) -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              姓名
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              入职日期
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              工龄
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              状态
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="employee in filteredEmployees"
            :key="employee.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            @click="handleView(employee.id)"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ employee.name }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ format(employee.hireDate, 'yyyy-MM-dd') }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ getTenureDisplay(employee) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400':
                    employee.status === 'active',
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400':
                    employee.status === 'terminated',
                }"
              >
                {{ employee.status === 'active' ? '在职' : '已离职' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                @click.stop="handleView(employee.id)"
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                查看详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
