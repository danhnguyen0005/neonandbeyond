// Lõi nghiệp vụ: chấm điểm, thành thạo, SRS từ vựng, theo dõi câu sai, chọn & xáo trộn câu hỏi, sinh đề.
const { db, J, nowIso, addDays, today } = require('./db');

/* ---------------- Cấu hình (chỉnh được trong Admin › Cài đặt) ---------------- */
const DEFAULT_SETTINGS = {
  mastery: {
    window: 40,               // xét N câu gần nhất của chủ đề
    basic_min_questions: 8,   // cần ít nhất ngần này câu mới xếp mức "cần luyện thêm" / "đã nắm cơ bản"
    basic_min_accuracy: 0.7,
    mastered_min_questions: 15,
    mastered_min_accuracy: 0.85,
    mastered_min_sessions: 2, // số phiên khác nhau đạt ngưỡng
    session_min_answers: 5,   // một phiên chỉ được tính khi có đủ số câu của chủ đề
  },
  srs_intervals: [0, 1, 2, 4, 7, 15, 30], // ngày, theo hộp Leitner 0..6
  srs_good_box: 4,                         // từ ở hộp ≥ 4 được coi là "ghi nhớ tốt"
  writing_pass: 0.7,
  exam_grace_seconds: 15,
};
function getSettings() {
  const row = db.prepare("SELECT value FROM settings WHERE key='app'").get();
  const s = J(row && row.value, {});
  return { ...DEFAULT_SETTINGS, ...s, mastery: { ...DEFAULT_SETTINGS.mastery, ...(s.mastery || {}) } };
}
function saveSettings(s) {
  db.prepare("INSERT INTO settings(key,value) VALUES('app',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(s));
}
function rulesFor(topicId) {
  const base = getSettings().mastery;
  const t = db.prepare('SELECT mastery_rules FROM topics WHERE id=?').get(topicId);
  return { ...base, ...J(t && t.mastery_rules, {}) };
}

/* ---------------- Câu hỏi ---------------- */
function loadQuestion(id) {
  const q = db.prepare('SELECT q.*, t.name topic_name, t.grp FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.id=?').get(id);
  if (!q) return null;
  q.data = J(q.data, {}); q.answer = J(q.answer, {});
  q.options = db.prepare('SELECT id,text,is_correct,feedback FROM question_options WHERE question_id=? ORDER BY sort,id').all(id);
  return q;
}
// Dạng gửi cho người học: KHÔNG chứa đáp án
function publicQuestion(q, order) {
  const out = {
    id: q.id, code: q.code, type: q.type, prompt: q.prompt, skill: q.skill, difficulty: q.difficulty,
    topic_id: q.topic_id, topic_name: q.topic_name,
  };
  if (q.data.say) out.say = q.data.say;
  if (q.data.hint) out.hint = q.data.hint;
  if (q.data.passage_id) {
    const p = db.prepare('SELECT id,kind,title,ko_text FROM passages WHERE id=?').get(q.data.passage_id);
    if (p) out.passage = p.kind === 'listening' ? { id: p.id, kind: p.kind, title: p.title, say: p.ko_text } : p;
  }
  if (['mcq', 'listen', 'error'].includes(q.type)) {
    const byId = new Map(q.options.map((o) => [o.id, o]));
    out.options = (order && order.length ? order : q.options.map((o) => o.id)).map((id) => byId.get(id)).filter(Boolean).map((o) => ({ id: o.id, text: o.text }));
  }
  if (q.type === 'order') {
    const words = q.answer.words || [];
    out.words = (order && order.length ? order : words.map((_, i) => i)).map((i) => words[i]);
  }
  if (q.type === 'write' && q.data.rubric) {
    out.criteria = (q.data.rubric.criteria || []).map((c) => c.label);
    out.min_len = q.data.rubric.min_len || 0;
  }
  return out;
}

const norm = (s) => String(s || '').normalize('NFC').trim().replace(/[\s.?!,。~]+$/g, '').replace(/\s+/g, ' ').toLowerCase();
const compact = (s) => norm(s).replace(/\s/g, '');

// Chấm một câu. Trả về {correct, score, correct_answer, why, rubric?}
function grade(q, response) {
  response = response || {};
  const why = q.explanation || '';
  if (['mcq', 'listen', 'error'].includes(q.type)) {
    const chosen = q.options.find((o) => o.id === Number(response.option));
    const right = q.options.find((o) => o.is_correct);
    const correct = !!(chosen && chosen.is_correct);
    return {
      correct, score: correct ? 1 : 0, correct_answer: right ? right.text : '',
      chosen: chosen ? chosen.text : null,
      choice_feedback: !correct && chosen && chosen.feedback ? chosen.feedback : null, why,
    };
  }
  if (['fill', 'conjugate', 'translate'].includes(q.type)) {
    const acc = q.answer.accepted || [];
    const r = compact(response.text);
    const correct = r.length > 0 && acc.some((a) => compact(a) === r);
    let choice_feedback = null;
    if (!correct && q.answer.common_wrong) {
      const hit = q.answer.common_wrong.find((w) => compact(w.text) === r);
      if (hit) choice_feedback = hit.why;
    }
    return { correct, score: correct ? 1 : 0, correct_answer: acc[0] || '', chosen: response.text || '', choice_feedback, why };
  }
  if (q.type === 'order') {
    const target = (q.answer.words || []).join(' ');
    const got = (response.words || []).join(' ');
    const correct = compact(got) === compact(target);
    return { correct, score: correct ? 1 : 0, correct_answer: target, chosen: got, why };
  }
  if (q.type === 'write') return gradeWriting(q, response.text || '');
  return { correct: false, score: 0, correct_answer: '', why };
}

// Câu trả lời mở: chấm theo tiêu chí (rubric) thay vì đúng/sai tuyệt đối
function gradeWriting(q, text) {
  const rub = q.data.rubric || { criteria: [] };
  const t = String(text).normalize('NFC').trim();
  const results = [];
  let total = 0, earned = 0;
  if (rub.min_len) {
    const ok = t.replace(/\s/g, '').length >= rub.min_len;
    total += 1; if (ok) earned += 1;
    results.push({ label: `Độ dài tối thiểu ${rub.min_len} ký tự`, ok });
  }
  for (const c of rub.criteria || []) {
    const pts = c.points || 1; total += pts;
    let ok = false;
    try {
      if (c.kind === 'includes') ok = t.includes(c.value);
      else if (c.kind === 'anyOf') ok = (c.value || []).some((v) => t.includes(v));
      else if (c.kind === 'regex') ok = new RegExp(c.value, 'u').test(t);
      else if (c.kind === 'endsWith') ok = t.replace(/[.?!\s]+$/, '').endsWith(c.value);
      else if (c.kind === 'hangul') ok = /[가-힣]/.test(t) && !/[a-zA-Z]{3,}/.test(t);
    } catch { ok = false; }
    if (ok) earned += pts;
    results.push({ label: c.label, ok, tip: ok ? null : c.tip || null });
  }
  const score = total ? earned / total : 0;
  const pass = getSettings().writing_pass;
  return {
    correct: score >= pass, score, correct_answer: (q.answer && q.answer.reference) || '',
    chosen: t, rubric: results, why: q.explanation || '',
  };
}

/* ---------------- Ghi nhận kết quả ---------------- */
function recordAnswer(userId, q, response, g, ctx) {
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO user_answers(user_id,question_id,session_id,attempt_id,mode,response,is_correct,score,error_tag,topic_id)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(userId, q.id, ctx.session_id || null, ctx.attempt_id || null, ctx.mode,
      JSON.stringify(response || {}), g.correct ? 1 : 0, g.score, q.error_tag, q.topic_id);
    db.prepare(`INSERT INTO activity_days(user_id,day,answers) VALUES (?,?,1)
      ON CONFLICT(user_id,day) DO UPDATE SET answers=answers+1`).run(userId, today());
    updateMistake(userId, q.id, g.correct, response);
    if (q.data && q.data.vocab_id) updateSrs(userId, q.data.vocab_id, g.correct);
    if (q.type === 'write') {
      db.prepare('INSERT INTO writing_submissions(user_id,question_id,text,auto_score,rubric_result) VALUES (?,?,?,?,?)')
        .run(userId, q.id, String(response.text || '').slice(0, 2000), g.score, JSON.stringify(g.rubric || []));
    }
    db.prepare(`INSERT INTO topic_progress(user_id,topic_id,last_practiced_at) VALUES (?,?,datetime('now'))
      ON CONFLICT(user_id,topic_id) DO UPDATE SET last_practiced_at=datetime('now')`).run(userId, q.topic_id);
    refreshMastery(userId, q.topic_id);
  });
  tx();
}

