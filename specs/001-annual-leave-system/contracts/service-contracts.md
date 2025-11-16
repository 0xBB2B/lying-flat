# Service Contracts: 员工年假统计系统

**Feature**: 001-annual-leave-system | **Date**: 2025-11-13
**Type**: 前端服务层接口契约

## 概述

本文档定义系统各个服务层的方法签名、输入输出契约和错误处理规范。由于是纯前端应用,这些契约定义了 TypeScript 服务类的公共接口。

## 1. LeaveCalculatorService

**职责**: 核心年假计算引擎,处理所有与年假额度计算相关的逻辑

### 方法契约

#### `calculateTenure(hireDate: Date, currentDate: Date): number`

**描述**: 计算员工的连续雇用年限

**输入**:
- `hireDate`: 入职日期
- `currentDate`: 当前日期 (或指定计算日期)

**输出**: 雇用年限 (单位:年,精确到小数)

**示例**:
```typescript
calculateTenure(new Date('2023-01-01'), new Date('2025-07-01'))
// 返回: 2.5
```

**错误处理**:
- 如果 `hireDate > currentDate`,抛出 `InvalidDateRangeError`

---

#### `getAnnualLeaveDays(tenure: number): number`

**描述**: 根据雇用年限返回对应的年假天数

**输入**:
- `tenure`: 雇用年限 (年)

**输出**: 年假天数 (10-20)

**规则映射**:
| tenure 范围 | 返回天数 |
|-------------|----------|
| < 0.5 | 0 |
| 0.5 - 1.5 | 10 |
| 1.5 - 2.5 | 11 |
| 2.5 - 3.5 | 12 |
| 3.5 - 4.5 | 14 |
| 4.5 - 5.5 | 16 |
| 5.5 - 6.5 | 18 |
| >= 6.5 | 20 (上限) |

**示例**:
```typescript
getAnnualLeaveDays(2.7) // 返回: 12
getAnnualLeaveDays(7.0) // 返回: 20
```

---

#### `calculateNextLeaveGrantDate(hireDate: Date, currentDate: Date): Date`

**描述**: 计算下次年假发放日期 (入职周年日)

**输入**:
- `hireDate`: 入职日期
- `currentDate`: 当前日期

**输出**: 下次年假发放的日期

**逻辑**:
- 找到最近的入职周年日 (每半年一次: 0.5, 1.5, 2.5, ...)
- 如果当前日期已经超过某个周年日,返回下一个周年日

**示例**:
```typescript
calculateNextLeaveGrantDate(
  new Date('2025-01-01'), // 入职日期
  new Date('2025-11-13')  // 当前日期
)
// 返回: 2026-01-01 (入职满 1.5 年的日期)
```

---

#### `calculateLeaveEntitlements(employee: Employee, currentDate: Date): LeaveEntitlement[]`

**描述**: 计算员工从入职到当前应该获得的所有年假额度批次

**输入**:
- `employee`: 员工对象
- `currentDate`: 当前日期

**输出**: 年假额度数组 (按发放日期升序)

**逻辑**:
- 从入职日期开始,每隔半年计算一次应发放的年假
- 每批年假的有效期为发放日期 + 2 年
- 返回所有应该发放的批次 (包括已过期的)

**示例**:
```typescript
calculateLeaveEntitlements(
  { id: '1', name: '张三', hireDate: new Date('2023-01-01'), status: 'active', ... },
  new Date('2025-11-13')
)
// 返回:
// [
//   { days: 10, grantDate: '2023-07-01', expiryDate: '2025-07-01', ... },
//   { days: 11, grantDate: '2024-07-01', expiryDate: '2026-07-01', ... },
//   { days: 12, grantDate: '2025-07-01', expiryDate: '2027-07-01', ... }
// ]
```

---

#### `calculateLeaveBalance(employee: Employee, entitlements: LeaveEntitlement[]): LeaveBalance`

**描述**: 计算员工当前的年假余额汇总

**输入**:
- `employee`: 员工对象
- `entitlements`: 员工的所有年假额度记录

**输出**: `LeaveBalance` 对象 (总额度、已使用、剩余、即将过期等)

**示例**:
```typescript
calculateLeaveBalance(employee, entitlements)
// 返回:
// {
//   employeeId: '1',
//   totalEntitlement: 33,
//   usedDays: 5,
//   remainingDays: 28,
//   expiringSoon: [{ days: 10, expiryDate: '2025-12-15', ... }],
//   nextGrantDate: '2026-07-01',
//   nextGrantDays: 14
// }
```

