import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  Calculator,
  ShieldAlert,
  Smartphone,
  Info,
  Clock,
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { AppointmentWithCustomer } from '../types/database';
import { notificationService, ReminderCalculationResult } from '../services/notifications';

interface NotificationsCenterProps {
  appointments: AppointmentWithCustomer[];
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  appointments,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [testSent, setTestSent] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Simulation test state
  const [simDate, setSimDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [simTime, setSimTime] = useState('20:00'); // 8:00 PM example from prompt
  const [simCustomerName, setSimCustomerName] = useState('أحمد إبراهيم');
  const [simCustomerPhone, setSimCustomerPhone] = useState('01012345678');
  const [simCustomerAddress, setSimCustomerAddress] = useState('المعادي، شارع 9، القاهرة');

  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    await notificationService.triggerInstantTestNotification();
    setTimeout(() => setTestSent(false), 4000);
  };

  // Live simulation calculation
  const simResult: ReminderCalculationResult = notificationService.calculateReminderTime(
    simDate,
    simTime
  );

  const activeScheduled = appointments.filter((a) => {
    if (a.status === 'cancelled' || a.status === 'visited') return false;
    const calc = notificationService.calculateReminderTime(a.appointment_date, a.appointment_time);
    return !calc.isPastDue;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
          <span>نظام التذكيرات الآلي</span>
          <span>·</span>
          <span>قبل الزيارة بـ 12 ساعة</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">مركز الإشعارات والفحص التجريبي</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          مراقبة حالة أذونات الهاتف، محاكاة حسابات الـ 12 ساعة، واختبار وصول الإشعار والتنبيه الصوتي
        </p>
      </div>

      {/* Permission & Test Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Permission Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">صلاحية إشعارات الهاتف</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : permissionStatus === 'denied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {permissionStatus === 'granted'
                  ? 'مفعلة ونشطة ✓'
                  : permissionStatus === 'denied'
                  ? 'محجوبة من إعدادات المتصفح/الهاتف'
                  : 'تتطلب الموافقة'}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">
              إشعارات النظام المحلية (Local Notifications)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              تسمح هذه الصلاحية للتطبيق بإرسال إشعار التذكير على شاشة الهاتف حتى أثناء إغلاق الشاشة.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {permissionStatus !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition min-h-[44px]"
              >
                <Bell className="w-4 h-4" />
                {isRequesting ? 'جارٍ طلب الصلاحية...' : 'تفعيل صلاحية الإشعارات الآن'}
              </button>
            ) : (
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 py-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>صلاحية الإشعارات ممنوحة وتعمل بصورة ممتازة على جهازك</span>
              </div>
            )}
          </div>
        </div>

        {/* Immediate Test Trigger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-2">فحص فوري</span>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              إرسال إشعار تجريبي فوري + نغمة تنبيه
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              يُطلق إشعاراً فورياً على شريط إشعارات الهاتف مع تشغيل النغمة الصوتية المزدوجة لاختبار الصوت والاهتزاز.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleSendTestNotification}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0a2540] hover:bg-[#123659] text-white font-bold text-xs shadow-sm transition min-h-[44px]"
            >
              <Volume2 className="w-4 h-4 text-sky-400" />
              {testSent ? 'تم إرسال الإشعار والتنبيه الصوتي ✓' : 'اختبار إشعار وتنبيه صوتي الآن'}
            </button>
          </div>
        </div>

      </div>

      {/* 12-Hour Calculator Simulator Sandbox */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              حاسبة ومحاكي التذكير قبل الزيارة بـ 12 ساعة
            </h2>
            <p className="text-xs text-slate-500">
              اختبر أي موعد وتأكد من تطبيق المعادلة الحسابية بدقة: وقت الإشعار = وقت الزيارة − 12 ساعة بالضبط.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              تاريخ الزيارة المقترح
            </label>
            <input
              type="date"
              value={simDate}
              onChange={(e) => setSimDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              توقيت الزيارة (مثال: 08:00 م)
            </label>
            <input
              type="time"
              value={simTime}
              onChange={(e) => setSimTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم العميل الافتراضي
            </label>
            <input
              type="text"
              value={simCustomerName}
              onChange={(e) => setSimCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم الهاتف
            </label>
            <input
              type="text"
              dir="ltr"
              value={simCustomerPhone}
              onChange={(e) => setSimCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px] text-right"
            />
          </div>
        </div>

        {/* Calculation Result Breakdown */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs text-slate-500 block">وقت وتاريخ الزيارة الفعلي:</span>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {simResult.readableAppointmentTime}
              </span>
            </div>

            <div className="sm:text-left">
              <span className="text-xs text-slate-500 block">وقت إطلاق إشعار التذكير المحسوب (-12 ساعة):</span>
              <span className="text-sm font-bold text-blue-700 font-mono tabular-nums">
                {simResult.readableReminderTime}
              </span>
            </div>
          </div>

          {simResult.isPastDue ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>تنبيه انتهاء وقت التذكير:</strong> موعد الزيارة المحدد متبقي عليه أقل من 12 ساعة. وفقاً لشرط النظام، لن يتم إرسال إشعار متأخر وتصنف الحالة بـ «فات وقت التذكير».
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>صيغة الإشعار المعتمدة التي ستصل إلى شاشة الهاتف:</span>
              </div>
              <p className="bg-white p-2.5 rounded border border-blue-200 font-mono text-slate-800 text-[11px] leading-relaxed select-all">
                «تذكير Hydro Control: لديك زيارة للعميل {simCustomerName} اليوم الساعة {notificationService.formatArabicTime(simTime)}. العنوان: {simCustomerAddress}. الهاتف: {simCustomerPhone}.»
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Currently Scheduled Reminders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>التذكيرات المجدولة حالياً في التطبيق</span>
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono tabular-nums">
              ({activeScheduled.length} تذكير معلق)
            </span>
          </h2>
        </div>

        {activeScheduled.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            لا توجد تذكيرات معلقة حالياً (ستظهر هنا عند إضافة مواعيد قادمة تفصلنا عنها أكثر من 12 ساعة).
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {activeScheduled.map((apt) => {
              const calc = notificationService.calculateReminderTime(
                apt.appointment_date,
                apt.appointment_time
              );
              return (
                <div key={apt.appointment_id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{apt.customer?.name}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      موعد الزيارة: {apt.appointment_date} الساعة {notificationService.formatArabicTime(apt.appointment_time)}
                    </div>
                  </div>

                  <div className="sm:text-left">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px]">
                      موعد إطلاق الإشعار: {calc.readableReminderTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Android OS Battery & Exact Alarm Guide */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
          <Smartphone className="w-5 h-5" />
          <span>إرشادات نظام Android لإرسال التنبيهات بدقة:</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>وضع توفير الطاقة (Battery Saver / Optimization):</strong> في بعض هواتف Xiaomi و Samsung و Oppo، قد تؤخر إدارة البطارية الإشعارات بضع دقائق. للحصول على التنبيه الدقيق، يرجى ضبط التطبيق على "بلا قيود / Unrestricted" في إعدادات البطارية.
          </li>
          <li>
            <strong>إعادة تشغيل الهاتف (Reboot Recovery):</strong> يحتوي التطبيق على آلية استعادة تلقائية تعيد فحص جدول المواعيد عند فتح التطبيق لإعادة جدولة تذكيرات الـ 12 ساعة فوراً.
          </li>
          <li>
            <strong>العمل دون إنترنت:</strong> يعتمد نظام التذكيرات بالكامل على ساعة الهاتف الداخلية وقاعدة البيانات المحلية، ولا يحتاج إلى اتصال بالإنترنت لإطلاق الإشعار في وقته.
          </li>
        </ul>
      </div>

    </div>
  );
};
