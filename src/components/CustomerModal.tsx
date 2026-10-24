import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Building,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Clock,
  Bell,
  Sparkles
} from 'lucide-react';
import {
  Customer,
  EGYPT_GOVERNORATES,
  PropertyType,
  CustomerSource
} from '../types/database';
import { notificationService, ReminderCalculationResult } from '../services/notifications';

export interface CustomerAppointmentScheduleData {
  appointment_date: string;
  appointment_time: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    customerData: Omit<Customer, 'customer_id' | 'created_at'>,
    customerId?: number,
    appointmentData?: CustomerAppointmentScheduleData
  ) => Promise<void>;
  initialCustomer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCustomer,
}) => {
  // Customer State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [governorate, setGovernorate] = useState<string>(EGYPT_GOVERNORATES[0]);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('شقة');
  const [source, setSource] = useState<CustomerSource>('Facebook');

  // Appointment In Customer Form State (default true for direct booking)
  const [scheduleAppointmentDirectly, setScheduleAppointmentDirectly] = useState(true);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCustomer) {
      setPhone(initialCustomer.phone);
      setName(initialCustomer.name);
      setAlternatePhone(initialCustomer.alternate_phone || '');
      setGovernorate(initialCustomer.governorate || EGYPT_GOVERNORATES[0]);
      setCity(initialCustomer.city || '');
      setAddress(initialCustomer.address);
      setMapsUrl(initialCustomer.maps_url || '');
      setPropertyType(initialCustomer.property_type || 'شقة');
      setSource(initialCustomer.source || 'Facebook');
      setScheduleAppointmentDirectly(false);
    } else {
      setPhone('');
      setName('');
      setAlternatePhone('');
      setGovernorate(EGYPT_GOVERNORATES[0]);
      setCity('');
      setAddress('');
      setMapsUrl('');
      setPropertyType('شقة');
      setSource('Facebook');

      // Default tomorrow 10:00 AM for new appointment
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setAppointmentDate(tmrw.toISOString().split('T')[0]);
      setAppointmentTime('10:00');
      setScheduleAppointmentDirectly(true);
    }
    setErrors({});
  }, [initialCustomer, isOpen]);

  // 12-Hour Calculation Preview for direct appointment
  const reminderCalc: ReminderCalculationResult | null = useMemo(() => {
    if (!scheduleAppointmentDirectly || !appointmentDate || !appointmentTime) return null;
    try {
      return notificationService.calculateReminderTime(appointmentDate, appointmentTime);
    } catch {
      return null;
    }
  }, [scheduleAppointmentDirectly, appointmentDate, appointmentTime]);

  if (!isOpen) return null;

  // Validation: Only Phone is required
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      errs.phone = 'رقم الهاتف إجباري لتسجيل العميل وحجز الموعد';
    } else if (!/^[0-9+() -]{8,15}$/.test(cleanPhone)) {
      errs.phone = 'يرجى إدخال رقم هاتف صحيح (مثال: 01012345678)';
    }

    if (mapsUrl.trim() && !mapsUrl.trim().startsWith('http://') && !mapsUrl.trim().startsWith('https://')) {
      errs.mapsUrl = 'رابط الخريطة يجب أن يبدأ بـ https://';
    }

    if (scheduleAppointmentDirectly) {
      if (!appointmentDate) {
        errs.appointmentDate = 'يرجى تحديد تاريخ الزيارة';
      }
      if (!appointmentTime) {
        errs.appointmentTime = 'يرجى تحديد وقت الزيارة';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.trim();
      const finalName = name.trim() || `عميل ${cleanPhone}`;
      const finalAddress = address.trim() || 'العنوان يحدد مع الفني';

      const customerData = {
        name: finalName,
        phone: cleanPhone,
        alternate_phone: alternatePhone.trim() || undefined,
        governorate,
        city: city.trim(),
        address: finalAddress,
        maps_url: mapsUrl.trim() || undefined,
        property_type: propertyType,
        source,
      };

      const appointmentData: CustomerAppointmentScheduleData | undefined = scheduleAppointmentDirectly
        ? {
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
          }
        : undefined;

      await onSave(customerData, initialCustomer?.customer_id, appointmentData);
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: 'حدث خطأ أثناء حفظ البيانات.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-[#0a2540] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg text-sky-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل وحجز موعد زيارة'}
              </h2>
              <p className="text-xs text-sky-200">
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

          {/* Quick Tip: Phone only is sufficient */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>تسجيل فوري:</strong> يكفي إدخال رقم الهاتف واختيار توقيت الزيارة!
            </span>
          </div>

          {/* Section: Phone & Contact (Primary & Mandatory) */}
          <div className="space-y-4">
            
            {/* Phone Number - The ONLY Mandatory Field */}
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-blue-100">
              <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm">
                  <Phone className="w-4 h-4 text-blue-600" />
                  رقم هاتف العميل <span className="text-red-600 font-bold">* (إجباري)</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  الحقل الإجباري الوحيد للتواصل
                </span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                autoFocus
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono tabular-nums text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[46px] text-right ${
                  errors.phone ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                }`}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.phone}</p>}
            </div>

            {/* Optional Customer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم العميل <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: م. أحمد محمد إبراهيم"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم هاتف بديل <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="01187654321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px] text-right"
                />
              </div>
            </div>

          </div>

          {/* Direct Appointment Booking Section (Visit Date & Time Only!) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scheduleAppointmentDirectly}
                  onChange={(e) => setScheduleAppointmentDirectly(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900">
                    تحديد ميعاد وتاريخ الزيارة وتفعيل التذكير (قبل الموعد بـ 12 ساعة)
                  </span>
                </div>
              </label>

              {scheduleAppointmentDirectly && (
                <div className="mt-4 pt-3 border-t border-sky-200/80 space-y-3 animate-in fade-in">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        تاريخ الزيارة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[40px] ${
                          errors.appointmentDate ? 'border-red-400 bg-red-50' : 'border-slate-300'
                        }`}
                      />
                      {errors.appointmentDate && (
                        <p className="text-xs text-red-600 mt-1">{errors.appointmentDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        وقت الزيارة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[40px] ${
                          errors.appointmentTime ? 'border-red-400 bg-red-50' : 'border-slate-300'
                        }`}
                      />
                      {errors.appointmentTime && (
                        <p className="text-xs text-red-600 mt-1">{errors.appointmentTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic 12-Hour Calculation Box */}
                  {reminderCalc && (
                    <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                      reminderCalc.isPastDue
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-blue-200 text-blue-900'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Bell className={`w-3.5 h-3.5 ${reminderCalc.isPastDue ? 'text-amber-600' : 'text-blue-600'}`} />
                        <span>نظام التذكير المسبق (قبل الموعد بـ 12 ساعة):</span>
                      </div>
                      {reminderCalc.isPastDue ? (
                        <p className="text-amber-800">
                          ⚠️ الموعد بعد أقل من 12 ساعة من الآن، فلن يتم إرسال تذكير متأخر.
                        </p>
                      ) : (
                        <p className="text-blue-800">
                          سيصل إشعار التذكير تلقائياً على الهاتف يوم: <strong>{reminderCalc.readableReminderTime}</strong>
                        </p>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* Section: Location & Optional Details */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
              <span>الموقع وبيانات العنوان</span>
              <span className="text-[11px] font-normal text-slate-400">(اختيارية)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المحافظة
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition min-h-[44px]"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المركز / الحي / المدينة
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: المعادي، التجمع الخامس، المنتزه..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                العنوان التفصيلي <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="الشارع، رقم العمارة، الدور، الشقة..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  رابط موقع Google Maps <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    اختبار الرابط <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                dir="ltr"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px] text-left"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع العقار
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition min-h-[44px]"
                >
                  <option value="شقة">شقة سكنية</option>
                  <option value="فيلا">فيلا / دوبلكس</option>
                  <option value="محل">محل تجاري</option>
                  <option value="شركة/منشأة">شركة / منشأة</option>
                  <option value="عمارة">عمارة كاملة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مصدر العميل
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as CustomerSource)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition min-h-[44px]"
                >
                  <option value="Facebook">إعلان Facebook</option>
                  <option value="ترشيح">ترشيح من عميل آخر</option>
                  <option value="عميل سابق">عميل سابق</option>
                  <option value="موقع إلكتروني">موقع إلكتروني / بحث Google</option>
                  <option value="إعلان شارع">إعلان شارع / لافتة</option>
                  <option value="أخرى">غير ذلك</option>
                </select>
              </div>
            </div>

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
              {isSubmitting
                ? 'جارٍ الحفظ...'
                : initialCustomer
                ? 'حفظ التعديلات'
                : scheduleAppointmentDirectly
                ? 'حفظ العميل وتثبيت الموعد'
                : 'تسجيل العميل فقط'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
