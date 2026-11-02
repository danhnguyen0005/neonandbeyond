# Hàn Ngữ Sơ Cấp — web học tiếng Hàn (Node.js + SQLite)

Phạm vi kiến thức bám theo lộ trình bộ *Tiếng Hàn tổng hợp dành cho người Việt Nam – Sơ cấp 1, 2*.
Toàn bộ câu ví dụ, giải thích và câu hỏi trong `server/seed/content.js` là nội dung biên soạn mới, không sao chép từ sách.

## Chạy thử

Yêu cầu: Node.js 18 trở lên.

```bash
npm install
ADMIN_PASSWORD='MatKhauManh@2026' npm start      # Windows PowerShell: $env:ADMIN_PASSWORD='...'; npm start
```

Mở http://localhost:3000, đăng ký tài khoản học viên.
Trang quản trị: http://localhost:3000/admin (tài khoản `admin`, mật khẩu là giá trị `ADMIN_PASSWORD` đã đặt ở lần chạy đầu tiên).
Nếu không đặt `ADMIN_PASSWORD`, mật khẩu ngẫu nhiên sẽ được in ra cửa sổ dòng lệnh ở lần chạy đầu tiên.

| Lệnh | Tác dụng |
|---|---|
| `npm start` | Chạy server (lần đầu tự tạo DB `data/hanngu.db` và nạp học liệu) |
| `npm test` | Chạy 124 kiểm thử API trên một DB tạm |
| `npm run reset` | Xoá DB và nạp lại học liệu từ đầu |
| `node tests/ui.smoke.js` | Kiểm thử giao diện bằng Chromium (cần `npm i -D playwright` và server đang chạy) |

Biến môi trường: `PORT` (mặc định 3000), `DB_FILE`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NODE_ENV=production` (bật cookie Secure khi chạy sau HTTPS), `TRUST_PROXY=1` (khi đặt sau Nginx/Cloudflare).

## Cấu trúc

```
server/
  index.js      Khởi động Express, header bảo mật, định tuyến, tự nộp bài thi hết giờ
  db.js         Lược đồ SQLite (22 bảng)
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
  admin/           Trang quản trị
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

1. Máy chủ Linux có Node 18+ → `npm ci --omit=dev` → chạy bằng pm2/systemd với `NODE_ENV=production`.
2. Đặt Nginx (hoặc Caddy) phía trước với HTTPS và `TRUST_PROXY=1`.
3. Sao lưu định kỳ file `data/hanngu.db` (SQLite ở chế độ WAL).
4. Khi số người dùng lớn hoặc cần chạy nhiều máy chủ: chuyển sang PostgreSQL (các truy vấn là SQL chuẩn; cần thay `better-sqlite3` và một số hàm `json_*`, `datetime`), và chuyển bộ đếm đăng nhập sai sang Redis.

## Giới hạn hiện tại

- Phát âm dùng giọng đọc tiếng Hàn có sẵn trên thiết bị (Web Speech API), chưa có file ghi âm. Máy không có giọng ko-KR sẽ không nghe được.
- Bài viết được chấm theo tiêu chí (từ khoá / mẫu cấu trúc), không phải AI chấm tự do. Giáo viên nhận xét bổ sung trong Admin › Bài viết.
- Câu dịch / tự gõ được chấm theo danh sách đáp án chấp nhận (bỏ qua khoảng trắng và dấu câu cuối). Cách diễn đạt đúng nhưng chưa có trong danh sách sẽ bị chấm sai.
- Nội dung chi tiết hiện có cho Nhập môn và phần lớn Sơ cấp 1; Sơ cấp 2 mới có 3 chủ đề mẫu. Thêm chủ đề, câu hỏi và đề thi trong trang quản trị.
- Chưa có đề mô phỏng TOPIK; đề hiện tại là đề nội bộ theo ma trận chủ đề.
- Chưa có quên mật khẩu qua email, đăng nhập Google, hay ứng dụng di động gốc.
