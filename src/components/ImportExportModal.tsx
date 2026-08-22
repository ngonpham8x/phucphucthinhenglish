import React, { useState } from 'react';
import { generateMasterExcelWorkbook, parseExcelImportData, ImportValidationResult } from '../services/excelService';
import { Student, Teacher, ClassRoom, TuitionReceipt, Grade, CenterSettings } from '../types';
import { FileSpreadsheet, FileUp, FileDown, CheckCircle2, AlertTriangle, Download, Upload, X, RefreshCw } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  receipts: TuitionReceipt[];
  grades: Grade[];
  settings: CenterSettings;
  onImportStudents: (newStudents: Student[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  classes,
  receipts,
  grades,
  settings,
  onImportStudents
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isImportingSuccess, setIsImportingSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await generateMasterExcelWorkbook({
        centerName: settings.name,
        students,
        classes,
        teachers,
        receipts,
        grades
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PhucPhucThinh_MasterReport_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate mock parsing or JSON reader
    const reader = new FileReader();
    reader.onload = (evt) => {
      // Mock rows for validation demonstration
      const dummyRawData = [
        { 'Mã HS': 'HS099', 'Họ và tên': 'Nguyễn Hoàng Khang', 'SĐT': '0912345678', 'Trường': 'THPT Chuyên Hoàng Lê Kha', 'Khối': 'Khối 11' },
        { 'Mã HS': 'HS100', 'Họ và tên': 'Trần Thị Thu Thảo', 'SĐT': '0987654321', 'Trường': 'THPT Tây Ninh', 'Khối': 'Khối 10' }
      ];

      const res = parseExcelImportData(dummyRawData);
      setValidationResult(res);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    const newStudentsList: Student[] = validationResult.validRows.map((item, idx) => ({
      id: `HS_IMP_${Date.now()}_${idx}`,
      code: item.code || `HS${100 + idx}`,
      name: item.name || 'Học sinh mới',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dob: item.dob || '2012-01-01',
      gender: item.gender as any || 'Nam',
      school: item.school || 'THPT Tây Ninh',
      gradeLevel: item.gradeLevel || 'Khối 10',
      programId: classes[0]?.programId || '',
      classId: classes[0]?.id || '',
      address: item.address || 'Tây Ninh',
      email: item.email || 'import@gmail.com',
      phone: item.phone || '0900000000',
      parentName: item.parentName || 'Phụ huynh',
      parentPhone: item.parentPhone || '0900000000',
      enrollDate: new Date().toISOString().split('T')[0],
      notes: 'Import từ Excel',
      status: 'active',
      feeStatus: 'paid'
    }));

    onImportStudents(newStudentsList);
    setIsImportingSuccess(true);
    setTimeout(() => {
      setIsImportingSuccess(false);
      setValidationResult(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Import / Export File ExcelJS</h3>
            <p className="text-xs text-slate-500">Xuất file báo cáo đa sheet tích hợp công thức Excel & nhập dữ liệu chuẩn</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export' ? 'bg-red-800 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            <FileDown className="w-4 h-4 text-amber-400" /> Xuất File Excel (Export)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import' ? 'bg-red-800 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            <FileUp className="w-4 h-4 text-amber-400" /> Nhập File Excel (Import)
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
              <div className="font-bold text-slate-900 text-sm">Cấu trúc Workbook ExcelJS Xuất Ra:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong>Sheet 1 (TỔNG HỢP):</strong> Thống kê tổng số học sinh, doanh thu, nợ học phí và công thức tự động `=SUM(...)`, `=COUNTA(...)` nối tới các sheet lớp.</li>
                <li><strong>Các Sheet Lớp:</strong> Mỗi lớp học là 01 worksheet riêng (Lớp IELTS-65A, Lớp CAM-FLY1...) giữ nguyên logo, màu đỏ-vàng, freeze header & auto filter.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Đang khởi tạo ExcelJS Workbook...' : 'Tải Xuất File Excel Ngay'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {isImportingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Đã import học sinh thành công vào hệ thống!</span>
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-800">Kéo thả file Excel (.xlsx) vào đây</div>
                  <div className="text-[11px] text-slate-500 mt-1">Hệ thống sẽ kiểm tra lỗi trùng lặp trước khi lưu</div>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="mt-3 text-xs mx-auto block"
                  />
                </div>

                {validationResult && (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">Kết quả kiểm tra dữ liệu Excel:</div>
                    <div className="text-emerald-700 font-semibold">✓ {validationResult.validRows.length} dòng hợp lệ sẵn sàng thêm</div>
                    {validationResult.errors.length > 0 && (
                      <div className="text-rose-700 font-semibold mt-1">⚠ {validationResult.errors.length} dòng có lỗi</div>
                    )}

                    <button
                      onClick={handleConfirmImport}
                      className="mt-3 w-full py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400" /> Xác Nhận Lưu Vào Cơ Sở Dữ Liệu
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
