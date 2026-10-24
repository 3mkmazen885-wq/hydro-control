import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Phone,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Bell,
  Database,
  CheckCircle2,
  Building2,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Customer, AppointmentWithCustomer } from '../types/database';
import { ActiveTab } from './Navbar';
import { notificationService } from '../services/notifications';

interface DashboardViewProps {
  stats: {
    totalCustomers: number;
    todayAppointments: number;
    tomorrowAppointments: number;
    upcomingAppointments: number;
    needsConfirmation: number;
    rescheduledAppointments: number;
  };
  todayVisits: AppointmentWithCustomer[];
  tomorrowVisits: AppointmentWithCustomer[];
  customers: Customer[];
  appointments: AppointmentWithCustomer[];
  onOpenAddCustomer: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectAppointment: (appointment: AppointmentWithCustomer) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  todayVisits,
  tomorrowVisits,
  customers,
  appointments,
  onOpenAddCustomer,
  onSelectCustomer,
  onSelectAppointment,
  setActiveTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Search logic across name, phone, governorate
  const filteredCustomers = searchQuery.trim()
    ? customers.filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.alternate_phone && c.alternate_phone.includes(q)) ||
          c.governorate.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
        );
      })
    : [];

  const isEmptyDatabase = stats.totalCustomers === 0 && appointments.length === 0;

  // 1. Chart Data: Appointment Status Distribution
  const appointmentStatusData = useMemo(() => {
    const counts = {
      confirmed: 0,
      visited: 0,
      rescheduled: 0,
      new: 0,
      cancelled: 0,
    };

    appointments.forEach((a) => {
      if (counts[a.status] !== undefined) {
        counts[a.status]++;
      }
    });

    return [
      { name: 'مؤكدة', count: counts.confirmed, fill: '#0284c7' },
      { name: 'تمت الزيارة', count: counts.visited, fill: '#10b981' },
      { name: 'مؤجلة', count: counts.rescheduled, fill: '#8b5cf6' },
      { name: 'جديدة', count: counts.new, fill: '#f59e0b' },
      { name: 'ملغاة', count: counts.cancelled, fill: '#ef4444' },
    ];
  }, [appointments]);

  // 2. Chart Data: Customers by Egyptian Governorates
  const governoratesData = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((c) => {
      const gov = c.governorate || 'غير محدد';
      counts[gov] = (counts[gov] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Show top 7 governorates
  }, [customers]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-[#0a2540] via-[#0f345c] to-[#071726] rounded-2xl p-5 sm:p-7 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>نظام إدارة العمليات الميدانية</span>
              <span>·</span>
              <span>جمهورية مصر العربية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hydro Control Manager
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              إدارة العملاء، الزيارات الميدانية، وتذكيرات كشف تسريبات المياه التلقائية قبل الموعد بـ 12 ساعة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md transition active:scale-95 whitespace-nowrap min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-white" />
              تسجيل عميل وحجز موعد
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-6 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن عميل بالاسم، رقم الهاتف، أو المحافظة..."
              className="w-full pl-4 pr-11 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/15 transition text-sm min-h-[48px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-md transition"
              >
                مسح
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 z-30 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  لا توجد نتائج مطابقة لـ "{searchQuery}"
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.customer_id}
                    onClick={() => {
                      onSelectCustomer(c);
                      setSearchQuery('');
                    }}
                    className="p-3.5 hover:bg-blue-50/70 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className="text-xs text-slate-500 font-normal">
                          · {c.governorate} ({c.city || 'المركز غير محدد'})
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-3">
                        <span className="font-mono tabular-nums">{c.phone}</span>
                        <span>·</span>
                        <span className="truncate max-w-xs">{c.address}</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* When Database is 100% Empty - Official Clean Welcome State */}
      {isEmptyDatabase ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            مرحباً بك في Hydro Control Manager
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            قاعدة البيانات جاهزة ونظيفة للبدء تماماً على هاتفك، ولا تحتوي على أي بيانات تجريبية. ابدأ بإضافة أول عميل للشركة لتنظيم مواعيد الكشف وتفعيل تذكيرات الـ 12 ساعة.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAddCustomer}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition active:scale-95 min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              إضافة أول عميل
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition min-h-[48px]"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              فحص نظام الإشعارات (12 ساعة)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Statistical Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Total Customers */}
            <div 
              onClick={() => setActiveTab('customers')}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-400 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">إجمالي العملاء</span>
                <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats.totalCustomers}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">عميل مسجل في قاعدة البيانات</div>
            </div>

            {/* Today Appointments */}
            <div 
              onClick={() => setActiveTab('appointments')}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-sky-400 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">مواعيد اليوم</span>
                <Clock className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-sky-700 font-mono tabular-nums">
                {stats.todayAppointments}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">زيارات مجدولة لليوم</div>
            </div>

            {/* Tomorrow Appointments */}
            <div 
              onClick={() => setActiveTab('appointments')}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-400 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">مواعيد الغد</span>
                <Calendar className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums">
                {stats.tomorrowAppointments}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">إشعاراتها تبدأ اليوم</div>
            </div>

            {/* Upcoming Appointments */}
            <div 
              onClick={() => setActiveTab('appointments')}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-400 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">المواعيد القادمة</span>
                <CalendarCheck2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                {stats.upcomingAppointments}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">زيارات من اليوم فصاعداً</div>
            </div>

            {/* Needs Confirmation */}
            <div 
              onClick={() => setActiveTab('appointments')}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-amber-400 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">تحتاج تأكيد</span>
                <AlertCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
                {stats.needsConfirmation}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">موعد بحالة «جديد»</div>
            </div>

            {/* Rescheduled Appointments */}
            <div 
              onClick={() => setActiveTab('appointments')}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-400 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">مواعيد مؤجلة</span>
                <CalendarClock className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-purple-700 font-mono tabular-nums">
                {stats.rescheduledAppointments}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">تم تعديل توقيتها</div>
            </div>

          </div>

          {/* Graphical Analytics Charts (recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Chart 1: Appointments Distribution by Status */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      توزيع المواعيد حسب حالة الزيارة
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      مؤكدة، تمت الزيارة، مؤجلة، جديدة، أو ملغاة
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono tabular-nums">
                  {appointments.length} موعد
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                  لا توجد مواعيد مسجلة حتى الآن لعرض الرسم البياني.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={appointmentStatusData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#475569', fontSize: 11, fontFamily: 'Cairo' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a2540',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontFamily: 'Cairo',
                          fontSize: '12px',
                          direction: 'rtl',
                        }}
                        itemStyle={{ color: '#38bdf8' }}
                        formatter={(value: any) => [`${value} موعد`, 'العدد']}
                      />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      >
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Chart Legend Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 text-xs">
                {appointmentStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                    <span>{item.name}:</span>
                    <strong className="font-mono tabular-nums text-slate-800">{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Customers by Governorate */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      توزيع العملاء حسب المحافظات
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      كثافة طلبات كشف التسريب عبر محافظات الجمهورية
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono tabular-nums">
                  {customers.length} عميل
                </span>
              </div>

              {customers.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                  لا يوجد عملاء مسجلون حتى الآن لعرض توزيع المحافظات.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={governoratesData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={85}
                        tick={{ fill: '#334155', fontSize: 11, fontFamily: 'Cairo', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a2540',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontFamily: 'Cairo',
                          fontSize: '12px',
                          direction: 'rtl',
                        }}
                        itemStyle={{ color: '#4ade80' }}
                        formatter={(value: any) => [`${value} عميل`, 'العملاء']}
                      />
                      <Bar
                        dataKey="count"
                        fill="#0a2540"
                        radius={[0, 6, 6, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Summary note */}
              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                {governoratesData.length > 0 ? (
                  <span>
                    المحافظة الأكثر طلباً للكشف:{' '}
                    <strong className="text-slate-800 font-bold">
                      {governoratesData[0].name} ({governoratesData[0].count} عميل)
                    </strong>
                  </span>
                ) : (
                  <span>قم بإضافة أول عميل لتظهر الإحصائيات الجغرافية</span>
                )}
              </div>
            </div>

          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveTab('customers')}
              className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition text-right group min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-800">قائمة العملاء</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 transition text-right group min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-800">جدول المواعيد</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition text-right group min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Bell className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-800">فحص الإشعارات</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition text-right group min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Database className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-800">النسخ واستعادة البيانات</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Today's Priority Visits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>زيارات اليوم الميدانية</span>
                <span className="text-xs text-slate-500 font-normal">
                  ({todayVisits.length} زيارة)
                </span>
              </h2>
              {todayVisits.length > 0 && (
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  عرض كافة المواعيد ←
                </button>
              )}
            </div>

            {todayVisits.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
                لا توجد زيارات كشف تسريب مجدولة لليوم حتى الآن.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayVisits.map((a) => (
                  <div
                    key={a.appointment_id}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">
                          {a.customer?.name || 'عميل غير مسجل'}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono tabular-nums">
                          {notificationService.formatArabicTime(a.appointment_time)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{a.customer?.address || 'العنوان غير متوفر'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {a.customer?.phone && (
                        <a
                          href={`tel:${a.customer.phone}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          اتصال
                        </a>
                      )}

                      {a.customer?.maps_url ? (
                        <a
                          href={a.customer.maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          الخريطة
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.customer?.governorate || ''} ${a.customer?.city || ''} ${a.customer?.address || ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          بحث الموقع
                        </a>
                      )}

                      <button
                        onClick={() => onSelectAppointment(a)}
                        className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition min-h-[38px]"
                      >
                        تفاصيل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
