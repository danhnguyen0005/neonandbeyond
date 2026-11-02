# Hàn Ngữ Sơ Cấp — web học tiếng Hàn (Node.js + libSQL/Turso)

Phạm vi kiến thức bám theo lộ trình bộ *Tiếng Hàn tổng hợp dành cho người Việt Nam – Sơ cấp 1, 2*.
Toàn bộ câu ví dụ, giải thích và câu hỏi trong `server/seed/content.js` là nội dung biên soạn mới, không sao chép từ sách.

## Triển khai lên Vercel (GitHub → Vercel)

Vercel không lưu được file trên máy chủ, nên dữ liệu được đặt ở **Turso** (cơ sở dữ liệu tương thích SQLite, có gói miễn phí).

1. Tạo database trên https://turso.tech, lấy **Database URL** (`libsql://…`) và **Auth Token**.
2. Trên Vercel: **Add New → Project → Import** repo GitHub này. Framework Preset để **Other**, không cần đổi Build/Output (đã cấu hình trong `vercel.json`).
3. Ở **Environment Variables**, thêm:

   | Key | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | URL dạng `libsql://…turso.io` |
   | `TURSO_AUTH_TOKEN` | token của Turso |
   | `ADMIN_PASSWORD` | mật khẩu cho tài khoản quản trị `admin` |

4. Bấm **Deploy**. Lần truy cập đầu tiên, hệ thống tự tạo bảng và nạp học liệu (khoảng 10–30 giây), sau đó trang chạy bình thường.
5. Đăng nhập trang quản trị tại `https://<tên-miền>/admin` bằng `admin` / mật khẩu đã đặt.

Lưu ý:
- `ADMIN_PASSWORD` chỉ được dùng ở lần khởi tạo dữ liệu đầu tiên. Đổi biến này sau đó không đổi mật khẩu.
- Không đưa token vào code hay commit. Nếu token từng bị lộ, tạo token mới trên Turso rồi cập nhật lại biến môi trường trên Vercel.
- Mỗi lần đẩy code mới lên nhánh `main`, Vercel tự deploy lại. Dữ liệu trên Turso được giữ nguyên.

## Chạy thử trên máy

Yêu cầu: Node.js 20 trở lên. Khi không có `TURSO_DATABASE_URL`, dữ liệu được lưu ở file `data/hanngu.db`.

```bash
npm install
ADMIN_PASSWORD='MatKhauManh@2026' npm start      # Windows PowerShell: $env:ADMIN_PASSWORD='...'; npm start
```

Mở http://localhost:3000, đăng ký tài khoản học viên. Trang quản trị: http://localhost:3000/admin.
Nếu không đặt `ADMIN_PASSWORD`, mật khẩu ngẫu nhiên sẽ được in ra cửa sổ dòng lệnh ở lần chạy đầu tiên.

| Lệnh | Tác dụng |
|---|---|
| `npm start` | Chạy server (lần đầu tự tạo bảng và nạp học liệu) |
| `npm test` | Chạy 125 kiểm thử API trên một DB tạm |
| `npm run reset` | Xoá DB cục bộ và nạp lại học liệu từ đầu |
| `node tests/ui.smoke.js` | Kiểm thử giao diện bằng Chromium (cần `npm i -D playwright` và server đang chạy) |

Biến môi trường khác: `PORT` (mặc định 3000), `DB_FILE`, `ADMIN_USERNAME`, `TRUST_PROXY=1` (khi đặt sau Nginx).

## Cấu trúc

```
api/index.js    Điểm vào cho Vercel (serverless function)
vercel.json     Cấu hình Vercel: định tuyến /api, /admin; header bảo mật
server/
  app.js        Ứng dụng Express dùng chung: header bảo mật, định tuyến, tự khởi tạo dữ liệu, trang quản trị có kiểm tra quyền
  index.js      Chạy cục bộ + tự nộp bài thi hết giờ
  db.js         Kết nối libSQL (file cục bộ hoặc Turso) + lược đồ (23 bảng)
  auth.js       Băm mật khẩu scrypt, phiên cookie httpOnly, phân quyền, chống CSRF, giới hạn đăng nhập sai, nhật ký quản trị
  engine.js     Chấm điểm, mức thành thạo, SRS từ vựng, theo dõi câu sai, chọn & xáo trộn câu hỏi, sinh đề
  learner.js    API học viên (lộ trình, chủ đề, phiên luyện tập, ôn tập, thi thử, tiến độ)
  exams.js      Lượt thi: bắt đầu/khôi phục, lưu đáp án, đánh dấu, nộp, tự nộp khi hết giờ, huỷ
  stats.js      Tổng quan, Review Center, dashboard học viên, báo cáo quản trị
  admin.js      API quản trị (mọi route kiểm tra quyền admin ở server)
  seed/content.js  Học liệu: 3 cấp độ, 24 chủ đề, bài học, từ vựng, bảng chia động từ, câu hỏi, bài đọc/nghe, bài viết, đề thi
  seed/seed.js     Nạp học liệu + sinh câu hỏi tự động (đáp án tiểu từ tính theo patchim)
public/
  index.html, css/app.css
  js/app.js        Khung SPA, điều hướng không tải lại trang, ghi nhận thời gian học
  js/core.js       Gọi API, tiện ích giao diện, phát âm (Web Speech API, giọng ko-KR)
  js/ime.js        Bàn phím tiếng Hàn trên màn hình + bộ ghép âm tiết
  js/question.js   Hiển thị 8 dạng câu hỏi và phản hồi
  js/views/        learn (lộ trình, trung tâm luyện tập, chủ đề) · session (luyện tập, thẻ ghi nhớ) · review · exams · progress
server/admin-ui/   Trang quản trị (chỉ trả về cho tài khoản admin)
tests/  api.test.js · ui.smoke.js
```

