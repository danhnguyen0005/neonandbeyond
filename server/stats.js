// Tổng hợp số liệu: lộ trình, trung tâm luyện tập, ôn tập, dashboard người học, báo cáo quản trị.
// Mọi chỉ số tính từ dữ liệu đã lưu — không có số liệu giả.
const { db, J, nowIso, today } = require('./db');
const E = require('./engine');

const GRP_ORDER = ['hangul', 'vocab', 'grammar', 'listening', 'reading', 'writing'];
const GRP_LABEL = { hangul: 'Hangul · Bảng chữ cái', vocab: 'Từ vựng', grammar: 'Ngữ pháp', listening: 'Luyện nghe', reading: 'Luyện đọc', writing: 'Luyện viết' };
const TAG_LABEL = { vocab: 'Từ vựng', grammar: 'Ngữ pháp', particle: 'Tiểu từ', conjugation: 'Chia động từ', spelling: 'Chính tả', reading: 'Đọc hiểu', listening: 'Nghe hiểu', writing: 'Viết câu', word_order: 'Trật tự câu' };
const iso = (s) => (s ? s.replace(' ', 'T') + 'Z' : null);

function topicsWithStatus(uid, where = '', args = []) {
  return db.prepare(`SELECT t.*, l.name level_name, l.code level_code, l.sort lsort FROM topics t JOIN levels l ON l.id=t.level_id
    WHERE t.archived=0 AND l.archived=0 ${where} ORDER BY l.sort, t.sort`).all(...args)
    .map((t) => {
      const s = E.topicStatus(uid, t);
      return { id: t.id, code: t.code, name: t.name, description: t.description, grp: t.grp, level_id: t.level_id, level_name: t.level_name, source: t.source,
        status: s.status, status_label: s.status_label, completion: s.completion, mastery: s.mastery.level, mastery_label: s.mastery.label,
        accuracy: s.mastery.recent_accuracy, answered: s.mastery.answered, due_mistakes: s.due_mistakes, due_vocab: s.due_vocab,
        total_questions: s.total_questions, completed_at: iso(s.completed_at), last_practiced_at: iso(s.last_practiced_at) };
    });
}

function overview(uid) {
  const topics = topicsWithStatus(uid);
  const levels = db.prepare('SELECT * FROM levels WHERE archived=0 ORDER BY sort').all().map((l) => {
    const ts = topics.filter((t) => t.level_id === l.id);
    const completed = ts.filter((t) => t.completed_at).length;
    const mastered = ts.filter((t) => t.mastery === 'mastered').length;
    return { id: l.id, code: l.code, name: l.name, description: l.description, goal: l.goal, total: ts.length, completed, mastered,
      progress: ts.length ? Math.round((completed / ts.length) * 100) : 0, mastery_rate: ts.length ? Math.round((mastered / ts.length) * 100) : 0, topics: ts };
  });
  const next = topics.find((t) => t.status === 'in_progress') || topics.find((t) => t.status === 'not_started') || topics.find((t) => t.status === 'needs_review') || null;
  const review = topics.filter((t) => t.status === 'needs_review' || t.due_mistakes > 0).slice(0, 8);
  const dueVocab = db.prepare("SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND due_at<=datetime('now')").get(uid).n;
  const dueMist = db.prepare("SELECT COUNT(*) n FROM mistakes WHERE user_id=? AND (state='open' OR (state IN ('understood','fixing') AND next_check_at<=datetime('now')))").get(uid).n;
  const active = db.prepare(`SELECT s.id,s.kind,s.topic_id,t.name topic_name,s.cursor,json_array_length(s.items) total FROM practice_sessions s
    LEFT JOIN topics t ON t.id=s.topic_id WHERE s.user_id=? AND s.status='active' ORDER BY s.updated_at DESC LIMIT 3`).all(uid);
  const todayAns = (db.prepare('SELECT answers FROM activity_days WHERE user_id=? AND day=?').get(uid, today()) || { answers: 0 }).answers;
  const goal = db.prepare('SELECT daily_goal FROM users WHERE id=?').get(uid).daily_goal;
  return { levels, next, review, due_vocab: dueVocab, due_mistakes: dueMist, active_sessions: active, today: { answers: todayAns, goal } };
}

function practiceCenter(uid) {
  const topics = topicsWithStatus(uid);
  return { groups: GRP_ORDER.map((g) => ({ grp: g, label: GRP_LABEL[g], topics: topics.filter((t) => t.grp === g) })).filter((g) => g.topics.length) };
}

