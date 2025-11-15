// T006: Employee类型定义

export enum EmployeeStatus {
  ACTIVE = 'active',
  TERMINATED = 'terminated',
}

export interface Employee {
  id: string // UUID,唯一标识
  name: string // 员工姓名
  hireDate: Date // 入职日期
  status: EmployeeStatus // 在职状态
  createdAt: Date // 记录创建时间
  updatedAt: Date // 记录更新时间
  terminatedAt?: Date // 离职日期 (可选)
}

// 计算字段 (不存储,运行时计算)
export interface EmployeeComputed {
  tenure: number // 连续雇用年限 (精确到小数,单位:年)
  nextLeaveGrantDate: Date // 下次年假发放日期 (入职周年日)
  currentLeaveEntitlement: number // 当前应有的年假总额度 (天)
}
