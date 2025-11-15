<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStorageStore } from '@/stores/storage'
import type { ImportResult } from '@/stores/storage'

const storageStore = useStorageStore()

const fileInput = ref<HTMLInputElement | null>(null)
const mergeMode = ref(false)
const importResult = ref<ImportResult | null>(null)
const showImportResult = ref(false)

const isProcessing = computed(() => storageStore.isImporting || storageStore.isExporting)

const lastExportInfo = computed(() => {
  if (!storageStore.lastExportDate) return '从未导出'
  return `上次导出: ${storageStore.lastExportDate.toLocaleString('zh-CN')}`
})

const lastImportInfo = computed(() => {
  if (!storageStore.lastImportDate) return '从未导入'
  return `上次导入: ${storageStore.lastImportDate.toLocaleString('zh-CN')}`
})

/**
 * 处理导出操作
 */
function handleExport() {
  storageStore.downloadJSON()
}

/**
 * 触发文件选择
 */
function triggerFileInput() {
  fileInput.value?.click()
}

/**
 * 处理文件选择
 */
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 验证文件类型
  if (!file.name.endsWith('.json')) {
    alert('请选择 JSON 文件')
    return
  }

  // 导入文件
  importResult.value = await storageStore.importFromFile(file, mergeMode.value)
  showImportResult.value = true

  // 重置文件输入
  target.value = ''
}

/**
 * 关闭导入结果对话框
 */
function closeImportResult() {
  showImportResult.value = false
  importResult.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- 导出面板 -->
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">导出数据</h3>
      <p class="mb-4 text-sm text-gray-600">
        导出所有员工、年假额度、使用记录和调整记录到 JSON
        文件,可用于数据备份或迁移到其他设备。
      </p>

      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-500">{{ lastExportInfo }}</p>
        <button
          @click="handleExport"
          :disabled="isProcessing"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="storageStore.isExporting">导出中...</span>
          <span v-else>下载 JSON 文件</span>
        </button>
      </div>
    </div>

    <!-- 导入面板 -->
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">导入数据</h3>
      <p class="mb-4 text-sm text-gray-600">
        从 JSON 文件导入数据。可以选择覆盖现有数据或与现有数据合并。
      </p>

      <!-- 导入模式选择 -->
      <div class="mb-4 space-y-2">
        <label class="flex items-center gap-2">
          <input
            v-model="mergeMode"
            type="radio"
            name="import-mode"
            :value="false"
            class="h-4 w-4 text-blue-600"
          />
          <span class="text-sm text-gray-700">覆盖模式(删除现有数据,替换为导入数据)</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="mergeMode"
            type="radio"
            name="import-mode"
            :value="true"
            class="h-4 w-4 text-blue-600"
          />
          <span class="text-sm text-gray-700">合并模式(保留现有数据,添加新数据)</span>
        </label>
      </div>

      <!-- 警告提示 -->
      <div v-if="!mergeMode" class="mb-4 rounded-md bg-yellow-50 p-3">
        <p class="text-sm text-yellow-800">
          ⚠️ 覆盖模式将删除所有现有数据,请确保已备份重要数据!
        </p>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-500">{{ lastImportInfo }}</p>
        <button
          @click="triggerFileInput"
          :disabled="isProcessing"
          class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="storageStore.isImporting">导入中...</span>
          <span v-else>选择 JSON 文件</span>
        </button>
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- 导入结果对话框 -->
    <div
      v-if="showImportResult && importResult"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click.self="closeImportResult"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 text-lg font-semibold">
          {{ importResult.success ? '导入成功' : '导入失败' }}
        </h3>

        <!-- 成功信息 -->
        <div v-if="importResult.success" class="mb-4 space-y-2">
          <p class="text-sm text-gray-600">成功导入以下数据:</p>
          <ul class="space-y-1 text-sm text-gray-700">
            <li>员工: {{ importResult.imported.employees }} 条</li>
            <li>年假额度: {{ importResult.imported.entitlements }} 条</li>
            <li>使用记录: {{ importResult.imported.usages }} 条</li>
            <li>调整记录: {{ importResult.imported.adjustments }} 条</li>
          </ul>
        </div>

        <!-- 错误信息 -->
        <div v-if="importResult.errors.length > 0" class="mb-4">
          <p class="mb-2 text-sm font-medium text-red-600">错误:</p>
          <ul class="space-y-1 text-sm text-red-600">
            <li v-for="(error, index) in importResult.errors" :key="index">• {{ error }}</li>
          </ul>
        </div>

        <!-- 警告信息 -->
        <div v-if="importResult.warnings.length > 0" class="mb-4">
          <p class="mb-2 text-sm font-medium text-yellow-600">警告:</p>
          <ul class="space-y-1 text-sm text-yellow-600">
            <li v-for="(warning, index) in importResult.warnings" :key="index">
              • {{ warning }}
            </li>
          </ul>
        </div>

        <!-- 关闭按钮 -->
        <button
          @click="closeImportResult"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>
