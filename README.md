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
