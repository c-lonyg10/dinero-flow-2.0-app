import React from 'react';
import { AppData } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, Music, Trophy, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface YearViewProps {
  data: AppData;
  onBack: () => void;
}

const YearView: React.FC<YearViewProps> = ({ data, onBack }) => {
  const currentYear = new Date().getFullYear(); 

  // 1. FILTER FOR CURRENT YEAR
  const yearTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getFullYear() === currentYear;
  });

  // 2. AGGREGATE MONTHLY DATA
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(currentYear, i).toLocaleString('en-US', { month: 'short' });
      const txs = yearTx.filter(t => new Date(t.d).getMonth() === i);
      
      const income = txs.filter(t => t.a > 0).reduce((sum, t) => sum + t.a, 0);
      const spent = txs.filter(t => t.a < 0).reduce((sum, t) => sum + Math.abs(t.a), 0);
      const net = income - spent;
      
      // Breakdown for stacked bars
      const fixed = txs.filter(t => t.a < 0 && (t.c === 'Bills' || t.c === 'Rent')).reduce((sum, t) => sum + Math.abs(t.a), 0);
      const fun = txs.filter(t => t.a < 0 && !['Bills', 'Rent', 'Income', 'Debt'].includes(t.c)).reduce((sum, t) => sum + Math.abs(t.a), 0);
      const debt = txs.filter(t => t.a < 0 && t.c === 'Debt').reduce((sum, t) => sum + Math.abs(t.a), 0);

      return { name: monthName, income, spent, net, fixed, fun, debt, fullDate: i };
  });

  // 3. CALCULATE SUPERLATIVES
  const totalIncome = yearTx.filter(t => t.a > 0).reduce((sum, t) => sum + t.a, 0);
  const totalSpent = yearTx.filter(t => t.a < 0).reduce((sum, t) => sum + Math.abs(t.a), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

  // Music Gear Stat
  const musicSpend = yearTx.filter(t => t.c === 'Music Gear').reduce((sum, t) => sum + Math.abs(t.a), 0);
  
  // Best Month (Highest Net)
  const bestMonth = [...monthlyData].sort((a, b) => b.net - a.net)[0];
  
  // Most Expensive Month
  const priceyMonth = [...monthlyData].sort((a, b) => b.spent - a.spent)[0];

  const formatMoney = (val: number) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 pb-24 animate-fade-in min-h-[100dvh]">
        {/* CSS Hack to kill the white border on Touch */}
        <style>{`
            .recharts-wrapper { outline: none !important; }
            *:focus { outline: none !important; }
        `}</style>

        {/* Header */}
        <div className="flex items-center gap-2 pt-4 px-1">
            <button onClick={onBack} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-black text-white leading-none">{currentYear} Review</h2>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Yearly Vision</p>
            </div>
        </div>

        {/* HERO CARD */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
                <p className="text-xs text-indigo-300 font-bold uppercase mb-1">Total Net Worth Change</p>
                <h1 className={`text-4xl font-black ${totalIncome - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalIncome - totalSpent >= 0 ? '+' : '-'}{formatMoney(Math.abs(totalIncome - totalSpent))}
                </h1>
                <div className="mt-4 flex gap-4 text-xs font-bold opacity-80">
                    <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={12}/> In: {formatMoney(totalIncome)}</span>
                    <span className="text-red-400 flex items-center gap-1"><TrendingDown size={12}/> Out: {formatMoney(totalSpent)}</span>
                </div>
            </div>
        </div>

        {/* 12-MONTH CHART */}
        <div className="bg-[#171717] border border-[#262626] p-4 rounded-3xl shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4 pl-2">Monthly Flow</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%" className="outline-none">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} interval={0} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} />
                        <Tooltip 
                            cursor={false}
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                            wrapperStyle={{ outline: 'none' }}
                        />
                        {/* Stacked Bars: Fixed (Red), Fun (Purple), Income (Green behind/separate) */}
                        <Bar dataKey="fixed" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="debt" stackId="a" fill="#f97316" />
                        <Bar dataKey="fun" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-[10px] text-neutral-500 font-bold uppercase">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Fixed</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Debt</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Fun</div>
            </div>
        </div>

        {/* SUPERLATIVES GRID */}
        <div className="grid grid-cols-2 gap-3">
            {/* Music Card */}
            <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl">
                <Music className="text-blue-400 mb-2" size={24} />
                <p className="text-[10px] text-blue-300 font-bold uppercase">Music Studio</p>
                <p className="text-xl font-black text-white">{formatMoney(musicSpend)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">Invested in Gear</p>
            </div>

            {/* Savings Rate */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
                <DollarSign className="text-emerald-400 mb-2" size={24} />
                <p className="text-[10px] text-emerald-300 font-bold uppercase">Savings Rate</p>
                <p className="text-xl font-black text-white">{savingsRate.toFixed(1)}%</p>
                <p className="text-[10px] text-neutral-400 mt-1">Of Income Kept</p>
            </div>
            
            {/* Best Month */}
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">Best Month</p>
                        <p className="text-lg font-bold text-white">{bestMonth?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">+{formatMoney(bestMonth?.net || 0)}</p>
                    <p className="text-[10px] text-neutral-500">Net Profit</p>
                </div>
            </div>

            {/* Pricey Month */}
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl col-span-2 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">Spendy Month</p>
                        <p className="text-lg font-bold text-white">{priceyMonth?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-red-400">-{formatMoney(priceyMonth?.spent || 0)}</p>
                    <p className="text-[10px] text-neutral-500">Total Out</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default YearView;