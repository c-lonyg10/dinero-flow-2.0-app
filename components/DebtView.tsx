import React, { useState, useEffect } from 'react';
import { Sword, Trophy, Plus, Trash2, X, Check, Save, TrendingDown } from 'lucide-react';
import { AppData, Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DebtViewProps {
    data: AppData; // Needs access to transaction history
}

interface DebtItem {
    id: number;
    name: string;
    totalAmount: number; // The starting debt amount
    icon: string; // 'car', 'school', 'card', 'home'
    color: string;
}

const DebtView: React.FC<DebtViewProps> = ({ data }) => {
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDebt, setNewDebt] = useState<Partial<DebtItem>>({ color: 'blue' });

    // Load Debts from Local Storage (Separate from main AppData to keep it safe)
    useEffect(() => {
        const saved = localStorage.getItem('moneyflow_debts_v1');
        if (saved) {
            setDebts(JSON.parse(saved));
        } else {
            // Default Starter Debt (Example)
            setDebts([
                { id: 1, name: "Car Loan", totalAmount: 15000, icon: 'car', color: 'indigo' }
            ]);
        }
    }, []);

    // Save Debts
    useEffect(() => {
        localStorage.setItem('moneyflow_debts_v1', JSON.stringify(debts));
    }, [debts]);

    // --- THE BRAIN: Calculate Progress based on Transactions ---
    const getDebtStats = (debt: DebtItem) => {
        // Find ALL payments ever made to this debt (matching name & category)
        const allPayments = data.transactions.filter(t => 
            t.c === 'Debt' && 
            t.t.toLowerCase().includes(debt.name.toLowerCase())
        );

        const totalPaid = allPayments.reduce((sum, t) => sum + Math.abs(t.a), 0);
        const remaining = Math.max(0, debt.totalAmount - totalPaid);
        const progress = Math.min(100, (totalPaid / debt.totalAmount) * 100);
        
        // Check if paid THIS month
        const currentMonth = new Date();
        const paidThisMonth = allPayments
            .filter(t => {
                const d = new Date(t.d);
                return d.getMonth() === currentMonth.getMonth() && 
                       d.getFullYear() === currentMonth.getFullYear();
            })
            .reduce((sum, t) => sum + Math.abs(t.a), 0);

        return { totalPaid, remaining, progress, paidThisMonth, isConquered: remaining <= 0 };
    };

    const handleSaveDebt = () => {
        if (!newDebt.name || !newDebt.totalAmount) return;
        const item: DebtItem = {
            id: Date.now(),
            name: newDebt.name,
            totalAmount: Number(newDebt.totalAmount),
            icon: newDebt.icon || 'card',
            color: newDebt.color || 'blue'
        };
        setDebts([...debts, item]);
        setIsModalOpen(false);
        setNewDebt({ color: 'blue' });
    };

    const handleDelete = (id: number) => {
        if(confirm("Delete this debt tracker?")) {
            setDebts(debts.filter(d => d.id !== id));
        }
    };

    // Helper for colors
    const getColors = (color: string) => {
        const map: any = {
            blue: { text: 'text-blue-400', bg: 'bg-blue-500', chart: '#3b82f6' },
            indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500', chart: '#6366f1' },
            purple: { text: 'text-purple-400', bg: 'bg-purple-500', chart: '#a855f7' },
            red: { text: 'text-red-400', bg: 'bg-red-500', chart: '#ef4444' },
            orange: { text: 'text-orange-400', bg: 'bg-orange-500', chart: '#f97316' },
        };
        return map[color] || map.blue;
    };

    return (
        <div className="space-y-6 pb-24 animate-fade-in min-h-[100dvh]">
            <div className="flex justify-between items-center pt-4 px-1">
                 <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Sword className="text-blue-500" size={32} /> Debt Slayer
                </h2>
                <button onClick={() => setIsModalOpen(true)} className="p-2 bg-white text-black rounded-xl hover:bg-neutral-200">
                    <Plus size={24} />
                </button>
            </div>

            <div className="space-y-6 px-1">
                {debts.map(d => {
                    const stats = getDebtStats(d);
                    const colors = getColors(d.color);
                    const pieData = [{ value: stats.totalPaid }, { value: stats.remaining }];

                    // --- PLATINUM TROPHY VIEW (CONQUERED) ---
                    if (stats.isConquered) {
                        return (
                            <div key={d.id} className="relative overflow-hidden p-6 rounded-2xl border border-yellow-500/50 bg-gradient-to-br from-yellow-900/40 to-black shadow-[0_0_30px_rgba(234,179,8,0.2)] group">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <Trophy size={120} className="text-yellow-400 rotate-12" />
                                </div>
                                <div className="relative z-10 text-center space-y-2">
                                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-yellow-500 text-black mb-2 shadow-lg shadow-yellow-500/50">
                                        <Trophy size={32} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Debt Conquered</h3>
                                    <p className="text-sm font-bold text-yellow-500 uppercase tracking-widest">{d.name}</p>
                                    <p className="text-xs text-neutral-400">You paid off ${d.totalAmount.toLocaleString()}!</p>
                                    <button onClick={() => handleDelete(d.id)} className="mt-4 text-[10px] text-neutral-600 hover:text-red-500 underline">
                                        Remove from history
                                    </button>
                                </div>
                                {/* Shine Effect */}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
                            </div>
                        );
                    }

                    // --- ACTIVE BATTLE VIEW ---
                    return (
                        <div key={d.id} className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md relative overflow-hidden">
                             <div className="absolute top-2 right-2">
                                <button onClick={() => handleDelete(d.id)} className="text-neutral-700 hover:text-red-900 transition-colors"><Trash2 size={16} /></button>
                             </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{d.name}</h3>
                                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wide">Target: ${d.totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold ${colors.text} uppercase`}>Remaining</p>
                                    <p className={`text-xl font-black ${colors.text}`}>${stats.remaining.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-neutral-500">Progress</span>
                                    <span className="text-white">{stats.progress.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                                    <div className={`h-full ${colors.bg} transition-all duration-1000`} style={{ width: `${stats.progress}%` }}></div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div className={`p-3 rounded-xl border ${stats.paidThisMonth > 0 ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-neutral-950 border-neutral-800'}`}>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Paid This Month</p>
                                    <div className="flex items-center gap-2">
                                        {stats.paidThisMonth > 0 ? <Check size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-neutral-600" />}
                                        <p className={`text-lg font-bold ${stats.paidThisMonth > 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
                                            ${stats.paidThisMonth.toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Donut Chart Mini */}
                                <div className="h-14 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={18}
                                                outerRadius={25}
                                                startAngle={90}
                                                endAngle={-270}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill={colors.chart} />
                                                <Cell fill="#262626" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sword size={12} className={colors.text} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {debts.length === 0 && (
                    <div className="text-center py-12 px-4">
                        <div className="bg-neutral-900/50 rounded-full p-6 inline-block mb-4">
                            <Sword size={48} className="text-neutral-700" />
                        </div>
                        <h3 className="text-white font-bold mb-2">No Enemies Found</h3>
                        <p className="text-neutral-500 text-sm">Add a debt to start tracking your battle against interest rates.</p>
                    </div>
                )}
            </div>

            {/* ADD DEBT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#171717] border border-[#262626] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-white">Add New Debt</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-neutral-500" /></button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Debt Name (Must match Transactions)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Wells Fargo, Student Loan"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    onChange={e => setNewDebt({...newDebt, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Total Starting Amount</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g., 15000"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    onChange={e => setNewDebt({...newDebt, totalAmount: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Color Theme</label>
                                <div className="flex gap-2 mt-1">
                                    {['blue', 'indigo', 'purple', 'red', 'orange'].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setNewDebt({...newDebt, color: c})}
                                            className={`w-8 h-8 rounded-full border-2 ${newDebt.color === c ? 'border-white' : 'border-transparent'}`}
                                            style={{ backgroundColor: c === 'indigo' ? '#6366f1' : c === 'purple' ? '#a855f7' : c === 'red' ? '#ef4444' : c === 'orange' ? '#f97316' : '#3b82f6' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSaveDebt} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 flex items-center justify-center gap-2">
                            <Save size={18} /> Start Tracking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtView;