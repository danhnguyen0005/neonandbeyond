// Xác thực & phân quyền. Mật khẩu băm scrypt; phiên lưu dạng hash token trong DB, cookie httpOnly.
const crypto = require('crypto');
const { db, addDays } = require('./db');

const COOKIE = 'hn_sid';
const SESSION_DAYS = 14;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [alg, salt, key] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !key) return false;
  const test = crypto.scryptSync(pw, salt, 64), ref = Buffer.from(key, 'hex');
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.run('INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)', sha(token), userId, addDays(SESSION_DAYS));
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: SESSION_DAYS * 86400000, path: '/' });
}
async function destroySession(req, res) {
  const t = readCookie(req);
  if (t) await db.run('DELETE FROM auth_sessions WHERE token_hash=?', sha(t));
  res.clearCookie(COOKIE, { path: '/' });
}
function readCookie(req) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function loadUser(req, _res, next) {
  try {
    const t = readCookie(req);
    if (t) {
      const row = await db.get(`SELECT u.id,u.username,u.display_name,u.role,u.status,u.daily_goal FROM auth_sessions s JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=? AND s.expires_at > datetime('now')`, sha(t));
      if (row && row.status === 'active') req.user = row;
    }
    next();
  } catch (e) { next(e); }
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
// Chống CSRF: request thay đổi dữ liệu phải có header tuỳ biến (form từ site khác không gửi được)
function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'hanngu') return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
  next();
}
// Giới hạn đăng nhập sai: 10 lần / 15 phút cho mỗi IP + tên đăng nhập (lưu trong DB để dùng được trên serverless)
async function loginLimited(key) {
  const r = await db.get("SELECT COUNT(*) n FROM login_failures WHERE key=? AND at > datetime('now','-15 minutes')", key);
  return r.n >= 10;
}
async function loginFailed(key) {
  await db.batch([["INSERT INTO login_failures(key) VALUES (?)", [key]], ["DELETE FROM login_failures WHERE at < datetime('now','-1 day')"]]);
}
async function logAdmin(adminId, action, targetType, targetId, detail) {
  await db.run('INSERT INTO admin_logs(admin_id,action,target_type,target_id,detail) VALUES (?,?,?,?,?)',
    adminId, action, targetType || null, targetId || null, detail ? JSON.stringify(detail).slice(0, 2000) : null);
}

module.exports = { hashPassword, verifyPassword, createSession, destroySession, loadUser, requireAuth, requireAdmin, csrfGuard, loginLimited, loginFailed, logAdmin };
