import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import RentView from './components/RentView';
import SpendingView from './components/SpendingView';
import DebtView from './components/DebtView';
import TransactionsView from './components/TransactionsView';
import SettingsView from './components/SettingsView';
import FunView from './components/FunView';
import { AppData, INITIAL_DATA, TabType, Transaction, Bill } from './types';
import { X, Check, Trash2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

interface ImportConflict {
  newTx: Transaction;
  existingTx: Transaction;
}

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = Current, 1 = Last, -1 = Next
  
  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Import Conflict State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importQueue, setImportQueue] = useState<Transaction[]>([]);
  const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);

  // Logo Interaction State
  const [logoText, setLogoText] = useState("CRC");
  const logoTimeoutRef = useRef<number | null>(null);
  const emojiIndexRef = useRef(0);
  const moneyEmojis = ["💵", "💸", "🤑", "💰", "💲"];

  const handleLogoClick = () => {
    if (logoTimeoutRef.current) {
      clearTimeout(logoTimeoutRef.current);
    }
    
    const emoji = moneyEmojis[emojiIndexRef.current];
    setLogoText(emoji);
    
    emojiIndexRef.current = (emojiIndexRef.current + 1) % moneyEmojis.length;

    logoTimeoutRef.current = window.setTimeout(() => {
      setLogoText("CRC");
      logoTimeoutRef.current = null;
    }, 1500);
  };

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('moneyflow_data_v35');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('moneyflow_data_v35', JSON.stringify(data));
  }, [data]);

  // Actions
  const handleUpdateRent = (val: number) => {
    setData(prev => ({ ...prev, budget: { ...prev.budget, rentTotal: val } }));
  };

  const handleUpdateBudget = (key: string, val: number) => {
    setData(prev => ({ ...prev, budget: { ...prev.budget, [key]: val } }));
  };

  const handleReset = () => {
    if(confirm("Reset all data?")) {
      setData(INITIAL_DATA);
      localStorage.removeItem('moneyflow_data_v35');
    }
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n');
      const parsedTxs: Transaction[] = [];
      
      // Attempt to identify headers
      const headerLine = lines.find(l => l.toLowerCase().includes('date') && l.toLowerCase().includes('description'));
      const startIndex = headerLine ? lines.indexOf(headerLine) + 1 : 0;
      
      let dateIdx = 0, descIdx = 2, amtIdx = 5; 
      
      if (headerLine) {
          const headers = headerLine.toLowerCase().split(',').map(h => h.replace(/^"|"$/g, '').trim());
          const dIdx = headers.findIndex(h => h.includes('date'));
          const descIdxFound = headers.findIndex(h => h.includes('description'));
          const amtIdxFound = headers.findIndex(h => h.includes('amount'));
          
          if(dIdx !== -1) dateIdx = dIdx;
          if(descIdxFound !== -1) descIdx = descIdxFound;
          if(amtIdxFound !== -1) amtIdx = amtIdxFound;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        
        if (cols.length < 3) continue;

        let dateStr = cols[dateIdx];
        let desc = cols[descIdx];
        let amountStr = cols[amtIdx];

        if (!dateStr || !amountStr || isNaN(parseFloat(amountStr))) continue;

        const parts = dateStr.split('/');
        if(parts.length !== 3) continue;
        const isoDate = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
        
        const amount = parseFloat(amountStr);
        
        let cat = 'Other';
        const lowerDesc = desc.toLowerCase();
        
        // --- CATEGORIZATION RULES ---

        // 1. Strict Rent Rules for Flex
        if (lowerDesc.includes('flex finance') || lowerDesc.includes('getflex.com')) {
             if (Math.abs(amount) === 500 || Math.abs(amount) === 400) {
                 cat = 'Rent';
             } else {
                 cat = 'Rent'; // Default to rent if name matches, even if amount varies slightly
             }
        }
        // 2. Bills (Match against configured Bills)
        else {
            const billMatch = data.bills.find(b => lowerDesc.includes(b.name.toLowerCase()));
            if (billMatch) {
                // If it looks like a loan or card, call it Debt, otherwise Bills
                if (['loan', 'card', 'finance', 'chase', 'amex', 'citi', 'synchrony'].some(k => billMatch.name.toLowerCase().includes(k))) {
                    cat = 'Debt';
                } else {
                    cat = 'Bills';
                }
            }
            // 3. Specific Subscriptions/Services
            else if (['youtube', 'google *disney', 'google *youtube', 'google play', 'google storage', 'google *svcs', 'disney+', 'hulu', 'netflix', 'spotify', 'apple.com/bill'].some(k => lowerDesc.includes(k))) {
                cat = 'Bills';
            }
            // 3.5 For Fun
            else if (['steam', 'playstation', 'xbox', 'nintendo', 'game', 'amc', 'regal', 'cinema', 'movie', 'ticket', 'stubhub', 'seatgeek', 'eventbrite', 'golf', 'bowling', 'entertainment', 'hobby', 'toy', 'lego', 'party', 'club', 'vape', 'smoke', 'dispensary'].some(k => lowerDesc.includes(k))) {
                cat = 'For Fun';
            }
            // 4. Debt Keywords
            else if (['loan', 'payment', 'credit card', 'chase', 'amex', 'citi', 'discover', 'capital one', 'synchrony', 'affirm'].some(k => lowerDesc.includes(k))) {
                cat = 'Debt';
            }
            // 5. Rent Keywords (General)
            else if (['rent', 'lease', 'apartment', 'property'].some(k => lowerDesc.includes(k))) {
                cat = 'Rent';
            }
            // 6. Dining Logic
            else if (['restaurant', 'cafe', 'coffee', 'starbucks', 'dunkin', 'mcdonalds', 'chick-fil-a', 'burger', 'taco', 'chipotle', 'pizza', 'eats', 'doordash', 'grubhub', 'uber eats', 'grill', 'bistro', 'steak', 'bar', 'dominos', 'bagel', 'ny bagel', 'dd/br', 'kfc', 'popeyes', 'wendy', 'sonic', 'subway', 'jersey mike', 'panera', 'sushi', 'diner'].some(k => lowerDesc.includes(k))) {
                cat = 'Dining';
            } 
            // 7. Grocery Logic
            else if (['grocery', 'market', 'kroger', 'whole foods', 'trader joe', 'publix', 'heb', 'harris teeter', 'wegmans', 'aldi', 'lidl', 'walmart', 'target', 'food lion', 'safeway', 'bj\'s', 'wholesale', 'sam\'s club', 'samsclub', 'sams club', 'costco', 'meijer', 'walgreens', 'cvs'].some(k => lowerDesc.includes(k))) {
                cat = 'Groceries';
            }
            // 8. Income Logic
            else if (['payroll', 'deposit', 'salary', 'elevate'].some(k => lowerDesc.includes(k))) {
                cat = 'Income';
            }
            // 9. P2P Logic
            else if (['venmo', 'zelle', 'cash app', 'paypal'].some(k => lowerDesc.includes(k))) {
                cat = amount > 0 ? 'Income' : 'Other'; 
            }
        }

        parsedTxs.push({
            id: Date.now() + i, 
            d: isoDate,
            t: desc,
            a: amount,
            c: cat
        });
      }

      // --- DUPLICATE DETECTION LOGIC ---
      const newQueue: Transaction[] = [];
      const conflicts: ImportConflict[] = [];

      parsedTxs.forEach(newTx => {
          const newDate = new Date(newTx.d).getTime();
          
          const match = data.transactions.find(existing => {
              const exDate = new Date(existing.d).getTime();
              const diffTime = Math.abs(newDate - exDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              return existing.a === newTx.a && diffDays <= 4;
          });

          if (match) {
              if (match.t === newTx.t && match.d === newTx.d) return; 
              conflicts.push({ newTx, existingTx: match });
          } else {
              newQueue.push(newTx);
          }
      });

      if (conflicts.length > 0) {
          setImportQueue(newQueue);
          setImportConflicts(conflicts);
          setIsImportModalOpen(true);
      } else if (newQueue.length > 0) {
          setData(prev => ({
              ...prev,
              transactions: [...prev.transactions, ...newQueue]
          }));
          alert(`Successfully imported ${newQueue.length} transactions.`);
      } else {
          alert("All transactions were duplicates or invalid.");
      }
    };
    reader.readAsText(file);
  };

  const resolveConflict = (conflict: ImportConflict, action: 'keep_old' | 'replace' | 'keep_both') => {
      if (action === 'replace') {
          setData(prev => ({
              ...prev,
              transactions: prev.transactions.map(t => t.id === conflict.existingTx.id ? { ...conflict.newTx, id: conflict.existingTx.id } : t)
          }));
      } else if (action === 'keep_both') {
          setData(prev => ({
              ...prev,
              transactions: [...prev.transactions, conflict.newTx]
          }));
      }
      const remaining = importConflicts.filter(c => c.newTx.id !== conflict.newTx.id);
      setImportConflicts(remaining);
      
      if (remaining.length === 0) {
          setData(prev => ({
              ...prev,
              transactions: [...prev.transactions, ...importQueue]
          }));
          setIsImportModalOpen(false);
          setImportQueue([]);
          alert("Import complete!");
      }
  };

  const resolveAll = (action: 'keep_old' | 'replace') => {
      if (action === 'replace') {
          const updates = new Map();
          importConflicts.forEach(c => {
             updates.set(c.existingTx.id, { ...c.newTx, id: c.existingTx.id });
          });
          
          setData(prev => ({
              ...prev,
              transactions: [
                  ...prev.transactions.map(t => updates.has(t.id) ? updates.get(t.id) : t),
                  ...importQueue
              ]
          }));
      } else {
           setData(prev => ({
              ...prev,
              transactions: [...prev.transactions, ...importQueue]
          }));
      }
      setIsImportModalOpen(false);
      setImportQueue([]);
      setImportConflicts([]);
  };

  const saveTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const date = (form.elements.namedItem('date') as HTMLInputElement).value;
      const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
      const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value);
      const cat = (form.elements.namedItem('cat') as HTMLSelectElement).value;

      if(editingTx) {
          setData(prev => ({
              ...prev,
              transactions: prev.transactions.map(t => t.id === editingTx.id ? { ...t, d: date, t: desc, a: amt, c: cat } : t)
          }));
      } else {
          setData(prev => ({
              ...prev,
              transactions: [...prev.transactions, { id: Date.now(), d: date, t: desc, a: amt, c: cat }]
          }));
      }
      setIsTxModalOpen(false);
      setEditingTx(null);
  };

  const deleteTransaction = () => {
      if(editingTx && confirm("Delete?")) {
          setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== editingTx.id) }));
          setIsTxModalOpen(false);
          setEditingTx(null);
      }
  };
  
  const saveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value);
    const day = parseInt((form.elements.namedItem('day') as HTMLInputElement).value);

    if (editingBill) {
        setData(prev => ({
            ...prev,
            bills: prev.bills.map(b => b.id === editingBill.id ? { ...b, name, amount, day } : b)
        }));
    } else {
        setData(prev => ({
            ...prev,
            bills: [...prev.bills, { id: Date.now(), name, amount, day }]
        }));
    }
    setIsBillModalOpen(false);
    setEditingBill(null);
  };

  const deleteBill = () => {
      if(editingBill && confirm("Delete Bill?")) {
          setData(prev => ({ ...prev, bills: prev.bills.filter(b => b.id !== editingBill.id) }));
          setIsBillModalOpen(false);
          setEditingBill(null);
      }
  };

  const toggleBillPaid = () => {
      if(!editingBill) return;
      const d = new Date();
      d.setMonth(d.getMonth() - monthOffset); 
      const viewingMonthKey = d.getFullYear() + '-' + d.getMonth();
      
      const isPaid = editingBill.manualPaid?.includes(viewingMonthKey);
      
      let newPaid = editingBill.manualPaid || [];
      if(isPaid) newPaid = newPaid.filter(m => m !== viewingMonthKey);
      else newPaid = [...newPaid, viewingMonthKey];
      
      const updatedBill = { ...editingBill, manualPaid: newPaid };
      setData(prev => ({
          ...prev,
          bills: prev.bills.map(b => b.id === editingBill.id ? updatedBill : b)
      }));
      setEditingBill(updatedBill);
  };

  const handleToggleBillId = (id: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    const viewingMonthKey = `${d.getFullYear()}-${d.getMonth()}`;
    
    setData(prev => ({
        ...prev,
        bills: prev.bills.map(b => {
            if(b.id !== id) return b;
            const isPaid = b.manualPaid?.includes(viewingMonthKey);
            let newPaid = b.manualPaid || [];
            if(isPaid) newPaid = newPaid.filter(m => m !== viewingMonthKey);
            else newPaid = [...newPaid, viewingMonthKey];
            return { ...b, manualPaid: newPaid };
        })
    }));
  };

  return (
    <div className="h-full flex flex-col bg-black text-white font-sans selection:bg-blue-500/30">
      <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-black/90 backdrop-blur-md z-20 border-b border-white/5 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogoClick}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-[0_4px_10px_rgba(255,255,255,0.1)] active:scale-90 transition-transform hover:bg-neutral-200 cursor-pointer"
          >
            <span className={`font-black ${logoText === 'CRC' ? 'text-xs tracking-tighter' : 'text-xl'}`}>{logoText}</span>
          </button>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none">C-Lo's</h1>
            <h2 className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Dinero Flow</h2>
          </div>
        </div>
        <button onClick={() => setActiveTab('settings')} className="p-1 rounded-full border border-neutral-700 bg-neutral-900 transition-transform active:scale-95">
           <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 font-bold text-xs">CC</div>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto w-full relative z-10 px-4 pt-4 scroll-smooth">
        <div className="max-w-lg mx-auto">
          {activeTab === 'dashboard' && <DashboardView data={data} onSwitchTab={setActiveTab} onOpenTxModal={() => { setEditingTx(null); setIsTxModalOpen(true); }} />}
          
          {activeTab === 'calendar' && 
            <CalendarView 
                data={data} 
                monthOffset={monthOffset}
                setMonthOffset={setMonthOffset}
                onOpenBillModal={(b) => { setEditingBill(b || null); setIsBillModalOpen(true); }} 
            />
          }
          
          {activeTab === 'rent' && <RentView data={data} onUpdateRent={handleUpdateRent} onTogglePaid={handleToggleBillId} monthOffset={monthOffset} />}
          
          {activeTab === 'spending' && 
            <SpendingView 
                data={data} 
                monthOffset={monthOffset}
                setMonthOffset={setMonthOffset}
                onOpenTxModal={(t) => { setEditingTx(t || null); setIsTxModalOpen(true); }}
            />
          }
          
          {activeTab === 'debt' && <DebtView />}
          
          {activeTab === 'transactions' && 
            <TransactionsView 
                data={data} 
                monthOffset={monthOffset}
                setMonthOffset={setMonthOffset}
                onOpenTxModal={(t) => { setEditingTx(t || null); setIsTxModalOpen(true); }} 
            />
          }
          
          {activeTab === 'fun' && 
            <FunView 
                data={data} 
                monthOffset={monthOffset}
                setMonthOffset={setMonthOffset}
                onOpenTxModal={(t) => { setEditingTx(t || null); setIsTxModalOpen(true); }}
                onBack={() => setActiveTab('dashboard')}
            />
          }

          {activeTab === 'settings' && <SettingsView data={data} onUpdateBudget={handleUpdateBudget} onReset={handleReset} onImport={handleImportCSV} />}
        </div>
      </main>

      <Navbar activeTab={activeTab} onSwitch={setActiveTab} />

      {/* Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#171717] border border-[#262626] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-lg text-white">{editingTx ? 'Edit Transaction' : 'New Transaction'}</h3>
               <button onClick={() => setIsTxModalOpen(false)} className="text-neutral-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={saveTransaction} className="space-y-4">
               <input name="date" type="date" required defaultValue={editingTx?.d || new Date().toISOString().split('T')[0]} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
               <input name="desc" type="text" placeholder="Description" required defaultValue={editingTx?.t || ''} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
               <div className="grid grid-cols-2 gap-4">
                  <input name="amt" type="number" step="0.01" placeholder="Amount" required defaultValue={editingTx?.a || ''} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                  <select name="cat" defaultValue={editingTx?.c || 'Dining'} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500">
                    <option>Dining</option><option>Groceries</option><option>For Fun</option><option>Rent</option><option>Bills</option><option>Debt</option><option>Income</option><option>Other</option>
                  </select>
               </div>
               <div className="flex gap-2 pt-2">
                 <button type="submit" className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors">Save</button>
                 {editingTx && <button type="button" onClick={deleteTransaction} className="flex-1 bg-red-900/20 text-red-400 border border-red-900/30 py-3 rounded-xl font-bold flex items-center justify-center"><Trash2 size={18} /></button>}
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#171717] border border-[#262626] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-lg text-white">{editingBill ? (editingBill.id ? 'Edit Bill' : 'New Bill') : 'New Bill'}</h3>
               <button onClick={() => setIsBillModalOpen(false)} className="text-neutral-500 hover:text-white"><X /></button>
            </div>
            
            {editingBill && editingBill.id && (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 mb-4">
                   <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-neutral-500 font-bold uppercase">Status</span>
                        {(() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - monthOffset);
                            const key = `${d.getFullYear()}-${d.getMonth()}`;
                            return editingBill.manualPaid?.includes(key)
                                ? <span className="text-xs font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded">PAID</span>
                                : <span className="text-xs font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded">UNPAID</span>
                        })()}
                   </div>
                   <button type="button" onClick={toggleBillPaid} className="w-full py-2 bg-blue-600/20 text-blue-400 font-bold text-xs rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors">
                       Toggle Paid Status (Viewing Month)
                   </button>
                </div>
            )}

            <form onSubmit={saveBill} className="space-y-4">
               <input name="name" type="text" placeholder="Bill Name" required defaultValue={editingBill?.name || ''} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
               <input name="amount" type="number" step="0.01" placeholder="Amount" required defaultValue={editingBill?.amount || ''} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
               <input name="day" type="number" min="1" max="31" placeholder="Day of Month" required defaultValue={editingBill?.day || ''} className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
               
               <div className="flex gap-2 pt-2">
                 <button type="submit" className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"><Check size={18}/> Save</button>
                 {editingBill && editingBill.id && <button type="button" onClick={deleteBill} className="flex-1 bg-red-900/20 text-red-400 border border-red-900/30 py-3 rounded-xl font-bold flex items-center justify-center"><Trash2 size={18} /></button>}
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Conflict Modal */}
      {isImportModalOpen && importConflicts.length > 0 && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-[#171717] border border-[#262626] rounded-3xl w-full max-w-lg p-6 flex flex-col max-h-[85vh] shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                      <div className="bg-yellow-900/30 p-2 rounded-lg text-yellow-500">
                          <AlertTriangle size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-lg text-white">Import Conflicts</h3>
                          <p className="text-xs text-neutral-400">{importConflicts.length} potential duplicates found</p>
                      </div>
                  </div>
                  <button onClick={() => { setIsImportModalOpen(false); setImportQueue([]); }} className="text-neutral-500 hover:text-white"><X /></button>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2 mb-4 pb-4 border-b border-neutral-800">
                  <button onClick={() => resolveAll('keep_old')} className="flex-1 py-2 text-xs font-bold text-neutral-400 bg-neutral-900 rounded-lg hover:bg-neutral-800 border border-neutral-700">
                      Keep All Originals
                  </button>
                  <button onClick={() => resolveAll('replace')} className="flex-1 py-2 text-xs font-bold text-emerald-400 bg-emerald-900/20 rounded-lg hover:bg-emerald-900/30 border border-emerald-900/50">
                      Replace All (Update)
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
                  {importConflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center mb-4">
                              {/* Existing */}
                              <div className="text-left opacity-70">
                                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Existing</p>
                                  <p className="text-xs text-white font-medium truncate">{conflict.existingTx.t}</p>
                                  <p className="text-xs text-neutral-400 font-mono">{conflict.existingTx.d}</p>
                              </div>
                              
                              <div className="text-neutral-600"><ArrowRight size={16} /></div>

                              {/* New */}
                              <div className="text-right">
                                  <p className="text-[10px] font-bold text-emerald-500 uppercase">New Import</p>
                                  <p className="text-xs text-white font-medium truncate">{conflict.newTx.t}</p>
                                  <p className="text-xs text-neutral-400 font-mono">{conflict.newTx.d}</p>
                              </div>
                          </div>
                          
                          <div className="text-center mb-3">
                              <span className="text-xl font-bold text-white">${conflict.newTx.a.toFixed(2)}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => resolveConflict(conflict, 'keep_old')} className="py-2 bg-neutral-800 rounded-lg text-[10px] font-bold text-neutral-300 hover:bg-neutral-700">
                                  Keep Old
                              </button>
                              <button onClick={() => resolveConflict(conflict, 'replace')} className="py-2 bg-emerald-900/30 border border-emerald-900/50 rounded-lg text-[10px] font-bold text-emerald-400 hover:bg-emerald-900/50">
                                  Replace
                              </button>
                              <button onClick={() => resolveConflict(conflict, 'keep_both')} className="py-2 bg-blue-900/20 border border-blue-900/50 rounded-lg text-[10px] font-bold text-blue-400 hover:bg-blue-900/40">
                                  Keep Both
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default App;