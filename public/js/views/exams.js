// Tab 3: Thi thử (chế độ B) — có đồng hồ, không hiện đáp án từng câu, điều hướng câu, đánh dấu, nộp bài.
import { api, esc, h, $, $$, pct, fmtDur, fmtDate, toast, confirmBox, ICON, SKILL_LABEL, TYPE_LABEL, store, safeHtml } from '../core.js';
import { renderQuestion, reviewBlock } from '../question.js';
import { start as startSession } from './learn.js';

const ST = { in_progress: ['Đang làm', 'st-in_progress'], submitted: ['Đã nộp', 'st-completed'], auto_submitted: ['Tự nộp khi hết giờ', 'st-needs_review'], abandoned: ['Đã huỷ', 'st-not_started'] };
const stChip = (s) => `<span class="chip ${ST[s][1]}">${ST[s][0]}</span>`;

export async function examsPage(root) {
  const d = await api.get('/exams');
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Thi thử</span><h1>Kiểm tra trong điều kiện có giới hạn thời gian</h1>
    <p class="muted">Không hiện đáp án trong lúc làm. Bạn có thể đánh dấu câu để xem lại, chuyển qua lại giữa các câu và nộp bài bất cứ lúc nào. Hết giờ, bài được tự động nộp.</p></div></div>`));
  const cards = (list) => list.map((e) => `<div class="card stack">
    <div class="row between"><b>${esc(e.title)}</b>${e.in_progress ? '<span class="chip st-in_progress">Đang làm dở</span>' : ''}</div>
    <span class="small muted">${esc(e.description || '')}</span>
    <div class="grid g3 small"><div class="kpi"><span class="l">Số câu</span><b class="num">${e.question_count}</b></div><div class="kpi"><span class="l">Thời gian</span><b class="num">${e.duration_min} phút</b></div><div class="kpi"><span class="l">Điểm đạt</span><b class="num">${e.pass_score != null ? e.pass_score + '/100' : 'Không quy định'}</b></div></div>
    <span class="small faint">Phạm vi: ${esc(e.topics.length ? e.topics.map((t) => t.name).join(', ') : e.scope || '—')}</span>
    <div class="row between"><span class="small">${e.attempts.filter((a) => a.score != null).length ? `Đã thi ${e.attempts.filter((a) => a.score != null).length} lần · cao nhất <b>${e.best}</b>` : '<span class="faint">Chưa thi lần nào</span>'}</span>
    <a class="btn ${e.in_progress ? 'primary' : ''}" href="#/exam/${e.id}">${e.in_progress ? 'Tiếp tục' : 'Xem & bắt đầu'}</a></div></div>`).join('');
  root.append(h(`<section class="stack"><h2>Đề có sẵn</h2><div class="grid g3">${cards(d.official) || '<div class="card empty">Chưa có đề nào được mở.</div>'}</div></section>`));

  // Tạo đề ngẫu nhiên
  const gen = h(`<section class="card stack"><div class="stack tight"><span class="eyebrow">Tạo đề ngẫu nhiên</span><h2>Đề của riêng bạn</h2>
    <p class="small muted">Lấy từ ngân hàng câu hỏi đã xác minh đáp án. Thi tổng hợp: câu được chia đều giữa các chủ đề. Chọn một chủ đề: chỉ lấy câu thuộc chủ đề đó.</p></div>
    <div class="grid g4">
      <div class="field"><label for="g-mode">Phạm vi</label><select id="g-mode" class="input"><option value="level">Tổng hợp theo cấp độ</option><option value="topics">Chọn chủ đề</option></select></div>
      <div class="field"><label for="g-level">Cấp độ</label><select id="g-level" class="input"></select></div>
      <div class="field"><label for="g-count">Số câu</label><input id="g-count" class="input" type="number" min="5" max="60" value="20"></div>
      <div class="field"><label for="g-dur">Thời gian (phút)</label><input id="g-dur" class="input" type="number" min="3" max="120" value="15"></div>
      <div class="field"><label for="g-diff">Mức độ khó</label><select id="g-diff" class="input"><option value="mixed">Trộn dễ – vừa – khó</option><option value="any">Bất kỳ</option><option value="1">Dễ</option><option value="2">Vừa</option><option value="3">Khó</option></select></div>
    </div>
    <div class="stack tight" data-topics hidden><span class="lbl">Chủ đề (số câu đã xác minh)</span><div class="checks"></div></div>
    <div class="stack tight"><span class="lbl">Loại câu hỏi (bỏ trống = tất cả)</span><div class="checks">${['mcq', 'listen', 'error', 'order', 'conjugate', 'translate', 'fill'].map((t) => `<label class="check"><input type="checkbox" name="ty" value="${t}">${TYPE_LABEL[t]}</label>`).join('')}</div></div>
    <div class="row"><button class="btn primary" data-gen>Tạo đề</button><span class="small muted" data-msg></span></div></section>`);
  const lvSel = $('#g-level', gen);
  const lvList = [...new Set(d.limits.map((t) => t.level_id))];
  lvList.forEach((id) => lvSel.append(h(`<option value="${id}">${esc(d.limits.find((t) => t.level_id === id).level_name)} · ${d.limits.filter((t) => t.level_id === id).reduce((s, t) => s + t.n, 0)} câu</option>`)));
  lvSel.value = lvList[1] || lvList[0];
  const drawTopics = () => {
    const box = $('[data-topics] .checks', gen);
    box.innerHTML = d.limits.filter((t) => t.level_id === Number(lvSel.value) && t.n > 0).map((t) => `<label class="check"><input type="checkbox" name="tp" value="${t.topic_id}">${esc(t.name)} <span class="faint">${t.n}</span></label>`).join('');
  };
  $('#g-mode', gen).onchange = (e) => { $('[data-topics]', gen).hidden = e.target.value !== 'topics'; };
  lvSel.onchange = drawTopics; drawTopics();
  $('[data-gen]', gen).onclick = async () => {
    const body = { level_id: Number(lvSel.value), count: Number($('#g-count', gen).value), duration_min: Number($('#g-dur', gen).value), difficulty: $('#g-diff', gen).value,
      types: $$('input[name=ty]:checked', gen).map((i) => i.value) };
    if ($('#g-mode', gen).value === 'topics') { body.topic_ids = $$('input[name=tp]:checked', gen).map((i) => Number(i.value)); if (!body.topic_ids.length) return toast('Hãy chọn ít nhất một chủ đề.', 'bad'); delete body.level_id; }
    try { const r = await api.post('/exams/generate', body); location.hash = `#/exam/${r.id}`; }
    catch (e) { $('[data-msg]', gen).innerHTML = `<span style="color:var(--bad)">${esc(e.message)}</span>${e.data && e.data.suggestion ? ` <button class="btn sm" data-sug="${e.data.suggestion}">Dùng ${e.data.suggestion} câu</button>` : ''}`; }
  };
  gen.addEventListener('click', (e) => { const b = e.target.closest('[data-sug]'); if (b) { $('#g-count', gen).value = b.dataset.sug; $('[data-gen]', gen).click(); } });
  root.append(gen);
  if (d.custom.length) root.append(h(`<section class="stack"><h2>Đề bạn đã tạo</h2><div class="grid g3">${cards(d.custom)}</div></section>`));
}

