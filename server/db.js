// Kết nối cơ sở dữ liệu qua libSQL:
//  - Chạy trên máy: file SQLite cục bộ (mặc định data/hanngu.db)
//  - Chạy trên Vercel: Turso (đặt TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
// Học liệu dùng chung (levels → questions) tách biệt với dữ liệu riêng của từng người học.
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

function makeClient() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  if (process.env.VERCEL) throw new Error('Chưa cấu hình TURSO_DATABASE_URL. Vercel không lưu được file SQLite, hãy tạo cơ sở dữ liệu Turso (xem README).');
  const file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'hanngu.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return createClient({ url: 'file:' + file });
}
const client = makeClient();

const clean = (args) => args.map((a) => (a === undefined ? null : typeof a === 'boolean' ? (a ? 1 : 0) : a));
const toObj = (rs) => rs.rows.map((r) => { const o = {}; rs.columns.forEach((c, i) => { o[c] = typeof r[i] === 'bigint' ? Number(r[i]) : r[i]; }); return o; });

const db = {
  async all(sql, ...args) { return toObj(await client.execute({ sql, args: clean(args) })); },
  async get(sql, ...args) { return (await db.all(sql, ...args))[0]; },
  async run(sql, ...args) { const r = await client.execute({ sql, args: clean(args) }); return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null }; },
  async raw(sql, ...args) { return (await client.execute({ sql, args: clean(args) })).rows.map((r) => [...r]); },
  // Ghi nhiều câu lệnh trong một giao dịch (một lượt gửi tới máy chủ)
  async batch(stmts) { if (!stmts.length) return []; return client.batch(stmts.map(([sql, args = []]) => ({ sql, args: clean(args) })), 'write'); },
  async exec(sql) { return client.executeMultiple(sql); },
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','admin')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked')),
  daily_goal INTEGER NOT NULL DEFAULT 20, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_login_at TEXT);
CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_events (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS login_failures (key TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS ix_lf ON login_failures(key, at);
CREATE TABLE IF NOT EXISTS activity_days (user_id INTEGER NOT NULL REFERENCES users(id), day TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, answers INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day));
CREATE TABLE IF NOT EXISTS levels (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT, goal TEXT, sort INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS topics (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, level_id INTEGER NOT NULL REFERENCES levels(id),
  grp TEXT NOT NULL CHECK (grp IN ('hangul','vocab','grammar','listening','reading','writing')), name TEXT NOT NULL, description TEXT, source TEXT,
  sort INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, mastery_rules TEXT);
CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id), title TEXT NOT NULL, goal TEXT, body TEXT NOT NULL DEFAULT '{}', sort INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS vocabulary (id INTEGER PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id), ko TEXT NOT NULL, vi TEXT NOT NULL, note TEXT, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS grammar_points (id INTEGER PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id), pattern TEXT NOT NULL, meaning TEXT, formula TEXT, explanation TEXT,
  examples TEXT NOT NULL DEFAULT '[]', mistakes TEXT NOT NULL DEFAULT '[]', compare TEXT, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS passages (id INTEGER PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id), kind TEXT NOT NULL CHECK (kind IN ('reading','listening')), title TEXT NOT NULL, ko_text TEXT NOT NULL, vi_text TEXT, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, topic_id INTEGER NOT NULL REFERENCES topics(id),
  type TEXT NOT NULL CHECK (type IN ('mcq','listen','fill','conjugate','order','translate','error','write')), prompt TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}', answer TEXT NOT NULL DEFAULT '{}', explanation TEXT NOT NULL DEFAULT '',
  skill TEXT NOT NULL CHECK (skill IN ('hangul','vocab','grammar','listening','reading','writing')), error_tag TEXT NOT NULL DEFAULT 'grammar',
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3), status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','hidden')),
  verified INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS question_options (id INTEGER PRIMARY KEY, question_id INTEGER NOT NULL REFERENCES questions(id), text TEXT NOT NULL, is_correct INTEGER NOT NULL DEFAULT 0, feedback TEXT, sort INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS ix_q_topic ON questions(topic_id, status);
CREATE INDEX IF NOT EXISTS ix_opt_q ON question_options(question_id);
CREATE TABLE IF NOT EXISTS practice_sessions (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), topic_id INTEGER REFERENCES topics(id), kind TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}', items TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0, answered INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')), started_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), ended_at TEXT);
CREATE INDEX IF NOT EXISTS ix_ps_user ON practice_sessions(user_id, status);
CREATE TABLE IF NOT EXISTS user_answers (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), question_id INTEGER NOT NULL REFERENCES questions(id),
  session_id INTEGER, attempt_id INTEGER, mode TEXT NOT NULL CHECK (mode IN ('practice','exam')), response TEXT, is_correct INTEGER NOT NULL, score REAL NOT NULL,
  error_tag TEXT, topic_id INTEGER, answered_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS ix_ans_user ON user_answers(user_id, topic_id, answered_at);
