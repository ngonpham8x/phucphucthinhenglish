import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Share, PlusSquare, ArrowDownToLine, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Check if standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Top Branding Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 -mx-6 -mt-6 p-5 text-white mb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-amber-300">
              PPT
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Ứng Dụng Di Động & Máy Tính
              </div>
              <h3 className="text-base font-extrabold text-white">Tải App Ra Màn Hình Chính</h3>
              <p className="text-[11px] text-red-100">Truy cập tức thì - Không lo mất kết nối - Chuẩn PWA</p>
            </div>
          </div>
        </div>

        {isInstalled ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Ứng dụng đã được cài đặt!</h4>
            <p className="text-xs text-slate-600">
              Bạn có thể mở trực tiếp phần mềm từ biểu tượng trên màn hình điện thoại hoặc máy tính của mình.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Native Install Button if browser supports beforeinstallprompt */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all border border-amber-400/40"
              >
                <ArrowDownToLine className="w-5 h-5 text-amber-300" />
                Cài Đặt Ngay Cho Thiết Bị
              </button>
            )}

            {/* Step-by-step Tabs based on Device */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  {deviceType === 'ios' && <Smartphone className="w-4 h-4 text-red-700" />}
                  {deviceType === 'android' && <Smartphone className="w-4 h-4 text-emerald-600" />}
                  {deviceType === 'desktop' && <Monitor className="w-4 h-4 text-blue-600" />}
                  Hướng dẫn cài đặt ({deviceType === 'ios' ? 'iPhone / iPad' : deviceType === 'android' ? 'Điện thoại Android' : 'Máy tính / PC / Mac'})
                </span>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                  100% An toàn
                </span>
              </div>

              {deviceType === 'ios' && (
                <ol className="space-y-2.5 text-slate-700 list-decimal list-inside">
                  <li>
                    Mở trình duyệt <span className="font-bold text-slate-900">Safari</span> trên iPhone/iPad.
                  </li>
                  <li className="flex items-center gap-1 flex-wrap">
                    Nhấn vào nút <span className="inline-flex items-center gap-1 bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-900"><Share className="w-3.5 h-3.5 text-blue-600" /> Chia sẻ</span> ở thanh công cụ phía dưới màn hình Safari.
                  </li>
                  <li className="flex items-center gap-1 flex-wrap">
                    Cuộn xuống và chọn <span className="inline-flex items-center gap-1 bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-900"><PlusSquare className="w-3.5 h-3.5 text-slate-700" /> Thêm vào MH chính (Add to Home Screen)</span>.
                  </li>
                  <li>
                    Nhấn <span className="font-bold text-red-700">Thêm (Add)</span> ở góc trên phải. Biểu tượng ứng dụng sẽ xuất hiện ngay trên màn hình chính!
                  </li>
                </ol>
              )}

              {deviceType === 'android' && (
                <ol className="space-y-2.5 text-slate-700 list-decimal list-inside">
                  <li>
                    Mở trình duyệt <span className="font-bold text-slate-900">Chrome / Cốc Cốc / Samsung Internet</span>.
                  </li>
                  <li>
                    Nhấn vào biểu tượng <span className="font-bold text-slate-900">⋮ (Menu 3 chấm)</span> ở góc trên bên phải màn hình.
                  </li>
                  <li>
                    Chọn <span className="font-bold text-red-800">"Cài đặt ứng dụng"</span> hoặc <span className="font-bold text-red-800">"Thêm vào màn hình chính"</span>.
                  </li>
                  <li>
                    Xác nhận <span className="font-bold text-red-700">Thêm</span>. Màn hình điện thoại sẽ có biểu tượng ứng dụng riêng biệt!
                  </li>
                </ol>
              )}

              {deviceType === 'desktop' && (
                <ol className="space-y-2.5 text-slate-700 list-decimal list-inside">
                  <li>
                    Trình duyệt Google Chrome / Microsoft Edge / Cốc Cốc trên máy tính.
                  </li>
                  <li>
                    Nhìn lên thanh địa chỉ (URL) ở góc phải, nhấn biểu tượng <span className="inline-flex items-center gap-1 bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-900"><ArrowDownToLine className="w-3.5 h-3.5 text-red-700" /> Cài đặt App</span>.
                  </li>
                  <li>
                    Hoặc bấm Menu <span className="font-bold text-slate-900">⋮</span> -&gt; <span className="font-bold text-slate-900">Lưu và chia sẻ</span> -&gt; <span className="font-bold text-red-700">Cài đặt Trung Tâm Anh Ngữ Phúc Phúc Thịnh</span>.
                  </li>
                </ol>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Sau khi thêm ra màn hình chính, app sẽ tự động thích ứng hoàn toàn giao diện di động, máy tính bảng và máy tính.</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
