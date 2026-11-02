// Thi thử: đề có sẵn, đề tự tạo, lượt thi có hạn giờ (kiểm soát ở server), nộp bài, tự nộp khi hết giờ.
const { db, J, nowIso } = require('./db');
const E = require('./engine');

const EXAM_TYPES = ['mcq', 'listen', 'error', 'order', 'fill', 'conjugate', 'translate'];
const iso = (s) => (s ? s.replace(' ', 'T') + 'Z' : null);
const secsBetween = (a, b) => Math.round((new Date(iso(b)) - new Date(iso(a))) / 1000);

function isOpen(ex) {
  const now = nowIso();
  return ex.status === 'published' && (!ex.open_at || ex.open_at <= now) && (!ex.close_at || ex.close_at > now);
}
function accessibleExam(uid, id) {
  const ex = db.prepare('SELECT * FROM mock_exams WHERE id=?').get(id);
  if (!ex) return null;
  if (ex.kind === 'custom') return ex.owner_id === uid ? ex : null;
  return isOpen(ex) ? ex : null;
}

// Chính sách khi rời trang giữa chừng: lượt thi vẫn "đang làm" và được khôi phục nếu còn giờ;
// hết giờ thì tự nộp với các câu đã lưu. Lượt bị người học huỷ được ghi "abandoned", không tính điểm.
function sweepExpired(uid) {
  const grace = E.getSettings().exam_grace_seconds;
  const rows = db.prepare(`SELECT id,user_id FROM exam_attempts WHERE status='in_progress' AND datetime(deadline_at, '+' || ? || ' seconds') < datetime('now')` + (uid ? ' AND user_id=?' : ''))
    .all(...(uid ? [grace, uid] : [grace]));
  rows.forEach((a) => submit(a.id, a.user_id, 'auto_submitted'));
  return rows.length;
}

function attemptsSummary(uid, examId) {
  return db.prepare(`SELECT id,status,score,correct,total,started_at,submitted_at FROM exam_attempts WHERE user_id=? AND exam_id=? ORDER BY id DESC`).all(uid, examId)
    .map((a) => ({ ...a, started_at: iso(a.started_at), submitted_at: iso(a.submitted_at), duration_sec: a.submitted_at ? secsBetween(a.started_at, a.submitted_at) : null }));
}
function examInfo(uid, ex) {
  const topics = J(ex.matrix, []).map((m) => ({ ...m, name: (db.prepare('SELECT name FROM topics WHERE id=?').get(m.topic_id) || {}).name }));
  const qids = J(ex.question_ids, []);
  const bySkill = qids.length ? db.prepare(`SELECT skill, COUNT(*) n FROM questions WHERE id IN (${qids.map(() => '?').join(',')}) GROUP BY skill`).all(...qids) : [];
  const att = attemptsSummary(uid, ex.id);
  return {
    id: ex.id, title: ex.title, description: ex.description, kind: ex.kind, scope: ex.scope, topics, by_skill: bySkill,
    question_count: qids.length, duration_min: ex.duration_min, pass_score: ex.pass_score, show_answers: !!ex.show_answers,
    open_at: iso(ex.open_at), close_at: iso(ex.close_at), attempts: att,
    in_progress: att.find((a) => a.status === 'in_progress') || null,
    best: att.filter((a) => a.score != null).reduce((m, a) => Math.max(m, a.score), -1),
  };
}
function listForUser(uid) {
  sweepExpired(uid);
  const official = db.prepare("SELECT * FROM mock_exams WHERE kind='official' AND status='published' ORDER BY id").all().filter(isOpen);
  const custom = db.prepare("SELECT * FROM mock_exams WHERE kind='custom' AND owner_id=? ORDER BY id DESC LIMIT 15").all(uid);
  return { official: official.map((e) => examInfo(uid, e)), custom: custom.map((e) => examInfo(uid, e)), limits: poolLimits() };
}
function poolLimits() {
  return db.prepare(`SELECT t.id topic_id, t.name, t.level_id, l.name level_name, t.grp, COUNT(q.id) n,
      SUM(q.difficulty=1) d1, SUM(q.difficulty=2) d2, SUM(q.difficulty=3) d3
    FROM topics t LEFT JOIN questions q ON q.topic_id=t.id AND q.status='published' AND q.verified=1 AND q.archived=0 AND q.type!='write'
    JOIN levels l ON l.id=t.level_id WHERE t.archived=0 AND l.archived=0 GROUP BY t.id ORDER BY l.sort, t.sort`).all();
}