function updateMistake(userId, qid, correct, response) {
  const m = db.prepare('SELECT * FROM mistakes WHERE user_id=? AND question_id=?').get(userId, qid);
  const now = nowIso();
  if (!correct) {
    if (m) db.prepare(`UPDATE mistakes SET wrong_count=wrong_count+1, right_after=0, state='open', last_wrong_at=?, next_check_at=?, last_response=? WHERE user_id=? AND question_id=?`)
      .run(now, now, JSON.stringify(response || {}), userId, qid);
    else db.prepare(`INSERT INTO mistakes(user_id,question_id,wrong_count,first_wrong_at,last_wrong_at,next_check_at,last_response) VALUES (?,?,1,?,?,?,?)`)
      .run(userId, qid, now, now, now, JSON.stringify(response || {}));
    return;
  }
  if (!m || m.state === 'resolved') return;
  // Trả lời đúng: không xoá lịch sử. Chuyển sang "đang sửa", hẹn kiểm tra lại sau một khoảng thời gian.
  if (m.state === 'open' || m.state === 'understood') {
    db.prepare(`UPDATE mistakes SET state='fixing', right_after=1, next_check_at=? WHERE user_id=? AND question_id=?`).run(addDays(1), userId, qid);
  } else if (m.state === 'fixing' && m.next_check_at <= now) {
    const ra = m.right_after + 1;
    if (ra >= 2) db.prepare(`UPDATE mistakes SET state='resolved', right_after=?, next_check_at=? WHERE user_id=? AND question_id=?`).run(ra, addDays(30), userId, qid);
    else db.prepare(`UPDATE mistakes SET right_after=?, next_check_at=? WHERE user_id=? AND question_id=?`).run(ra, addDays(3), userId, qid);
  }
}

