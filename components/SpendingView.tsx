import React, { useState } from 'react';
import { AppData, Transaction } from '../types';
import { Utensils, Trophy, ChevronDown, ShoppingCart, ArrowLeft, Edit2 } from 'lucide-react';

interface SpendingViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onOpenTxModal: (tx: Transaction) => void;
}

const SpendingView: React.FC<SpendingViewProps> = ({ data, monthOffset, setMonthOffset, onOpenTxModal }) => {
  const [selectedCategory, setSelectedCategory] = useState<'Dining' | 'Groceries' | null>(null);
  const [showTopTen, setShowTopTen] = useState(false);

  const currentMonth = new Date();
  currentMonth.setMonth(currentMonth.getMonth() - monthOffset);
  
  const monthTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const diningTx = monthTx.filter(t => t.c === "Dining");
  const groceriesTx = monthTx.filter(t => t.c === "Groceries");

  const diningTotal = diningTx.reduce((s, t) => s + Math.abs(t.a), 0);
  const groceriesTotal = groceriesTx.reduce((s, t) => s + Math.abs(t.a), 0);
  const foodTotal = diningTotal + groceriesTotal;

  // Visual split calculation
  const diningPercent = foodTotal > 0 ? (diningTotal / foodTotal) * 100 : 0;
  const groceryPercent = foodTotal > 0 ? (groceriesTotal / foodTotal) * 100 : 0;

  // Top Spot (Most visited place by total)
  const spots: {[key: string]: number} = {};
  monthTx.filter(t => t.c === "Dining" || t.c === "Groceries").forEach(t => {
      let n = t.t.split('#')[0].split(' Store')[0].trim().replace(/TST\*/g,'').replace(/SQ \*/g,'').trim();
      if(n.toLowerCase().includes("chick")) n="Chick-Fil-A";
      if(n.toLowerCase().includes("harris")) n="Harris Teeter";
      if(n.toLowerCase().includes("publix")) n="Publix";
      spots[n] = (spots[n] || 0) + Math.abs(t.a);
  });
  const topSpot = Object.entries(spots).sort((a, b) => b[1] - a[1])[0];

  // Top 10 Largest Transactions (Individual)
  const topTenTx = monthTx
    .filter(t => t.c === "Dining" || t.c === "Groceries")
    .sort((a, b) => Math.abs(b.a) - Math.abs(a.a))
    .slice(0, 10);

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

  // --- DETAIL VIEW (CATEGORY) ---
  if (selectedCategory) {
      const categoryTx = selectedCategory === 'Dining' ? diningTx : groceriesTx;
      const sortedCatTx = [...categoryTx].sort((a,b) => new Date(b.d).getTime() - new Date(a.d).getTime());
      
      return (
          <div className="space-y-6 pb-24 animate-fade-in h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setSelectedCategory(null)} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      {selectedCategory === 'Dining' ? <Utensils className="text-orange-500" /> : <ShoppingCart className="text-emerald-500" />}
                      {selectedCategory}
                  </h2>
              </div>

              <div className="bg-[#171717] border border-[#262626] rounded-3xl p-6 text-center shadow-lg">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-1">Total Spent</p>
                  <h2 className={`text-4xl font-black ${selectedCategory === 'Dining' ? 'text-orange-400' : 'text-emerald-400'}`}>
                      ${(selectedCategory === 'Dining' ? diningTotal : groceriesTotal).toFixed(2)}
                  </h2>
              </div>

              <div className="flex-1 bg-[#171717] rounded-3xl overflow-hidden border border-[#262626] relative">
                  <div className="absolute inset-0 overflow-y-auto no-scrollbar">
                        <table className="min-w-full text-xs text-left text-neutral-400">
                            <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-900 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Place</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {sortedCatTx.map(t => (
                                    <tr key={t.id} onClick={() => onOpenTxModal(t)} className="hover:bg-neutral-800/50 transition-colors cursor-pointer active:bg-neutral-800">
                                        <td className="px-4 py-3 text-neutral-500 font-mono">{t.d.substring(5)}</td>
                                        <td className="px-4 py-3 font-medium text-white truncate max-w-[140px]">{t.t}</td>
                                        <td className="px-4 py-3 text-right font-bold text-white">
                                            ${Math.abs(t.a).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Edit2 size={12} className="text-neutral-600" />
                                        </td>
                                    </tr>
                                ))}
                                {sortedCatTx.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-neutral-600">No transactions found.</td></tr>
                                )}
                            </tbody>
                        </table>
                  </div>
              </div>
          </div>
      );
  }

  // --- TOP 10 VIEW ---
  if (showTopTen) {
      return (
          <div className="space-y-6 pb-24 animate-fade-in h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setShowTopTen(false)} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Trophy className="text-yellow-500" />
                      Top 10 Expenses
                  </h2>
              </div>

              <div className="flex-1 bg-[#171717] rounded-3xl overflow-hidden border border-[#262626] relative">
                  <div className="absolute inset-0 overflow-y-auto no-scrollbar">
                        <table className="min-w-full text-xs text-left text-neutral-400">
                            <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-900 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-center">#</th>
                                    <th className="px-4 py-3">Place</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {topTenTx.map((t, index) => (
                                    <tr key={t.id} onClick={() => onOpenTxModal(t)} className="hover:bg-neutral-800/50 transition-colors cursor-pointer active:bg-neutral-800">
                                        <td className="px-4 py-3 text-center font-bold text-yellow-500">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-white truncate max-w-[140px]">
                                            {t.t}
                                            <div className={`text-[9px] uppercase font-bold mt-0.5 ${t.c === 'Dining' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                {t.c}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-white text-sm">
                                            ${Math.abs(t.a).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-neutral-500 font-mono">
                                            {t.d.substring(5)}
                                        </td>
                                    </tr>
                                ))}
                                {topTenTx.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-neutral-600">No food transactions found for this month.</td></tr>
                                )}
                            </tbody>
                        </table>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex justify-between items-center">
             <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                Food Analysis
            </h2>
            
            <div className="relative z-20">
                 <select 
                    value={monthOffset}
                    onChange={(e) => setMonthOffset(Number(e.target.value))}
                    className="appearance-none bg-neutral-900 text-neutral-400 pl-3 pr-8 py-1 rounded-full border border-neutral-800 text-xs font-bold outline-none focus:border-neutral-600 cursor-pointer hover:bg-neutral-800 transition-colors"
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            </div>
        </div>

        {/* Big Total */}
        <div className="text-center py-4">
             <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Food Spend</p>
             <h1 className="text-5xl font-black text-white tracking-tighter">${foodTotal.toFixed(0)}</h1>
        </div>

        {/* Visual Split */}
        <div className="flex h-3 rounded-full overflow-hidden bg-neutral-800 w-full max-w-sm mx-auto mb-2">
            <div style={{ width: `${diningPercent}%` }} className="bg-orange-500 h-full"></div>
            <div style={{ width: `${groceryPercent}%` }} className="bg-emerald-500 h-full"></div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-neutral-500 max-w-sm mx-auto px-1 mb-6">
            <span className={diningPercent > 0 ? "text-orange-400" : ""}>{diningPercent.toFixed(0)}% Dining</span>
            <span className={groceryPercent > 0 ? "text-emerald-400" : ""}>{groceryPercent.toFixed(0)}% Groceries</span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => setSelectedCategory('Dining')}
                className="group relative p-5 bg-neutral-900 border border-neutral-800 rounded-3xl text-left hover:bg-neutral-800 transition-all active:scale-95 overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Utensils size={80} />
                </div>
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-orange-900/30 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/20">
                        <Utensils size={20} />
                    </div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Dining Out</p>
                    <h3 className="text-2xl font-black text-white mb-1">${diningTotal.toFixed(0)}</h3>
                    <p className="text-[10px] text-neutral-400 font-mono">{diningTx.length} transactions</p>
                </div>
            </button>

            <button 
                onClick={() => setSelectedCategory('Groceries')}
                className="group relative p-5 bg-neutral-900 border border-neutral-800 rounded-3xl text-left hover:bg-neutral-800 transition-all active:scale-95 overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShoppingCart size={80} />
                </div>
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                        <ShoppingCart size={20} />
                    </div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Groceries</p>
                    <h3 className="text-2xl font-black text-white mb-1">${groceriesTotal.toFixed(0)}</h3>
                    <p className="text-[10px] text-neutral-400 font-mono">{groceriesTx.length} transactions</p>
                </div>
            </button>
        </div>

        {/* Top Spot Bubble - Interactive */}
        <button 
            onClick={() => setShowTopTen(true)}
            className="w-full p-5 bg-gradient-to-br from-yellow-900/20 to-neutral-900 border border-yellow-900/30 rounded-3xl flex items-center gap-4 shadow-lg text-left active:scale-95 transition-transform"
        >
             <div className="bg-yellow-500 text-black p-3 rounded-2xl shadow-lg shadow-yellow-500/20">
                 <Trophy size={24} strokeWidth={2.5} />
             </div>
             <div>
                 <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide mb-0.5">Top Spot (Total)</p>
                 <h3 className="text-lg font-black text-white leading-none">{topSpot ? topSpot[0] : 'None'}</h3>
                 <p className="text-xs text-neutral-400 mt-1 font-bold">Spent: ${topSpot ? topSpot[1].toFixed(2) : '0.00'}</p>
                 <p className="text-[9px] text-yellow-500/70 font-bold mt-1 uppercase">Click for Top 10 List &rarr;</p>
             </div>
        </button>
    </div>
  );
};

export default SpendingView;