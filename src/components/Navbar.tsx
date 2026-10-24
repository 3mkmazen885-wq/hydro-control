import React from 'react';
import { Users, Calendar, Bell, Database, Plus, ShieldCheck, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveTab = 'dashboard' | 'customers' | 'appointments' | 'notifications' | 'backup';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddCustomer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddCustomer,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-[#0a2540] text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" fillOpacity="0.3" />
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                <path d="M9 14h6" />
                <path d="M12 11v6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-none">Hydro Control</span>
              <span className="text-[11px] text-sky-300 font-medium mt-0.5">كشف تسريبات المياه</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              الرئيسية
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'customers'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              العملاء
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'appointments'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              المواعيد
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              الإشعارات (12 ساعة)
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'backup'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              النسخ الاحتياطي و Android
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
                title="تثبيت التطبيق على الهاتف"
              >
                <Download className="w-3.5 h-3.5" />
                تثبيت على الهاتف
              </button>
            )}

            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm hover:shadow transition whitespace-nowrap min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              تسجيل عميل وحجز موعد
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