function updateSrs(userId, vocabId, correct) {
  const iv = getSettings().srs_intervals;
  const r = db.prepare('SELECT * FROM srs_records WHERE user_id=? AND vocab_id=?').get(userId, vocabId);
  let box = r ? r.box : 0, lapses = r ? r.lapses : 0;
  if (correct) box = Math.min(box + 1, iv.length - 1);
  else { lapses += r ? 1 : 0; box = r ? 1 : 0; }
  const due = correct ? addDays(iv[box]) : nowIso();
  db.prepare(`INSERT INTO srs_records(user_id,vocab_id,box,due_at,reps,lapses,last_result,updated_at) VALUES (?,?,?,?,1,?,?,datetime('now'))
    ON CONFLICT(user_id,vocab_id) DO UPDATE SET box=excluded.box, due_at=excluded.due_at, reps=reps+1, lapses=excluded.lapses, last_result=excluded.last_result, updated_at=datetime('now')`)
    .run(userId, vocabId, box, due, lapses, correct ? 1 : 0);
}

/* ---------------- Thành thạo (độc lập với tiến độ) ---------------- */
const MASTERY_LABEL = {
  unassessed: 'Chưa đánh giá', familiarizing: 'Đang làm quen', needs_practice: 'Cần luyện tập thêm',
  basic: 'Đã nắm cơ bản', mastered: 'Thành thạo',
};
function computeMastery(userId, topicId) {
  const R = rulesFor(topicId);
  const tot = db.prepare('SELECT COUNT(*) n, COALESCE(SUM(is_correct),0) c FROM user_answers WHERE user_id=? AND topic_id=?').get(userId, topicId);
  const recent = db.prepare('SELECT is_correct FROM user_answers WHERE user_id=? AND topic_id=? ORDER BY id DESC LIMIT ?').all(userId, topicId, R.window);
  const wacc = recent.length ? recent.reduce((a, r) => a + r.is_correct, 0) / recent.length : 0;
  const sessOk = db.prepare(`SELECT COUNT(*) k FROM (
      SELECT COALESCE('s'||session_id,'a'||attempt_id) g, COUNT(*) n, AVG(is_correct) acc
      FROM user_answers WHERE user_id=? AND topic_id=? AND (session_id IS NOT NULL OR attempt_id IS NOT NULL)
      GROUP BY g HAVING n>=? AND acc>=?)`).get(userId, topicId, R.session_min_answers, R.mastered_min_accuracy).k;
  let level = 'unassessed';
  if (tot.n > 0) level = 'familiarizing';
  if (tot.n >= R.basic_min_questions) level = wacc >= R.basic_min_accuracy ? 'basic' : 'needs_practice';
  if (tot.n >= R.mastered_min_questions && wacc >= R.mastered_min_accuracy && sessOk >= R.mastered_min_sessions) level = 'mastered';
  return {
    level, label: MASTERY_LABEL[level], answered: tot.n, correct: tot.c, wrong: tot.n - tot.c,
    accuracy: tot.n ? tot.c / tot.n : null, recent_accuracy: recent.length ? wacc : null, sessions_ok: sessOk, rules: R,
  };
}
function refreshMastery(userId, topicId) {
  const m = computeMastery(userId, topicId);
  db.prepare(`INSERT INTO topic_progress(user_id,topic_id,mastery) VALUES (?,?,?)
    ON CONFLICT(user_id,topic_id) DO UPDATE SET mastery=excluded.mastery`).run(userId, topicId, m.level);
  return m;
}

