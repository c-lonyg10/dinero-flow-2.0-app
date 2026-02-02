import React from 'react';
import { AppData } from '../types';
import { CloudDownload, History, Trash2, Save, FileSpreadsheet } from 'lucide-react';

interface SettingsViewProps {
  data: AppData;
  onUpdateBudget: (key: string, val: number) => void;
  onReset: () => void;
  onImport: (file: File) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ data, onUpdateBudget, onReset, onImport }) => {
  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <h2 className="text-2xl font-bold text-white">Settings</h2>

        <div className="p-5 bg-emerald-900/10 rounded-3xl border border-emerald-500/20">
            <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <FileSpreadsheet size={20} /> Import Chase CSV
            </h4>
            <p className="text-xs text-neutral-400 mb-4">Import transactions from your bank to populate analytics.</p>
            <label className="flex items-center justify-center w-full bg-emerald-900/30 text-emerald-400 py-3 rounded-xl font-bold text-xs border border-emerald-500/30 hover:bg-emerald-900/40 cursor-pointer transition-colors active:scale-95">
                <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                    if(e.target.files?.[0]) {
                        onImport(e.target.files[0]);
                        e.target.value = ''; // Reset
                    }
                }}/>
                <span>Select CSV File</span>
            </label>
        </div>

        <div className="p-5 bg-cyan-900/10 rounded-3xl border border-cyan-500/20">
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
                <CloudDownload size={20} /> Backup & Restore
            </h4>
            <p className="text-xs text-neutral-400 mb-4">Save your data locally or restore from a file.</p>
            <div className="flex gap-2">
                <button className="flex-1 bg-cyan-900/30 text-cyan-400 py-3 rounded-xl font-bold text-xs border border-cyan-500/30 hover:bg-cyan-900/50">
                    Download
                </button>
                <button className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-bold text-xs border border-neutral-700 hover:bg-neutral-700">
                    Restore
                </button>
            </div>
        </div>

        <div className="p-5 bg-purple-900/10 rounded-3xl border border-purple-500/20">
            <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                <History size={20} /> Archive Old Data
            </h4>
            <p className="text-xs text-neutral-400 mb-4">Compresses history &gt; 1 year into your Starting Balance.</p>
            <button className="w-full bg-purple-900/30 text-purple-400 py-3 rounded-xl font-bold text-xs border border-purple-500/30 hover:bg-purple-900/40">
                Archive Old Transactions
            </button>
        </div>

        <div className="bg-[#171717] p-5 rounded-3xl border border-[#262626] space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Save size={20}/> Financials</h3>
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Starting Balance</label>
                <input 
                    type="number" 
                    value={data.budget.startingBalance} 
                    onChange={(e) => onUpdateBudget('startingBalance', parseFloat(e.target.value))}
                    className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl py-3 px-4 font-bold text-emerald-400 focus:outline-none focus:border-emerald-500" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Elevate Paycheck</label>
                <input 
                    type="number" 
                    value={data.budget.avgIncome} 
                    onChange={(e) => onUpdateBudget('avgIncome', parseFloat(e.target.value))}
                    className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-neutral-500" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Anna Contribution</label>
                <input 
                    type="number" 
                    value={data.budget.annaContrib} 
                    onChange={(e) => onUpdateBudget('annaContrib', parseFloat(e.target.value))}
                    className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl py-3 px-4 font-bold text-white focus:outline-none focus:border-neutral-500" 
                />
            </div>
        </div>

        <button onClick={onReset} className="w-full py-4 text-red-500 font-bold text-xs hover:bg-red-900/10 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Trash2 size={16} /> RESET APP DATA
        </button>
    </div>
  );
};

export default SettingsView;