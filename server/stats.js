// Tổng hợp số liệu: lộ trình, trung tâm luyện tập, ôn tập, dashboard người học, báo cáo quản trị.
// Mọi chỉ số tính từ dữ liệu đã lưu — không có số liệu giả.
const { db, J, nowIso, today, qs } = require('./db');
const E = require('./engine');

const GRP_ORDER = ['hangul', 'vocab', 'grammar', 'listening', 'reading', 'writing'];
const GRP_LABEL = { hangul: 'Hangul · Bảng chữ cái', vocab: 'Từ vựng', grammar: 'Ngữ pháp', listening: 'Luyện nghe', reading: 'Luyện đọc', writing: 'Luyện viết' };
const TAG_LABEL = { vocab: 'Từ vựng', grammar: 'Ngữ pháp', particle: 'Tiểu từ', conjugation: 'Chia động từ', spelling: 'Chính tả', reading: 'Đọc hiểu', listening: 'Nghe hiểu', writing: 'Viết câu', word_order: 'Trật tự câu' };
const iso = (s) => (s ? s.replace(' ', 'T') + 'Z' : null);
const DUE_MIST = "(state='open' OR (state IN ('understood','fixing') AND next_check_at<=datetime('now')))";

async function topicsWithStatus(uid) {
  const topics = await db.all(`SELECT t.*, l.name level_name, l.code level_code FROM topics t JOIN levels l ON l.id=t.level_id
    WHERE t.archived=0 AND l.archived=0 ORDER BY l.sort, t.sort`);
  const st = await E.topicStatusMany(uid, topics);
  return topics.map((t) => {
    const s = st.get(t.id);
    return { id: t.id, code: t.code, name: t.name, description: t.description, grp: t.grp, level_id: t.level_id, level_name: t.level_name, source: t.source, unit: t.unit,
      status: s.status, status_label: s.status_label, completion: s.completion, mastery: s.mastery.level, mastery_label: s.mastery.label,
      accuracy: s.mastery.recent_accuracy, answered: s.mastery.answered, due_mistakes: s.due_mistakes, due_vocab: s.due_vocab,
      total_questions: s.total_questions, completed_at: iso(s.completed_at), last_practiced_at: iso(s.last_practiced_at) };
  });
}

async function overview(uid) {
  const [topics, levelsRaw, dueV, dueM, active, todayRow, user] = await Promise.all([
    topicsWithStatus(uid),
    db.all('SELECT * FROM levels WHERE archived=0 ORDER BY sort'),
    db.get("SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND due_at<=datetime('now')", uid),
    db.get(`SELECT COUNT(*) n FROM mistakes WHERE user_id=? AND ${DUE_MIST}`, uid),
    db.all(`SELECT s.id,s.kind,s.topic_id,t.name topic_name,s.cursor,json_array_length(s.items) total FROM practice_sessions s
      LEFT JOIN topics t ON t.id=s.topic_id WHERE s.user_id=? AND s.status='active' ORDER BY s.updated_at DESC LIMIT 3`, uid),
    db.get('SELECT answers FROM activity_days WHERE user_id=? AND day=?', uid, today()),
    db.get('SELECT daily_goal FROM users WHERE id=?', uid),
  ]);
  const levels = levelsRaw.map((l) => {
    const ts = topics.filter((t) => t.level_id === l.id);
    const completed = ts.filter((t) => t.completed_at).length, mastered = ts.filter((t) => t.mastery === 'mastered').length;
    return { id: l.id, code: l.code, name: l.name, description: l.description, goal: l.goal, total: ts.length, completed, mastered,
      progress: ts.length ? Math.round((completed / ts.length) * 100) : 0, mastery_rate: ts.length ? Math.round((mastered / ts.length) * 100) : 0, topics: ts };
  });
  const next = topics.find((t) => t.status === 'in_progress') || topics.find((t) => t.status === 'not_started') || topics.find((t) => t.status === 'needs_review') || null;
  return { levels, next, review: topics.filter((t) => t.status === 'needs_review' || t.due_mistakes > 0).slice(0, 8), due_vocab: dueV.n, due_mistakes: dueM.n,
    active_sessions: active, today: { answers: todayRow ? todayRow.answers : 0, goal: user.daily_goal } };
}