function sessionSummary(sess, items) {
  const rows = items.map((it) => {
    const q = db.prepare('SELECT q.id,q.prompt,q.error_tag,t.name topic FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.id=?').get(it.q);
    return { qid: it.q, prompt: q ? q.prompt : '', topic: q ? q.topic : '', error_tag: q ? q.error_tag : '', correct: it.r ? it.r.correct : null };
  });
  const answered = rows.filter((r) => r.correct != null);
  const acc = answered.length ? answered.filter((r) => r.correct).length / answered.length : 0;
  const dur = sess.ended_at ? Math.round((new Date(iso(sess.ended_at)) - new Date(iso(sess.started_at))) / 1000) : null;
  let mastery = null;
  if (sess.topic_id) { const m = E.computeMastery(sess.user_id, sess.topic_id); mastery = { level: m.level, label: m.label, accuracy: m.recent_accuracy, sessions_ok: m.sessions_ok, rules: m.rules }; }
  const advice = acc >= 0.85 ? 'Rất tốt. Bạn có thể chuyển sang chủ đề tiếp theo hoặc luyện thêm một phiên để củng cố.'
    : acc >= 0.6 ? 'Khá ổn. Hãy xem lại các câu sai và luyện thêm một phiên.' : 'Hãy mở lại phần “Kiến thức cần nhớ” trước khi luyện tiếp.';
  return { rows, accuracy: acc, duration_sec: dur, mastery, advice, wrong_ids: rows.filter((r) => r.correct === false).map((r) => r.qid) };
}

function finishSession(uid, sess) {
  if (sess.topic_id && sess.kind === 'topic') {
    db.prepare(`INSERT INTO topic_progress(user_id,topic_id,completed_at,sessions_count) VALUES (?,?,datetime('now'),1)
      ON CONFLICT(user_id,topic_id) DO UPDATE SET sessions_count=sessions_count+1, completed_at=COALESCE(completed_at, datetime('now'))`).run(uid, sess.topic_id);
  } else if (sess.topic_id) {
    db.prepare('UPDATE topic_progress SET sessions_count=sessions_count+1 WHERE user_id=? AND topic_id=?').run(uid, sess.topic_id);
  }
  awardAchievements(uid);
}

const ACH = {
  first_session: 'Hoàn thành phiên luyện tập đầu tiên',
  first_topic: 'Hoàn thành chủ đề đầu tiên',
  vocab_50: 'Ghi nhớ tốt 50 từ vựng',
  streak_3: 'Học 3 ngày liên tiếp',
  first_mastery: 'Thành thạo một chủ đề',
  exam_pass: 'Đạt yêu cầu một đề thi thử',
};
function awardAchievements(uid) {
  const give = (c) => db.prepare('INSERT OR IGNORE INTO achievements(user_id,code) VALUES (?,?)').run(uid, c);
  if (db.prepare("SELECT 1 FROM practice_sessions WHERE user_id=? AND status='completed' LIMIT 1").get(uid)) give('first_session');
  if (db.prepare('SELECT 1 FROM topic_progress WHERE user_id=? AND completed_at IS NOT NULL LIMIT 1').get(uid)) give('first_topic');
  if (db.prepare("SELECT 1 FROM topic_progress WHERE user_id=? AND mastery='mastered' LIMIT 1").get(uid)) give('first_mastery');
  if (db.prepare('SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND box>=?').get(uid, E.getSettings().srs_good_box).n >= 50) give('vocab_50');
  if (streak(uid) >= 3) give('streak_3');
  if (db.prepare(`SELECT 1 FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE a.user_id=? AND a.status IN ('submitted','auto_submitted') AND e.pass_score IS NOT NULL AND a.score>=e.pass_score LIMIT 1`).get(uid)) give('exam_pass');
}

function streak(uid) {
  const days = new Set(db.prepare('SELECT day FROM activity_days WHERE user_id=? AND (answers>0 OR seconds>=60)').all(uid).map((d) => d.day));
  let n = 0; const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1); // hôm nay chưa học thì tính đến hôm qua
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

