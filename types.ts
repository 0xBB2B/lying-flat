export interface Employee {
  id: string;
  name: string;
  department?: string;
  hireDate: string; // ISO Date string YYYY-MM-DD
  
  // For migrating existing data:
  baselineDate?: string; // The date at which the manual balance is effective
  baselineDays?: number; // How many days they had remaining on that date
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  date: string; // ISO Date string YYYY-MM-DD
  days: number; // 1 for full day, 0.5 for half day
  type: 'paid' | 'unpaid' | 'special'; // Focus is on 'paid' (Yukyu)
  note?: string;
}

export interface GrantRecord {
  date: string;
  days: number;
  isBaseline: boolean;
  expiryDate: string;
}

export interface GrantStatus extends GrantRecord {
  remaining: number;
}

export interface LeaveStatus {
  totalGranted: number; // Total valid grants currently active
  totalUsed: number;    // Total used from active grants
  remaining: number;    // The bottom line
  grants: GrantStatus[]; // Detail of active grants
}

export const JAPAN_LEAVE_SCHEDULE = [
  { months: 6, days: 10 },
  { months: 18, days: 11 },
  { months: 30, days: 12 },
  { months: 42, days: 14 },
  { months: 54, days: 16 },
  { months: 66, days: 18 },
  { months: 78, days: 20 }, // 6.5 years and beyond
];