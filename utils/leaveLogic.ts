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
  
  const hasBaseline = !!(employee.baselineDate && employee.baselineDays !== undefined);
  const baselineDateObj = employee.baselineDate ? new Date(employee.baselineDate) : null;

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

    allGrants.push({
      date: grantDate.toISOString().split('T')[0],
      days: days,
      remaining: days, // Initialize remaining
      isBaseline: false,
      expiryDate: addYears(grantDate, 2).toISOString().split('T')[0]
    });
  }

  // Apply Baseline Logic: Distribute baselineDays into historical grants
  if (hasBaseline && baselineDateObj && employee.baselineDays !== undefined) {
    let remainingBaseline = employee.baselineDays;
    
    // Sort grants by date descending to prioritize most recent grants (LIFO for remaining balance)
    // We want to fill the "remaining" bucket of the most recent valid grants first
    const grantsToCheck = [...allGrants].sort((a, b) => b.date.localeCompare(a.date));

    for (const grant of grantsToCheck) {
      const grantDate = new Date(grant.date);
      const expiryDate = new Date(grant.expiryDate);

      // Check if this grant was active on the baseline date
      if (grantDate <= baselineDateObj && baselineDateObj < expiryDate) {
        if (remainingBaseline > 0) {
          // This grant contributes to the baseline
          const amountToKeep = Math.min(grant.days, remainingBaseline);
          grant.remaining = amountToKeep;
          remainingBaseline -= amountToKeep;
        } else {
          // This grant is older than the baseline balance covers, so it's effectively used up
          grant.remaining = 0;
        }
      } else if (grantDate > baselineDateObj) {
        // Grants after baseline date are untouched (they are new accruals)
        continue;
      } else {
        // Grants expired before baseline date should be 0
        grant.remaining = 0;
      }
    }

    // If there is still baseline remaining (overflow), create a carryover grant
    if (remainingBaseline > 0) {
       allGrants.push({
        date: employee.baselineDate!,
        days: remainingBaseline, // Just the overflow amount
        remaining: remainingBaseline,
        isBaseline: true,
        expiryDate: addYears(new Date(employee.baselineDate!), 2).toISOString().split('T')[0]
      });
    }
  }

  // Sort grants by date
  allGrants.sort((a, b) => a.date.localeCompare(b.date));

  // 2. Calculate Usage and Deficit by replaying history
  const validUsage = records
    .filter(r => r.type === 'paid')
    .sort((a, b) => a.date.localeCompare(b.date));

  const history: ProcessedLeaveRecord[] = [];
  let totalDeficit = 0;

  for (const usage of validUsage) {
    // If usage is before baseline, just add it to history as "historical" (no deficit calc needed)
    if (employee.baselineDate && usage.date < employee.baselineDate) {
        history.push({
            ...usage,
            deficitDays: 0 // Not counted as deficit, just historical record
        });
        continue;
    }

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
    .filter(r => r.type !== 'paid')
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