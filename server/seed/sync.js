// Đồng bộ học liệu theo phiên bản: áp nội dung mong muốn (build.js) lên DB hiện có.
//  - Thêm bản ghi mới, cập nhật bản ghi do hệ thống tạo nếu nội dung đổi.
//  - Bản ghi admin đã sửa tay (hash hiện tại ≠ seed_hash) thì giữ nguyên.
//  - Bản ghi hệ thống không còn trong nội dung mới → lưu trữ (archived), KHÔNG xoá, để giữ lịch sử học tập.
//  - Bản ghi admin tự tạo (seed_hash NULL) không bị động tới.
const crypto = require('crypto');
const { db, J } = require('../db');

const h = (o) => crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex');
const LEGACY = 'legacy';

// Dạng chuẩn để so sánh (cùng cho bản ghi mong muốn và bản ghi trong DB)
const canon = {
  topics: (r) => [r.code, r.level_id, r.grp, r.name, r.description || null, r.source || null, r.sort, r.unit ?? null, r.mastery_rules || null],
  lessons: (r) => [r.topic_id, r.title, r.goal || null, typeof r.body === 'string' ? J(r.body, {}) : r.body, r.sort],
  grammar_points: (r) => [r.topic_id, r.pattern, r.meaning || null, r.formula || null, r.explanation || null, typeof r.examples === 'string' ? J(r.examples, []) : r.examples, typeof r.mistakes === 'string' ? J(r.mistakes, []) : r.mistakes, r.compare || null],
  vocabulary: (r) => [r.topic_id, r.ko, r.vi, r.note || null],
  passages: (r) => [r.topic_id, r.kind, r.title, r.ko_text, r.vi_text || null],
  questions: (r) => [r.topic_id, r.type, r.prompt, typeof r.data === 'string' ? J(r.data, {}) : r.data, typeof r.answer === 'string' ? J(r.answer, {}) : r.answer,
    r.explanation || '', r.skill, r.error_tag, r.difficulty, r.status, r.verified, (r.options || []).map((o) => [o.text, o.is_correct ? 1 : 0, o.feedback || null])],
};
const COLS = {
  topics: ['code', 'level_id', 'grp', 'name', 'description', 'source', 'sort', 'unit', 'mastery_rules'],
  lessons: ['topic_id', 'title', 'goal', 'body', 'sort'],
  grammar_points: ['topic_id', 'pattern', 'meaning', 'formula', 'explanation', 'examples', 'mistakes', 'compare'],
  vocabulary: ['topic_id', 'ko', 'vi', 'note'],
  passages: ['topic_id', 'kind', 'title', 'ko_text', 'vi_text'],
  questions: ['code', 'topic_id', 'type', 'prompt', 'data', 'answer', 'explanation', 'skill', 'error_tag', 'difficulty', 'status', 'verified'],
};
const JSONF = { lessons: ['body'], grammar_points: ['examples', 'mistakes'], questions: ['data', 'answer'] };
const val = (table, k, v) => ((JSONF[table] || []).includes(k) && typeof v !== 'string' ? JSON.stringify(v) : v ?? null);

async function nextIds() {
  const out = {};
  for (const t of ['levels', 'topics', 'lessons', 'grammar_points', 'vocabulary', 'passages', 'questions', 'question_options']) out[t] = ((await db.get(`SELECT MAX(id) m FROM ${t}`)).m || 0);
  return out;
}

