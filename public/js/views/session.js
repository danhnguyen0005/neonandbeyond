// Chế độ A: Luyện tập — phản hồi sau từng câu, không đếm giờ, tự lưu, có thể tạm dừng.
import { api, esc, h, $, pct, fmtDur, safeHtml, masteryChip, toast, modal, store, say, speakBtn } from '../core.js';
import { renderQuestion, renderFeedback } from '../question.js';
import { knowledgeBlock, kindLabel, start } from './learn.js';

export async function sessionPage(root, ctx, id) {
  let st = await api.get(`/sessions/${id}`);
  const title = st.topic ? st.topic.name : kindLabel[st.kind] || 'Luyện tập';
  const backHref = st.topic && st.kind === 'topic' ? `#/topic/${st.topic.id}` : '#/review';
  const top = h(`<div class="row between"><div class="stack tight"><span class="eyebrow">Chế độ luyện tập · ${esc(kindLabel[st.kind] || '')}</span><h1 style="font-size:22px">${esc(title)}</h1></div>
    <div class="row">${st.topic ? '<button class="btn sm" data-theory>Xem lý thuyết</button>' : ''}<a class="btn sm" href="${backHref}" data-pause>Tạm dừng</a></div></div>`);
  root.append(top);
  const dots = h('<div class="dots" aria-hidden="true"></div>');
  const counter = h('<span class="small muted num"></span>');
  root.append(h('<div class="row between"></div>')); root.lastElementChild.append(dots, counter);
  const stage = h('<div class="card qcard stack"></div>');
  root.append(stage);
  if (st.topic) $('[data-theory]', top).onclick = async () => {
    const d = await api.get(`/topics/${st.topic.id}`);
    modal({ title: 'Kiến thức cần nhớ · ' + d.topic.name, body: knowledgeBlock(d), wide: true });
  };
  const started = Date.now();

  const drawDots = () => {
    dots.innerHTML = st.results.map((r, i) => `<i class="${r ? (r.correct ? 'ok' : 'no') : i === st.cursor ? 'cur' : ''}"></i>`).join('');
    counter.textContent = `${Math.min(st.cursor + 1, st.total)}/${st.total} · đúng ${st.correct}`;
  };
  let keyHandler = null;
  const cleanup = () => { if (keyHandler) document.removeEventListener('keydown', keyHandler); };
  ctx.onLeave(cleanup);

  const show = () => {
    drawDots();
    stage.innerHTML = '';
    if (st.status === 'completed') return summary();
    if (st.status !== 'active' || !st.question) { stage.append(h('<div class="empty"><p>Phiên này đã kết thúc.</p></div>')); return; }
    const q = st.question;
    let busy = false;
    const R = renderQuestion(q, { mode: 'practice', onPick: (resp) => { if (!R.needsCheck) submit(resp); } });
    stage.append(R.el);
    const actions = h('<div class="row" style="justify-content:flex-end"></div>');
    const check = h('<button class="btn primary">Kiểm tra</button>');
    if (R.needsCheck) actions.append(check);
    stage.append(actions);
    if (R.el._input) R.el._input.focus();
    check.onclick = () => { const r = R.getResponse(); if (!r) { toast(q.type === 'order' ? 'Hãy xếp đủ các từ.' : 'Hãy nhập câu trả lời.'); return; } submit(r); };
    async function submit(resp) {
      if (busy) return; busy = true;
      try {
        const out = await api.post(`/sessions/${st.id}/answer`, { question_id: q.id, response: resp });
        R.lock(out.result);
        actions.innerHTML = '';
        stage.append(renderFeedback(out.result));
        const nx = h(`<button class="btn primary">${out.state.status === 'completed' ? 'Xem kết quả' : 'Câu tiếp'}</button>`);
        const row = h('<div class="row" style="justify-content:flex-end"></div>');
        if (!out.result.correct) {
          const sim = h('<button class="btn sm ghost">Luyện câu tương tự sau</button>');
          sim.onclick = () => { const l = store.get('similar', []); if (!l.includes(q.id)) l.push(q.id); store.set('similar', l.slice(-20)); sim.disabled = true; sim.textContent = 'Đã ghi nhớ'; };
          row.append(sim);
        }
        row.append(nx); stage.append(row);
        nx.focus();
        nx.onclick = () => { st = out.state; show(); };
        st.results = out.state.results; st.correct = out.state.correct; st.cursor = out.state.cursor; drawDots();
      } catch (e) { busy = false; toast(e.message, 'bad'); if (e.status === 409) { st = await api.get(`/sessions/${st.id}`); show(); } }
    }
    cleanup();
    keyHandler = (e) => {
      if (e.target.matches('input,textarea')) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !busy) check.click(); return; }
      if (R.el._keys && /^[1-4a-d]$/i.test(e.key) && !busy) R.el._keys(e.key);
      if (e.key === 'Enter') { const nx = stage.querySelector('.feedback ~ .row .btn.primary'); if (nx) { e.preventDefault(); nx.click(); } }
    };
    document.addEventListener('keydown', keyHandler);
  };

  function summary() {
    const s = st.summary;
    const acc = s.accuracy;
    stage.append(h(`<div class="stack" style="text-align:center;align-items:center"><span class="eyebrow">Kết quả phiên luyện tập</span>
      <div class="score-big">${st.correct}/${st.total}</div><div class="muted">Tỷ lệ đúng ${pct(acc)} · thời gian ${fmtDur(s.duration_sec)}</div>
      ${s.mastery ? `<div class="row">${masteryChip(s.mastery.level, s.mastery.label)}<span class="small muted">Đúng gần đây ${pct(s.mastery.accuracy)} · ${s.mastery.sessions_ok}/${s.mastery.rules.mastered_min_sessions} phiên đạt ngưỡng</span></div>` : ''}
      <div class="callout ${acc >= 0.85 ? 'ok' : acc >= 0.6 ? 'info' : 'warn'}" style="max-width:560px">${esc(s.advice)}</div></div>`));
    const list = h(`<div class="table-wrap"><table class="t"><thead><tr><th>#</th><th>Câu hỏi</th><th>Kết quả</th></tr></thead><tbody>${s.rows.map((r, i) => `<tr><td class="num">${i + 1}</td><td>${safeHtml(r.prompt)}<div class="small faint">${esc(r.topic)}</div></td><td>${r.correct ? '<span class="chip st-mastered">Đúng</span>' : r.correct === false ? '<span class="chip st-needs_review">Sai</span>' : '—'}</td></tr>`).join('')}</tbody></table></div>`);
    stage.append(list);
    const acts = h('<div class="row" style="justify-content:center"></div>');
    if (st.topic && st.kind === 'topic') { const b = h('<button class="btn primary">Luyện tiếp chủ đề này</button>'); b.onclick = () => start({ kind: 'topic', topic_id: st.topic.id, count: st.total, fresh: true }); acts.append(b); }
    if (s.wrong_ids.length) { const b = h(`<button class="btn">Làm lại ${s.wrong_ids.length} câu sai</button>`); b.onclick = () => start({ kind: 'retry', question_ids: s.wrong_ids }); acts.append(b); }
    const sim = store.get('similar', []);
    if (sim.length) { const b = h('<button class="btn">Luyện câu tương tự</button>'); b.onclick = () => { store.set('similar', []); start({ kind: 'similar', question_id: sim[sim.length - 1] }); }; acts.append(b); }
    if (st.topic) acts.append(h(`<a class="btn" href="#/topic/${st.topic.id}">Ôn lại lý thuyết</a>`));
    acts.append(h('<a class="btn" href="#/practice">Chọn chủ đề khác</a>'));
    stage.append(acts);
    $('[data-pause]', top).textContent = 'Đóng';
  }
  show();
  ctx.setDirtyCheck(null);
  void started;
}

