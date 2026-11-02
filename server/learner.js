// API dành cho người học. Mọi truy vấn dữ liệu riêng đều lọc theo req.user.id.
const express = require('express');
const { db, J, nowIso, today } = require('./db');
const E = require('./engine');
const S = require('./stats');
const A = require('./auth');

const r = express.Router();
const bad = (res, msg, code = 400, extra = {}) => res.status(code).json({ error: msg, ...extra });
const int = (v) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : null);

/* ---------------- Tài khoản ---------------- */
r.post('/auth/register', (req, res) => {
  const { username, display_name, password } = req.body || {};
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username || '')) return bad(res, 'Tên đăng nhập gồm 3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới.');
  if (!password || password.length < 8) return bad(res, 'Mật khẩu cần ít nhất 8 ký tự.');
  const name = String(display_name || username).trim().slice(0, 60);
  if (db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) return bad(res, 'Tên đăng nhập đã được sử dụng.', 409);
  const id = db.prepare('INSERT INTO users(username,display_name,password_hash) VALUES (?,?,?)').run(username, name, A.hashPassword(password)).lastInsertRowid;
  db.prepare("UPDATE users SET last_login_at=datetime('now') WHERE id=?").run(id);
  db.prepare('INSERT INTO login_events(user_id) VALUES (?)').run(id);
  A.createSession(res, id);
  res.json({ ok: true });
});
r.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const key = `${req.ip}|${String(username || '').toLowerCase()}`;
  if (A.loginLimited(key)) return bad(res, 'Bạn đã đăng nhập sai quá nhiều lần. Hãy thử lại sau 15 phút.', 429);
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username || '');
  if (!u || !A.verifyPassword(password || '', u.password_hash)) { A.loginFailed(key); return bad(res, 'Sai tên đăng nhập hoặc mật khẩu.', 401); }
  if (u.status !== 'active') return bad(res, 'Tài khoản đang bị khoá. Hãy liên hệ quản trị viên.', 403);
  db.prepare("UPDATE users SET last_login_at=datetime('now') WHERE id=?").run(u.id);
  db.prepare('INSERT INTO login_events(user_id) VALUES (?)').run(u.id);
  A.createSession(res, u.id);
  res.json({ ok: true, role: u.role });
});
r.post('/auth/logout', (req, res) => { A.destroySession(req, res); res.json({ ok: true }); });
r.get('/me', (req, res) => res.json({ user: req.user || null }));

// Mọi route bên dưới cần đăng nhập
r.use(A.requireAuth);
r.put('/me', (req, res) => {
  const name = String((req.body && req.body.display_name) || req.user.display_name).trim().slice(0, 60) || req.user.display_name;
  const goal = Math.min(200, Math.max(5, int(req.body && req.body.daily_goal) || req.user.daily_goal));
  db.prepare('UPDATE users SET display_name=?, daily_goal=? WHERE id=?').run(name, goal, req.user.id);
  res.json({ ok: true });
});
r.post('/activity/ping', (req, res) => {
  const sec = Math.min(60, Math.max(0, int(req.body && req.body.seconds) || 0));
  if (sec) db.prepare(`INSERT INTO activity_days(user_id,day,seconds) VALUES (?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET seconds=seconds+excluded.seconds`).run(req.user.id, today(), sec);
  res.json({ ok: true });
});

/* ---------------- Lộ trình & chủ đề ---------------- */
r.get('/overview', (req, res) => res.json(S.overview(req.user.id)));
r.get('/practice-center', (req, res) => res.json(S.practiceCenter(req.user.id)));

