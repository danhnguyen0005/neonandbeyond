// Xác thực & phân quyền. Mật khẩu băm scrypt; phiên lưu dạng hash token trong DB, cookie httpOnly.
const crypto = require('crypto');
const { db, addDays } = require('./db');

const COOKIE = 'hn_sid';
const SESSION_DAYS = 14;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${key}`;
}
function verifyPassword(pw, stored) {
  const [alg, salt, key] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !key) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const ref = Buffer.from(key, 'hex');
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').run(sha(token), userId, addDays(SESSION_DAYS));
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 86400000, path: '/',
  });
}
function destroySession(req, res) {
  const t = readCookie(req);
  if (t) db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(sha(t));
  res.clearCookie(COOKIE, { path: '/' });
}
function readCookie(req) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

// Gắn req.user nếu phiên hợp lệ
function loadUser(req, _res, next) {
  const t = readCookie(req);
  if (t) {
    const row = db.prepare(`SELECT u.id,u.username,u.display_name,u.role,u.status,u.daily_goal
      FROM auth_sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.expires_at > datetime('now')`).get(sha(t));
    if (row && row.status === 'active') req.user = row;
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
  next();
}
// Kiểm tra quyền ở backend — mọi route /api/admin/* đi qua đây
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Bạn không có quyền truy cập khu vực quản trị.' });
  next();
}
// Chống CSRF đơn giản: mọi request thay đổi dữ liệu phải có header tuỳ biến (form từ site khác không gửi được)
function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'hanngu') return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
  next();
}
// Giới hạn đăng nhập sai: 10 lần / 15 phút cho mỗi IP+tên đăng nhập
const attempts = new Map();
function loginLimited(key) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < 15 * 60000);
  attempts.set(key, list);
  return list.length >= 10;
}
function loginFailed(key) { const l = attempts.get(key) || []; l.push(Date.now()); attempts.set(key, l); }

function logAdmin(adminId, action, targetType, targetId, detail) {
  db.prepare('INSERT INTO admin_logs(admin_id,action,target_type,target_id,detail) VALUES (?,?,?,?,?)')
    .run(adminId, action, targetType || null, targetId || null, detail ? JSON.stringify(detail).slice(0, 2000) : null);
}

module.exports = {
  hashPassword, verifyPassword, createSession, destroySession, loadUser, requireAuth, requireAdmin,
  csrfGuard, loginLimited, loginFailed, logAdmin,
};
