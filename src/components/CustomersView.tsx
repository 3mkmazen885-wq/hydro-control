import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Building,
  AlertTriangle,
  History,
  ChevronLeft
} from 'lucide-react';
import { Customer, Appointment, EGYPT_GOVERNORATES } from '../types/database';
import { notificationService } from '../services/notifications';

interface CustomersViewProps {
  customers: Customer[];
  appointments: Appointment[];
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: number) => Promise<void>;
  onScheduleAppointment: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  appointments,
  onOpenAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onScheduleAppointment,
}) => {
  const [search, setSearch] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter customers
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.alternate_phone && c.alternate_phone.includes(q)) ||
      c.address.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q);

    const matchesGov = governorateFilter === 'all' || c.governorate === governorateFilter;
    return matchesSearch && matchesGov;
  });

  // Calculate customer's appointments
  const getCustomerAppointments = (customerId: number) => {
    return appointments.filter((a) => a.customer_id === customerId);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCustomer(customerToDelete.customer_id);
      setCustomerToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <span>سجل العملاء المعتمد</span>
            <span>·</span>
            <span>شركة Hydro Control</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            قاعدة بيانات العملاء المسجلة محلياً على هذا الجهاز ({customers.length} عميل)
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition active:scale-95 whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-white" />
          إضافة عميل جديد
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، أو العنوان..."
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-h-[44px]"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={governorateFilter}
            onChange={(e) => setGovernorateFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition min-h-[44px]"
          >
            <option value="all">كافة المحافظات ({customers.length})</option>
            {EGYPT_GOVERNORATES.map((gov) => {
              const count = customers.filter((c) => c.governorate === gov).length;
              if (count === 0) return null;
              return (
                <option key={gov} value={gov}>
                  {gov} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            لا يوجد عملاء مسجلون حتى الآن
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            قاعدة البيانات فارغة تماماً وفقاً لطلبك لبدء العمل النظيف. اضغط بالأسفل لإضافة أول عميل للشركة.
          </p>
          <button
            onClick={onOpenAddCustomer}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            إضافة أول عميل
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          لا توجد نتائج مطابقة لبحثك "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => {
            const customerAppointments = getCustomerAppointments(customer.customer_id);

            return (
              <div
                key={customer.customer_id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 p-5 shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  
                  {/* Top Bar on Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <span>{customer.name}</span>
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{customer.property_type}</span>
                        <span>·</span>
                        <span>{customer.governorate}</span>
                        {customer.city && (
                          <>
                            <span>·</span>
                            <span>{customer.city}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {customer.source}
                    </span>
                  </div>

                  {/* Phone & Address */}
                  <div className="space-y-2 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-2 font-mono tabular-nums text-slate-900 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a href={`tel:${customer.phone}`} className="hover:underline">
                        {customer.phone}
                      </a>
                      {customer.alternate_phone && (
                        <span className="text-slate-400 font-normal">
                          / {customer.alternate_phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">
                        {customer.address}
                      </span>
                    </div>
                  </div>

                  {/* Appointments Status Indicator */}
                  <div className="text-[11px] text-slate-500 py-1.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCustomerForHistory(customer)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <History className="w-3 h-3" />
                      سجل المواعيد ({customerAppointments.length})
                    </button>
                    <span className="text-slate-400">
                      تسجيل: {new Date(customer.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* Call */}
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition min-h-[38px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      اتصال
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold transition min-h-[38px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      واتساب
                    </a>

                    {/* Maps */}
                    {customer.maps_url ? (
                      <a
                        href={customer.maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition min-h-[38px]"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        الخريطة
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.governorate} ${customer.city || ''} ${customer.address}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[38px]"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        الموقع
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onScheduleAppointment(customer)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition min-h-[38px]"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      حجز موعد
                    </button>

                    <button
                      onClick={() => onEditCustomer(customer)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="تعديل العميل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="حذف العميل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Customer Appointment History Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="bg-[#0a2540] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">سجل مواعيد كشف التسريب</h3>
                <p className="text-xs text-sky-300 mt-0.5">
                  العميل: {selectedCustomerForHistory.name} · {selectedCustomerForHistory.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {getCustomerAppointments(selectedCustomerForHistory.customer_id).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  لا توجد مواعيد سابقة مسجلة لهذا العميل حتى الآن.
                </div>
              ) : (
                getCustomerAppointments(selectedCustomerForHistory.customer_id).map((apt) => (
                  <div
                    key={apt.appointment_id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-900 font-mono tabular-nums">
                        {apt.appointment_date} · {notificationService.formatArabicTime(apt.appointment_time)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        apt.status === 'visited' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status === 'visited' ? 'تمت الزيارة' :
                         apt.status === 'confirmed' ? 'تم التأكيد' :
                         apt.status === 'rescheduled' ? 'مؤجل' :
                         apt.status === 'cancelled' ? 'ملغى' : 'جديد'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              تأكيد حذف العميل
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              هل أنت متأكد من حذف العميل <strong>«{customerToDelete.name}»</strong>؟
              <br />
              <span className="text-red-600 text-xs font-medium block mt-1">
                تنبيه: سيتم حذف كافة المواعيد المرتبطة به لحماية سلامة قاعدة البيانات المحلية.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition min-h-[44px]"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {isDeleting ? 'جارٍ الحذف...' : 'نعم، حذف نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
