// Khởi động server: npm start  →  http://localhost:3000
const path = require('path');
const express = require('express');
const { loadUser, csrfGuard } = require('./auth');
const seed = require('./seed/seed');

seed.run();
const EX = require('./exams');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
  next();
});
app.use(express.json({ limit: '200kb' }));
app.use(loadUser);
app.use('/api', csrfGuard);
app.use('/api/admin', require('./admin'));
app.use('/api', require('./learner'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy API.' }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.type === 'entity.parse.failed' ? 'Dữ liệu gửi lên không hợp lệ.' : 'Lỗi máy chủ. Vui lòng thử lại.' });
});

const pub = path.join(__dirname, '..', 'public');
// Trang quản trị chỉ trả về cho tài khoản admin (dữ liệu vẫn được bảo vệ riêng ở /api/admin)
app.get(['/admin', '/admin/'], (req, res) => {
  if (!req.user) return res.redirect('/#login?next=admin');
  if (req.user.role !== 'admin') return res.status(403).sendFile(path.join(pub, 'forbidden.html'));
  res.sendFile(path.join(pub, 'admin', 'index.html'));
});
app.use('/admin', (req, res, next) => (req.user && req.user.role === 'admin' ? next() : res.status(403).end()), express.static(path.join(pub, 'admin')));
app.use(express.static(pub, { index: 'index.html' }));

// Tự nộp các lượt thi đã hết giờ
setInterval(() => { try { EX.sweepExpired(); } catch (e) { console.error(e); } }, 30000).unref();

const PORT = Number(process.env.PORT) || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Hàn Ngữ Sơ Cấp đang chạy tại http://localhost:${PORT}`));
module.exports = app;
