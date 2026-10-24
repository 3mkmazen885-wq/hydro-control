import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-blue-900/60 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-blue-600/30 text-sky-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
            <div className="truncate">
              <span className="font-semibold text-white">تطبيق Android الرسمي:</span>
              <span className="text-slate-300 text-xs mr-1 hidden sm:inline">
                ثبّت التطبيق على شاشة هاتفك الرئيسية للعمل دون إنترنت واستقبال إشعارات التذكير.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 whitespace-nowrap min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                تثبيت الآن
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition whitespace-nowrap"
              >
                تثبيت على iPhone
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">تثبيت التطبيق على آيفون (iOS)</h3>
            <div className="space-y-3 text-sm text-slate-600 my-4">
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs">١</span>
                <p>اضغط على زر <strong>مشاركة (Share)</strong> في شريط متصفح Safari بالأسفل.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs">٢</span>
                <p>مرر للأسفل واضغط على <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong>.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs">٣</span>
                <p>سيظهر التطبيق كأيقونة مستقلة على شاشتك الرئيسية ويعمل دون إنترنت.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              تم، إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
