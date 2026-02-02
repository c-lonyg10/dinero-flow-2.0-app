import React from 'react';
import { AppData, Bill } from '../types';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';

interface DueBillsViewProps {
  data: AppData;
  mode: 'today' | 'week';
  onBack: () => void;
}

const DueBillsView: React.FC<DueBillsViewProps> = ({ data, mode, onBack }) => {
  const date = new Date();
  const today = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Sunday
  
  // Calculate Week Range (Current week window)
  const startOfWeek = today - dayOfWeek;
  const endOfWeek = startOfWeek + 6;

  let billsToShow: Bill[] = [];
  let title = "";
  let subTitle = "";
  let accentColor = "";

  if (mode === 'today') {
      title = "Due Today";
      subTitle = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      accentColor = "text-blue-400";
      billsToShow = data.bills.filter(b => b.day === today);
  } else {
      title = "Due This Week";
      subTitle = "Upcoming 7 Days";
      accentColor = "text-indigo-400";
      // Simple logic: matches bill days that fall within this week's number range
      billsToShow = data.bills.filter(b => b.day >= startOfWeek && b.day <= endOfWeek).sort((a,b) => a.day - b.day);
  }

  const totalDue = billsToShow.reduce((acc, b) => acc + b.amount, 0);

  return (
      <div className="space-y-6 pb-24 animate-fade-in h-[100dvh] flex flex-col box-border">
          {/* Header */}
          <div className="shrink-0 pt-4 px-1">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={onBack} className="p-2 bg-neutral-800 rounded-full text-white hover:bg-neutral-700">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <p className="text-xs text-neutral-400">{subTitle}</p>
                </div>
            </div>

            {/* Summary Card */}
            <div className={`bg-gradient-to-br ${mode === 'today' ? 'from-blue-900/20 to-cyan-900/20 border-blue-500/30' : 'from-indigo-900/20 to-purple-900/20 border-indigo-500/30'} border rounded-3xl p-8 text-center shadow-lg mb-4`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accentColor}`}>Total Due</p>
                <h2 className="text-5xl font-black text-white tracking-tighter">
                    ${totalDue.toFixed(2)}
                </h2>
                <p className="text-xs text-neutral-400 mt-2">{billsToShow.length} bills found</p>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 bg-[#171717] rounded-t-3xl overflow-hidden border-t border-l border-r border-[#262626] relative shadow-xl min-h-0 mx-1">
              <div className="h-full overflow-y-auto no-scrollbar p-4 space-y-2 pb-20">
                  {billsToShow.map(bill => (
                      <div key={bill.id} className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex flex-col items-center justify-center border border-neutral-700">
                                  <span className="text-[9px] text-neutral-500 uppercase font-bold">Day</span>
                                  <span className="text-lg font-bold text-white leading-none">{bill.day}</span>
                              </div>
                              <div>
                                  <h3 className="font-bold text-white">{bill.name}</h3>
                                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                                      <Clock size={12} />
                                      <span>Due on the {bill.day}th</span>
                                  </div>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="block text-lg font-bold text-white">${bill.amount.toFixed(0)}</span>
                          </div>
                      </div>
                  ))}

                  {billsToShow.length === 0 && (
                      <div className="text-center py-10 text-neutral-500">
                          <CheckCircle size={48} className="mx-auto mb-2 opacity-20" />
                          <p>No bills found for {mode === 'today' ? 'today' : 'this week'}!</p>
                          <p className="text-xs mt-2">You are in the clear.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
};

export default DueBillsView;