---

## 2. LeaveValidatorService

**职责**: 验证年假相关操作的合法性

### 方法契约

#### `validateLeaveUsage(usage: Partial<LeaveUsage>, balance: LeaveBalance): ValidationResult`

**描述**: 验证休假申请是否合法

**输入**:
- `usage`: 休假记录 (部分字段)
- `balance`: 员工当前年假余额

**输出**: `ValidationResult` 对象

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

**验证规则**:
1. `days` 必须为 0.5 或 1
2. `remainingDays >= usage.days` (余额充足)
3. 同一天不能有重复的全天休假
4. 同一天不能有重复的上午/下午半天休假

**示例**:
```typescript
validateLeaveUsage(
  { days: 1, date: new Date('2025-12-01'), type: 'full_day' },
  { remainingDays: 10, ... }
)
// 返回: { valid: true, errors: [] }

validateLeaveUsage(
  { days: 2, date: new Date('2025-12-01'), type: 'full_day' },
  { remainingDays: 10, ... }
)
// 返回: { valid: false, errors: ['休假天数必须为 0.5 或 1'] }
```

---

#### `validateEmployee(employee: Partial<Employee>): ValidationResult`

**描述**: 验证员工信息是否合法

**验证规则**:
1. `name` 不能为空,长度 1-50
2. `hireDate` 不能晚于当前日期
3. 如果 `status` 为 `terminated`,则 `terminatedAt` 必填且不能早于 `hireDate`

---

#### `validateLeaveAdjustment(adjustment: Partial<LeaveAdjustment>): ValidationResult`

**描述**: 验证年假调整操作是否合法

**验证规则**:
1. `days > 0`
2. `reason` 不能为空,长度 1-200
3. `balanceAfter >= 0` (调整后余额不能为负)

---

## 3. ExpiryManagerService

**职责**: 管理年假有效期,处理过期逻辑

### 方法契约

#### `checkExpiry(entitlements: LeaveEntitlement[], currentDate: Date): LeaveEntitlement[]`

**描述**: 检查并更新年假额度的过期状态

**输入**:
- `entitlements`: 年假额度数组
- `currentDate`: 当前日期

**输出**: 更新后的年假额度数组 (状态可能变更为 `expired`)

**逻辑**:
- 遍历所有额度,如果 `expiryDate < currentDate` 且 `status === 'active'`,则更新为 `expired`

**示例**:
```typescript
checkExpiry([
  { id: '1', expiryDate: new Date('2025-01-01'), status: 'active', ... },
  { id: '2', expiryDate: new Date('2026-01-01'), status: 'active', ... }
], new Date('2025-11-13'))
// 返回:
// [
//   { id: '1', status: 'expired', ... },  // 已过期
//   { id: '2', status: 'active', ... }    // 未过期
// ]
```

---

#### `getExpiringSoon(entitlements: LeaveEntitlement[], daysThreshold: number = 30): LeaveEntitlement[]`

**描述**: 获取即将过期的年假额度

**输入**:
- `entitlements`: 年假额度数组
- `daysThreshold`: 阈值天数 (默认 30 天)

**输出**: 即将过期的额度数组

**逻辑**:
- 筛选 `expiryDate - currentDate <= daysThreshold` 且 `status === 'active'` 的额度

---

#### `sortByExpiry(entitlements: LeaveEntitlement[]): LeaveEntitlement[]`

**描述**: 按过期日期升序排序年假额度 (用于 FIFO 扣减)

**输入**:
- `entitlements`: 年假额度数组

**输出**: 排序后的数组 (最早过期的在前)

---

## 4. StorageService

**职责**: 本地数据持久化,管理 JSON 文件和 localStorage

### 方法契约

#### `loadEmployees(): Promise<Employee[]>`

**描述**: 加载所有员工数据

**输出**: 员工数组

**数据源优先级**:
1. localStorage (快速缓存)
2. public/data/employees.json (文件)

---

#### `saveEmployees(employees: Employee[]): Promise<void>`

**描述**: 保存员工数据

**输入**:
- `employees`: 员工数组

**副作用**:
- 更新 localStorage
- 更新 JSON 文件 (通过下载或导出功能)

---

#### `loadLeaves(): Promise<LeaveData>`

**描述**: 加载所有年假相关数据

**输出**: `LeaveData` 对象

```typescript
interface LeaveData {
  entitlements: LeaveEntitlement[];
  usages: LeaveUsage[];
  adjustments: LeaveAdjustment[];
}
```