async function practiceCenter(uid) {
  const topics = await topicsWithStatus(uid);
  return { groups: GRP_ORDER.map((g) => ({ grp: g, label: GRP_LABEL[g], topics: topics.filter((t) => t.grp === g) })).filter((g) => g.topics.length) };
}

async function sessionSummary(sess, items) {
  const ids = items.map((i) => i.q);
  const qrows = ids.length ? await db.all(`SELECT q.id,q.prompt,q.error_tag,t.name topic FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.id IN (${qs(ids.length)})`, ...ids) : [];
  const Q = new Map(qrows.map((q) => [q.id, q]));
  const rows = items.map((it) => { const q = Q.get(it.q) || {}; return { qid: it.q, prompt: q.prompt || '', topic: q.topic || '', error_tag: q.error_tag || '', correct: it.r ? it.r.correct : null }; });
  const answered = rows.filter((r) => r.correct != null);
  const acc = answered.length ? answered.filter((r) => r.correct).length / answered.length : 0;
  const dur = sess.ended_at ? Math.round((new Date(iso(sess.ended_at)) - new Date(iso(sess.started_at))) / 1000) : null;
  let mastery = null;
  if (sess.topic_id) { const m = await E.computeMastery(sess.user_id, sess.topic_id); mastery = { level: m.level, label: m.label, accuracy: m.recent_accuracy, sessions_ok: m.sessions_ok, rules: m.rules }; }
  const advice = acc >= 0.85 ? 'Rất tốt. Bạn có thể chuyển sang chủ đề tiếp theo hoặc luyện thêm một phiên để củng cố.'
    : acc >= 0.6 ? 'Khá ổn. Hãy xem lại các câu sai và luyện thêm một phiên.' : 'Hãy mở lại phần “Kiến thức cần nhớ” trước khi luyện tiếp.';
  return { rows, accuracy: acc, duration_sec: dur, mastery, advice, wrong_ids: rows.filter((r) => r.correct === false).map((r) => r.qid) };
}

async function finishSession(uid, sess) {
  if (sess.topic_id && sess.kind === 'topic') {
    await db.run(`INSERT INTO topic_progress(user_id,topic_id,completed_at,sessions_count) VALUES (?,?,datetime('now'),1)
      ON CONFLICT(user_id,topic_id) DO UPDATE SET sessions_count=sessions_count+1, completed_at=COALESCE(completed_at, datetime('now'))`, uid, sess.topic_id);
  } else if (sess.topic_id) {
    await db.run('UPDATE topic_progress SET sessions_count=sessions_count+1 WHERE user_id=? AND topic_id=?', uid, sess.topic_id);
  }
  await awardAchievements(uid);
}

const ACH = { first_session: 'Hoàn thành phiên luyện tập đầu tiên', first_topic: 'Hoàn thành chủ đề đầu tiên', vocab_50: 'Ghi nhớ tốt 50 từ vựng',
  streak_3: 'Học 3 ngày liên tiếp', first_mastery: 'Thành thạo một chủ đề', exam_pass: 'Đạt yêu cầu một đề thi thử' };
async function awardAchievements(uid) {
  const S = await E.getSettings();
  const [a, b, c, d, e, st] = await Promise.all([
    db.get("SELECT 1 x FROM practice_sessions WHERE user_id=? AND status='completed' LIMIT 1", uid),
    db.get('SELECT 1 x FROM topic_progress WHERE user_id=? AND completed_at IS NOT NULL LIMIT 1', uid),
    db.get("SELECT 1 x FROM topic_progress WHERE user_id=? AND mastery='mastered' LIMIT 1", uid),
    db.get('SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND box>=?', uid, S.srs_good_box),
    db.get(`SELECT 1 x FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE a.user_id=? AND a.status IN ('submitted','auto_submitted') AND e.pass_score IS NOT NULL AND a.score>=e.pass_score LIMIT 1`, uid),
    streak(uid),
  ]);
  const codes = [a && 'first_session', b && 'first_topic', c && 'first_mastery', d.n >= 50 && 'vocab_50', st >= 3 && 'streak_3', e && 'exam_pass'].filter(Boolean);
  await db.batch(codes.map((code) => ['INSERT OR IGNORE INTO achievements(user_id,code) VALUES (?,?)', [uid, code]]));
}

async function streak(uid) {
  const days = new Set((await db.all('SELECT day FROM activity_days WHERE user_id=? AND (answers>0 OR seconds>=60)', uid)).map((d) => d.day));
  let n = 0; const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1); // hôm nay chưa học thì tính đến hôm qua
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

