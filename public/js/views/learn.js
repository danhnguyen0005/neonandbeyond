// Tab 1: Lộ trình · Tab 2: Trung tâm luyện tập · Trang chi tiết chủ đề
import { api, esc, h, $, $$, pct, ago, statusChip, masteryChip, gicon, GROUP, speakBtn, ICON, store, TYPE_LABEL, toast, say, modal } from '../core.js';

const bar = (v, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.round(v)}%"></i></div>`;
const kindLabel = { topic: 'Luyện chủ đề', mixed: 'Ôn tập tổng hợp', mistakes: 'Ôn câu sai', retry: 'Làm lại câu sai', similar: 'Câu tương tự', errors: 'Ôn lỗi thường gặp', grammar: 'Ôn ngữ pháp', vocab: 'Ôn từ vựng', challenge: 'Thử thách', exam_prep: 'Ôn trước kỳ thi' };

/* ------------------------------ LỘ TRÌNH ------------------------------ */
export async function overview(root, ctx) {
  const d = await api.get('/overview');
  const goalPct = Math.min(100, (d.today.answers / d.today.goal) * 100);
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Tổng quan lộ trình</span><h1>Chào ${esc(ctx.user.display_name)}</h1>
    <p class="muted">Đi từ bảng chữ cái đến hội thoại sơ cấp. Tiến độ cho biết bạn đã học tới đâu; mức thành thạo cho biết bạn đã nhớ chắc tới đâu.</p></div>
    <div class="card flat" style="min-width:230px"><div class="kpi"><span class="l">Mục tiêu hôm nay</span><span class="v num">${d.today.answers}<span class="muted" style="font-size:16px"> / ${d.today.goal} câu</span></span></div>${bar(goalPct)}</div></div>`));

  const top = h('<div class="grid g3"></div>');
  if (d.next) top.append(h(`<a class="card tcard g-${d.next.grp}" href="#/topic/${d.next.id}" style="text-decoration:none">
    <span class="eyebrow">Bài tiếp theo được đề xuất</span><div class="row">${gicon(d.next.grp)}<div class="stack tight" style="min-width:0"><b>${esc(d.next.name)}</b><span class="small muted">${esc(d.next.level_name)} · ${esc(d.next.source || '')}</span></div></div>
    <div class="meta">${statusChip(d.next.status, d.next.status_label)}<span>Hoàn thành ${d.next.completion}%</span></div></a>`));
  const act = d.active_sessions[0];
  top.append(h(`<div class="card stack"><span class="eyebrow">Phiên đang dở</span>${act ? `<b>${esc(act.topic_name || kindLabel[act.kind] || 'Luyện tập')}</b><span class="small muted">Đã làm ${act.cursor}/${act.total} câu</span><a class="btn primary" href="#/session/${act.id}">Tiếp tục</a>`
    : '<span class="muted small">Không có phiên nào đang dở. Phiên luyện tập được tự động lưu, bạn có thể rời đi và quay lại bất cứ lúc nào.</span>'}</div>`));
  top.append(h(`<div class="card stack"><span class="eyebrow">Cần ôn tập</span>
    <div class="row between"><span>Từ vựng đến hạn</span><b class="num">${d.due_vocab}</b></div><div class="row between"><span>Câu sai cần làm lại</span><b class="num">${d.due_mistakes}</b></div>
    <a class="btn" href="#/review">Mở trung tâm ôn tập</a></div>`));
  root.append(top);

  if (d.review.length) {
    root.append(h(`<div class="card"><h2>Kiến thức đang cần ôn</h2><p class="small muted">Các chủ đề bạn đã học nhưng còn câu sai chưa sửa, từ đến hạn ôn, hoặc tỷ lệ đúng gần đây thấp.</p>
      <div>${d.review.map((t) => `<a class="trow" href="#/topic/${t.id}">${gicon(t.grp)}<div><div class="tn">${esc(t.name)}</div><div class="small muted">${t.due_mistakes ? t.due_mistakes + ' câu sai cần làm lại · ' : ''}${t.due_vocab ? t.due_vocab + ' từ đến hạn · ' : ''}Đúng gần đây ${pct(t.accuracy)}</div></div>
      <div class="side-r">${statusChip(t.status, t.status_label)}${masteryChip(t.mastery, t.mastery_label)}</div></a>`).join('')}</div></div>`));
  }

  for (const lv of d.levels) {
    const sec = h(`<section class="card stack"><div class="head"><div class="stack tight"><span class="eyebrow">Giai đoạn ${lv.code === 'intro' ? '0' : lv.code === 'sc1' ? '1' : '2'}</span><h2>${esc(lv.name)}</h2>
      <p class="small muted">${esc(lv.description)}</p><p class="small"><b>Mục tiêu:</b> ${esc(lv.goal)}</p></div>
      <div class="stack tight" style="min-width:220px"><div class="row between small"><span>Tiến độ học</span><b class="num">${lv.completed}/${lv.total} chủ đề</b></div>${bar(lv.progress)}
      <div class="row between small"><span>Thành thạo</span><b class="num">${lv.mastered}/${lv.total}</b></div>${bar(lv.mastery_rate, 'indigo')}</div></div><div></div></section>`);
    const list = sec.lastElementChild;
    const row = (t) => `<a class="trow" href="#/topic/${t.id}">${gicon(t.grp)}<div style="min-width:0"><div class="tn">${esc(t.name)}</div><div class="small muted">${esc(t.description || '')}</div></div>
      <div class="side-r">${statusChip(t.status, t.status_label)}<div style="width:130px">${bar(t.completion)}</div><span class="small faint">${t.completion}% · ${esc(t.mastery_label)}</span></div></a>`;
    // Cấp độ chia theo bài (Bài 1 … Bài 15): mỗi bài là một khối thu gọn được
    const units = [...new Set(lv.topics.filter((t) => t.unit != null).map((t) => t.unit))].sort((a, b) => a - b);
    lv.topics.filter((t) => t.unit == null).forEach((t) => list.append(h(row(t))));
    const openUnit = (d.next && d.next.level_id === lv.id && d.next.unit) || units.find((u) => lv.topics.some((t) => t.unit === u && !t.completed_at));
    units.forEach((u) => {
      const ts = lv.topics.filter((t) => t.unit === u);
      const done = ts.filter((t) => t.completed_at).length, mast = ts.filter((t) => t.mastery === 'mastered').length;
      const det = h(`<details class="unit"${u === openUnit ? ' open' : ''}><summary><div class="stack tight" style="min-width:0"><b>${esc(ts[0].source || 'Bài ' + u)}</b>
        <span class="small muted">${ts.length} chủ đề · đã học ${done} · thành thạo ${mast}</span></div><div class="row" style="gap:10px"><div style="width:110px">${bar(ts.length ? (done / ts.length) * 100 : 0)}</div>${ICON.chev}</div></summary><div></div></details>`);
      ts.forEach((t) => det.lastElementChild.append(h(row(t))));
      list.append(det);
    });
    root.append(sec);
  }
}

/* ------------------------------ TRUNG TÂM LUYỆN TẬP ------------------------------ */
export async function practiceCenter(root) {
  const d = await api.get('/practice-center');
  let grp = store.get('pc:grp', 'all'), lvl = store.get('pc:lvl', 'all'), unit = store.get('pc:unit', 'all');
  const levels = [...new Set(d.groups.flatMap((g) => g.topics.map((t) => t.level_name)))];
  const unitSrc = new Map(); d.groups.flatMap((g) => g.topics).forEach((t) => { if (t.unit != null && !unitSrc.has(t.unit)) unitSrc.set(t.unit, t.source); });
  const units = [...unitSrc.keys()].sort((a, b) => a - b);
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Trung tâm luyện tập</span><h1>Chọn chủ đề để luyện</h1>
    <p class="muted">Chủ đề sắp theo nhóm kiến thức và cấp độ. Mỗi thẻ cho biết trạng thái học, tỷ lệ hoàn thành và mức thành thạo.</p></div></div>`));
  const filt = h(`<div class="row between"><div class="seg" role="tablist" aria-label="Nhóm kiến thức"><button data-g="all">Tất cả</button>${d.groups.map((g) => `<button data-g="${g.grp}">${esc(GROUP[g.grp].label.split(' · ')[0])}</button>`).join('')}</div>
    <div class="row"><select class="input" style="width:auto" aria-label="Cấp độ" data-f="lvl"><option value="all">Mọi cấp độ</option>${levels.map((l) => `<option>${esc(l)}</option>`).join('')}</select>
    ${units.length ? `<select class="input" style="width:auto;max-width:260px" aria-label="Bài" data-f="unit"><option value="all">Mọi bài</option>${units.map((u) => `<option value="${u}">${esc(unitSrc.get(u) || 'Bài ' + u)}</option>`).join('')}</select>` : ''}</div></div>`);
  root.append(filt);
  const body = h('<div class="stack" style="gap:26px"></div>'); root.append(body);
  const draw = () => {
    $$('.seg button', filt).forEach((b) => b.classList.toggle('on', b.dataset.g === grp));
    $('[data-f=lvl]', filt).value = lvl;
    const us = $('[data-f=unit]', filt); if (us) us.value = unit;
    body.innerHTML = '';
    d.groups.filter((g) => grp === 'all' || g.grp === grp).forEach((g) => {
      const ts = g.topics.filter((t) => (lvl === 'all' || t.level_name === lvl) && (unit === 'all' || String(t.unit) === String(unit)));
      if (!ts.length) return;
      const sec = h(`<section class="stack"><div class="row">${gicon(g.grp)}<h2>${esc(g.label)}</h2><span class="faint small">${ts.length} chủ đề</span></div><div class="grid auto"></div></section>`);
      ts.forEach((t) => sec.lastElementChild.append(h(`<a class="tcard g-${t.grp}" href="#/topic/${t.id}">
        <div class="meta"><span>${esc(t.unit != null ? 'Bài ' + t.unit : t.level_name)}</span>${statusChip(t.status, t.status_label)}</div>
        <div class="tt">${esc(t.name)}</div><div class="small muted" style="flex:1">${esc(t.description || '')}</div>
        <div class="stack tight"><div class="row between small"><span>Hoàn thành</span><b class="num">${t.completion}%</b></div>${bar(t.completion)}</div>
        <div class="meta">${masteryChip(t.mastery, t.mastery_label)}<span>${t.total_questions} câu hỏi</span></div></a>`)));
      body.append(sec);
    });
    if (!body.children.length) body.append(h('<div class="card empty"><span class="glyph">빈</span><p>Không có chủ đề nào khớp bộ lọc.</p></div>'));
  };
  filt.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { grp = b.dataset.g; store.set('pc:grp', grp); draw(); } });
  $('[data-f=lvl]', filt).onchange = (e) => { lvl = e.target.value; store.set('pc:lvl', lvl); draw(); };
  const usel = $('[data-f=unit]', filt); if (usel) usel.onchange = (e) => { unit = e.target.value; store.set('pc:unit', unit); draw(); };
  draw();
}