export async function examInfoPage(root, ctx, id) {
  const e = await api.get(`/exams/${id}`);
  root.append(h(`<div class="small"><a href="#/exams">Thi thử</a> / ${esc(e.title)}</div>`));
  root.append(h(`<div class="card stack"><span class="eyebrow">${e.kind === 'custom' ? 'Đề tự tạo' : 'Đề có sẵn'}</span><h1>${esc(e.title)}</h1><p class="muted">${esc(e.description || '')}</p>
    <div class="grid g4"><div class="kpi"><span class="l">Số câu</span><span class="v">${e.question_count}</span></div><div class="kpi"><span class="l">Thời gian</span><span class="v">${e.duration_min}′</span></div>
    <div class="kpi"><span class="l">Điểm đạt</span><span class="v">${e.pass_score != null ? e.pass_score : '—'}</span><span class="s">trên thang 100</span></div><div class="kpi"><span class="l">Hiện đáp án sau khi nộp</span><span class="v" style="font-size:18px">${e.show_answers ? 'Có' : 'Không'}</span></div></div>
    <div class="stack tight"><span class="lbl">Phạm vi kiến thức</span><span>${esc(e.topics.length ? e.topics.map((t) => `${t.name} (${t.count})`).join(' · ') : e.scope || '—')}</span>
    <span class="small muted">Theo kỹ năng: ${e.by_skill.map((s) => `${SKILL_LABEL[s.skill] || s.skill} ${s.n}`).join(' · ')}</span></div>
    <div class="callout small">Quy định: đồng hồ chạy ngay khi bắt đầu và tiếp tục chạy kể cả khi bạn rời trang. Nếu quay lại khi còn giờ, bạn tiếp tục đúng lượt đang làm; câu trả lời đã được lưu sau mỗi lần chọn. Hết giờ, bài được tự động nộp với các câu đã lưu. Bạn cũng có thể chủ động huỷ lượt thi; lượt bị huỷ không được tính điểm.</div>
    <div class="row">${e.in_progress ? '<button class="btn primary" data-go>Tiếp tục lượt đang làm</button><button class="btn danger" data-ab>Huỷ lượt này</button>' : '<button class="btn primary" data-go>Bắt đầu thi</button>'}</div></div>`));
  $('[data-go]', root).onclick = async () => { try { const a = await api.post(`/exams/${id}/start`); location.hash = `#/attempt/${a.id}`; } catch (er) { toast(er.message, 'bad'); } };
  const ab = $('[data-ab]', root);
  if (ab) ab.onclick = async () => { if (await confirmBox('Huỷ lượt thi?', 'Lượt thi đang làm sẽ bị huỷ và không được tính điểm.', 'Huỷ lượt thi', 'danger')) { await api.post(`/attempts/${e.in_progress.id}/abandon`); location.reload(); } };
  if (e.attempts.length) root.append(h(`<div class="card stack"><h2>Kết quả các lần thi trước</h2><div class="table-wrap"><table class="t"><thead><tr><th>Bắt đầu</th><th>Trạng thái</th><th class="num">Điểm</th><th class="num">Đúng</th><th class="num">Thời gian</th><th></th></tr></thead><tbody>
    ${e.attempts.map((a) => `<tr><td>${fmtDate(a.started_at)}</td><td>${stChip(a.status)}</td><td class="num">${a.score ?? '—'}</td><td class="num">${a.correct ?? '—'}/${a.total}</td><td class="num">${fmtDur(a.duration_sec)}</td><td>${a.score != null ? `<a href="#/attempt/${a.id}">Xem</a>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`));
}

export async function attemptPage(root, ctx, id) {
  const a = await api.get(`/attempts/${id}`);
  if (a.status === 'in_progress') return player(root, ctx, a);
  return result(root, a);
}

function player(root, ctx, a) {
  const skew = Date.now() - new Date(a.server_now).getTime();
  const deadline = new Date(a.deadline_at).getTime() + skew;
  let idx = store.get('att:' + a.id, 0);
  const answers = a.answers, flags = new Set(a.flags);
  const qs = a.questions;
  const head = h(`<div class="card row between" style="position:sticky;top:8px;z-index:5"><div class="stack tight"><span class="eyebrow">Chế độ thi thử</span><b>${esc(a.title)}</b></div>
    <div class="row"><span class="timer" aria-live="off">${ICON.clock}<span data-t>--:--</span></span><button class="btn primary" data-submit>Nộp bài</button></div></div>`);
  const grid = h('<div class="examgrid"></div>');
  const main = h('<div class="card stack qcard" style="margin:0"></div>');
  const side = h(`<div class="card stack examside"><div class="row between"><b>Danh sách câu</b><span class="small muted num" data-cnt></span></div><div class="qnav"></div>
    <div class="legend"><span><i></i>Chưa trả lời</span><span><i class="ans"></i>Đã trả lời</span><span><i class="flag"></i>Đánh dấu xem lại</span></div></div>`);
  grid.append(main, side); root.append(head, grid);
  const nav = $('.qnav', side);
  const drawNav = () => {
    nav.innerHTML = qs.map((q, i) => `<button type="button" class="${answers[q.id] ? 'ans' : ''} ${flags.has(q.id) ? 'flag' : ''} ${i === idx ? 'cur' : ''}" data-i="${i}" aria-label="Câu ${i + 1}${answers[q.id] ? ', đã trả lời' : ', chưa trả lời'}${flags.has(q.id) ? ', đã đánh dấu' : ''}">${i + 1}</button>`).join('');
    $('[data-cnt]', side).textContent = `${Object.keys(answers).length}/${qs.length} đã trả lời`;
  };
  nav.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) { idx = Number(b.dataset.i); show(); } };
  const save = async (q, resp) => {
    if (resp) answers[q.id] = resp; else delete answers[q.id];
    drawNav();
    try { await api.put(`/attempts/${a.id}/answer`, { question_id: q.id, response: resp }); }
    catch (e) { toast(e.message, 'bad'); if (e.data && /hết giờ|kết thúc/.test(e.message)) location.reload(); }
  };
  const show = () => {
    store.set('att:' + a.id, idx);
    const q = qs[idx];
    main.innerHTML = '';
    main.append(h(`<div class="row between"><b>Câu ${idx + 1}/${qs.length}</b><button type="button" class="btn sm ${flags.has(q.id) ? 'primary' : ''}" data-flag>${ICON.flag} ${flags.has(q.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</button></div>`));
    const R = renderQuestion(q, { mode: 'exam', value: answers[q.id], onChange: (resp) => save(q, resp), autoplay: false });
    main.append(R.el);
    main.append(h(`<div class="row between"><button class="btn" data-prev ${idx === 0 ? 'disabled' : ''}>← Câu trước</button>${q.type !== 'mcq' && q.type !== 'listen' && q.type !== 'error' ? '<span class="small faint">Câu trả lời được lưu tự động</span>' : ''}<button class="btn" data-next ${idx === qs.length - 1 ? 'disabled' : ''}>Câu sau →</button></div>`));
    $('[data-prev]', main).onclick = () => { idx--; show(); };
    $('[data-next]', main).onclick = () => { idx++; show(); };
    $('[data-flag]', main).onclick = async () => {
      const on = !flags.has(q.id); on ? flags.add(q.id) : flags.delete(q.id);
      try { await api.put(`/attempts/${a.id}/flag`, { question_id: q.id, flagged: on }); } catch (e) { toast(e.message, 'bad'); }
      show();
    };
    drawNav();
  };
  let submitted = false;
  const doSubmit = async (auto) => {
    if (submitted) return;
    if (!auto) {
      const un = qs.length - Object.keys(answers).length;
      const ok = await confirmBox('Nộp bài?', `${un ? `<div class="callout warn">Bạn còn <b>${un}</b> câu chưa trả lời. Câu chưa trả lời được tính là sai.</div>` : '<p>Bạn đã trả lời tất cả các câu.</p>'}${flags.size ? `<p class="small">Có ${flags.size} câu đang được đánh dấu xem lại.</p>` : ''}<p class="small muted">Sau khi nộp, bạn không thể sửa câu trả lời.</p>`, 'Nộp bài');
      if (!ok) return;
    }
    submitted = true; clearInterval(tick);
    try { await api.post(`/attempts/${a.id}/submit`); } catch { /* server có thể đã tự nộp */ }
    ctx.setDirtyCheck(null);
    if (auto) toast('Đã hết giờ. Bài thi đã được tự động nộp.');
    location.hash = `#/attempt/${a.id}?done=1`;
  };
  $('[data-submit]', head).onclick = () => doSubmit(false);
  const tEl = $('[data-t]', head);
  const update = () => {
    const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
    tEl.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    tEl.parentElement.classList.toggle('low', left <= 60);
    if (left <= 0) doSubmit(true);
  };
  update();
  const tick = setInterval(update, 500);
  ctx.onLeave(() => clearInterval(tick));
  ctx.setDirtyCheck(() => (submitted ? null : 'Bạn đang làm bài thi. Đồng hồ vẫn tiếp tục chạy nếu bạn rời trang. Rời đi?'));
  show();
}

