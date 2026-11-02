// API dành cho người học. Mọi truy vấn dữ liệu riêng đều lọc theo req.user.id.
const express = require('express');
const { db, J, today, qs } = require('./db');
const E = require('./engine');
const S = require('./stats');
const A = require('./auth');
const EX = require('./exams');

const r = express.Router();
const bad = (res, msg, code = 400, extra = {}) => res.status(code).json({ error: msg, ...extra });
const int = (v) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : null);

/* ---------------- Tài khoản ---------------- */
r.post('/auth/register', async (req, res) => {
  const { username, display_name, password } = req.body || {};
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username || '')) return bad(res, 'Tên đăng nhập gồm 3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới.');
  if (!password || password.length < 8) return bad(res, 'Mật khẩu cần ít nhất 8 ký tự.');
  const name = String(display_name || username).trim().slice(0, 60);
  if (await db.get('SELECT 1 x FROM users WHERE username=?', username)) return bad(res, 'Tên đăng nhập đã được sử dụng.', 409);
  let id;
  try { id = (await db.run("INSERT INTO users(username,display_name,password_hash,last_login_at) VALUES (?,?,?,datetime('now'))", username, name, A.hashPassword(password))).lastInsertRowid; }
  catch { return bad(res, 'Tên đăng nhập đã được sử dụng.', 409); }
  await db.run('INSERT INTO login_events(user_id) VALUES (?)', id);
  await A.createSession(res, id);
  res.json({ ok: true });
});
r.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const key = `${req.ip}|${String(username || '').toLowerCase()}`;
  if (await A.loginLimited(key)) return bad(res, 'Bạn đã đăng nhập sai quá nhiều lần. Hãy thử lại sau 15 phút.', 429);
  const u = await db.get('SELECT * FROM users WHERE username=?', username || '');
  if (!u || !A.verifyPassword(password || '', u.password_hash)) { await A.loginFailed(key); return bad(res, 'Sai tên đăng nhập hoặc mật khẩu.', 401); }
  if (u.status !== 'active') return bad(res, 'Tài khoản đang bị khoá. Hãy liên hệ quản trị viên.', 403);
  await db.batch([["UPDATE users SET last_login_at=datetime('now') WHERE id=?", [u.id]], ['INSERT INTO login_events(user_id) VALUES (?)', [u.id]]]);
  await A.createSession(res, u.id);
  res.json({ ok: true, role: u.role });
});
r.post('/auth/logout', async (req, res) => { await A.destroySession(req, res); res.json({ ok: true }); });
r.get('/me', (req, res) => res.json({ user: req.user || null }));

// Mọi route bên dưới cần đăng nhập
r.use(A.requireAuth);
r.put('/me', async (req, res) => {
  const name = String((req.body && req.body.display_name) || req.user.display_name).trim().slice(0, 60) || req.user.display_name;
  const goal = Math.min(200, Math.max(5, int(req.body && req.body.daily_goal) || req.user.daily_goal));
  await db.run('UPDATE users SET display_name=?, daily_goal=? WHERE id=?', name, goal, req.user.id);
  res.json({ ok: true });
});
r.post('/activity/ping', async (req, res) => {
  const sec = Math.min(60, Math.max(0, int(req.body && req.body.seconds) || 0));
  if (sec) await db.run('INSERT INTO activity_days(user_id,day,seconds) VALUES (?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET seconds=seconds+excluded.seconds', req.user.id, today(), sec);
  res.json({ ok: true });
});

/* ---------------- Lộ trình & chủ đề ---------------- */
r.get('/overview', async (req, res) => res.json(await S.overview(req.user.id)));
r.get('/practice-center', async (req, res) => res.json(await S.practiceCenter(req.user.id)));