const STATUS_LABEL = { not_started: 'Chưa bắt đầu', in_progress: 'Đang học', needs_review: 'Cần ôn tập', completed: 'Đã hoàn thành', mastered: 'Đã thành thạo' };
// Trạng thái học tập của một chủ đề (khác mức thành thạo: "hoàn thành" ≠ "ghi nhớ")
function topicStatus(userId, topic) {
  const p = db.prepare('SELECT * FROM topic_progress WHERE user_id=? AND topic_id=?').get(userId, topic.id) || {};
  const m = computeMastery(userId, topic.id);
  const totalQ = db.prepare("SELECT COUNT(*) n FROM questions WHERE topic_id=? AND status='published' AND archived=0").get(topic.id).n;
  const seenQ = db.prepare('SELECT COUNT(DISTINCT question_id) n FROM user_answers WHERE user_id=? AND topic_id=?').get(userId, topic.id).n;
  const dueMist = db.prepare(`SELECT COUNT(*) n FROM mistakes mi JOIN questions q ON q.id=mi.question_id
    WHERE mi.user_id=? AND q.topic_id=? AND (mi.state='open' OR (mi.state IN ('understood','fixing') AND mi.next_check_at<=datetime('now')))`).get(userId, topic.id).n;
  const dueVocab = db.prepare(`SELECT COUNT(*) n FROM srs_records s JOIN vocabulary v ON v.id=s.vocab_id
    WHERE s.user_id=? AND v.topic_id=? AND s.due_at<=datetime('now')`).get(userId, topic.id).n;
  // Tỷ lệ hoàn thành: đã xem lý thuyết (20%) + độ phủ câu hỏi đã làm (80%)
  const completion = Math.round(((p.theory_viewed_at ? 0.2 : 0) + (totalQ ? Math.min(1, seenQ / totalQ) * 0.8 : 0)) * 100);
  let status = 'not_started';
  if (p.theory_viewed_at || m.answered > 0) status = 'in_progress';
  if (p.completed_at) status = 'completed';
  if ((p.completed_at || m.answered >= m.rules.basic_min_questions) && (m.level === 'needs_practice' || dueMist > 0 || dueVocab > 0)) status = 'needs_review';
  if (m.level === 'mastered' && dueMist === 0) status = 'mastered';
  return {
    status, status_label: STATUS_LABEL[status], completion: p.completed_at ? Math.max(completion, 60) : completion,
    mastery: m, completed_at: p.completed_at || null, theory_viewed_at: p.theory_viewed_at || null,
    sessions_count: p.sessions_count || 0, last_practiced_at: p.last_practiced_at || null,
    due_mistakes: dueMist, due_vocab: dueVocab, total_questions: totalQ, seen_questions: seenQ,
  };
}