/* ------------------------------ TRANG CHỦ ĐỀ ------------------------------ */
const VOW = [['ㅏ', 'a', '아'], ['ㅑ', 'ya', '야'], ['ㅓ', 'eo', '어'], ['ㅕ', 'yeo', '여'], ['ㅗ', 'o', '오'], ['ㅛ', 'yo', '요'], ['ㅜ', 'u', '우'], ['ㅠ', 'yu', '유'], ['ㅡ', 'eu', '으'], ['ㅣ', 'i', '이'], ['ㅐ', 'ae', '애'], ['ㅒ', 'yae', '얘'], ['ㅔ', 'e', '에'], ['ㅖ', 'ye', '예'], ['ㅘ', 'wa', '와'], ['ㅙ', 'wae', '왜'], ['ㅚ', 'oe', '외'], ['ㅝ', 'wo', '워'], ['ㅞ', 'we', '웨'], ['ㅟ', 'wi', '위'], ['ㅢ', 'ui', '의']];
const CON = [['ㄱ', 'g/k', '가'], ['ㄴ', 'n', '나'], ['ㄷ', 'd/t', '다'], ['ㄹ', 'r/l', '라'], ['ㅁ', 'm', '마'], ['ㅂ', 'b/p', '바'], ['ㅅ', 's', '사'], ['ㅇ', '—/ng', '아'], ['ㅈ', 'j', '자'], ['ㅊ', 'ch', '차'], ['ㅋ', 'kh', '카'], ['ㅌ', 'th', '타'], ['ㅍ', 'ph', '파'], ['ㅎ', 'h', '하'], ['ㄲ', 'kk', '까'], ['ㄸ', 'tt', '따'], ['ㅃ', 'pp', '빠'], ['ㅆ', 'ss', '싸'], ['ㅉ', 'jj', '짜']];
const jamoChart = (list) => `<div class="jamo-grid">${list.map(([c, r, s]) => `<button type="button" class="jamo" data-say="${s}"><b>${c}</b><span>${r}</span></button>`).join('')}</div>`;

