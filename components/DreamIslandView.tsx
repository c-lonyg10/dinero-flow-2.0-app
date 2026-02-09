import React, { useState } from 'react';
import { AppData, Transaction } from '../types';
import { Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface DreamIslandViewProps {
  data: AppData;
  onExit: () => void;
}

interface HypotheticalExpense {
  id: number;
  name: string;
  amount: number;
  type: 'one-time' | 'recurring' | 'payment-plan';
  startDate?: string; // YYYY-MM-DD - used for one-time expenses and payment plans
  // Payment plan specific fields
  totalAmount?: number;
  numberOfPayments?: number;
}

const DreamIslandView: React.FC<DreamIslandViewProps> = ({ data, onExit }) => {
  const [includeFixedBills, setIncludeFixedBills] = useState(true);
  const [includeRent, setIncludeRent] = useState(true);
  const [includeFoodAnalysis, setIncludeFoodAnalysis] = useState(true);
  const [showForecasted, setShowForecasted] = useState(true);
  const [hypotheticals, setHypotheticals] = useState<HypotheticalExpense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseType, setExpenseType] = useState<'one-time' | 'recurring' | 'payment-plan'>('one-time');
  const [forecastMonth, setForecastMonth] = useState(0); // 0, 1, or 2 for 3-month forecast
  const [screenshotWarningShown, setScreenshotWarningShown] = useState(false);
  
  // Payment plan auto-calculation
  const [paymentPlanTotal, setPaymentPlanTotal] = useState<number>(0);
  const [paymentPlanCount, setPaymentPlanCount] = useState<number>(0);
  const [calculatedPayment, setCalculatedPayment] = useState<number>(0);

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

  // Split bills into rent and non-rent
  const rentBills = data.bills.filter(b => b.id === 1 || b.id === 9);
  const nonRentBills = data.bills.filter(b => b.id !== 1 && b.id !== 9);
  
  const rentTotal = rentBills.reduce((sum, bill) => sum + bill.amount, 0);
  const fixedBillsTotal = nonRentBills.reduce((sum, bill) => sum + bill.amount, 0);

  // Calculate number of paydays in current month
  const refDate = new Date(2026, 0, 9); // Jan 9, 2026
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let paydayCount = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const current = new Date(currentYear, currentMonth, day);
    const diffDays = Math.ceil((current.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays % 14 === 0) {
      paydayCount++;
    }
  }

  // Calculate monthly income (number of paychecks × paycheck amount)
  const monthlyIncome = paydayCount * data.budget.avgIncome;

  // Helper function to count paydays in any month
  const countPaydaysInMonth = (year: number, month: number) => {
    const days = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= days; day++) {
      const current = new Date(year, month, day);
      const diffDays = Math.ceil((current.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays % 14 === 0) count++;
    }
    return count;
  };

  // Helper function to get payment plan payments in a specific month
  const getPaymentPlanPaymentsInMonth = (plan: HypotheticalExpense, year: number, month: number): { count: number; paymentNumbers: number[] } => {
    if (plan.type !== 'payment-plan' || !plan.startDate || !plan.numberOfPayments) {
      return { count: 0, paymentNumbers: [] };
    }

    const startDate = new Date(plan.startDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const paymentsInMonth: number[] = [];
    
    for (let i = 0; i < plan.numberOfPayments; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(paymentDate.getDate() + (i * 14)); // Bi-weekly = 14 days
      
      if (paymentDate >= monthStart && paymentDate <= monthEnd) {
        paymentsInMonth.push(i + 1); // Payment number (1-indexed)
      }
    }
    
    return { count: paymentsInMonth.length, paymentNumbers: paymentsInMonth };
  };

  // Helper function to check if one-time expense falls in a specific month
  const isOneTimeExpenseInMonth = (expense: HypotheticalExpense, year: number, month: number): boolean => {
    if (expense.type !== 'one-time') return false;
    
    // If no date set, default to first forecast month (current month)
    if (!expense.startDate) {
      return year === currentYear && month === currentMonth;
    }
    
    const expenseDate = new Date(expense.startDate);
    return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
  };

  // Helper function to check if recurring expense should appear in a specific month
  const shouldRecurringExpenseAppear = (expense: HypotheticalExpense, year: number, month: number): boolean => {
    if (expense.type !== 'recurring') return false;
    
    // If no date set, appear in all months
    if (!expense.startDate) {
      return true;
    }
    
    // Only appear in months >= start date
    const expenseDate = new Date(expense.startDate);
    const checkDate = new Date(year, month, 1);
    return checkDate >= expenseDate;
  };

  // Calculate 3-month forecast
  const forecastMonths = [];
  for (let i = 0; i < 3; i++) {
    const forecastDate = new Date(currentYear, currentMonth + i, 1);
    const forecastYear = forecastDate.getFullYear();
    const forecastMonthNum = forecastDate.getMonth();
    
    // Get paychecks for this forecast month
    const paychecks = countPaydaysInMonth(forecastYear, forecastMonthNum);
    const income = paychecks * data.budget.avgIncome;
    
    // Calculate expenses for this month
    let expenses = 0;
    if (includeFixedBills) expenses += fixedBillsTotal;
    if (includeRent) expenses += rentTotal;
    if (includeFoodAnalysis) expenses += foodTotal;
    
    // Calculate hypotheticals for this month
    // One-time expenses now check their date to see if they fall in this month
    const oneTimeExpensesInMonth = hypotheticals.filter(h => isOneTimeExpenseInMonth(h, forecastYear, forecastMonthNum));
    const oneTimeTotal = oneTimeExpensesInMonth.reduce((sum, h) => sum + h.amount, 0);
    
    // Recurring expenses check if they should appear in this month (based on start date)
    const recurringExpensesInMonth = hypotheticals.filter(h => shouldRecurringExpenseAppear(h, forecastYear, forecastMonthNum));
    const recurringTotal = recurringExpensesInMonth.reduce((sum, h) => sum + h.amount, 0);
    
    // Calculate payment plan total for this month
    let paymentPlanTotal = 0;
    const paymentPlanDetails: { plan: HypotheticalExpense; payments: number[] }[] = [];
    
    hypotheticals.filter(h => h.type === 'payment-plan').forEach(plan => {
      const { count, paymentNumbers } = getPaymentPlanPaymentsInMonth(plan, forecastYear, forecastMonthNum);
      if (count > 0) {
        paymentPlanTotal += plan.amount * count;
        paymentPlanDetails.push({ plan, payments: paymentNumbers });
      }
    });
    
    // Calculate balance (compounding from previous month)
    const startingBalance = i === 0 ? 0 : forecastMonths[i - 1].endingBalance;
    const endingBalance = startingBalance + income - expenses - oneTimeTotal - recurringTotal - paymentPlanTotal;
    const netResult = income - expenses - oneTimeTotal - recurringTotal - paymentPlanTotal;
    
    forecastMonths.push({
      month: forecastMonthNum,
      year: forecastYear,
      paychecks,
      income,
      expenses,
      oneTimeTotal,
      oneTimeExpensesInMonth,
      recurringTotal,
      recurringExpensesInMonth,
      paymentPlanTotal,
      paymentPlanDetails,
      startingBalance,
      endingBalance,
      netResult
    });
  }

  const currentForecast = forecastMonths[forecastMonth];

  // Starting balance
  const startingBalance = data.budget.startingBalance;

  // Calculate current reality totals
  let currentMonthlyOut = 0;
  if (includeFixedBills) currentMonthlyOut += fixedBillsTotal;
  if (includeRent) currentMonthlyOut += rentTotal;
  if (includeFoodAnalysis) currentMonthlyOut += foodTotal;

  const currentNetFlow = monthlyIncome - currentMonthlyOut;
  const currentBalance = startingBalance + currentNetFlow;

  // Auto-calculate payment amount for payment plans
  const handlePaymentPlanTotalChange = (value: number) => {
    setPaymentPlanTotal(value);
    if (paymentPlanCount > 0) {
      setCalculatedPayment(value / paymentPlanCount);
    }
  };

  const handlePaymentPlanCountChange = (value: number) => {
    setPaymentPlanCount(value);
    if (value > 0 && paymentPlanTotal > 0) {
      setCalculatedPayment(paymentPlanTotal / value);
    }
  };

  // Reset payment plan calculation when modal closes
  const handleCloseModal = () => {
    setIsAddingExpense(false);
    setPaymentPlanTotal(0);
    setPaymentPlanCount(0);
    setCalculatedPayment(0);
  };

  // Add hypothetical expense
  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const amount = parseFloat(formData.get('amount') as string);

    if (name && amount > 0) {
      const newExpense: HypotheticalExpense = {
        id: Date.now(),
        name,
        amount,
        type: expenseType
      };

      // Add date for one-time expenses (optional)
      if (expenseType === 'one-time') {
        const startDate = formData.get('startDate') as string;
        if (startDate) {
          newExpense.startDate = startDate;
        }
      }

      // Add date for recurring expenses (optional)
      if (expenseType === 'recurring') {
        const startDate = formData.get('startDate') as string;
        if (startDate) {
          newExpense.startDate = startDate;
        }
      }

      // Add payment plan specific fields
      if (expenseType === 'payment-plan') {
        newExpense.totalAmount = parseFloat(formData.get('totalAmount') as string) || 0;
        newExpense.numberOfPayments = parseInt(formData.get('numberOfPayments') as string) || 0;
        newExpense.startDate = formData.get('startDate') as string;
      }

      setHypotheticals([...hypotheticals, newExpense]);
      handleCloseModal();
    }
  };

  const handleDelete = (id: number) => {
    setHypotheticals(hypotheticals.filter(h => h.id !== id));
  };

  const handleReset = () => {
    setHypotheticals([]);
    setIncludeFixedBills(true);
    setIncludeRent(true);
    setIncludeFoodAnalysis(true);
    setShowForecasted(true);
    setForecastMonth(0);
    setScreenshotWarningShown(false);
  };

  const handleExitWithPrompt = () => {
    // Step 1: If there are hypotheticals and warning hasn't been shown yet
    if (hypotheticals.length > 0 && !screenshotWarningShown) {
      alert("📸 Take a screenshot of your forecast before leaving!\n\nThe X button will turn RED. Click it again when you're ready to exit.");
      setScreenshotWarningShown(true);
      return; // Stay on page
    }
    
    // Step 2: Confirm exit (either no hypotheticals or warning already shown)
    const confirmExit = confirm("Exit Dream Island?\n\nYour hypothetical expenses will be cleared.");
    if (confirmExit) {
      handleReset();
      setScreenshotWarningShown(false); // Reset for next time
      onExit();
    }
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
      <div className="pt-4 px-6 pb-4 flex justify-between items-center bg-black sticky top-0 z-50 border-b border-purple-900/30 shadow-lg shadow-black/50">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <span className="text-3xl">🏝️</span> My Dream Island
        </h2>
        <button 
          onClick={handleExitWithPrompt}
          className={`p-2 rounded-xl transition-colors ${
            screenshotWarningShown 
              ? 'bg-red-900 text-red-200 hover:bg-red-800 ring-2 ring-red-500 animate-pulse' 
              : 'bg-neutral-800 text-white hover:bg-neutral-700'
          }`}
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 px-4 pt-4">
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
              <span className="text-emerald-400 font-medium">Monthly In ({paydayCount} paychecks)</span>
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
            label="Fixed Bills/Subs"
            isOn={includeFixedBills}
            onClick={() => setIncludeFixedBills(!includeFixedBills)}
            colorScheme="green"
          />
          <ArcadeButton 
            label="Rent"
            isOn={includeRent}
            onClick={() => setIncludeRent(!includeRent)}
            colorScheme="purple"
          />
          <ArcadeButton 
            label="Food Analysis"
            isOn={includeFoodAnalysis}
            onClick={() => setIncludeFoodAnalysis(!includeFoodAnalysis)}
            colorScheme="orange"
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
            <button
              onClick={() => { setExpenseType('payment-plan'); setIsAddingExpense(true); }}
              className="w-full p-3 bg-blue-900/20 border border-blue-500/30 text-blue-400 font-bold rounded-xl hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Payment Plan
            </button>
          </div>

          {/* List of hypotheticals */}
          {hypotheticals.length > 0 ? (
            <div className="space-y-2">
              {hypotheticals.map(h => (
                <div key={h.id} className="flex justify-between items-center p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div>
                    <p className="text-white font-bold text-sm">{h.name}</p>
                    {h.type === 'payment-plan' ? (
                      <>
                        <p className="text-xs font-bold text-blue-400">
                          Payment Plan: ${h.amount}/payment × {h.numberOfPayments} payments
                        </p>
                        <p className="text-xs text-neutral-500">
                          Total: ${h.totalAmount?.toFixed(2)} • Starts {new Date(h.startDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </>
                    ) : (
                      <p className={`text-xs font-bold ${h.type === 'one-time' ? 'text-purple-400' : 'text-orange-400'}`}>
                        {h.type === 'one-time' ? 'One-Time' : 'Monthly'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {h.type === 'payment-plan' ? (
                      <span className="text-white font-black">${h.amount.toFixed(2)}<span className="text-xs text-neutral-500">/pay</span></span>
                    ) : (
                      <span className="text-white font-black">-${h.amount.toFixed(2)}</span>
                    )}
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

        {/* 3-Month Forecast Carousel */}
        <div className="bg-gradient-to-br from-purple-900/20 to-orange-900/20 border-2 border-purple-500/30 rounded-3xl p-6 shadow-xl">
          {/* Month selector */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setForecastMonth(Math.max(0, forecastMonth - 1))}
              disabled={forecastMonth === 0}
              className={`p-2 rounded-lg transition-colors ${
                forecastMonth === 0 
                  ? 'text-neutral-700 cursor-not-allowed' 
                  : 'text-purple-400 hover:bg-purple-900/30'
              }`}
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-black text-white">
                {new Date(currentForecast.year, currentForecast.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </h3>
              <p className="text-xs text-neutral-500">Month {forecastMonth + 1} of 3</p>
            </div>
            
            <button
              onClick={() => setForecastMonth(Math.min(2, forecastMonth + 1))}
              disabled={forecastMonth === 2}
              className={`p-2 rounded-lg transition-colors ${
                forecastMonth === 2 
                  ? 'text-neutral-700 cursor-not-allowed' 
                  : 'text-purple-400 hover:bg-purple-900/30'
              }`}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Starting Balance (for months 2 & 3) */}
          {forecastMonth > 0 && (
            <div className="mb-4 p-3 bg-neutral-900 rounded-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Starting Balance</span>
                <span className={`font-bold ${currentForecast.startingBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${currentForecast.startingBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Income */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Income</h4>
            <div className="bg-neutral-900 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Paychecks ({currentForecast.paychecks})</span>
                <span className="text-lg font-black text-emerald-400">${currentForecast.income.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Expenses</h4>
            <div className="bg-neutral-900 rounded-xl p-3 space-y-2">
              {includeRent && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Rent</span>
                  <span className="font-bold text-white">${rentTotal.toFixed(2)}</span>
                </div>
              )}
              {includeFixedBills && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Bills/Subs</span>
                  <span className="font-bold text-white">${fixedBillsTotal.toFixed(2)}</span>
                </div>
              )}
              {includeFoodAnalysis && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Food</span>
                  <span className="font-bold text-white">${foodTotal.toFixed(2)}</span>
                </div>
              )}
              {currentForecast.expenses === 0 && (
                <p className="text-xs text-neutral-600 text-center py-2">No expenses selected</p>
              )}
            </div>
          </div>

          {/* Hypotheticals */}
          {hypotheticals.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Hypotheticals</h4>
              <div className="bg-neutral-900 rounded-xl p-3 space-y-2">
                {currentForecast.oneTimeExpensesInMonth && currentForecast.oneTimeExpensesInMonth.map(h => (
                  <div key={h.id} className="flex justify-between items-center text-sm">
                    <span className="text-purple-400">{h.name}</span>
                    <span className="font-bold text-white">${h.amount.toFixed(2)}</span>
                  </div>
                ))}
                {currentForecast.recurringExpensesInMonth && currentForecast.recurringExpensesInMonth.map(h => (
                  <div key={h.id} className="flex justify-between items-center text-sm">
                    <span className="text-orange-400">{h.name}</span>
                    <span className="font-bold text-white">${h.amount.toFixed(2)}</span>
                  </div>
                ))}
                {currentForecast.paymentPlanDetails && currentForecast.paymentPlanDetails.map(({ plan, payments }) => 
                  payments.map(paymentNum => (
                    <div key={`${plan.id}-${paymentNum}`} className="flex justify-between items-center text-sm">
                      <span className="text-blue-400">{plan.name} (payment {paymentNum}/{plan.numberOfPayments})</span>
                      <span className="font-bold text-white">${plan.amount.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Net Result */}
          <div className="pt-4 border-t-2 border-neutral-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">Net Result</span>
              <span className={`text-2xl font-black ${currentForecast.netResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentForecast.netResult >= 0 ? '+' : ''}{currentForecast.netResult.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">Ending Balance</span>
              <span className={`text-3xl font-black ${currentForecast.endingBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                ${currentForecast.endingBalance.toFixed(2)}
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
          <div className="bg-[#171717] border border-[#262626] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                Add {expenseType === 'one-time' ? 'One-Time' : expenseType === 'recurring' ? 'Recurring' : 'Payment Plan'} Expense
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-white">
                <X />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input
                name="name"
                type="text"
                placeholder={expenseType === 'payment-plan' ? "Name (e.g., 'PS5 Afterpay')" : "Expense name (e.g., 'Puppy supplies')"}
                required
                className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
              />
              
              {expenseType === 'payment-plan' ? (
                <>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 font-bold uppercase">Total Amount</label>
                    <input
                      name="totalAmount"
                      type="number"
                      step="0.01"
                      placeholder="Total amount (e.g., 400)"
                      required
                      onChange={(e) => handlePaymentPlanTotalChange(parseFloat(e.target.value) || 0)}
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 font-bold uppercase">Number of Payments</label>
                    <select
                      name="numberOfPayments"
                      required
                      onChange={(e) => handlePaymentPlanCountChange(parseInt(e.target.value) || 0)}
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Select number of payments</option>
                      <option value="2">2 payments</option>
                      <option value="3">3 payments</option>
                      <option value="4">4 payments</option>
                      <option value="6">6 payments</option>
                      <option value="8">8 payments</option>
                      <option value="12">12 payments</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 font-bold uppercase">Payment Amount (Auto-Calculated)</label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      value={calculatedPayment > 0 ? calculatedPayment.toFixed(2) : ''}
                      placeholder="Will auto-calculate"
                      readOnly
                      required
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                    />
                    {calculatedPayment > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">✓ Calculated: ${calculatedPayment.toFixed(2)} per payment</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 font-bold uppercase">Start Date (First Payment)</label>
                    <input
                      name="startDate"
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-400 font-bold">📅 Bi-Weekly Payment Plan</p>
                    <p className="text-xs text-neutral-400 mt-1">Payments occur every 14 days starting from your selected date.</p>
                  </div>
                </>
              ) : expenseType === 'one-time' ? (
                <>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    required
                    className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                  />
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 font-bold uppercase">Date (Optional)</label>
                    <input
                      name="startDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Leave blank to default to current month</p>
                  </div>
                </>
              ) : (
                <>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    required
                    className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-orange-500"
                  />
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 font-bold uppercase">Start Date (Optional)</label>
                    <input
                      name="startDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-[#0a0a0a] border border-[#262626] w-full rounded-xl p-3 text-white focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Leave blank to start from all months, or set date to start from a specific month</p>
                  </div>
                </>
              )}
              
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