/* ---------------- Chọn & xáo trộn câu hỏi ---------------- */
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Chọn ngẫu nhiên có trọng số: ưu tiên câu chưa làm / hay sai; giảm câu vừa làm ở phiên trước
function pickQuestions(userId, pool, count, { recentIds = [], groupDedupe = true } = {}) {
  if (!pool.length) return [];
  const stats = new Map();
  if (userId) {
    const ids = pool.map((q) => q.id);
    const rows = db.prepare(`SELECT question_id, COUNT(*) n, SUM(is_correct) c,
        (SELECT is_correct FROM user_answers u2 WHERE u2.user_id=u.user_id AND u2.question_id=u.question_id ORDER BY id DESC LIMIT 1) last
      FROM user_answers u WHERE user_id=? AND question_id IN (${ids.map(() => '?').join(',')}) GROUP BY question_id`).all(userId, ...ids);
    rows.forEach((r) => stats.set(r.question_id, r));
    const mist = db.prepare(`SELECT question_id FROM mistakes WHERE user_id=? AND state!='resolved'`).all(userId);
    mist.forEach((m) => { const s = stats.get(m.question_id); if (s) s.mistake = true; });
  }
  const recent = new Set(recentIds);
  let cand = pool.map((q) => {
    const s = stats.get(q.id);
    let w = 1;
    if (!s) w += 3;                       // chưa làm
    else {
      if (s.last === 0) w += 4;           // lần gần nhất sai
      if (s.mistake) w += 3;              // đang trong danh sách câu sai
      if (s.c >= 3 && s.last === 1) w *= 0.5; // đã đúng nhiều lần
    }
    if (recent.has(q.id)) w *= 0.25;      // vừa xuất hiện ở phiên trước
    return { q, w, key: Math.random() ** (1 / w) }; // weighted reservoir key
  }).sort((a, b) => b.key - a.key);
  const out = [], groups = new Set();
  for (const c of cand) {
    if (out.length >= count) break;
    const g = groupDedupe && c.q.group ? c.q.group : null;
    if (g && groups.has(g)) continue;
    if (g) groups.add(g);
    out.push(c.q);
  }
  if (out.length < count) for (const c of cand) { if (out.length >= count) break; if (!out.includes(c.q)) out.push(c.q); }
  return shuffle(out);
}

function poolQuery({ topicIds, levelId, difficulty, types, skills, errorTags, verifiedOnly, excludeIds, onlyIds }) {
  const where = ["q.status='published'", 'q.archived=0', 't.archived=0'];
  const args = [];
  if (verifiedOnly) where.push('q.verified=1');
  if (topicIds && topicIds.length) { where.push(`q.topic_id IN (${topicIds.map(() => '?').join(',')})`); args.push(...topicIds); }
  if (levelId) { where.push('t.level_id=?'); args.push(levelId); }
  if (difficulty && difficulty !== 'any' && difficulty !== 'mixed') { where.push('q.difficulty=?'); args.push(Number(difficulty)); }
  if (types && types.length) { where.push(`q.type IN (${types.map(() => '?').join(',')})`); args.push(...types); }
  if (skills && skills.length) { where.push(`q.skill IN (${skills.map(() => '?').join(',')})`); args.push(...skills); }
  if (errorTags && errorTags.length) { where.push(`q.error_tag IN (${errorTags.map(() => '?').join(',')})`); args.push(...errorTags); }
  if (onlyIds) { if (!onlyIds.length) return []; where.push(`q.id IN (${onlyIds.map(() => '?').join(',')})`); args.push(...onlyIds); }
  if (excludeIds && excludeIds.length) { where.push(`q.id NOT IN (${excludeIds.map(() => '?').join(',')})`); args.push(...excludeIds); }
  return db.prepare(`SELECT q.id,q.topic_id,q.difficulty,q.type,q.skill,q.data FROM questions q JOIN topics t ON t.id=q.topic_id WHERE ${where.join(' AND ')}`)
    .all(...args).map((r) => { const d = J(r.data, {}); return { ...r, group: d.vocab_id ? 'v' + d.vocab_id : d.group || null }; });
}

