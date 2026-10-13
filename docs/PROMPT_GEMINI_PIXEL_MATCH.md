# PROMPT CHÍNH — GEMINI PIXEL MATCH (BẢN CHỐT CUỐI)

Bạn là Senior Frontend Engineer + UI Engineer chuyên triển khai giao diện **pixel-perfect** bằng Next.js + TypeScript.

## Mục tiêu duy nhất
Dựng lại **trang đăng ký** sao cho **giống tối đa ảnh tham chiếu đã chốt** trong `reference/target-registration.png`.

- Không redesign.
- Không “cải tiến theo gu”.
- Không đổi bố cục.
- Không đổi text.
- Không tự thêm section.
- Không đổi màu theo cảm tính.
- Không thay hình nền bằng ảnh khác.

## Source of truth bắt buộc
Ảnh chuẩn cuối cùng là:
- `reference/target-registration.png`

Ảnh này có kích thước chính xác **1448 × 1086 px** và là source of truth cuối cùng về thị giác.
Nếu code/screenshot khác ảnh này, phải chỉnh tiếp đến khi gần như không phân biệt được bằng mắt ở viewport chuẩn.

## File bắt buộc phải đọc trước khi code
1. `reference/target-registration.png`
2. `reference/target-left-reference.png`
3. `reference/target-form-reference.png`
4. `reference/target-header-reference.png`
5. `content.json`
6. `design-tokens.css`
7. `layout-measurements.json`
8. `VISUAL_QA.md`
9. `effects-overlay.svg`
10. `assets/background-cinematic.webp` và `assets/campus-source.png` (dùng để reconstruct background nếu cần)

## Công nghệ
- Next.js App Router
- TypeScript strict
- Tailwind CSS hoặc CSS Modules
- ưu tiên CSS custom properties từ `design-tokens.css`
- `lucide-react` cho icon: BookOpen, GraduationCap, UserRound, UsersRound, Mail, IdCard, LockKeyhole, Eye, ArrowRight, Sparkles, Lightbulb, ChartNoAxesCombined.

## Luật bắt buộc
- Target desktop chính xác ở viewport **1448 × 1086**.
- Không có default body margin.
- Không có scrollbar dọc ở desktop chuẩn.
- Header phải trong suốt, nằm trực tiếp trên background.
- Form card phải là card trắng, mềm, bo tròn lớn, shadow dịu.
- Không đặt logo trong card.
- Không thêm nav item `Liên hệ`.
- Không thêm footer.
- Không dùng background generic hoặc stock khác.

## Cấu trúc thị giác cần match
### 1) Tổng thể layout
- 2 cột rõ ràng: hero bên trái và form bên phải.
- Background là khung cảnh cinematic của cổng HCMUTE vào buổi tối/xanh tím, có ánh sáng ấm ở cổng và một tia sáng chéo mềm từ giữa ảnh lên góc phải.
- Phần trái nền tối xanh đậm hơn để chữ trắng nổi rõ.
- Phần phải sáng hơn nhẹ để card nổi bật.

### 2) Header
- góc trái: icon line trắng + `HCMUTE` + divider dọc + `TLCN AI`
- giữa: `Giới thiệu`, `Tính năng`, `Hỗ trợ`
- góc phải: `Đã có tài khoản?` + nút outline `Đăng nhập` + mũi tên
- chữ trắng, sạch, không glow.

### 3) Hero bên trái
- badge capsule có icon sparkles nhỏ và text `Nền tảng hỗ trợ học tập thông minh`
- H1 2 dòng:
  - `Kết nối tri thức`
  - `cùng AI`
- từ `AI` là gradient xanh → tím.
- đoạn mô tả 3 dòng đúng wording trong `content.json`.
- 3 benefit item:
  1. Học tập thông minh hơn
  2. Kết nối giảng viên
  3. Phát triển toàn diện
- mỗi item có ô icon màu tối, icon line màu nổi, title trắng đậm, description xanh xám nhạt.