function learnedTopicIds(uid) {
  return db.prepare(`SELECT topic_id FROM topic_progress WHERE user_id=? AND (theory_viewed_at IS NOT NULL OR last_practiced_at IS NOT NULL)`).all(uid).map((x) => x.topic_id);
}
function vocabBucket(uid, bucket, topicId) {
  const good = E.getSettings().srs_good_box;
  const base = `SELECT v.id,v.ko,v.vi,v.topic_id,t.name topic,s.box,s.due_at,s.lapses,s.reps FROM vocabulary v JOIN topics t ON t.id=v.topic_id
    LEFT JOIN srs_records s ON s.vocab_id=v.id AND s.user_id=? WHERE v.archived=0 AND t.archived=0`;
  const tf = topicId ? ` AND v.topic_id=${Number(topicId)}` : '';
  const learned = learnedTopicIds(uid);
  const inLearned = learned.length ? ` AND v.topic_id IN (${learned.join(',')})` : ' AND 0';
  switch (bucket) {
    case 'new': return db.prepare(`${base} AND s.vocab_id IS NULL ${topicId ? tf : inLearned} ORDER BY v.id`).all(uid);
    case 'weak': return db.prepare(`${base} AND s.box<=1 ${tf} ORDER BY s.lapses DESC, s.updated_at DESC`).all(uid);
    case 'due': return db.prepare(`${base} AND s.due_at<=datetime('now') AND s.box<? ${tf} ORDER BY s.due_at`).all(uid, good);
    case 'often_wrong': return db.prepare(`${base} AND s.lapses>=2 ${tf} ORDER BY s.lapses DESC`).all(uid);
    case 'check': return db.prepare(`${base} AND s.box>=? AND s.due_at<=datetime('now') ${tf} ORDER BY s.due_at`).all(uid, good);
    case 'topic': return db.prepare(`${base} ${tf} ORDER BY v.id`).all(uid);
    default: return db.prepare(`${base} AND s.due_at<=datetime('now') ${tf} ORDER BY s.due_at`).all(uid);
  }
}

const PAIRS = [
  { a: '은/는', b: '이/가', code: 'G-TOPIC', note: 'Chủ đề – đối chiếu ↔ chủ ngữ – thông tin mới' },
  { a: '에', b: '에서', code: 'G-LOC', note: 'Nơi tồn tại / nơi đến / thời gian ↔ nơi diễn ra hành động' },
  { a: '-ㅂ/습니다', b: '-아/어요', code: 'G-POLITE', also: 'G-FORMAL', note: 'Trang trọng ↔ thân mật lịch sự' },
  { a: '안 / -지 않다', b: '이/가 아니다', code: 'G-NEG', note: 'Phủ định động từ, tính từ ↔ phủ định danh từ' },
  { a: '-(으)세요', b: '-(으)ㅂ시다', code: 'G-WANT', note: 'Bảo người nghe làm ↔ rủ cùng làm' },
  { a: '-아/어도 되다', b: '-(으)면 안 되다', code: 'G-MUST', note: 'Cho phép ↔ cấm đoán' },
];
const MSTATE = { open: 'Chưa sửa', understood: 'Đã hiểu – chờ kiểm tra lại', fixing: 'Đang sửa – chờ kiểm tra lại', resolved: 'Đã khắc phục' };

