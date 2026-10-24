import React from 'react';
import { Home, Users, Calendar, Bell, Database } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'customers' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">العملاء</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'appointments' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1">المواعيد</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'notifications' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] mt-1">الإشعارات</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'backup' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] mt-1">النسخ</span>
        </button>

      </div>
    </nav>
  );
};
