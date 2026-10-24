import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Plus,
  Filter,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Bell,
  AlertTriangle,
  ChevronLeft,
  CalendarDays
} from 'lucide-react';
import { AppointmentWithCustomer, AppointmentStatus } from '../types/database';
import { notificationService } from '../services/notifications';

type TimeFilter = 'today' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | AppointmentStatus;

interface AppointmentsViewProps {
  appointments: AppointmentWithCustomer[];
  onOpenAddCustomer: () => void;
  onEditAppointment: (appointment: AppointmentWithCustomer) => void;
  onUpdateStatus: (appointmentId: number, status: AppointmentStatus) => Promise<void>;
  onReschedule: (appointment: AppointmentWithCustomer, newDate: string, newTime: string) => Promise<void>;
  onDeleteAppointment: (appointmentId: number) => Promise<void>;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onOpenAddCustomer,
  onEditAppointment,
  onUpdateStatus,
  onReschedule,
  onDeleteAppointment,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Reschedule state modal
  const [reschedulingAppointment, setReschedulingAppointment] = useState<AppointmentWithCustomer | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [newRescheduleTime, setNewRescheduleTime] = useState('10:00');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Cancellation confirm modal
  const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentWithCustomer | null>(null);

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const nextMonth = new Date();
  nextMonth.setDate(now.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((a) => {
    // Time filter
    if (timeFilter === 'today' && a.appointment_date !== todayStr) {
      return false;
    }
    if (timeFilter === 'week' && (a.appointment_date < todayStr || a.appointment_date > nextWeekStr)) {
      return false;
    }
    if (timeFilter === 'month' && (a.appointment_date < todayStr || a.appointment_date > nextMonthStr)) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && a.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleOpenReschedule = (apt: AppointmentWithCustomer) => {
    setReschedulingAppointment(apt);
    setNewRescheduleDate(apt.appointment_date);
    setNewRescheduleTime(apt.appointment_time);
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingAppointment || !newRescheduleDate || !newRescheduleTime) return;
    setIsRescheduling(true);
    try {
      await onReschedule(reschedulingAppointment, newRescheduleDate, newRescheduleTime);
      setReschedulingAppointment(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
            <span>جدول الزيارات الميدانية</span>
            <span>·</span>
            <span>Hydro Control</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">جدول المواعيد والزيارات</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة مواعيد كشف التسريب وتفعيل الإشعارات قبل 12 ساعة من الزيارة ({appointments.length} موعد)
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition active:scale-95 whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-white" />
          تسجيل عميل وحجز موعد
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        
        {/* Time Segmented Control */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
                timeFilter === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم ({appointments.filter((a) => a.appointment_date === todayStr).length})
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
                timeFilter === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
                timeFilter === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
                timeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة المواعيد ({appointments.length})
            </button>
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full sm:w-48 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[38px]"
            >
              <option value="all">كافة الحالات</option>
              <option value="new">جديد (يحتاج تأكيد)</option>
              <option value="confirmed">تم التأكيد</option>
              <option value="visited">تمت الزيارة والفحص</option>
              <option value="rescheduled">مؤجل لتوقيت آخر</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>
        </div>

      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            لا توجد مواعيد مسجلة في قاعدة البيانات
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            قاعدة البيانات نظيفة وخالية من أي مواعيد تجريبية. قم بتسجيل أول موعد زيارة للعميل لتفعيل جدول المواعيد والتذكيرات.
          </p>
          <button
            onClick={onOpenAddCustomer}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            تسجيل عميل وحجز موعد
          </button>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          لا توجد مواعيد تطابق الفلاتر المحددة.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const customer = apt.customer;
            const reminderCalc = notificationService.calculateReminderTime(
              apt.appointment_date,
              apt.appointment_time
            );

            // Status label styling
            const statusConfig = {
              new: { label: 'جديد (يحتاج تأكيد)', bg: 'bg-amber-100 text-amber-900 border-amber-200' },
              confirmed: { label: 'تم التأكيد مع العميل', bg: 'bg-blue-100 text-blue-900 border-blue-200' },
              visited: { label: 'تمت الزيارة والفحص', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
              rescheduled: { label: 'موعد مؤجل', bg: 'bg-purple-100 text-purple-900 border-purple-200' },
              cancelled: { label: 'موعد ملغى', bg: 'bg-red-100 text-red-900 border-red-200' },
            }[apt.status];

            return (
              <div
                key={apt.appointment_id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 p-4 sm:p-5 shadow-xs transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Customer & Service Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${statusConfig.bg}`}>
                        {statusConfig.label}
                      </span>

                      <span className="text-xs text-slate-500 font-semibold font-mono tabular-nums">
                        {apt.appointment_date} · {notificationService.formatArabicTime(apt.appointment_time)}
                      </span>

                      {apt.appointment_date === todayStr && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          اليوم
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {customer?.name || 'عميل محذوف أو غير مسجل'}
                      </h3>
                      {customer?.property_type && (
                        <span className="text-xs text-slate-500">
                          ({customer.property_type})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span>
                          {customer?.governorate} ({customer?.city || 'المركز'}) - {customer?.address || 'العنوان غير محدد'}
                        </span>
                      </div>
                    </div>

                    {/* 12-Hour Prior Reminder Badge */}
                    <div className="pt-1">
                      {apt.status === 'cancelled' || apt.status === 'visited' ? (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Bell className="w-3.5 h-3.5 text-slate-400" />
                          <span>إشعار التذكير: تم إيقاف التذكير لانتهاء أو إلغاء الزيارة.</span>
                        </div>
                      ) : reminderCalc.isPastDue ? (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>تنبيه: وقت التذكير المسبق (قبل 12 ساعة) قد فات بالفعل لتسجيل الموعد بتوقيت قريب.</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-md">
                          <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            تذكير الـ 12 ساعة مجدول يوم: {reminderCalc.readableReminderTime}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    
                    {/* Phone & Map Actions */}
                    <div className="flex items-center gap-2">
                      {customer?.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          اتصال
                        </a>
                      )}

                      {customer?.maps_url ? (
                        <a
                          href={customer.maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          الموقع
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer?.governorate || ''} ${customer?.address || ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          خريطة
                        </a>
                      )}
                    </div>

                    {/* Status Modifiers */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {apt.status === 'new' && (
                        <button
                          onClick={() => onUpdateStatus(apt.appointment_id, 'confirmed')}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition min-h-[36px]"
                        >
                          تأكيد الموعد
                        </button>
                      )}

                      {apt.status !== 'visited' && apt.status !== 'cancelled' && (
                        <button
                          onClick={() => onUpdateStatus(apt.appointment_id, 'visited')}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition min-h-[36px]"
                        >
                          تمت الزيارة
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenReschedule(apt)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition min-h-[36px]"
                      >
                        تأجيل
                      </button>

                      {apt.status !== 'cancelled' && (
                        <button
                          onClick={() => setCancellingAppointment(apt)}
                          className="py-1.5 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition min-h-[36px]"
                        >
                          إلغاء
                        </button>
                      )}

                      <button
                        onClick={() => onEditAppointment(apt)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[36px]"
                      >
                        تعديل
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal: Requests new date & time and reschedules notification */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <CalendarClock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              تأجيل موعد الزيارة
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              للعميل <strong>{reschedulingAppointment.customer?.name}</strong>. سيتم إلغاء الإشعار القديم وإعادة جدولة تذكير الـ 12 ساعة بناءً على الموعد الجديد.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ الزيارة الجديد
                </label>
                <input
                  type="date"
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  وقت الزيارة الجديد
                </label>
                <input
                  type="time"
                  value={newRescheduleTime}
                  onChange={(e) => setNewRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[44px]"
                />
              </div>

              {newRescheduleDate && newRescheduleTime && (
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                  تذكير الـ 12 ساعة الجديد سيصل يوم:{' '}
                  <strong>
                    {notificationService.calculateReminderTime(newRescheduleDate, newRescheduleTime).readableReminderTime}
                  </strong>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReschedulingAppointment(null)}
                disabled={isRescheduling}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition min-h-[44px]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={isRescheduling}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {isRescheduling ? 'جارٍ التأجيل...' : 'تأكيد الموعد الجديد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              إلغاء موعد الزيارة
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              هل أنت متأكد من إلغاء موعد العميل <strong>{cancellingAppointment.customer?.name}</strong>؟
              <br />
              <span className="text-xs text-red-600 font-medium block mt-1">
                سيتم إلغاء إشعار التذكير المجدول فوراً، مع الاحتفاظ بالموعد بحالة «ملغى» في السجل التاريخي دون حذفه.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingAppointment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition min-h-[44px]"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onUpdateStatus(cancellingAppointment.appointment_id, 'cancelled');
                  setCancellingAppointment(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-sm transition active:scale-95 min-h-[44px]"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
