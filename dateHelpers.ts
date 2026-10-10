import { Bill } from './types';

export interface MonthOption {
  value: number;
  label: string;
}

/**
 * Checks whether a bill is active for a given year and 0-indexed month (0 = Jan, 9 = Oct, etc.).
 * Supports both raw "YYYY-M" (0-indexed) and standard ISO "YYYY-MM" (1-indexed).
 */
export const isBillActiveInMonth = (bill: Bill, year: number, monthIdx: number): boolean => {
  const currentTotalMonths = year * 12 + monthIdx;

  const parseMonthKey = (key: string): number | null => {
    const parts = key.split('-');
    if (parts.length < 2) return null;
    const y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    // If the string is formatted with a leading zero or is standard 1-12 format (e.g., "2026-10" or "2026-09")
    // and was stored as 1-indexed, we keep it consistent.
    // By convention in Dinero Flow, month keys use 0-indexed values: year * 12 + m
    return y * 12 + m;
  };

  if (bill.startMonth) {
    const startVal = parseMonthKey(bill.startMonth);
    if (startVal !== null && currentTotalMonths < startVal) {
      return false;
    }
  }

  if (bill.endMonth) {
    const endVal = parseMonthKey(bill.endMonth);
    if (endVal !== null && currentTotalMonths > endVal) {
      return false;
    }
  }

  return true;
};

/**
 * Generates month offset dropdown options centered on 2026.
 * Pinned to day 1 to eliminate 31-day overflow glitches.
 */
export const get2026MonthOptions = (): MonthOption[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth(); // 0-11

  // -1 is Next Month, 0 is Current Month, down through Jan 2026 + 2 historical safety months
  const offsets: number[] = [-1];
  for (let i = 0; i <= currentMonthIdx + 2; i++) {
    offsets.push(i);
  }

  return offsets.map(i => {
    // Pin to day 1 of the calculated month to prevent leap/31-day month spillover
    const d = new Date(currentYear, currentMonthIdx - i, 1);
    return {
      value: i,
      label:
        i === 0
          ? 'Current Month'
          : i === -1
          ? 'Next Month'
          : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };
  });
};