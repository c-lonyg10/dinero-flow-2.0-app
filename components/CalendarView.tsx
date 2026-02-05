import React from 'react';
import { AppData, Bill } from '../types';
import { Plus, ChevronDown, Home, CheckCircle2, Clock } from 'lucide-react';

interface CalendarViewProps {
  data: AppData;
  onOpenBillModal: (bill?: Bill) => void;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  // Rent Props added here
  onUpdateRent: (amount: number) => void;
  onTogglePaid: (id: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  data, 
  onOpenBillModal, 
  monthOffset, 
  setMonthOffset,
  onUpdateRent,
  onTogglePaid
}) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthOffset); 
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const todayDateObj = new Date();
  const isCurrentMonth = todayDateObj.getMonth() === month && todayDateObj.getFullYear() === year;
  const today = isCurrentMonth ? todayDateObj.getDate() : -1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStart = Array.from({ length: firstDay }, (_, i) => i);

  // Payday logic
  const refDate = new Date(2026, 0, 9);
  const isPayday = (day: number) => {
    const current = new Date(year, month, day);
    const diffDays = Math.ceil((current.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays % 14 === 0;
  };

  const monthKey = `${year}-${month}`;

  // --- RENT LOGIC (Migrated from RentView) ---
  const totalRent = data.budget.rentTotal || 0;
  const wave2Base = 600.00; 
  const wave2Fee = wave2Base * 0.01; 
  const wave2Total = wave2Base + wave2Fee; 
  
  let wave1Base = 0; 
  if (totalRent > wave2Base) { 
      wave1Base = totalRent - 600; 
  }
  const wave1Fee = wave1Base * 0.01; 
  const wave1Total = wave1Base + wave1Fee;
  const annaWave1 = Math.max(0, wave1Total - 500);

  const bill1 = data.bills.find(b => b.id === 1); // Flex Rent
  const bill2 = data.bills.find(b => b.id === 9); // Flex Finance (Wave 2)
  const isWave1Paid = bill1?.manualPaid?.includes(monthKey);
  const isWave2Paid = bill2?.manualPaid?.includes(monthKey);
  // ------------------------------------------

  // Month Dropdown
  const monthOptions = [-1, 0, 1, 2, 3, 4, 5].map(i => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
          value: i,
          label: i === 0 ? 'Current Month' :
                 i === -1 ? 'Next Month' :
                 d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
  });
  
  // Bill Status Logic
  const getBillStatus = (bill: Bill, day: number) => {
      const isManualPaid = bill.manualPaid?.includes(monthKey);
      let isAutoPaid = false; // Simplified for visual clarity

      const isPaid = isManualPaid || isAutoPaid;
      
      if (isPaid) return 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30';
      if (monthOffset > 0 || (isCurrentMonth && day < today)) return 'bg-red-900/40 text-red-300 border-red-500/30';
      return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="h-[100dvh] flex flex-col box-border pb-24 overflow-hidden">
      {/* Header (Fixed) */}
      <div className="sticky top-0 z-50 bg-black pt-4 px-1 pb-4 flex justify-between items-center border-b border-neutral-900">
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

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pt-4 pb-10" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* 1. CALENDAR GRID */}
          <div className="bg-[#171717] rounded-3xl overflow-hidden p-1 shadow-xl border border-[#262626]">
            <div className="grid grid-cols-7 gap-px bg-[#262626] border border-[#262626] rounded-t-xl overflow-hidden">
              {['S','M','T','W','T','F','S'].map(d => (
                <div key={d} className="bg-[#171717] py-3 text-center text-xs font-bold text-[#737373]">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-[#262626] border-x border-b border-[#262626] rounded-b-xl overflow-hidden mt-1">
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

          {/* 2. RENT CONTROL SECTION */}
          <div className="space-y-4 px-1">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Home className="text-cyan-500" size={24} /> Rent Control
              </h2>

              <div className="bg-[#171717] border border-[#262626] p-5 rounded-3xl shadow-lg">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Total Rent Bill</label>
                  <input 
                      type="number" 
                      value={totalRent || ''} 
                      onChange={(e) => onUpdateRent(parseFloat(e.target.value) || 0)}
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-4 text-3xl font-black text-cyan-400 focus:border-neutral-500 focus:outline-none transition-colors" 
                      placeholder="0.00" 
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wave 1 */}
                  <div className="p-5 bg-[#171717] border border-[#262626] rounded-2xl relative overflow-hidden transition-all hover:border-neutral-700 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-white">Wave 1</h3>
                          <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">Variable</span>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2">
                          {wave1Total > 0 ? `$${wave1Total.toFixed(2)}` : '--'}
                      </h2>
                      <div className="flex justify-between text-xs text-neutral-400 mb-3 font-medium">
                          <span>Carlos: $500</span>
                          <span className="text-cyan-400 font-bold">{annaWave1 > 0 ? `Anna: $${annaWave1.toFixed(2)}` : 'Anna: --'}</span>
                      </div>
                      
                      {bill1 ? (
                          <button 
                              onClick={() => onTogglePaid(1)}
                              className={`w-full p-2 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${isWave1Paid 
                                  ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]' 
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-800'}`}
                          >
                              {isWave1Paid ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                              {isWave1Paid ? 'PAID' : 'PENDING'}
                          </button>
                      ) : (
                          <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-center font-bold text-neutral-500 text-xs uppercase">
                              Bill Missing (ID:1)
                          </div>
                      )}
                  </div>

                  {/* Wave 2 */}
                  <div className="p-5 bg-[#171717] border border-[#262626] rounded-2xl transition-all hover:border-neutral-700 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-white">Wave 2</h3>
                          <span className="text-[10px] bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-500/20">Fixed</span>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2">${wave2Total.toFixed(2)}</h2>
                      <div className="flex justify-between text-xs text-neutral-400 mb-3 font-medium">
                          <span>Carlos: $400</span>
                          <span className="text-purple-400 font-bold">Anna: ${(wave2Total - 400).toFixed(2)}</span>
                      </div>
                      
                      {bill2 ? (
                           <button 
                              onClick={() => onTogglePaid(9)}
                              className={`w-full p-2 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${isWave2Paid 
                                  ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]' 
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-800'}`}
                          >
                              {isWave2Paid ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                              {isWave2Paid ? 'PAID' : 'PENDING'}
                          </button>
                      ) : (
                          <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-center font-bold text-neutral-500 text-xs uppercase">
                               Bill Missing (ID:9)
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default CalendarView;