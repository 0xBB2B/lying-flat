<!-- T026: EmployeeManagement 视图 - 员工管理页面 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveEntitlementStore } from '@/stores/leaveEntitlement'
import EmployeeList from '@/components/employee/EmployeeList.vue'
import EmployeeForm from '@/components/employee/EmployeeForm.vue'

// Router
const router = useRouter()

// Stores
const employeeStore = useEmployeeStore()
const leaveEntitlementStore = useLeaveEntitlementStore()

// State
const showAddForm = ref(false)
const loading = ref(false)

// Methods
function handleAddEmployee() {
  showAddForm.value = true
}

function handleFormSuccess() {
  showAddForm.value = false
  // 不需要手动刷新,Pinia store 已经更新
}

function handleFormCancel() {
  showAddForm.value = false
}

function handleViewEmployee(id: string) {
  router.push(`/employees/${id}`)
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await employeeStore.loadEmployees()
    await leaveEntitlementStore.loadEntitlements()
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="employee-management container mx-auto px-4 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">员工管理</h1>
      <p class="text-gray-600 dark:text-gray-400">
        管理员工信息,系统会自动计算和发放年假额度
      </p>
    </div>

    <!-- 添加员工表单 (弹出式) -->
    <div
      v-if="showAddForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="handleFormCancel"
    >
      <div class="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <EmployeeForm @success="handleFormSuccess" @cancel="handleFormCancel" />
      </div>
    </div>

    <!-- 员工列表 -->
    <EmployeeList
      :employees="employeeStore.employees"
      :loading="loading"
      @view="handleViewEmployee"
      @add="handleAddEmployee"
    />
  </div>
</template>

<style scoped>
/* 覆盖滚动条样式 (可选) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
