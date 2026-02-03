import React, { useMemo } from 'react';
import { AppData } from '../types';
import { ArrowLeft, ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoriesViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onBack: () => void;
  onOpenYear: () => void; // The new prop for the Gold Button
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
          .sort((a, b) => b.value - a.value); // Sort highest spend first
  }, [monthTx]);

  // Colors for the bars
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#a855f7', '#06b6d4', '#ec4899', '#10b981', '#6366f1'];

  return (
    <div className="space-y-6 pb-24 animate-fade-in h-[100dvh] flex flex-col">
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

        {/* MAIN CHART & LIST (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
            
            {/* Horizontal Bar Chart (The "Graph + List" look) */}
            <div className="bg-[#171717] border border-[#262626] p-5 rounded-3xl shadow-lg">
                <h3 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400"/> Spending Breakdown
                </h3>
                
                {catTotals.length > 0 ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={catTotals} 
                                layout="vertical" 
                                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{ fill: '#a3a3a3', fontSize: 11, fontWeight: 'bold' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#262626'}} 
                                    contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333' }}
                                    formatter={(value: number) => [`$${value.toFixed(0)}`, 'Spent']}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {catTotals.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-neutral-600 text-xs">
                        No spending data for this month
                    </div>
                )}
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
    </div>
  );
};

export default CategoriesView;