r.get('/topics/:id', (req, res) => {
  const t = db.prepare('SELECT t.*, l.name level_name, l.code level_code FROM topics t JOIN levels l ON l.id=t.level_id WHERE t.id=? AND t.archived=0').get(req.params.id);
  if (!t) return bad(res, 'Không tìm thấy chủ đề.', 404);
  const uid = req.user.id;
  const lessons = db.prepare('SELECT id,title,goal,body FROM lessons WHERE topic_id=? AND archived=0 ORDER BY sort,id').all(t.id).map((l) => ({ ...l, body: J(l.body, {}) }));
  const grammar = db.prepare('SELECT id,pattern,meaning,formula,explanation,examples,mistakes,compare FROM grammar_points WHERE topic_id=? AND archived=0').all(t.id)
    .map((g) => ({ ...g, examples: J(g.examples, []), mistakes: J(g.mistakes, []) }));
  const vocab = db.prepare(`SELECT v.id,v.ko,v.vi,v.note,s.box,s.due_at,s.lapses FROM vocabulary v
    LEFT JOIN srs_records s ON s.vocab_id=v.id AND s.user_id=? WHERE v.topic_id=? AND v.archived=0 ORDER BY v.id`).all(uid, t.id);
  const passages = db.prepare("SELECT id,kind,title,ko_text,vi_text FROM passages WHERE topic_id=? AND archived=0 AND kind='reading'").all(t.id);
  const status = E.topicStatus(uid, t);
  const active = db.prepare("SELECT id,cursor,json_array_length(items) total FROM practice_sessions WHERE user_id=? AND topic_id=? AND kind='topic' AND status='active' ORDER BY id DESC LIMIT 1").get(uid, t.id);
  const writings = t.grp === 'writing' ? db.prepare(`SELECT w.id,w.text,w.auto_score,w.created_at,q.prompt,
      (SELECT comment FROM writing_feedback f WHERE f.submission_id=w.id ORDER BY f.id DESC LIMIT 1) feedback
      FROM writing_submissions w JOIN questions q ON q.id=w.question_id WHERE w.user_id=? AND q.topic_id=? ORDER BY w.id DESC LIMIT 10`).all(uid, t.id) : [];
  const types = db.prepare("SELECT type, COUNT(*) n FROM questions WHERE topic_id=? AND status='published' AND archived=0 GROUP BY type").all(t.id);
  res.json({ topic: { id: t.id, code: t.code, name: t.name, description: t.description, grp: t.grp, source: t.source, level_name: t.level_name, level_code: t.level_code },
    lessons, grammar, vocab, passages, status, active_session: active || null, writings, types });
});
r.post('/topics/:id/viewed', (req, res) => {
  const t = db.prepare('SELECT id FROM topics WHERE id=? AND archived=0').get(req.params.id);
  if (!t) return bad(res, 'Không tìm thấy chủ đề.', 404);
  db.prepare(`INSERT INTO topic_progress(user_id,topic_id,theory_viewed_at) VALUES (?,?,datetime('now'))
    ON CONFLICT(user_id,topic_id) DO UPDATE SET theory_viewed_at=COALESCE(theory_viewed_at, datetime('now'))`).run(req.user.id, t.id);
  res.json({ ok: true });
});

