import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useEmployeeStore } from './employee'
import { useLeaveEntitlementStore } from './leaveEntitlement'
import { useLeaveUsageStore } from './leaveUsage'
import { useLeaveAdjustmentStore } from './leaveAdjustment'
import type { Employee } from '@/types/employee'
import type { LeaveEntitlement, LeaveUsage, LeaveAdjustment } from '@/types/leave'

export interface ExportData {
  version: string
  exportedAt: string
  employees: Employee[]
  entitlements: LeaveEntitlement[]
  usages: LeaveUsage[]
  adjustments: LeaveAdjustment[]
}

export interface ImportResult {
  success: boolean
  errors: string[]
  warnings: string[]
  imported: {
    employees: number
    entitlements: number
    usages: number
    adjustments: number
  }
}

export const useStorageStore = defineStore('storage', () => {
  const isImporting = ref(false)
  const isExporting = ref(false)
  const lastExportDate = ref<Date | null>(null)
  const lastImportDate = ref<Date | null>(null)

  /**
   * 保存所有数据到 localStorage
   */
  async function saveAll(): Promise<void> {
    const employeeStore = useEmployeeStore()
    const entitlementStore = useLeaveEntitlementStore()
    const usageStore = useLeaveUsageStore()
    const adjustmentStore = useLeaveAdjustmentStore()

    // 各个 store 已经在各自的操作中保存数据到 localStorage
    // 这里只需要确保所有数据都已同步
    // 注意:这些方法在各个 store 中是私有的,不在返回的对象中
    // 所以这个方法目前不需要主动调用保存,因为每个操作都会自动保存
  }

  /**
   * 从 localStorage 加载所有数据
   */
  async function loadAll(): Promise<void> {
    const employeeStore = useEmployeeStore()
    const entitlementStore = useLeaveEntitlementStore()
    const usageStore = useLeaveUsageStore()
    const adjustmentStore = useLeaveAdjustmentStore()

    await employeeStore.loadEmployees()
    await entitlementStore.loadEntitlements()
    await usageStore.loadUsages()
    await adjustmentStore.loadAdjustments()
  }

  /**
   * 导出所有数据为 JSON 对象
   */
  function exportData(): ExportData {
    isExporting.value = true

    try {
      const employeeStore = useEmployeeStore()
      const entitlementStore = useLeaveEntitlementStore()
      const usageStore = useLeaveUsageStore()
      const adjustmentStore = useLeaveAdjustmentStore()

      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        employees: employeeStore.employees,
        entitlements: entitlementStore.entitlements,
        usages: usageStore.usages,
        adjustments: adjustmentStore.adjustments
      }

      lastExportDate.value = new Date()
      return data
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 导出数据并触发浏览器下载 JSON 文件
   */
  function downloadJSON(): void {
    const data = exportData()
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `annual-leave-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /**
   * 验证导入数据的格式和完整性
   */
  function validateImportData(data: unknown): ImportResult {
    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: [],
      imported: {
        employees: 0,
        entitlements: 0,
        usages: 0,
        adjustments: 0
      }
    }

    // 检查数据是否为对象
    if (!data || typeof data !== 'object') {
      result.errors.push('导入数据格式无效,必须是 JSON 对象')
      return result
    }

    const importData = data as Record<string, unknown>

    // 检查版本
    if (!importData.version || typeof importData.version !== 'string') {
      result.warnings.push('数据版本信息缺失,可能导致兼容性问题')
    }

    // 检查必需字段
    if (!Array.isArray(importData.employees)) {
      result.errors.push('employees 字段缺失或格式错误')
    }
    if (!Array.isArray(importData.entitlements)) {
      result.errors.push('entitlements 字段缺失或格式错误')
    }
    if (!Array.isArray(importData.usages)) {
      result.errors.push('usages 字段缺失或格式错误')
    }
    if (!Array.isArray(importData.adjustments)) {
      result.errors.push('adjustments 字段缺失或格式错误')
    }

    if (result.errors.length === 0) {
      result.success = true
      result.imported.employees = (importData.employees as unknown[]).length
      result.imported.entitlements = (importData.entitlements as unknown[]).length
      result.imported.usages = (importData.usages as unknown[]).length
      result.imported.adjustments = (importData.adjustments as unknown[]).length
    }

    return result
  }

  /**
   * 导入 JSON 数据
   * @param data - 导入的数据对象
   * @param merge - 是否合并现有数据(false 则覆盖)
   */
  async function importData(data: unknown, merge = false): Promise<ImportResult> {
    isImporting.value = true

    try {
      // 验证数据
      const validation = validateImportData(data)
      if (!validation.success) {
        return validation
      }

      const importData = data as ExportData
      const employeeStore = useEmployeeStore()
      const entitlementStore = useLeaveEntitlementStore()
      const usageStore = useLeaveUsageStore()
      const adjustmentStore = useLeaveAdjustmentStore()

      // 准备合并或覆盖后的数据
      let finalEmployees = importData.employees
      let finalEntitlements = importData.entitlements
      let finalUsages = importData.usages
      let finalAdjustments = importData.adjustments

      if (merge) {
        // 合并模式:添加新数据,保留现有数据
        // 使用 Map 去重(基于 ID)
        const employeeMap = new Map(employeeStore.employees.map((e) => [e.id, e]))
        const entitlementMap = new Map(entitlementStore.entitlements.map((e) => [e.id, e]))
        const usageMap = new Map(usageStore.usages.map((u) => [u.id, u]))
        const adjustmentMap = new Map(adjustmentStore.adjustments.map((a) => [a.id, a]))

        // 添加导入的数据(不覆盖现有的)
        importData.employees.forEach((emp) => {
          if (!employeeMap.has(emp.id)) {
            employeeMap.set(emp.id, emp)
          }
        })

        importData.entitlements.forEach((ent) => {
          if (!entitlementMap.has(ent.id)) {
            entitlementMap.set(ent.id, ent)
          }
        })

        importData.usages.forEach((usage) => {
          if (!usageMap.has(usage.id)) {
            usageMap.set(usage.id, usage)
          }
        })

        importData.adjustments.forEach((adj) => {
          if (!adjustmentMap.has(adj.id)) {
            adjustmentMap.set(adj.id, adj)
          }
        })

        finalEmployees = Array.from(employeeMap.values())
        finalEntitlements = Array.from(entitlementMap.values())
        finalUsages = Array.from(usageMap.values())
        finalAdjustments = Array.from(adjustmentMap.values())
      }

      // 直接写入 localStorage (绕过 store 的私有保存方法)
      const storageData = {
        employees: finalEmployees,
        entitlements: finalEntitlements,
        usages: finalUsages,
        adjustments: finalAdjustments
      }

      const { save } = await import('@/utils/storage')
      const success = save(storageData)

      if (!success) {
        throw new Error('保存数据到 localStorage 失败')
      }

      // 重新加载所有 store 的数据
      await loadAll()

      lastImportDate.value = new Date()
      return validation
    } finally {
      isImporting.value = false
    }
  }

  /**
   * 从文件导入数据
   */
  async function importFromFile(file: File, merge = false): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string
          const data = JSON.parse(content)
          const result = await importData(data, merge)
          resolve(result)
        } catch (error) {
          resolve({
            success: false,
            errors: ['JSON 解析失败: ' + (error as Error).message],
            warnings: [],
            imported: {
              employees: 0,
              entitlements: 0,
              usages: 0,
              adjustments: 0
            }
          })
        }
      }

      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['文件读取失败'],
          warnings: [],
          imported: {
            employees: 0,
            entitlements: 0,
            usages: 0,
            adjustments: 0
          }
        })
      }

      reader.readAsText(file)
    })
  }

  return {
    // State
    isImporting,
    isExporting,
    lastExportDate,
    lastImportDate,

    // Actions
    saveAll,
    loadAll,
    exportData,
    downloadJSON,
    validateImportData,
    importData,
    importFromFile
  }
})
