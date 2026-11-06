import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, AlertCircle, X, Printer, Phone, Mail, MapPin } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerName?: string;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  centerName = 'TRUNG TÂM ANH NGỮ PHÚC PHÚC THỊNH'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-800 via-red-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-snug">
                CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN & QUY CHẾ HOẠT ĐỘNG
              </h2>
              <p className="text-xs text-red-100 flex items-center gap-1.5 mt-0.5">
                <span>Tuân thủ Luật 91/2025/QH15 & Nghị định 356/2025/NĐ-CP</span>
                <span className="inline-block w-1 h-1 rounded-full bg-amber-400"></span>
                <span className="font-semibold text-amber-300">Hiệu lực từ 01/01/2026</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="In chính sách"
              aria-label="In chính sách"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-red-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Đóng cửa sổ"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed print:p-0">
          {/* Summary Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-5">
              <strong className="font-bold">Cam kết tuân thủ pháp luật công nghệ số Việt Nam:</strong>{' '}
              {centerName} cam kết thực hiện đầy đủ trách nhiệm của <em>Bên Kiểm soát và Xử lý Dữ liệu Cá nhân</em> theo quy định của <strong>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</strong>, <strong>Nghị định số 356/2025/NĐ-CP</strong> (thay thế Nghị định 13/2023/NĐ-CP), <strong>Luật An ninh mạng 2018</strong> và <strong>Luật Giao dịch điện tử 2023</strong>.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 text-xs font-black flex items-center justify-center">1</span>
              Đơn Vị Kiểm Soát & Xử Lý Dữ Liệu Cá Nhân
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-1.5">
              <p><strong>Tên đơn vị:</strong> {centerName}</p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                <span><strong>Địa bàn hoạt động:</strong> Tỉnh Tây Ninh, Việt Nam.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                <span><strong>Email tiếp nhận yêu cầu dữ liệu (DPO):</strong> phucphucthinh.edu@gmail.com</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                <span><strong>Đường dây nóng hỗ trợ:</strong> Hotline quản lý đào tạo trung tâm.</span>
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 text-xs font-black flex items-center justify-center">2</span>
              Các Loại Dữ Liệu Thu Thập & Xử Lý
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <h4 className="font-bold text-red-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dữ Liệu Học Viên (Học sinh)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Họ và tên, Mã học viên, Ảnh đại diện (nếu có).</li>
                  <li>Ngày tháng năm sinh, Giới tính.</li>
                  <li>Trường học đang theo học, Khối lớp (Khối 1 - Khối 12).</li>
                  <li>Địa chỉ nơi cư trú, Số điện thoại cá nhân (nếu có).</li>
                  <li>Kết quả học tập, điểm số kiểm tra, quá trình rèn luyện.</li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <h4 className="font-bold text-red-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dữ Liệu Phụ Huynh / Người Giám Hộ
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Họ tên cha/mẹ hoặc người giám hộ hợp pháp.</li>
                  <li>Số điện thoại liên lạc chính và phụ.</li>
                  <li>Thông tin xác nhận đồng ý xử lý dữ liệu cho con em.</li>
                  <li>Ghi chú liên lạc về sức khỏe, nguyện vọng của học sinh.</li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <h4 className="font-bold text-red-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dữ Liệu Giáo Viên & Nhân Viên Quản Lý
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Họ tên, email tài khoản Google xác thực.</li>
                  <li>Phân quyền hệ thống (chủ sở hữu / nhân viên / giáo viên).</li>
                  <li>Lịch dạy, phân công lớp và phòng học.</li>
                  <li>Nhật ký kiểm toán hoạt động truy cập hệ thống (Audit Logs).</li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <h4 className="font-bold text-red-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dữ Liệu Tài Chính & Học Phí
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Biên lai thu học phí, ngày thu, số tiền, phương thức thu.</li>
                  <li>Tình trạng công nợ, số kỳ học phí đã hoàn thành hoặc còn thiếu.</li>
                  <li>Chỉ lưu trữ số liệu kế toán nội bộ; không lưu trữ số thẻ ngân hàng.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 text-xs font-black flex items-center justify-center">3</span>
              Mục Đích Xử Lý Dữ Liệu
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dữ liệu thu thập chỉ được xử lý cho các mục đích hợp pháp sau đây và không sử dụng ngoài mục đích đã thông báo:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 pl-2">
              <li><strong>Quản lý công tác đào tạo:</strong> Điểm danh, xếp lớp, quản lý thời khóa biểu, theo dõi tiến độ học tập và cấp chứng nhận/bảng điểm.</li>
              <li><strong>Liên lạc và phối hợp phụ huynh:</strong> Thông báo tình hình học tập, lịch nghỉ học, các sự kiện khẩn cấp và kết nối gia đình - nhà trường.</li>
              <li><strong>Quản lý học phí và chứng từ:</strong> Lập phiếu thu, theo dõi công nợ, xuất biên lai và báo cáo thống kê kế toán nội bộ theo quy định.</li>
              <li><strong>Bảo đảm an ninh hệ thống:</strong> Ghi vết kiểm toán (audit trail), phát hiện và ngăn chặn truy cập trái phép, bảo vệ tài nguyên trung tâm.</li>
            </ul>
          </section>

          {/* Section 4 - Special protection for children */}
          <section className="space-y-2">
            <div className="border-2 border-red-200 bg-red-50/60 rounded-2xl p-4">
              <h3 className="text-sm font-extrabold text-red-900 flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-red-700" />
                Bảo Vệ Dữ Liệu Cá Nhân Của Trẻ Em (Theo Điều 24 Luật 91/2025/QH15)
              </h3>
              <div className="text-xs text-red-950 space-y-2 leading-relaxed">
                <p>
                  1. Đa số học viên tại trung tâm ở lứa tuổi mầm non, tiểu học và trung học (dưới 16 tuổi - trẻ em theo quy định của Luật Trẻ em và Luật Bảo vệ dữ liệu cá nhân).
                </p>
                <p>
                  2. <strong>Bắt buộc có sự đồng ý của cha mẹ hoặc người giám hộ:</strong> Mọi thông tin của học viên chỉ được nhập vào hệ thống sau khi đã có sự đồng ý rõ ràng, tự nguyện của cha mẹ hoặc người giám hộ hợp pháp tại phiếu đăng ký nhập học hoặc qua xác nhận thỏa thuận.
                </p>
                <p>
                  3. <strong>Không kinh doanh dữ liệu:</strong> Trung tâm cam kết <em>tuyệt đối không chia sẻ, bán, chuyển nhượng hoặc cung cấp dữ liệu học viên</em> cho bất kỳ bên thứ ba nào vì mục đích tiếp thị, quảng cáo hoặc thương mại.
                </p>
                <p>
                  4. Khi trẻ em từ đủ 7 tuổi trở lên, trung tâm tôn trọng quyền được bày tỏ ý kiến của trẻ theo đúng quy định của pháp luật.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 - Infrastructure & Cloud */}
          <section className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 text-xs font-black flex items-center justify-center">5</span>
              Lưu Trữ, Bảo Mật & Bên Thứ Ba Cung Cấp Hạ Tầng
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống áp dụng các biện pháp bảo mật kỹ thuật và tổ chức nghiêm ngặt theo tiêu chuẩn quốc tế và Luật An ninh mạng:
            </p>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 min-w-32">Xác thực Google OAuth:</div>
                <div>Đăng nhập an toàn bằng giao thức OAuth 2.0; mật khẩu tài khoản Google không bao giờ lưu trữ trên hệ thống trung tâm.</div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 min-w-32">Máy chủ CSDL Supabase:</div>
                <div>Dữ liệu lưu trữ trên dịch vụ đám mây Supabase (PostgreSQL mã hóa SSL khi truyền tải, Row Level Security và phân quyền chặt chẽ).</div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 min-w-32">Phân quyền RBAC:</div>
                <div>Chỉ người có thẩm quyền (Owner/Quản lý) mới có thể xem toàn bộ; nhân viên chỉ được thao tác trong phạm vi quyền hạn được cấp.</div>
              </div>
            </div>
          </section>

          {/* Section 6 - Data Subject Rights */}
          <section className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 text-xs font-black flex items-center justify-center">6</span>
              Quyền Của Chủ Thể Dữ Liệu & Quy Trình Tiếp Nhận
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Học viên, Phụ huynh và Cán bộ giáo viên được hưởng đầy đủ 11 quyền của chủ thể dữ liệu theo Điều 9 Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, bao gồm:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Quyền được biết & đồng ý:</strong> Được thông báo đầy đủ về hoạt động xử lý dữ liệu trước khi cung cấp.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Quyền xem & chỉnh sửa:</strong> Yêu cầu tra cứu, bổ sung hoặc hiệu chỉnh thông tin cá nhân bị sai sót.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Quyền rút lại sự đồng ý:</strong> Có quyền rút lại sự đồng ý đã cấp cho các mục đích không bắt buộc.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Quyền xóa dữ liệu:</strong> Yêu cầu xóa dữ liệu khi học viên thôi học (trừ hồ sơ lưu trữ kế toán bắt buộc).
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 mt-2">
              <strong>Thời hạn cam kết xử lý yêu cầu (Theo Điều 10 Luật 91/2025/QH15):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Xác nhận tiếp nhận yêu cầu: Trong vòng <strong>02 ngày làm việc</strong> kể từ khi nhận được đơn hợp lệ.</li>
                <li>Thực hiện yêu cầu chỉnh sửa/xóa/cung cấp dữ liệu: Hoàn tất trong thời hạn từ <strong>10 đến 20 ngày</strong> theo luật định.</li>
              </ul>
            </div>
          </section>

          {/* Section 7 - Contact */}
          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Hiệu Lực & Sửa Đổi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chính sách này có hiệu lực kể từ ngày ban hành. {centerName} có quyền cập nhật chính sách này khi có sự điều chỉnh của văn bản quy phạm pháp luật hoặc thay đổi về quy trình vận hành. Phiên bản cập nhật sẽ được công bố công khai trên hệ thống nội bộ.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Bản quyền © 2026 {centerName}. Mọi quyền được bảo lưu.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