// Thứ tự phương án: xáo trộn, tránh đáp án đúng nằm cùng vị trí với 2 câu liền trước
function buildItems(questions) {
  const items = []; const lastPos = [];
  for (const qq of questions) {
    const q = loadQuestion(qq.id);
    let o = [];
    if (['mcq', 'listen', 'error'].includes(q.type)) {
      const keepOrder = q.type === 'error' || q.data.fixed_order; // câu "tìm lỗi sai" giữ trật tự các phần của câu
      let pos = -1;
      for (let tries = 0; tries < 6; tries++) {
        o = keepOrder ? q.options.map((x) => x.id) : shuffle(q.options.map((x) => x.id));
        pos = o.findIndex((id) => q.options.find((x) => x.id === id).is_correct);
        if (keepOrder || !(lastPos.length >= 2 && lastPos.slice(-2).every((p) => p === pos))) break;
      }
      lastPos.push(pos);
    } else if (q.type === 'order') {
      const n = (q.answer.words || []).length;
      const ident = [...Array(n).keys()];
      o = ident;
      for (let tries = 0; tries < 6 && n > 1 && o.join() === ident.join(); tries++) o = shuffle(ident);
    }
    items.push({ q: q.id, o });
  }
  return items;
}

/* ---------------- Sinh đề thi ---------------- */
// Phân bổ đều theo chủ đề (vòng tròn) để không chủ đề nào chiếm quá nhiều câu; xen kẽ độ khó khi chọn "mixed"
function generateExamQuestions({ topicIds, levelId, count, difficulty, types, skills, matrix, userId }) {
  const used = new Set(), groups = new Set();
  const take = (pool, n) => {
    const picked = [];
    for (const q of shuffle(pool)) {
      if (picked.length >= n) break;
      if (used.has(q.id) || (q.group && groups.has(q.group))) continue;
      used.add(q.id); if (q.group) groups.add(q.group); picked.push(q);
    }
    return picked;
  };
  if (matrix && matrix.length) {
    const out = [], problems = [];
    for (const row of matrix) {
      const pool = poolQuery({ topicIds: [row.topic_id], difficulty: row.difficulty || 'any', types, skills, verifiedOnly: true });
      const got = take(pool, row.count);
      if (got.length < row.count) problems.push({ topic_id: row.topic_id, difficulty: row.difficulty || 'any', need: row.count, available: got.length });
      out.push(...got);
    }
    return { ids: shuffle(out).map((q) => q.id), problems };
  }
  const pool = poolQuery({ topicIds, levelId, difficulty, types, skills, verifiedOnly: true });
  if (pool.length < count) return { ids: [], problems: [{ need: count, available: pool.length }] };
  const byTopic = new Map();
  pool.forEach((q) => { if (!byTopic.has(q.topic_id)) byTopic.set(q.topic_id, []); byTopic.get(q.topic_id).push(q); });
  const topics = shuffle([...byTopic.keys()]);
  topics.forEach((t) => byTopic.set(t, shuffle(byTopic.get(t))));
  const diffCycle = difficulty === 'mixed' ? [1, 2, 1, 2, 3] : null;
  const out = []; let guard = 0, ti = 0;
  while (out.length < count && guard++ < count * 50) {
    const t = topics[ti++ % topics.length];
    const list = byTopic.get(t);
    const wantD = diffCycle ? diffCycle[out.length % diffCycle.length] : null;
    let idx = list.findIndex((q) => !used.has(q.id) && !(q.group && groups.has(q.group)) && (!wantD || q.difficulty === wantD));
    if (idx < 0) idx = list.findIndex((q) => !used.has(q.id) && !(q.group && groups.has(q.group)));
    if (idx < 0) idx = list.findIndex((q) => !used.has(q.id));
    if (idx < 0) continue;
    const q = list[idx]; used.add(q.id); if (q.group) groups.add(q.group); out.push(q);
  }
  return { ids: shuffle(out).map((q) => q.id), problems: out.length < count ? [{ need: count, available: out.length }] : [] };
}

module.exports = {
  DEFAULT_SETTINGS, getSettings, saveSettings, loadQuestion, publicQuestion, grade, recordAnswer,
  computeMastery, refreshMastery, topicStatus, MASTERY_LABEL, STATUS_LABEL, pickQuestions, poolQuery,
  buildItems, generateExamQuestions, shuffle, norm, compact, updateSrs,
};