const vcell = (v) => `<div class="vcell"><div><div class="k">${esc(v.ko)}</div><div class="v">${esc(v.vi)}</div></div>
  <span class="boxdots" title="${v.box == null ? 'Chưa học' : 'Mức ghi nhớ ' + v.box + '/6'}">${[1, 2, 3, 4, 5, 6].map((i) => `<i class="${v.box >= i ? 'f' : ''}"></i>`).join('')}</span>${speakBtn(v.ko)}</div>`;
// Từ vựng chia theo nhóm (cột note) nếu có
function vocabGroups(list) {
  const groups = []; const idx = new Map();
  list.forEach((v) => { const k = v.note || ''; if (!idx.has(k)) { idx.set(k, groups.length); groups.push([k, []]); } groups[idx.get(k)][1].push(v); });
  if (groups.length === 1) return `<div class="vgrid">${list.map(vcell).join('')}</div>`;
  return groups.map(([k, vs]) => `<div class="stack tight" style="margin-top:8px"><span class="small"><b>${esc(k || 'Khác')}</b> <span class="faint">· ${vs.length} từ</span></span><div class="vgrid">${vs.map(vcell).join('')}</div></div>`).join('');
}

export function knowledgeBlock(d) {
  const t = d.topic;
  const wrap = h('<div class="stack"></div>');
  for (const l of d.lessons) {
    const b = l.body || {};
    wrap.append(h(`<div class="stack">
      ${d.lessons.length > 1 ? `<h3>${esc(l.title)}</h3>` : ''}
      ${l.goal ? `<div class="callout info"><b>Mục tiêu:</b> <span class="ink">${esc(l.goal)}</span></div>` : ''}
      ${b.explain ? b.explain.split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('') : ''}
      ${b.formula ? `<div class="stack tight"><span class="lbl">Công thức</span><div class="formula">${esc(b.formula)}</div></div>` : ''}
      ${b.examples && b.examples.length ? `<div class="stack tight"><span class="lbl">Ví dụ</span><div class="ex">${b.examples.map((e) => `${speakBtn(e[0].split(' → ')[0])}<span class="k">${esc(e[0])}</span><span class="v">${esc(e[1])}</span>`).join('')}</div></div>` : ''}
      ${b.mistakes && b.mistakes.length ? `<div class="stack tight"><span class="lbl">Lỗi thường gặp</span><ul class="mist" style="margin:0;padding-left:20px">${b.mistakes.map((m) => `<li class="ko">${esc(m)}</li>`).join('')}</ul></div>` : ''}
      ${b.compare ? `<div class="callout warn"><b>So sánh dễ nhầm:</b> <span class="ink ko">${esc(b.compare)}</span></div>` : ''}
    </div>`));
  }
  if (t.code === 'H-VOW') wrap.append(h(`<div class="stack tight"><span class="lbl">Bảng nguyên âm — bấm để nghe</span>${jamoChart(VOW)}</div>`));
  if (t.code === 'H-CON') wrap.append(h(`<div class="stack tight"><span class="lbl">Bảng phụ âm — bấm để nghe</span>${jamoChart(CON)}</div>`));
  if (d.vocab && d.vocab.length) {
    wrap.append(h(`<div class="stack tight"><div class="row between"><span class="lbl">Từ vựng (${d.vocab.length})</span><a class="btn sm" href="#/flash?bucket=topic&topic=${t.id}">Học bằng thẻ ghi nhớ</a></div>
      ${vocabGroups(d.vocab)}</div>`));
  }
  if (d.passages && d.passages.length) {
    d.passages.forEach((p) => wrap.append(h(`<details class="card flat know"><summary><b>${esc(p.title)}</b>${ICON.chev}</summary><div class="stack" style="margin-top:10px"><div class="passage">${esc(p.ko_text)}</div><div class="row">${speakBtn(p.ko_text)}<span class="small muted">${esc(p.vi_text || '')}</span></div></div></details>`)));
  }
  return wrap;
}