r.get('/topics/:id', async (req, res) => {
  const t = await db.get('SELECT t.*, l.name level_name, l.code level_code FROM topics t JOIN levels l ON l.id=t.level_id WHERE t.id=? AND t.archived=0', req.params.id);
  if (!t) return bad(res, 'Không tìm thấy chủ đề.', 404);
  const uid = req.user.id;
  const [lessons, grammar, vocab, passages, status, active, writings, types] = await Promise.all([
    db.all('SELECT id,title,goal,body FROM lessons WHERE topic_id=? AND archived=0 ORDER BY sort,id', t.id),
    db.all('SELECT id,pattern,meaning,formula,explanation,examples,mistakes,compare FROM grammar_points WHERE topic_id=? AND archived=0', t.id),
    db.all('SELECT v.id,v.ko,v.vi,v.note,s.box,s.due_at,s.lapses FROM vocabulary v LEFT JOIN srs_records s ON s.vocab_id=v.id AND s.user_id=? WHERE v.topic_id=? AND v.archived=0 ORDER BY v.id', uid, t.id),
    db.all("SELECT id,kind,title,ko_text,vi_text FROM passages WHERE topic_id=? AND archived=0 AND kind='reading'", t.id),
    E.topicStatus(uid, t),
    db.get("SELECT id,cursor,json_array_length(items) total FROM practice_sessions WHERE user_id=? AND topic_id=? AND kind='topic' AND status='active' ORDER BY id DESC LIMIT 1", uid, t.id),
    t.grp === 'writing' ? db.all(`SELECT w.id,w.text,w.auto_score,w.created_at,q.prompt,(SELECT comment FROM writing_feedback f WHERE f.submission_id=w.id ORDER BY f.id DESC LIMIT 1) feedback
      FROM writing_submissions w JOIN questions q ON q.id=w.question_id WHERE w.user_id=? AND q.topic_id=? ORDER BY w.id DESC LIMIT 10`, uid, t.id) : [],
    db.all("SELECT type, COUNT(*) n FROM questions WHERE topic_id=? AND status='published' AND archived=0 GROUP BY type", t.id),
  ]);
  res.json({ topic: { id: t.id, code: t.code, name: t.name, description: t.description, grp: t.grp, source: t.source, level_name: t.level_name, level_code: t.level_code },
    lessons: lessons.map((l) => ({ ...l, body: J(l.body, {}) })), grammar: grammar.map((g) => ({ ...g, examples: J(g.examples, []), mistakes: J(g.mistakes, []) })),
    vocab, passages, status, active_session: active || null, writings, types });
});
r.post('/topics/:id/viewed', async (req, res) => {
  const t = await db.get('SELECT id FROM topics WHERE id=? AND archived=0', req.params.id);
  if (!t) return bad(res, 'Không tìm thấy chủ đề.', 404);
  await db.run(`INSERT INTO topic_progress(user_id,topic_id,theory_viewed_at) VALUES (?,?,datetime('now'))
    ON CONFLICT(user_id,topic_id) DO UPDATE SET theory_viewed_at=COALESCE(theory_viewed_at, datetime('now'))`, req.user.id, t.id);
  res.json({ ok: true });
});

