import React, { useState } from 'react';
import { AppData, Transaction } from '../types';
import { Plus, Search, Edit2, ChevronDown, ArrowLeft } from 'lucide-react';

interface TransactionsViewProps {
  data: AppData;
  onOpenTxModal: (tx?: Transaction) => void;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ data, onOpenTxModal, monthOffset, setMonthOffset }) => {
  const [filter, setFilter] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  
  // Date Logic
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() - monthOffset);
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  // Generate Dropdown Options
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

  const selectedLabel = monthOptions.find(o => o.value === monthOffset)?.label || 'Selected Month';

  // Filter transactions by selected month
  const monthTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  const sortedTx = [...monthTx]
    .sort((a, b) => new Date(b.d).getTime() - new Date(a.d).getTime())
    .filter(t => t.t.toLowerCase().includes(filter.toLowerCase()));

  // --- P2P LOGIC ---
  const p2pTerms = ['zelle','venmo','cash app','paypal'];
  const p2pTx = monthTx.filter(t => p2pTerms.some(x => t.t.toLowerCase().includes(x)));
  
  const inAmt = p2pTx.filter(t=>t.a>0).reduce((s,t)=>s+t.a,0);
  const outAmt = p2pTx.filter(t=>t.a<0).reduce((s,t)=>s+Math.abs(t.a),0);
  const net = inAmt - outAmt;

  // Helper to extract clean name
  const getPersonName = (raw: string) => {
      let clean = raw.toLowerCase();
      
      const phrases = ['payment to', 'payment from', 'transfer to', 'transfer from', 'recurring payment', 'money sent', 'money received'];
      phrases.forEach(p => clean = clean.replace(p, ' '));

      const keywords = ['venmo', 'zelle', 'cash app', 'paypal', 'recur', 'pymt', 'pmt', 'trnsfr', 'des:', 'ref:', 'id:', 'web'];
      keywords.forEach(k => clean = clean.split(k).join(' '));

      clean = clean.replace(/[^a-z\s]/g, ' ').trim();
      
      const tokens = clean.split(/\s+/);
      
      if (clean.includes('ariel')) return 'Ariel';
      if (clean.includes('cecy') || clean.includes('cecilia')) return 'Cecy';
      if (tokens.includes('anna')) return 'Anna';
      if (tokens.includes('carlos')) return 'Carlos';

      const words = clean.split(/\s+/).filter(w => w.length > 0);
      const relevantWords = words.slice(0, 2);

      if (relevantWords.length === 0) return 'Unknown';

      return relevantWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Group by Person
  const peopleMap: Record<string, {name: string, in: number, out: number, txs: Transaction[]}> = {};
  p2pTx.forEach(t => {
      const name = getPersonName(t.t) || 'Unknown';
      if(!peopleMap[name]) peopleMap[name] = { name, in: 0, out: 0, txs: [] };
      peopleMap[name].txs.push(t);
      if(t.a > 0) peopleMap[name].in += t.a;
      else peopleMap[name].out += Math.abs(t.a);
  });

  const people = Object.values(peopleMap).sort((a, b) => (b.in + b.out) - (a.in + a.out));

  // Helper for Category Badges
  const getCategoryBadgeClass = (cat: string) => {
      switch(cat) {
          case 'Groceries': return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30';
          case 'Dining': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
          case 'Rent': return 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30';
          case 'Bills': return 'bg-pink-900/30 text-pink-400 border-pink-500/30';
          case 'Debt': return 'bg-red-900/30 text-red-400 border-red-500/30';
          case 'Income': return 'bg-purple-900/30 text-purple-400 border-purple-500/30';
          default: return 'bg-neutral-800 text-neutral-400 border-neutral-700';
      }
  };

  // --- RENDER DETAIL VIEW ---
  if (selectedPerson) {
      const personData = peopleMap[selectedPerson];
      return (
          <div className="space-y-6 pb-24 animate-fade-in h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setSelectedPerson(null)} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-white truncate">{selectedPerson}</h2>
              </div>

              <div className="bg-[#171717] border border-[#262626] p-6 rounded-3xl flex justify-between items-center shadow-lg">
                   <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                           {selectedPerson.charAt(0)}
                       </div>
                       <div>
                           <p className="text-xs text-neutral-400 font-bold uppercase">Net Total</p>
                           <p className={`text-xl font-black ${personData.in - personData.out > 0 ? 'text-emerald-400' : 'text-white'}`}>
                               ${(personData.in - personData.out).toFixed(2)}
                           </p>
                       </div>
                   </div>
                   <div className="text-right space-y-1">
                       <p className="text-xs font-bold text-emerald-400">+{personData.in.toFixed(2)}</p>
                       <p className="text-xs font-bold text-red-400">-{personData.out.toFixed(2)}</p>
                   </div>
              </div>

              <div className="flex-1 bg-[#171717] rounded-3xl overflow-hidden border border-[#262626] relative">
                  <div className="absolute inset-0 overflow-y-auto no-scrollbar">
                        <table className="min-w-full text-xs text-left text-neutral-400">
                            <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-900 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Note</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {personData.txs.sort((a,b) => new Date(b.d).getTime() - new Date(a.d).getTime()).map(t => (
                                    <tr 
                                        key={t.id} 
                                        onClick={() => onOpenTxModal(t)}
                                        className="hover:bg-neutral-800/50 transition-colors cursor-pointer active:bg-neutral-800"
                                    >
                                        <td className="px-4 py-3 text-neutral-500 font-mono">{t.d.substring(5)}</td>
                                        <td className="px-4 py-3 font-medium text-white truncate max-w-[120px]">{t.t}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold border ${getCategoryBadgeClass(t.c)}`}>
                                                {t.c}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${t.a > 0 ? 'text-emerald-400' : 'text-neutral-300'}`}>
                                            {Math.abs(t.a).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER MAIN VIEW ---
  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-white">Transactions</h2>
            <button onClick={() => onOpenTxModal()} className="p-2 bg-white text-black rounded-xl hover:bg-neutral-200 shadow-lg active:scale-95 transition-transform">
                <Plus size={24} />
            </button>
        </div>

        {/* P2P Summary */}
        <div className="bg-[#171717] p-5 rounded-3xl border border-[#262626] shadow-lg">
             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                     <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                         <Search size={18} />
                     </div>
                     <h3 className="font-bold text-white">P2P Center</h3>
                 </div>
                 
                 {/* Month Selector */}
                 <div className="relative">
                    <select 
                        value={monthOffset}
                        onChange={(e) => setMonthOffset(Number(e.target.value))}
                        className="appearance-none bg-neutral-900 text-neutral-400 pl-3 pr-8 py-1 rounded-full border border-neutral-800 text-[10px] font-bold outline-none focus:border-neutral-600 cursor-pointer hover:bg-neutral-800 transition-colors"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                 </div>
             </div>
             
             {/* Stats */}
             <div className="grid grid-cols-3 gap-2 mb-6">
                 <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                     <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-wide">In</p>
                     <p className="text-lg font-bold text-white mt-1">${inAmt.toFixed(0)}</p>
                 </div>
                 <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                     <p className="text-[9px] text-red-400 uppercase font-bold tracking-wide">Out</p>
                     <p className="text-lg font-bold text-white mt-1">${outAmt.toFixed(0)}</p>
                 </div>
                 <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                     <p className="text-[9px] text-purple-400 uppercase font-bold tracking-wide">Net</p>
                     <p className="text-lg font-bold text-white mt-1">{net > 0 ? '+' : ''}${net.toFixed(0)}</p>
                 </div>
             </div>

             {/* People List */}
             {people.length > 0 && (
                 <div className="border-t border-neutral-800 pt-4">
                     <p className="text-[10px] font-bold text-neutral-500 uppercase mb-3">People this month</p>
                     <div className="flex flex-wrap gap-2">
                         {people.map((p, i) => (
                             <button 
                                key={i}
                                onClick={() => setSelectedPerson(p.name)}
                                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full transition-all active:scale-95 group"
                             >
                                 <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:bg-neutral-700 group-hover:text-white">
                                     {p.name.charAt(0)}
                                 </div>
                                 <div className="text-left">
                                     <span className="block text-[10px] font-bold text-white leading-none">{p.name}</span>
                                     <div className="flex gap-1 text-[8px] font-mono leading-none mt-0.5">
                                         {p.in > 0 && <span className="text-emerald-500">+${p.in.toFixed(0)}</span>}
                                         {p.out > 0 && <span className="text-red-500">-${p.out.toFixed(0)}</span>}
                                     </div>
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>
             )}
        </div>

        {/* Search */}
        <div className="relative">
            <input 
                type="text" 
                placeholder={`Search ${selectedLabel.toLowerCase()}...`} 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-600"
            />
            <Search className="absolute left-3 top-3.5 text-neutral-500" size={18} />
        </div>

        {/* List */}
        <div className="bg-[#171717] rounded-3xl overflow-hidden border border-[#262626]">
            <div className="overflow-y-auto max-h-[50vh] no-scrollbar">
                <table className="min-w-full text-xs text-left text-neutral-400">
                    <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-900 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Desc</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Amt</th>
                            <th className="px-4 py-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {sortedTx.map(t => (
                            <tr key={t.id} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="px-4 py-3 text-neutral-500 font-mono">{t.d.substring(5)}</td>
                                <td className="px-4 py-3 font-medium text-white truncate max-w-[120px]">{t.t}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold border whitespace-nowrap ${getCategoryBadgeClass(t.c)}`}>
                                        {t.c}
                                    </span>
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${t.a > 0 ? 'text-emerald-400' : 'text-neutral-300'}`}>
                                    {Math.abs(t.a).toFixed(0)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => onOpenTxModal(t)} className="text-blue-400 p-1 hover:bg-blue-900/20 rounded">
                                        <Edit2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sortedTx.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-neutral-600">No transactions found for {selectedLabel}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default TransactionsView;