/* ---------------- Phiên luyện tập ---------------- */
const GOAL_COUNT = { 5: 8, 10: 15, 15: 22 };
function learnedTopicIds(uid) {
  return db.prepare(`SELECT p.topic_id FROM topic_progress p JOIN topics t ON t.id=p.topic_id
    WHERE p.user_id=? AND t.archived=0 AND (p.theory_viewed_at IS NOT NULL OR EXISTS (SELECT 1 FROM user_answers a WHERE a.user_id=p.user_id AND a.topic_id=p.topic_id))`).all(uid).map((x) => x.topic_id);
}
function dueMistakeIds(uid, { topicId, since, includeAll } = {}) {
  const w = ['mi.user_id=?', 'q.archived=0'], a = [uid];
  if (!includeAll) w.push("(mi.state='open' OR (mi.state IN ('understood','fixing') AND mi.next_check_at<=datetime('now')))");
  else w.push("mi.state!='resolved'");
  if (topicId) { w.push('q.topic_id=?'); a.push(topicId); }
  if (since) { w.push('mi.last_wrong_at>=?'); a.push(since); }
  return db.prepare(`SELECT mi.question_id id FROM mistakes mi JOIN questions q ON q.id=mi.question_id WHERE ${w.join(' AND ')} ORDER BY mi.last_wrong_at DESC`).all(...a).map((x) => x.id);
}
function mixedPool(uid, count, { challenge = false, levelId = null, noWrite = true } = {}) {
  let learned = learnedTopicIds(uid);
  if (levelId) learned = learned.filter((id) => db.prepare('SELECT level_id FROM topics WHERE id=?').get(id).level_id === levelId);
  if (challenge) learned = db.prepare('SELECT id FROM topics WHERE archived=0' + (levelId ? ' AND level_id=' + Number(levelId) : '')).all().map((x) => x.id);
  if (!learned.length) return { error: 'Bạn chưa học chủ đề nào. Hãy mở một chủ đề trong Trung tâm luyện tập trước, hoặc bật chế độ thử thách.' };
  const types = noWrite ? ['mcq', 'listen', 'error', 'order', 'fill', 'conjugate', 'translate'] : null;
  const all = E.poolQuery({ topicIds: learned, types });
  const byId = new Map(all.map((q) => [q.id, q]));
  const chosen = new Set();
  const addFrom = (list, n) => { for (const q of E.pickQuestions(uid, list.filter((x) => !chosen.has(x.id)), n)) chosen.add(q.id); };
  const mastery = learned.map((tid) => ({ tid, m: E.computeMastery(uid, tid).level }));
  const weak = mastery.filter((x) => ['needs_practice', 'familiarizing'].includes(x.m)).map((x) => x.tid);
  const old = mastery.filter((x) => ['basic', 'mastered'].includes(x.m)).map((x) => x.tid);
  const mistakes = dueMistakeIds(uid).map((id) => byId.get(id)).filter(Boolean);
  const dueV = new Set(db.prepare("SELECT vocab_id FROM srs_records WHERE user_id=? AND due_at<=datetime('now')").all(uid).map((x) => x.vocab_id));
  const seen = new Set(db.prepare('SELECT DISTINCT question_id q FROM user_answers WHERE user_id=?').all(uid).map((x) => x.q));
  addFrom(mistakes, Math.round(count * 0.25));
  addFrom(all.filter((q) => weak.includes(q.topic_id)), Math.round(count * 0.35));
  addFrom(all.filter((q) => { const d = J(q.data, {}); return d.vocab_id && dueV.has(d.vocab_id); }), Math.round(count * 0.15));
  addFrom(all.filter((q) => old.includes(q.topic_id)), Math.round(count * 0.15));
  addFrom(all.filter((q) => !seen.has(q.id)), count - chosen.size);
  if (chosen.size < count) addFrom(all, count - chosen.size);
  return { ids: E.shuffle([...chosen]) };
}

