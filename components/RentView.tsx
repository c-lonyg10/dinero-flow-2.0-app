import React from 'react';
import { Home, CheckCircle2, Clock } from 'lucide-react';
import { AppData } from '../types';

interface RentViewProps {
  data: AppData;
  onUpdateRent: (amount: number) => void;
  onTogglePaid: (id: number) => void;
  monthOffset: number;
}

const RentView: React.FC<RentViewProps> = ({ data, onUpdateRent, onTogglePaid, monthOffset }) => {
  const total = data.budget.rentTotal || 0;
  
  // Logic from original app
  const wave2Base = 600.00; 
  const wave2Fee = wave2Base * 0.01; 
  const wave2Total = wave2Base + wave2Fee; 
  
  let wave1Base = 0; 
  if (total > wave2Base) { 
      wave1Base = total - 600; 
  }
  const wave1Fee = wave1Base * 0.01; 
  const wave1Total = wave1Base + wave1Fee;
  const annaWave1 = Math.max(0, wave1Total - 500);

  // Month Key for Payment Status
  const d = new Date();
  d.setMonth(d.getMonth() - monthOffset);
  const monthKey = `${d.getFullYear()}-${d.getMonth()}`;

  // Find associated bills (Wave 1 = Flex Rent ID:1, Wave 2 = Flex Finance ID:9)
  const bill1 = data.bills.find(b => b.id === 1); // Flex Rent
  const bill2 = data.bills.find(b => b.id === 9); // Flex Finance (Wave 2)

  const isWave1Paid = bill1?.manualPaid?.includes(monthKey);
  const isWave2Paid = bill2?.manualPaid?.includes(monthKey);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Home className="text-cyan-500" size={32} /> Rent Control
        </h2>

        <div className="bg-[#171717] border border-[#262626] p-5 rounded-3xl">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Total Rent Bill</label>
            <input 
                type="number" 
                value={total || ''} 
                onChange={(e) => onUpdateRent(parseFloat(e.target.value) || 0)}
                className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-4 text-3xl font-black text-cyan-400 focus:border-neutral-500 focus:outline-none transition-colors" 
                placeholder="0.00" 
            />
        </div>

        <div className="space-y-4">
            {/* Wave 1 */}
            <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden transition-all hover:border-neutral-700">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-white">Wave 1</h3>
                    <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">Variable</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">
                    {wave1Total > 0 ? `$${wave1Total.toFixed(2)}` : '--'}
                </h2>
                <div className="flex justify-between text-xs text-neutral-400 mb-3 font-medium">
                    <span>Carlos: $500</span>
                    <span className="text-cyan-400 font-bold">{annaWave1 > 0 ? `Anna: $${annaWave1.toFixed(2)}` : 'Anna: --'}</span>
                </div>
                
                {bill1 ? (
                    <button 
                        onClick={() => onTogglePaid(1)}
                        className={`w-full p-2 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${isWave1Paid 
                            ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]' 
                            : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-800'}`}
                    >
                        {isWave1Paid ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                        {isWave1Paid ? 'PAID' : 'PENDING'}
                    </button>
                ) : (
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-center font-bold text-neutral-500 text-xs uppercase">
                        Bill Missing (ID:1)
                    </div>
                )}
            </div>

            {/* Wave 2 */}
            <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl transition-all hover:border-neutral-700">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-white">Wave 2</h3>
                    <span className="text-[10px] bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-500/20">Fixed</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">${wave2Total.toFixed(2)}</h2>
                <div className="flex justify-between text-xs text-neutral-400 mb-3 font-medium">
                    <span>Carlos: $400</span>
                    <span className="text-purple-400 font-bold">Anna: ${(wave2Total - 400).toFixed(2)}</span>
                </div>
                
                {bill2 ? (
                     <button 
                        onClick={() => onTogglePaid(9)}
                        className={`w-full p-2 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${isWave2Paid 
                            ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]' 
                            : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-800'}`}
                    >
                        {isWave2Paid ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                        {isWave2Paid ? 'PAID' : 'PENDING'}
                    </button>
                ) : (
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-center font-bold text-neutral-500 text-xs uppercase">
                         Bill Missing (ID:9)
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default RentView;