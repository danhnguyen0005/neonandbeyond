// Nạp học liệu khởi tạo vào DB (chỉ chạy khi DB còn trống).
const crypto = require('crypto');
const { db, SCHEMA } = require('../db');
const C = require('./content');
const { hashPassword } = require('../auth');
const { generateExamQuestions } = require('../engine');

// RNG có hạt giống để seed lặp lại được
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(20261102);
const pick = (arr, n, exclude = []) => { const pool = arr.filter((x) => !exclude.includes(x)); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; };

const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
const V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
const compose = (l, v, t = 0) => String.fromCharCode(0xac00 + (l * 21 + v) * 28 + t);
const batchim = (word) => { const c = word.trim().slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; };

const SKILL = { hangul: 'hangul', vocab: 'vocab', grammar: 'grammar', listening: 'listening', reading: 'reading', writing: 'writing' };
const TAG = { hangul: 'spelling', vocab: 'vocab', grammar: 'grammar', listening: 'listening', reading: 'reading', writing: 'writing' };

function build(log) {
  // Gom câu lệnh với id gán sẵn, ghi theo lô (nhanh trên cơ sở dữ liệu từ xa)
  const W = [], seq = {};
  const P = (sql) => ({ run: (...args) => {
    const table = sql.match(/INSERT INTO (\w+)/)[1];
    const id = (seq[table] = (seq[table] || 0) + 1);
    W.push([sql.replace(/INSERT INTO (\w+)\(/, 'INSERT INTO $1(id,').replace(/VALUES \(/, 'VALUES (?,'), [id, ...args]]);
    return { lastInsertRowid: id };
  } });
  const topicId = {}, topicGrp = {}, counters = {};
  let adminPassGenerated = null;
  const insQ = P(`INSERT INTO questions(code,topic_id,type,prompt,data,answer,explanation,skill,error_tag,difficulty,status,verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insO = P('INSERT INTO question_options(question_id,text,is_correct,feedback,sort) VALUES (?,?,?,?,?)');

  function addQ(topicCode, kind, q) {
    const grp = topicGrp[topicCode];
    counters[topicCode + kind] = (counters[topicCode + kind] || 0) + 1;
    const code = `${topicCode}-${kind}-${String(counters[topicCode + kind]).padStart(3, '0')}`;
    const data = q.data || {};
    const answer = q.answer || {};
    const id = insQ.run(code, topicId[topicCode], q.type, q.prompt, JSON.stringify(data), JSON.stringify(answer), q.expl || '',
      q.skill || SKILL[grp], q.tag || TAG[grp], q.d || 1, q.status || 'published', q.verified === 0 ? 0 : 1).lastInsertRowid;
    (q.options || []).forEach((o, i) => insO.run(id, o.text, o.correct ? 1 : 0, o.feedback || null, i));
    return id;
  }
  // chuyển định dạng gọn trong content.js thành bản ghi
  function addHand(topicCode, h, extraData = {}) {
    const base = { prompt: h.prompt, expl: h.expl, d: h.d, tag: h.tag, skill: h.skill, status: h.status, verified: h.verified, data: { ...extraData } };
    if (h.type === 'mcq' || h.type === 'listen') {
      if (h.say) base.data.say = h.say;
      return addQ(topicCode, h.type === 'listen' ? 'LS' : 'MC', { ...base, type: h.type, skill: h.skill || (h.type === 'listen' ? 'listening' : undefined),
        options: h.o.map((t, i) => ({ text: t, correct: i === 0, feedback: h.fb && h.fb[t] })) });
    }
    if (h.type === 'fill' || h.type === 'translate') return addQ(topicCode, h.type === 'fill' ? 'FI' : 'TR', { ...base, type: h.type, answer: { accepted: h.acc, common_wrong: h.common_wrong } });
    if (h.type === 'order') return addQ(topicCode, 'OR', { ...base, type: 'order', answer: { words: h.words } });
    if (h.type === 'error') return addQ(topicCode, 'ER', { ...base, type: 'error', data: { ...base.data, fixed_order: true },
      options: h.parts.map((t, i) => ({ text: t, correct: i === h.wrong })) });
    throw new Error('unknown type ' + h.type);
  }

  {
    // Levels, topics, lessons
    const lv = {};
    C.LEVELS.forEach((l, i) => { lv[l.code] = P('INSERT INTO levels(code,name,description,goal,sort) VALUES (?,?,?,?,?)').run(l.code, l.name, l.description, l.goal, i).lastInsertRowid; });
    C.TOPICS.forEach((t, i) => {
      topicId[t.code] = P('INSERT INTO topics(code,level_id,grp,name,description,source,sort,mastery_rules) VALUES (?,?,?,?,?,?,?,?)')
        .run(t.code, lv[t.level], t.grp, t.name, t.description, t.source, i, t.rules ? JSON.stringify(t.rules) : null).lastInsertRowid;
      topicGrp[t.code] = t.grp;
      const ls = C.LESSONS[t.code];
      if (ls) P('INSERT INTO lessons(topic_id,title,goal,body) VALUES (?,?,?,?)').run(topicId[t.code], ls.title, ls.goal, JSON.stringify(ls.body));
    });
    // Grammar points (một điểm ngữ pháp chính cho mỗi chủ đề ngữ pháp, lấy từ bài học)
    C.TOPICS.filter((t) => t.grp === 'grammar').forEach((t) => {
      const b = C.LESSONS[t.code].body;
      P('INSERT INTO grammar_points(topic_id,pattern,meaning,formula,explanation,examples,mistakes,compare) VALUES (?,?,?,?,?,?,?,?)')
        .run(topicId[t.code], C.LESSONS[t.code].title, t.description, b.formula, b.explain, JSON.stringify(b.examples), JSON.stringify(b.mistakes), b.compare);
    });

    // Hangeul: nguyên âm
    const vowRm = C.VOWELS.map((v) => v[1]);
    const vowSyl = C.VOWELS.map((v) => compose(11, V.indexOf(v[0])));
    C.VOWELS.forEach(([ch, rm], i) => {
      addQ('H-VOW', 'MC', { type: 'mcq', prompt: `Nguyên âm <b class="ko big">${ch}</b> đọc là gì?`, expl: `${ch} đọc là ${rm}, ví dụ ${vowSyl[i]}.`, d: i < 10 ? 1 : 2,
        options: [{ text: rm, correct: true }, ...pick(vowRm, 3, [rm]).map((t) => ({ text: t }))] });
      addQ('H-VOW', 'LS', { type: 'listen', prompt: 'Nghe và chọn âm tiết đúng.', data: { say: vowSyl[i] }, skill: 'listening', tag: 'listening', d: i < 10 ? 1 : 2,
        expl: `Âm vừa đọc là ${vowSyl[i]}.`, options: [{ text: vowSyl[i], correct: true }, ...pick(vowSyl, 3, [vowSyl[i]]).map((t) => ({ text: t }))] });
    });
    // Hangeul: phụ âm (nghe chọn trong nhóm dễ nhầm)
    const SERIES = [['ㄱ', 'ㅋ', 'ㄲ'], ['ㄷ', 'ㅌ', 'ㄸ'], ['ㅂ', 'ㅍ', 'ㅃ'], ['ㅈ', 'ㅊ', 'ㅉ'], ['ㅅ', 'ㅆ', 'ㅎ']];
    const conRm = C.CONSONANTS.map((c) => c[1]);
    C.CONSONANTS.forEach(([ch, rm]) => {
      const syl = compose(L.indexOf(ch), 0);
      addQ('H-CON', 'MC', { type: 'mcq', prompt: `Phụ âm <b class="ko big">${ch}</b> đọc là gì?`, expl: `${ch} đọc là ${rm}, ví dụ ${syl}.`, d: /căng|bật/.test(rm) ? 2 : 1,
        options: [{ text: rm, correct: true }, ...pick(conRm, 3, [rm]).map((t) => ({ text: t }))] });
      const ser = SERIES.find((s) => s.includes(ch));
      let others = ser ? ser.filter((x) => x !== ch) : [];
      others = others.concat(pick(C.CONSONANTS.map((c) => c[0]), 3 - others.length, [ch, ...others]));
      addQ('H-CON', 'LS', { type: 'listen', prompt: 'Nghe và chọn âm tiết đúng.', data: { say: syl }, skill: 'listening', tag: 'listening', d: ser ? 3 : 1,
        expl: `Âm vừa đọc là ${syl}${ser ? ' — chú ý phân biệt âm thường, bật hơi và căng.' : '.'}`,
        options: [{ text: syl, correct: true }, ...others.slice(0, 3).map((o) => ({ text: compose(L.indexOf(o), 0) }))] });
    });

    // Từ vựng
    for (const [tcode, words] of Object.entries(C.VOCAB)) {
      const ids = words.map(([ko, vi]) => P('INSERT INTO vocabulary(topic_id,ko,vi) VALUES (?,?,?)').run(topicId[tcode], ko, vi).lastInsertRowid);
      const vis = words.map((w) => w[1]), kos = words.map((w) => w[0]);
      const listenTopic = C.TOPICS.find((t) => t.code === tcode).level === 'sc1' ? 'L-SC1' : tcode;
      words.forEach(([ko, vi], i) => {
        const data = { vocab_id: ids[i] };
        addQ(tcode, 'VM', { type: 'mcq', prompt: `<b class="ko big">${ko}</b> nghĩa là gì?`, data, expl: `${ko} = ${vi}.`, d: 1, tag: 'vocab',
          options: [{ text: vi, correct: true }, ...pick(vis, 3, [vi]).map((t) => ({ text: t }))] });
        addQ(tcode, 'VR', { type: 'mcq', prompt: `Từ nào nghĩa là “${vi}”?`, data, expl: `“${vi}” = ${ko}.`, d: 2, tag: 'vocab',
          options: [{ text: ko, correct: true }, ...pick(kos, 3, [ko]).map((t) => ({ text: t }))] });
        addQ(tcode, 'VS', { type: 'translate', prompt: `Viết bằng chữ Hàn: “${vi}”`, data, answer: { accepted: [ko] }, expl: `“${vi}” viết là ${ko}.`, d: 3, tag: 'spelling' });
        addQ(listenTopic, 'LV', { type: 'listen', prompt: 'Nghe và chọn nghĩa đúng.', data: { ...data, say: ko }, skill: 'listening', tag: 'listening', d: 1,
          expl: `Từ vừa nghe là ${ko} = ${vi}.`, options: [{ text: vi, correct: true }, ...pick(vis, 3, [vi]).map((t) => ({ text: t }))] });
      });
    }

    // Tiểu từ: đáp án tính theo patchim
    const partQ = (tcode, list, pair, fname) => list.forEach(([noun, sent]) => {
      const has = batchim(noun) > 0;
      const right = has ? pair[0] : pair[1], wrong = has ? pair[1] : pair[0];
      const why = `${noun} ${has ? 'có patchim' : 'không có patchim'} nên dùng ${right}.`;
      addQ(tcode, 'PT', { type: 'mcq', prompt: `Chọn tiểu từ đúng: <span class="ko">${sent}</span>`, expl: why, d: 1, tag: 'particle', data: { group: fname + noun, fixed_order: true },
        options: pair.map((p) => ({ text: p, correct: p === right, feedback: p === wrong ? `${why} ${fname}` : null })) });
    });
    partQ('G-TOPIC', C.PARTICLE_SENTENCES.topic, ['은', '는'], '(은/는 chọn theo âm cuối của danh từ.)');
    partQ('G-TOPIC', C.PARTICLE_SENTENCES.subject, ['이', '가'], '(이/가 chọn theo âm cuối của danh từ.)');
    partQ('G-OBJ', C.PARTICLE_SENTENCES.object, ['을', '를'], '(을/를 chọn theo âm cuối của danh từ.)');
    C.PARTICLE_SENTENCES.copula.forEach(([noun, tpl]) => {
      const has = batchim(noun) > 0; const right = has ? '이에요' : '예요';
      const why = `${noun} ${has ? 'có patchim → 이에요' : 'không có patchim → 예요'}.`;
      addQ('G-COPULA', 'PT', { type: 'mcq', prompt: `Chọn đuôi đúng: <span class="ko">${tpl.replace('___', noun + '___')}.</span>`, expl: why, d: 1, tag: 'particle', data: { fixed_order: true },
        options: ['이에요', '예요'].map((p) => ({ text: p, correct: p === right, feedback: p !== right ? why : null })) });
    });

    // Chia động từ (bảng đã kiểm tra)
    const uniq = (a) => [...new Set(a)];
    C.VERBS.forEach(([dict, vi, formal, polite, past, an, ji], i) => {
      const stem = dict.slice(0, -1);
      const isHa = dict.endsWith('하다');
      const irregular = ['듣다', '덥다', '춥다', '쓰다', '크다', '바쁘다', '살다', '만들다', '놀다'].includes(dict);
      const grp = 'verb' + i;
      // -ㅂ/습니다
      const fDis = uniq([stem + '습니다', polite, past]).filter((x) => x !== formal).slice(0, 2);
      addQ('G-FORMAL', 'CJ', { type: 'mcq', prompt: `Chia <b class="ko">${dict}</b> (${vi}) với đuôi -ㅂ/습니다:`, expl: `${dict} → ${formal}. ${batchim(stem) ? (batchim(stem) === 8 ? 'Gốc tận cùng ㄹ: bỏ ㄹ, thêm ㅂ니다.' : 'Gốc có patchim → 습니다.') : 'Gốc không có patchim → ㅂ니다.'}`,
        d: irregular ? 2 : 1, tag: 'conjugation', data: { group: grp + 'f' }, options: [{ text: formal, correct: true }, ...fDis.map((t) => ({ text: t, feedback: t === polite ? `${t} là đuôi -아/어요, không phải -ㅂ/습니다.` : t === past ? `${t} là thì quá khứ.` : null }))] });
      if (i % 2 === 0) addQ('G-FORMAL', 'TY', { type: 'conjugate', prompt: `Gõ dạng -ㅂ/습니다 của <b class="ko">${dict}</b> (${vi}):`, answer: { accepted: [formal], common_wrong: [{ text: stem + '습니다', why: `Gốc ${stem} ${batchim(stem) === 8 ? 'tận cùng ㄹ nên bỏ ㄹ + ㅂ니다' : 'không có patchim nên + ㅂ니다'}.` }] },
        expl: `${dict} → ${formal}.`, d: 2, tag: 'conjugation', data: { group: grp + 'f' } });
      // -아/어요
      const naive = isHa ? [stem + '요', formal] : [stem + '아요', stem + '어요', formal];
      const pDis = uniq(naive).filter((x) => x !== polite).slice(0, 2);
      addQ('G-POLITE', 'CJ', { type: 'mcq', prompt: `Chia <b class="ko">${dict}</b> (${vi}) với đuôi -아/어요:`, expl: `${dict} → ${polite}.${irregular ? ' Đây là dạng bất quy tắc/rút gọn cần nhớ.' : ''}`,
        d: irregular ? 3 : 1, tag: 'conjugation', data: { group: grp + 'p' }, options: [{ text: polite, correct: true }, ...pDis.map((t) => ({ text: t, feedback: t === formal ? `${t} là đuôi trang trọng -ㅂ/습니다.` : `Không nối máy móc gốc + 아요/어요: dạng đúng là ${polite}.` }))] });
      if (i % 2 === 1) addQ('G-POLITE', 'TY', { type: 'conjugate', prompt: `Gõ dạng -아/어요 của <b class="ko">${dict}</b> (${vi}):`, answer: { accepted: [polite] }, expl: `${dict} → ${polite}.`, d: 2, tag: 'conjugation', data: { group: grp + 'p' } });
      // -았/었어요
      const pastNaive = isHa ? [stem + '았어요', polite] : [stem + '았어요', stem + '었어요', polite];
      const paDis = uniq(pastNaive).filter((x) => x !== past).slice(0, 2);
      addQ('G-PAST', 'CJ', { type: 'mcq', prompt: `Thì quá khứ của <b class="ko">${dict}</b> (${vi}):`, expl: `${dict} → ${past}.`, d: irregular ? 3 : 1, tag: 'conjugation', data: { group: grp + 'q' },
        options: [{ text: past, correct: true }, ...paDis.map((t) => ({ text: t, feedback: t === polite ? `${t} là hiện tại.` : `Dạng đúng là ${past}.` }))] });
      if (i % 2 === 0) addQ('G-PAST', 'TY', { type: 'conjugate', prompt: `Gõ thì quá khứ (-았/었어요) của <b class="ko">${dict}</b> (${vi}):`, answer: { accepted: [past] }, expl: `${dict} → ${past}.`, d: 2, tag: 'conjugation', data: { group: grp + 'q' } });
      // Phủ định
      if (an) {
        const anDis = isHa ? ['안 ' + polite, stem.slice(0, -1) + '하지 안아요'] : [polite + ' 안', '안 ' + dict];
        addQ('G-NEG', 'AN', { type: 'mcq', prompt: `Phủ định <b class="ko">${polite}</b> bằng 안:`, expl: isHa ? `Động từ “danh từ + 하다”: 안 đứng trước 하다 → ${an}.` : `안 đứng ngay trước động từ → ${an}.`,
          d: isHa ? 2 : 1, tag: 'grammar', data: { group: grp + 'n' }, options: [{ text: an, correct: true }, ...anDis.map((t) => ({ text: t, feedback: t === '안 ' + polite ? 'Với động từ “danh từ + 하다”, 안 phải đứng giữa danh từ và 하다.' : null }))] });
        if (i % 3 === 0) addQ('G-NEG', 'TY', { type: 'conjugate', prompt: `Gõ dạng phủ định -지 않아요 của <b class="ko">${dict}</b>:`, answer: { accepted: [ji] }, expl: `${dict} → ${ji}.`, d: 3, tag: 'conjugation', data: { group: grp + 'n' } });
      }
    });

    // Câu hỏi biên soạn tay
    for (const [tcode, list] of Object.entries(C.HAND)) { if (!topicId[tcode]) continue; list.forEach((h) => addHand(tcode, h)); }
    // Bài đọc / nghe
    C.PASSAGES.forEach((p) => {
      const pid = P('INSERT INTO passages(topic_id,kind,title,ko_text,vi_text) VALUES (?,?,?,?,?)').run(topicId[p.topic], p.kind, p.title, p.ko, p.vi).lastInsertRowid;
      p.qs.forEach((h) => addHand(p.topic, { ...h, skill: h.skill || (p.kind === 'listening' ? 'listening' : 'reading') }, { passage_id: pid, group: 'p' + pid + '-' + h.prompt.length }));
    });
    // Viết
    C.WRITING.forEach((w) => addQ('W-SC1', 'WR', { type: 'write', prompt: w.prompt, data: { rubric: w.rubric }, answer: { reference: w.reference }, expl: w.expl, d: w.d, tag: 'writing' }));
    // Câu chưa xác minh
    C.UNVERIFIED.forEach((u) => addHand(u.topic, u));

    // Tài khoản quản trị
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    adminPassGenerated = process.env.ADMIN_PASSWORD ? null : adminPass;
    P("INSERT INTO users(username,display_name,password_hash,role) VALUES (?,?,?,'admin')").run(adminUser, 'Quản trị viên', hashPassword(adminPass));
  }
  return { W, topicId, adminPassGenerated };
}


async function run({ log = console.log } = {}) {
  await db.exec(SCHEMA);
  const done = async () => (await db.get("SELECT COUNT(*) n FROM settings WHERE key='seed_done'")).n > 0;
  if (await done()) return false;
  const hasLevels = (await db.get('SELECT COUNT(*) n FROM levels')).n > 0;
  const lock = await db.get("SELECT value FROM settings WHERE key='seed_lock'");
  if (hasLevels && !lock) { await db.run("INSERT INTO settings(key,value) VALUES ('seed_done', datetime('now'))"); return false; } // DB tạo từ phiên bản cũ
  // Lần nạp trước bị ngắt giữa chừng (khoá cũ hơn 3 phút mà chưa xong): xoá phần nạp dở rồi nạp lại.
  // Chỉ xảy ra khi chưa nạp xong lần nào, nên chưa có dữ liệu học viên.
  if (lock && (await db.get("SELECT ? < datetime('now','-3 minutes') old", lock.value)).old) {
    log('Phát hiện lần nạp dữ liệu trước bị ngắt. Đang nạp lại…');
    await db.batch(['question_options', 'questions', 'passages', 'grammar_points', 'vocabulary', 'lessons', 'mock_exams', 'topics', 'levels']
      .map((t) => [`DELETE FROM ${t}`]).concat([["DELETE FROM users WHERE role='admin'"], ["DELETE FROM settings WHERE key='seed_lock'"]]));
  }
  // Khoá: chỉ một tiến trình được nạp dữ liệu (tránh trùng khi nhiều máy chủ khởi động cùng lúc)
  try { await db.run("INSERT INTO settings(key,value) VALUES ('seed_lock', datetime('now'))"); }
  catch {
    for (let i = 0; i < 55; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await done()) return false; }
    throw new Error('Cơ sở dữ liệu đang được khởi tạo, hãy tải lại trang sau ít phút.');
  }
  const { W, topicId, adminPassGenerated } = build(log);
  for (let i = 0; i < W.length; i += 400) await db.batch(W.slice(i, i + 400));
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  if (adminPassGenerated) log(`\n  Tài khoản quản trị đã được tạo:\n    Tên đăng nhập: ${adminUser}\n    Mật khẩu:      ${adminPassGenerated}\n  (Đặt biến môi trường ADMIN_PASSWORD trước lần chạy đầu để tự chọn mật khẩu.)\n`);
  // Đề thi chính thức (sinh sau khi ngân hàng câu hỏi đã có)
  const adminId = (await db.get("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1")).id;
  for (const e of C.EXAMS) {
    const matrix = e.matrix.map(([code, count]) => ({ topic_id: topicId[code], count }));
    const gen = await generateExamQuestions({ matrix, types: ['mcq', 'listen', 'error', 'order', 'fill', 'conjugate', 'translate'] });
    if (gen.problems.length) log('Cảnh báo ma trận đề', e.title, gen.problems);
    const lvl = (await db.get('SELECT id FROM levels WHERE code=?', e.level)).id;
    await db.run(`INSERT INTO mock_exams(title,description,kind,level_id,scope,matrix,question_ids,duration_min,pass_score,show_answers,status,created_by)
      VALUES (?,?,'official',?,?,?,?,?,?,?,'published',?)`, e.title, e.description, lvl, e.matrix.map((m) => m[0]).join(', '),
      JSON.stringify(matrix), JSON.stringify(gen.ids), e.duration, e.pass, e.show_answers, adminId);
  }
  await db.run("INSERT INTO settings(key,value) VALUES ('seed_done', datetime('now'))");
  const n = (await db.get('SELECT COUNT(*) n FROM questions')).n;
  log(`Đã nạp học liệu: ${C.TOPICS.length} chủ đề, ${n} câu hỏi, ${C.EXAMS.length} đề thi.`);
  return true;
}

module.exports = { run };
if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