async function learnedTopicIds(uid) {
  return (await db.all('SELECT topic_id FROM topic_progress WHERE user_id=? AND (theory_viewed_at IS NOT NULL OR last_practiced_at IS NOT NULL)', uid)).map((x) => x.topic_id);
}
async function vocabBucket(uid, bucket, topicId) {
  const good = (await E.getSettings()).srs_good_box;
  const base = `SELECT v.id,v.ko,v.vi,v.topic_id,t.name topic,s.box,s.due_at,s.lapses,s.reps FROM vocabulary v JOIN topics t ON t.id=v.topic_id
    LEFT JOIN srs_records s ON s.vocab_id=v.id AND s.user_id=? WHERE v.archived=0 AND t.archived=0`;
  const tf = topicId ? ` AND v.topic_id=${Number(topicId)}` : '';
  switch (bucket) {
    case 'new': {
      const learned = await learnedTopicIds(uid);
      const inL = topicId ? tf : learned.length ? ` AND v.topic_id IN (${learned.map(Number).join(',')})` : ' AND 0';
      return db.all(`${base} AND s.vocab_id IS NULL ${inL} ORDER BY v.id`, uid);
    }
    case 'weak': return db.all(`${base} AND s.box<=1 ${tf} ORDER BY s.lapses DESC, s.updated_at DESC`, uid);
    case 'due': return db.all(`${base} AND s.due_at<=datetime('now') AND s.box<? ${tf} ORDER BY s.due_at`, uid, good);
    case 'often_wrong': return db.all(`${base} AND s.lapses>=2 ${tf} ORDER BY s.lapses DESC`, uid);
    case 'check': return db.all(`${base} AND s.box>=? AND s.due_at<=datetime('now') ${tf} ORDER BY s.due_at`, uid, good);
    case 'topic': return db.all(`${base} ${tf} ORDER BY v.id`, uid);
    default: return db.all(`${base} AND s.due_at<=datetime('now') ${tf} ORDER BY s.due_at`, uid);
  }
}

const PAIRS = [
  { a: '은/는', b: '이/가', code: 'G-TOPIC', note: 'Chủ đề – đối chiếu ↔ chủ ngữ – thông tin mới' },
  { a: '에', b: '에서', code: 'G-LOC', note: 'Nơi tồn tại / nơi đến / thời gian ↔ nơi diễn ra hành động' },
  { a: '-ㅂ/습니다', b: '-아/어요', code: 'G-POLITE', note: 'Trang trọng ↔ thân mật lịch sự' },
  { a: '안 / -지 않다', b: '이/가 아니다', code: 'G-NEG', note: 'Phủ định động từ, tính từ ↔ phủ định danh từ' },
  { a: '-(으)세요', b: '-(으)ㅂ시다', code: 'G-WANT', note: 'Bảo người nghe làm ↔ rủ cùng làm' },
  { a: '-아/어도 되다', b: '-(으)면 안 되다', code: 'G-MUST', note: 'Cho phép ↔ cấm đoán' },
];
const MSTATE = { open: 'Chưa sửa', understood: 'Đã hiểu – chờ kiểm tra lại', fixing: 'Đang sửa – chờ kiểm tra lại', resolved: 'Đã khắc phục' };

