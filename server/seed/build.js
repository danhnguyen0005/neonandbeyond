// Dựng toàn bộ học liệu mong muốn (chưa ghi DB). sync.js sẽ áp nó lên cơ sở dữ liệu.
const fs = require('fs');
const path = require('path');
const C = require('./content');
const K = require('./korean');
const { batchim } = require('./dsl');

function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const Lj = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
const Vj = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
const compose = (l, v) => String.fromCharCode(0xac00 + (l * 21 + v) * 28);
const SKILL = { hangul: 'hangul', vocab: 'vocab', grammar: 'grammar', listening: 'listening', reading: 'reading', writing: 'writing' };
const TAG = { hangul: 'spelling', vocab: 'vocab', grammar: 'grammar', listening: 'listening', reading: 'reading', writing: 'writing' };
const pad = (n) => String(n).padStart(2, '0');
const uniq = (a) => [...new Set(a)];

// Mô tả dạng chia động từ dùng trong đề và giải thích
const FORM_INFO = {
  formal: ['-ㅂ/습니다', 'Gốc không patchim (kể cả gốc tận cùng ㄹ sau khi bỏ ㄹ) + ㅂ니다; có patchim + 습니다.'],
  formal_q: ['-ㅂ/습니까?', 'Dạng nghi vấn trang trọng: không patchim + ㅂ니까?, có patchim + 습니까?'],
  polite: ['-아/어요', 'ㅏ/ㅗ → 아요, nguyên âm khác → 어요, 하다 → 해요; gốc không patchim thì rút gọn nguyên âm.'],
  past: ['-았/었어요', 'Chọn 았/었 giống -아/어요: ㅏ/ㅗ → 았어요, khác → 었어요, 하다 → 했어요.'],
  an: ['phủ định 안', '안 đứng trước động từ; động từ “danh từ + 하다” thì 안 đứng trước 하다.'],
  ji_anh: ['-지 않아요', 'Gắn -지 않아요 thẳng vào gốc, không cần xét patchim.'],
  mot: ['phủ định 못', '못 đứng trước động từ (không thể); “danh từ + 하다” thì 못 đứng trước 하다.'],
  go_sipda: ['-고 싶어요', 'Gắn -고 싶어요 thẳng vào gốc động từ.'],
  seyo: ['-(으)세요', 'Gốc không patchim + 세요; có patchim + 으세요; gốc tận cùng ㄹ: bỏ ㄹ + 세요.'],
  bsida: ['-(으)ㅂ시다', 'Gốc không patchim + ㅂ시다; có patchim + 읍시다; gốc tận cùng ㄹ: bỏ ㄹ + ㅂ시다.'],
  gess: ['-겠어요', 'Gắn -겠어요 thẳng vào gốc.'],
  llaeyo: ['-(으)ㄹ래요', 'Gốc không patchim + ㄹ래요; có patchim + 을래요; gốc tận cùng ㄹ + 래요.'],
  lgeoyeyo: ['-(으)ㄹ 거예요', 'Gốc không patchim + ㄹ 거예요; có patchim + 을 거예요; gốc tận cùng ㄹ + 거예요.'],
  ryeogo_hada: ['-(으)려고 해요', 'Gốc không patchim hoặc tận cùng ㄹ + 려고 해요; có patchim + 으려고 해요.'],
  aseo: ['-아/어서', 'Chọn 아/어 giống -아/어요 rồi thêm 서.'],
  lkkayo: ['-(으)ㄹ까요?', 'Gốc không patchim + ㄹ까요?; có patchim + 을까요?; gốc tận cùng ㄹ + 까요?'],
  lsu_itda: ['-(으)ㄹ 수 있어요', 'Gốc không patchim + ㄹ 수 있어요; có patchim + 을 수 있어요; gốc tận cùng ㄹ + 수 있어요.'],
  reo: ['-(으)러 (가다)', 'Gốc không patchim hoặc tận cùng ㄹ + 러; có patchim + 으러.'],
  sipnida: ['-(으)십니다', 'Kính ngữ trang trọng: không patchim + 십니다; có patchim + 으십니다; gốc tận cùng ㄹ: bỏ ㄹ + 십니다.'],
  syeosseoyo: ['-(으)셨어요', 'Kính ngữ quá khứ: không patchim + 셨어요; có patchim + 으셨어요.'],
  gi: ['-기', 'Danh từ hoá: gắn -기 thẳng vào gốc.'],
  neun_geot: ['-는 것', 'Danh từ hoá: gốc + 는 것 (gốc tận cùng ㄹ bỏ ㄹ).'],
  go: ['-고', 'Nối hai hành động/tính chất: gắn -고 thẳng vào gốc.'],
  jiman: ['-지만', 'Đối lập: gắn -지만 thẳng vào gốc.'],
  myeon: ['-(으)면', 'Gốc không patchim hoặc tận cùng ㄹ + 면; có patchim + 으면.'],
};
// Phương án sai "hợp lý" cho từng dạng (lỗi người học hay mắc)
function wrongForms(dict, form, right) {
  const s = dict.slice(0, -1);
  const c = (f) => { try { return K.conjugate(dict, f); } catch { return null; } };
  const cand = {
    formal: [s + '습니다', addB(s) + '니다', c('polite')], formal_q: [s + '습니까?', c('formal'), c('polite') + '?'],
    polite: [s + '아요', s + '어요', c('formal'), c('past')], past: [s + '았어요', s + '었어요', c('polite')],
    an: [dict.endsWith('하다') ? '안 ' + c('polite') : c('polite') + ' 안', '안 ' + dict, c('ji_anh')], ji_anh: [s + '지 안아요', '안 ' + dict, s + '지 않다요'],
    mot: [c('an'), '못 ' + dict, dict.endsWith('하다') ? '못 ' + c('polite') : c('polite') + ' 못'], go_sipda: [c('polite') + ' 싶어요', s + '고 싶다요', c('seyo')],
    seyo: [s + '세요', s + '으세요', c('bsida')], bsida: [s + '읍시다', s + 'ㅂ시다', c('seyo')], gess: [c('polite') + '겠어요', s + '겠다요', c('past')],
    llaeyo: [s + '을래요', s + '래요', c('lgeoyeyo')], lgeoyeyo: [s + '을 거예요', s + 'ㄹ 거예요', c('past')], ryeogo_hada: [s + '으려고 해요', s + '려고 해요', c('go_sipda')],
    aseo: [s + '아서', s + '어서', c('go')], lkkayo: [s + '을까요?', s + 'ㄹ까요?', c('bsida')], lsu_itda: [s + '을 수 있어요', s + '는 수 있어요', c('go_sipda')],
    reo: [s + '으러', c('polite') + '러', c('go')], sipnida: [s + '십니다', s + '으십니다', c('formal'), c('seyo')], syeosseoyo: [s + '셨어요', s + '으셨어요', c('past')], gi: [s + '은기', c('polite') + '기', s + '는 것기'],
    neun_geot: [s + '은 것', c('polite') + ' 것', s + '기 것'], go: [c('polite') + '고', s + '구'], jiman: [c('polite') + '지만', s + '찌만'], myeon: [s + '으면', s + '면', c('polite') + '면'],
  }[form] || [];
  // Loại các dạng "không rút gọn" vẫn đúng ngữ pháp (보아요, 마시어요, 보았어요…) và dạng phủ định đúng khác (-지 않아요)
  const lt = K.dec(s.slice(-1));
  const okAlt = new Set();
  if (!lt.t && !dict.endsWith('하다')) {
    const a = ['ㅏ', 'ㅗ', 'ㅑ'].includes(lt.v) ? '아' : '어';
    okAlt.add(s + a + '요'); okAlt.add(s + (a === '아' ? '았' : '었') + '어요'); okAlt.add(s + a + '서');
  }
  if (form === 'an' || form === 'mot') { okAlt.add(c('ji_anh')); okAlt.add(c('ji_mot')); }
  return uniq(cand.filter((x) => x && x !== right && !okAlt.has(x) && !/[ㄱ-ㅎ]/.test(x)));
}
function addB(s) { const ch = s.slice(-1); const code = ch.charCodeAt(0) - 0xac00; if (code < 0 || code % 28) return s + 'ㅂ'; return s.slice(0, -1) + String.fromCharCode(ch.charCodeAt(0) + 17); }