function generateCustom(uid, body) {
  const count = Math.min(60, Math.max(5, Number(body.count) || 20));
  const duration = Math.min(120, Math.max(3, Number(body.duration_min) || Math.ceil(count * 0.75)));
  const topicIds = (body.topic_ids || []).map(Number).filter(Boolean);
  const levelId = Number(body.level_id) || null;
  if (!topicIds.length && !levelId) return { error: 'Hãy chọn cấp độ hoặc ít nhất một chủ đề.' };
  const types = (body.types || []).filter((t) => EXAM_TYPES.includes(t));
  const skills = (body.skills || []).filter((s) => /^[a-z]+$/.test(s));
  const difficulty = ['any', 'mixed', '1', '2', '3', 1, 2, 3].includes(body.difficulty) ? String(body.difficulty) : 'any';
  const gen = E.generateExamQuestions({ topicIds, levelId, count, difficulty, types: types.length ? types : EXAM_TYPES, skills, userId: uid });
  if (gen.ids.length < count) {
    const available = gen.problems.length ? gen.problems[0].available : gen.ids.length;
    return { error: `Chỉ có ${available} câu hỏi đã xác minh phù hợp với lựa chọn này, chưa đủ ${count} câu.`, available, suggestion: Math.max(0, Math.min(available, count)) };
  }
  const tnames = topicIds.length ? db.prepare(`SELECT name FROM topics WHERE id IN (${topicIds.map(() => '?').join(',')})`).all(...topicIds).map((t) => t.name) : [];
  const lvl = levelId ? db.prepare('SELECT name FROM levels WHERE id=?').get(levelId) : null;
  const title = body.title ? String(body.title).slice(0, 80) : `Đề tự tạo · ${tnames.length === 1 ? tnames[0] : (lvl ? lvl.name : 'Nhiều chủ đề')}`;
  const config = { difficulty, types, skills, topic_ids: topicIds, level_id: levelId };
  const id = db.prepare(`INSERT INTO mock_exams(title,description,kind,owner_id,level_id,scope,question_ids,duration_min,pass_score,show_answers,status,config)
    VALUES (?,?,'custom',?,?,?,?,?,?,1,'published',?)`).run(title, `${count} câu · độ khó: ${({ any: 'tất cả', mixed: 'trộn', 1: 'dễ', 2: 'vừa', 3: 'khó' })[difficulty]}`,
    uid, levelId, tnames.join(', ') || (lvl ? lvl.name : ''), JSON.stringify(gen.ids), duration, Number(body.pass_score) || 60, JSON.stringify(config)).lastInsertRowid;
  return { id };
}

function start(uid, ex) {
  sweepExpired(uid);
  const cur = db.prepare("SELECT id FROM exam_attempts WHERE user_id=? AND exam_id=? AND status='in_progress'").get(uid, ex.id);
  if (cur) return cur;
  const qids = J(ex.question_ids, []);
  if (!qids.length) return { error: 'Đề thi chưa có câu hỏi.' };
  const items = E.buildItems(E.shuffle(qids).map((id) => ({ id })));
  const startAt = nowIso();
  const deadline = new Date(Date.now() + ex.duration_min * 60000).toISOString().replace('T', ' ').slice(0, 19);
  const id = db.prepare('INSERT INTO exam_attempts(exam_id,user_id,items,started_at,deadline_at,total) VALUES (?,?,?,?,?,?)')
    .run(ex.id, uid, JSON.stringify(items), startAt, deadline, items.length).lastInsertRowid;
  return { id };
}

function attemptState(id, uid) {
  sweepExpired(uid);
  const a = db.prepare('SELECT * FROM exam_attempts WHERE id=? AND user_id=?').get(id, uid);
  if (!a) return null;
  const ex = db.prepare('SELECT * FROM mock_exams WHERE id=?').get(a.exam_id);
  const base = { id: a.id, exam_id: a.exam_id, title: ex.title, status: a.status, pass_score: ex.pass_score, duration_min: ex.duration_min,
    started_at: iso(a.started_at), deadline_at: iso(a.deadline_at), submitted_at: iso(a.submitted_at), server_now: new Date().toISOString() };
  if (a.status === 'in_progress') {
    const items = J(a.items, []);
    return { ...base, questions: items.map((it) => E.publicQuestion(E.loadQuestion(it.q), it.o)), answers: J(a.answers, {}), flags: J(a.flags, []) };
  }
  if (a.status === 'abandoned') return base;
  const d = J(a.detail, {});
  return { ...base, score: a.score, correct: a.correct, total: a.total, passed: ex.pass_score != null ? a.score >= ex.pass_score : null,
    duration_sec: d.duration_sec, by_skill: d.by_skill, by_topic: d.by_topic, weak_topics: d.weak_topics, show_answers: !!ex.show_answers,
    questions: (d.questions || []).map((q) => (ex.show_answers ? q : { qid: q.qid, correct: q.correct, prompt: q.prompt, topic: q.topic, skill: q.skill })),
    previous: db.prepare("SELECT score FROM exam_attempts WHERE user_id=? AND exam_id=? AND id<? AND status IN ('submitted','auto_submitted') ORDER BY id DESC LIMIT 1").get(uid, a.exam_id, a.id) || null };
}

