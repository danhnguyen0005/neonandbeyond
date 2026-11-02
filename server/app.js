// Ứng dụng Express dùng chung cho chạy cục bộ (server/index.js) và Vercel (api/index.js).
const path = require('path');
const fs = require('fs');
const express = require('express');
const { loadUser, csrfGuard } = require('./auth');
const seed = require('./seed/seed');

// Lần đầu nhận request (hoặc khi khởi động): tạo bảng và nạp học liệu nếu DB còn trống
let readyPromise = null;
const ready = () => (readyPromise ||= seed.run().catch((e) => { readyPromise = null; throw e; }));

const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'";
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.VERCEL || process.env.TRUST_PROXY === '1' ? true : false);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', CSP);
  next();
});
app.use(async (req, res, next) => { try { await ready(); next(); } catch (e) { next(e); } });
app.use(express.json({ limit: '200kb' }));
app.use(loadUser);
app.use('/api', csrfGuard);
app.use('/api/admin', require('./admin'));
app.use('/api', require('./learner'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy API.' }));

const pub = path.join(__dirname, '..', 'public');
const FORBIDDEN = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Không có quyền truy cập</title>
<link rel="stylesheet" href="/css/app.css"></head><body><main class="main"><div class="page"><div class="card empty"><span class="glyph">403</span><h1>Không có quyền truy cập</h1>
<p>Khu vực quản trị chỉ dành cho tài khoản quản trị viên.</p><a class="btn primary" href="/">Về trang học</a></div></div></main></body></html>`;
const adminUi = path.join(__dirname, 'admin-ui');
// Trang quản trị chỉ trả về cho tài khoản admin (dữ liệu vẫn được bảo vệ riêng ở /api/admin)
const adminGate = (req, res, next) => {
  if (!req.user) return req.path.endsWith('.js') ? res.status(401).end() : res.redirect('/#login?next=admin');
  if (req.user.role !== 'admin') return res.status(403).type('html').send(FORBIDDEN);
  next();
};
app.get(['/admin', '/admin/'], adminGate, (req, res) => res.type('html').send(fs.readFileSync(path.join(adminUi, 'index.html'), 'utf8')));
app.get('/admin/admin.js', adminGate, (req, res) => res.type('application/javascript').send(fs.readFileSync(path.join(adminUi, 'admin.js'), 'utf8')));
// Trên Vercel, thư mục public được phục vụ trực tiếp qua CDN; khi chạy cục bộ thì Express phục vụ
app.use(express.static(pub, { index: 'index.html' }));

app.use((err, req, res, _next) => {
  console.error(err);
  const msg = err.type === 'entity.parse.failed' ? 'Dữ liệu gửi lên không hợp lệ.' : /TURSO|Turso/.test(err.message || '') ? err.message : 'Lỗi máy chủ. Vui lòng thử lại.';
  res.status(err.status || 500).json({ error: msg });
});

module.exports = { app, ready };
