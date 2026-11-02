// API quản trị. Toàn bộ router đi qua requireAdmin (kiểm tra quyền ở backend).
const express = require('express');
const { db, J, qs } = require('./db');
const E = require('./engine');
const S = require('./stats');
const EX = require('./exams');
const { requireAdmin, logAdmin } = require('./auth');

const r = express.Router();
r.use(requireAdmin);
const bad = (res, msg, code = 400, extra = {}) => res.status(code).json({ error: msg, ...extra });
const QTYPES = ['mcq', 'listen', 'fill', 'conjugate', 'order', 'translate', 'error', 'write'];
const SKILLS = ['hangul', 'vocab', 'grammar', 'listening', 'reading', 'writing'];
const TAGS = Object.keys(S.TAG_LABEL);

r.get('/meta', async (req, res) => res.json({
  levels: (await db.all('SELECT * FROM levels ORDER BY sort')),
  topics: (await db.all('SELECT id,code,name,grp,level_id,archived FROM topics ORDER BY sort')),
  qtypes: QTYPES, skills: SKILLS, tags: S.TAG_LABEL, groups: S.GRP_LABEL, me: req.user,
}));

/* ---------------- Học liệu: CRUD chung ---------------- */
const RES = {
  levels: { table: 'levels', fields: ['code', 'name', 'description', 'goal', 'sort'], required: ['code', 'name'] },
  topics: { table: 'topics', fields: ['code', 'level_id', 'grp', 'name', 'description', 'source', 'sort', 'mastery_rules'], required: ['code', 'level_id', 'grp', 'name'], json: ['mastery_rules'] },
  lessons: { table: 'lessons', fields: ['topic_id', 'title', 'goal', 'body', 'sort'], required: ['topic_id', 'title'], json: ['body'] },
  vocabulary: { table: 'vocabulary', fields: ['topic_id', 'ko', 'vi', 'note'], required: ['topic_id', 'ko', 'vi'] },
  grammar: { table: 'grammar_points', fields: ['topic_id', 'pattern', 'meaning', 'formula', 'explanation', 'examples', 'mistakes', 'compare'], required: ['topic_id', 'pattern'], json: ['examples', 'mistakes'] },
  passages: { table: 'passages', fields: ['topic_id', 'kind', 'title', 'ko_text', 'vi_text'], required: ['topic_id', 'kind', 'title', 'ko_text'] },
};
async function usage(res, id) {
  const one = async (sql, ...a) => (await db.get(sql, ...a)).n;
  const all = async (o) => Object.fromEntries(await Promise.all(Object.entries(o).map(async ([k, v]) => [k, await v])));
  id = Number(id);
  switch (res) {
    case 'levels': return all({ topics: one('SELECT COUNT(*) n FROM topics WHERE level_id=?', id), exams: one('SELECT COUNT(*) n FROM mock_exams WHERE level_id=?', id) });
    case 'topics': return all({ questions: one('SELECT COUNT(*) n FROM questions WHERE topic_id=?', id), answers: one('SELECT COUNT(*) n FROM user_answers WHERE topic_id=?', id),
      learners: one('SELECT COUNT(*) n FROM topic_progress WHERE topic_id=?', id), lessons: one('SELECT COUNT(*) n FROM lessons WHERE topic_id=?', id), grammar: one('SELECT COUNT(*) n FROM grammar_points WHERE topic_id=?', id), passages: one('SELECT COUNT(*) n FROM passages WHERE topic_id=?', id), vocabulary: one('SELECT COUNT(*) n FROM vocabulary WHERE topic_id=?', id),
      exams: one('SELECT COUNT(*) n FROM mock_exams m WHERE EXISTS (SELECT 1 FROM json_each(m.matrix) j WHERE json_extract(j.value, \'$.topic_id\')=?)', id) });
    case 'vocabulary': return all({ srs_records: one('SELECT COUNT(*) n FROM srs_records WHERE vocab_id=?', id), questions: one("SELECT COUNT(*) n FROM questions WHERE json_extract(data,'$.vocab_id')=?", id) });
    case 'passages': return all({ questions: one("SELECT COUNT(*) n FROM questions WHERE json_extract(data,'$.passage_id')=?", id) });
    case 'questions': return all({ answers: one('SELECT COUNT(*) n FROM user_answers WHERE question_id=?', id), mistakes: one('SELECT COUNT(*) n FROM mistakes WHERE question_id=?', id),
      exams: one('SELECT COUNT(*) n FROM mock_exams m WHERE EXISTS (SELECT 1 FROM json_each(m.question_ids) j WHERE j.value=?)', id),
      writings: one('SELECT COUNT(*) n FROM writing_submissions WHERE question_id=?', id) });
    case 'exams': return all({ attempts: one('SELECT COUNT(*) n FROM exam_attempts WHERE exam_id=?', id) });
    default: return {};
  }
}
const used = (u) => Object.values(u).some((n) => n > 0);