CREATE INDEX IF NOT EXISTS ix_ans_q ON user_answers(question_id);
CREATE TABLE IF NOT EXISTS topic_progress (user_id INTEGER NOT NULL REFERENCES users(id), topic_id INTEGER NOT NULL REFERENCES topics(id), theory_viewed_at TEXT, completed_at TEXT,
  sessions_count INTEGER NOT NULL DEFAULT 0, last_practiced_at TEXT, mastery TEXT NOT NULL DEFAULT 'unassessed', PRIMARY KEY (user_id, topic_id));
CREATE TABLE IF NOT EXISTS srs_records (user_id INTEGER NOT NULL REFERENCES users(id), vocab_id INTEGER NOT NULL REFERENCES vocabulary(id), box INTEGER NOT NULL DEFAULT 0, due_at TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0, lapses INTEGER NOT NULL DEFAULT 0, last_result INTEGER, updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, vocab_id));
CREATE TABLE IF NOT EXISTS mistakes (user_id INTEGER NOT NULL REFERENCES users(id), question_id INTEGER NOT NULL REFERENCES questions(id), wrong_count INTEGER NOT NULL DEFAULT 0,
  right_after INTEGER NOT NULL DEFAULT 0, first_wrong_at TEXT NOT NULL, last_wrong_at TEXT NOT NULL, last_response TEXT,
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open','understood','fixing','resolved')), next_check_at TEXT NOT NULL, PRIMARY KEY (user_id, question_id));
CREATE TABLE IF NOT EXISTS writing_submissions (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), question_id INTEGER NOT NULL REFERENCES questions(id),
  text TEXT NOT NULL, auto_score REAL NOT NULL, rubric_result TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS writing_feedback (id INTEGER PRIMARY KEY, submission_id INTEGER NOT NULL REFERENCES writing_submissions(id), admin_id INTEGER NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL, score REAL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS mock_exams (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT, kind TEXT NOT NULL DEFAULT 'official' CHECK (kind IN ('official','custom')),
  owner_id INTEGER REFERENCES users(id), level_id INTEGER REFERENCES levels(id), scope TEXT, matrix TEXT NOT NULL DEFAULT '[]', question_ids TEXT NOT NULL DEFAULT '[]',
  duration_min INTEGER NOT NULL DEFAULT 20, pass_score INTEGER, show_answers INTEGER NOT NULL DEFAULT 1, open_at TEXT, close_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')), config TEXT NOT NULL DEFAULT '{}',
  created_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS exam_attempts (id INTEGER PRIMARY KEY, exam_id INTEGER NOT NULL REFERENCES mock_exams(id), user_id INTEGER NOT NULL REFERENCES users(id),
  items TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '{}', flags TEXT NOT NULL DEFAULT '[]', started_at TEXT NOT NULL, deadline_at TEXT NOT NULL, submitted_at TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','auto_submitted','abandoned')), score REAL, correct INTEGER, total INTEGER, detail TEXT);
CREATE INDEX IF NOT EXISTS ix_att_user ON exam_attempts(user_id, exam_id);
CREATE TABLE IF NOT EXISTS achievements (user_id INTEGER NOT NULL REFERENCES users(id), code TEXT NOT NULL, earned_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, code));
CREATE TABLE IF NOT EXISTS admin_logs (id INTEGER PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES users(id), action TEXT NOT NULL, target_type TEXT, target_id INTEGER, detail TEXT, at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

const J = (s, d) => { if (s == null) return d; try { return JSON.parse(s); } catch { return d; } };
const nowIso = () => new Date().toISOString().replace('T', ' ').slice(0, 19); // cùng định dạng datetime('now') (UTC)
const addDays = (d) => new Date(Date.now() + d * 86400000).toISOString().replace('T', ' ').slice(0, 19);
const today = () => new Date().toISOString().slice(0, 10);
const qs = (n) => Array(n).fill('?').join(',');

module.exports = { db, client, SCHEMA, J, nowIso, addDays, today, qs };