---

#### `saveLeaves(data: LeaveData): Promise<void>`

**描述**: 保存所有年假相关数据

---

#### `exportToJSON(filename: string, data: any): void`

**描述**: 导出数据为 JSON 文件 (触发浏览器下载)

**输入**:
- `filename`: 文件名 (如 "employees.json")
- `data`: 要导出的数据对象

---

#### `importFromJSON(file: File): Promise<any>`

**描述**: 从 JSON 文件导入数据

**输入**:
- `file`: 用户选择的文件对象

**输出**: 解析后的数据对象

**错误处理**:
- 如果文件格式不是 JSON,抛出 `InvalidFileFormatError`
- 如果 JSON 结构不匹配,抛出 `InvalidDataSchemaError`

---

## 5. LeaveService (聚合服务)

**职责**: 高层业务逻辑协调,组合多个底层服务

### 方法契约

#### `recordLeaveUsage(employeeId: string, usage: Omit<LeaveUsage, 'id' | 'entitlementIds' | 'createdAt'>): Promise<LeaveUsage>`

**描述**: 记录员工休假,自动扣减年假额度

**输入**:
- `employeeId`: 员工 ID
- `usage`: 休假信息 (不含 id 和 entitlementIds)

**输出**: 创建的 `LeaveUsage` 记录

**逻辑**:
1. 验证员工存在
2. 计算当前余额
3. 验证休假合法性 (余额充足、日期不冲突等)
4. 按 FIFO 规则从年假额度中扣减
5. 创建 `LeaveUsage` 记录
6. 更新对应的 `LeaveEntitlement` 记录
7. 保存数据

**错误处理**:
- 如果员工不存在,抛出 `EmployeeNotFoundError`
- 如果验证失败,抛出 `ValidationError`
- 如果余额不足,抛出 `InsufficientLeaveBalanceError`

---

#### `adjustLeave(employeeId: string, adjustment: Omit<LeaveAdjustment, 'id' | 'balanceBefore' | 'balanceAfter' | 'createdAt'>): Promise<LeaveAdjustment>`

**描述**: 手动调整员工年假额度

**输入**:
- `employeeId`: 员工 ID
- `adjustment`: 调整信息

**输出**: 创建的 `LeaveAdjustment` 记录

**逻辑**:
1. 验证员工存在
2. 计算调整前余额
3. 验证调整合法性
4. 如果是增加 (`add`),创建新的 `LeaveEntitlement` 记录
5. 如果是减少 (`deduct`),从现有额度中扣减
6. 记录调整历史
7. 保存数据

---

#### `autoGrantLeave(currentDate: Date): Promise<LeaveEntitlement[]>`

**描述**: 自动为到达周年日的员工发放年假

**输入**:
- `currentDate`: 当前日期

**输出**: 新创建的 `LeaveEntitlement` 记录数组

**逻辑**:
1. 获取所有在职员工
2. 计算每个员工的下次发放日期
3. 如果 `nextGrantDate <= currentDate`,创建新的年假额度
4. 保存数据
5. 返回新创建的记录

**调用时机**:
- 系统启动时
- 定时任务 (每天检查一次)
- 用户手动触发

---

## 错误定义

```typescript
class EmployeeNotFoundError extends Error {
  constructor(employeeId: string) {
    super(`员工不存在: ${employeeId}`);
    this.name = 'EmployeeNotFoundError';
  }
}

class InsufficientLeaveBalanceError extends Error {
  constructor(requested: number, available: number) {
    super(`年假余额不足: 申请 ${requested} 天,剩余 ${available} 天`);
    this.name = 'InsufficientLeaveBalanceError';
  }
}

class InvalidDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDateRangeError';
  }
}

class ValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(`验证失败: ${errors.join(', ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class InvalidFileFormatError extends Error {
  constructor(format: string) {
    super(`不支持的文件格式: ${format}`);
    this.name = 'InvalidFileFormatError';
  }
}

class InvalidDataSchemaError extends Error {
  constructor(message: string) {
    super(`数据结构不匹配: ${message}`);
    this.name = 'InvalidDataSchemaError';
  }
}
```

## 测试契约

所有服务方法必须有对应的单元测试,覆盖:
1. 正常路径 (happy path)
2. 边界条件 (如入职正好 6 个月、年假余额为 0)
3. 错误情况 (如余额不足、日期无效)

测试文件命名: `{ServiceName}.spec.ts`
测试框架: Vitest + TypeScript
