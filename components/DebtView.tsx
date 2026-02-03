import React, { useState, useEffect } from 'react';
import { Sword, Trophy, Plus, Trash2, X, Check, Save, TrendingDown, Handshake, Car, GraduationCap } from 'lucide-react';
import { AppData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DebtViewProps {
    data: AppData;
}

interface DebtItem {
    id: number;
    name: string;
    totalAmount: number;
    prePaid: number; // New field to handle historical payments
    icon: string; 
    color: string;
    dueDay?: string; // Restored "Due Date" visual
    nextAmt?: number; // Restored "Next Amount" visual
}

const DebtView: React.FC<DebtViewProps> = ({ data }) => {
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDebt, setNewDebt] = useState<Partial<DebtItem>>({ color: 'blue' });

    // Load Debts
    useEffect(() => {
        const saved = localStorage.getItem('moneyflow_debts_v2'); // bumped version to v2 to force refresh
        if (saved) {
            setDebts(JSON.parse(saved));
        } else {
            // RESTORED YOUR ORIGINAL DATA HERE
            setDebts([
                { 
                    id: 1, 
                    name: "Tio Frank", 
                    totalAmount: 7875, 
                    prePaid: 4437, 
                    icon: 'handshake', 
                    color: 'blue',
                    dueDay: '15th',
                    nextAmt: 787.50
                },
                { 
                    id: 2, 
                    name: "Wells Fargo", 
                    totalAmount: 8022.57, 
                    prePaid: 7006.57, // Calculated from your old "Bal: 1016"
                    icon: 'car', 
                    color: 'indigo',
                    dueDay: '11th',
                    nextAmt: 169.32
                },
                { 
                    id: 3, 
                    name: "Student Loan", 
                    totalAmount: 8500, 
                    prePaid: 2000, 
                    icon: 'school', 
                    color: 'purple',
                    dueDay: '5th',
                    nextAmt: 153.83
                }
            ]);
        }
    }, []);

    // Save Debts
    useEffect(() => {
        localStorage.setItem('moneyflow_debts_v2', JSON.stringify(debts));
    }, [debts]);

    // --- THE BRAIN: Calculate Progress ---
    const getDebtStats = (debt: DebtItem) => {
        // 1. Find payments made inside the app (Transactions)
        const appPayments = data.transactions ? data.transactions.filter(t => 
            t.c === 'Debt' && 
            t.t.toLowerCase().includes(debt.name.toLowerCase())
        ) : [];

        const paymentsTotal = appPayments.reduce((sum, t) => sum + Math.abs(t.a), 0);
        
        // 2. Combine with "Pre-Paid" history
        const totalPaid = (debt.prePaid || 0) + paymentsTotal;
        const remaining = Math.max(0, debt.totalAmount - totalPaid);
        const progress = Math.min(100, (totalPaid / debt.totalAmount) * 100);
        
        // Check if paid THIS month
        const currentMonth = new Date();
        const paidThisMonth = appPayments
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
            prePaid: Number(newDebt.prePaid || 0),
            icon: newDebt.icon || 'card',
            color: newDebt.color || 'blue',
            dueDay: newDebt.dueDay || '1st',
            nextAmt: Number(newDebt.nextAmt || 0)
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

    const getIcon = (icon: string) => {
        if (icon === 'handshake') return <Handshake size={24} />;
        if (icon === 'car') return <Car size={24} />;
        if (icon === 'school') return <GraduationCap size={24} />;
        return <Sword size={24} />;
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
                                    <button onClick={() => handleDelete(d.id)} className="mt-4 text-[10px] text-neutral-600 hover:text-red-500 underline">Remove</button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={d.id} className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md relative overflow-hidden">
                             <div className="absolute top-2 right-2">
                                <button onClick={() => handleDelete(d.id)} className="text-neutral-700 hover:text-red-900 transition-colors"><Trash2 size={16} /></button>
                             </div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                    <div className={`p-2 rounded-lg bg-neutral-950 border border-neutral-800 h-fit text-${d.color}-500`}>
                                        {getIcon(d.icon)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{d.name}</h3>
                                        <p className="text-xs text-neutral-400 uppercase font-bold tracking-wide">Due: {d.dueDay}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold ${colors.text} uppercase`}>Remaining</p>
                                    <p className={`text-xl font-black ${colors.text}`}>${stats.remaining.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-neutral-500">Progress</span>
                                    <span className="text-white">{stats.progress.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                                    <div className={`h-full ${colors.bg} transition-all duration-1000`} style={{ width: `${stats.progress}%` }}></div>
                                </div>
                            </div>

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
                                        <span className={`text-[10px] font-bold ${colors.text}`}>{Math.round(stats.progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Debt Name</label>
                                <input type="text" placeholder="e.g., Wells Fargo" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white" onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Total Debt Amount</label>
                                <input type="number" placeholder="15000" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white" onChange={e => setNewDebt({...newDebt, totalAmount: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Already Paid (History)</label>
                                <input type="number" placeholder="0" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white" onChange={e => setNewDebt({...newDebt, prePaid: Number(e.target.value)})} />
                            </div>
                             <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Due Date</label>
                                <input type="text" placeholder="e.g. 15th" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white" onChange={e => setNewDebt({...newDebt, dueDay: e.target.value})} />
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