## Quy tắc chính (chỉnh trong Admin › Cài đặt)

- **Tiến độ** (hoàn thành) và **thành thạo** là hai chỉ số độc lập. Một chủ đề được tính là “hoàn thành” khi người học làm hết một phiên luyện tập của chủ đề đó.
- **Thành thạo**: ≥ 15 câu, tỷ lệ đúng ≥ 85% trong 40 câu gần nhất, qua ≥ 2 phiên khác nhau (mỗi phiên ≥ 5 câu) đạt ngưỡng. Mỗi chủ đề có thể ghi đè ngưỡng riêng; hai chủ đề Hangeul đang dùng ngưỡng 90%.
- **Câu sai**: trả lời đúng một lần chưa xoá câu khỏi danh sách. Câu chuyển sang “đang sửa” và hẹn kiểm tra lại sau 1 ngày, rồi 3 ngày. Đúng ở lần kiểm tra lại mới thành “đã khắc phục”; lịch sử vẫn được giữ.
- **Từ vựng (SRS)**: hệ Leitner gồm 7 hộp, khoảng cách ôn 0/1/2/4/7/15/30 ngày. Từ ở hộp 4 trở lên được tính là “ghi nhớ tốt”.
- **Thi thử**: đồng hồ do server kiểm soát. Rời trang khi còn giờ thì quay lại làm tiếp; hết giờ thì tự nộp với các câu đã lưu. Lượt bị huỷ không tính điểm.
- **Đề thi** chỉ lấy câu đã xác minh đáp án, không lặp câu, chia đều giữa các chủ đề, và không lấy hai câu của cùng một từ vựng.

## Triển khai thật

- **Vercel + Turso:** xem mục đầu. Sao lưu: Turso có tính năng khôi phục theo thời điểm (point-in-time) tuỳ gói.
- **Máy chủ riêng (VPS):** Node 20+ → `npm ci --omit=dev` → chạy bằng pm2/systemd với `NODE_ENV=production`, đặt Nginx/Caddy có HTTPS phía trước và `TRUST_PROXY=1`. Có thể dùng file cục bộ hoặc Turso.
- Trên Vercel, lượt thi hết giờ được tự nộp khi người học quay lại hoặc khi mở danh sách đề (không có tác vụ chạy nền).

## Giới hạn hiện tại

- Phát âm dùng giọng đọc tiếng Hàn có sẵn trên thiết bị (Web Speech API), chưa có file ghi âm. Máy không có giọng ko-KR sẽ không nghe được.
- Bài viết được chấm theo tiêu chí (từ khoá / mẫu cấu trúc), không phải AI chấm tự do. Giáo viên nhận xét bổ sung trong Admin › Bài viết.
- Câu dịch / tự gõ được chấm theo danh sách đáp án chấp nhận (bỏ qua khoảng trắng và dấu câu cuối). Cách diễn đạt đúng nhưng chưa có trong danh sách sẽ bị chấm sai.
- Nội dung chi tiết hiện có cho Nhập môn và phần lớn Sơ cấp 1; Sơ cấp 2 mới có 3 chủ đề mẫu. Thêm chủ đề, câu hỏi và đề thi trong trang quản trị.
- Chưa có đề mô phỏng TOPIK; đề hiện tại là đề nội bộ theo ma trận chủ đề.
- Chưa có quên mật khẩu qua email, đăng nhập Google, hay ứng dụng di động gốc.
- Mỗi thao tác trên Vercel phải gọi sang Turso qua mạng, nên chậm hơn chạy cục bộ một chút. Nên chọn vùng (region) của Vercel gần vùng database Turso (database hiện ở Tokyo `aws-ap-northeast-1` → chọn vùng Vercel `hnd1`).
