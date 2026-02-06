import React, { useState } from 'react';
import { AppData, Transaction } from '../types';
import { Plus, X, Trash2 } from 'lucide-react';

interface DreamIslandViewProps {
  data: AppData;
  onExit: () => void;
}

interface HypotheticalExpense {
  id: number;
  name: string;
  amount: number;
  type: 'one-time' | 'recurring';
}

const DreamIslandView: React.FC<DreamIslandViewProps> = ({ data, onExit }) => {
  const [includeFixedBills, setIncludeFixedBills] = useState(true);
  const [includeFoodAnalysis, setIncludeFoodAnalysis] = useState(true);
  const [showForecasted, setShowForecasted] = useState(true);
  const [hypotheticals, setHypotheticals] = useState<HypotheticalExpense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseType, setExpenseType] = useState<'one-time' | 'recurring'>('one-time');

  // Calculate Current Reality
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get transactions for current month
  const monthTx = data.transactions.filter(t => {
    const d = new Date(t.d);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calculate food spending (using same logic as SpendingView)
  const isDining = (t: Transaction) => {
    const text = t.t.toLowerCase();
    const cat = t.c ? t.c.toLowerCase() : "";
    return cat === "dining" || cat === "restaurants" || 
           text.includes("mcdonald") || text.includes("chick-fil-a") || 
           text.includes("starbucks") || text.includes("dunkin") ||
           text.includes("taco") || text.includes("chipotle") ||
           text.includes("burger") || text.includes("pizza") ||
           text.includes("restaurant") || text.includes("doordash");
  };

  const isGroceries = (t: Transaction) => {
    const text = t.t.toLowerCase();
    const cat = t.c ? t.c.toLowerCase() : "";
    return cat === "groceries" || 
           text.includes("harris teeter") || text.includes("food lion") ||
           text.includes("publix") || text.includes("walmart") ||
           text.includes("target") || text.includes("aldi") ||
           text.includes("grocery");
  };

  const diningTotal = monthTx.filter(isDining).reduce((s, t) => s + Math.abs(t.a), 0);
  const groceriesTotal = monthTx.filter(isGroceries).reduce((s, t) => s + Math.abs(t.a), 0);
  const foodTotal = diningTotal + groceriesTotal;

  // Calculate fixed bills total
  const fixedBillsTotal = data.bills.reduce((sum, bill) => sum + bill.amount, 0);

  // Calculate monthly income and expenses
  const monthlyIncome = data.budget.avgIncome + data.budget.annaContrib;
  const monthlyExpenses = fixedBillsTotal;

  // Starting balance
  const startingBalance = data.budget.startingBalance;

  // Calculate current reality totals
  let currentMonthlyOut = 0;
  if (includeFixedBills) currentMonthlyOut += fixedBillsTotal;
  if (includeFoodAnalysis) currentMonthlyOut += foodTotal;

  const currentNetFlow = monthlyIncome - currentMonthlyOut;
  const currentBalance = startingBalance + currentNetFlow;

  // Calculate hypothetical impact
  const hypotheticalOneTime = hypotheticals
    .filter(h => h.type === 'one-time')
    .reduce((sum, h) => sum + h.amount, 0);
  
  const hypotheticalRecurring = hypotheticals
    .filter(h => h.type === 'recurring')
    .reduce((sum, h) => sum + h.amount, 0);

  const newMonthlyOut = currentMonthlyOut + hypotheticalRecurring;
  const newNetFlow = monthlyIncome - newMonthlyOut;
  const newBalance = currentBalance - hypotheticalOneTime + newNetFlow;
  const difference = newBalance - currentBalance;

  // Add hypothetical expense
  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const amount = parseFloat(formData.get('amount') as string);

    if (name && amount > 0) {
      setHypotheticals([...hypotheticals, {
        id: Date.now(),
        name,
        amount,
        type: expenseType
      }]);
      setIsAddingExpense(false);
    }
  };

  const handleDelete = (id: number) => {
    setHypotheticals(hypotheticals.filter(h => h.id !== id));
  };

  const handleReset = () => {
    setHypotheticals([]);
    setIncludeFixedBills(true);
    setIncludeFoodAnalysis(true);
    setShowForecasted(true);
  };

  const handleExitWithPrompt = () => {
    if (hypotheticals.length > 0) {
      const takeScreenshot = confirm("📸 Save a screenshot before resetting?\n\nTap OK to take a screenshot, or Cancel to just exit.");
      if (takeScreenshot) {
        alert("📸 Take a screenshot now!\n\nAfter you capture your screen, the page will reset.");
      }
    }
    handleReset();
    onExit();
  };

  // Arcade Button Component
  const ArcadeButton: React.FC<{ label: string; isOn: boolean; onClick: () => void; colorScheme: 'green' | 'orange' | 'purple' }> = 
    ({ label, isOn, onClick, colorScheme }) => {
      const styles = {
        green: {
          on: 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]',
          button: 'bg-emerald-500 border-emerald-600'
        },
        orange: {
          on: 'bg-orange-900/40 border-orange-500/50 shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)]',
          button: 'bg-orange-500 border-orange-600'
        },
        purple: {
          on: 'bg-purple-900/40 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]',
          button: 'bg-purple-500 border-purple-600'
        }
      };

      return (
        <button
          onClick={onClick}
          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
            isOn 
              ? styles[colorScheme].on
              : 'bg-neutral-900 border-neutral-700'
          }`}
        >
          <div className={`w-8 h-8 rounded-full border-4 transition-all ${
            isOn 
              ? `${styles[colorScheme].button} shadow-inner`
              : 'bg-neutral-800 border-neutral-700'
          }`} />
          <span className={`font-bold text-sm ${isOn ? 'text-white' : 'text-neutral-500'}`}>
            {label}
          </span>
        </button>
      );
    };

  return (
    <div className="min-h-[100dvh] pb-24 bg-black">
      {/* Header */}
      <div className="pt-4 px-1 pb-4 flex justify-between items-center bg-black sticky top-0 z-50 border-b border-purple-900/30">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <span className="text-3xl">🏝️</span> My Dream Island
        </h2>
        <button 
          onClick={handleExitWithPrompt}
          className="p-2 bg-neutral-800 rounded-xl text-white hover:bg-neutral-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 px-1 pt-4">
        {/* Current Reality Section */}
        <div className="bg-[#171717] border border-[#262626] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Current Reality</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">Balance</span>
              <span className="text-2xl font-black text-white">${currentBalance.toFixed(2)}</span>
            </div>
            <div className="h-px bg-neutral-800"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-400 font-medium">Monthly In</span>
              <span className="text-emerald-400 font-bold">${monthlyIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-400 font-medium">Monthly Out</span>
              <span className="text-red-400 font-bold">${currentMonthlyOut.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Arcade Toggle Buttons */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">Include in Calculations</h3>
          <ArcadeButton 
            label="Fixed Bills"
            isOn={includeFixedBills}
            onClick={() => setIncludeFixedBills(!includeFixedBills)}
            colorScheme="green"
          />
          <ArcadeButton 
            label="Food Analysis"
            isOn={includeFoodAnalysis}
            onClick={() => setIncludeFoodAnalysis(!includeFoodAnalysis)}
            colorScheme="orange"
          />
          <ArcadeButton 
            label="Show Forecasted Expenses"
            isOn={showForecasted}
            onClick={() => setShowForecasted(!showForecasted)}
            colorScheme="purple"
          />
        </div>

        {/* Hypothetical Transactions Section */}
        <div className="bg-[#171717] border border-[#262626] rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Hypothetical Expenses</h3>
          
          <div className="space-y-2 mb-4">
            <button
              onClick={() => { setExpenseType('one-time'); setIsAddingExpense(true); }}
              className="w-full p-3 bg-purple-900/20 border border-purple-500/30 text-purple-400 font-bold rounded-xl hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add One-Time Expense
            </button>
            <button
              onClick={() => { setExpenseType('recurring'); setIsAddingExpense(true); }}
              className="w-full p-3 bg-orange-900/20 border border-orange-500/30 text-orange-400 font-bold rounded-xl hover:bg-orange-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Recurring Expense
            </button>
          </div>

          {/* List of hypotheticals */}
          {hypotheticals.length > 0 ? (
            <div className="space-y-2">
              {hypotheticals.map(h => (
                <div key={h.id} className="flex justify-between items-center p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div>
                    <p className="text-white font-bold text-sm">{h.name}</p>
                    <p className={`text-xs font-bold ${h.type === 'one-time' ? 'text-purple-400' : 'text-orange-400'}`}>
                      {h.type === 'one-time' ? 'One-Time' : 'Monthly'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-black">-${h.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-600 text-sm py-4">No hypothetical expenses added yet</p>
          )}
        </div>

        {/* With Hypotheticals Section */}
        <div className="bg-gradient-to-br from-purple-900/20 to-orange-900/20 border-2 border-purple-500/30 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">With Hypotheticals</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">New Balance</span>
              <span className="text-3xl font-black text-white">${newBalance.toFixed(2)}</span>
            </div>
            <div className="h-px bg-neutral-800"></div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm">Difference</span>
              <span className={`text-2xl font-black ${difference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {difference >= 0 ? '+' : ''}{difference.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full py-4 bg-neutral-900 border border-neutral-700 text-neutral-400 font-bold rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={18} /> Reset All
        </button>
      </div>

      {/* Add Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#171717] border border-[#262626] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                Add {expenseType === 'one-time' ? 'One-Time' : 'Recurring'} Expense
              </h3>
              <button onClick={() => setIsAddingExpense(false)} className="text-neutral-500 hover:text-white">
                <X />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input
                name="name"
                type="text"
                placeholder="Expense name (e.g., 'Puppy supplies')"
                required
                className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
              />
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount"
                required
                className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
              >
                Add Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamIslandView;
