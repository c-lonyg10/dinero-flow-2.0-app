import React from 'react';
import { AppData, Transaction } from '../types';
import { PartyPopper, ArrowLeft, Edit2, ChevronDown } from 'lucide-react';

interface FunViewProps {
  data: AppData;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  onOpenTxModal: (tx: Transaction) => void;
  onBack: () => void;
}

const FunView: React.FC<FunViewProps> = ({ data, monthOffset, setMonthOffset, onOpenTxModal, onBack }) => {
  const currentMonth = new Date();
  currentMonth.setMonth(currentMonth.getMonth() - monthOffset);
  
  // Filter for "For Fun" category in the selected month
  const funTx = data.transactions.filter(t => {
      const d = new Date(t.d);
      return d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear() &&
             t.c === "For Fun";
  }).sort((a,b) => new Date(b.d).getTime() - new Date(a.d).getTime());

  const totalSpent = funTx.reduce((s, t) => s + Math.abs(t.a), 0);

  // Top Fun Item
  const spots: {[key: string]: number} = {};
  funTx.forEach(t => {
      let n = t.t.split('#')[0].trim();
      spots[n] = (spots[n] || 0) + Math.abs(t.a);
  });
  const topFun = Object.entries(spots).sort((a, b) => b[1] - a[1])[0];

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
    <div className="space-y-6 pb-24 animate-fade-in h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <PartyPopper className="text-pink-500" />
                    For Fun
                </h2>
            </div>
            
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

        {/* Big Total */}
        <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-500/30 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <PartyPopper size={120} className="text-pink-500 rotate-12" />
            </div>
            <div className="relative z-10">
                <p className="text-xs text-pink-300 font-bold uppercase tracking-widest mb-1">Happiness Cost</p>
                <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">
                    ${totalSpent.toFixed(2)}
                </h2>
                {topFun && (
                    <div className="mt-4 inline-block bg-black/30 px-3 py-1 rounded-full border border-pink-500/20 backdrop-blur-sm">
                        <p className="text-[10px] text-pink-200">
                            Most spent on: <span className="font-bold text-white">{topFun[0]}</span> (${topFun[1].toFixed(0)})
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* List */}
        <div className="flex-1 bg-[#171717] rounded-3xl overflow-hidden border border-[#262626] relative shadow-xl">
            <div className="absolute inset-0 overflow-y-auto no-scrollbar">
                <table className="min-w-full text-xs text-left text-neutral-400">
                    <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-900 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Activity / Item</th>
                            <th className="px-4 py-3 text-right">Cost</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {funTx.map(t => (
                            <tr key={t.id} onClick={() => onOpenTxModal(t)} className="hover:bg-neutral-800/50 transition-colors cursor-pointer active:bg-neutral-800">
                                <td className="px-4 py-3 text-neutral-500 font-mono">{t.d.substring(5)}</td>
                                <td className="px-4 py-3 font-medium text-white truncate max-w-[150px]">{t.t}</td>
                                <td className="px-4 py-3 text-right font-bold text-pink-400">
                                    ${Math.abs(t.a).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Edit2 size={12} className="text-neutral-600" />
                                </td>
                            </tr>
                        ))}
                        {funTx.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-neutral-600">No fun transactions yet this month. Treat yourself!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default FunView;