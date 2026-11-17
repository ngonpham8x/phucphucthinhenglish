# Trung tâm Anh ngữ Phúc Phúc Thịnh

Ứng dụng quản lý nội bộ, xây dựng bằng React/Vite và sẵn sàng deploy trên Vercel.

## Chạy cục bộ

1. Cài Node.js 20 LTS hoặc mới hơn.
2. Chạy `npm install`.
3. Sao chép `.env.example` thành `.env.local` rồi nhập cấu hình Supabase.
4. Chạy `npm run dev`.

## Đăng nhập và phân quyền

- Chỉ đăng nhập bằng Google OAuth; hệ thống không hiển thị đăng nhập email/mật khẩu.
- Không có tự đăng ký công khai.
- Hai cấp bậc: `owner` (Chủ trung tâm) và `staff` (Nhân viên).
- Chỉ `owner` có thể cấp quyền Google trực tiếp bằng email hoặc khóa tài khoản.

Đọc quy trình thiết lập Supabase trong [SUPABASE_SETUP.md](SUPABASE_SETUP.md) và yêu cầu bảo mật/deploy trong [SECURITY.md](SECURITY.md).


### Kiểm thử học phí và đồng bộ Excel

- `npm test`: kiểm tra thu nhiều đợt, doanh thu theo ngày thu, công nợ, danh sách nhiều lớp và nhập/xuất Excel.
- `npm run test:excel`: sau `npm test`, chạy Excel Desktop trên tệp dữ liệu kiểm thử trong `.review`, kiểm tra thêm/sửa/xóa học viên, tách tiền theo lớp, đổi ngày thu và xóa đợt cuối. Cần Windows có Excel và cho phép chạy macro của tệp kiểm thử.
- Excel và website đồng bộ qua xuất/nhập tệp, không cập nhật trực tiếp hai chiều. Với học viên nhiều lớp, cột Mã lớp dùng dấu phẩy; khoản nhập trực tiếp ở HỌC SINH thuộc lớp đầu tiên. Dùng HỌC PHÍ để ghi khoản thu riêng từng lớp.
- Tệp Excel đã xuất trước bản sửa cần được xuất lại để nhận macro mới. Mỗi đợt đóng thêm phải có một dòng phiếu thu và ngày thu thực tế riêng; không cộng dồn vào dòng của đợt trước.
- Báo cáo mới giữ hồ sơ học viên chưa xếp lớp, các thông tin phụ huynh/trường/khối/email/ngày nhập học, danh mục và lịch học khi nhập lại. Không xóa cột ẩn hoặc sheet `_PPTE_DATA` dùng bảo toàn các trường không có trong mẫu cũ.
- Macro tạo sheet khi thêm lớp, thêm cột cho tháng thu mới và cập nhật tham chiếu khi đổi mã. Công thức dùng vùng tên tự mở rộng, thay giới hạn 1.000 dòng; bảng tra cứu được mở rộng theo số học viên.
- Chỉ sửa HỌC SINH, HỌC PHÍ, LỚP HỌC và cột điểm nguồn. Sheet Lớp/TỔNG QUAN là báo cáo; nhập trực tiếp có thể bị ghi đè khi đồng bộ.
- Đợi trạng thái đồng bộ hoàn tất ở HƯỚNG DẪN!A17 rồi lưu/Save As. Thao tác lưu khi đang chờ đồng bộ sẽ được chặn để tránh đổi tên tệp trước khi callback hoàn tất.
- Import toàn hệ thống dừng khi có lỗi liên kết, hiển thị số học viên/lớp bị xóa và tải xuống bản JSON trước khi thay dữ liệu. Lịch sử sao lưu/nhật ký được giữ lại.
- `npm run build:excel`: đóng gói lại VBA từ `excel-macros` vào mẫu XLSM theo MS-OVBA, không cần đổi cài đặt bảo mật Office. Sau khi sửa VBA phải chạy lệnh này trước `npm test` và kiểm thử Excel thật.