/* ---------------- Phiên luyện tập ---------------- */
const GOAL_COUNT = { 5: 8, 10: 15, 15: 22 };
const NO_WRITE = ['mcq', 'listen', 'error', 'order', 'fill', 'conjugate', 'translate'];
async function dueMistakeIds(uid, { topicId, since, includeAll } = {}) {
  const w = ['mi.user_id=?', 'q.archived=0'], a = [uid];
  w.push(includeAll ? "mi.state!='resolved'" : "(mi.state='open' OR (mi.state IN ('understood','fixing') AND mi.next_check_at<=datetime('now')))");
  if (topicId) { w.push('q.topic_id=?'); a.push(topicId); }
  if (since) { w.push('mi.last_wrong_at>=?'); a.push(since); }
  return (await db.all(`SELECT mi.question_id id FROM mistakes mi JOIN questions q ON q.id=mi.question_id WHERE ${w.join(' AND ')} ORDER BY mi.last_wrong_at DESC`, ...a)).map((x) => x.id);
}
async function mixedPool(uid, count, { challenge = false, levelId = null } = {}) {
  let topicIds;
  if (challenge) topicIds = (await db.all('SELECT id FROM topics WHERE archived=0' + (levelId ? ' AND level_id=?' : ''), ...(levelId ? [levelId] : []))).map((x) => x.id);
  else {
    topicIds = await S.learnedTopicIds(uid);
    if (levelId && topicIds.length) topicIds = (await db.all(`SELECT id FROM topics WHERE level_id=? AND id IN (${qs(topicIds.length)})`, levelId, ...topicIds)).map((x) => x.id);
  }
  if (!topicIds.length) return { error: 'Bạn chưa học chủ đề nào. Hãy mở một chủ đề trong Trung tâm luyện tập trước, hoặc bật chế độ thử thách.' };
  const [all, M, mids, dueRows, seenRows] = await Promise.all([
    E.poolQuery({ topicIds, types: NO_WRITE }), E.masteryMany(uid, topicIds), dueMistakeIds(uid),
    db.all("SELECT vocab_id FROM srs_records WHERE user_id=? AND due_at<=datetime('now')", uid),
    db.all('SELECT DISTINCT question_id q FROM user_answers WHERE user_id=?', uid),
  ]);
  const byId = new Map(all.map((q) => [q.id, q]));
  const weak = topicIds.filter((t) => ['needs_practice', 'familiarizing'].includes(M.get(t).level));
  const old = topicIds.filter((t) => ['basic', 'mastered'].includes(M.get(t).level));
  const dueV = new Set(dueRows.map((x) => x.vocab_id)), seen = new Set(seenRows.map((x) => x.q));
  const chosen = new Set();
  const addFrom = async (list, n) => { if (n <= 0) return; for (const q of await E.pickQuestions(uid, list.filter((x) => !chosen.has(x.id)), n)) chosen.add(q.id); };
  // Ưu tiên: câu sai đến hạn, chủ đề yếu, từ đến hạn ôn, kiến thức cũ cần củng cố, một phần câu mới
  await addFrom(mids.map((id) => byId.get(id)).filter(Boolean), Math.round(count * 0.25));
  await addFrom(all.filter((q) => weak.includes(q.topic_id)), Math.round(count * 0.35));
  await addFrom(all.filter((q) => q.vocab_id && dueV.has(q.vocab_id)), Math.round(count * 0.15));
  await addFrom(all.filter((q) => old.includes(q.topic_id)), Math.round(count * 0.15));
  await addFrom(all.filter((q) => !seen.has(q.id)), count - chosen.size);
  if (chosen.size < count) await addFrom(all, count - chosen.size);
  return { ids: E.shuffle([...chosen]) };
}