function result(root, a) {
  if (a.status === 'abandoned') { root.append(h(`<div class="card empty"><span class="glyph">취</span><p>Lượt thi này đã bị huỷ và không được tính điểm.</p><a class="btn" href="#/exam/${a.exam_id}">Về đề thi</a></div>`)); return; }
  const passed = a.passed;
  const wrong = a.questions.filter((q) => !q.correct);
  root.append(h(`<div class="small"><a href="#/exams">Thi thử</a> / Kết quả</div>`));
  root.append(h(`<div class="card stack" style="text-align:center;align-items:center"><span class="eyebrow">${esc(a.title)}</span>
    <div class="score-big">${a.score}</div><div class="muted">trên thang 100${a.status === 'auto_submitted' ? ' · tự động nộp khi hết giờ' : ''}</div>
    ${passed == null ? '' : `<span class="chip ${passed ? 'st-mastered' : 'st-needs_review'}" style="font-size:14px;padding:4px 14px">${passed ? 'Đạt yêu cầu' : 'Chưa đạt'} (điểm đạt ${a.pass_score})</span>`}
    <div class="grid g4" style="width:100%;max-width:720px;text-align:left">
      <div class="kpi"><span class="l">Câu đúng</span><span class="v num">${a.correct}</span></div><div class="kpi"><span class="l">Câu sai / bỏ trống</span><span class="v num">${a.total - a.correct}</span></div>
      <div class="kpi"><span class="l">Tỷ lệ chính xác</span><span class="v num">${pct(a.correct / a.total)}</span></div><div class="kpi"><span class="l">Thời gian làm bài</span><span class="v" style="font-size:18px">${fmtDur(a.duration_sec)}</span></div></div>
    ${a.previous ? `<span class="small muted">Lần trước: ${a.previous.score} điểm (${a.score - a.previous.score >= 0 ? '+' : ''}${Math.round((a.score - a.previous.score) * 10) / 10})</span>` : ''}</div>`));
  const skills = Object.entries(a.by_skill || {});
  root.append(h(`<div class="grid g2"><div class="card stack"><h2>Kết quả theo kỹ năng</h2>${skills.map(([k, v]) => `<div class="hbar"><span>${SKILL_LABEL[k] || k}</span><div class="bar ${v.correct / v.total < 0.6 ? 'bad' : ''}"><i style="width:${(v.correct / v.total) * 100}%"></i></div><span class="num small">${v.correct}/${v.total}</span></div>`).join('')}</div>
    <div class="card stack"><h2>Chủ đề cần ôn lại</h2>${a.weak_topics && a.weak_topics.length ? a.weak_topics.map((t) => `<div class="row between"><a href="#/topic/${t.topic_id}">${esc(t.name)}</a><span class="small num">${t.correct}/${t.total} đúng</span></div>`).join('') : '<p class="small muted">Không có chủ đề nào dưới 70% đúng.</p>'}</div></div>`));
  const acts = h('<div class="row"><a class="btn" href="#/exams">Làm đề mới</a><a class="btn" href="#/progress">Về Dashboard</a></div>');
  if (wrong.length) { const b = h(`<button class="btn primary">Ôn tập ${wrong.length} câu sai</button>`); b.onclick = () => startSession({ kind: 'retry', question_ids: wrong.map((q) => q.qid) }); acts.prepend(b); }
  root.append(acts);
  if (a.show_answers) {
    const box = h(`<div class="card stack"><div class="row between"><h2>Chi tiết bài làm</h2><div class="seg"><button class="on" data-f="wrong">Câu sai (${wrong.length})</button><button data-f="all">Tất cả (${a.questions.length})</button></div></div><div class="stack" data-list></div></div>`);
    const draw = (f) => {
      $$('.seg button', box).forEach((b) => b.classList.toggle('on', b.dataset.f === f));
      const list = $('[data-list]', box); list.innerHTML = '';
      (f === 'wrong' ? wrong : a.questions).forEach((q, i) => {
        const it = h(`<div class="stack tight" style="border-top:1px solid var(--line);padding-top:12px"><div class="row between small"><span class="muted">${esc(q.topic)} · ${SKILL_LABEL[q.skill] || ''}</span>${q.correct ? '<span class="chip st-mastered">Đúng</span>' : q.answered ? '<span class="chip st-needs_review">Sai</span>' : '<span class="chip st-not_started">Bỏ trống</span>'}</div></div>`);
        it.append(reviewBlock(q)); list.append(it); void i;
      });
      if (!list.children.length) list.append(h('<p class="muted">Không có câu nào.</p>'));
    };
    box.onclick = (e) => { const b = e.target.closest('[data-f]'); if (b) draw(b.dataset.f); };
    draw(wrong.length ? 'wrong' : 'all');
    root.append(box);
  } else root.append(h('<div class="callout small">Đề này không hiển thị đáp án sau khi nộp. Bạn vẫn có thể ôn lại các câu sai bằng nút ở trên.</div>'));
  void safeHtml;
}