export async function topicPage(root, ctx, id) {
  const d = await api.get(`/topics/${id}`);
  const t = d.topic, s = d.status, m = s.mastery;
  api.post(`/topics/${id}/viewed`).catch(() => {});
  const rules = m.rules;
  root.append(h(`<div class="small"><a href="#/practice">Trung tâm luyện tập</a> / ${esc(GROUP[t.grp].label)}</div>`));
  root.append(h(`<div class="head g-${t.grp}"><div class="row" style="align-items:flex-start">${gicon(t.grp)}<div class="stack tight"><span class="eyebrow">${esc(t.level_name)} · ${esc(t.source || '')}</span><h1>${esc(t.name)}</h1><p class="muted">${esc(t.description || '')}</p></div></div></div>`));
  root.append(h(`<div class="grid g3">
    <div class="card stack tight"><span class="lbl">Tiến độ học</span><div class="row between">${statusChip(s.status, s.status_label)}<b class="num">${s.completion}%</b></div>${bar(s.completion)}
      <span class="small faint">Đã làm ${s.seen_questions}/${s.total_questions} câu khác nhau${s.completed_at ? ' · đã hoàn thành bài' : ''}</span></div>
    <div class="card stack tight"><span class="lbl">Mức thành thạo</span><div class="row between">${masteryChip(m.level, m.label)}<b class="num">${pct(m.recent_accuracy)}</b></div>
      <span class="small faint">${m.answered} câu đã làm · ${m.sessions_ok}/${rules.mastered_min_sessions} phiên đạt ${Math.round(rules.mastered_min_accuracy * 100)}%</span></div>
    <div class="card stack tight"><span class="lbl">Cần ôn</span><div class="row between"><span class="small">Câu sai chưa sửa</span><b class="num">${s.due_mistakes}</b></div><div class="row between"><span class="small">Từ đến hạn ôn</span><b class="num">${s.due_vocab}</b></div>
      ${s.due_mistakes ? `<button class="btn sm" data-mist>Ôn câu sai của chủ đề</button>` : ''}</div></div>`));
  const mBtn = $('[data-mist]', root);
  if (mBtn) mBtn.onclick = () => start({ kind: 'mistakes', topic_id: t.id });

  // A. Kiến thức cần nhớ (thu gọn được)
  const openKey = 'know:' + t.id;
  const know = h(`<details class="card know" ${store.get(openKey, s.status === 'not_started' || s.status === 'in_progress') ? 'open' : ''}><summary><div class="stack tight"><span class="eyebrow">A · Kiến thức cần nhớ</span><h2>Lý thuyết</h2></div>${ICON.chev}</summary><div style="margin-top:14px"></div></details>`);
  know.lastElementChild.append(knowledgeBlock(d));
  know.addEventListener('toggle', () => store.set(openKey, know.open));
  root.append(know);

  // B. Luyện tập
  const typesAvail = d.types.map((x) => x.type);
  const ex = h(`<div class="card stack"><div class="stack tight"><span class="eyebrow">B · Bài tập luyện tập</span><h2>Luyện tập</h2>
    <p class="small muted">Không giới hạn thời gian. Phản hồi ngay sau mỗi câu. Câu hỏi được xáo trộn và ưu tiên câu bạn chưa làm hoặc hay sai. Có thể rời đi giữa chừng, phiên được lưu lại.</p></div>
    <div class="row"><span class="lbl">Số câu</span><div class="seg" data-count>${[5, 10, 15, 20].map((n) => `<button data-n="${n}">${n}</button>`).join('')}</div></div>
    ${typesAvail.length > 1 ? `<div class="stack tight"><span class="lbl">Dạng bài (bỏ trống = tất cả)</span><div class="checks">${typesAvail.map((ty) => `<label class="check"><input type="checkbox" value="${ty}">${esc(TYPE_LABEL[ty])} <span class="faint">${d.types.find((x) => x.type === ty).n}</span></label>`).join('')}</div></div>` : ''}
    <div class="row">${d.active_session ? `<a class="btn primary" href="#/session/${d.active_session.id}">Tiếp tục phiên đang dở (${d.active_session.cursor}/${d.active_session.total})</a><button class="btn" data-new>Bắt đầu phiên mới</button>` : '<button class="btn primary" data-new>Bắt đầu luyện tập</button>'}</div>
    <div class="callout small">${m.level === 'mastered' ? 'Bạn đã thành thạo chủ đề này. Vẫn có thể luyện lại bất cứ lúc nào để duy trì.' : m.level === 'needs_practice' ? 'Tỷ lệ đúng gần đây còn thấp. Hãy đọc lại phần lý thuyết trước khi luyện tiếp.' : `Để đạt “Thành thạo”: làm ít nhất ${rules.mastered_min_questions} câu, tỷ lệ đúng ≥ ${Math.round(rules.mastered_min_accuracy * 100)}% trong ${rules.window} câu gần nhất và qua ít nhất ${rules.mastered_min_sessions} phiên khác nhau đạt ngưỡng.`}</div></div>`);
  let count = store.get('count', 10);
  const seg = $('[data-count]', ex);
  const drawSeg = () => $$('button', seg).forEach((b) => b.classList.toggle('on', Number(b.dataset.n) === count));
  seg.onclick = (e) => { const b = e.target.closest('button'); if (b) { count = Number(b.dataset.n); store.set('count', count); drawSeg(); } };
  drawSeg();
  $('[data-new]', ex).onclick = () => start({ kind: 'topic', topic_id: t.id, count, fresh: true, types: $$('.checks input:checked', ex).map((i) => i.value) });
  root.append(ex);

  if (t.grp === 'writing' && d.writings.length) {
    root.append(h(`<div class="card stack"><h2>Bài viết của bạn</h2>${d.writings.map((w) => `<div class="stack tight" style="border-top:1px solid var(--line);padding-top:10px"><span class="small muted">${esc(w.prompt)}</span><span class="ko">${esc(w.text)}</span>
      <span class="small">Chấm tự động: <b>${Math.round(w.auto_score * 100)}%</b> tiêu chí · ${ago(w.created_at.replace(' ', 'T') + 'Z')}</span>${w.feedback ? `<div class="callout info small"><b>Nhận xét của giáo viên:</b> <span class="ink">${esc(w.feedback)}</span></div>` : ''}</div>`).join('')}</div>`));
  }
}

export async function start(body) {
  try {
    const s = await api.post('/sessions', body);
    location.hash = `#/session/${s.id}`;
  } catch (e) { toast(e.message, 'bad'); }
}
export { kindLabel };