/* ------------------------------ THẺ GHI NHỚ ------------------------------ */
const BUCKET = { new: 'Từ mới chưa học', due: 'Từ đến hạn ôn', weak: 'Từ chưa ghi nhớ', often_wrong: 'Từ thường trả lời sai', check: 'Từ đã thành thạo cần kiểm tra', topic: 'Từ vựng của chủ đề' };
export async function flashPage(root, ctx, params) {
  const bucket = params.get('bucket') || 'due', topic = params.get('topic');
  const deck = await api.get(`/vocab/deck?bucket=${encodeURIComponent(bucket)}${topic ? '&topic_id=' + topic : ''}`);
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Ôn tập từ vựng · thẻ ghi nhớ</span><h1>${esc(BUCKET[bucket] || 'Từ vựng')}</h1>
    <p class="muted small">Lật thẻ, tự đánh giá. “Đã nhớ” đẩy từ lên mức ghi nhớ cao hơn và giãn lịch ôn; “Chưa nhớ” đưa từ về ôn sớm.</p></div><a class="btn" href="${topic ? '#/topic/' + topic : '#/review?tab=vocab'}">Quay lại</a></div>`));
  const stage = h('<div class="card qcard stack"></div>'); root.append(stage);
  if (!deck.length) { stage.append(h(`<div class="empty"><span class="glyph">끝</span><p>Nhóm này hiện không có từ nào.</p><a class="btn" href="#/review?tab=vocab">Về ôn tập từ vựng</a></div>`)); return; }
  let i = 0, flip = false, known = 0;
  const draw = () => {
    stage.innerHTML = '';
    if (i >= deck.length) {
      stage.append(h(`<div class="empty"><span class="glyph">완</span><p>Đã ôn ${deck.length} từ, nhớ ${known} từ.</p><div class="row"><a class="btn primary" href="#/review?tab=vocab">Về ôn tập từ vựng</a></div></div>`)); return;
    }
    const v = deck[i];
    stage.append(h(`<div class="row between small muted"><span>Thẻ ${i + 1}/${deck.length}</span><span>${esc(v.topic)}</span></div>`));
    const card = h(`<button type="button" class="card flat" style="min-height:220px;display:grid;place-items:center;text-align:center;cursor:pointer;width:100%" aria-label="Lật thẻ">
      <div class="stack" style="align-items:center"><div class="ko" style="font-size:52px;font-family:var(--f-display);line-height:1.1">${esc(v.ko)}</div>
      ${flip ? `<div style="font-size:20px;color:var(--jade);font-weight:700">${esc(v.vi)}</div>` : '<div class="small faint">Bấm để xem nghĩa (phím cách)</div>'}</div></button>`);
    card.onclick = () => { flip = !flip; draw(); };
    stage.append(card);
    const row = h(`<div class="row" style="justify-content:center">${speakBtn(v.ko)}<button class="btn" data-no>Chưa nhớ</button><button class="btn primary" data-yes>Đã nhớ</button></div>`);
    const rate = async (k) => { try { await api.post(`/vocab/${v.id}/review`, { known: k }); if (k) known++; i++; flip = false; draw(); } catch (e) { toast(e.message, 'bad'); } };
    $('[data-no]', row).onclick = () => rate(false); $('[data-yes]', row).onclick = () => rate(true);
    stage.append(row);
    if (!flip) setTimeout(() => say(v.ko), 200);
  };
  const onKey = (e) => { if (e.key === ' ') { e.preventDefault(); flip = !flip; draw(); } };
  document.addEventListener('keydown', onKey); ctx.onLeave(() => document.removeEventListener('keydown', onKey));
  draw();
}
