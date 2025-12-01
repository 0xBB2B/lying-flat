import { Employee, LeaveRecord, GrantRecord, LeaveStatus, JAPAN_LEAVE_SCHEDULE, GrantStatus, ProcessedLeaveRecord } from '../types';

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
  const allGrants: GrantStatus[] = [];

  // 1. Calculate ALL Statutory Grants (Historical & Active)
  
  const baselineDateObj = employee.baselineDate ? new Date(employee.baselineDate) : null;

  if (employee.baselineDate && employee.baselineDays !== undefined) {
    allGrants.push({
      date: employee.baselineDate,
      days: employee.baselineDays,
      remaining: employee.baselineDays, // Initialize remaining
      isBaseline: true,
      expiryDate: addYears(new Date(employee.baselineDate), 2).toISOString().split('T')[0]
    });
  }

  // Iterate to find grants up to checkDate
  for (let year = 0; year < 40; year++) {
    let grantDate: Date;
    let days: number;

    if (year === 0) {
      grantDate = addMonths(hireDate, 6);
      days = 10;
    } else {
      grantDate = addMonths(hireDate, 6 + (year * 12));
      if (year <= 5) {
         days = JAPAN_LEAVE_SCHEDULE[year]?.days || 20;
      } else {
         days = 20;
      }
    }

    if (grantDate > checkDate) break;

    // Skip if covered by baseline
    if (baselineDateObj && grantDate <= baselineDateObj) {
      continue;
    }

    allGrants.push({
      date: grantDate.toISOString().split('T')[0],
      days: days,
      remaining: days, // Initialize remaining
      isBaseline: false,
      expiryDate: addYears(grantDate, 2).toISOString().split('T')[0]
    });
  }

  // Sort grants by date
  allGrants.sort((a, b) => a.date.localeCompare(b.date));

  // 2. Calculate Usage and Deficit by replaying history
  const validUsage = records
    .filter(r => r.type === 'paid')
    .filter(r => {
      // Ignore usage before baseline if baseline exists
      if (employee.baselineDate && r.date < employee.baselineDate) return false;
      return r.date <= targetDate; 
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const history: ProcessedLeaveRecord[] = [];
  let totalDeficit = 0;

  for (const usage of validUsage) {
    let amountNeeded = usage.days;
    // totalUsed calculation is handled via active grants logic later for consistency,
    // but we track individual record status here.

    // Try to deduct from grants that were valid AT THE TIME OF USAGE
    for (const grant of allGrants) {
      if (amountNeeded <= 0) break;
      
      const isValidForUsage = usage.date >= grant.date && usage.date < grant.expiryDate;
      
      if (isValidForUsage && grant.remaining > 0) {
        const deduct = Math.min(grant.remaining, amountNeeded);
        grant.remaining -= deduct;
        amountNeeded -= deduct;
      }
    }
    
    // The remaining amountNeeded is the deficit for this specific record
    history.push({
      ...usage,
      deficitDays: amountNeeded
    });

    if (amountNeeded > 0) {
      totalDeficit += amountNeeded;
    }
  }

  // Add non-paid records to history for display, though they don't affect calculation
  const otherRecords = records
    .filter(r => r.type !== 'paid' && r.date <= targetDate)
    .map(r => ({ ...r, deficitDays: 0 }));
    
  const fullHistory = [...history, ...otherRecords].sort((a, b) => b.date.localeCompare(a.date));

  // 3. Determine Final Status for UI (Active Grants Only)
  // We filter for grants that are STILL active as of targetDate
  const activeGrants = allGrants.filter(g => g.expiryDate > targetDate);
  const totalRemaining = activeGrants.reduce((sum, g) => sum + g.remaining, 0);
  const totalActiveGranted = activeGrants.reduce((sum, g) => sum + g.days, 0);

  const usedFromActive = totalActiveGranted - totalRemaining;

  return {
    totalGranted: totalActiveGranted,
    totalUsed: usedFromActive, 
    remaining: totalRemaining,
    deficit: totalDeficit,
    grants: activeGrants,
    history: fullHistory
  };
};