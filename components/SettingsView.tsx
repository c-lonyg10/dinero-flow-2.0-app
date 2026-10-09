import React, { useRef, useState } from 'react';
import { AppData } from '../types';
import { Settings, RefreshCw, Download, Trash2, LogOut, History, Wallet, FileText, Cloud, Smartphone, Bell } from 'lucide-react';
import { setHapticSettings, triggerHaptic, HapticIntensity } from '../haptics';
import { setNotificationSettings, requestNotificationPermission } from '../notifications';

interface SettingsViewProps {
  data: AppData;
  onUpdateBudget: (key: string, val: number) => void;
  onReset: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onRestore: (file: File) => void;
  onArchive: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    data, 
    onUpdateBudget, 
    onReset, 
    onImport, 
    onExport, 
    onRestore, 
    onArchive,
    onLogout, 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // 1. Group all useState hooks at the top with resilient lazy initializers
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dinero_haptics_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [hapticIntensity, setHapticIntensityState] = useState<HapticIntensity>(() => {
    try {
      return (localStorage.getItem('dinero_haptic_intensity') as HapticIntensity) || 'light';
    } catch {
      return 'light';
    }
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dinero_notifications_enabled') === 'true';
    } catch {
      return false;
    }
  });

  // 2. Handlers
  const toggleHaptics = () => {
    const nextState = !hapticsEnabled;
    setHapticsEnabledState(nextState);
    setHapticSettings(nextState, hapticIntensity);
    if (nextState) {
      triggerHaptic(hapticIntensity);
    }
  };

  const changeIntensity = (level: HapticIntensity) => {
    setHapticIntensityState(level);
    setHapticSettings(hapticsEnabled, level);
    triggerHaptic(level);
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please grant notification permission in your Android settings to receive bill reminders.');
        return;
      }
      setNotificationsEnabled(true);
      setNotificationSettings(true);
      triggerHaptic('light');
    } else {
      setNotificationsEnabled(false);
      setNotificationSettings(false);
      triggerHaptic('light');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      e.target.value = ''; 
    }
  };

  const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          alert(`File Selected: ${file.name}\nSize: ${file.size} bytes\n\nStarting restore...`);
          onRestore(file);
          e.target.value = ''; 
      }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="text-neutral-400" size={32} /> Settings
        </h2>

        {/* 1. IMPORT CARD (GREEN) */}
        <div className="p-5 rounded-3xl border border-emerald-900/30 bg-emerald-950/20 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
                <FileText className="text-emerald-500" size={24} />
                <h3 className="font-bold text-lg text-white">Import Chase CSV</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">Import transactions from your bank to populate analytics.</p>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-900/60 transition-colors"
            >
                Select CSV File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
        </div>

        {/* 2. BACKUP & RESTORE CARD (BLUE) */}
        <div className="p-5 rounded-3xl border border-blue-900/30 bg-blue-950/20 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
                <Cloud className="text-blue-500" size={24} />
                <h3 className="font-bold text-lg text-white">Backup & Restore</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">Save your data locally or restore from a file.</p>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-900/40 border border-blue-500/30 text-blue-400 font-bold rounded-xl hover:bg-blue-900/60 transition-colors"
                >
                    <Download size={18} /> Download
                </button>
                <button 
                    onClick={() => restoreInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 bg-neutral-800 border border-neutral-700 text-white font-bold rounded-xl hover:bg-neutral-700 transition-colors"
                >
                    <RefreshCw size={18} /> Restore
                </button>
            </div>
            <input type="file" ref={restoreInputRef} onChange={handleRestoreChange} className="hidden" />
        </div>

        {/* 3. ARCHIVE CARD (PURPLE) */}
        <div className="p-5 rounded-3xl border border-purple-900/30 bg-purple-950/20 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
                <History className="text-purple-500" size={24} />
                <h3 className="font-bold text-lg text-white">Archive Old Data</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">Compresses history &gt; 1 year into your Starting Balance.</p>
            <button 
                onClick={onArchive}
                className="w-full py-3 bg-purple-900/40 border border-purple-500/30 text-purple-400 font-bold rounded-xl hover:bg-purple-900/60 transition-colors"
            >
                Archive Old Transactions
            </button>
        </div>

        {/* 4. FINANCIALS (NEUTRAL) */}
        <div className="bg-[#171717] border border-[#262626] rounded-3xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-[#262626] flex items-center gap-2 bg-[#262626]/50">
                <Wallet size={18} className="text-neutral-400"/>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">Financials</h3>
            </div>
            <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Starting Balance</label>
                    <input 
                        type="number" 
                        value={data.budget.startingBalance} 
                        onChange={(e) => onUpdateBudget('startingBalance', parseFloat(e.target.value) || 0)}
                        className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-4 text-xl font-bold text-white focus:outline-none focus:border-blue-500" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Expected Monthly Income</label>
                    <input 
                        type="number" 
                        value={data.budget.avgIncome} 
                        onChange={(e) => onUpdateBudget('avgIncome', parseFloat(e.target.value) || 0)}
                        className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-4 text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500" 
                    />
                 </div>
            </div>
        </div>

        {/* 5. DEVICE & HAPTICS CARD (CYAN) */}
        <div className="p-5 rounded-3xl border border-cyan-900/30 bg-cyan-950/20 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Smartphone className="text-cyan-400" size={24} />
                    <div>
                        <h3 className="font-bold text-lg text-white">Haptic Vibration</h3>
                        <p className="text-xs text-neutral-400">Tactile buzz on taps, toggles & payments</p>
                    </div>
                </div>
                <button
                    onClick={toggleHaptics}
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${hapticsEnabled ? 'bg-cyan-500 justify-end' : 'bg-neutral-800 justify-start'}`}
                >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md"></div>
                </button>
            </div>

            {hapticsEnabled && (
                <div className="mt-4 pt-3 border-t border-cyan-900/40">
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Intensity</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['light', 'medium', 'heavy'] as HapticIntensity[]).map((level) => (
                            <button
                                key={level}
                                onClick={() => changeIntensity(level)}
                                className={`py-2 text-xs font-bold rounded-xl capitalize transition-colors ${
                                    hapticIntensity === level
                                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                        : 'bg-neutral-900/80 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* 6. BILL NOTIFICATIONS CARD (INDIGO) */}
        <div className="p-5 rounded-3xl border border-indigo-900/30 bg-indigo-950/20 shadow-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bell className="text-indigo-400" size={24} />
                    <div>
                        <h3 className="font-bold text-lg text-white">Bill Reminders</h3>
                        <p className="text-xs text-neutral-400">Alerts at 9:00 AM (24 hrs prior & day-of)</p>
                    </div>
                </div>
                <button
                    onClick={handleToggleNotifications}
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-indigo-500 justify-end' : 'bg-neutral-800 justify-start'}`}
                >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md"></div>
                </button>
            </div>
        </div>

        {/* Logout Button */}
        <button
            onClick={onLogout}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
            🚪 Logout
        </button>

        {/* FACTORY RESET */}
        <button 
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-900/10 rounded-xl transition-colors"
        >
            <Trash2 size={16} /> Factory Reset App Data
        </button>

        {/* FOOTER */}
        <div className="text-center text-neutral-600 text-[10px] py-4">
            <p className="font-bold text-emerald-500">Dinero Flow v3.8 (Unlocked)</p>
            <p>Designed for C-Lo</p>
        </div>
    </div>
  );
};

export default SettingsView;