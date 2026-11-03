# Hàn Ngữ Sơ Cấp — web học tiếng Hàn (Node.js + libSQL/Turso)

Phạm vi kiến thức bám theo lộ trình bộ *Tiếng Hàn tổng hợp dành cho người Việt Nam – Sơ cấp 1, 2*.
Toàn bộ câu ví dụ, giải thích, hội thoại, bài đọc và câu hỏi là nội dung biên soạn mới theo phạm vi từ vựng – ngữ pháp của giáo trình, không sao chép bài tập hay hình ảnh của sách.

## Học liệu Sơ cấp 1 (15 bài)

Mỗi bài (`server/seed/sc1/baiNN.js`) gồm các chủ đề: **Từ vựng** (chia nhóm như sách) · **Ngữ pháp** (mỗi điểm ngữ pháp một chủ đề, có lý thuyết, công thức, ví dụ, lỗi hay gặp) · **Phát âm** · **Nghe hiểu** (câu + hội thoại) · **Đọc hiểu & văn hoá** · **Viết**.

| Bài | Chủ đề | Ngữ pháp |
|---|---|---|
| 1 | 소개 · Giới thiệu | 입니다/입니까, 은/는 |
| 2 | 학교 · Trường học | 여기·거기·저기 / 이것·그것·저것, 이/가, 에 있습니다, 이/가 아닙니다 |
| 3 | 일상생활 · Sinh hoạt | -ㅂ/습니다, -ㅂ/습니까, 을/를, 에서 |
| 4 | 날짜와 요일 · Ngày và thứ | Số Hán Hàn, 와/과, 에 (thời gian) |
| 5 | 하루 일과 · Một ngày | Số thuần Hàn & giờ, -아/어요, 에 가다, 안 |
| 6 | 주말 · Cuối tuần | -았/었-, 하고, -(으)ㅂ시다 |
| 7 | 물건 사기 · Mua sắm | Đơn vị đếm & giá, giản lược ㅡ, 은/는 đối chiếu, -고 싶다 |
| 8 | 음식 · Ẩm thực | -겠-, -지 않다, -(으)세요 |
| 9 | 집 · Nhà cửa | Vị trí, (으)로, -(으)ㄹ래요, 도 |
| 10 | 가족 · Gia đình | Tuổi & đếm người, 께서, -(으)시-, giản lược ㄹ |
| 11 | 날씨 · Thời tiết | -고, 부터~까지, -(으)ㄹ 거예요, bất quy tắc ㅂ |
| 12 | 전화 · Điện thoại | 에게/한테/께, -지만, -(으)려고 하다 |
| 13 | 생일 · Sinh nhật | -아/어서, -(으)ㄹ까요?, 못 |
| 14 | 취미 · Sở thích | -(으)ㄹ 수 있다/없다, -기/-는 것, bất quy tắc ㄷ |
| 15 | 교통 · Giao thông | 에서~까지, (으)로 (phương tiện), -(으)러 가다 |

Câu hỏi chia động từ được sinh bằng bộ chia `server/seed/korean.js` (có kiểm thử `tests/korean.test.js`); phương án sai là các lỗi người học hay mắc.

**Cập nhật học liệu lên bản đang chạy:** mỗi lần khởi động, hệ thống so “phiên bản học liệu” (hash nội dung). Nếu khác, nó tự đồng bộ: thêm mục mới, cập nhật mục hệ thống tạo, **lưu trữ** (không xoá) mục cũ không còn dùng. Mục admin đã sửa tay và câu hỏi admin tự tạo được giữ nguyên; tài khoản, tiến độ, lịch sử làm bài không bị động tới.

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
  seed/content.js  Học liệu Nhập môn (Hangeul), Sơ cấp 2 (mẫu), bảng chia động từ đối chiếu
  seed/sc1/        15 bài Sơ cấp 1 (từ vựng, ngữ pháp, phát âm, nghe, đọc, văn hoá, viết)
  seed/korean.js   Bộ chia động từ/tính từ (bất quy tắc ㅂ ㄷ 르 ㅅ ㄹ ㅡ)
  seed/dsl.js      Ký hiệu gọn để soạn câu hỏi
  seed/build.js    Dựng toàn bộ học liệu + sinh câu hỏi tự động + đề thi
  seed/sync.js     Đồng bộ học liệu lên DB theo phiên bản (thêm / cập nhật / lưu trữ)
  seed/seed.js     Khởi tạo DB, tài khoản admin, chạy đồng bộ
public/
  index.html, css/app.css
  js/app.js        Khung SPA, điều hướng không tải lại trang, ghi nhận thời gian học
  js/core.js       Gọi API, tiện ích giao diện, phát âm (Web Speech API, giọng ko-KR)
  js/ime.js        Bàn phím tiếng Hàn trên màn hình + bộ ghép âm tiết
  js/question.js   Hiển thị 8 dạng câu hỏi và phản hồi
  js/views/        learn (lộ trình, trung tâm luyện tập, chủ đề) · session (luyện tập, thẻ ghi nhớ) · review · exams · progress
server/admin-ui/   Trang quản trị (chỉ trả về cho tài khoản admin)
tests/  api.test.js · korean.test.js · ui.smoke.js
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
- Nhập môn và đủ 15 bài Sơ cấp 1 đã có nội dung; Sơ cấp 2 mới có 3 chủ đề mẫu. Thêm chủ đề, câu hỏi và đề thi trong trang quản trị.
- Hình minh hoạ của sách không được đưa vào (bản quyền); từ vựng hiển thị dạng chữ + phát âm.
- Chưa có đề mô phỏng TOPIK; đề hiện tại là đề nội bộ theo ma trận chủ đề.
- Chưa có quên mật khẩu qua email, đăng nhập Google, hay ứng dụng di động gốc.
- Mỗi thao tác trên Vercel phải gọi sang Turso qua mạng, nên chậm hơn chạy cục bộ một chút. Nên chọn vùng (region) của Vercel gần vùng database Turso (database hiện ở Tokyo `aws-ap-northeast-1` → chọn vùng Vercel `hnd1`).