async function createSession(uid, body) {
  const kind = String(body.kind || 'topic');
  let count = Math.min(40, Math.max(3, int(body.count) || 10));
  let topicId = int(body.topic_id) || null;
  let pool = [], ids = null;
  const config = { kind };
  if (kind === 'topic') {
    if (!topicId || !(await db.get('SELECT 1 x FROM topics WHERE id=? AND archived=0', topicId))) return { error: 'Chủ đề không hợp lệ.' };
    if (!body.fresh) {
      const act = await db.get("SELECT id FROM practice_sessions WHERE user_id=? AND topic_id=? AND kind='topic' AND status='active' ORDER BY id DESC LIMIT 1", uid, topicId);
      if (act) return { id: act.id, resumed: true };
    } else await db.run("UPDATE practice_sessions SET status='abandoned', ended_at=datetime('now') WHERE user_id=? AND topic_id=? AND kind='topic' AND status='active'", uid, topicId);
    pool = await E.poolQuery({ topicIds: [topicId], types: body.types && body.types.length ? body.types : null });
    if (body.minutes) count = GOAL_COUNT[body.minutes] || count;
  } else if (['mixed', 'challenge', 'exam_prep'].includes(kind)) {
    if (body.minutes) count = GOAL_COUNT[body.minutes] || count;
    const m = await mixedPool(uid, count, { challenge: kind === 'challenge', levelId: int(body.level_id) });
    if (m.error) return m;
    ids = m.ids;
  } else if (kind === 'mistakes') {
    ids = await dueMistakeIds(uid, { topicId, since: body.since, includeAll: !!body.include_all });
    if (body.question_ids && body.question_ids.length) { const want = new Set(body.question_ids.map(Number)); ids = ids.filter((x) => want.has(x)); }
    if (!ids.length) return { error: 'Không có câu sai nào cần ôn trong bộ lọc này.' };
    ids = ids.slice(0, count);
  } else if (kind === 'retry') {
    const want = [...new Set((body.question_ids || []).map(Number).filter(Boolean))].slice(0, 40);
    // chỉ cho làm lại câu người học đã từng làm
    const okIds = want.length ? new Set((await db.all(`SELECT DISTINCT question_id q FROM user_answers WHERE user_id=? AND question_id IN (${qs(want.length)})`, uid, ...want)).map((x) => x.q)) : new Set();
    ids = want.filter((q) => okIds.has(q));
    if (!ids.length) return { error: 'Không có câu hỏi hợp lệ để làm lại.' };
  } else if (kind === 'similar') {
    const base = await E.loadQuestion(int(body.question_id));
    if (!base) return { error: 'Không tìm thấy câu hỏi gốc.' };
    topicId = base.topic_id;
    pool = await E.poolQuery({ topicIds: [base.topic_id], errorTags: [base.error_tag], excludeIds: [base.id] });
    if (pool.length < 3) pool = await E.poolQuery({ topicIds: [base.topic_id], excludeIds: [base.id] });
    count = Math.min(count, 6);
  } else if (kind === 'errors' || kind === 'grammar') {
    const learned = await S.learnedTopicIds(uid);
    let tags = (body.error_tags || []).filter((t) => /^[a-z_]+$/.test(t));
    if (!tags.length && kind === 'errors') {
      tags = (await db.all('SELECT error_tag, COUNT(*) n FROM user_answers WHERE user_id=? AND is_correct=0 GROUP BY error_tag ORDER BY n DESC LIMIT 2', uid)).map((x) => x.error_tag);
      if (!tags.length) return { error: 'Bạn chưa có lỗi nào được ghi nhận. Hãy luyện tập vài chủ đề trước.' };
    }
    const topicIds = body.topic_ids && body.topic_ids.length ? body.topic_ids.map(Number) : learned;
    if (!topicIds.length) return { error: 'Bạn chưa học chủ đề nào.' };
    pool = await E.poolQuery({ topicIds, errorTags: tags.length ? tags : null, types: NO_WRITE });
    if (body.minutes) count = GOAL_COUNT[body.minutes] || count;
    config.error_tags = tags;
  } else if (kind === 'vocab') {
    const set = new Set((await S.vocabBucket(uid, body.bucket, int(body.topic_id))).map((v) => v.id));
    if (!set.size) return { error: 'Nhóm từ này hiện không có từ nào.' };
    pool = (await E.poolQuery({ types: ['mcq', 'listen', 'translate'] })).filter((q) => q.vocab_id && set.has(q.vocab_id));
    config.bucket = body.bucket;
  } else return { error: 'Loại phiên không hợp lệ.' };

  let questions;
  if (ids) questions = ids.map((id) => ({ id }));
  else {
    if (!pool.length) return { error: 'Chưa có câu hỏi phù hợp cho lựa chọn này.' };
    const last = topicId ? await db.get("SELECT items FROM practice_sessions WHERE user_id=? AND topic_id=? AND status!='active' ORDER BY id DESC LIMIT 1", uid, topicId) : null;
    questions = await E.pickQuestions(uid, pool, Math.min(count, pool.length), { recentIds: last ? J(last.items, []).map((i) => i.q) : [] });
  }
  const items = await E.buildItems(questions);
  if (body.minutes) config.minutes = body.minutes;
  const ins = await db.run('INSERT INTO practice_sessions(user_id,topic_id,kind,config,items) VALUES (?,?,?,?,?)', uid, topicId, kind, JSON.stringify(config), JSON.stringify(items));
  return { id: ins.lastInsertRowid, resumed: false };
}