function reviewCenter(uid, q) {
  const buckets = ['new', 'due', 'weak', 'often_wrong', 'check'].map((b) => { const list = vocabBucket(uid, b); return { bucket: b, count: list.length, sample: list.slice(0, 8) }; });
  const learned = learnedTopicIds(uid);
  const grammarTopics = db.prepare("SELECT * FROM topics WHERE grp='grammar' AND archived=0 ORDER BY sort").all();
  const weakGrammar = grammarTopics.filter((t) => learned.includes(t.id)).map((t) => ({ t, m: E.computeMastery(uid, t.id) }))
    .filter((x) => x.m.answered >= 3 && ['needs_practice', 'familiarizing'].includes(x.m.level))
    .map((x) => ({ id: x.t.id, name: x.t.name, label: x.m.label, accuracy: x.m.recent_accuracy, answered: x.m.answered }));
  const pairs = PAIRS.map((p) => {
    const t = db.prepare('SELECT id,name FROM topics WHERE code=?').get(p.code);
    if (!t) return null;
    const m = E.computeMastery(uid, t.id);
    return { ...p, topic_id: t.id, topic_name: t.name, accuracy: m.recent_accuracy, answered: m.answered, learned: learned.includes(t.id) };
  }).filter(Boolean);
  const tagStats = db.prepare(`SELECT error_tag, COUNT(*) n, SUM(is_correct=0) wrong FROM user_answers WHERE user_id=? AND answered_at>=datetime('now','-30 days') GROUP BY error_tag`).all(uid)
    .map((r) => ({ ...r, label: TAG_LABEL[r.error_tag] || r.error_tag }));
  // Câu sai
  const w = ['mi.user_id=?'], a = [uid];
  const state = q.state || 'due';
  if (state === 'due') w.push("(mi.state='open' OR (mi.state IN ('understood','fixing') AND mi.next_check_at<=datetime('now')))");
  else if (state === 'tracking') w.push("mi.state!='resolved'");
  else if (state === 'resolved') w.push("mi.state='resolved'");
  if (q.topic_id) { w.push('q.topic_id=?'); a.push(Number(q.topic_id)); }
  if (q.days) { w.push("mi.last_wrong_at>=datetime('now', ?)"); a.push(`-${Number(q.days)} days`); }
  const mistakes = db.prepare(`SELECT mi.*, q.prompt, q.type, q.error_tag, t.name topic, t.id topic_id FROM mistakes mi JOIN questions q ON q.id=mi.question_id JOIN topics t ON t.id=q.topic_id
    WHERE ${w.join(' AND ')} ORDER BY mi.last_wrong_at DESC LIMIT 100`).all(...a)
    .map((m) => ({ qid: m.question_id, prompt: m.prompt, type: m.type, topic: m.topic, topic_id: m.topic_id, error_tag: m.error_tag, tag_label: TAG_LABEL[m.error_tag],
      wrong_count: m.wrong_count, right_after: m.right_after, state: m.state, state_label: MSTATE[m.state], last_wrong_at: iso(m.last_wrong_at), next_check_at: iso(m.next_check_at),
      due: m.state === 'open' || m.next_check_at <= nowIso() }));
  const counts = db.prepare(`SELECT SUM(state='open' OR (state IN ('understood','fixing') AND next_check_at<=datetime('now'))) due,
    SUM(state!='resolved') tracking, SUM(state='resolved') resolved FROM mistakes WHERE user_id=?`).get(uid);
  const topics = db.prepare('SELECT id,name,grp FROM topics WHERE archived=0 ORDER BY sort').all();
  return { vocab: buckets, grammar: { weak: weakGrammar, pairs, tags: tagStats }, mistakes, mistake_counts: counts, topics, learned_count: learned.length,
    levels: db.prepare('SELECT id,name FROM levels WHERE archived=0 ORDER BY sort').all() };
}

