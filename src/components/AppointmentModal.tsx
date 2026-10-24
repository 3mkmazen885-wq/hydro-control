import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Plus,
  AlertTriangle,
  Bell,
  CheckCircle2,
  MapPin,
  Phone,
  Wrench,
  Info
} from 'lucide-react';
import {
  Customer,
  Appointment,
  SERVICE_TYPES,
  AppointmentStatus,
  ReminderStatus
} from '../types/database';
import { notificationService, ReminderCalculationResult } from '../services/notifications';
import { dbService } from '../services/db';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSave: (
    appointmentData: Omit<Appointment, 'appointment_id' | 'created_at' | 'updated_at'>,
    appointmentId?: number
  ) => Promise<void>;
  initialAppointment?: Appointment | null;
  defaultCustomerId?: number | null;
  onOpenQuickAddCustomer: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  customers,
  onSave,
  initialAppointment,
  defaultCustomerId,
  onOpenQuickAddCustomer,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0]);
  const [technicianName, setTechnicianName] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('new');
  const [notes, setNotes] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlapWarnings, setOverlapWarnings] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (initialAppointment) {
      setSelectedCustomerId(initialAppointment.customer_id);
      setAppointmentDate(initialAppointment.appointment_date);
      setAppointmentTime(initialAppointment.appointment_time);
      setServiceType(initialAppointment.service_type || SERVICE_TYPES[0]);
      setTechnicianName(initialAppointment.technician_name || '');
      setStatus(initialAppointment.status);
      setNotes(initialAppointment.notes || '');
    } else {
      // Default to tomorrow 10:00 AM
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const tmrwStr = tmrw.toISOString().split('T')[0];

      setAppointmentDate(tmrwStr);
      setAppointmentTime('10:00');
      setServiceType(SERVICE_TYPES[0]);
      setTechnicianName('');
      setStatus('new');
      setNotes('');
      if (defaultCustomerId) {
        setSelectedCustomerId(defaultCustomerId);
      } else if (customers.length > 0) {
        setSelectedCustomerId(customers[0].customer_id);
      } else {
        setSelectedCustomerId('');
      }
    }
    setErrors({});
  }, [initialAppointment, defaultCustomerId, isOpen, customers]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.customer_id === Number(selectedCustomerId)) || null;
  }, [selectedCustomerId, customers]);

  // Dynamic 12-Hour Prior Reminder Calculation
  const reminderCalc: ReminderCalculationResult | null = useMemo(() => {
    if (!appointmentDate || !appointmentTime) return null;
    try {
      return notificationService.calculateReminderTime(appointmentDate, appointmentTime);
    } catch {
      return null;
    }
  }, [appointmentDate, appointmentTime]);

  // Check for time overlap with existing appointments
  useEffect(() => {
    if (!appointmentDate || !appointmentTime || !isOpen) {
      setOverlapWarnings(null);
      return;
    }

    let isMounted = true;
    dbService
      .checkTimeOverlap(appointmentDate, appointmentTime, initialAppointment?.appointment_id)
      .then((conflicts) => {
        if (!isMounted) return;
        if (conflicts.length > 0) {
          const names = conflicts.map((c) => c.customer?.name || 'عميل آخر').join('، ');
          setOverlapWarnings(
            `تنبيه: يوجد موعد آخر مسجل في نفس التوقيت للعميل (${names}). يمكنك المتابعة إن كان الفني مختلفاً.`
          );
        } else {
          setOverlapWarnings(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [appointmentDate, appointmentTime, initialAppointment, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedCustomerId) {
      errs.customer = 'يرجى اختيار العميل أو إضافة عميل جديد أولاً';
    }

    if (!appointmentDate) {
      errs.date = 'يرجى تحديد تاريخ الزيارة';
    }

    if (!appointmentTime) {
      errs.time = 'يرجى تحديد وقت الزيارة';
    }

    if (!serviceType) {
      errs.service = 'يرجى تحديد نوع خدمة كشف التسريب';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedCustomer) return;

    setIsSubmitting(true);
    try {
      let reminderStatus: ReminderStatus = 'scheduled';
      if (status === 'cancelled' || status === 'visited') {
        reminderStatus = 'cancelled';
      } else if (reminderCalc?.isPastDue) {
        reminderStatus = 'due_passed';
      }

      await onSave(
        {
          customer_id: Number(selectedCustomerId),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          service_type: serviceType,
          technician_name: technicianName.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
          reminder_status: reminderStatus,
          reminder_id: initialAppointment?.reminder_id || Date.now(),
        },
        initialAppointment?.appointment_id
      );
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: 'حدث خطأ أثناء حفظ الموعد.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#0a2540] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg text-sky-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialAppointment ? 'تعديل موعد الزيارة' : 'تسجيل موعد زيارة جديد'}
              </h2>
              <p className="text-xs text-slate-300">
                شركة Hydro Control لكشف تسريبات المياه
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {errors.form && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Section: Customer Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                العميل <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenQuickAddCustomer}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة عميل جديد الآن
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>لا يوجد عملاء مسجلون حالياً. يرجى إضافة عميل أولاً.</span>
                <button
                  type="button"
                  onClick={onOpenQuickAddCustomer}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
                >
                  إضافة عميل
                </button>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition min-h-[44px] ${
                  errors.customer ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
              >
                <option value="">-- اختر العميل من القائمة --</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name} - {c.phone} ({c.governorate})
                  </option>
                ))}
              </select>
            )}
            {errors.customer && <p className="text-xs text-red-600 mt-1">{errors.customer}</p>}

            {/* Customer Summary Card for verification before saving */}
            {selectedCustomer && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedCustomer.name}</span>
                  <span className="text-slate-500 font-normal">({selectedCustomer.property_type})</span>
                </div>
                <div className="text-slate-600 flex items-center gap-3">
                  <span className="font-mono tabular-nums">{selectedCustomer.phone}</span>
                  <span>·</span>
                  <span>{selectedCustomer.governorate} ({selectedCustomer.city || 'المركز'})</span>
                </div>
                <div className="text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                  <span>{selectedCustomer.address}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Visit Date & Time */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              موعد الزيارة وتوقيت التذكير
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ الزيارة <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px] ${
                    errors.date ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  وقت الزيارة <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px] ${
                    errors.time ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
              </div>
            </div>

            {/* Overlap Alert Warning */}
            {overlapWarnings && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{overlapWarnings}</span>
              </div>
            )}

            {/* 12-Hour Prior Notification Calculation Box */}
            {reminderCalc && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
                reminderCalc.isPastDue
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <Bell className={`w-4 h-4 ${reminderCalc.isPastDue ? 'text-amber-600' : 'text-blue-600'}`} />
                  <span>نظام التذكير قبل الزيارة بـ 12 ساعة:</span>
                </div>

                {reminderCalc.isPastDue ? (
                  <p className="text-amber-800 leading-relaxed">
                    ⚠️ <strong>تنبيه:</strong> موعد الزيارة بعد أقل من 12 ساعة من الآن. لقد فات وقت التذكير المسبق، ولن يتم إرسال إشعار متأخر احتراماً لشرط التذكير المسبق.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-blue-800">
                      سيصل إشعار التذكير تلقائياً على الهاتف يوم: <strong className="font-semibold">{reminderCalc.readableReminderTime}</strong> (قبل الزيارة بـ 12 ساعة بالضبط).
                    </p>
                    <p className="text-[11px] text-blue-700">
                      نص الإشعار: «تذكير Hydro Control: لديك زيارة للعميل {selectedCustomer?.name || '[الاسم]'} اليوم الساعة {notificationService.formatArabicTime(appointmentTime)}...»
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : initialAppointment ? 'حفظ التعديلات' : 'تأكيد وحفظ الموعد'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
