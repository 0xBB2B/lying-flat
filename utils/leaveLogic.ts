import { Employee, LeaveRecord, GrantRecord, LeaveStatus, JAPAN_LEAVE_SCHEDULE } from '../types';

// Helper to add months to a date
const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// Helper to add years
const addYears = (date: Date, years: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

export const calculateLeaveStatus = (
  employee: Employee, 
  records: LeaveRecord[], 
  targetDate: string = new Date().toISOString().split('T')[0]
): LeaveStatus => {
  const hireDate = new Date(employee.hireDate);
  const checkDate = new Date(targetDate);
  const grants: GrantRecord[] = [];

  // 1. Calculate Statutory Grants based on Hire Date
  // In Japan, leave expires 2 years after it is granted.
  
  // If baseline is set, we ignore statutory grants before the baseline date
  // and treat the baseline as a "grant" on that date (expiring in 2 years usually, 
  // but for safety/flexibility we assume standard 2 year expiry from baseline date for simplicity, 
  // or user should set baseline date to the oldest valid grant date).
  // Standard practice for migration: The 'baseline' represents the pool of valid days at that moment.
  
  const baselineDateObj = employee.baselineDate ? new Date(employee.baselineDate) : null;

  if (employee.baselineDate && employee.baselineDays !== undefined) {
    grants.push({
      date: employee.baselineDate,
      days: employee.baselineDays,
      isBaseline: true,
      expiryDate: addYears(new Date(employee.baselineDate), 2).toISOString().split('T')[0]
    });
  }

  // Iterate through the schedule to find all grants that have occurred up to checkDate
  // We go up to 20 years just to be safe
  for (let year = 0; year < 40; year++) {
    // 6 months (0.5), 1.5, 2.5 ...
    // The schedule logic:
    // 0.5 year mark -> 10 days
    // 1.5 year mark -> 11 days
    // ...
    // 6.5 year mark -> 20 days
    // 7.5 year mark -> 20 days...
    
    let grantDate: Date;
    let days: number;

    if (year === 0) {
      grantDate = addMonths(hireDate, 6);
      days = 10;
    } else {
      grantDate = addMonths(hireDate, 6 + (year * 12));
      // Determine days based on years of service
      if (year <= 5) {
         // indices in JAPAN_LEAVE_SCHEDULE: 0 is 0.5yr. 1 is 1.5yr.
         // year 1 (1.5yr) matches index 1.
         days = JAPAN_LEAVE_SCHEDULE[year]?.days || 20;
      } else {
         days = 20;
      }
    }

    // Stop generating if future
    if (grantDate > checkDate) break;

    // Logic: If we have a baseline, skip any statutory grant that happened BEFORE or ON the baseline date.
    // The baseline supersedes history.
    if (baselineDateObj && grantDate <= baselineDateObj) {
      continue;
    }

    grants.push({
      date: grantDate.toISOString().split('T')[0],
      days: days,
      isBaseline: false,
      expiryDate: addYears(grantDate, 2).toISOString().split('T')[0]
    });
  }

  // 2. Filter out grants that have already expired relative to checkDate
  const activeGrants = grants.filter(g => g.expiryDate > targetDate).sort((a, b) => a.date.localeCompare(b.date));

  // 3. Calculate usage
  // Usage logic: Leave is deducted from the oldest valid grant first (FIFO).
  // We only count usage that happened AFTER the baseline date (if exists), because baseline assumes usage prior was accounted for.
  // BUT, we must also consider the validity window.
  
  const validUsage = records
    .filter(r => r.type === 'paid')
    .filter(r => {
      // If baseline exists, only count usage after baseline date
      if (employee.baselineDate && r.date < employee.baselineDate) return false;
      return r.date <= targetDate; 
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalUsed = 0;
  let remainingGrants = activeGrants.map(g => ({ ...g, remaining: g.days }));

  // Simulate consumption
  for (const usage of validUsage) {
    let amountNeeded = usage.days;
    totalUsed += amountNeeded;

    // Find oldest grant that is valid at the time of usage
    // Note: The usage date must be < grant.expiryDate AND usage date >= grant.date
    for (const grant of remainingGrants) {
      if (amountNeeded <= 0) break;
      
      const isValidForUsage = usage.date >= grant.date && usage.date < grant.expiryDate;
      
      if (isValidForUsage && grant.remaining > 0) {
        const deduct = Math.min(grant.remaining, amountNeeded);
        grant.remaining -= deduct;
        amountNeeded -= deduct;
      }
    }
    // If amountNeeded > 0 here, it means they took leave without having balance (Negative balance / Unpaid implicit)
  }

  const totalRemaining = remainingGrants.reduce((sum, g) => sum + g.remaining, 0);

  return {
    totalGranted: activeGrants.reduce((sum, g) => sum + g.days, 0),
    totalUsed: totalUsed,
    remaining: totalRemaining, // Can be negative if logic allowed, but usually floors at 0 or shows deficit
    grants: remainingGrants
  };
};