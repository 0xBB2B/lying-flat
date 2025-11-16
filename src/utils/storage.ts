// T015: localStorage封装

import type { Employee, LeaveEntitlement, LeaveUsage, LeaveAdjustment } from '@/types'

const STORAGE_KEY = 'annual-leave-system:data'
const STORAGE_VERSION = '1.0.0'

export interface StorageData {
  version: string
  employees: Employee[]
  entitlements: LeaveEntitlement[]
  usages: LeaveUsage[]
  adjustments: LeaveAdjustment[]
  lastUpdated: string
}

/**
 * 从 localStorage 加载数据
 */
export function load(): StorageData | null {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY)
    if (!dataStr) return null

    const data = JSON.parse(dataStr) as StorageData

    // 验证数据格式
    if (!data.version || !data.employees) {
      console.warn('Invalid storage data format')
      return null
    }

    // 恢复日期对象
    data.employees = data.employees.map((e) => ({
      ...e,
      hireDate: new Date(e.hireDate),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
      terminatedAt: e.terminatedAt ? new Date(e.terminatedAt) : undefined,
    }))

    data.entitlements = data.entitlements.map((e) => ({
      ...e,
      grantDate: new Date(e.grantDate),
      expiryDate: e.expiryDate ? new Date(e.expiryDate) : null,
      createdAt: new Date(e.createdAt),
    }))

    data.usages = data.usages.map((u) => ({
      ...u,
      date: new Date(u.date),
      createdAt: new Date(u.createdAt),
    }))

    data.adjustments = data.adjustments.map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    }))

    return data
  } catch (error) {
    console.error('Failed to load data from localStorage:', error)
    return null
  }
}

/**
 * 保存数据到 localStorage
 */
export function save(data: Omit<StorageData, 'version' | 'lastUpdated'>): boolean {
  try {
    const storageData: StorageData = {
      ...data,
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    return true
  } catch (error) {
    console.error('Failed to save data to localStorage:', error)
    return false
  }
}

/**
 * 导出数据为 JSON 字符串
 */
export function exportToJSON(): string {
  const data = load()
  if (!data) {
    return JSON.stringify(
      {
        version: STORAGE_VERSION,
        employees: [],
        entitlements: [],
        usages: [],
        adjustments: [],
        lastUpdated: new Date().toISOString(),
      },
      null,
      2,
    )
  }

  return JSON.stringify(data, null, 2)
}

/**
 * 从 JSON 字符串导入数据
 */
export function importFromJSON(jsonStr: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr) as StorageData

    // 验证数据格式
    if (!data.version) {
      return { success: false, error: '缺少版本信息' }
    }

    if (!Array.isArray(data.employees)) {
      return { success: false, error: 'employees 字段格式错误' }
    }

    if (!Array.isArray(data.entitlements)) {
      return { success: false, error: 'entitlements 字段格式错误' }
    }

    if (!Array.isArray(data.usages)) {
      return { success: false, error: 'usages 字段格式错误' }
    }

    if (!Array.isArray(data.adjustments)) {
      return { success: false, error: 'adjustments 字段格式错误' }
    }

    // 恢复日期对象并保存
    const restoredData = {
      employees: data.employees.map((e) => ({
        ...e,
        hireDate: new Date(e.hireDate),
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
        terminatedAt: e.terminatedAt ? new Date(e.terminatedAt) : undefined,
      })),
      entitlements: data.entitlements.map((e) => ({
        ...e,
        grantDate: new Date(e.grantDate),
        expiryDate: e.expiryDate ? new Date(e.expiryDate) : null,
        createdAt: new Date(e.createdAt),
      })),
      usages: data.usages.map((u) => ({
        ...u,
        date: new Date(u.date),
        createdAt: new Date(u.createdAt),
      })),
      adjustments: data.adjustments.map((a) => ({
        ...a,
        createdAt: new Date(a.createdAt),
      })),
    }

    save(restoredData)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `解析 JSON 失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 清空所有数据
 */
export function clear(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 下载数据为 JSON 文件
 */
export function downloadJSON(filename: string = 'annual-leave-data.json'): void {
  const jsonStr = exportToJSON()
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