async function reviewCenter(uid, q) {
  const buckets = await Promise.all(['new', 'due', 'weak', 'often_wrong', 'check'].map(async (b) => { const list = await vocabBucket(uid, b); return { bucket: b, count: list.length, sample: list.slice(0, 8) }; }));
  const learned = await learnedTopicIds(uid);
  const topics = await db.all('SELECT id,name,grp,code FROM topics WHERE archived=0 ORDER BY sort');
  const grammarIds = topics.filter((t) => t.grp === 'grammar').map((t) => t.id);
  const M = await E.masteryMany(uid, grammarIds);
  const weak = topics.filter((t) => t.grp === 'grammar' && learned.includes(t.id)).map((t) => ({ t, m: M.get(t.id) }))
    .filter((x) => x.m && x.m.answered >= 3 && ['needs_practice', 'familiarizing'].includes(x.m.level))
    .map((x) => ({ id: x.t.id, name: x.t.name, label: x.m.label, accuracy: x.m.recent_accuracy, answered: x.m.answered }));
  const pairs = PAIRS.map((p) => {
    const t = topics.find((x) => x.code === p.code); if (!t) return null;
    const m = M.get(t.id) || {};
    return { ...p, topic_id: t.id, topic_name: t.name, accuracy: m.recent_accuracy ?? null, answered: m.answered || 0, learned: learned.includes(t.id) };
  }).filter(Boolean);
  const tags = (await db.all(`SELECT error_tag, COUNT(*) n, SUM(is_correct=0) wrong FROM user_answers WHERE user_id=? AND answered_at>=datetime('now','-30 days') GROUP BY error_tag`, uid))
    .map((r) => ({ ...r, label: TAG_LABEL[r.error_tag] || r.error_tag }));
  const w = ['mi.user_id=?'], a = [uid];
  const state = q.state || 'due';
  if (state === 'due') w.push(DUE_MIST.replace(/state|next_check_at/g, (m0) => 'mi.' + m0));
  else if (state === 'tracking') w.push("mi.state!='resolved'");
  else if (state === 'resolved') w.push("mi.state='resolved'");
  if (q.topic_id) { w.push('q.topic_id=?'); a.push(Number(q.topic_id)); }
  if (q.days) { w.push("mi.last_wrong_at>=datetime('now', ?)"); a.push(`-${Number(q.days)} days`); }
  const now = nowIso();
  const [mrows, counts, levels] = await Promise.all([
    db.all(`SELECT mi.*, q.prompt, q.type, q.error_tag, t.name topic, t.id topic_id FROM mistakes mi JOIN questions q ON q.id=mi.question_id JOIN topics t ON t.id=q.topic_id
      WHERE ${w.join(' AND ')} ORDER BY mi.last_wrong_at DESC LIMIT 100`, ...a),
    db.get(`SELECT SUM(${DUE_MIST}) due, SUM(state!='resolved') tracking, SUM(state='resolved') resolved FROM mistakes WHERE user_id=?`, uid),
    db.all('SELECT id,name FROM levels WHERE archived=0 ORDER BY sort'),
  ]);
  const mistakes = mrows.map((m) => ({ qid: m.question_id, prompt: m.prompt, type: m.type, topic: m.topic, topic_id: m.topic_id, error_tag: m.error_tag, tag_label: TAG_LABEL[m.error_tag],
    wrong_count: m.wrong_count, right_after: m.right_after, state: m.state, state_label: MSTATE[m.state], last_wrong_at: iso(m.last_wrong_at), next_check_at: iso(m.next_check_at),
    due: m.state === 'open' || m.next_check_at <= now }));
  return { vocab: buckets, grammar: { weak, pairs, tags }, mistakes, mistake_counts: counts, topics: topics.map(({ id, name, grp }) => ({ id, name, grp })), learned_count: learned.length, levels };
}