function dashboard(uid) {
  const S = E.getSettings();
  const topics = topicsWithStatus(uid);
  const completed = topics.filter((t) => t.completed_at).length;
  const vocabTotal = db.prepare('SELECT COUNT(*) n FROM vocabulary WHERE archived=0').get().n;
  const learned = db.prepare('SELECT COUNT(*) n FROM srs_records WHERE user_id=?').get(uid).n;
  const good = db.prepare('SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND box>=?').get(uid, S.srs_good_box).n;
  const ans = db.prepare('SELECT COUNT(*) n, COALESCE(SUM(is_correct),0) c, SUM(mode=\'practice\') p, SUM(mode=\'exam\') e FROM user_answers WHERE user_id=?').get(uid);
  const time = db.prepare('SELECT COALESCE(SUM(seconds),0) s FROM activity_days WHERE user_id=?').get(uid).s;
  const todayRow = db.prepare('SELECT answers, seconds FROM activity_days WHERE user_id=? AND day=?').get(uid, today()) || { answers: 0, seconds: 0 };
  const goal = db.prepare('SELECT daily_goal FROM users WHERE id=?').get(uid).daily_goal;
  const examAvg = db.prepare("SELECT AVG(score) s, COUNT(*) n FROM exam_attempts WHERE user_id=? AND status IN ('submitted','auto_submitted')").get(uid);
  const levelNow = (topics.find((t) => !t.completed_at) || topics[topics.length - 1] || {}).level_name || '';
  const errors = db.prepare('SELECT error_tag, COUNT(*) n FROM user_answers WHERE user_id=? AND is_correct=0 GROUP BY error_tag ORDER BY n DESC').all(uid)
    .map((r) => ({ ...r, label: TAG_LABEL[r.error_tag] || r.error_tag }));
  const sessions = db.prepare(`SELECT s.id,s.kind,s.status,s.answered,s.correct,json_array_length(s.items) total,s.started_at,s.ended_at,t.name topic FROM practice_sessions s
    LEFT JOIN topics t ON t.id=s.topic_id WHERE s.user_id=? AND s.answered>0 ORDER BY s.id DESC LIMIT 15`).all(uid)
    .map((s) => ({ ...s, started_at: iso(s.started_at), ended_at: iso(s.ended_at), duration_sec: s.ended_at ? Math.round((new Date(iso(s.ended_at)) - new Date(iso(s.started_at))) / 1000) : null }));
  const attempts = db.prepare(`SELECT a.id,a.exam_id,e.title,a.status,a.score,a.correct,a.total,a.started_at,a.submitted_at,e.pass_score FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id
    WHERE a.user_id=? AND a.status!='in_progress' ORDER BY a.id DESC LIMIT 15`).all(uid)
    .map((a) => {
      const prev = db.prepare("SELECT score FROM exam_attempts WHERE user_id=? AND exam_id=? AND id<? AND status IN ('submitted','auto_submitted') ORDER BY id DESC LIMIT 1").get(uid, a.exam_id, a.id);
      return { ...a, started_at: iso(a.started_at), submitted_at: iso(a.submitted_at), duration_sec: a.submitted_at ? Math.round((new Date(iso(a.submitted_at)) - new Date(iso(a.started_at))) / 1000) : null,
        delta: prev && a.score != null ? Math.round((a.score - prev.score) * 10) / 10 : null };
    });
  const weekly = db.prepare(`SELECT strftime('%Y-%W', answered_at) wk, MIN(date(answered_at)) day, COUNT(*) n, AVG(is_correct) acc FROM user_answers WHERE user_id=?
    AND answered_at>=datetime('now','-56 days') GROUP BY wk ORDER BY wk`).all(uid);
  const practiced = topics.filter((t) => t.answered >= 5);
  const strong = practiced.filter((t) => t.accuracy >= 0.8).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);
  const weak = practiced.filter((t) => t.accuracy < 0.7).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
  const common = db.prepare(`SELECT mi.question_id qid, mi.wrong_count, q.prompt, t.name topic, mi.state FROM mistakes mi JOIN questions q ON q.id=mi.question_id JOIN topics t ON t.id=q.topic_id
    WHERE mi.user_id=? ORDER BY mi.wrong_count DESC, mi.last_wrong_at DESC LIMIT 6`).all(uid);
  const lessonsDone = db.prepare(`SELECT t.name, p.completed_at FROM topic_progress p JOIN topics t ON t.id=p.topic_id WHERE p.user_id=? AND p.completed_at IS NOT NULL ORDER BY p.completed_at DESC LIMIT 15`).all(uid)
    .map((r) => ({ ...r, completed_at: iso(r.completed_at) }));
  const writings = db.prepare(`SELECT w.id,w.text,w.auto_score,w.created_at,q.prompt,(SELECT comment FROM writing_feedback f WHERE f.submission_id=w.id ORDER BY f.id DESC LIMIT 1) feedback
    FROM writing_submissions w JOIN questions q ON q.id=w.question_id WHERE w.user_id=? ORDER BY w.id DESC LIMIT 5`).all(uid).map((w) => ({ ...w, created_at: iso(w.created_at) }));
  const ach = db.prepare('SELECT code, earned_at FROM achievements WHERE user_id=? ORDER BY earned_at').all(uid).map((a) => ({ ...a, label: ACH[a.code] || a.code, earned_at: iso(a.earned_at) }));
  const dueVocab = db.prepare("SELECT COUNT(*) n FROM srs_records WHERE user_id=? AND due_at<=datetime('now')").get(uid).n;
  const dueMist = db.prepare("SELECT COUNT(*) n FROM mistakes WHERE user_id=? AND (state='open' OR (state IN ('understood','fixing') AND next_check_at<=datetime('now')))").get(uid).n;
  return {
    empty: ans.n === 0 && learned === 0,
    summary: { level: levelNow, topics_total: topics.length, topics_completed: completed, topics_mastered: topics.filter((t) => t.mastery === 'mastered').length,
      vocab_total: vocabTotal, vocab_learned: learned, vocab_good: good, retention: learned ? good / learned : null,
      answers: ans.n, accuracy: ans.n ? ans.c / ans.n : null, practice_answers: ans.p || 0, exam_answers: ans.e || 0,
      time_sec: time, today_sec: todayRow.seconds, streak: streak(uid), today_answers: todayRow.answers, daily_goal: goal,
      exam_avg: examAvg.n ? examAvg.s : null, exam_count: examAvg.n },
    map: topics.map((t) => ({ id: t.id, name: t.name, grp: t.grp, level_name: t.level_name, status: t.status, status_label: t.status_label, mastery: t.mastery, mastery_label: t.mastery_label, completion: t.completion, accuracy: t.accuracy })),
    errors, sessions, attempts, weekly, strong, weak, common, lessons_done: lessonsDone, writings, achievements: ach,
    next_review: { due_vocab: dueVocab, due_mistakes: dueMist, topics: topics.filter((t) => t.status === 'needs_review').map((t) => ({ id: t.id, name: t.name })) },
  };
}

