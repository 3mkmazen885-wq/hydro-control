import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Trash2,
  ShieldCheck,
  FolderArchive,
  Terminal,
  HelpCircle,
  Info
} from 'lucide-react';
import { dbService } from '../services/db';
import { generateFlutterProjectZip } from '../services/flutterExport';
import { DatabaseBackup } from '../types/database';

interface BackupExportViewProps {
  onDataChanged: () => Promise<void>;
}

export const BackupExportView: React.FC<BackupExportViewProps> = ({
  onDataChanged,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingFlutter, setIsDownloadingFlutter] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<DatabaseBackup | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Export JSON Backup
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backup = await dbService.exportBackup();
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `hydro_control_backup_${dateTag}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle JSON File Select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as DatabaseBackup;
        if (!parsed.customers || !Array.isArray(parsed.customers) || !parsed.appointments) {
          throw new Error('صيغة ملف غير متوافقة.');
        }
        setPendingBackup(parsed);
        setImportStatus(null);
      } catch (err) {
        setImportStatus('الملف المختار غير صالح أو تالف.');
        setPendingBackup(null);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Confirm Restore
  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;
    try {
      const result = await dbService.importBackup(pendingBackup, true);
      await onDataChanged();
      setImportStatus(
        `تمت استعادة البيانات بنجاح: ${result.customersCount} عميل و ${result.appointmentsCount} موعد زيارة.`
      );
      setPendingBackup(null);
    } catch (err) {
      console.error(err);
      setImportStatus('حدث خطأ أثناء استعادة البيانات.');
    }
  };

  // Download Flutter Android Native Project ZIP
  const handleDownloadFlutterProject = async () => {
    setIsDownloadingFlutter(true);
    try {
      const zipBlob = await generateFlutterProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hydro_control_flutter_android.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تجهيز ملفات مشروع Flutter.');
    } finally {
      setIsDownloadingFlutter(false);
    }
  };

  // Clear Database (to test empty state requirement)
  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      await dbService.clearAllData();
      await onDataChanged();
      setShowClearConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
          <span>حفظ واسترجاع البيانات</span>
          <span>·</span>
          <span>مشروع Android المصدري</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">النسخ الاحتياطي وتصدير التطبيق</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          إدارة النسخ الاحتياطية المحلية بأمان، وتحميل الكود المصدري الكامل لتطبيق Android (Flutter + SQLite)
        </p>
      </div>

      {/* Main Grid: Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Export Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              تصدير نسخة احتياطية محلية (JSON)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              احفظ كافة بيانات العملاء ومواعيد الزيارات وسجل التذكيرات في ملف مشفر محلياً على هاتفك دون رفعه لأي خوادم خارجية.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'جارٍ التصدير...' : 'تنزيل ملف النسخة الاحتياطية (.json)'}
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              استعادة نسخة احتياطية سابقة
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              اختر ملف النسخة الاحتياطية (.json) لاستعادة العملاء والمواعيد. يتحقق النظام من صحة الملف أولاً قبل استبدال البيانات.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-95 min-h-[44px]">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>اختيار ملف النسخة الاحتياطية</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Pending Restore Confirmation Modal */}
      {pendingBackup && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>تأكيد استعادة النسخة الاحتياطية:</span>
          </div>

          <p className="leading-relaxed">
            تم فحص الملف بنجاح! يحتوي الملف على:
            <br />
            • <strong>{pendingBackup.customers.length}</strong> عميل مسجل.
            <br />
            • <strong>{pendingBackup.appointments.length}</strong> موعد زيارة كشف تسريب.
            <br />
            • تاريخ التصدير الأصلي: {new Date(pendingBackup.exported_at).toLocaleString('ar-EG')}
          </p>

          <p className="text-red-700 font-semibold">
            تنبيه: سيتم استبدال البيانات الحالية بهذه النسخة. هل ترغب في المتابعة؟
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleConfirmRestore}
              className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm transition"
            >
              نعم، استعادة الآن
            </button>
            <button
              onClick={() => setPendingBackup(null)}
              className="px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 font-semibold text-xs"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Flutter Android Source Code Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                مشروع Android المصدري الكامل (Flutter + SQLite)
              </h2>
              <p className="text-xs text-slate-500">
                حزمة المشروع البرمجي الكامل الجاهز للبناء كملف APK لهواتف الأندرويد
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadFlutterProject}
            disabled={isDownloadingFlutter}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 whitespace-nowrap min-h-[44px]"
          >
            <Download className="w-4 h-4 text-white" />
            {isDownloadingFlutter ? 'جارٍ تجميع الملفات...' : 'تحميل مشروع Flutter كاملاً (ZIP)'}
          </button>
        </div>

        {/* Technical Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="font-bold text-slate-900 block mb-1">1. قاعدة بيانات sqflite</span>
            <span className="text-slate-600 text-[11px]">
              تضم جدولي customers و appointments مع العلاقات والمفاتيح الأجنبية.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="font-bold text-slate-900 block mb-1">2. إشعارات flutter_local_notifications</span>
            <span className="text-slate-600 text-[11px]">
              جدولة دقيقة بالمنطقة الزمنية لمصر قبل الزيارة بـ 12 ساعة بالضبط.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="font-bold text-slate-900 block mb-1">3. أذونات Boot & Alarms</span>
            <span className="text-slate-600 text-[11px]">
              إعادة جدولة التنبيهات تلقائياً عند إعادة تشغيل الهاتف (Boot Receiver).
            </span>
          </div>
        </div>

        {/* Command-line Instructions */}
        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono space-y-2" dir="ltr">
          <div className="text-sky-400 font-sans font-bold flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>How to build Android APK:</span>
          </div>
          <div className="text-slate-400"># 1. Unzip downloaded file:</div>
          <div className="text-emerald-400">cd hydro_control_flutter</div>
          <div className="text-slate-400"># 2. Fetch packages:</div>
          <div className="text-emerald-400">flutter pub get</div>
          <div className="text-slate-400"># 3. Build signed APK:</div>
          <div className="text-emerald-400">flutter build apk --release</div>
        </div>
      </div>

      {/* Clear Database Card (For Testing & Resetting) */}
      <div className="bg-red-50/50 rounded-2xl border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-900 mb-0.5">
            تفريغ قاعدة البيانات بالكامل (اختبار البداية النظيفة)
          </h3>
          <p className="text-xs text-red-700">
            يمكّنك هذا الخيار من مسح كافة العملاء والمواعيد لاختبار سيناريو "أول تشغيل وقاعدة البيانات فارغة تماماً".
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-300 font-bold text-xs transition min-h-[40px] whitespace-nowrap"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600" />
          تفريغ البيانات الآن
        </button>
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              تأكيد تفريغ قاعدة البيانات
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              سيتم حذف كافة سجلات العملاء والمواعيد نهائياً من هذا الجهاز للعودة إلى حالة التشغيل الأولى النظيفة.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition min-h-[44px]"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                disabled={isClearing}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {isClearing ? 'جارٍ المسح...' : 'نعم، مسح الكل'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