async function dashboard(uid) {
  const S = await E.getSettings();
  const [topics, vocabTotal, learned, good, ans, time, todayRow, user, examAvg, errors, sessions, attempts, weekly, common, lessonsDone, writings, ach, dueV, dueM, st] = await Promise.all([
    topicsWithStatus(uid),
    db.get('SELECT COUNT(*) n FROM vocabulary WHERE archived=0'),
    db.get('SELECT COUNT(*) n FROM srs_records WHERE user_id=?', uid),
    db.get('SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND box>=?', uid, S.srs_good_box),
    db.get("SELECT COUNT(*) n, COALESCE(SUM(is_correct),0) c, SUM(mode='practice') p, SUM(mode='exam') e FROM user_answers WHERE user_id=?", uid),
    db.get('SELECT COALESCE(SUM(seconds),0) s FROM activity_days WHERE user_id=?', uid),
    db.get('SELECT answers, seconds FROM activity_days WHERE user_id=? AND day=?', uid, today()),
    db.get('SELECT daily_goal FROM users WHERE id=?', uid),
    db.get("SELECT AVG(score) s, COUNT(*) n FROM exam_attempts WHERE user_id=? AND status IN ('submitted','auto_submitted')", uid),
    db.all('SELECT error_tag, COUNT(*) n FROM user_answers WHERE user_id=? AND is_correct=0 GROUP BY error_tag ORDER BY n DESC', uid),
    db.all(`SELECT s.id,s.kind,s.status,s.answered,s.correct,json_array_length(s.items) total,s.started_at,s.ended_at,t.name topic FROM practice_sessions s
      LEFT JOIN topics t ON t.id=s.topic_id WHERE s.user_id=? AND s.answered>0 ORDER BY s.id DESC LIMIT 15`, uid),
    db.all(`SELECT a.id,a.exam_id,e.title,a.status,a.score,a.correct,a.total,a.started_at,a.submitted_at,e.pass_score,
      (SELECT p.score FROM exam_attempts p WHERE p.user_id=a.user_id AND p.exam_id=a.exam_id AND p.id<a.id AND p.status IN ('submitted','auto_submitted') ORDER BY p.id DESC LIMIT 1) prev
      FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE a.user_id=? AND a.status!='in_progress' ORDER BY a.id DESC LIMIT 15`, uid),
    db.all(`SELECT strftime('%Y-%W', answered_at) wk, MIN(date(answered_at)) day, COUNT(*) n, AVG(is_correct) acc FROM user_answers WHERE user_id=?
      AND answered_at>=datetime('now','-56 days') GROUP BY wk ORDER BY wk`, uid),
    db.all(`SELECT mi.question_id qid, mi.wrong_count, q.prompt, t.name topic, mi.state FROM mistakes mi JOIN questions q ON q.id=mi.question_id JOIN topics t ON t.id=q.topic_id
      WHERE mi.user_id=? ORDER BY mi.wrong_count DESC, mi.last_wrong_at DESC LIMIT 6`, uid),
    db.all('SELECT t.name, p.completed_at FROM topic_progress p JOIN topics t ON t.id=p.topic_id WHERE p.user_id=? AND p.completed_at IS NOT NULL ORDER BY p.completed_at DESC LIMIT 15', uid),
    db.all(`SELECT w.id,w.text,w.auto_score,w.created_at,q.prompt,(SELECT comment FROM writing_feedback f WHERE f.submission_id=w.id ORDER BY f.id DESC LIMIT 1) feedback
      FROM writing_submissions w JOIN questions q ON q.id=w.question_id WHERE w.user_id=? ORDER BY w.id DESC LIMIT 5`, uid),
    db.all('SELECT code, earned_at FROM achievements WHERE user_id=? ORDER BY earned_at', uid),
    db.get("SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND due_at<=datetime('now')", uid),
    db.get(`SELECT COUNT(*) n FROM mistakes WHERE user_id=? AND ${DUE_MIST}`, uid),
    streak(uid),
  ]);
  const dur = (a, b) => (b ? Math.round((new Date(iso(b)) - new Date(iso(a))) / 1000) : null);
  const practiced = topics.filter((t) => t.answered >= 5);
  return {
    empty: ans.n === 0 && learned.n === 0,
    summary: { level: (topics.find((t) => !t.completed_at) || topics[topics.length - 1] || {}).level_name || '', topics_total: topics.length,
      topics_completed: topics.filter((t) => t.completed_at).length, topics_mastered: topics.filter((t) => t.mastery === 'mastered').length,
      vocab_total: vocabTotal.n, vocab_learned: learned.n, vocab_good: good.n, retention: learned.n ? good.n / learned.n : null,
      answers: ans.n, accuracy: ans.n ? ans.c / ans.n : null, practice_answers: ans.p || 0, exam_answers: ans.e || 0,
      time_sec: time.s, today_sec: todayRow ? todayRow.seconds : 0, streak: st, today_answers: todayRow ? todayRow.answers : 0, daily_goal: user.daily_goal,
      exam_avg: examAvg.n ? examAvg.s : null, exam_count: examAvg.n },
    map: topics.map((t) => ({ id: t.id, name: t.name, grp: t.grp, level_name: t.level_name, status: t.status, status_label: t.status_label, mastery: t.mastery, mastery_label: t.mastery_label, completion: t.completion, accuracy: t.accuracy })),
    errors: errors.map((r) => ({ ...r, label: TAG_LABEL[r.error_tag] || r.error_tag })),
    sessions: sessions.map((s) => ({ ...s, started_at: iso(s.started_at), ended_at: iso(s.ended_at), duration_sec: dur(s.started_at, s.ended_at) })),
    attempts: attempts.map((a) => ({ ...a, started_at: iso(a.started_at), submitted_at: iso(a.submitted_at), duration_sec: dur(a.started_at, a.submitted_at),
      delta: a.prev != null && a.score != null ? Math.round((a.score - a.prev) * 10) / 10 : null })),
    weekly,
    strong: practiced.filter((t) => t.accuracy >= 0.8).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5),
    weak: practiced.filter((t) => t.accuracy < 0.7).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
    common, lessons_done: lessonsDone.map((r) => ({ ...r, completed_at: iso(r.completed_at) })),
    writings: writings.map((w) => ({ ...w, created_at: iso(w.created_at) })),
    achievements: ach.map((a) => ({ ...a, label: ACH[a.code] || a.code, earned_at: iso(a.earned_at) })),
    next_review: { due_vocab: dueV.n, due_mistakes: dueM.n, topics: topics.filter((t) => t.status === 'needs_review').map((t) => ({ id: t.id, name: t.name })) },
  };
}