function createSession(uid, body) {
  const kind = String(body.kind || 'topic');
  let count = Math.min(40, Math.max(3, int(body.count) || 10));
  let topicId = int(body.topic_id) || null;
  let pool = [], ids = null;
  const config = { kind };
  if (kind === 'topic') {
    if (!topicId || !db.prepare('SELECT 1 FROM topics WHERE id=? AND archived=0').get(topicId)) return { error: 'Chủ đề không hợp lệ.' };
    if (!body.fresh) {
      const act = db.prepare("SELECT id FROM practice_sessions WHERE user_id=? AND topic_id=? AND kind='topic' AND status='active' ORDER BY id DESC LIMIT 1").get(uid, topicId);
      if (act) return { id: act.id, resumed: true };
    } else db.prepare("UPDATE practice_sessions SET status='abandoned', ended_at=datetime('now') WHERE user_id=? AND topic_id=? AND kind='topic' AND status='active'").run(uid, topicId);
    pool = E.poolQuery({ topicIds: [topicId], types: body.types && body.types.length ? body.types : null });
    if (body.minutes) count = GOAL_COUNT[body.minutes] || count;
  } else if (kind === 'mixed' || kind === 'challenge' || kind === 'exam_prep') {
    if (body.minutes) count = GOAL_COUNT[body.minutes] || count;
    const m = mixedPool(uid, count, { challenge: kind === 'challenge', levelId: int(body.level_id) });
    if (m.error) return m;
    ids = m.ids;
  } else if (kind === 'mistakes') {
    ids = dueMistakeIds(uid, { topicId, since: body.since, includeAll: !!body.include_all });
    if (body.question_ids && body.question_ids.length) { const want = new Set(body.question_ids.map(Number)); ids = ids.filter((x) => want.has(x)); }
    if (!ids.length) return { error: 'Không có câu sai nào cần ôn trong bộ lọc này.' };
    ids = ids.slice(0, count);
  } else if (kind === 'retry') {
    const want = (body.question_ids || []).map(Number).filter(Boolean);
    // chỉ cho làm lại câu người học đã từng làm
    ids = want.filter((q) => db.prepare('SELECT 1 FROM user_answers WHERE user_id=? AND question_id=? LIMIT 1').get(uid, q)).slice(0, 40);
    if (!ids.length) return { error: 'Không có câu hỏi hợp lệ để làm lại.' };
  } else if (kind === 'similar') {
    const base = E.loadQuestion(int(body.question_id));
    if (!base) return { error: 'Không tìm thấy câu hỏi gốc.' };
    topicId = base.topic_id;
    pool = E.poolQuery({ topicIds: [base.topic_id], errorTags: [base.error_tag], excludeIds: [base.id] });
    if (pool.length < 3) pool = E.poolQuery({ topicIds: [base.topic_id], excludeIds: [base.id] });
    count = Math.min(count, 6);
  } else if (kind === 'errors' || kind === 'grammar') {
    const learned = learnedTopicIds(uid);
    let tags = (body.error_tags || []).filter((t) => /^[a-z_]+$/.test(t));
    if (!tags.length && kind === 'errors') {
      const top = db.prepare('SELECT error_tag, COUNT(*) n FROM user_answers WHERE user_id=? AND is_correct=0 GROUP BY error_tag ORDER BY n DESC LIMIT 2').all(uid);
      tags = top.map((x) => x.error_tag);
      if (!tags.length) return { error: 'Bạn chưa có lỗi nào được ghi nhận. Hãy luyện tập vài chủ đề trước.' };
    }
    const topicIds = body.topic_ids && body.topic_ids.length ? body.topic_ids.map(Number) : learned;
    if (!topicIds.length) return { error: 'Bạn chưa học chủ đề nào.' };
    pool = E.poolQuery({ topicIds, errorTags: tags.length ? tags : null, types: ['mcq', 'listen', 'error', 'order', 'fill', 'conjugate', 'translate'] });
    if (body.minutes) count = GOAL_COUNT[body.minutes] || count;
    config.error_tags = tags;
  } else if (kind === 'vocab') {
    const vids = S.vocabBucket(uid, body.bucket, int(body.topic_id)).map((v) => v.id);
    if (!vids.length) return { error: 'Nhóm từ này hiện không có từ nào.' };
    const set = new Set(vids);
    pool = E.poolQuery({ types: ['mcq', 'listen', 'translate'] }).filter((q) => { const d = J(q.data, {}); return d.vocab_id && set.has(d.vocab_id); });
    config.bucket = body.bucket;
  } else return { error: 'Loại phiên không hợp lệ.' };

  let questions;
  if (ids) questions = ids.map((id) => ({ id }));
  else {
    if (!pool.length) return { error: 'Chưa có câu hỏi phù hợp cho lựa chọn này.' };
    const last = topicId ? db.prepare("SELECT items FROM practice_sessions WHERE user_id=? AND topic_id=? AND status!='active' ORDER BY id DESC LIMIT 1").get(uid, topicId) : null;
    const recentIds = last ? J(last.items, []).map((i) => i.q) : [];
    questions = E.pickQuestions(uid, pool, Math.min(count, pool.length), { recentIds });
  }
  const items = E.buildItems(questions);
  if (body.minutes) config.minutes = body.minutes;
  if (body.focus) config.focus = body.focus;
  const id = db.prepare('INSERT INTO practice_sessions(user_id,topic_id,kind,config,items) VALUES (?,?,?,?,?)')
    .run(uid, topicId, kind, JSON.stringify(config), JSON.stringify(items)).lastInsertRowid;
  return { id, resumed: false, available: pool.length || (ids && ids.length) };
}

