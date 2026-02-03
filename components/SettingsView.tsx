import React, { useRef } from 'react';
import { AppData } from '../types';
import { Settings, RefreshCw, Upload, Download, Trash2, Github, LogOut } from 'lucide-react';

interface SettingsViewProps {
  data: AppData;
  onUpdateBudget: (key: string, val: number) => void;
  onReset: () => void;
  onImport: (file: File) => void;
  // New Props
  onExport: () => void;
  onRestore: (file: File) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ data, onUpdateBudget, onReset, onImport, onExport, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onRestore(e.target.files[0]);
      }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="text-neutral-400" size={32} /> Settings
        </h2>

        {/* Budget Section */}
        <div className="bg-[#171717] border border-[#262626] rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-[#262626] bg-[#262626]/50">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">Fixed Monthly Income</h3>
            </div>
            <div className="p-6">
                 <div className="mb-4">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Starting Balance</label>
                    <input 
                        type="number" 
                        value={data.budget.startingBalance} 
                        onChange={(e) => onUpdateBudget('startingBalance', parseFloat(e.target.value) || 0)}
                        className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-4 text-2xl font-bold text-white focus:outline-none focus:border-blue-500" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Expected Monthly Income</label>
                    <input 
                        type="number" 
                        value={data.budget.avgIncome} 
                        onChange={(e) => onUpdateBudget('avgIncome', parseFloat(e.target.value) || 0)}
                        className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-4 text-2xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500" 
                    />
                 </div>
            </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-[#171717] border border-[#262626] rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-[#262626] bg-[#262626]/50">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">Data Management</h3>
            </div>
            <div className="p-2">
                {/* Import Chase CSV */}
                <div onClick={() => fileInputRef.current?.click()} className="p-4 hover:bg-neutral-800 rounded-2xl cursor-pointer flex items-center gap-4 transition-colors group">
                    <div className="bg-blue-900/20 p-3 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Import Chase CSV</h4>
                        <p className="text-xs text-neutral-500">Add transactions from your bank export</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".csv" 
                        className="hidden" 
                    />
                </div>

                {/* Backup Data */}
                <div onClick={onExport} className="p-4 hover:bg-neutral-800 rounded-2xl cursor-pointer flex items-center gap-4 transition-colors group">
                    <div className="bg-emerald-900/20 p-3 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                        <Download size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Backup Data</h4>
                        <p className="text-xs text-neutral-500">Download a full backup file (.json)</p>
                    </div>
                </div>

                {/* Restore Data */}
                <div onClick={() => restoreInputRef.current?.click()} className="p-4 hover:bg-neutral-800 rounded-2xl cursor-pointer flex items-center gap-4 transition-colors group">
                    <div className="bg-purple-900/20 p-3 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                        <RefreshCw size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Restore Backup</h4>
                        <p className="text-xs text-neutral-500">Load data from a backup file</p>
                    </div>
                    <input 
                        type="file" 
                        ref={restoreInputRef} 
                        onChange={handleRestoreChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>

                <div className="h-px bg-[#262626] mx-4 my-2"></div>

                {/* Factory Reset */}
                <div onClick={onReset} className="p-4 hover:bg-red-900/10 rounded-2xl cursor-pointer flex items-center gap-4 transition-colors group">
                    <div className="bg-red-900/20 p-3 rounded-xl text-red-400 group-hover:scale-110 transition-transform">
                        <Trash2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-400">Factory Reset</h4>
                        <p className="text-xs text-red-500/50">Wipe all data and start over</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Info */}
        <div className="text-center text-neutral-600 text-xs py-4 space-y-2">
            <p className="font-bold">Dinero Flow v3.5</p>
            <p>Designed for C-Lo</p>
            <div className="flex justify-center gap-4 mt-2">
                 <a href="#" className="flex items-center gap-1 hover:text-white transition-colors"><Github size={12}/> Source</a>
                 <a href="#" className="flex items-center gap-1 hover:text-white transition-colors"><LogOut size={12}/> Sign Out</a>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;