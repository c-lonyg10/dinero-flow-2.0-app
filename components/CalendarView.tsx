import React from 'react';
import { AppData, Bill } from '../types';
import { Plus, ChevronDown } from 'lucide-react';

interface CalendarViewProps {
  data: AppData;
  onOpenBillModal: (bill?: Bill) => void;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ data, onOpenBillModal, monthOffset, setMonthOffset }) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthOffset); // Adjust date by offset
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const todayDateObj = new Date();
  const isCurrentMonth = todayDateObj.getMonth() === month && todayDateObj.getFullYear() === year;
  const today = isCurrentMonth ? todayDateObj.getDate() : -1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  // Create days array
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStart = Array.from({ length: firstDay }, (_, i) => i);

  // Payday logic (every 14 days from reference)
  const refDate = new Date(2026, 0, 9);
  const isPayday = (day: number) => {
    const current = new Date(year, month, day);
    const diffDays = Math.ceil((current.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays % 14 === 0;
  };

  const monthKey = `${year}-${month}`;

  // Filter transactions for the current viewing month to check for payments
  const monthTransactions = data.transactions.filter(t => {
      const tDate = new Date(t.d);
      return tDate.getMonth() === month && tDate.getFullYear() === year;
  });
  
  // Month Dropdown Options
  const monthOptions = [-1, 0, 1, 2, 3].map(i => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
          value: i,
          label: i === 0 ? 'Current Month' :
                 i === -1 ? 'Next Month' :
                 d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
  });
  
  const getBillStatus = (bill: Bill, day: number) => {
      const isManualPaid = bill.manualPaid?.includes(monthKey);
      
      // Auto-Detect Payment Logic
      let isAutoPaid = false;

      // Special Rules for Flex Rent (ID 1 = 500, ID 9 = 400)
      if (bill.id === 1) { // Flex Rent (Wave 1)
          isAutoPaid = monthTransactions.some(t => t.c === 'Rent' && Math.abs(t.a) === 500);
      } else if (bill.id === 9) { // Flex Finance (Wave 2)
          isAutoPaid = monthTransactions.some(t => t.c === 'Rent' && Math.abs(t.a) === 400);
      } else {
          // General Matching: Look for exact amount match or name match
          isAutoPaid = monthTransactions.some(t => {
              // 1. Amount match (approximate to handle small fees, but usually bills are exact)
              const amountMatch = Math.abs(Math.abs(t.a) - bill.amount) < 0.1;
              
              // 2. Name match (Fuzzy)
              // Clean bill name (remove common words)
              const cleanBillName = bill.name.toLowerCase().replace('bundle','').replace('premium','').trim().split(' ')[0]; 
              const descMatch = t.t.toLowerCase().includes(cleanBillName);

              return (amountMatch && (t.c === 'Bills' || t.c === 'Debt' || t.c === 'Rent' || t.c === 'Other')) || 
                     (descMatch && (t.c === 'Bills' || t.c === 'Debt'));
          });
      }

      const isPaid = isManualPaid || isAutoPaid;
      
      // Determine color
      if (isPaid) return 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30';
      // If it's the past (in current month) or any past month (monthOffset > 0), unpaid bills are red
      if (monthOffset > 0 || (isCurrentMonth && day < today)) return 'bg-red-900/40 text-red-300 border-red-500/30';
      // Future
      return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div className="relative z-20">
             <select 
                value={monthOffset}
                onChange={(e) => setMonthOffset(Number(e.target.value))}
                className="appearance-none bg-transparent text-2xl font-bold text-white pr-8 outline-none cursor-pointer hover:opacity-80 transition-opacity"
            >
                {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="text-black text-sm">{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>

        <button onClick={() => onOpenBillModal()} className="p-2 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors">
          <Plus size={24} />
        </button>
      </div>

      <div className="bg-[#171717] rounded-3xl overflow-hidden p-1 flex-1 flex flex-col shadow-xl">
        {/* Header Row */}
        <div className="grid grid-cols-7 gap-px bg-[#262626] border border-[#262626] rounded-t-xl overflow-hidden">
          {['S','M','T','W','T','F','S'].map(d => (
            <div key={d} className="bg-[#171717] py-3 text-center text-xs font-bold text-[#737373]">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-[#262626] border-x border-b border-[#262626] rounded-b-xl overflow-hidden mt-1 flex-1 auto-rows-fr">
          {emptyStart.map(i => (
            <div key={`empty-${i}`} className="bg-black/50 min-h-[80px]"></div>
          ))}
          
          {days.map(day => {
             const dayBills = data.bills.filter(b => b.day === day);
             const payday = isPayday(day);

             return (
              <div key={day} className="bg-[#0a0a0a] min-h-[80px] p-1 flex flex-col relative transition-colors hover:bg-neutral-900">
                <span className={`text-[10px] font-bold mb-1 ${day === today ? 'text-white bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center' : 'text-neutral-600'}`}>
                  {day}
                </span>
                
                <div className="flex-1 w-full flex flex-col gap-1 overflow-hidden">
                   {dayBills.map(bill => (
                     <div 
                        key={bill.id} 
                        onClick={() => onOpenBillModal(bill)}
                        className={`text-[9px] px-1 py-0.5 rounded border w-full truncate cursor-pointer transition-opacity hover:opacity-80 ${getBillStatus(bill, day)}`}
                     >
                        {bill.name}
                     </div>
                   ))}
                   {payday && (
                     <div className="text-[9px] px-1 py-0.5 rounded border w-full truncate bg-purple-900/20 text-purple-300 border-purple-500/30 font-bold">
                       Payday
                     </div>
                   )}
                </div>
              </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;