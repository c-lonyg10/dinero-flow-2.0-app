import React from 'react';
import { LayoutDashboard, Calendar, Home, Utensils, Sword, Receipt, PieChart } from 'lucide-react';
import { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  onSwitch: (tab: TabType) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onSwitch }) => {
  // changed id type to 'any' temporarily so it works before we update types.ts
  const navItems: { id: any; icon: React.ReactNode }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'calendar', icon: <Calendar size={24} /> },
    { id: 'rent', icon: <Home size={24} /> },
    { id: 'spending', icon: <Utensils size={24} /> }, // Food
    { id: 'categories', icon: <PieChart size={24} /> }, // NEW: Categories
    { id: 'debt', icon: <Sword size={24} /> },
    { id: 'transactions', icon: <Receipt size={24} /> },
  ];

  return (
    <nav className="fixed bottom-6 left-2 right-2 max-w-lg mx-auto bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl flex justify-between px-1 py-3 z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSwitch(item.id)}
          className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
            activeTab === item.id
              ? 'bg-[#262626] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] transform scale-105'
              : 'text-[#737373] hover:text-neutral-400 active:scale-95'
          }`}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;