r.get('/usage/:res/:id', async (req, res) => res.json(await usage(req.params.res, Number(req.params.id))));

for (const [name, cfg] of Object.entries(RES)) {
  r.get(`/${name}`, async (req, res) => {
    const w = [], a = [];
    if (!req.query.include_archived) w.push('archived=0');
    if (req.query.topic_id && cfg.fields.includes('topic_id')) { w.push('topic_id=?'); a.push(Number(req.query.topic_id)); }
    if (req.query.level_id && cfg.fields.includes('level_id')) { w.push('level_id=?'); a.push(Number(req.query.level_id)); }
    const rows = (await db.all(`SELECT * FROM ${cfg.table} ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY ${cfg.fields.includes('sort') ? 'sort,' : ''} id LIMIT 1000`, ...a));
    res.json(rows.map((row) => { (cfg.json || []).forEach((f) => { row[f] = J(row[f], row[f]); }); return row; }));
  });
  const clean = (body, isCreate) => {
    const out = {};
    for (const f of cfg.fields) if (body[f] !== undefined) out[f] = (cfg.json || []).includes(f) && typeof body[f] !== 'string' ? JSON.stringify(body[f]) : body[f];
    if (isCreate) for (const f of cfg.required) if (out[f] === undefined || out[f] === '' || out[f] === null) return { error: `Thiếu trường bắt buộc: ${f}` };
    if (out.grp && !SKILLS.includes(out.grp)) return { error: 'Nhóm kiến thức không hợp lệ.' };
    if (out.kind && !['reading', 'listening'].includes(out.kind)) return { error: 'Loại bài không hợp lệ.' };
    return { out };
  };
  r.post(`/${name}`, async (req, res) => {
    const c = clean(req.body || {}, true); if (c.error) return bad(res, c.error);
    try {
      const keys = Object.keys(c.out);
      const id = (await db.run(`INSERT INTO ${cfg.table}(${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, ...keys.map((k) => c.out[k]))).lastInsertRowid;
      await logAdmin(req.user.id, 'create', name, id, c.out);
      res.json({ id });
    } catch (e) { bad(res, /UNIQUE/.test(e.message) ? 'Mã này đã tồn tại.' : 'Không lưu được: ' + e.message); }
  });
  r.put(`/${name}/:id`, async (req, res) => {
    const c = clean(req.body || {}, false); if (c.error) return bad(res, c.error);
    const keys = Object.keys(c.out); if (!keys.length) return bad(res, 'Không có thay đổi.');
    try {
      const ch = (await db.run(`UPDATE ${cfg.table} SET ${keys.map((k) => k + '=?').join(',')} WHERE id=?`, ...keys.map((k) => c.out[k]), req.params.id));
      if (!ch.changes) return bad(res, 'Không tìm thấy bản ghi.', 404);
      await logAdmin(req.user.id, 'update', name, Number(req.params.id), c.out);
      res.json({ ok: true });
    } catch (e) { bad(res, /UNIQUE/.test(e.message) ? 'Mã này đã tồn tại.' : 'Không lưu được: ' + e.message); }
  });
  // Xoá an toàn: dữ liệu đã dùng trong lịch sử học tập chỉ được lưu trữ (ẩn), không xoá cứng
  r.delete(`/${name}/:id`, async (req, res) => {
    const id = Number(req.params.id);
    const u = await usage(name, id);
    if (used(u) || req.query.mode === 'archive') {
      (await db.run(`UPDATE ${cfg.table} SET archived=1 WHERE id=?`, id));
      await logAdmin(req.user.id, 'archive', name, id, u);
      return res.json({ archived: true, usage: u });
    }
    (await db.run(`DELETE FROM ${cfg.table} WHERE id=?`, id));
    await logAdmin(req.user.id, 'delete', name, id);
    res.json({ deleted: true });
  });
  r.post(`/${name}/:id/restore`, async (req, res) => {
    (await db.run(`UPDATE ${cfg.table} SET archived=0 WHERE id=?`, req.params.id));
    await logAdmin(req.user.id, 'restore', name, Number(req.params.id));
    res.json({ ok: true });
  });
}

/* ---------------- Ngân hàng câu hỏi ---------------- */
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
async function validateQuestion(q, opts) {
  if (!QTYPES.includes(q.type)) return 'Loại câu hỏi không hợp lệ.';
  if (!q.prompt || !String(q.prompt).trim()) return 'Câu hỏi chưa có nội dung.';
  if (!(await db.get('SELECT 1 FROM topics WHERE id=?', q.topic_id))) return 'Chủ đề không hợp lệ.';
  if (!SKILLS.includes(q.skill)) return 'Kỹ năng không hợp lệ.';
  if (!TAGS.includes(q.error_tag)) return 'Nhóm lỗi không hợp lệ.';
  if (![1, 2, 3].includes(Number(q.difficulty))) return 'Độ khó phải là 1, 2 hoặc 3.';
  if (['mcq', 'listen', 'error'].includes(q.type)) {
    if (!opts || opts.filter((o) => String(o.text || '').trim()).length < 2) return 'Cần ít nhất 2 phương án.';
    if (opts.filter((o) => o.is_correct).length !== 1) return 'Phải có đúng 1 phương án đúng.';
    const texts = opts.map((o) => strip(o.text)); if (new Set(texts).size !== texts.length) return 'Các phương án bị trùng nhau.';
  }
  if (q.type === 'listen' && !(q.data && q.data.say)) return 'Câu nghe cần nội dung đọc (data.say).';
  if (['fill', 'conjugate', 'translate'].includes(q.type) && !(q.answer && Array.isArray(q.answer.accepted) && q.answer.accepted.filter(Boolean).length)) return 'Cần ít nhất một đáp án chấp nhận.';
  if (q.type === 'order' && !(q.answer && Array.isArray(q.answer.words) && q.answer.words.length >= 2)) return 'Câu sắp xếp cần ít nhất 2 từ theo đúng thứ tự.';
  if (q.type === 'write' && !(q.data && q.data.rubric && Array.isArray(q.data.rubric.criteria) && q.data.rubric.criteria.length)) return 'Câu viết cần tiêu chí chấm (rubric).';
  return null;
}
async function findDuplicate(q, opts, exceptId) {
  const key = strip(q.prompt) + '|' + (opts || []).map((o) => strip(o.text)).sort().join('|');
  const rows = await db.all('SELECT id,code,prompt FROM questions WHERE topic_id=? AND archived=0 AND id!=?', q.topic_id, exceptId || 0);
  if (!rows.length) return null;
  const o2 = await db.all(`SELECT question_id, text FROM question_options WHERE question_id IN (${qs(rows.length)})`, ...rows.map((x) => x.id));
  for (const r0 of rows) if (strip(r0.prompt) + '|' + o2.filter((o) => o.question_id === r0.id).map((o) => strip(o.text)).sort().join('|') === key) return r0;
  return null;
}

r.get('/questions', async (req, res) => {
  const w = ['1=1'], a = [];
  const Q = req.query;
  if (!Q.include_archived) w.push('q.archived=0');
  if (Q.topic_id) { w.push('q.topic_id=?'); a.push(Number(Q.topic_id)); }
  if (Q.level_id) { w.push('t.level_id=?'); a.push(Number(Q.level_id)); }
  if (Q.type) { w.push('q.type=?'); a.push(Q.type); }
  if (Q.status) { w.push('q.status=?'); a.push(Q.status); }
  if (Q.verified === '0' || Q.verified === '1') { w.push('q.verified=?'); a.push(Number(Q.verified)); }
  if (Q.difficulty) { w.push('q.difficulty=?'); a.push(Number(Q.difficulty)); }
  if (Q.q) { w.push('(q.prompt LIKE ? OR q.code LIKE ? OR EXISTS (SELECT 1 FROM question_options o WHERE o.question_id=q.id AND o.text LIKE ?))'); a.push(`%${Q.q}%`, `%${Q.q}%`, `%${Q.q}%`); }
  const size = Math.min(100, Number(Q.size) || 30), page = Math.max(1, Number(Q.page) || 1);
  const total = (await db.get(`SELECT COUNT(*) n FROM questions q JOIN topics t ON t.id=q.topic_id WHERE ${w.join(' AND ')}`, ...a)).n;
  const rows = (await db.all(`SELECT q.id,q.code,q.type,q.prompt,q.skill,q.error_tag,q.difficulty,q.status,q.verified,q.archived,q.updated_at,t.name topic,
      (SELECT COUNT(*) FROM user_answers u WHERE u.question_id=q.id) answers, (SELECT AVG(is_correct) FROM user_answers u WHERE u.question_id=q.id) acc
    FROM questions q JOIN topics t ON t.id=q.topic_id WHERE ${w.join(' AND ')} ORDER BY q.id DESC LIMIT ? OFFSET ?`, ...a, size, (page - 1) * size));
  res.json({ total, page, size, rows });
});
r.get('/questions/duplicates', async (req, res) => {
  const [all, opts] = await Promise.all([
    db.all('SELECT q.id,q.code,q.prompt,q.topic_id,t.name topic FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.archived=0'),
    db.all('SELECT question_id, text FROM question_options'),
  ]);
  const O = new Map(); opts.forEach((o) => { if (!O.has(o.question_id)) O.set(o.question_id, []); O.get(o.question_id).push(strip(o.text)); });
  const groups = new Map();
  all.forEach((q) => { const k = q.topic_id + '|' + strip(q.prompt) + '|' + (O.get(q.id) || []).sort().join('|'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(q); });
  res.json([...groups.values()].filter((g) => g.length > 1));
});
r.get('/questions/:id', async (req, res) => {
  const q = await E.loadQuestion(Number(req.params.id));
  if (!q) return bad(res, 'Không tìm thấy câu hỏi.', 404);
  const stats = (await db.get('SELECT COUNT(*) n, AVG(is_correct) acc FROM user_answers WHERE question_id=?', q.id));
  res.json({ ...q, preview: E.publicQuestion(q), usage: await usage('questions', q.id), stats });
});
function optionStmts(qid, opts) {
  return [['DELETE FROM question_options WHERE question_id=?', [qid]], ...(opts || []).filter((o) => String(o.text || '').trim())
    .map((o, i) => ['INSERT INTO question_options(question_id,text,is_correct,feedback,sort) VALUES (?,?,?,?,?)', [qid, String(o.text).trim(), o.is_correct ? 1 : 0, o.feedback || null, i]])];
}
function normQ(b) {
  return { topic_id: Number(b.topic_id), type: b.type, prompt: String(b.prompt || '').trim(), data: b.data || {}, answer: b.answer || {}, explanation: String(b.explanation || ''),
    skill: b.skill, error_tag: b.error_tag, difficulty: Number(b.difficulty) || 1, status: b.status || 'draft', verified: b.verified ? 1 : 0 };
}
r.post('/questions', async (req, res) => {
  const q = normQ(req.body || {}); const opts = req.body.options || [];
  const err = await validateQuestion(q, opts); if (err) return bad(res, err);
  if (q.status === 'published' && !q.verified) return bad(res, 'Cần xác minh đáp án trước khi xuất bản.');
  const dup = await findDuplicate(q, opts);
  if (dup && !req.body.allow_duplicate) return bad(res, `Câu hỏi trùng với ${dup.code}.`, 409, { duplicate: dup });
  const t = (await db.get('SELECT code FROM topics WHERE id=?', q.topic_id));
  const n = (await db.get("SELECT COUNT(*) n FROM questions WHERE code LIKE ?", `${t.code}-AD-%`)).n + 1;
  let code = `${t.code}-AD-${String(n).padStart(3, '0')}`;
  while ((await db.get('SELECT 1 FROM questions WHERE code=?', code))) code += 'x';
  const id = (await db.run(`INSERT INTO questions(code,topic_id,type,prompt,data,answer,explanation,skill,error_tag,difficulty,status,verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    code, q.topic_id, q.type, q.prompt, JSON.stringify(q.data), JSON.stringify(q.answer), q.explanation, q.skill, q.error_tag, q.difficulty, q.status, q.verified)).lastInsertRowid;
  await db.batch(optionStmts(id, opts));
  await logAdmin(req.user.id, 'create', 'questions', id, { code, status: q.status });
  res.json({ id, code });
});
r.put('/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const old = await E.loadQuestion(id); if (!old) return bad(res, 'Không tìm thấy câu hỏi.', 404);
  const q = normQ({ ...old, ...req.body }); const opts = req.body.options || old.options;
  const err = await validateQuestion(q, opts); if (err) return bad(res, err);
  // Đổi nội dung chấm điểm → phải xác minh lại; câu đang xuất bản chuyển về "cần xác minh"
  const sig = (x, o) => JSON.stringify([x.type, x.answer, (o || []).map((y) => [String(y.text).trim(), !!y.is_correct]), x.data && x.data.rubric, x.data && x.data.say]);
  const answerChanged = sig(old, old.options) !== sig(q, opts);
  let note = null;
  if (answerChanged && old.verified && !req.body.verified_after_edit) { q.verified = 0; if (q.status === 'published') { q.status = 'review'; note = 'Đáp án đã thay đổi nên câu hỏi chuyển về trạng thái “Cần xác minh”.'; } }
  if (q.status === 'published' && !q.verified) return bad(res, 'Cần xác minh đáp án trước khi xuất bản.');
  if (await findDuplicate(q, opts, id) && !req.body.allow_duplicate) return bad(res, 'Nội dung trùng với một câu hỏi khác trong cùng chủ đề.', 409);
  await db.batch([[`UPDATE questions SET topic_id=?,type=?,prompt=?,data=?,answer=?,explanation=?,skill=?,error_tag=?,difficulty=?,status=?,verified=?,updated_at=datetime('now') WHERE id=?`,
    [q.topic_id, q.type, q.prompt, JSON.stringify(q.data), JSON.stringify(q.answer), q.explanation, q.skill, q.error_tag, q.difficulty, q.status, q.verified, id]],
    ...(req.body.options ? optionStmts(id, opts) : [])]);
  await logAdmin(req.user.id, 'update', 'questions', id, { answerChanged, status: q.status });
  res.json({ ok: true, note, status: q.status, verified: q.verified });
});
r.post('/questions/:id/verify', async (req, res) => {
  const v = req.body && req.body.verified ? 1 : 0;
  const q = (await db.get('SELECT status FROM questions WHERE id=?', req.params.id)); if (!q) return bad(res, 'Không tìm thấy câu hỏi.', 404);
  (await db.run(`UPDATE questions SET verified=?, status=CASE WHEN ?=0 AND status='published' THEN 'review' ELSE status END, updated_at=datetime('now') WHERE id=?`, v, v, req.params.id));
  await logAdmin(req.user.id, v ? 'verify' : 'unverify', 'questions', Number(req.params.id));
  res.json({ ok: true });
});
r.post('/questions/:id/status', async (req, res) => {
  const st = req.body && req.body.status;
  if (!['draft', 'review', 'published', 'hidden'].includes(st)) return bad(res, 'Trạng thái không hợp lệ.');
  const q = await E.loadQuestion(Number(req.params.id)); if (!q) return bad(res, 'Không tìm thấy câu hỏi.', 404);
  if (st === 'published') { if (!q.verified) return bad(res, 'Cần xác minh đáp án trước khi xuất bản.'); const e = await validateQuestion(q, q.options); if (e) return bad(res, e); }
  (await db.run("UPDATE questions SET status=?, updated_at=datetime('now') WHERE id=?", st, q.id));
  await logAdmin(req.user.id, 'status:' + st, 'questions', q.id);
  res.json({ ok: true });
});
r.delete('/questions/:id', async (req, res) => {
  const id = Number(req.params.id); const u = await usage('questions', id);
  if (used(u) || req.query.mode === 'archive') { (await db.run("UPDATE questions SET archived=1, status='hidden' WHERE id=?", id)); await logAdmin(req.user.id, 'archive', 'questions', id, u); return res.json({ archived: true, usage: u }); }
  await db.batch([['DELETE FROM question_options WHERE question_id=?', [id]], ['DELETE FROM questions WHERE id=?', [id]]]); await logAdmin(req.user.id, 'delete', 'questions', id);
  res.json({ deleted: true });
});

/* ---------------- Đề thi ---------------- */
const examOut = (e) => ({ ...e, matrix: J(e.matrix, []), question_ids: J(e.question_ids, []), config: J(e.config, {}), open_at: EX.iso(e.open_at), close_at: EX.iso(e.close_at) });
const toDb = (s) => (s ? new Date(s).toISOString().replace('T', ' ').slice(0, 19) : null);
r.get('/exams', async (req, res) => {
  const kind = req.query.kind === 'custom' ? 'custom' : 'official';
  res.json((await db.all(`SELECT e.*, (SELECT COUNT(*) FROM exam_attempts a WHERE a.exam_id=e.id AND a.status IN ('submitted','auto_submitted')) attempts,
    (SELECT AVG(score) FROM exam_attempts a WHERE a.exam_id=e.id AND a.status IN ('submitted','auto_submitted')) avg FROM mock_exams e WHERE e.kind=? ORDER BY e.id DESC LIMIT 200`, kind)).map(examOut));
});
r.get('/exams/:id', async (req, res) => {
  const e = (await db.get('SELECT * FROM mock_exams WHERE id=?', req.params.id)); if (!e) return bad(res, 'Không tìm thấy đề.', 404);
  const ids = J(e.question_ids, []);
  const qs = ids.length ? (await db.all(`SELECT q.id,q.code,q.type,q.prompt,q.difficulty,q.status,q.verified,t.name topic FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.id IN (${ids.map(() => '?').join(',')})`, ...ids)) : [];
  res.json({ ...examOut(e), questions: qs, usage: await usage('exams', e.id) });
});
function examPayload(b) {
  return { title: String(b.title || '').trim(), description: b.description || '', level_id: Number(b.level_id) || null, scope: b.scope || '',
    matrix: JSON.stringify((b.matrix || []).filter((m) => m.topic_id && m.count > 0).map((m) => ({ topic_id: Number(m.topic_id), count: Number(m.count), difficulty: m.difficulty && m.difficulty !== 'any' ? Number(m.difficulty) : undefined }))),
    question_ids: JSON.stringify([...new Set((b.question_ids || []).map(Number).filter(Boolean))]), duration_min: Math.max(1, Number(b.duration_min) || 20),
    pass_score: b.pass_score === '' || b.pass_score == null ? null : Number(b.pass_score), show_answers: b.show_answers ? 1 : 0, open_at: toDb(b.open_at), close_at: toDb(b.close_at) };
}
r.post('/exams', async (req, res) => {
  const p = examPayload(req.body || {}); if (!p.title) return bad(res, 'Đề thi cần có tên.');
  const id = (await db.run(`INSERT INTO mock_exams(title,description,kind,level_id,scope,matrix,question_ids,duration_min,pass_score,show_answers,open_at,close_at,status,created_by)
    VALUES (?,?,'official',?,?,?,?,?,?,?,?,?,'draft',?)`, p.title, p.description, p.level_id, p.scope, p.matrix, p.question_ids, p.duration_min, p.pass_score, p.show_answers, p.open_at, p.close_at, req.user.id)).lastInsertRowid;
  await logAdmin(req.user.id, 'create', 'exams', id, { title: p.title });
  res.json({ id });
});
r.put('/exams/:id', async (req, res) => {
  const e = (await db.get('SELECT * FROM mock_exams WHERE id=?', req.params.id)); if (!e) return bad(res, 'Không tìm thấy đề.', 404);
  const p = examPayload({ ...examOut(e), ...req.body }); if (!p.title) return bad(res, 'Đề thi cần có tên.');
  (await db.run(`UPDATE mock_exams SET title=?,description=?,level_id=?,scope=?,matrix=?,question_ids=?,duration_min=?,pass_score=?,show_answers=?,open_at=?,close_at=? WHERE id=?`, p.title, p.description, p.level_id, p.scope, p.matrix, p.question_ids, p.duration_min, p.pass_score, p.show_answers, p.open_at, p.close_at, e.id));
  await logAdmin(req.user.id, 'update', 'exams', e.id);
  res.json({ ok: true, has_attempts: (await usage('exams', e.id)).attempts > 0 });
});
r.post('/exams/:id/generate', async (req, res) => {
  const e = (await db.get('SELECT * FROM mock_exams WHERE id=?', req.params.id)); if (!e) return bad(res, 'Không tìm thấy đề.', 404);
  const matrix = J(e.matrix, []); if (!matrix.length) return bad(res, 'Đề chưa có ma trận chủ đề.');
  const gen = await E.generateExamQuestions({ matrix, types: EX.EXAM_TYPES });
  (await db.run('UPDATE mock_exams SET question_ids=? WHERE id=?', JSON.stringify(gen.ids), e.id));
  await logAdmin(req.user.id, 'generate', 'exams', e.id, { count: gen.ids.length });
  res.json({ count: gen.ids.length, problems: gen.problems });
});
r.post('/exams/:id/status', async (req, res) => {
  const st = req.body && req.body.status;
  if (!['draft', 'published', 'archived'].includes(st)) return bad(res, 'Trạng thái không hợp lệ.');
  const e = (await db.get('SELECT * FROM mock_exams WHERE id=?', req.params.id)); if (!e) return bad(res, 'Không tìm thấy đề.', 404);
  if (st === 'published') {
    const ids = J(e.question_ids, []);
    if (!ids.length) return bad(res, 'Đề chưa có câu hỏi.');
    const badQ = (await db.all(`SELECT code FROM questions WHERE id IN (${ids.map(() => '?').join(',')}) AND (verified=0 OR status!='published' OR archived=1)`, ...ids));
    if (badQ.length) return bad(res, `Có ${badQ.length} câu chưa xác minh hoặc chưa xuất bản: ${badQ.slice(0, 5).map((x) => x.code).join(', ')}…`);
  }
  (await db.run('UPDATE mock_exams SET status=? WHERE id=?', st, e.id));
  await logAdmin(req.user.id, 'status:' + st, 'exams', e.id);
  res.json({ ok: true });
});
r.get('/exams/:id/stats', async (req, res) => {
  const e = (await db.get('SELECT * FROM mock_exams WHERE id=?', req.params.id)); if (!e) return bad(res, 'Không tìm thấy đề.', 404);
  const atts = (await db.all(`SELECT a.id,a.status,a.score,a.correct,a.total,a.started_at,a.submitted_at,u.display_name,u.username FROM exam_attempts a JOIN users u ON u.id=a.user_id WHERE a.exam_id=? ORDER BY a.id DESC`, e.id));
  const done = atts.filter((a) => a.status === 'submitted' || a.status === 'auto_submitted');
  const perQ = (await db.all(`SELECT q.code, q.prompt, COUNT(*) n, AVG(u.is_correct) acc FROM user_answers u JOIN questions q ON q.id=u.question_id
    WHERE u.attempt_id IN (SELECT id FROM exam_attempts WHERE exam_id=?) GROUP BY q.id ORDER BY acc`, e.id));
  const dist = Array(10).fill(0); done.forEach((a) => dist[Math.min(9, Math.floor(a.score / 10))]++);
  res.json({ exam: examOut(e), attempts: atts.map((a) => ({ ...a, started_at: EX.iso(a.started_at), submitted_at: EX.iso(a.submitted_at) })),
    avg: done.length ? done.reduce((s, a) => s + a.score, 0) / done.length : null,
    pass_rate: done.length && e.pass_score != null ? done.filter((a) => a.score >= e.pass_score).length / done.length : null, per_question: perQ, distribution: dist });
});
r.delete('/exams/:id', async (req, res) => {
  const id = Number(req.params.id); const u = await usage('exams', id);
  if (u.attempts > 0) { (await db.run("UPDATE mock_exams SET status='archived' WHERE id=?", id)); await logAdmin(req.user.id, 'archive', 'exams', id, u); return res.json({ archived: true, usage: u }); }
  (await db.run('DELETE FROM mock_exams WHERE id=?', id)); await logAdmin(req.user.id, 'delete', 'exams', id);
  res.json({ deleted: true });
});

/* ---------------- Người dùng ---------------- */
r.get('/users', async (req, res) => {
  const w = ['1=1'], a = [];
  if (req.query.q) { w.push('(u.username LIKE ? OR u.display_name LIKE ?)'); a.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  if (req.query.role) { w.push('u.role=?'); a.push(req.query.role); }
  if (req.query.status) { w.push('u.status=?'); a.push(req.query.status); }
  res.json((await db.all(`SELECT u.id,u.username,u.display_name,u.role,u.status,u.created_at,u.last_login_at,
      (SELECT COUNT(*) FROM user_answers x WHERE x.user_id=u.id) answers, (SELECT AVG(is_correct) FROM user_answers x WHERE x.user_id=u.id) acc,
      (SELECT COUNT(*) FROM topic_progress p WHERE p.user_id=u.id AND p.completed_at IS NOT NULL) topics_done,
      (SELECT COUNT(*) FROM exam_attempts e WHERE e.user_id=u.id AND e.status IN ('submitted','auto_submitted')) exams
    FROM users u WHERE ${w.join(' AND ')} ORDER BY u.id DESC LIMIT 500`, ...a)).map((u) => ({ ...u, created_at: EX.iso(u.created_at), last_login_at: EX.iso(u.last_login_at) })));
});
r.get('/users/:id', async (req, res) => { const d = await S.userDetail(Number(req.params.id)); if (!d) return bad(res, 'Không tìm thấy người dùng.', 404); res.json(d); });
r.put('/users/:id/status', async (req, res) => {
  const id = Number(req.params.id), st = req.body && req.body.status;
  if (!['active', 'locked'].includes(st)) return bad(res, 'Trạng thái không hợp lệ.');
  if (id === req.user.id) return bad(res, 'Bạn không thể tự khoá tài khoản của mình.');
  (await db.run('UPDATE users SET status=? WHERE id=?', st, id));
  if (st === 'locked') (await db.run('DELETE FROM auth_sessions WHERE user_id=?', id));
  await logAdmin(req.user.id, 'user:' + st, 'users', id);
  res.json({ ok: true });
});
r.put('/users/:id/role', async (req, res) => {
  const id = Number(req.params.id), role = req.body && req.body.role;
  if (!['learner', 'admin'].includes(role)) return bad(res, 'Vai trò không hợp lệ.');
  if (id === req.user.id) return bad(res, 'Bạn không thể tự đổi vai trò của mình.');
  (await db.run('UPDATE users SET role=? WHERE id=?', role, id));
  await logAdmin(req.user.id, 'user:role:' + role, 'users', id);
  res.json({ ok: true });
});

/* ---------------- Bài viết ---------------- */
r.get('/writing', async (req, res) => {
  res.json((await db.all(`SELECT w.id,w.text,w.auto_score,w.rubric_result,w.created_at,u.display_name,u.username,q.prompt,q.code,
      (SELECT comment FROM writing_feedback f WHERE f.submission_id=w.id ORDER BY f.id DESC LIMIT 1) feedback
    FROM writing_submissions w JOIN users u ON u.id=w.user_id JOIN questions q ON q.id=w.question_id
    ${req.query.pending ? 'WHERE NOT EXISTS (SELECT 1 FROM writing_feedback f WHERE f.submission_id=w.id)' : ''} ORDER BY w.id DESC LIMIT 200`))
    .map((w) => ({ ...w, rubric_result: J(w.rubric_result, []), created_at: EX.iso(w.created_at) })));
});
r.post('/writing/:id/feedback', async (req, res) => {
  const c = String((req.body && req.body.comment) || '').trim(); if (!c) return bad(res, 'Nhận xét không được để trống.');
  if (!(await db.get('SELECT 1 FROM writing_submissions WHERE id=?', req.params.id))) return bad(res, 'Không tìm thấy bài viết.', 404);
  (await db.run('INSERT INTO writing_feedback(submission_id,admin_id,comment,score) VALUES (?,?,?,?)', req.params.id, req.user.id, c.slice(0, 2000), req.body.score != null && req.body.score !== '' ? Number(req.body.score) : null));
  await logAdmin(req.user.id, 'feedback', 'writing', Number(req.params.id));
  res.json({ ok: true });
});

/* ---------------- Báo cáo ---------------- */
r.get('/reports', async (req, res) => res.json(await S.adminReport(req.query)));
const csvCell = (v) => { if (v == null) return ''; const s = typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(3) : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
r.get('/reports/export', async (req, res) => {
  const rep = await S.adminReport(req.query);
  const type = req.query.type || 'topics';
  let rows, head;
  if (type === 'topics') { head = ['Chủ đề', 'Nhóm', 'Cấp độ', 'Lượt trả lời', 'Người học', 'Tỷ lệ đúng', 'Tỷ lệ sai', 'Đã hoàn thành', 'Đã luyện', 'Thành thạo', 'Tỷ lệ thành thạo'];
    rows = rep.topics.map((t) => [t.name, t.grp, t.level, t.answers, t.users, t.acc, t.wrong_rate, t.completed, t.practiced, t.mastered, t.mastery_rate]); }
  else if (type === 'exams') { head = ['Đề thi', 'Loại', 'Lượt thi', 'Người thi', 'Điểm TB', 'Thấp nhất', 'Cao nhất', 'Điểm đạt', 'Số lượt đạt'];
    rows = rep.exams.map((e) => [e.title, e.kind, e.attempts, e.users, e.avg, e.min, e.max, e.pass_score, e.passed]); }
  else if (type === 'daily') { head = ['Ngày', 'Người học hoạt động', 'Số câu trả lời']; rows = rep.daily.map((d) => [d.day, d.users, d.answers]); }
  else if (type === 'attempts') { head = ['Mã lượt', 'Người học', 'Đề thi', 'Trạng thái', 'Điểm', 'Đúng', 'Tổng', 'Bắt đầu (UTC)', 'Nộp (UTC)'];
    rows = (await db.all(`SELECT a.id,u.username,e.title,a.status,a.score,a.correct,a.total,a.started_at,a.submitted_at FROM exam_attempts a JOIN users u ON u.id=a.user_id JOIN mock_exams e ON e.id=a.exam_id
      WHERE a.started_at BETWEEN ? AND ? ${rep.filters.exam_id ? 'AND a.exam_id=' + rep.filters.exam_id : ''} ORDER BY a.id`, rep.range.from + ' 00:00:00', rep.range.to + ' 23:59:59')).map((x) => Object.values(x)); }
  else if (type === 'users') { head = ['Tên đăng nhập', 'Tên hiển thị', 'Trạng thái', 'Ngày tạo', 'Lần đăng nhập cuối', 'Số câu đã làm', 'Tỷ lệ đúng', 'Chủ đề hoàn thành', 'Lượt thi'];
    rows = (await db.raw(`SELECT u.username,u.display_name,u.status,u.created_at,u.last_login_at,(SELECT COUNT(*) FROM user_answers x WHERE x.user_id=u.id),(SELECT AVG(is_correct) FROM user_answers x WHERE x.user_id=u.id),
      (SELECT COUNT(*) FROM topic_progress p WHERE p.user_id=u.id AND p.completed_at IS NOT NULL),(SELECT COUNT(*) FROM exam_attempts e WHERE e.user_id=u.id AND e.status IN ('submitted','auto_submitted'))
      FROM users u WHERE u.role='learner' ORDER BY u.id`)); }
  else return bad(res, 'Loại báo cáo không hợp lệ.');
  await logAdmin(req.user.id, 'export', 'reports', null, { type, range: rep.range });
  const csv = '﻿' + [head, ...rows].map((r0) => r0.map(csvCell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="bao-cao-${type}-${rep.range.from}_${rep.range.to}.csv"`);
  res.send(csv);
});

/* ---------------- Cài đặt & nhật ký ---------------- */
r.get('/settings', async (req, res) => res.json({ settings: await E.getSettings(), defaults: E.DEFAULT_SETTINGS }));
r.put('/settings', async (req, res) => {
  const cur = await E.getSettings(); const b = req.body || {};
  const m = { ...cur.mastery };
  for (const k of Object.keys(E.DEFAULT_SETTINGS.mastery)) if (b.mastery && b.mastery[k] != null) {
    const v = Number(b.mastery[k]); if (!Number.isFinite(v) || v < 0) return bad(res, `Giá trị không hợp lệ: ${k}`);
    if (k.endsWith('accuracy') && v > 1) return bad(res, 'Tỷ lệ chính xác nhập dạng 0–1 (ví dụ 0.85).');
    m[k] = v;
  }
  const next = { ...cur, mastery: m };
  if (b.writing_pass != null) next.writing_pass = Math.min(1, Math.max(0, Number(b.writing_pass)));
  if (b.exam_grace_seconds != null) next.exam_grace_seconds = Math.min(120, Math.max(0, Number(b.exam_grace_seconds)));
  await E.saveSettings(next);
  await logAdmin(req.user.id, 'settings', 'settings', null, next);
  res.json({ ok: true, settings: next });
});
r.get('/logs', async (req, res) => res.json((await db.all(`SELECT l.*, u.username FROM admin_logs l JOIN users u ON u.id=l.admin_id ORDER BY l.id DESC LIMIT ?`, Math.min(500, Number(req.query.limit) || 100)))
  .map((l) => ({ ...l, at: EX.iso(l.at) }))));

module.exports = r;