async function syncContent(D, { log = console.log } = {}) {
  const W = [];
  const seq = await nextIds();
  const stats = { insert: 0, update: 0, keep: 0, archive: 0 };

  // Cấp độ (khoá: code)
  const lv = new Map((await db.all('SELECT * FROM levels')).map((r) => [r.code, r]));
  const levelId = {};
  D.levels.forEach((l, i) => {
    const ex = lv.get(l.code);
    if (ex) { levelId[l.code] = ex.id; W.push(['UPDATE levels SET name=?, description=?, goal=?, sort=?, archived=0 WHERE id=?', [l.name, l.description, l.goal, i, ex.id]]); }
    else { const id = ++seq.levels; levelId[l.code] = id; W.push(['INSERT INTO levels(id,code,name,description,goal,sort) VALUES (?,?,?,?,?,?)', [id, l.code, l.name, l.description, l.goal, i]]); }
  });

  // Hàm áp dụng chung cho một bảng có khoá tự nhiên
  async function apply(table, desired, keyOf, rows) {
    const existing = new Map(rows.map((r) => [keyOf(r), r]));
    const ids = new Map();
    const seen = new Set();
    for (const d of desired) {
      const k = keyOf(d); seen.add(k);
      const ex = existing.get(k);
      const hash = h(canon[table](d));
      if (!ex) {
        const id = ++seq[table]; ids.set(k, id); d.id = id;
        W.push([`INSERT INTO ${table}(id,${COLS[table].join(',')},seed_hash) VALUES (?,${COLS[table].map(() => '?').join(',')},?)`, [id, ...COLS[table].map((c) => val(table, c, d[c])), hash]]);
        stats.insert++; d._new = true;
      } else {
        ids.set(k, ex.id); d.id = ex.id;
        const cur = h(canon[table](ex));
        const untouched = ex.seed_hash === LEGACY || ex.seed_hash === cur;
        if (ex.seed_hash && untouched && (cur !== hash || ex.archived)) {
          W.push([`UPDATE ${table} SET ${COLS[table].map((c) => c + '=?').join(',')}, seed_hash=?, archived=0 WHERE id=?`, [...COLS[table].map((c) => val(table, c, d[c])), hash, ex.id]]);
          stats.update++; d._updated = true;
        } else { if (ex.seed_hash === LEGACY) W.push([`UPDATE ${table} SET seed_hash=? WHERE id=?`, [hash, ex.id]]); stats.keep++; }
      }
    }
    for (const [k, ex] of existing) if (!seen.has(k) && ex.seed_hash && !ex.archived) {
      W.push([`UPDATE ${table} SET archived=1${table === 'questions' ? ", status='hidden'" : ''} WHERE id=?`, [ex.id]]); stats.archive++;
    }
    return ids;
  }

  // Chủ đề (khoá: code)
  D.topics.forEach((t) => { t.level_id = levelId[t.level]; t.mastery_rules = t.rules ? JSON.stringify(t.rules) : null; });
  const topicId = await apply('topics', D.topics, (r) => r.code, await db.all('SELECT * FROM topics'));
  const tid = (code) => { const id = topicId.get(code); if (!id) throw new Error('Thiếu chủ đề ' + code); return id; };
  const topicCodeById = new Map([...topicId].map(([c, i]) => [i, c]));

  D.lessons.forEach((l) => { l.topic_id = tid(l.topic); });
  await apply('lessons', D.lessons, (r) => `${r.topic_id}|${r.title}`, await db.all('SELECT * FROM lessons'));
  D.grammar.forEach((g) => { g.topic_id = tid(g.topic); });
  await apply('grammar_points', D.grammar, (r) => `${r.topic_id}|${r.pattern}`, await db.all('SELECT * FROM grammar_points'));
  D.vocab.forEach((v) => { v.topic_id = tid(v.topic); });
  const vocabId = await apply('vocabulary', D.vocab, (r) => `${r.topic_id}|${r.ko}`, await db.all('SELECT * FROM vocabulary'));
  D.passages.forEach((p) => { p.topic_id = tid(p.topic); });
  const passageId = await apply('passages', D.passages, (r) => `${r.topic_id}|${r.title}`, await db.all('SELECT * FROM passages'));

  // Câu hỏi (khoá: code) — giải tham chiếu từ vựng / bài đọc sang id
  for (const q of D.questions) {
    q.topic_id = tid(q.topic);
    const data = { ...(q.data || {}) };
    if (data.vocab_ref) { const [tc, ko] = data.vocab_ref.split('|'); data.vocab_id = vocabId.get(`${tid(tc)}|${ko}`); delete data.vocab_ref; }
    if (data.passage_ref) { const [tc, title] = data.passage_ref.split('|'); data.passage_id = passageId.get(`${tid(tc)}|${title}`); delete data.passage_ref; }
    q.data = data;
  }
  const qrows = await db.all('SELECT * FROM questions');
  const orows = await db.all('SELECT * FROM question_options ORDER BY sort, id');
  const optsByQ = new Map(); orows.forEach((o) => { if (!optsByQ.has(o.question_id)) optsByQ.set(o.question_id, []); optsByQ.get(o.question_id).push(o); });
  qrows.forEach((r) => { r.options = optsByQ.get(r.id) || []; });
  // Câu hỏi admin tự tạo có mã "-AD-": không thuộc hệ thống
  await apply('questions', D.questions, (r) => r.code, qrows.filter((r) => !/-AD-/.test(r.code) || r.seed_hash));
  // Phương án: giữ nguyên id theo vị trí để lịch sử trả lời vẫn hiển thị đúng
  for (const q of D.questions) {
    const old = q._new ? [] : optsByQ.get(q.id) || [];
    // Câu đã có nhưng thiếu phương án (lần đồng bộ trước bị ngắt giữa chừng) → bổ sung
    const missing = !q._new && !q._updated && !old.length && (q.options || []).length;
    if (!q._new && !q._updated && !missing) continue;
    (q.options || []).forEach((o, i) => {
      if (old[i]) W.push(['UPDATE question_options SET text=?, is_correct=?, feedback=?, sort=? WHERE id=?', [o.text, o.is_correct ? 1 : 0, o.feedback || null, i, old[i].id]]);
      else W.push(['INSERT INTO question_options(id,question_id,text,is_correct,feedback,sort) VALUES (?,?,?,?,?,?)', [++seq.question_options, q.id, o.text, o.is_correct ? 1 : 0, o.feedback || null, i]]);
    });
    old.slice((q.options || []).length).forEach((o) => W.push(['DELETE FROM question_options WHERE id=?', [o.id]]));
  }

  for (let i = 0; i < W.length; i += 300) await db.batch(W.slice(i, i + 300));
  log(`Đồng bộ học liệu: thêm ${stats.insert}, cập nhật ${stats.update}, giữ nguyên ${stats.keep}, lưu trữ ${stats.archive}.`);
  return { topicId, topicCodeById, stats };
}