async function sessionState(sess) {
  const items = J(sess.items, []);
  const out = { id: sess.id, kind: sess.kind, topic_id: sess.topic_id, status: sess.status, cursor: sess.cursor, total: items.length,
    answered: sess.answered, correct: sess.correct, started_at: sess.started_at, ended_at: sess.ended_at, config: J(sess.config, {}),
    results: items.map((i) => (i.r ? { correct: i.r.correct, score: i.r.score } : null)) };
  if (sess.topic_id) out.topic = await db.get('SELECT id,name,grp FROM topics WHERE id=?', sess.topic_id);
  if (sess.status === 'active' && sess.cursor < items.length) {
    const it = items[sess.cursor];
    const q = await E.loadQuestion(it.q);
    out.question = q ? E.publicQuestion(q, it.o) : null;
  }
  if (sess.status === 'completed') out.summary = await S.sessionSummary(sess, items);
  return out;
}
const ownSession = (req) => db.get('SELECT * FROM practice_sessions WHERE id=? AND user_id=?', req.params.id, req.user.id);

r.post('/sessions', async (req, res) => {
  const out = await createSession(req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, 422);
  res.json(await sessionState(await db.get('SELECT * FROM practice_sessions WHERE id=?', out.id)));
});
r.get('/sessions/active', async (req, res) => {
  res.json(await db.all(`SELECT s.id,s.kind,s.topic_id,t.name topic_name,s.cursor,json_array_length(s.items) total,s.updated_at FROM practice_sessions s
    LEFT JOIN topics t ON t.id=s.topic_id WHERE s.user_id=? AND s.status='active' ORDER BY s.updated_at DESC LIMIT 10`, req.user.id));
});
r.get('/sessions/:id', async (req, res) => {
  const s = await ownSession(req); if (!s) return bad(res, 'Không tìm thấy phiên luyện tập.', 404);
  res.json(await sessionState(s));
});
r.post('/sessions/:id/answer', async (req, res) => {
  const s = await ownSession(req); if (!s) return bad(res, 'Không tìm thấy phiên luyện tập.', 404);
  if (s.status !== 'active') return bad(res, 'Phiên này đã kết thúc.', 409);
  const items = J(s.items, []);
  const it = items[s.cursor];
  if (!it || Number(req.body.question_id) !== it.q) return bad(res, 'Câu hỏi không khớp với tiến độ phiên. Hãy tải lại.', 409);
  const q = await E.loadQuestion(it.q);
  const g = E.grade(q, req.body.response || {}, (await E.getSettings()).writing_pass);
  it.r = { correct: g.correct, score: g.score };
  const done = s.cursor + 1 >= items.length;
  // Cập nhật có điều kiện theo cursor để hai lần bấm liên tiếp không ghi trùng
  const upd = await db.run(`UPDATE practice_sessions SET items=?, cursor=cursor+1, answered=answered+1, correct=correct+?, updated_at=datetime('now'),
    status=?, ended_at=CASE WHEN ? THEN datetime('now') ELSE ended_at END WHERE id=? AND cursor=? AND status='active'`,
    JSON.stringify(items), g.correct ? 1 : 0, done ? 'completed' : 'active', done ? 1 : 0, s.id, s.cursor);
  if (!upd.changes) return bad(res, 'Câu này đã được trả lời. Hãy tải lại.', 409);
  await E.recordAnswers(req.user.id, [{ q, response: req.body.response || {}, g }], { mode: 'practice', session_id: s.id });
  if (done) await S.finishSession(req.user.id, s);
  const fresh = await db.get('SELECT * FROM practice_sessions WHERE id=?', s.id);
  res.json({
    result: { correct: g.correct, score: g.score, correct_answer: g.correct_answer, chosen: g.chosen, choice_feedback: g.choice_feedback, why: g.why, rubric: g.rubric || null,
      correct_option: q.options.length ? (q.options.find((o) => o.is_correct) || {}).id : null, error_tag: q.error_tag, topic_id: q.topic_id, question_id: q.id },
    state: await sessionState(fresh),
  });
});
r.post('/sessions/:id/abandon', async (req, res) => {
  const s = await ownSession(req); if (!s) return bad(res, 'Không tìm thấy phiên luyện tập.', 404);
  if (s.status === 'active') await db.run("UPDATE practice_sessions SET status='abandoned', ended_at=datetime('now') WHERE id=?", s.id);
  res.json({ ok: true });
});