### 4) Background cụm cổng trường
Phải match cảm giác của ảnh đã chốt:
- cổng HCMUTE ở nửa dưới bên trái tới giữa ảnh
- bảng trắng sáng với dòng chữ:
  - `ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP. HỒ CHÍ MINH`
  - `HCMC UNIVERSITY OF TECHNOLOGY AND ENGINEERING`
- cờ đỏ và cờ màu ở hàng trên
- logo HCMUTE ở khối gạch phía dưới
- ánh sáng đèn ấm tại chân cổng và nền đường phản sáng nhẹ
- cây lớn đen silhouette ở mép trái
- bầu trời xanh tím cinematic

### 5) Form card
- card trắng ngà rất nhẹ
- bo tròn khoảng 20–22px
- rộng khoảng 572px
- đặt phía phải, top khoảng 74px
- title centered: `Tạo tài khoản`
- subtitle centered: `Bắt đầu hành trình học tập thông minh cùng HCMUTE TLCN AI`

#### Role selector
Label `Tôi là`
3 ô ngang:
- `Sinh viên` active
- `Giảng viên`
- `Quản trị viên`

Active state:
- border xanh tím
- text xanh tím
- icon xanh tím
- background xanh cực nhạt

#### Input fields theo đúng thứ tự
1. `Họ và tên` / `Nguyễn Văn A`
2. `Email` / `example@hcmute.edu.vn`
3. `Mã sinh viên (tùy chọn)` / `VD: 22123456`
4. `Mật khẩu` / `Tạo mật khẩu (ít nhất 8 ký tự)` + eye icon
5. `Xác nhận mật khẩu` / `Nhập lại mật khẩu` + eye icon

Mỗi input:
- border mảnh xanh xám nhạt
- chiều cao ~41px
- radius ~8px
- icon trái nhỏ, gọn
- placeholder nhạt
- spacing giữa label và input phải giống ảnh.

#### Consent row
- checkbox vuông nhỏ màu xanh
- text: `Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của HCMUTE TLCN AI`
- 2 phần link màu xanh.

#### Primary CTA
- full width
- text `Đăng ký tài khoản`
- arrow right ở cuối text
- gradient trái qua phải: xanh cyan → xanh dương → tím
- không glow mạnh

#### Social area
- separator text: `Hoặc đăng ký nhanh với`
- 2 button bằng nhau: Google và Microsoft
- nền trắng, border mảnh, radius trung bình.

## Responsive
- Ưu tiên desktop chuẩn 1448×1086 trước.
- Sau khi match desktop mới scale cho tablet/mobile.
- Mobile không được phá content hierarchy.

## Motion
- chỉ hover/focus rất nhẹ 120–180ms
- tuyệt đối không thêm animation bay, parallax, reveal phức tạp khi mục tiêu là screenshot match.

## Accessibility
- label + htmlFor đúng
- eye icon là button có aria-label
- checkbox có label click được
- focus visible nhưng không phá layout

## Quy trình bắt buộc sau khi code
1. Run app.
2. Mở đúng viewport 1448 × 1086.
3. Chụp screenshot route của trang đăng ký.
4. So cạnh `reference/target-registration.png`.
5. Chỉnh theo thứ tự:
   - geometry
   - spacing
   - typography
   - color
   - shadow
   - background crop / overlay
6. Lặp đến khi khác biệt rất nhỏ.

## Definition of done
CHƯA HOÀN THÀNH nếu còn bất kỳ lỗi nào sau:
- H1 sai line-break
- Form card lệch vị trí rõ rệt
- Header sai khoảng cách
- CTA gradient sai tone
- Background cổng trường sai crop hoặc sai mood
- Input quá cao/thấp
- Social button không đều
- Toàn trang nhìn sáng/tối khác reference.

## Output cuối cùng
- Liệt kê file đã tạo/sửa.
- Cho biết route trang.
- Không nói “redesign”. Hãy nói đây là implementation bám ảnh reference.
