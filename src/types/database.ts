/**
 * Hydro Control Manager - Database & Model Types
 * Structured according to requested SQLite schema.
 */

export type PropertyType = 'شقة' | 'فيلا' | 'محل' | 'شركة/منشأة' | 'عمارة' | 'أخرى';

export type CustomerSource = 'Facebook' | 'ترشيح' | 'عميل سابق' | 'موقع إلكتروني' | 'إعلان شارع' | 'أخرى';

export type AppointmentStatus = 'new' | 'confirmed' | 'visited' | 'rescheduled' | 'cancelled';

export type ReminderStatus = 'scheduled' | 'due_passed' | 'sent' | 'cancelled' | 'dismissed';

export interface Customer {
  customer_id: number; // Auto-increment ID
  name: string; // Required
  phone: string; // Required
  alternate_phone?: string; // Optional
  governorate: string; // المحافظة
  city: string; // المركز أو المدينة
  address: string; // العنوان التفصيلي (Required)
  maps_url?: string; // Google Maps URL (Optional)
  property_type: PropertyType; // نوع العقار
  source: CustomerSource; // مصدر العميل
  problem_notes?: string; // وصف المشكلة
  created_at: string; // ISO String
}

export interface Appointment {
  appointment_id: number; // Auto-increment ID
  customer_id: number; // Foreign Key to Customer
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm (24h or 12h)
  service_type: string; // نوع الخدمة
  technician_name?: string; // اسم الفني المسؤول
  status: AppointmentStatus; // الحالة
  notes?: string; // ملاحظات الموعد
  reminder_status: ReminderStatus; // حالة التذكير
  reminder_id: number; // معرف الإشعار المجدول
  created_at: string; // ISO String
  updated_at: string; // ISO String
}

export interface AppointmentWithCustomer extends Appointment {
  customer?: Customer;
}

export interface DatabaseBackup {
  version: string;
  app: string;
  exported_at: string;
  customers: Customer[];
  appointments: Appointment[];
  checksum: string;
}

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'البحيرة',
  'الغربية',
  'المنوفية',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'كفر الشيخ',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء'
] as const;

export const SERVICE_TYPES = [
  'كشف تسريب مياه إلكتروني بالنيتروجين والموجات الصوتية',
  'كشف تسريب شبكة التغذية وضغط المواسير',
  'فحص شبكات الصرف الصحي والبالوعات',
  'كشف عزل الحمامات والمطابخ والأسطح',
  'كشف تسريب حمامات السباحة والخزانات الأرضية/العلوية',
  'فحص الرطوبة والأملاح بدون تكسير بالكاميرا الحرارية',
  'تقرير فني معتمد لشركة المياه والتأمين',
  'صيانة وإصلاح تسريب مائي فوري'
] as const;