/* ---------------- Ôn tập ---------------- */
r.get('/review', async (req, res) => res.json(await S.reviewCenter(req.user.id, req.query)));
r.get('/mistakes/:qid', async (req, res) => {
  const m = await db.get('SELECT * FROM mistakes WHERE user_id=? AND question_id=?', req.user.id, req.params.qid);
  if (!m) return bad(res, 'Không tìm thấy.', 404);
  const q = await E.loadQuestion(m.question_id);
  const g = E.grade(q, J(m.last_response, {}));
  const history = await db.all('SELECT is_correct, mode, answered_at FROM user_answers WHERE user_id=? AND question_id=? ORDER BY id DESC LIMIT 10', req.user.id, q.id);
  res.json({ mistake: m, question: E.publicQuestion(q), explanation: q.explanation, correct_answer: g.correct_answer, your_answer: g.chosen, choice_feedback: g.choice_feedback, history });
});
r.post('/mistakes/:qid/understood', async (req, res) => {
  const ch = await db.run("UPDATE mistakes SET state='understood', next_check_at=datetime('now','+1 day') WHERE user_id=? AND question_id=? AND state IN ('open','fixing')", req.user.id, req.params.qid);
  res.json({ ok: ch.changes > 0 });
});
r.get('/vocab/deck', async (req, res) => res.json((await S.vocabBucket(req.user.id, req.query.bucket, int(req.query.topic_id))).slice(0, 50)));
r.post('/vocab/:id/review', async (req, res) => {
  const v = await db.get('SELECT id FROM vocabulary WHERE id=? AND archived=0', req.params.id);
  if (!v) return bad(res, 'Không tìm thấy từ.', 404);
  await E.updateSrs(req.user.id, v.id, !!(req.body && req.body.known));
  res.json({ ok: true });
});

/* ---------------- Thi thử ---------------- */
r.get('/exams', async (req, res) => res.json(await EX.listForUser(req.user.id)));
r.post('/exams/generate', async (req, res) => {
  const out = await EX.generateCustom(req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, 422, out);
  res.json(out);
});
r.get('/exams/:id', async (req, res) => {
  const ex = await EX.accessibleExam(req.user.id, req.params.id);
  if (!ex) return bad(res, 'Đề thi không tồn tại hoặc chưa mở.', 404);
  res.json(await EX.examInfo(req.user.id, ex));
});
r.post('/exams/:id/start', async (req, res) => {
  const ex = await EX.accessibleExam(req.user.id, req.params.id);
  if (!ex) return bad(res, 'Đề thi không tồn tại hoặc chưa mở.', 404);
  const att = await EX.start(req.user.id, ex);
  if (att.error) return bad(res, att.error, 422);
  res.json(await EX.attemptState(att.id, req.user.id));
});
r.get('/attempts/:id', async (req, res) => {
  const st = await EX.attemptState(int(req.params.id), req.user.id);
  if (!st) return bad(res, 'Không tìm thấy lượt thi.', 404);
  res.json(st);
});
r.put('/attempts/:id/answer', async (req, res) => {
  const out = await EX.saveAnswer(int(req.params.id), req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, out.code || 400);
  res.json(out);
});
r.put('/attempts/:id/flag', async (req, res) => {
  const out = await EX.setFlag(int(req.params.id), req.user.id, req.body || {});
  if (out.error) return bad(res, out.error, out.code || 400);
  res.json(out);
});
r.post('/attempts/:id/submit', async (req, res) => {
  const out = await EX.submit(int(req.params.id), req.user.id, 'submitted');
  if (out.error) return bad(res, out.error, out.code || 400);
  res.json(await EX.attemptState(int(req.params.id), req.user.id));
});
r.post('/attempts/:id/abandon', async (req, res) => {
  const ch = await db.run("UPDATE exam_attempts SET status='abandoned', submitted_at=datetime('now') WHERE id=? AND user_id=? AND status='in_progress'", req.params.id, req.user.id);
  res.json({ ok: ch.changes > 0 });
});

/* ---------------- Tiến độ ---------------- */
r.get('/progress', async (req, res) => res.json(await S.dashboard(req.user.id)));

module.exports = r;
