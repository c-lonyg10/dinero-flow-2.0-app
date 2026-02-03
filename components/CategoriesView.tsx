import React from 'react';
import { AppData, Transaction } from '../types';
import { Gamepad2, Shirt, Fuel, Gift, Utensils, ShoppingCart, ChevronDown, Music, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CategoriesViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onBack: () => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ data, monthOffset, setMonthOffset, onBack }) => {
  const currentMonth = new Date();
  currentMonth.setMonth(currentMonth.getMonth() - monthOffset);

  // --- 1. CURRENT MONTH CATEGORY LOGIC ---
  const monthTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
  });

  // Calculate Total Discretionary Spend (Excludes Rent, Bills, Debt, Income)
  const totalMonthlySpend = monthTx.filter(t => 
      t.a < 0 && 
      !['Rent', 'Bills', 'Debt', 'Income', 'Other'].includes(t.c)
  ).reduce((s, t) => s + Math.abs(t.a), 0);

  // Helper to build category bubbles
  const getCatData = (catName: string, icon: React.ReactNode, color: string, chartColor: string) => {
      const txs = monthTx.filter(t => t.c === catName);
      const total = txs.reduce((s, t) => s + Math.abs(t.a), 0);
      const progress = totalMonthlySpend > 0 ? (total / totalMonthlySpend) * 100 : 0;
      const pieData = [{ value: total }, { value: Math.max(0, totalMonthlySpend - total) }];
      return { name: catName, total, progress, icon, color, chartColor, pieData, txCount: txs.length };
  };

  const categories = [
      getCatData("Electronics/Games", <Gamepad2 size={24} className="text-purple-400" />, "text-purple-400", "#c084fc"),
      getCatData("Music Gear", <Music size={24} className="text-cyan-400" />, "text-cyan-400", "#22d3ee"),
      getCatData("Clothes", <Shirt size={24} className="text-pink-400" />, "text-pink-400", "#f472b6"),
      getCatData("Gas", <Fuel size={24} className="text-orange-400" />, "text-orange-400", "#fb923c"),
      getCatData("Gifts", <Gift size={24} className="text-red-400" />, "text-red-400", "#f87171"),
      getCatData("Dining", <Utensils size={24} className="text-yellow-400" />, "text-yellow-400", "#facc15"),
      getCatData("Groceries", <ShoppingCart size={24} className="text-emerald-400" />, "text-emerald-400", "#34d399"),
  ].sort((a, b) => b.total - a.total);

  // --- 2. TREND GRAPH LOGIC (3 MONTHS) ---
  const getMonthMetrics = (offset: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - offset);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const txs = data.transactions.filter(t => {
          const td = new Date(t.d);
          return td.getMonth() === m && td.getFullYear() === y;
      });

      const income = txs.filter(t => t.a > 0).reduce((s, t) => s + t.a, 0);
      const fixed = txs.filter(t => t.a < 0 && ['Rent', 'Bills', 'Debt'].includes(t.c)).reduce((s, t) => s + Math.abs(t.a), 0);
      const fun = txs.filter(t => t.a < 0 && !['Rent', 'Bills', 'Debt', 'Income', 'Other'].includes(t.c)).reduce((s, t) => s + Math.abs(t.a), 0);

      return {
          name: d.toLocaleDateString('en-US', { month: 'short' }),
          Income: income,
          Fixed: fixed,
          Fun: fun
      };
  };

  // Data for the graph: [2 Months Ago, Last Month, Current Month]
  // We use monthOffset as the anchor so you can scroll back in time
  const trendData = [
      getMonthMetrics(monthOffset + 2),
      getMonthMetrics(monthOffset + 1),
      getMonthMetrics(monthOffset)
  ];

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

        {/* List + Graph Section */}
        <div className="flex-1 bg-[#171717] rounded-t-3xl overflow-hidden border-t border-l border-r border-[#262626] relative shadow-xl min-h-0 mx-1">
            <div className="h-full overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
                
                {/* Category Bubbles */}
                {categories.map((cat, i) => (
                    <div key={i} className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 h-fit">
                                    {cat.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                                    <p className="text-xs text-neutral-400">{cat.txCount} transactions</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className={`text-lg font-black text-white`}>${cat.total.toFixed(0)}</p>
                                </div>
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
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-[8px] font-bold ${cat.color}`}>{Math.round(cat.progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* --- NEW FINANCIAL HEALTH GRAPH --- */}
                <div className="pt-6 border-t border-neutral-800">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-neutral-400" />
                        <h3 className="text-lg font-bold text-white">3-Month Health Check</h3>
                    </div>
                    
                    <div className="h-64 w-full bg-neutral-900/50 rounded-2xl p-2 border border-neutral-800">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fill: '#737373', fontSize: 10, fontWeight: 'bold'}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{fill: '#737373', fontSize: 10}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ padding: 0 }}
                                    cursor={{fill: '#ffffff05'}}
                                />
                                {/* Income = Green */}
                                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                {/* Fixed = Red (Bills, Rent, Debt) */}
                                <Bar dataKey="Fixed" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                {/* Fun = Purple (Variable/Discretionary) */}
                                <Bar dataKey="Fun" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold uppercase">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-emerald-500">Income</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-red-500">Fixed Bills</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            <span className="text-purple-400">Fun / Var</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default CategoriesView;