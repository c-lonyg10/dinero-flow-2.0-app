import React, { useMemo } from 'react';
import { AppData } from '../types';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis } from 'recharts';

interface CategoriesViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onBack: () => void;
  onOpenYear: () => void; // NEW PROP
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ data, monthOffset, setMonthOffset, onBack, onOpenYear }) => {
  // Date Logic
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() - monthOffset);
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter transactions
  const monthTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  // Calculate Totals by Category
  const catTotals = useMemo(() => {
      const totals: Record<string, number> = {};
      let totalSpent = 0;

      monthTx.forEach(t => {
          if (t.a < 0 && t.c !== 'Income' && t.c !== 'Other') {
              const val = Math.abs(t.a);
              totals[t.c] = (totals[t.c] || 0) + val;
              totalSpent += val;
          }
      });

      return Object.entries(totals)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  // 3-Month Trend Data
  const trendData = [2, 1, 0].map(offset => {
      const d = new Date();
      d.setMonth(d.getMonth() - offset);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const spent = data.transactions
        .filter(t => {
            const td = new Date(t.d);
            return td.getMonth() === m && td.getFullYear() === y && t.a < 0 && t.c !== 'Income';
        })
        .reduce((sum, t) => sum + Math.abs(t.a), 0);

      return { name: d.toLocaleDateString('en-US', { month: 'short' }), spent };
  });

  // Colors
  const COLORS = ['#ef4444', '#f97316', '#a855f7', '#06b6d4', '#ec4899', '#10b981', '#6366f1', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center gap-2 pt-4 px-1">
            <button onClick={onBack} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white">Categories</h2>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-[#171717] p-2 rounded-2xl border border-[#262626]">
            <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-2 text-neutral-400 hover:text-white"><ArrowLeft size={18}/></button>
            <span className="font-bold text-sm text-white">{monthLabel}</span>
            <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-2 text-neutral-400 hover:text-white"><ArrowRight size={18}/></button>
        </div>

        {/* Donut Chart */}
        <div className="bg-[#171717] border border-[#262626] p-6 rounded-3xl shadow-lg flex flex-col items-center">
            <div className="h-64 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={catTotals}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {catTotals.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderRadius: '10px', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Text */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-xs text-neutral-500 font-bold uppercase">Total</span>
                     <span className="text-2xl font-black text-white">${catTotals.reduce((s, c) => s + c.value, 0).toLocaleString()}</span>
                 </div>
            </div>
            
            {/* Legend */}
            <div className="w-full grid grid-cols-2 gap-3 mt-4">
                {catTotals.map((cat, i) => (
                    <div key={cat.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            <span className="text-neutral-300">{cat.name}</span>
                        </div>
                        <span className="font-bold text-white">${cat.value.toFixed(0)}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* 3-Month Trend */}
        <div className="bg-[#171717] border border-[#262626] p-5 rounded-3xl">
            <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400"/> Spending Trend
            </h3>
            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                        <Tooltip cursor={{fill: '#262626'}} contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: 'none' }} />
                        <Bar dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* GOLD BUTTON FOR YEAR VIEW */}
        <button 
            onClick={onOpenYear}
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20 active:scale-95 transition-transform"
        >
            <span className="text-white font-black uppercase tracking-wider text-sm">View 2026 Year in Review</span>
            <ArrowRight className="text-yellow-200" size={18} />
        </button>
    </div>
  );
};

export default CategoriesView;