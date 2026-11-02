// Lõi nghiệp vụ: chấm điểm, thành thạo, SRS từ vựng, theo dõi câu sai, chọn & xáo trộn câu hỏi, sinh đề.
// Truy vấn được gộp (bulk) để giảm số lượt gọi tới cơ sở dữ liệu từ xa.
const { db, J, nowIso, addDays, today, qs } = require('./db');

/* ---------------- Cấu hình (chỉnh trong Admin › Cài đặt) ---------------- */
const DEFAULT_SETTINGS = {
  mastery: {
    window: 40, basic_min_questions: 8, basic_min_accuracy: 0.7,
    mastered_min_questions: 15, mastered_min_accuracy: 0.85, mastered_min_sessions: 2, session_min_answers: 5,
  },
  srs_intervals: [0, 1, 2, 4, 7, 15, 30], srs_good_box: 4, writing_pass: 0.7, exam_grace_seconds: 15,
};
let cache = null, cacheAt = 0;
async function getSettings() {
  if (cache && Date.now() - cacheAt < 30000) return cache;
  const row = await db.get("SELECT value FROM settings WHERE key='app'");
  const s = J(row && row.value, {});
  cache = { ...DEFAULT_SETTINGS, ...s, mastery: { ...DEFAULT_SETTINGS.mastery, ...(s.mastery || {}) } }; cacheAt = Date.now();
  return cache;
}
async function saveSettings(s) {
  await db.run("INSERT INTO settings(key,value) VALUES('app',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", JSON.stringify(s));
  cache = null;
}

