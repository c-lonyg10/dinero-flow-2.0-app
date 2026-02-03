import React, { useMemo } from 'react';
import { AppData } from '../types';
import { ArrowLeft, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CategoriesViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onBack: () => void;
  onOpenYear: () => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ data, monthOffset, setMonthOffset, onBack, onOpenYear }) => {
  // Date Logic
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() - monthOffset);
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter transactions for selected month
  const monthTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  // 1. Calculate Category Rings Data
  const categories = useMemo(() => {
      const totals: Record<string, number> = {};
      let totalSpent = 0;
      let totalIncome = 0;

      monthTx.forEach(t => {
          if (t.a < 0 && t.c !== 'Income' && t.c !== 'Other') {
              const val = Math.abs(t.a);
              totals[t.c] = (totals[t.c] || 0) + val;
              totalSpent += val;
          }
          if (t.a > 0) totalIncome += t.a;
      });

      // Sort by highest spend
      return Object.entries(totals)
          .map(([name, value]) => ({ 
              name, 
              value, 
              percent: totalIncome > 0 ? (value / totalIncome) * 100 : 0 
          }))
          .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  // 2. Calculate 3-Month Trend Data (Income vs Fixed vs Fun)
  const trendData = [2, 1, 0].map(offset => {
      const d = new Date();
      d.setMonth(d.getMonth() - offset);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const txs = data.transactions.filter(t => {
          const td = new Date(t.d);
          return td.getMonth() === m && td.getFullYear() === y;
      });

      const income = txs.filter(t => t.a > 0).reduce((sum, t) => sum + t.a, 0);
      
      // Fixed = Rent, Bills, Debt
      const fixed = txs.filter(t => t.a < 0 && ['Rent', 'Bills', 'Debt'].includes(t.c)).reduce((sum, t) => sum + Math.abs(t.a), 0);
      
      // Fun = Everything else (Dining, Shopping, etc)
      const fun = txs.filter(t => t.a < 0 && !['Rent', 'Bills', 'Debt', 'Income', 'Other'].includes(t.c)).reduce((sum, t) => sum + Math.abs(t.a), 0);

      return { 
          name: d.toLocaleDateString('en-US', { month: 'short' }), 
          Income: income,
          Fixed: fixed,
          Fun: fun
      };
  });

  // Helper for Ring Color
  const getRingColor = (cat: string) => {
      switch(cat) {
          case 'Rent': return '#06b6d4'; // Cyan
          case 'Bills': return '#ec4899'; // Pink
          case 'Debt': return '#ef4444'; // Red
          case 'Dining': return '#f97316'; // Orange
          case 'Groceries': return '#10b981'; // Emerald
          case 'Music Gear': return '#3b82f6'; // Blue
          case 'Fun': return '#a855f7'; // Purple
          default: return '#6366f1'; // Indigo
      }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in min-h-[100dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 pt-4 px-1 shrink-0">
            <button onClick={onBack} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white">Categories</h2>
        </div>

        {/* Month Selector */}
        <div className="shrink-0 flex items-center justify-between bg-[#171717] p-2 rounded-2xl border border-[#262626]">
            <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-2 text-neutral-400 hover:text-white"><ArrowLeft size={18}/></button>
            <span className="font-bold text-sm text-white">{monthLabel}</span>
            <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-2 text-neutral-400 hover:text-white"><ArrowRight size={18}/></button>
        </div>

        {/* RINGS GRID (The "Command Center" Look) */}
        <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
                const color = getRingColor(cat.name);
                const radius = 30;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (Math.min(cat.percent, 100) / 100) * circumference;

                return (
                    <div key={cat.name} className="bg-[#171717] border border-[#262626] p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                        {/* Ring SVG */}
                        <div className="relative w-20 h-20 mb-2">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                {/* Background Circle */}
                                <circle cx="40" cy="40" r={radius} stroke="#262626" strokeWidth="6" fill="none" />
                                {/* Progress Circle */}
                                <circle 
                                    cx="40" cy="40" r={radius} 
                                    stroke={color} 
                                    strokeWidth="6" 
                                    fill="none" 
                                    strokeDasharray={circumference} 
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            {/* Percentage in Middle */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{cat.percent.toFixed(0)}%</span>
                            </div>
                        </div>
                        
                        {/* Labels */}
                        <h4 className="text-xs font-bold text-neutral-400 uppercase truncate max-w-full">{cat.name}</h4>
                        <p className="text-lg font-black text-white">${cat.value.toFixed(0)}</p>
                    </div>
                );
            })}
             {categories.length === 0 && (
                <div className="col-span-2 py-8 text-center text-neutral-500 text-xs">No spending this month</div>
            )}
        </div>

        {/* 3-MONTH BAR GRAPH (Income vs Fixed vs Fun) */}
        <div className="bg-[#171717] border border-[#262626] p-5 rounded-3xl shadow-lg">
            <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400"/> 3-Month Trend
            </h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                        <Tooltip cursor={{fill: '#262626'}} contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: 'none' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Fixed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Fun" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* GOLD BUTTON (Year Review) */}
        <div className="px-1 pb-6">
            <button 
                onClick={onOpenYear}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20 active:scale-95 transition-transform"
            >
                <span className="text-white font-black uppercase tracking-wider text-sm">View 2026 Year in Review</span>
                <ArrowRight className="text-yellow-200" size={18} />
            </button>
        </div>
    </div>
  );
};

export default CategoriesView;