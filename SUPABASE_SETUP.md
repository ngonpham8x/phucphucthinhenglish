# Thiết lập Supabase Dashboard

Thực hiện trực tiếp trong project Supabase của trung tâm. Không đưa secret key, SMTP password hoặc email quản trị viên vào GitHub, file `.env`, hoặc chat.

## 1. Tạo cấu trúc bảo mật và thêm owner riêng tư

1. Vào **SQL Editor** → **New query**.
2. Mở file `supabase/migrations/001_auth_profiles.sql` trong repository, sao chép toàn bộ nội dung vào SQL Editor, rồi chọn **Run**.
3. Tạo query mới, chạy tiếp toàn bộ `supabase/migrations/002_bootstrap_owners.sql`.
4. Vào **Table Editor** → schema `public` → bảng `owner_bootstrap_allowlist` → **Insert**.
5. Thêm một dòng cho mỗi trong hai email Chủ trung tâm đã trao đổi, chỉ điền cột `email`; không cần điền `created_at`.
6. Không chia sẻ ảnh màn hình hoặc export của bảng này. Bảng đã bật RLS và browser không có quyền đọc nó.

Nếu một trong hai chủ đã đăng nhập trước khi được thêm vào allowlist, trigger của migration sẽ tự chuyển profile tương ứng thành `owner` và kích hoạt tài khoản ngay khi bạn lưu dòng đó.

## 2. Thiết lập Email Auth

1. Vào **Authentication** → **Providers** → **Email**.
2. Bật Email provider và bật **Confirm email**.
3. Tắt **Allow new users to sign up** sau khi hoàn thành bước bootstrap ở phần 4 bên dưới.
4. Vào **Authentication** → **URL Configuration**. Tạm thời có thể để Site URL là `http://localhost:3000`; sau khi Vercel deploy, thay bằng HTTPS domain thật.

Email/password dùng lời mời do Chủ trung tâm tạo trong ứng dụng. Không có nút đăng ký công khai.

## 3. Thiết lập Google OAuth

1. Trong Google Cloud Console, tạo/chọn project → **Google Auth Platform**.
2. Hoàn thành **Branding**, **Audience** và **Data Access**. Các scope cần có là `openid`, email và profile.
3. Tạo **OAuth client ID** loại **Web application**.
4. Ở **Authorized JavaScript origins**, thêm `http://localhost:3000` và sau đó thêm Vercel HTTPS domain.
5. Ở **Authorized redirect URIs**, dùng chính callback URL hiển thị trong trang Google provider của Supabase (không dùng URL ứng dụng Vercel ở ô này).
6. Quay lại Supabase → **Authentication** → **Providers** → **Google**, bật provider và dán Client ID/Client Secret từ Google Cloud → Save.

## 4. Bootstrap hai Chủ trung tâm

Để hai tài khoản Google đầu tiên được tạo một cách có kiểm soát:

1. Sau khi allowlist ở phần 1 đã có đủ hai dòng, bật tạm **Allow new users to sign up**.
2. Mở ứng dụng local hoặc Vercel preview, đăng nhập Google một lần bằng từng email Chủ trung tâm đã được allowlist.
3. Vào **Authentication** → **Users** để kiểm tra đã có đúng hai user cần thiết.
4. Tắt lại **Allow new users to sign up**.

Trong thời gian bootstrap, bất kỳ email không nằm trong allowlist vẫn chỉ tạo profile `staff` **inactive** và không thể vào ứng dụng. Sau khi tắt signup, user mới chỉ có thể được mời bởi Chủ trung tâm qua API server.

## 5. Lấy khóa và cấu hình Vercel

1. Vào **Project Settings** → **API**.
2. Sao chép Project URL và publishable key để dùng làm `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` trên Vercel.
3. Sao chép secret key (hoặc legacy service-role key) chỉ để dùng làm `SUPABASE_SECRET_KEY` trên Vercel. Không bao giờ dùng tiền tố `VITE_` cho key này.
4. Sau khi Vercel tạo domain, cập nhật Site URL, Redirect URLs và `APP_URL` bằng domain HTTPS đó.

## 6. Email gửi lời mời và reset mật khẩu

Vào **Project Settings** → **Auth** → **SMTP Settings** để thêm SMTP riêng trước khi dùng thật. Dịch vụ email mặc định chỉ phù hợp thử nghiệm và có giới hạn gửi rất thấp; nên dùng SMTP có domain gửi riêng như Resend, SendGrid, Mailgun hoặc SES.

## 7. Kiểm tra cuối

1. Đăng nhập Google bằng một owner và kiểm tra có nút quản lý tài khoản.
2. Mời một email thử nghiệm role `staff`; email mời phải đến hộp thư và cho phép đặt mật khẩu.
3. Xác nhận staff không mở được phần quản lý tài khoản.
4. Đăng xuất, thử một email chưa được mời; ứng dụng phải hiển thị trạng thái chưa được cấp quyền.
