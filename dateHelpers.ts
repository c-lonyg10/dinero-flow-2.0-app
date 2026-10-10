import { Bill } from './types';

export interface MonthOption {
  value: number;
  label: string;
}

export const isBillActiveInMonth = (bill: Bill, year: number, monthIdx: number): boolean => {
  const currentKeyVal = year * 12 + monthIdx;

  if (bill.startMonth) {
    const [sY, sM] = bill.startMonth.split('-').map(Number);
    if (currentKeyVal < (sY * 12 + sM)) return false;
  }

  if (bill.endMonth) {
    const [eY, eM] = bill.endMonth.split('-').map(Number);
    if (currentKeyVal > (eY * 12 + eM)) return false;
  }

  return true;
};

export const get2026MonthOptions = (): MonthOption[] => {
  const today = new Date();
  const currentMonthIdx = today.getMonth(); // 0-11
  
  // -1 is Next Month. 0 is Current Month.
  // We loop down to Jan 2026 (offset = currentMonthIdx)
  // plus an extra 2 historical months so you never hit a dead end.
  const offsets: number[] = [-1];
  for (let i = 0; i <= currentMonthIdx + 2; i++) {
    offsets.push(i);
  }

  return offsets.map(i => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: i,
      label: i === 0 ? 'Current Month' :
             i === -1 ? 'Next Month' :
             d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
  });
};