function build() {
  const R = rng(20261103);
  const pick = (arr, n, exclude = []) => { const pool = uniq(arr).filter((x) => !exclude.includes(x)); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; };
  const D = { levels: C.LEVELS, topics: [], lessons: [], grammar: [], vocab: [], passages: [], questions: [], exams: [], legacyExamTitles: ['Kiểm tra Nhập môn: Hangeul', 'Kiểm tra Sơ cấp 1 · Bài 1–3', 'Thi thử tổng hợp Sơ cấp 1'] };
  const grpOf = {}, counters = {};
  let sort = 0;
  const topic = (t) => { D.topics.push({ sort: sort++, ...t }); grpOf[t.code] = t.grp; };
  const lesson = (tcode, l, i = 0) => D.lessons.push({ topic: tcode, title: l.title, goal: l.goal || null, body: l.body, sort: i });
  // Thêm câu hỏi với mã ổn định: <chủ đề>-<loại>-<số thứ tự>
  function addQ(tcode, kind, q) {
    counters[tcode + kind] = (counters[tcode + kind] || 0) + 1;
    const grp = grpOf[tcode];
    D.questions.push({ code: `${tcode}-${kind}-${String(counters[tcode + kind]).padStart(3, '0')}`, topic: tcode, type: q.type, prompt: q.prompt,
      data: q.data || {}, answer: q.answer || {}, explanation: q.expl || '', skill: q.skill || SKILL[grp], error_tag: q.tag || TAG[grp],
      difficulty: q.d || 1, status: q.status || 'published', verified: q.verified === 0 ? 0 : 1,
      options: (q.options || []).map((o) => ({ text: o.text, is_correct: o.correct ? 1 : 0, feedback: o.feedback || null })) });
  }
  function addHand(tcode, h, extraData = {}) {
    const base = { prompt: h.prompt, expl: h.expl, d: h.d, tag: h.tag, skill: h.skill, status: h.status, verified: h.verified, data: { ...extraData } };
    if (h.type === 'mcq' || h.type === 'listen') {
      if (h.say) base.data.say = h.say;
      if (h.fixed) base.data.fixed_order = true;
      const o = uniq(h.o);
      if (o.length !== h.o.length) throw new Error(`Phương án trùng ở ${tcode}: ${h.prompt}`);
      return addQ(tcode, h.type === 'listen' ? 'LS' : 'MC', { ...base, type: h.type, skill: h.skill || (h.type === 'listen' ? 'listening' : undefined),
        options: h.o.map((t, i) => ({ text: t, correct: i === 0, feedback: h.fb && h.fb[t] })) });
    }
    if (['fill', 'translate', 'conjugate'].includes(h.type)) return addQ(tcode, { fill: 'FI', translate: 'TR', conjugate: 'CJ' }[h.type], { ...base, type: h.type, answer: { accepted: h.acc, common_wrong: h.common_wrong } });
    if (h.type === 'order') return addQ(tcode, 'OR', { ...base, type: 'order', answer: { words: h.words } });
    if (h.type === 'error') return addQ(tcode, 'ER', { ...base, type: 'error', data: { ...base.data, fixed_order: true }, options: h.parts.map((t, i) => ({ text: t, correct: i === h.wrong })) });
    if (h.type === 'write') return addQ(tcode, 'WR', { ...base, type: 'write', data: { ...base.data, rubric: h.rubric }, answer: { reference: h.reference } });
    throw new Error('Dạng câu hỏi không hỗ trợ: ' + h.type);
  }
  // Từ vựng → câu hỏi nghĩa, chọn từ, chính tả (+ nghe ở chủ đề nghe nếu có)
  function vocabQuestions(tcode, words, listenTopic) {
    const vis = words.map((w) => w[1]), kos = words.map((w) => w[0]);
    words.forEach(([ko, vi, group]) => {
      const data = { vocab_ref: `${tcode}|${ko}` };
      const sameG = words.filter((w) => w[2] === group);
      const pool = sameG.length >= 4 ? sameG : words;
      addQ(tcode, 'VM', { type: 'mcq', prompt: `<b class="ko big">${ko}</b> nghĩa là gì?`, data, expl: `${ko} = ${vi}.`, d: 1, tag: 'vocab',
        options: [{ text: vi, correct: true }, ...pick(pool.map((w) => w[1]).filter((x) => x !== vi), 3).map((t) => ({ text: t }))] });
      addQ(tcode, 'VR', { type: 'mcq', prompt: `Từ nào nghĩa là “${vi}”?`, data, expl: `“${vi}” = ${ko}.`, d: 2, tag: 'vocab',
        options: [{ text: ko, correct: true }, ...pick(pool.map((w) => w[0]).filter((x) => x !== ko), 3).map((t) => ({ text: t }))] });
      if (ko.length <= 6 && !/[?.!(]/.test(ko)) addQ(tcode, 'VS', { type: 'translate', prompt: `Viết bằng chữ Hàn: “${vi}”`, data, answer: { accepted: [ko] }, expl: `“${vi}” viết là ${ko}.`, d: 3, tag: 'spelling' });
      if (listenTopic) addQ(listenTopic, 'LV', { type: 'listen', prompt: 'Nghe và chọn nghĩa đúng.', data: { ...data, say: ko.replace(/\(.*?\)/g, '') }, skill: 'listening', tag: 'listening', d: 1,
        expl: `Từ vừa nghe là ${ko} = ${vi}.`, options: [{ text: vi, correct: true }, ...pick(vis.filter((x) => x !== vi), 3).map((t) => ({ text: t }))] });
    });
    void kos;
  }
  function particleQuestions(tcode, items, pair, note) {
    items.forEach(([noun, sent]) => {
      const isRo = pair[0] === '으로', isL = batchim(noun) === 8;
      const has = batchim(noun) > 0 && !(isRo && isL); // (으)로: patchim ㄹ dùng như không patchim
      const right = has ? pair[0] : pair[1], wrong = has ? pair[1] : pair[0];
      const why = isRo && isL ? `${noun} có patchim ㄹ (ngoại lệ) nên chỉ dùng 로.` : `${noun} ${has ? 'có patchim' : 'không có patchim'} nên dùng ${right}.`;
      addQ(tcode, 'PT', { type: 'mcq', prompt: `Chọn tiểu từ đúng: <span class="ko">${sent}</span>`, expl: why, d: 1, tag: 'particle', data: { fixed_order: true, group: 'pt' + noun + pair[0] },
        options: pair.map((p) => ({ text: p, correct: p === right, feedback: p === wrong ? `${why} ${note || ''}`.trim() : null })) });
    });
  }
  function verbQuestions(tcode, form, verbs, { typed = 0.4, d = 1 } = {}) {
    const [label, rule] = FORM_INFO[form];
    verbs.forEach(([dict, vi], i) => {
      const right = K.conjugate(dict, form);
      const wrongs = wrongForms(dict, form, right).slice(0, 3);
      const irr = ['b', 'd', 'r', 'eu', 'l', 's'].includes(K.info(dict).type);
      if (wrongs.length >= 2) addQ(tcode, 'VF', { type: 'mcq', prompt: `Chia <b class="ko">${dict}</b> (${vi}) với ${label}:`, expl: `${dict} → ${right}. ${rule}`, d: irr ? Math.max(d, 2) : d, tag: 'conjugation',
        data: { group: 'vf' + form + dict }, options: [{ text: right, correct: true }, ...wrongs.map((t) => ({ text: t, feedback: `Dạng đúng là ${right}. ${rule}` }))] });
      if (R() < typed) addQ(tcode, 'VT', { type: 'conjugate', prompt: `Gõ dạng ${label} của <b class="ko">${dict}</b> (${vi}):`, answer: { accepted: [right] }, expl: `${dict} → ${right}. ${rule}`, d: 2, tag: 'conjugation', data: { group: 'vf' + form + dict } });
      void i;
    });
  }

  /* ---------------- Nhập môn: Hangeul ---------------- */
  for (const t of C.TOPICS.filter((x) => x.level === 'intro')) { topic(t); if (C.LESSONS[t.code]) lesson(t.code, C.LESSONS[t.code]); }
  const vowRm = C.VOWELS.map((v) => v[1]), vowSyl = C.VOWELS.map((v) => compose(11, Vj.indexOf(v[0])));
  C.VOWELS.forEach(([ch, rm], i) => {
    addQ('H-VOW', 'MC', { type: 'mcq', prompt: `Nguyên âm <b class="ko big">${ch}</b> đọc là gì?`, expl: `${ch} đọc là ${rm}, ví dụ ${vowSyl[i]}.`, d: i < 10 ? 1 : 2, options: [{ text: rm, correct: true }, ...pick(vowRm, 3, [rm]).map((t) => ({ text: t }))] });
    addQ('H-VOW', 'LS', { type: 'listen', prompt: 'Nghe và chọn âm tiết đúng.', data: { say: vowSyl[i] }, skill: 'listening', tag: 'listening', d: i < 10 ? 1 : 2, expl: `Âm vừa đọc là ${vowSyl[i]}.`,
      options: [{ text: vowSyl[i], correct: true }, ...pick(vowSyl, 3, [vowSyl[i]]).map((t) => ({ text: t }))] });
  });
  const SERIES = [['ㄱ', 'ㅋ', 'ㄲ'], ['ㄷ', 'ㅌ', 'ㄸ'], ['ㅂ', 'ㅍ', 'ㅃ'], ['ㅈ', 'ㅊ', 'ㅉ'], ['ㅅ', 'ㅆ', 'ㅎ']];
  const conRm = C.CONSONANTS.map((c) => c[1]);
  C.CONSONANTS.forEach(([ch, rm]) => {
    const syl = compose(Lj.indexOf(ch), 0);
    addQ('H-CON', 'MC', { type: 'mcq', prompt: `Phụ âm <b class="ko big">${ch}</b> đọc là gì?`, expl: `${ch} đọc là ${rm}, ví dụ ${syl}.`, d: /căng|bật/.test(rm) ? 2 : 1, options: [{ text: rm, correct: true }, ...pick(conRm, 3, [rm]).map((t) => ({ text: t }))] });
    const ser = SERIES.find((s) => s.includes(ch));
    let others = ser ? ser.filter((x) => x !== ch) : [];
    others = others.concat(pick(C.CONSONANTS.map((c) => c[0]), 3 - others.length, [ch, ...others]));
    addQ('H-CON', 'LS', { type: 'listen', prompt: 'Nghe và chọn âm tiết đúng.', data: { say: syl }, skill: 'listening', tag: 'listening', d: ser ? 3 : 1,
      expl: `Âm vừa đọc là ${syl}${ser ? ' — chú ý phân biệt âm thường, bật hơi và căng.' : '.'}`, options: [{ text: syl, correct: true }, ...others.slice(0, 3).map((o) => ({ text: compose(Lj.indexOf(o), 0) }))] });
  });
  for (const [tcode, list] of Object.entries(C.HAND)) if (grpOf[tcode]) list.forEach((h) => addHand(tcode, h));
  if (C.INTRO_WORDS) { C.INTRO_WORDS.words.forEach(([ko, vi]) => D.vocab.push({ topic: 'H-WORD', ko, vi, note: 'Từ tập đọc' })); vocabQuestions('H-WORD', C.INTRO_WORDS.words.map((w) => [...w, 'x']), 'H-WORD'); }

  /* ---------------- Sơ cấp 1: 15 bài ---------------- */
  const dir = path.join(__dirname, 'sc1');
  const units = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^bai\d+\.js$/.test(f)).sort().map((f) => require(path.join(dir, f))) : [];
  for (const u of units) {
    const P = `S1-${pad(u.unit)}`;
    const src = `Bài ${u.unit} · ${u.ko} (${u.vi})`;
    const words = u.vocab.flatMap(([group, list]) => list.map(([ko, vi]) => [ko, vi, group]));
    // Từ vựng
    topic({ code: `${P}-V`, level: 'sc1', grp: 'vocab', unit: u.unit, name: `Bài ${u.unit} · Từ vựng: ${u.vocabName}`, description: `${words.length} từ: ${u.vocab.map((g) => g[0]).join(', ')}.`, source: src });
    lesson(`${P}-V`, { title: `Từ vựng Bài ${u.unit}`, goal: u.vocabGoal || `Nắm ${words.length} từ vựng của bài ${u.ko} (${u.vi}).`,
      body: { explain: u.vocabNote || `Từ vựng chia theo nhóm: ${u.vocab.map((g) => g[0]).join(' · ')}. Hãy học bằng thẻ ghi nhớ rồi làm bài luyện tập để hệ thống lên lịch ôn lại.`, examples: u.vocabExamples || [], mistakes: u.vocabMistakes || [], compare: u.vocabCompare || '' } });
    words.forEach(([ko, vi, group]) => D.vocab.push({ topic: `${P}-V`, ko, vi, note: group }));
    vocabQuestions(`${P}-V`, words, `${P}-L`);
    // Ngữ pháp
    u.grammar.forEach((g, gi) => {
      const code = `${P}-G${gi + 1}`;
      topic({ code, level: 'sc1', grp: 'grammar', unit: u.unit, name: `Bài ${u.unit} · ${g.name}`, description: g.desc, source: src, rules: g.rules });
      lesson(code, { title: g.name, goal: g.lesson.goal, body: g.lesson });
      D.grammar.push({ topic: code, pattern: g.name, meaning: g.desc, formula: g.lesson.formula || null, explanation: g.lesson.explain || null,
        examples: g.lesson.examples || [], mistakes: g.lesson.mistakes || [], compare: g.lesson.compare || null });
      for (const gen of g.gen || []) {
        if (gen.kind === 'particle') particleQuestions(code, gen.items, gen.pair, gen.note);
        else if (gen.kind === 'copula') gen.items.forEach(([noun, tpl]) => {
          const has = batchim(noun) > 0, right = has ? '이에요' : '예요', why = `${noun} ${has ? 'có patchim → 이에요' : 'không có patchim → 예요'}.`;
          addQ(code, 'PT', { type: 'mcq', prompt: `Chọn đuôi đúng: <span class="ko">${tpl.replace('___', noun + '___')}</span>`, expl: why, d: 1, tag: 'particle', data: { fixed_order: true },
            options: ['이에요', '예요'].map((p) => ({ text: p, correct: p === right, feedback: p !== right ? why : null })) });
        });
        else if (gen.kind === 'verb') verbQuestions(code, gen.form, gen.verbs, gen);
      }
      (g.q || []).forEach((h) => addHand(code, h));
    });
    // Phát âm
    if (u.pron) {
      topic({ code: `${P}-P`, level: 'sc1', grp: 'hangul', unit: u.unit, name: `Bài ${u.unit} · Phát âm: ${u.pron.name}`, description: u.pron.desc, source: src });
      lesson(`${P}-P`, { title: u.pron.name, goal: u.pron.lesson.goal, body: u.pron.lesson });
      u.pron.q.forEach((h) => addHand(`${P}-P`, { tag: 'spelling', ...h }));
    }
    // Nghe (câu nghe từ vựng đã sinh ở trên cũng thuộc chủ đề này)
    topic({ code: `${P}-L`, level: 'sc1', grp: 'listening', unit: u.unit, name: `Bài ${u.unit} · Nghe hiểu`, description: u.listening.desc || 'Nghe từ vựng, câu và hội thoại của bài.', source: src });
    lesson(`${P}-L`, { title: 'Chiến lược nghe', goal: u.listening.goal || 'Nghe bắt từ khoá và hiểu ý chính.', body: { explain: u.listening.tip || 'Nghe lần đầu để đoán tình huống, lần hai để bắt từ khoá và đuôi câu. Có thể bấm “Nghe chậm”.', examples: u.listening.examples || [] } });
    // Nghe: câu + hội thoại
    (u.listening.q || []).forEach((h) => addHand(`${P}-L`, h));
    (u.listening.passages || []).forEach((p) => {
      D.passages.push({ topic: `${P}-L`, kind: 'listening', title: p.title, ko_text: p.ko, vi_text: p.vi || null });
      p.q.forEach((h) => addHand(`${P}-L`, { skill: 'listening', tag: 'listening', ...h }, { passage_ref: `${P}-L|${p.title}` }));
    });
    // Đọc + văn hoá
    topic({ code: `${P}-R`, level: 'sc1', grp: 'reading', unit: u.unit, name: `Bài ${u.unit} · Đọc hiểu & văn hoá`, description: u.reading.desc || `Đọc đoạn văn về chủ đề ${u.vi.toLowerCase()} và tìm hiểu văn hoá.`, source: src });
    lesson(`${P}-R`, { title: 'Chiến lược đọc', goal: 'Đọc đoạn ngắn và tìm thông tin.', body: { explain: u.reading.tip || 'Đọc câu hỏi trước, gạch chân từ để hỏi, rồi tìm câu chứa thông tin tương ứng.' } }, 0);
    if (u.culture) lesson(`${P}-R`, { title: `Văn hoá: ${u.culture.title}`, goal: u.culture.goal || null, body: { explain: u.culture.paras.join('\n\n'), compare: u.culture.compare || '' } }, 1);
    (u.reading.passages || []).forEach((p) => {
      D.passages.push({ topic: `${P}-R`, kind: 'reading', title: p.title, ko_text: p.ko, vi_text: p.vi || null });
      p.q.forEach((h) => addHand(`${P}-R`, { skill: 'reading', tag: 'reading', ...h }, { passage_ref: `${P}-R|${p.title}` }));
    });
    (u.reading.q || []).forEach((h) => addHand(`${P}-R`, { skill: 'reading', tag: 'reading', ...h }));
    // Viết
    topic({ code: `${P}-W`, level: 'sc1', grp: 'writing', unit: u.unit, name: `Bài ${u.unit} · Viết`, description: u.writingDesc || 'Viết câu và đoạn ngắn theo yêu cầu.', source: src });
    lesson(`${P}-W`, { title: 'Viết theo yêu cầu', goal: 'Viết câu đúng tiểu từ, đúng đuôi câu và đủ ý.', body: { explain: 'Bài viết được chấm theo tiêu chí; tiêu chí chưa đạt sẽ có gợi ý sửa. Giáo viên có thể nhận xét thêm trong trang quản trị.' } });
    (u.writing || []).forEach((h) => addHand(`${P}-W`, h));
  }

  /* ---------------- Sơ cấp 2 (phần đã có) ---------------- */
  for (const t of C.TOPICS.filter((x) => x.level === 'sc2')) { topic(t); if (C.LESSONS[t.code]) lesson(t.code, C.LESSONS[t.code]); }
  C.TOPICS.filter((t) => t.level === 'sc2' && t.grp === 'grammar').forEach((t) => {
    const b = C.LESSONS[t.code].body;
    D.grammar.push({ topic: t.code, pattern: C.LESSONS[t.code].title, meaning: t.description, formula: b.formula, explanation: b.explain, examples: b.examples, mistakes: b.mistakes, compare: b.compare });
  });
  for (const [tcode, words] of Object.entries(C.VOCAB)) if (grpOf[tcode]) { words.forEach(([ko, vi]) => D.vocab.push({ topic: tcode, ko, vi, note: null })); vocabQuestions(tcode, words.map((w) => [...w, 'x']), tcode); }
  for (const [tcode, list] of Object.entries(C.HAND)) if (grpOf[tcode] && C.TOPICS.find((t) => t.code === tcode).level === 'sc2') list.forEach((h) => addHand(tcode, h));
  C.UNVERIFIED.forEach((u) => addHand(u.topic, u));

  /* ---------------- Đề thi hệ thống ---------------- */
  const T = (n, s) => `S1-${pad(n)}-${s}`;
  const has = (code) => grpOf[code];
  const unitMatrix = (from, to, per) => {
    const m = [];
    for (let n = from; n <= to; n++) {
      if (!has(T(n, 'V'))) continue;
      m.push([T(n, 'V'), per.v]);
      for (let g = 1; has(T(n, 'G' + g)); g++) m.push([T(n, 'G' + g), per.g]);
      if (per.l) m.push([T(n, 'L'), per.l]);
      if (per.r) m.push([T(n, 'R'), per.r]);
      if (per.p && has(T(n, 'P'))) m.push([T(n, 'P'), per.p]);
    }
    return m;
  };
  const TYPES = ['mcq', 'listen', 'error', 'order', 'fill', 'conjugate', 'translate'];
  D.exams.push({ title: 'Kiểm tra Nhập môn: Hangeul', description: 'Nhận mặt chữ, nghe âm tiết, patchim và nối âm.', level: 'intro', duration: 10, pass: 70, show_answers: 1, scope: 'Nguyên âm, Phụ âm, Patchim', matrix: [['H-VOW', 5], ['H-CON', 5], ['H-BAT', 5]], types: TYPES });
  [[1, 5], [6, 10], [11, 15]].forEach(([a, b]) => {
    const m = unitMatrix(a, b, { v: 2, g: 1, l: 1, r: 1 });
    if (m.length) D.exams.push({ title: `Kiểm tra Sơ cấp 1 · Bài ${a}–${b}`, description: `Từ vựng, ngữ pháp, nghe, đọc của Bài ${a} đến Bài ${b}.`, level: 'sc1', duration: 40, pass: 60, show_answers: 1, scope: `Bài ${a}–${b}`, matrix: m, types: TYPES });
  });
  const all = unitMatrix(1, 15, { v: 1, g: 1, l: 0, r: 0 });
  if (all.length) D.exams.push({ title: 'Thi thử tổng hợp Sơ cấp 1', description: 'Toàn bộ 15 bài Sơ cấp 1: từ vựng và ngữ pháp của từng bài.', level: 'sc1', duration: 60, pass: 60, show_answers: 1, scope: 'Bài 1–15', matrix: all, types: TYPES });
  return D;
}

module.exports = { build, FORM_INFO, wrongForms };
