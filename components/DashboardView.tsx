import React from 'react';
import { AppData } from '../types';
import { Wallet, Briefcase, Flag, Timer, Infinity as InfinityIcon, ChevronRight, Utensils, Sword, PlusCircle, PartyPopper } from 'lucide-react';

interface DashboardViewProps {
  data: AppData;
  onSwitchTab: (tab: any) => void;
  onOpenTxModal: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ data, onSwitchTab, onOpenTxModal }) => {
  const currentMonth = new Date();
  
  // Calculate Balance
  const totalTx = data.transactions.reduce((acc, t) => acc + t.a, 0);
  const balance = (data.budget.startingBalance || 0) + totalTx;

  // Calculate Income
  const monthTx = data.transactions.filter(t => {
    const d = new Date(t.d);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });
  const gigIncome = monthTx
    .filter(t => t.a > 0 && !t.t.toLowerCase().includes('elevate') && !t.t.toLowerCase().includes('payroll'))
    .reduce((s, t) => s + t.a, 0);

  // Bill Stats
  const today = currentMonth.getDate();
  const dayBills = data.bills.filter(b => b.day === today);
  const dayTotal = dayBills.reduce((acc, b) => acc + b.amount, 0);
  const monthTotal = data.bills.reduce((acc, b) => acc + b.amount, 0);
  
  const firstDayOfWeek = today - currentMonth.getDay();
  const lastDayOfWeek = firstDayOfWeek + 6;
  const weekBills = data.bills.filter(b => b.day >= firstDayOfWeek && b.day <= lastDayOfWeek);
  const weekTotal = weekBills.reduce((acc, b) => acc + b.amount, 0);

  // Next Bill
  const sortedBills = [...data.bills].sort((a, b) => a.day - b.day);
  const nextBill = sortedBills.find(b => b.day >= today) || sortedBills[0];

  // Spending
  const dining = monthTx.filter(t => t.c === "Dining").reduce((s, t) => s + Math.abs(t.a), 0);
  const groceries = monthTx.filter(t => t.c === "Groceries").reduce((s, t) => s + Math.abs(t.a), 0);
  const foodTotal = dining + groceries;

  // Fun Spending
  const funTotal = monthTx.filter(t => t.c === "For Fun").reduce((s, t) => s + Math.abs(t.a), 0);

  // Debt Countdown
  const freedomDate = new Date("2026-05-01");
  const monthsLeft = Math.max(0, (freedomDate.getFullYear() - currentMonth.getFullYear()) * 12 + (freedomDate.getMonth() - currentMonth.getMonth()));

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Balance Card */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-neutral-900 to-emerald-950/30 border border-emerald-900/30 shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Wallet size={96} className="text-emerald-500" />
        </div>
        <div className="relative z-10">
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Estimated Balance</p>
          <h2 className="text-5xl font-black text-white tracking-tight break-words">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-neutral-500 mt-2 font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      
      {/* Fun Bubble - Interactive */}
      <div className="flex justify-center">
        <button 
          onClick={() => onSwitchTab('fun')}
          className="relative group bg-gradient-to-br from-pink-600 to-purple-700 p-1 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-transform active:scale-95 hover:scale-105"
        >
          <div className="bg-black/20 w-32 h-32 rounded-full flex flex-col items-center justify-center backdrop-blur-sm border border-white/20">
             <PartyPopper className="text-white mb-1 drop-shadow-md" size={24} />
             <span className="text-[10px] text-pink-200 font-bold uppercase tracking-wider">For Fun</span>
             <span className="text-xl font-black text-white drop-shadow-md">${funTotal.toFixed(0)}</span>
          </div>
          {/* Shine effect */}
          <div className="absolute top-2 right-4 w-6 h-3 bg-white/20 rounded-full rotate-[-45deg] blur-sm"></div>
        </button>
      </div>

      {/* Income Stats */}
      <div className="bg-[#171717] border border-[#262626] p-5 rounded-3xl flex justify-between items-center shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={18} className="text-emerald-400" />
            <span className="text-xs text-neutral-400 uppercase font-bold">Fixed</span>
          </div>
          <h3 className="text-xl font-bold text-white">${data.budget.avgIncome.toFixed(2)}</h3>
        </div>
        <div className="w-px h-10 bg-neutral-800"></div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-2">
            <span className="text-xs text-neutral-400 uppercase font-bold">Gigs & P2P</span>
            <Wallet size={18} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">${gigIncome.toFixed(2)}</h3>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', icon: <Flag size={24} className="text-blue-300" />, val: dayTotal, color: 'blue' },
          { label: 'Week', icon: <Timer size={24} className="text-blue-300" />, val: weekTotal, color: 'blue' },
          { label: 'Month', icon: <InfinityIcon size={24} className="text-yellow-400" />, val: monthTotal, color: 'yellow', border: true }
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={() => onSwitchTab('calendar')}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-transform active:scale-95 bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-800/30 ${s.border ? 'border-yellow-500/50 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]' : ''}`}
          >
            <div className="mb-1">{s.icon}</div>
            <p className={`text-[9px] font-bold uppercase tracking-widest text-${s.color}-300`}>{s.label}</p>
            <h3 className="text-lg font-black text-white">${s.val.toFixed(0)}</h3>
          </div>
        ))}
      </div>

      {/* Next Bill */}
      <div onClick={() => onSwitchTab('calendar')} className="bg-[#171717] border border-[#262626] p-5 rounded-3xl flex items-center justify-between cursor-pointer active:bg-neutral-800 transition-colors">
        <div>
          <p className="text-xs text-neutral-500 font-bold uppercase mb-2">Next Bill</p>
          {nextBill ? (
            <div className="flex items-center gap-3">
              <div className="bg-blue-900/30 text-blue-400 rounded-lg h-10 w-10 flex flex-col items-center justify-center font-bold text-sm border border-blue-500/20">
                <span>{nextBill.day}</span>
              </div>
              <div>
                <p className="font-bold text-white leading-tight">{nextBill.name}</p>
                <p className="text-xs text-neutral-400">${nextBill.amount}</p>
              </div>
            </div>
          ) : (
            <div className="text-white font-bold">No upcoming bills</div>
          )}
        </div>
        <ChevronRight className="text-neutral-600" />
      </div>

      {/* Spending Preview */}
      <div onClick={() => onSwitchTab('spending')} className="bg-[#171717] border border-[#262626] p-5 rounded-3xl flex items-center justify-between cursor-pointer active:bg-neutral-800 transition-colors">
        <div>
          <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Food Spent</p>
          <h3 className="text-2xl font-black text-white">${foodTotal.toFixed(0)}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-red-400 font-bold">Dining ${dining.toFixed(0)}</p>
          <p className="text-xs text-emerald-400 font-bold">Grocery ${groceries.toFixed(0)}</p>
        </div>
      </div>

      {/* Debt Countdown */}
      <div onClick={() => onSwitchTab('debt')} className="bg-[#171717] border border-blue-900/30 p-5 rounded-3xl flex items-center justify-between cursor-pointer active:bg-neutral-800 transition-colors">
        <div>
          <p className="text-xs text-blue-400 font-bold uppercase mb-1">Freedom Countdown</p>
          <h3 className="text-3xl font-black text-white">{monthsLeft}</h3>
          <p className="text-[10px] text-neutral-500">months remaining</p>
        </div>
        <Sword size={32} className="text-blue-500" />
      </div>

      <button onClick={onOpenTxModal} className="w-full bg-white text-black py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg active:scale-95 transition-transform">
        <PlusCircle size={24} /> Add Transaction
      </button>
    </div>
  );
};

export default DashboardView;