# BÁO CÁO KIỂM TOÁN TUÂN THỦ PHÁP LUẬT VIỆT NAM (VIETNAMESE LAW COMPLIANCE AUDIT)
**Hệ thống Quản lý Đào tạo & Tài chính - Trung Tâm Anh Ngữ Phúc Phúc Thịnh**  
*Căn cứ theo phương pháp kiểm toán mã nguồn mở [vn-law-check](https://github.com/mhfed/vn-law-check)*  
*Thời điểm rà soát & khắc phục: Năm 2026*

---

## 1. TỔNG QUAN HỆ THỐNG & PHẠM VI RÀ SOÁT

- **Tên hệ thống:** Trung Tâm Anh Ngữ Phúc Phúc Thịnh (Tây Ninh) - Ứng dụng Web / PWA Quản lý Nội bộ.
- **Mục tiêu hệ thống:** Quản lý thông tin học sinh, phụ huynh, giáo viên, sắp xếp lớp học, thời khóa biểu, điểm số, thu học phí và theo dõi công nợ, sao lưu dữ liệu.
- **Hạ tầng công nghệ:** React 19, TypeScript, Tailwind CSS, Vite, Supabase Cloud (PostgreSQL), Google OAuth 2.0.
- **Phân loại rủi ro pháp lý (Triage Level):**
  - **Cấp độ 2 (Level 2 - EdTech & Personal Data Controller):** Hệ thống đóng vai trò là *Bên Kiểm soát và Xử lý Dữ liệu Cá nhân* (Data Controller & Processor).
  - Đặc biệt nhạy cảm do quản lý thông tin học sinh từ Khối 1 đến Khối 12 (phần lớn là **trẻ em dưới 16 tuổi**), thông tin liên hệ phụ huynh và giao dịch học phí nội bộ.

---

## 2. CĂN CỨ PHÁP LÝ ÁP DỤNG

Báo cáo được đối soát trực tiếp theo hệ thống văn bản quy phạm pháp luật hiện hành của Việt Nam:

1. **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** (Quốc hội khóa XV thông qua ngày 27/06/2025, có hiệu lực từ **01/01/2026**).
2. **Nghị định số 356/2025/NĐ-CP** của Chính phủ quy định chi tiết và hướng dẫn thi hành Luật Bảo vệ dữ liệu cá nhân (thay thế Nghị định 13/2023/NĐ-CP).
3. **Luật An ninh mạng số 24/2018/QH14** và **Nghị định số 53/2022/NĐ-CP** quy định chi tiết thi hành Luật An ninh mạng.
4. **Luật Giao dịch điện tử số 20/2023/QH15** (có hiệu lực từ 01/07/2024).
5. **Luật Trẻ em số 102/2016/QH13** và quy định về bảo vệ trẻ em trên môi trường mạng.

---

## 3. DANH SÁCH VI PHẠM & LỖ HỔNG PHÁP LÝ PHÁT HIỆN ĐƯỢC (GAP ANALYSIS)

Trước khi tiến hành khắc phục, hệ thống có 5 điểm thiếu sót / nguy cơ vi phạm pháp luật sau:

| Mã | Hạng mục kiểm toán | Hiện trạng ban đầu | Căn cứ điều luật | Mức độ rủi ro |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | **Chính sách bảo vệ DLCN** | Hệ thống hoàn toàn không có văn bản hoặc cửa sổ Chính sách bảo mật / quyền riêng tư công khai. | Điều 9 & Điều 13 Luật 91/2025/QH15; Nghị định 356/2025/NĐ-CP | 🔴 **CAO** (Phạt tiền 100M-200M hoặc đình chỉ hoạt động xử lý dữ liệu) |
| **GAP-02** | **Bảo vệ dữ liệu trẻ em** | Học sinh (6-15 tuổi) được thêm vào hệ thống với họ tên, ngày sinh, trường, lớp nhưng không có trường xác nhận/ghi nhận sự đồng ý của cha mẹ/người giám hộ. | Điều 24 Luật 91/2025/QH15; Luật Trẻ em 2016 | 🔴 **RẤT CAO** (Vi phạm nghiêm trọng về dữ liệu người dưới 16 tuổi) |
| **GAP-03** | **Đăng nhập & Thỏa thuận** | `AuthScreen.tsx` chỉ hiển thị nút "Đăng nhập với Google" mà không dẫn chiếu đến Điều khoản sử dụng và Chính sách dữ liệu. | Điều 17, 18 Luật 91/2025/QH15; Nghị định 52/2013/NĐ-CP | 🟡 **TRUNG BÌNH** (Thiếu căn cứ đồng ý minh thị khi xác thực tài khoản) |
| **GAP-04** | **Quyền của chủ thể dữ liệu** | Chưa công bố kênh liên hệ DPO, quy trình tiếp nhận và thời hạn luật định (2 ngày xác nhận, 10-20 ngày thực hiện) khi phụ huynh/học viên muốn chỉnh sửa/xóa dữ liệu. | Điều 9 & Điều 10 Luật 91/2025/QH15 | 🟡 **TRUNG BÌNH** (Thiếu cơ chế thực thi quyền chủ thể dữ liệu) |
| **GAP-05** | **Xử lý qua đám mây** | Chưa thông báo minh bạch việc lưu trữ dữ liệu tại máy chủ Supabase và cơ chế mã hóa dữ liệu. | Điều 25, 26 Luật 91/2025/QH15; Luật An ninh mạng 2018 | 🟢 **THẤP** (Cần minh bạch hóa kiến trúc bảo mật) |

---

## 4. CÁC BIỆN PHÁP ĐÃ THỰC THI ĐỂ KHẮC PHỤC TRIỆT ĐỂ

### 4.1. Xây dựng Chính Sách Bảo Vệ Dữ Liệu Cá Nhân Hoàn Chỉnh (`src/components/PrivacyPolicyModal.tsx`)
- Tạo Modal giao diện chuyên nghiệp, chuẩn mực pháp lý Việt Nam với đầy đủ 7 phần bắt buộc:
  1. **Đơn vị kiểm soát & xử lý dữ liệu:** Trung Tâm Anh Ngữ Phúc Phúc Thịnh (Tây Ninh), thông tin liên hệ và email DPO.
  2. **Danh mục dữ liệu thu thập:** Liệt kê minh bạch dữ liệu học viên (họ tên, ngày sinh, trường, khối, SĐT, điểm số), dữ liệu phụ huynh, dữ liệu nhân viên và dữ liệu tài chính học phí.
  3. **Mục đích xử lý dữ liệu:** Giới hạn nghiêm ngặt trong phạm vi công tác đào tạo, liên lạc với phụ huynh, thu học phí và kiểm soát an ninh hệ thống.
  4. **Quy định bảo vệ dữ liệu trẻ em (Điều 24 Luật 91/2025/QH15):** Cam kết tuyệt đối không bán/chuyển nhượng dữ liệu học viên cho bên thứ ba; bắt buộc có sự đồng ý của cha mẹ/người giám hộ.
  5. **Bảo mật & Bên thứ ba:** Minh bạch việc sử dụng Supabase (PostgreSQL mã hóa SSL/TLS, phân quyền RBAC) và Google OAuth 2.0.
  6. **Quyền của chủ thể dữ liệu & Thời hạn xử lý (Điều 10 Luật 91/2025/QH15):** Cam kết phản hồi xác nhận trong 02 ngày làm việc và hoàn tất xử lý yêu cầu chỉnh sửa/xóa dữ liệu trong 10 đến 20 ngày.
  7. **Tích hợp nút in ấn văn bản:** Hỗ trợ in ra giấy bản cam kết cho trung tâm khi phụ huynh hoặc cơ quan kiểm tra yêu cầu.

### 4.2. Cập nhật Màn hình Đăng nhập (`src/components/AuthScreen.tsx`)
- Bổ sung thông báo pháp lý bắt buộc: *"Bằng việc đăng nhập, bạn đồng ý tuân thủ quy chế vận hành và Chính sách bảo vệ dữ liệu cá nhân của Trung tâm (theo Luật 91/2025/QH15)"*.
- Cho phép người dùng bấm xem toàn bộ văn bản chính sách trước khi xác thực Google.

### 4.3. Bổ sung Cơ chế Kiểm soát Dữ liệu Trẻ em (`src/components/StudentManager.tsx` & `src/types.ts`)
- Mở rộng kiểu dữ liệu `Student` với thuộc tính `parentConsent?: boolean`.
- Trong modal tạo mới / chỉnh sửa học viên, tích hợp checkbox cam kết có giải thích rõ ràng:  
  *"Đã có sự đồng ý của cha mẹ / người giám hộ (Điều 24 Luật 91/2025/QH15): Xác nhận phụ huynh/người giám hộ đã chấp thuận cho trung tâm thu thập và xử lý dữ liệu học viên phục vụ đào tạo và liên lạc nội bộ."*
- Trong modal xem chi tiết học viên, hiển thị dòng trạng thái xác thực sự đồng ý của cha mẹ/người giám hộ.

### 4.4. Tích hợp Tra cứu Chính sách tại Thanh Điều Hướng (`src/components/Header.tsx` & `src/App.tsx`)
- Bổ sung nút bấm "Chính sách bảo mật" (biểu tượng khiên bảo vệ `ShieldCheck`) tại thanh Header trên cùng, cho phép ban quản trị và nhân viên xem lại chính sách bất kỳ lúc nào.

---

## 5. BẢNG ĐỐI SOÁT SAU KHẮC PHỤC (POST-REMEDIATION STATUS)

| Hạng mục rà soát | Tình trạng sau xử lý | Mức độ tuân thủ |
| :--- | :--- | :---: |
| 1. Công khai Chính sách bảo vệ DLCN | Đã tích hợp Modal tra cứu tại Header & Màn hình đăng nhập | ✅ **100% ĐẠT** |
| 2. Cơ chế chấp thuận cho dữ liệu trẻ em | Đã có checkbox và trường `parentConsent` trong form học viên | ✅ **100% ĐẠT** |
| 3. Điều khoản thỏa thuận khi đăng nhập | Đã bổ sung liên kết chính sách trên màn hình Google OAuth | ✅ **100% ĐẠT** |
| 4. Cơ chế thực hiện quyền chủ thể dữ liệu | Đã công bố quy trình & cam kết thời hạn 2-20 ngày tại Điều 6 của CSBM | ✅ **100% ĐẠT** |
| 5. Minh bạch bên lưu trữ đám mây | Đã nêu rõ hạ tầng Supabase & Google OAuth tại Điều 5 của CSBM | ✅ **100% ĐẠT** |
| 6. Kiểm tra hồi quy kỹ thuật (Tests & Build) | 100% các bài test và quy trình build Vite vượt qua thành công | ✅ **100% ĐẠT** |

---

## 6. KHUYẾN NGHỊ VẬN HÀNH CHO BAN GIÁM ĐỐC TRUNG TÂM

1. **Phiếu đăng ký học trực tiếp (Bản giấy):**  
   Tại quầy lễ tân khi tiếp nhận học viên mới, trong Phiếu đăng ký nhập học nên in sẵn 01 dòng: *"Tôi là cha/mẹ/người giám hộ của học viên, đồng ý cho Trung Tâm Anh Ngữ Phúc Phúc Thịnh lưu trữ thông tin học tập và liên lạc theo Quy chế của trung tâm"* kèm chữ ký của phụ huynh để lưu hồ sơ đối chứng.
2. **Quyền truy cập nội bộ (RBAC):**  
   Chỉ cấp quyền quản trị viên (`owner`) cho người có thẩm quyền. Giáo viên và nhân viên chỉ được phân quyền trong phạm vi công việc cần thiết (nguyên tắc đặc quyền tối thiểu).
3. **Sao lưu định kỳ:**  
   Sử dụng tính năng sao lưu (Backup) sẵn có trong hệ thống ít nhất 1 tuần/lần để phòng ngừa sự cố mất mát dữ liệu theo quy định của Luật An ninh mạng.
