import React from 'react';
import { Sword, Handshake, Car, GraduationCap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DebtView: React.FC = () => {
    // Static data simulation based on original app code
    const debts = [
        {
            id: 1,
            name: "Tio Frank",
            sub: "0% APR",
            time: "4 MO",
            icon: <Handshake className="text-blue-500" size={24} />,
            colors: { bg: 'bg-blue-500', textLight: 'text-blue-400', textDark: 'text-blue-500', chart: '#3b82f6' },
            total: 7875,
            paid: 4437,
            nextAmt: 787.50,
            due: 'Feb 15'
        },
        {
            id: 2,
            name: "Wells Fargo",
            sub: "Auto Draft",
            time: "July 26",
            icon: <Car className="text-indigo-500" size={24} />,
            colors: { bg: 'bg-indigo-600', textLight: 'text-indigo-400', textDark: 'text-indigo-500', chart: '#4f46e5' },
            total: 8022.57,
            bal: 1016,
            nextAmt: 169.32,
            due: 'Feb 11'
        },
        {
            id: 3,
            name: "Student Loan",
            sub: "Federal",
            time: "Tracker",
            icon: <GraduationCap className="text-purple-500" size={24} />,
            colors: { bg: 'bg-purple-600', textLight: 'text-purple-400', textDark: 'text-purple-500', chart: '#9333ea' },
            total: 8500,
            paid: 2000,
            nextAmt: 153.83,
            due: '5th'
        }
    ];

    return (
        <div className="space-y-6 pb-24 animate-fade-in">
             <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Sword className="text-blue-500" size={32} /> Debt
            </h2>

            <div className="space-y-6">
                {debts.map(d => {
                    const balance = d.bal !== undefined ? d.bal : (d.total - (d.paid || 0));
                    const paidAmount = d.paid !== undefined ? d.paid : (d.total - d.bal!);
                    const progress = (paidAmount / d.total) * 100;
                    const pieData = [{ value: paidAmount }, { value: balance }];

                    return (
                        <div key={d.id} className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                    <div className={`p-2 rounded-lg bg-neutral-950 border border-neutral-800 h-fit`}>
                                        {d.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{d.name}</h3>
                                        <p className="text-xs text-neutral-400">{d.sub}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold ${d.colors.textLight} uppercase`}>Time Left</p>
                                    <p className={`text-lg font-black ${d.colors.textLight}`}>{d.time}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-red-400">HP</span>
                                    <span className="text-neutral-300">${balance.toLocaleString()} / ${d.total.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                                    <div className={`h-full ${d.colors.bg}`} style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 items-center">
                                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase">Due {d.due}</p>
                                    <p className="text-sm font-bold text-white">${d.nextAmt.toFixed(0)}</p>
                                </div>
                                <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase">Paid</p>
                                    <p className="text-sm font-bold text-emerald-400">${paidAmount.toLocaleString()}</p>
                                </div>
                                <div className="h-12 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={15}
                                                outerRadius={21}
                                                startAngle={90}
                                                endAngle={-270}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill={d.colors.chart} />
                                                <Cell fill="#262626" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-[9px] font-bold ${d.colors.textDark}`}>{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DebtView;