function liveAttempt(id, uid) {
  const a = db.prepare('SELECT * FROM exam_attempts WHERE id=? AND user_id=?').get(id, uid);
  if (!a) return { error: 'Không tìm thấy lượt thi.', code: 404 };
  if (a.status !== 'in_progress') return { error: 'Lượt thi đã kết thúc.', code: 409 };
  const grace = E.getSettings().exam_grace_seconds;
  if (Date.now() > new Date(iso(a.deadline_at)).getTime() + grace * 1000) { submit(a.id, uid, 'auto_submitted'); return { error: 'Đã hết giờ làm bài. Bài thi đã được tự động nộp.', code: 409, expired: true }; }
  return { a };
}
function saveAnswer(id, uid, body) {
  const L = liveAttempt(id, uid); if (L.error) return L;
  const items = J(L.a.items, []);
  const qid = Number(body.question_id);
  if (!items.some((i) => i.q === qid)) return { error: 'Câu hỏi không thuộc đề này.', code: 400 };
  const answers = J(L.a.answers, {});
  if (body.response == null) delete answers[qid]; else answers[qid] = body.response;
  db.prepare('UPDATE exam_attempts SET answers=? WHERE id=?').run(JSON.stringify(answers), id);
  return { ok: true, answered: Object.keys(answers).length };
}
function setFlag(id, uid, body) {
  const L = liveAttempt(id, uid); if (L.error) return L;
  const qid = Number(body.question_id);
  let flags = J(L.a.flags, []).filter((x) => x !== qid);
  if (body.flagged) flags.push(qid);
  db.prepare('UPDATE exam_attempts SET flags=? WHERE id=?').run(JSON.stringify(flags), id);
  return { ok: true, flags };
}

function submit(id, uid, status) {
  const a = db.prepare('SELECT * FROM exam_attempts WHERE id=? AND user_id=?').get(id, uid);
  if (!a) return { error: 'Không tìm thấy lượt thi.', code: 404 };
  if (a.status !== 'in_progress') return { error: 'Lượt thi đã kết thúc.', code: 409 };
  const items = J(a.items, []), answers = J(a.answers, {});
  const bySkill = {}, byTopic = {}, questions = [];
  let correct = 0;
  const tx = db.transaction(() => {
    for (const it of items) {
      const q = E.loadQuestion(it.q);
      const resp = answers[it.q];
      const g = resp != null ? E.grade(q, resp) : { correct: false, score: 0, correct_answer: E.grade(q, {}).correct_answer, chosen: null, why: q.explanation };
      if (resp != null) E.recordAnswer(uid, q, resp, g, { mode: 'exam', attempt_id: a.id });
      if (g.correct) correct++;
      bySkill[q.skill] = bySkill[q.skill] || { total: 0, correct: 0 }; bySkill[q.skill].total++; if (g.correct) bySkill[q.skill].correct++;
      byTopic[q.topic_id] = byTopic[q.topic_id] || { topic_id: q.topic_id, name: q.topic_name, total: 0, correct: 0 }; byTopic[q.topic_id].total++; if (g.correct) byTopic[q.topic_id].correct++;
      // ảnh chụp câu hỏi tại thời điểm thi, để đối chiếu kể cả khi câu hỏi được sửa sau này
      questions.push({ qid: q.id, code: q.code, prompt: q.prompt, type: q.type, topic: q.topic_name, topic_id: q.topic_id, skill: q.skill,
        say: q.data.say || null, answered: resp != null, correct: g.correct, your_answer: g.chosen, correct_answer: g.correct_answer, choice_feedback: g.choice_feedback || null, explanation: q.explanation });
    }
    const total = items.length;
    const score = total ? Math.round((correct / total) * 1000) / 10 : 0;
    const now = nowIso();
    const weak = Object.values(byTopic).filter((t) => t.correct / t.total < 0.7).sort((x, y) => x.correct / x.total - y.correct / y.total);
    const detail = { duration_sec: secsBetween(a.started_at, now < a.deadline_at || status !== 'auto_submitted' ? now : a.deadline_at), by_skill: bySkill, by_topic: Object.values(byTopic), weak_topics: weak, questions };
    db.prepare('UPDATE exam_attempts SET status=?, submitted_at=?, score=?, correct=?, total=?, detail=? WHERE id=?')
      .run(status, now, score, correct, total, JSON.stringify(detail), a.id);
  });
  tx();
  require('./stats').awardAchievements(uid);
  return { ok: true };
}

module.exports = { listForUser, generateCustom, accessibleExam, examInfo, start, attemptState, saveAnswer, setFlag, submit, sweepExpired, poolLimits, EXAM_TYPES, iso };