/* ------------------------------ Quản trị ------------------------------ */
function rangeArgs(q) {
  const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || '') ? q.to : today();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') ? q.from : new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  return { from, to, fromTs: from + ' 00:00:00', toTs: to + ' 23:59:59' };
}
async function adminReport(q) {
  const { from, to, fromTs, toTs } = rangeArgs(q);
  const levelId = Number(q.level_id) || null, topicId = Number(q.topic_id) || null, examId = Number(q.exam_id) || null;
  const topicFilter = topicId ? ` AND a.topic_id=${topicId}` : levelId ? ` AND a.topic_id IN (SELECT id FROM topics WHERE level_id=${levelId})` : '';
  const L = "SELECT id FROM users WHERE role='learner'";
  const examWhere = `a.status IN ('submitted','auto_submitted') AND a.submitted_at BETWEEN ? AND ? AND a.user_id IN (${L})` + (examId ? ` AND a.exam_id=${examId}` : '') + (levelId ? ` AND e.level_id=${levelId}` : '');
  const active = (days) => db.get(`SELECT COUNT(DISTINCT user_id) n FROM activity_days WHERE day > date(?, ?) AND day <= ? AND (answers>0 OR seconds>=60) AND user_id IN (${L})`, to, `-${days} days`, to);
  const [accounts, registered, visited, activeL, dau, wau, mau, sessions, answers, exams, scores, started, topicRows, daily, weekly, weeklyExam] = await Promise.all([
    db.get("SELECT COUNT(*) n, SUM(status='locked') locked FROM users WHERE role='learner'"),
    db.get("SELECT COUNT(*) n FROM users WHERE role='learner' AND created_at BETWEEN ? AND ?", fromTs, toTs),
    db.get(`SELECT COUNT(DISTINCT user_id) n FROM login_events WHERE at BETWEEN ? AND ? AND user_id IN (${L})`, fromTs, toTs),
    db.get(`SELECT COUNT(DISTINCT user_id) n FROM user_answers a WHERE answered_at BETWEEN ? AND ? AND user_id IN (${L}) ${topicFilter}`, fromTs, toTs),
    active(1), active(7), active(30),
    db.get(`SELECT COUNT(*) n, SUM(status='completed') done FROM practice_sessions WHERE started_at BETWEEN ? AND ? AND user_id IN (${L})` + (topicId ? ` AND topic_id=${topicId}` : ''), fromTs, toTs),
    db.get(`SELECT COUNT(*) n, AVG(is_correct) acc FROM user_answers a WHERE answered_at BETWEEN ? AND ? AND user_id IN (${L}) ${topicFilter}`, fromTs, toTs),
    db.all(`SELECT e.id, e.title, e.kind, COUNT(a.id) attempts, COUNT(DISTINCT a.user_id) users, AVG(a.score) avg, MIN(a.score) min, MAX(a.score) max,
      e.pass_score, SUM(CASE WHEN e.pass_score IS NOT NULL AND a.score>=e.pass_score THEN 1 ELSE 0 END) passed
      FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE ${examWhere} GROUP BY e.id ORDER BY attempts DESC`, fromTs, toTs),
    db.all(`SELECT a.score FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE ${examWhere}`, fromTs, toTs),
    db.get(`SELECT COUNT(*) n, SUM(completed_at IS NOT NULL) done FROM topic_progress p WHERE user_id IN (${L})` + (topicId ? ` AND topic_id=${topicId}` : levelId ? ` AND topic_id IN (SELECT id FROM topics WHERE level_id=${levelId})` : '')),
    db.all(`SELECT t.id, t.name, t.grp, l.name level, COUNT(a.id) answers, COUNT(DISTINCT a.user_id) users, AVG(a.is_correct) acc,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.topic_id=t.id AND p.mastery='mastered' AND p.user_id IN (${L})) mastered,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.topic_id=t.id AND p.user_id IN (${L}) AND p.mastery!='unassessed') practiced,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.topic_id=t.id AND p.completed_at IS NOT NULL AND p.user_id IN (${L})) completed
      FROM topics t JOIN levels l ON l.id=t.level_id LEFT JOIN user_answers a ON a.topic_id=t.id AND a.answered_at BETWEEN ? AND ? AND a.user_id IN (${L})
      WHERE t.archived=0 ${topicId ? `AND t.id=${topicId}` : ''} ${levelId ? `AND t.level_id=${levelId}` : ''} GROUP BY t.id ORDER BY t.sort`, fromTs, toTs),
    db.all(`SELECT day, COUNT(DISTINCT user_id) users, SUM(answers) answers FROM activity_days WHERE day BETWEEN ? AND ? AND (answers>0 OR seconds>=60) AND user_id IN (${L}) GROUP BY day ORDER BY day`, from, to),
    db.all(`SELECT strftime('%Y-%W', answered_at) wk, MIN(date(answered_at)) day, COUNT(*) n, AVG(is_correct) acc, COUNT(DISTINCT user_id) users FROM user_answers a
      WHERE answered_at BETWEEN ? AND ? AND user_id IN (${L}) ${topicFilter} GROUP BY wk ORDER BY wk`, fromTs, toTs),
    db.all(`SELECT strftime('%Y-%W', a.submitted_at) wk, AVG(a.score) avg FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE ${examWhere} GROUP BY wk`, fromTs, toTs),
  ]);
  const dist = Array(10).fill(0); scores.forEach((r) => { dist[Math.min(9, Math.floor((r.score || 0) / 10))]++; });
  const attemptsTotal = exams.reduce((s, e) => s + e.attempts, 0);
  const withPass = exams.filter((e) => e.pass_score != null);
  const passBase = withPass.reduce((s, e) => s + e.attempts, 0);
  const tr = topicRows.map((r) => ({ ...r, wrong_rate: r.answers ? 1 - r.acc : null, mastery_rate: r.practiced ? r.mastered / r.practiced : null }));
  const wk = new Map(weeklyExam.map((w) => [w.wk, w.avg]));
  return {
    range: { from, to }, filters: { level_id: levelId, topic_id: topicId, exam_id: examId },
    users: { accounts: accounts.n, locked: accounts.locked || 0, registered_in_range: registered.n, visited: visited.n, active_learners: activeL.n, dau: dau.n, wau: wau.n, mau: mau.n },
    activity: { sessions: sessions.n, sessions_completed: sessions.done || 0, answers: answers.n, accuracy: answers.acc, attempts: attemptsTotal,
      lesson_completion_rate: started.n ? started.done / started.n : null, pass_rate: passBase ? withPass.reduce((s, e) => s + e.passed, 0) / passBase : null },
    exams, score_distribution: dist, topics: tr,
    most_practiced: tr.filter((t) => t.answers > 0).sort((a, b) => b.answers - a.answers).slice(0, 5),
    hardest: tr.filter((t) => t.answers >= 10).sort((a, b) => b.wrong_rate - a.wrong_rate).slice(0, 5),
    daily, weekly: weekly.map((w) => ({ ...w, exam_avg: wk.get(w.wk) ?? null })),
  };
}

async function userDetail(id) {
  const u = await db.get('SELECT id,username,display_name,role,status,created_at,last_login_at,daily_goal FROM users WHERE id=?', id);
  if (!u) return null;
  const d = await dashboard(id);
  return { user: { ...u, created_at: iso(u.created_at), last_login_at: iso(u.last_login_at) }, summary: d.summary, map: d.map, attempts: d.attempts, sessions: d.sessions, weak: d.weak, errors: d.errors, writings: d.writings };
}

module.exports = { overview, practiceCenter, sessionSummary, finishSession, reviewCenter, vocabBucket, dashboard, adminReport, userDetail, streak, TAG_LABEL, GRP_LABEL, awardAchievements, learnedTopicIds };