/* ---------------- Câu hỏi ---------------- */
async function loadQuestions(ids) {
  ids = [...new Set(ids.map(Number).filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;
  const rows = await db.all(`SELECT q.*, t.name topic_name, t.grp FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.id IN (${qs(ids.length)})`, ...ids);
  const opts = await db.all(`SELECT id,question_id,text,is_correct,feedback FROM question_options WHERE question_id IN (${qs(ids.length)}) ORDER BY sort,id`, ...ids);
  rows.forEach((q) => { q.data = J(q.data, {}); q.answer = J(q.answer, {}); q.options = []; map.set(q.id, q); });
  opts.forEach((o) => { const q = map.get(o.question_id); if (q) q.options.push(o); });
  const pids = [...new Set(rows.map((q) => q.data.passage_id).filter(Boolean))];
  if (pids.length) {
    const ps = new Map((await db.all(`SELECT id,kind,title,ko_text FROM passages WHERE id IN (${qs(pids.length)})`, ...pids)).map((p) => [p.id, p]));
    rows.forEach((q) => { if (q.data.passage_id) q.passage = ps.get(q.data.passage_id) || null; });
  }
  return map;
}
async function loadQuestion(id) { return (await loadQuestions([id])).get(Number(id)) || null; }

// Dạng gửi cho người học: KHÔNG chứa đáp án
function publicQuestion(q, order) {
  const out = { id: q.id, code: q.code, type: q.type, prompt: q.prompt, skill: q.skill, difficulty: q.difficulty, topic_id: q.topic_id, topic_name: q.topic_name };
  if (q.data.say) out.say = q.data.say;
  if (q.data.hint) out.hint = q.data.hint;
  if (q.passage) out.passage = q.passage.kind === 'listening' ? { id: q.passage.id, kind: 'listening', title: q.passage.title, say: q.passage.ko_text } : q.passage;
  if (['mcq', 'listen', 'error'].includes(q.type)) {
    const byId = new Map(q.options.map((o) => [o.id, o]));
    out.options = (order && order.length ? order : q.options.map((o) => o.id)).map((id) => byId.get(id)).filter(Boolean).map((o) => ({ id: o.id, text: o.text }));
  }
  if (q.type === 'order') {
    const words = q.answer.words || [];
    out.words = (order && order.length ? order : words.map((_, i) => i)).map((i) => words[i]);
  }
  if (q.type === 'write' && q.data.rubric) { out.criteria = (q.data.rubric.criteria || []).map((c) => c.label); out.min_len = q.data.rubric.min_len || 0; }
  return out;
}

const norm = (s) => String(s || '').normalize('NFC').trim().replace(/[\s.?!,。~]+$/g, '').replace(/\s+/g, ' ').toLowerCase();
const compact = (s) => norm(s).replace(/\s/g, '');

// Chấm một câu (đồng bộ). writingPass: ngưỡng đạt của bài viết
function grade(q, response, writingPass = DEFAULT_SETTINGS.writing_pass) {
  response = response || {};
  const why = q.explanation || '';
  if (['mcq', 'listen', 'error'].includes(q.type)) {
    const chosen = q.options.find((o) => o.id === Number(response.option));
    const right = q.options.find((o) => o.is_correct);
    const correct = !!(chosen && chosen.is_correct);
    return { correct, score: correct ? 1 : 0, correct_answer: right ? right.text : '', chosen: chosen ? chosen.text : null,
      choice_feedback: !correct && chosen && chosen.feedback ? chosen.feedback : null, why };
  }
  if (['fill', 'conjugate', 'translate'].includes(q.type)) {
    const acc = q.answer.accepted || [];
    const r = compact(response.text);
    const correct = r.length > 0 && acc.some((a) => compact(a) === r);
    let choice_feedback = null;
    if (!correct && q.answer.common_wrong) { const hit = q.answer.common_wrong.find((w) => compact(w.text) === r); if (hit) choice_feedback = hit.why; }
    return { correct, score: correct ? 1 : 0, correct_answer: acc[0] || '', chosen: response.text || '', choice_feedback, why };
  }
  if (q.type === 'order') {
    const target = (q.answer.words || []).join(' '), got = (response.words || []).join(' ');
    const correct = compact(got) === compact(target);
    return { correct, score: correct ? 1 : 0, correct_answer: target, chosen: got, why };
  }
  if (q.type === 'write') return gradeWriting(q, response.text || '', writingPass);
  return { correct: false, score: 0, correct_answer: '', why };
}
// Câu trả lời mở: chấm theo tiêu chí (rubric) thay vì đúng/sai tuyệt đối
function gradeWriting(q, text, pass) {
  const rub = q.data.rubric || { criteria: [] };
  const t = String(text).normalize('NFC').trim();
  const results = []; let total = 0, earned = 0;
  if (rub.min_len) { const ok = t.replace(/\s/g, '').length >= rub.min_len; total += 1; if (ok) earned += 1; results.push({ label: `Độ dài tối thiểu ${rub.min_len} ký tự`, ok }); }
  for (const c of rub.criteria || []) {
    const pts = c.points || 1; total += pts; let ok = false;
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
  return { correct: score >= pass, score, correct_answer: (q.answer && q.answer.reference) || '', chosen: t, rubric: results, why: q.explanation || '' };
}

/* ---------------- Ghi nhận kết quả (gộp nhiều câu trong 1 giao dịch) ---------------- */
// entries: [{ q, response, g }]  ·  ctx: { mode, session_id?, attempt_id? }
async function recordAnswers(uid, entries, ctx) {
  if (!entries.length) return;
  const S = await getSettings();
  const now = nowIso();
  const qids = entries.map((e) => e.q.id);
  const vids = [...new Set(entries.map((e) => e.q.data && e.q.data.vocab_id).filter(Boolean))];
  const [mRows, sRows] = await Promise.all([
    db.all(`SELECT * FROM mistakes WHERE user_id=? AND question_id IN (${qs(qids.length)})`, uid, ...qids),
    vids.length ? db.all(`SELECT * FROM srs_records WHERE user_id=? AND vocab_id IN (${qs(vids.length)})`, uid, ...vids) : [],
  ]);
  const mist = new Map(mRows.map((m) => [m.question_id, m]));
  const srs = new Map(sRows.map((s) => [s.vocab_id, s]));
  const w = [];
  for (const { q, response, g } of entries) {
    w.push([`INSERT INTO user_answers(user_id,question_id,session_id,attempt_id,mode,response,is_correct,score,error_tag,topic_id) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uid, q.id, ctx.session_id || null, ctx.attempt_id || null, ctx.mode, JSON.stringify(response || {}), g.correct ? 1 : 0, g.score, q.error_tag, q.topic_id]]);
    // Câu sai: không xoá khi đúng một lần — chuyển "đang sửa", hẹn kiểm tra lại
    const m = mist.get(q.id);
    if (!g.correct) {
      const next = m ? { ...m, wrong_count: m.wrong_count + 1 } : { user_id: uid, question_id: q.id, wrong_count: 1, first_wrong_at: now };
      Object.assign(next, { right_after: 0, state: 'open', last_wrong_at: now, next_check_at: now, last_response: JSON.stringify(response || {}) });
      mist.set(q.id, next);
    } else if (m && m.state !== 'resolved') {
      if (m.state === 'open' || m.state === 'understood') mist.set(q.id, { ...m, state: 'fixing', right_after: 1, next_check_at: addDays(1) });
      else if (m.state === 'fixing' && m.next_check_at <= now) {
        const ra = m.right_after + 1;
        mist.set(q.id, { ...m, right_after: ra, state: ra >= 2 ? 'resolved' : 'fixing', next_check_at: ra >= 2 ? addDays(30) : addDays(3) });
      }
    }
    const vid = q.data && q.data.vocab_id;
    if (vid) srs.set(vid, nextSrs(srs.get(vid), g.correct, S));
    if (q.type === 'write') w.push(['INSERT INTO writing_submissions(user_id,question_id,text,auto_score,rubric_result) VALUES (?,?,?,?,?)',
      [uid, q.id, String(response.text || '').slice(0, 2000), g.score, JSON.stringify(g.rubric || [])]]);
  }
  for (const m of mist.values()) {
    w.push([`INSERT INTO mistakes(user_id,question_id,wrong_count,right_after,first_wrong_at,last_wrong_at,last_response,state,next_check_at) VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id,question_id) DO UPDATE SET wrong_count=excluded.wrong_count, right_after=excluded.right_after, last_wrong_at=excluded.last_wrong_at,
      last_response=excluded.last_response, state=excluded.state, next_check_at=excluded.next_check_at`,
      [uid, m.question_id, m.wrong_count, m.right_after, m.first_wrong_at, m.last_wrong_at, m.last_response, m.state, m.next_check_at]]);
  }
  for (const [vid, s] of srs) w.push([srsUpsert, [uid, vid, s.box, s.due_at, s.reps, s.lapses, s.last_result]]);
  w.push([`INSERT INTO activity_days(user_id,day,answers) VALUES (?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET answers=answers+excluded.answers`, [uid, today(), entries.length]]);
  const tids = [...new Set(entries.map((e) => e.q.topic_id))];
  tids.forEach((t) => w.push([`INSERT INTO topic_progress(user_id,topic_id,last_practiced_at) VALUES (?,?,datetime('now')) ON CONFLICT(user_id,topic_id) DO UPDATE SET last_practiced_at=datetime('now')`, [uid, t]]));
  await db.batch(w);
  await refreshMastery(uid, tids);
}
const srsUpsert = `INSERT INTO srs_records(user_id,vocab_id,box,due_at,reps,lapses,last_result,updated_at) VALUES (?,?,?,?,?,?,?,datetime('now'))
  ON CONFLICT(user_id,vocab_id) DO UPDATE SET box=excluded.box, due_at=excluded.due_at, reps=excluded.reps, lapses=excluded.lapses, last_result=excluded.last_result, updated_at=datetime('now')`;
function nextSrs(r, correct, S) {
  const iv = S.srs_intervals;
  let box = r ? r.box : 0, lapses = r ? r.lapses : 0;
  if (correct) box = Math.min(box + 1, iv.length - 1); else { if (r) lapses += 1; box = r ? 1 : 0; }
  return { box, lapses, reps: (r ? r.reps : 0) + 1, last_result: correct ? 1 : 0, due_at: correct ? addDays(iv[box]) : nowIso() };
}
async function updateSrs(uid, vocabId, correct) {
  const S = await getSettings();
  const r = await db.get('SELECT * FROM srs_records WHERE user_id=? AND vocab_id=?', uid, vocabId);
  const s = nextSrs(r, correct, S);
  await db.run(srsUpsert, uid, vocabId, s.box, s.due_at, s.reps, s.lapses, s.last_result);
}

/* ---------------- Thành thạo (độc lập với tiến độ) ---------------- */
const MASTERY_LABEL = { unassessed: 'Chưa đánh giá', familiarizing: 'Đang làm quen', needs_practice: 'Cần luyện tập thêm', basic: 'Đã nắm cơ bản', mastered: 'Thành thạo' };
// Tính mức thành thạo cho nhiều chủ đề bằng một truy vấn
async function masteryMany(uid, topicIds = null) {
  if (topicIds && !topicIds.length) return new Map();
  const S = await getSettings();
  const inT = topicIds ? ` IN (${qs(topicIds.length)})` : '';
  const [answers, topics] = await Promise.all([
    db.all(`SELECT topic_id,is_correct,session_id,attempt_id FROM user_answers WHERE user_id=?${topicIds ? ' AND topic_id' + inT : ''} ORDER BY id DESC`, uid, ...(topicIds || [])),
    db.all(`SELECT id, mastery_rules FROM topics${topicIds ? ' WHERE id' + inT : ''}`, ...(topicIds || [])),
  ]);
  const byTopic = new Map();
  answers.forEach((a) => { if (!byTopic.has(a.topic_id)) byTopic.set(a.topic_id, []); byTopic.get(a.topic_id).push(a); });
  const out = new Map();
  for (const t of topics) {
    const R = { ...S.mastery, ...J(t.mastery_rules, {}) };
    const rows = byTopic.get(t.id) || [];
    const n = rows.length, c = rows.reduce((s, r) => s + r.is_correct, 0);
    const recent = rows.slice(0, R.window);
    const wacc = recent.length ? recent.reduce((s, r) => s + r.is_correct, 0) / recent.length : 0;
    const groups = new Map();
    rows.forEach((r) => { const g = r.session_id ? 's' + r.session_id : r.attempt_id ? 'a' + r.attempt_id : null; if (!g) return; const x = groups.get(g) || [0, 0]; x[0]++; x[1] += r.is_correct; groups.set(g, x); });
    const sessOk = [...groups.values()].filter(([k, cc]) => k >= R.session_min_answers && cc / k >= R.mastered_min_accuracy).length;
    let level = 'unassessed';
    if (n > 0) level = 'familiarizing';
    if (n >= R.basic_min_questions) level = wacc >= R.basic_min_accuracy ? 'basic' : 'needs_practice';
    if (n >= R.mastered_min_questions && wacc >= R.mastered_min_accuracy && sessOk >= R.mastered_min_sessions) level = 'mastered';
    out.set(t.id, { level, label: MASTERY_LABEL[level], answered: n, correct: c, wrong: n - c, accuracy: n ? c / n : null, recent_accuracy: recent.length ? wacc : null, sessions_ok: sessOk, rules: R });
  }
  return out;
}
async function computeMastery(uid, topicId) { return (await masteryMany(uid, [Number(topicId)])).get(Number(topicId)); }
async function refreshMastery(uid, topicIds) {
  const m = await masteryMany(uid, topicIds);
  await db.batch([...m].map(([tid, x]) => [`INSERT INTO topic_progress(user_id,topic_id,mastery) VALUES (?,?,?) ON CONFLICT(user_id,topic_id) DO UPDATE SET mastery=excluded.mastery`, [uid, tid, x.level]]));
  return m;
}

const STATUS_LABEL = { not_started: 'Chưa bắt đầu', in_progress: 'Đang học', needs_review: 'Cần ôn tập', completed: 'Đã hoàn thành', mastered: 'Đã thành thạo' };
// Trạng thái học tập của nhiều chủ đề (khác mức thành thạo: "hoàn thành" ≠ "ghi nhớ")
async function topicStatusMany(uid, topics) {
  const ids = topics.map((t) => t.id);
  if (!ids.length) return new Map();
  const [mastery, prog, totals, seen, dueMist, dueVocab] = await Promise.all([
    masteryMany(uid, ids),
    db.all('SELECT * FROM topic_progress WHERE user_id=?', uid),
    db.all("SELECT topic_id, COUNT(*) n FROM questions WHERE status='published' AND archived=0 GROUP BY topic_id"),
    db.all('SELECT topic_id, COUNT(DISTINCT question_id) n FROM user_answers WHERE user_id=? GROUP BY topic_id', uid),
    db.all(`SELECT q.topic_id, COUNT(*) n FROM mistakes mi JOIN questions q ON q.id=mi.question_id WHERE mi.user_id=?
      AND (mi.state='open' OR (mi.state IN ('understood','fixing') AND mi.next_check_at<=datetime('now'))) GROUP BY q.topic_id`, uid),
    db.all(`SELECT v.topic_id, COUNT(*) n FROM srs_records s JOIN vocabulary v ON v.id=s.vocab_id WHERE s.user_id=? AND s.due_at<=datetime('now') GROUP BY v.topic_id`, uid),
  ]);
  const P = new Map(prog.map((p) => [p.topic_id, p]));
  const mapN = (rows) => new Map(rows.map((r) => [r.topic_id, r.n]));
  const T = mapN(totals), SN = mapN(seen), DM = mapN(dueMist), DV = mapN(dueVocab);
  const out = new Map();
  for (const t of topics) {
    const p = P.get(t.id) || {}, m = mastery.get(t.id);
    const totalQ = T.get(t.id) || 0, seenQ = SN.get(t.id) || 0, dm = DM.get(t.id) || 0, dv = DV.get(t.id) || 0;
    // Tỷ lệ hoàn thành: đã xem lý thuyết (20%) + độ phủ câu hỏi đã làm (80%)
    const completion = Math.round(((p.theory_viewed_at ? 0.2 : 0) + (totalQ ? Math.min(1, seenQ / totalQ) * 0.8 : 0)) * 100);
    let status = 'not_started';
    if (p.theory_viewed_at || m.answered > 0) status = 'in_progress';
    if (p.completed_at) status = 'completed';
    if ((p.completed_at || m.answered >= m.rules.basic_min_questions) && (m.level === 'needs_practice' || dm > 0 || dv > 0)) status = 'needs_review';
    if (m.level === 'mastered' && dm === 0) status = 'mastered';
    out.set(t.id, { status, status_label: STATUS_LABEL[status], completion: p.completed_at ? Math.max(completion, 60) : completion, mastery: m,
      completed_at: p.completed_at || null, theory_viewed_at: p.theory_viewed_at || null, sessions_count: p.sessions_count || 0,
      last_practiced_at: p.last_practiced_at || null, due_mistakes: dm, due_vocab: dv, total_questions: totalQ, seen_questions: seenQ });
  }
  return out;
}
async function topicStatus(uid, topic) { return (await topicStatusMany(uid, [topic])).get(topic.id); }

/* ---------------- Chọn & xáo trộn câu hỏi ---------------- */
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Chọn ngẫu nhiên có trọng số: ưu tiên câu chưa làm / hay sai; giảm câu vừa làm ở phiên trước
async function pickQuestions(uid, pool, count, { recentIds = [], groupDedupe = true } = {}) {
  if (!pool.length) return [];
  const stats = new Map();
  if (uid) {
    const [rows, mist] = await Promise.all([
      db.all(`SELECT question_id, n, c, is_correct last FROM (SELECT question_id, is_correct, COUNT(*) OVER w n, SUM(is_correct) OVER w c,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY id DESC) rn FROM user_answers WHERE user_id=? WINDOW w AS (PARTITION BY question_id)) WHERE rn=1`, uid),
      db.all("SELECT question_id FROM mistakes WHERE user_id=? AND state!='resolved'", uid),
    ]);
    rows.forEach((r) => stats.set(r.question_id, r));
    mist.forEach((m) => { const s = stats.get(m.question_id); if (s) s.mistake = true; });
  }
  const recent = new Set(recentIds);
  const cand = pool.map((q) => {
    const s = stats.get(q.id); let w = 1;
    if (!s) w += 3;
    else { if (s.last === 0) w += 4; if (s.mistake) w += 3; if (s.c >= 3 && s.last === 1) w *= 0.5; }
    if (recent.has(q.id)) w *= 0.25;
    return { q, key: Math.random() ** (1 / w) };
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

async function poolQuery({ topicIds, levelId, difficulty, types, skills, errorTags, verifiedOnly, excludeIds, onlyIds } = {}) {
  const where = ["q.status='published'", 'q.archived=0', 't.archived=0'], args = [];
  if (verifiedOnly) where.push('q.verified=1');
  if (topicIds && topicIds.length) { where.push(`q.topic_id IN (${qs(topicIds.length)})`); args.push(...topicIds); }
  if (levelId) { where.push('t.level_id=?'); args.push(levelId); }
  if (difficulty && difficulty !== 'any' && difficulty !== 'mixed') { where.push('q.difficulty=?'); args.push(Number(difficulty)); }
  if (types && types.length) { where.push(`q.type IN (${qs(types.length)})`); args.push(...types); }
  if (skills && skills.length) { where.push(`q.skill IN (${qs(skills.length)})`); args.push(...skills); }
  if (errorTags && errorTags.length) { where.push(`q.error_tag IN (${qs(errorTags.length)})`); args.push(...errorTags); }
  if (onlyIds) { if (!onlyIds.length) return []; where.push(`q.id IN (${qs(onlyIds.length)})`); args.push(...onlyIds); }
  if (excludeIds && excludeIds.length) { where.push(`q.id NOT IN (${qs(excludeIds.length)})`); args.push(...excludeIds); }
  const rows = await db.all(`SELECT q.id,q.topic_id,q.difficulty,q.type,q.skill,q.data FROM questions q JOIN topics t ON t.id=q.topic_id WHERE ${where.join(' AND ')}`, ...args);
  return rows.map((r) => { const d = J(r.data, {}); return { ...r, vocab_id: d.vocab_id || null, group: d.vocab_id ? 'v' + d.vocab_id : d.group || null }; });
}

// Thứ tự phương án: xáo trộn, tránh đáp án đúng nằm cùng vị trí với 2 câu liền trước
async function buildItems(questions) {
  const map = await loadQuestions(questions.map((q) => q.id));
  const items = [], lastPos = [];
  for (const qq of questions) {
    const q = map.get(qq.id); if (!q) continue;
    let o = [];
    if (['mcq', 'listen', 'error'].includes(q.type)) {
      const keep = q.type === 'error' || q.data.fixed_order;
      let pos = -1;
      for (let tries = 0; tries < 6; tries++) {
        o = keep ? q.options.map((x) => x.id) : shuffle(q.options.map((x) => x.id));
        pos = o.findIndex((id) => q.options.find((x) => x.id === id).is_correct);
        if (keep || !(lastPos.length >= 2 && lastPos.slice(-2).every((p) => p === pos))) break;
      }
      lastPos.push(pos);
    } else if (q.type === 'order') {
      const n = (q.answer.words || []).length, ident = [...Array(n).keys()];
      o = ident;
      for (let tries = 0; tries < 6 && n > 1 && o.join() === ident.join(); tries++) o = shuffle(ident);
    }
    items.push({ q: q.id, o });
  }
  return items;
}

/* ---------------- Sinh đề thi ---------------- */
// Phân bổ đều theo chủ đề để không chủ đề nào chiếm quá nhiều câu; xen kẽ độ khó khi chọn "mixed"
async function generateExamQuestions({ topicIds, levelId, count, difficulty, types, skills, matrix }) {
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
      const pool = await poolQuery({ topicIds: [row.topic_id], difficulty: row.difficulty || 'any', types, skills, verifiedOnly: true });
      const got = take(pool, row.count);
      if (got.length < row.count) problems.push({ topic_id: row.topic_id, difficulty: row.difficulty || 'any', need: row.count, available: got.length });
      out.push(...got);
    }
    return { ids: shuffle(out).map((q) => q.id), problems };
  }
  const pool = await poolQuery({ topicIds, levelId, difficulty, types, skills, verifiedOnly: true });
  if (pool.length < count) return { ids: [], problems: [{ need: count, available: pool.length }] };
  const byTopic = new Map();
  pool.forEach((q) => { if (!byTopic.has(q.topic_id)) byTopic.set(q.topic_id, []); byTopic.get(q.topic_id).push(q); });
  const topics = shuffle([...byTopic.keys()]);
  topics.forEach((t) => byTopic.set(t, shuffle(byTopic.get(t))));
  const diffCycle = difficulty === 'mixed' ? [1, 2, 1, 2, 3] : null;
  const out = []; let guard = 0, ti = 0;
  while (out.length < count && guard++ < count * 50) {
    const list = byTopic.get(topics[ti++ % topics.length]);
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
  DEFAULT_SETTINGS, getSettings, saveSettings, loadQuestion, loadQuestions, publicQuestion, grade, recordAnswers,
  computeMastery, masteryMany, refreshMastery, topicStatus, topicStatusMany, MASTERY_LABEL, STATUS_LABEL,
  pickQuestions, poolQuery, buildItems, generateExamQuestions, shuffle, norm, compact, updateSrs,
};
