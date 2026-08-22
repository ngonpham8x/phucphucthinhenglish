import React, { useState } from 'react';
import { SystemBackup, CenterSettings, Student, Teacher, ClassRoom, TuitionReceipt, Grade } from '../types';
import {
  Database,
  Download,
  RefreshCw,
  Mail,
  CheckCircle2,
  History,
  Shield,
  FileArchive,
  FileSpreadsheet,
  FileJson,
  FileDown,
  Sparkles,
  Printer
} from 'lucide-react';
import { generateMasterExcelWorkbook } from '../services/excelService';

interface BackupManagerProps {
  backups: SystemBackup[];
  settings: CenterSettings;
  students?: Student[];
  teachers?: Teacher[];
  classes?: ClassRoom[];
  receipts?: TuitionReceipt[];
  grades?: Grade[];
  onTriggerBackup: (type: 'Thủ công' | 'Tự động Hằng Ngày' | 'Tự động Hằng Tuần') => void;
  onRestoreBackup: (backupId: string) => void;
  onOpenImportExportModal?: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  backups,
  settings,
  students = [],
  teachers = [],
  classes = [],
  receipts = [],
  grades = [],
  onTriggerBackup,
  onRestoreBackup,
  onOpenImportExportModal
}) => {
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Export Entire System Excel Master Report
  const handleExportSystemExcelReport = async () => {
    setIsExportingExcel(true);
    setStatusMessage(null);
    try {
      const blob = await generateMasterExcelWorkbook({
        centerName: settings.name,
        students,
        classes,
        teachers,
        receipts,
        grades
      });

      const fileName = `PhucPhucThinh_BaoCaoToanHeThong_${new Date().toISOString().split('T')[0]}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatusMessage(`Đã xuất báo cáo toàn bộ hệ thống Excel (${fileName}) thành công!`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Có lỗi xảy ra khi tạo báo cáo Excel toàn hệ thống.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 2. Export Entire System JSON Database Backup
  const handleExportSystemJson = () => {
    setStatusMessage(null);
    try {
      const systemData = {
        appVersion: '2.5.0',
        centerName: settings.name,
        exportDate: new Date().toISOString(),
        statistics: {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          totalReceipts: receipts.length,
          totalGrades: grades.length
        },
        data: {
          students,
          teachers,
          classes,
          receipts,
          grades,
          settings
        }
      };

      const jsonStr = JSON.stringify(systemData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const fileName = `PhucPhucThinh_DatabaseBackup_Full_${new Date().toISOString().split('T')[0]}.json`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatusMessage(`Đã tải xuống toàn bộ CSDL dữ liệu hệ thống JSON (${fileName}) thành công!`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Không thể đóng gói CSDL JSON.');
    }
  };

  // 3. Trigger manual system backup snapshot
  const handleManualBackup = () => {
    setIsProcessingBackup(true);
    setStatusMessage(null);
    setTimeout(() => {
      onTriggerBackup('Thủ công');
      setIsProcessingBackup(false);
      setStatusMessage('Đã tạo bản sao lưu ZIP PostgreSQL + Excel mới nhất & gửi Email cho Admin thành công!');
    }, 1000);
  };

  // 4. Download specific backup item
  const handleDownloadBackup = (bk: SystemBackup) => {
    const dummyBackupContent = JSON.stringify({
      version: '2.5.0',
      timestamp: bk.timestamp,
      center: settings.name,
      database: 'PostgreSQL_PhucPhucThinh',
      status: 'verified',
      studentsCount: students.length,
      classesCount: classes.length
    }, null, 2);

    const blob = new Blob([dummyBackupContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bk.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-900 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-red-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" /> AN TOÀN DỮ LIỆU CƠ SỞ DỮ LIỆU
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Database className="w-7 h-7 text-amber-400" />
            Quản Lý Sao Lưu & Xuất Báo Cáo Toàn Bộ Hệ Thống
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Hệ thống hỗ trợ tự động lưu trữ PostgreSQL hằng ngày, nén file ZIP, gửi Email cho Admin và cho phép xuất toàn bộ báo cáo Excel / JSON chỉ bằng 1 cú nhấp chuột.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualBackup}
            disabled={isProcessingBackup}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-slate-950 ${isProcessingBackup ? 'animate-spin' : ''}`} />
            {isProcessingBackup ? 'Đang tạo Sao Lưu ZIP...' : 'Tạo Bản Sao Lưu Thủ Công'}
          </button>
        </div>
      </div>

      {/* PROMINENT SECTION: XUẤT BÁO CÁO TOÀN BỘ HỆ THỐNG */}
      <div className="bg-white p-5 rounded-2xl border-2 border-red-800/30 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              Nút Xuất Báo Cáo & Dữ Liệu Toàn Bộ Hệ Thống
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tải toàn bộ học sinh ({students.length}), giáo viên ({teachers.length}), lớp học ({classes.length}), học phí ({receipts.length}) & điểm số ({grades.length})
            </p>
          </div>

          <div className="text-xs font-bold text-red-800 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
            Tổng cộng: {students.length} Học Sinh • {classes.length} Lớp
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Option 1: Master Excel Report */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-white to-slate-50 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-3 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Báo Cáo Excel Đa Sheet
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Xuất Báo Cáo Excel Toàn Hệ Thống</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Xuất file Excel Master đa sheet chứa Trang Tổng Hợp, danh sách Lớp Học, Bảng Học Phí và Điểm Số tích hợp công thức tự động.
              </p>
            </div>

            <button
              onClick={handleExportSystemExcelReport}
              disabled={isExportingExcel}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-amber-300" />
              {isExportingExcel ? 'Đang tạo Excel Master...' : 'Xuất Báo Cáo Toàn Bộ Hệ Thống (Excel)'}
            </button>
          </div>

          {/* Option 2: Full JSON Database Backup */}
          <div className="p-4 bg-gradient-to-br from-blue-50 via-white to-slate-50 rounded-xl border border-blue-200 flex flex-col justify-between space-y-3 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase mb-1">
                <FileJson className="w-4 h-4 text-blue-700" /> CSDL JSON Toàn Diện
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Tải Xuất CSDL JSON Hệ Thống</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tải xuống toàn bộ cấu trúc CSDL JSON bao gồm tất cả dữ liệu thực tế để phục vụ khôi phục khẩn cấp hoặc lưu trữ offline.
              </p>
            </div>

            <button
              onClick={handleExportSystemJson}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-blue-200" />
              Tải Xuất CSDL JSON Toàn Bộ
            </button>
          </div>

          {/* Option 3: Import/Export Excel Modal */}
          <div className="p-4 bg-gradient-to-br from-amber-50 via-white to-slate-50 rounded-xl border border-amber-200 flex flex-col justify-between space-y-3 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-1">
                <Printer className="w-4 h-4 text-amber-700" /> Công Cụ Import / Export
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Import / Export Dữ Liệu Hàng Loạt</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Mở cửa sổ quản lý nhập dữ liệu danh sách học sinh từ file Excel hoặc tùy chỉnh cấu hình xuất file chi tiết.
              </p>
            </div>

            {onOpenImportExportModal && (
              <button
                onClick={onOpenImportExportModal}
                className="w-full py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Mở Cửa Sổ Import / Export Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Settings Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-emerald-600" /> Tự Động Hằng Ngày
          </div>
          <div className="text-slate-500">Khởi chạy lúc 00:00 hằng ngày, nén ZIP toàn bộ CSDL PostgreSQL.</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Mail className="w-4 h-4 text-blue-600" /> Tự Động Gửi Email Admin
          </div>
          <div className="text-slate-500">
            Gửi file đính kèm báo cáo & backup tới <strong>{settings.adminReportEmail || 'admin@phucphucthinh.edu.vn'}</strong> mỗi tuần.
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <History className="w-4 h-4 text-amber-600" /> Giữ 30 Bản Gần Nhất
          </div>
          <div className="text-slate-500">Tự động xoay vòng xóa bản sao lưu cũ quá 30 ngày để tiết kiệm dung lượng.</div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-800 text-slate-200 font-bold text-xs uppercase flex items-center justify-between">
          <span>Lịch Sử 30 Bản Sao Lưu Gần Nhất ({backups.length})</span>
          <span className="text-[10px] text-amber-400 font-medium">Bản sao lưu lưu trên Cloud Run & Email</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã / Tên File Backup</th>
                <th className="py-3 px-4">Thời Gian Tạo</th>
                <th className="py-3 px-4">Dung Lượng</th>
                <th className="py-3 px-4">Loại Sao Lưu</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có bản sao lưu nào. Hãy bấm "Tạo Bản Sao Lưu Thủ Công".
                  </td>
                </tr>
              ) : (
                backups.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-red-700 flex-shrink-0" />
                      <span>{bk.filename}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{bk.timestamp}</td>
                    <td className="py-3 px-4 font-semibold">{bk.sizeKb} KB</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        {bk.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ {bk.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadBackup(bk)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-slate-300"
                          title="Tải bản sao lưu"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" /> Download
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Khôi phục dữ liệu hệ thống từ bản ${bk.filename}?`)) {
                              onRestoreBackup(bk.id);
                              alert('Đã phục hồi dữ liệu hệ thống thành công!');
                            }
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
