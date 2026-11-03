// Khởi tạo / cập nhật học liệu.
//  - DB trống: tạo bảng, nạp toàn bộ học liệu, tạo tài khoản quản trị và đề thi hệ thống.
//  - DB đã có (kể cả bản triển khai cũ): chỉ đồng bộ phần học liệu thay đổi (xem sync.js),
//    không đụng tới tài khoản, tiến độ học, câu hỏi do admin tự tạo.
// Phiên bản học liệu = hash nội dung; chỉ đồng bộ khi nội dung đổi, nên các lần khởi động sau rất nhanh.
const crypto = require('crypto');
const { db, SCHEMA, migrate } = require('../db');
const { hashPassword } = require('../auth');
const { generateExamQuestions } = require('../engine');
const { build } = require('./build');
const { syncContent, syncExams, LEGACY } = require('./sync');

const LOCK_STALE_MIN = 3;
const setting = async (k) => (await db.get('SELECT value FROM settings WHERE key=?', k))?.value;
const setSetting = (k, v) => db.run('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, v);

async function run({ log = console.log } = {}) {
  await db.exec(SCHEMA);
  await migrate();
  const D = build();
  const version = crypto.createHash('sha1').update(JSON.stringify(D)).digest('hex').slice(0, 16);
  if ((await setting('content_version')) === version) return false;

  // Khoá: chỉ một tiến trình đồng bộ tại một thời điểm. Khoá quá hạn (tiến trình trước bị ngắt) thì tiếp quản —
  // đồng bộ là thao tác lặp lại được nên chạy lại an toàn.
  const lock = await setting('sync_lock');
  if (lock && !(await db.get("SELECT ? < datetime('now', ?) old", lock, `-${LOCK_STALE_MIN} minutes`)).old) {
    for (let i = 0; i < 55; i++) { await new Promise((r) => setTimeout(r, 1000)); if ((await setting('content_version')) === version) return false; }
    throw new Error('Học liệu đang được cập nhật, hãy tải lại trang sau ít phút.');
  }
  await setSetting('sync_lock', new Date().toISOString().replace('T', ' ').slice(0, 19));
  try {
    // Nâng cấp từ phiên bản cũ (chưa có content_version): bản ghi cũ do hệ thống tạo → đánh dấu 'legacy'
    // để có thể cập nhật/lưu trữ. Câu hỏi admin tự tạo (mã chứa -AD-) giữ nguyên quyền sở hữu của admin.
    if (!(await setting('content_version')) && (await db.get('SELECT COUNT(*) n FROM levels')).n > 0) {
      log('Nâng cấp học liệu từ phiên bản cũ…');
      await db.batch([
        ...['topics', 'lessons', 'grammar_points', 'vocabulary', 'passages'].map((t) => [`UPDATE ${t} SET seed_hash=? WHERE seed_hash IS NULL`, [LEGACY]]),
        ["UPDATE questions SET seed_hash=? WHERE seed_hash IS NULL AND code NOT LIKE '%-AD-%'", [LEGACY]],
      ]);
    }
    const { topicId } = await syncContent(D, { log });

    let admin = await db.get("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
    if (!admin) {
      const user = process.env.ADMIN_USERNAME || 'admin';
      const pass = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
      await db.run("INSERT INTO users(username,display_name,password_hash,role) VALUES (?,?,?,'admin')", user, 'Quản trị viên', hashPassword(pass));
      admin = await db.get("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
      if (!process.env.ADMIN_PASSWORD) log(`\n  Tài khoản quản trị đã được tạo:\n    Tên đăng nhập: ${user}\n    Mật khẩu:      ${pass}\n  (Đặt biến môi trường ADMIN_PASSWORD trước lần chạy đầu để tự chọn mật khẩu.)\n`);
    }
    await syncExams(D, topicId, admin.id, generateExamQuestions, { log });
    await setSetting('content_version', version);
    await setSetting('seed_done', new Date().toISOString());
    await db.run("DELETE FROM settings WHERE key='seed_lock'"); // khoá của phiên bản cũ
  } finally {
    await db.run("DELETE FROM settings WHERE key='sync_lock'");
  }
  return true;
}

module.exports = { run };
if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
