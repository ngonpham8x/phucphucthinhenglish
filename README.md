# Trung tâm Anh ngữ Phúc Phúc Thịnh

Ứng dụng quản lý nội bộ, xây dựng bằng React/Vite và sẵn sàng deploy trên Vercel.

## Chạy cục bộ

1. Cài Node.js 20 LTS hoặc mới hơn.
2. Chạy `npm install`.
3. Sao chép `.env.example` thành `.env.local` rồi nhập cấu hình Supabase.
4. Chạy `npm run dev`.

## Đăng nhập và phân quyền

- Đăng nhập Google OAuth và email/mật khẩu qua Supabase Auth.
- Không có tự đăng ký công khai.
- Hai cấp bậc: `owner` (Chủ trung tâm) và `staff` (Nhân viên).
- Chỉ `owner` có thể cấp tài khoản trực tiếp bằng email hoặc khóa tài khoản.

Đọc quy trình thiết lập Supabase trong [SUPABASE_SETUP.md](SUPABASE_SETUP.md) và yêu cầu bảo mật/deploy trong [SECURITY.md](SECURITY.md).
