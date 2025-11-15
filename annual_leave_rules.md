# 日本年次有給休暇（年休）业务逻辑规则（AI 可读取版）

本文件以结构化、程序可解析的形式整理日本劳动基准法相关的“年次有給休暇（年休）”付与与使用规则，可作为后端代码、脚本、数据库结构、Google Sheet 自动化等系统的依据。

---

# 1. 数据模型定义（Data Models）

## 1.1 员工基础信息（Employee）

```text
Employee {
  employee_id: string
  hire_date: date                     // 入职日
  employment_type: enum("full_time", "part_time")
  weekly_work_days: int               // 每周规定工作日数
  scheduled_work_days: [date]         // 应出勤日
  actual_work_days: [date]            // 实际出勤日

  leave_records: [LeaveRecord]?       // 选填：历史请假记录
  special_suspension_periods: [Period]?  // 选填：产假、育休等
}
```

---

## 1.2 年休付与记录（AnnualLeaveGrant）

```text
AnnualLeaveGrant {
  grant_id: string
  employee_id: string
  grant_date: date            // 付与日
  days_granted: int           // 此次付与天数
  days_used: int              // 已使用天数
  expire_date: date           // grant_date + 2 years - 1 day
}
```

---

## 1.3 年休使用记录（AnnualLeaveUsage）

```text
AnnualLeaveUsage {
  usage_id: string
  employee_id: string
  grant_id: string
  date: date
  days: float                 // 可支持 0.5 等
  usage_type: enum("user_requested", "company_designated")
}
```

---

# 2. 出勤率判断逻辑（决定是否付与）

## 2.1 计算期间

第 N 次付与（N 从 1 开始）：

- 第 1 次（半年后）  
  ```
  period_start = hire_date
  period_end   = hire_date + 6 months - 1 day
  ```
- 第 2 次及以后  
  ```
  period_start = 上一次 grant_date
  period_end   = 本次理论 grant_date - 1 day
  ```

抽象函数版本：

```text
period_start(N):
  if N == 1: return hire_date
  else:      return grant_date(N-1)

period_end(N):
  return grant_date(N) - 1 day
```

---

## 2.2 出勤率公式

```text
scheduled_days = count(d in scheduled_work_days where d in period)
actual_days    = count(d in actual_work_days where d in period)

attendance_rate = actual_days / scheduled_days
```

条件：

```
attendance_rate >= 0.8 → 可付与
attendance_rate < 0.8  → 不付与
```

---

# 3. 全职员工法定年休付与逻辑

## 3.1 付与时间点（Grant Date）

```text
grant_date(1) = hire_date + 6 months
grant_date(2) = hire_date + 1.5 years
grant_date(3) = hire_date + 2.5 years
grant_date(4) = hire_date + 3.5 years
grant_date(5) = hire_date + 4.5 years
grant_date(6) = hire_date + 5.5 years
grant_date(7) = hire_date + 6.5 years
grant_date(N>=8) = hire_date + (N - 0.5) years
```

---

## 3.2 付与天数（Days Granted）

```text
full_time_granted_days(N):
  if N == 1: return 10
  if N == 2: return 11
  if N == 3: return 12
  if N == 4: return 14
  if N == 5: return 16
  if N == 6: return 18
  if N >= 7: return 20
```

---

# 4. 非全职员工（パート / アルバイト）比例付与

接口定义：

```text
part_time_granted_days(N, weekly_work_days, yearly_actual_work_days):
  return lookup_from_legal_table(...)
```

实现需依据日本厚生労働省比例付与表。

---

# 5. 年休有效期与剩余天数计算

## 5.1 有效期

```text
expire_date = grant_date + 2 years - 1 day
```

---

## 5.2 剩余天数

```text
calc_employee_remaining_days(employee_id, today):
  total = 0
  for each grant where grant.expire_date >= today:
    remaining = grant.days_granted - grant.days_used
    if remaining > 0:
      total += remaining
  return total
```

---

# 6. 年休使用（消化）逻辑

默认策略：**先用即将过期 → 如果同日，则先用最早付与的**

```text
consume_annual_leave(employee_id, usage_date, days_to_use):

  grants = all grants where expire_date >= usage_date
                           and (days_granted > days_used)

  sort grants by (expire_date ASC, grant_date ASC)

  remaining = days_to_use

  for grant in grants:
    available = grant.days_granted - grant.days_used
    use_here = min(available, remaining)

    create AnnualLeaveUsage( ... )

    grant.days_used += use_here
    remaining -= use_here

    if remaining == 0:
      return OK

  return INSUFFICIENT_DAYS
```

---

# 7. 年休5日取得义务（公司强制义务）

## 7.1 判断期间

```
period = [grant_date(N), grant_date(N+1) - 1 day]
如果 N+1 次付与日 > today，则用 today 代替 period_end
```

---

## 7.2 当年度取得天数

```text
calc_acquired_days_in_period(employee_id, start, end):
  total = 0
  for usage where date between [start, end]:
    total += usage.days
  return total
```

---

## 7.3 是否达标

```text
check_5days_obligation:
  return calc >= 5
```

---

# 8. 综合流程示例：自动生成全部年休付与记录

```text
generate_annual_leave_grants(employee, today):

  if employee is not full-time:
    return []

  grants = []
  N = 1

  while true:
    theoretical_date = calc_grant_date(hire_date, N)

    if theoretical_date > today:
      break

    period_start = (N==1)? hire_date : grants[N-2].grant_date
    period_end = theoretical_date - 1 day

    attendance = calc_attendance_rate(employee, period_start, period_end)

    if attendance >= 0.8:
      grant = AnnualLeaveGrant {
        grant_id: new_id(),
        grant_date: theoretical_date,
        days_granted: full_time_granted_days(N),
        days_used: 0,
        expire_date: theoretical_date + 2 years - 1 day
      }
      append grant

    N += 1

  return grants
```

---

# 结束

本 Markdown 文档适合以下用途：

- 直接作为 AI 模型输入来“生成代码”
- 作为后端系统设计规范（Go / Python / TypeScript）
- 转换为 Google Sheet 公式自动计算逻辑
- 作为 HR 工具 / 年休系统的技术文档