function sessionState(sess) {
  const items = J(sess.items, []);
  const out = {
    id: sess.id, kind: sess.kind, topic_id: sess.topic_id, status: sess.status, cursor: sess.cursor, total: items.length,
    answered: sess.answered, correct: sess.correct, started_at: sess.started_at, ended_at: sess.ended_at, config: J(sess.config, {}),
    results: items.map((i) => (i.r ? { correct: i.r.correct, score: i.r.score } : null)),
  };
  if (sess.topic_id) out.topic = db.prepare('SELECT id,name,grp FROM topics WHERE id=?').get(sess.topic_id);
  if (sess.status === 'active' && sess.cursor < items.length) {
    const it = items[sess.cursor];
    const q = E.loadQuestion(it.q);
    out.question = q ? E.publicQuestion(q, it.o) : null;
  }
  if (sess.status === 'completed') out.summary = S.sessionSummary(sess, items);
  return out;
}
const ownSession = (req) => db.prepare('SELECT * FROM practice_sessions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);

r.post('/sessions', (req, res) => {
  const out = createSession(req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, 422);
  res.json(sessionState(db.prepare('SELECT * FROM practice_sessions WHERE id=?').get(out.id)));
});
r.get('/sessions/active', (req, res) => {
  res.json(db.prepare(`SELECT s.id,s.kind,s.topic_id,t.name topic_name,s.cursor,json_array_length(s.items) total,s.updated_at FROM practice_sessions s
    LEFT JOIN topics t ON t.id=s.topic_id WHERE s.user_id=? AND s.status='active' ORDER BY s.updated_at DESC LIMIT 10`).all(req.user.id));
});
r.get('/sessions/:id', (req, res) => {
  const s = ownSession(req); if (!s) return bad(res, 'Không tìm thấy phiên luyện tập.', 404);
  res.json(sessionState(s));
});
r.post('/sessions/:id/answer', (req, res) => {
  const s = ownSession(req); if (!s) return bad(res, 'Không tìm thấy phiên luyện tập.', 404);
  if (s.status !== 'active') return bad(res, 'Phiên này đã kết thúc.', 409);
  const items = J(s.items, []);
  const it = items[s.cursor];
  if (!it || Number(req.body.question_id) !== it.q) return bad(res, 'Câu hỏi không khớp với tiến độ phiên. Hãy tải lại.', 409);
  const q = E.loadQuestion(it.q);
  const g = E.grade(q, req.body.response || {});
  E.recordAnswer(req.user.id, q, req.body.response || {}, g, { mode: 'practice', session_id: s.id });
  it.r = { correct: g.correct, score: g.score };
  const cursor = s.cursor + 1;
  const done = cursor >= items.length;
  db.prepare(`UPDATE practice_sessions SET items=?, cursor=?, answered=answered+1, correct=correct+?, updated_at=datetime('now'),
    status=?, ended_at=CASE WHEN ? THEN datetime('now') ELSE ended_at END WHERE id=?`)
    .run(JSON.stringify(items), cursor, g.correct ? 1 : 0, done ? 'completed' : 'active', done ? 1 : 0, s.id);
  if (done) S.finishSession(req.user.id, s);
  const fresh = db.prepare('SELECT * FROM practice_sessions WHERE id=?').get(s.id);
  res.json({
    result: { correct: g.correct, score: g.score, correct_answer: g.correct_answer, chosen: g.chosen, choice_feedback: g.choice_feedback, why: g.why, rubric: g.rubric || null,
      correct_option: q.options.length ? (q.options.find((o) => o.is_correct) || {}).id : null, error_tag: q.error_tag, topic_id: q.topic_id, question_id: q.id },
    state: sessionState(fresh),
  });
});
r.post('/sessions/:id/abandon', (req, res) => {
  const s = ownSession(req); if (!s) return bad(res, 'Không tìm thấy phiên luyện tập.', 404);
  if (s.status === 'active') db.prepare("UPDATE practice_sessions SET status='abandoned', ended_at=datetime('now') WHERE id=?").run(s.id);
  res.json({ ok: true });
});

/* ---------------- Ôn tập ---------------- */
r.get('/review', (req, res) => res.json(S.reviewCenter(req.user.id, req.query)));
r.get('/mistakes/:qid', (req, res) => {
  const m = db.prepare('SELECT * FROM mistakes WHERE user_id=? AND question_id=?').get(req.user.id, req.params.qid);
  if (!m) return bad(res, 'Không tìm thấy.', 404);
  const q = E.loadQuestion(m.question_id);
  const resp = J(m.last_response, {});
  const g = E.grade(q, resp);
  const history = db.prepare('SELECT is_correct, mode, answered_at FROM user_answers WHERE user_id=? AND question_id=? ORDER BY id DESC LIMIT 10').all(req.user.id, q.id);
  res.json({ mistake: m, question: E.publicQuestion(q), explanation: q.explanation, correct_answer: g.correct_answer, your_answer: g.chosen, choice_feedback: g.choice_feedback, history });
});
r.post('/mistakes/:qid/understood', (req, res) => {
  const ch = db.prepare(`UPDATE mistakes SET state='understood', next_check_at=datetime('now','+1 day') WHERE user_id=? AND question_id=? AND state IN ('open','fixing')`).run(req.user.id, req.params.qid);
  res.json({ ok: ch.changes > 0 });
});
r.get('/vocab/deck', (req, res) => res.json(S.vocabBucket(req.user.id, req.query.bucket, int(req.query.topic_id)).slice(0, 50)));
r.post('/vocab/:id/review', (req, res) => {
  const v = db.prepare('SELECT id FROM vocabulary WHERE id=? AND archived=0').get(req.params.id);
  if (!v) return bad(res, 'Không tìm thấy từ.', 404);
  E.updateSrs(req.user.id, v.id, !!(req.body && req.body.known));
  db.prepare(`INSERT INTO activity_days(user_id,day,answers) VALUES (?,?,0) ON CONFLICT(user_id,day) DO NOTHING`).run(req.user.id, today());
  res.json({ ok: true });
});

/* ---------------- Thi thử ---------------- */
const EX = require('./exams');
r.get('/exams', (req, res) => res.json(EX.listForUser(req.user.id)));
r.post('/exams/generate', (req, res) => {
  const out = EX.generateCustom(req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, 422, out);
  res.json(out);
});
r.get('/exams/:id', (req, res) => {
  const ex = EX.accessibleExam(req.user.id, req.params.id);
  if (!ex) return bad(res, 'Đề thi không tồn tại hoặc chưa mở.', 404);
  res.json(EX.examInfo(req.user.id, ex));
});
r.post('/exams/:id/start', (req, res) => {
  const ex = EX.accessibleExam(req.user.id, req.params.id);
  if (!ex) return bad(res, 'Đề thi không tồn tại hoặc chưa mở.', 404);
  const att = EX.start(req.user.id, ex);
  if (att.error) return bad(res, att.error, 422);
  res.json(EX.attemptState(att.id, req.user.id));
});
r.get('/attempts/:id', (req, res) => {
  const st = EX.attemptState(int(req.params.id), req.user.id);
  if (!st) return bad(res, 'Không tìm thấy lượt thi.', 404);
  res.json(st);
});
r.put('/attempts/:id/answer', (req, res) => {
  const out = EX.saveAnswer(int(req.params.id), req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, out.code || 400);
  res.json(out);
});
r.put('/attempts/:id/flag', (req, res) => {
  const out = EX.setFlag(int(req.params.id), req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, out.code || 400);
  res.json(out);
});
r.post('/attempts/:id/submit', (req, res) => {
  const out = EX.submit(int(req.params.id), req.user.id, 'submitted');
  if (out.error) return bad(res, out.error, out.code || 400);
  res.json(EX.attemptState(int(req.params.id), req.user.id));
});
r.post('/attempts/:id/abandon', (req, res) => {
  const ch = db.prepare("UPDATE exam_attempts SET status='abandoned', submitted_at=datetime('now') WHERE id=? AND user_id=? AND status='in_progress'").run(req.params.id, req.user.id);
  res.json({ ok: ch.changes > 0 });
});

/* ---------------- Tiến độ ---------------- */
r.get('/progress', (req, res) => res.json(S.dashboard(req.user.id)));

module.exports = r;