/* ------------------------------ Quản trị ------------------------------ */
function rangeArgs(q) {
  const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || '') ? q.to : today();
  const fromDef = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') ? q.from : fromDef;
  return { from, to, fromTs: from + ' 00:00:00', toTs: to + ' 23:59:59' };
}
function adminReport(q) {
  const { from, to, fromTs, toTs } = rangeArgs(q);
  const levelId = Number(q.level_id) || null, topicId = Number(q.topic_id) || null, examId = Number(q.exam_id) || null;
  const topicFilter = topicId ? ` AND a.topic_id=${topicId}` : levelId ? ` AND a.topic_id IN (SELECT id FROM topics WHERE level_id=${levelId})` : '';
  const learners = "SELECT id FROM users WHERE role='learner'";
  const accounts = db.prepare("SELECT COUNT(*) n, SUM(status='locked') locked FROM users WHERE role='learner'").get();
  const registered = db.prepare(`SELECT COUNT(*) n FROM users WHERE role='learner' AND created_at BETWEEN ? AND ?`).get(fromTs, toTs).n;
  const visited = db.prepare(`SELECT COUNT(DISTINCT user_id) n FROM login_events WHERE at BETWEEN ? AND ? AND user_id IN (${learners})`).get(fromTs, toTs).n;
  const activeL = db.prepare(`SELECT COUNT(DISTINCT user_id) n FROM user_answers a WHERE answered_at BETWEEN ? AND ? AND user_id IN (${learners}) ${topicFilter}`).get(fromTs, toTs).n;
  const activeSince = (days) => db.prepare(`SELECT COUNT(DISTINCT user_id) n FROM activity_days WHERE day > date(?, ?) AND day <= ? AND (answers>0 OR seconds>=60) AND user_id IN (${learners})`).get(to, `-${days} days`, to).n;
  const sessions = db.prepare(`SELECT COUNT(*) n, SUM(status='completed') done FROM practice_sessions WHERE started_at BETWEEN ? AND ? AND user_id IN (${learners})` + (topicId ? ` AND topic_id=${topicId}` : '')).get(fromTs, toTs);
  const answers = db.prepare(`SELECT COUNT(*) n, AVG(is_correct) acc FROM user_answers a WHERE answered_at BETWEEN ? AND ? AND user_id IN (${learners}) ${topicFilter}`).get(fromTs, toTs);
  const examWhere = `a.status IN ('submitted','auto_submitted') AND a.submitted_at BETWEEN ? AND ? AND a.user_id IN (${learners})` + (examId ? ` AND a.exam_id=${examId}` : '') + (levelId ? ` AND e.level_id=${levelId}` : '');
  const exams = db.prepare(`SELECT e.id, e.title, e.kind, COUNT(a.id) attempts, COUNT(DISTINCT a.user_id) users, AVG(a.score) avg, MIN(a.score) min, MAX(a.score) max,
      e.pass_score, SUM(CASE WHEN e.pass_score IS NOT NULL AND a.score>=e.pass_score THEN 1 ELSE 0 END) passed
    FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE ${examWhere} GROUP BY e.id ORDER BY attempts DESC`).all(fromTs, toTs);
  const attemptsTotal = exams.reduce((s, e) => s + e.attempts, 0);
  const passTotal = exams.filter((e) => e.pass_score != null).reduce((s, e) => s + e.passed, 0);
  const passBase = exams.filter((e) => e.pass_score != null).reduce((s, e) => s + e.attempts, 0);
  const dist = Array(10).fill(0);
  db.prepare(`SELECT a.score FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE ${examWhere}`).all(fromTs, toTs).forEach((r) => { dist[Math.min(9, Math.floor((r.score || 0) / 10))]++; });
  const started = db.prepare(`SELECT COUNT(*) n, SUM(completed_at IS NOT NULL) done FROM topic_progress p WHERE user_id IN (${learners})` + (topicId ? ` AND topic_id=${topicId}` : levelId ? ` AND topic_id IN (SELECT id FROM topics WHERE level_id=${levelId})` : '')).get();
  const topicRows = db.prepare(`SELECT t.id, t.name, t.grp, l.name level, COUNT(a.id) answers, COUNT(DISTINCT a.user_id) users, AVG(a.is_correct) acc,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.topic_id=t.id AND p.mastery='mastered' AND p.user_id IN (${learners})) mastered,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.topic_id=t.id AND p.user_id IN (${learners}) AND p.mastery!='unassessed') practiced,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.topic_id=t.id AND p.completed_at IS NOT NULL AND p.user_id IN (${learners})) completed
    FROM topics t JOIN levels l ON l.id=t.level_id LEFT JOIN user_answers a ON a.topic_id=t.id AND a.answered_at BETWEEN ? AND ? AND a.user_id IN (${learners})
    WHERE t.archived=0 ${topicId ? `AND t.id=${topicId}` : ''} ${levelId ? `AND t.level_id=${levelId}` : ''} GROUP BY t.id ORDER BY t.sort`).all(fromTs, toTs)
    .map((r) => ({ ...r, wrong_rate: r.answers ? 1 - r.acc : null, mastery_rate: r.practiced ? r.mastered / r.practiced : null }));
  const daily = db.prepare(`SELECT day, COUNT(DISTINCT user_id) users, SUM(answers) answers FROM activity_days WHERE day BETWEEN ? AND ? AND (answers>0 OR seconds>=60) AND user_id IN (${learners}) GROUP BY day ORDER BY day`).all(from, to);
  const weekly = db.prepare(`SELECT strftime('%Y-%W', answered_at) wk, MIN(date(answered_at)) day, COUNT(*) n, AVG(is_correct) acc, COUNT(DISTINCT user_id) users FROM user_answers a
    WHERE answered_at BETWEEN ? AND ? AND user_id IN (${learners}) ${topicFilter} GROUP BY wk ORDER BY wk`).all(fromTs, toTs);
  const weeklyExam = db.prepare(`SELECT strftime('%Y-%W', a.submitted_at) wk, AVG(a.score) avg, COUNT(*) n FROM exam_attempts a JOIN mock_exams e ON e.id=a.exam_id WHERE ${examWhere} GROUP BY wk`).all(fromTs, toTs);
  const wkMap = new Map(weeklyExam.map((w) => [w.wk, w]));
  return {
    range: { from, to }, filters: { level_id: levelId, topic_id: topicId, exam_id: examId },
    users: { accounts: accounts.n, locked: accounts.locked || 0, registered_in_range: registered, visited, active_learners: activeL, dau: activeSince(1), wau: activeSince(7), mau: activeSince(30) },
    activity: { sessions: sessions.n, sessions_completed: sessions.done || 0, answers: answers.n, accuracy: answers.acc, attempts: attemptsTotal,
      lesson_completion_rate: started.n ? started.done / started.n : null, pass_rate: passBase ? passTotal / passBase : null },
    exams, score_distribution: dist, topics: topicRows,
    most_practiced: topicRows.filter((t) => t.answers > 0).sort((a, b) => b.answers - a.answers).slice(0, 5),
    hardest: topicRows.filter((t) => t.answers >= 10).sort((a, b) => b.wrong_rate - a.wrong_rate).slice(0, 5),
    daily, weekly: weekly.map((w) => ({ ...w, exam_avg: wkMap.get(w.wk) ? wkMap.get(w.wk).avg : null })),
  };
}

function userDetail(id) {
  const u = db.prepare('SELECT id,username,display_name,role,status,created_at,last_login_at,daily_goal FROM users WHERE id=?').get(id);
  if (!u) return null;
  const d = dashboard(id);
  return { user: { ...u, created_at: iso(u.created_at), last_login_at: iso(u.last_login_at) }, summary: d.summary, map: d.map, attempts: d.attempts, sessions: d.sessions, weak: d.weak, errors: d.errors, writings: d.writings };
}

module.exports = { overview, practiceCenter, sessionSummary, finishSession, reviewCenter, vocabBucket, dashboard, adminReport, userDetail, streak, TAG_LABEL, GRP_LABEL, awardAchievements };