// Đề thi chính thức do hệ thống tạo: khoá theo tên; đề hệ thống cũ không còn trong danh sách → lưu trữ
async function syncExams(D, topicId, adminId, generate, { log = console.log } = {}) {
  const rows = await db.all("SELECT * FROM mock_exams WHERE kind='official'");
  const seedRows = rows.filter((r) => J(r.config, {}).seed || (D.legacyExamTitles || []).includes(r.title));
  const byTitle = new Map(seedRows.map((r) => [r.title, r]));
  let created = 0;
  for (const e of D.exams) {
    const matrix = e.matrix.map(([code, count]) => ({ topic_id: topicId.get(code), count })).filter((m) => m.topic_id);
    const lvl = (await db.get('SELECT id FROM levels WHERE code=?', e.level)).id;
    const ex = byTitle.get(e.title);
    if (ex) {
      // đề đã có: cập nhật mô tả/ma trận; chỉ sinh lại câu hỏi khi đề chưa có ai thi
      const used = (await db.get('SELECT COUNT(*) n FROM exam_attempts WHERE exam_id=?', ex.id)).n;
      let qids = ex.question_ids;
      if (!used && JSON.stringify(J(ex.matrix, [])) !== JSON.stringify(matrix)) qids = JSON.stringify((await generate({ matrix, types: e.types })).ids);
      await db.run(`UPDATE mock_exams SET description=?, level_id=?, scope=?, matrix=?, question_ids=?, duration_min=?, pass_score=?, show_answers=?, config=?,
        status=CASE WHEN status='archived' THEN 'published' ELSE status END WHERE id=?`, e.description, lvl, e.scope, JSON.stringify(matrix), qids, e.duration, e.pass, e.show_answers ? 1 : 0, JSON.stringify({ seed: true }), ex.id);
      byTitle.delete(e.title);
    } else {
      const gen = await generate({ matrix, types: e.types });
      if (gen.problems.length) log('Cảnh báo ma trận đề', e.title, JSON.stringify(gen.problems));
      await db.run(`INSERT INTO mock_exams(title,description,kind,level_id,scope,matrix,question_ids,duration_min,pass_score,show_answers,status,config,created_by)
        VALUES (?,?,'official',?,?,?,?,?,?,?,'published',?,?)`, e.title, e.description, lvl, e.scope, JSON.stringify(matrix), JSON.stringify(gen.ids), e.duration, e.pass, e.show_answers ? 1 : 0, JSON.stringify({ seed: true }), adminId);
      created++;
    }
  }
  for (const r of byTitle.values()) if (r.status !== 'archived') await db.run("UPDATE mock_exams SET status='archived' WHERE id=?", r.id);
  log(`Đề thi hệ thống: tạo mới ${created}, lưu trữ ${byTitle.size}.`);
}

module.exports = { syncContent, syncExams, LEGACY };
