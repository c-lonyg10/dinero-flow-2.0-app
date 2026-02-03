import React from 'react';
import { AppData } from '../types';
import { Gamepad2, Shirt, Fuel, Gift, Utensils, ShoppingCart, ChevronDown, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CategoriesViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onBack: () => void; // Added onBack for flexibility
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ data, monthOffset, setMonthOffset, onBack }) => {
  const currentMonth = new Date();
  currentMonth.setMonth(currentMonth.getMonth() - monthOffset);

  // Filter transactions for the selected month
  const monthTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
  });

  // Calculate Total Monthly Spend (to use as a baseline for percentages)
  const totalMonthlySpend = monthTx.filter(t => t.a < 0 && t.c !== 'Rent' && t.c !== 'Bills' && t.c !== 'Debt').reduce((s, t) => s + Math.abs(t.a), 0);

  // Helper to build category data
  const getCatData = (catName: string, icon: React.ReactNode, color: string, chartColor: string) => {
      const txs = monthTx.filter(t => t.c === catName);
      const total = txs.reduce((s, t) => s + Math.abs(t.a), 0);
      
      // Calculate "Share of Wallet" (Percentage of total spending)
      // If total spend is 0, progress is 0 to avoid NaN
      const progress = totalMonthlySpend > 0 ? (total / totalMonthlySpend) * 100 : 0;
      
      const pieData = [{ value: total }, { value: totalMonthlySpend - total }];

      return { name: catName, total, progress, icon, color, chartColor, pieData, txCount: txs.length };
  };

  const categories = [
      getCatData("Electronics/Games", <Gamepad2 size={24} className="text-purple-400" />, "text-purple-400", "#c084fc"),
      getCatData("Clothes", <Shirt size={24} className="text-pink-400" />, "text-pink-400", "#f472b6"),
      getCatData("Gas", <Fuel size={24} className="text-orange-400" />, "text-orange-400", "#fb923c"),
      getCatData("Gifts", <Gift size={24} className="text-red-400" />, "text-red-400", "#f87171"),
      getCatData("Dining", <Utensils size={24} className="text-yellow-400" />, "text-yellow-400", "#facc15"),
      getCatData("Groceries", <ShoppingCart size={24} className="text-emerald-400" />, "text-emerald-400", "#34d399"),
  ].sort((a, b) => b.total - a.total); // Sort by highest spenders first

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

  return (
    <div className="space-y-6 pb-24 animate-fade-in h-[100dvh] flex flex-col box-border">
        {/* Header */}
        <div className="shrink-0 pt-4 px-1">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    Categories
                </h2>
                
                <div className="relative">
                     <select 
                        value={monthOffset}
                        onChange={(e) => setMonthOffset(Number(e.target.value))}
                        className="appearance-none bg-neutral-900 text-neutral-400 pl-3 pr-8 py-1 rounded-full border border-neutral-800 text-xs font-bold outline-none focus:border-neutral-600 cursor-pointer hover:bg-neutral-800 transition-colors"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                </div>
            </div>

            {/* Total Context */}
            <div className="mb-6 px-2">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Discretionary Spend</p>
                <h1 className="text-4xl font-black text-white tracking-tight">${totalMonthlySpend.toFixed(2)}</h1>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 bg-[#171717] rounded-t-3xl overflow-hidden border-t border-l border-r border-[#262626] relative shadow-xl min-h-0 mx-1">
            <div className="h-full overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
                {categories.map((cat, i) => (
                    <div key={i} className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md">
                        <div className="flex justify-between items-center">
                            {/* Left: Icon & Name */}
                            <div className="flex gap-3 items-center">
                                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 h-fit">
                                    {cat.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                                    <p className="text-xs text-neutral-400">{cat.txCount} transactions</p>
                                </div>
                            </div>

                            {/* Right: Chart & Amount */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className={`text-lg font-black text-white`}>${cat.total.toFixed(0)}</p>
                                </div>
                                
                                {/* The Donut Chart */}
                                <div className="h-12 w-12 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={cat.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={16}
                                                outerRadius={22}
                                                startAngle={90}
                                                endAngle={-270}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill={cat.chartColor} />
                                                <Cell fill="#262626" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-[8px] font-bold ${cat.color}`}>{Math.round(cat.progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CategoriesView;