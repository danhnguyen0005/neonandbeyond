// Review Center: ôn tổng hợp, ôn theo mục tiêu, từ vựng (SRS), ngữ pháp, câu sai.
import { api, esc, h, $, $$, pct, ago, safeHtml, plain, toast, modal, store, speakBtn, fmtDate } from '../core.js';
import { start } from './learn.js';

const TABS = [['all', 'Ôn tập tổng hợp'], ['vocab', 'Từ vựng'], ['grammar', 'Ngữ pháp'], ['mistakes', 'Câu sai']];
const BUCKET = {
  new: ['Từ mới chưa học', 'Từ thuộc các chủ đề bạn đã mở nhưng chưa ôn lần nào.'],
  due: ['Từ đến hạn ôn', 'Đến lịch ôn theo phương pháp lặp lại ngắt quãng.'],
  weak: ['Từ chưa ghi nhớ', 'Mức ghi nhớ thấp hoặc vừa trả lời sai.'],
  often_wrong: ['Từ thường trả lời sai', 'Đã sai từ 2 lần trở lên.'],
  check: ['Đã thành thạo, cần kiểm tra định kỳ', 'Từ đã nhớ tốt nhưng đến hạn kiểm tra lại.'],
};

export async function reviewPage(root, ctx, params) {
  let tab = params.get('tab') || store.get('rv:tab', 'all');
  const filters = { topic_id: params.get('topic') || '', days: '', state: 'due' };
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Trung tâm ôn tập</span><h1>Ôn lại đúng chỗ còn yếu</h1>
    <p class="muted">Kết nối với mọi hoạt động học: câu bạn làm sai, từ đến hạn ôn và chủ đề có tỷ lệ đúng thấp đều được gom về đây.</p></div></div>`));
  const tabs = h(`<div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-t="${k}">${l}</button>`).join('')}</div>`);
  const body = h('<div class="stack view-enter"></div>');
  root.append(tabs, body);
  let data = await api.get('/review?' + new URLSearchParams(filters));
  tabs.onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; store.set('rv:tab', tab); draw(); } };

  const draw = () => {
    $$('button', tabs).forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    body.innerHTML = ''; body.classList.remove('view-enter'); void body.offsetWidth; body.classList.add('view-enter');
    ({ all: drawAll, vocab: drawVocab, grammar: drawGrammar, mistakes: drawMistakes })[tab]();
  };

  function drawAll() {
    const mc = data.mistake_counts || {};
    if (!data.learned_count) body.append(h(`<div class="callout warn">Bạn chưa học chủ đề nào nên phiên ôn tổng hợp mặc định chưa có nội dung. Hãy mở một chủ đề trong <a href="#/practice">Trung tâm luyện tập</a>, hoặc bật chế độ thử thách bên dưới.</div>`));
    const main = h(`<div class="card stack"><span class="eyebrow">D · Luyện tập toàn diện</span><h2>Ôn tập tổng hợp</h2>
      <p class="small muted">Lấy câu hỏi từ các chủ đề bạn đã học, ưu tiên: kiến thức đang yếu, câu sai đến hạn, từ đến hạn ôn, kiến thức cũ cần củng cố, và một phần câu mới để kiểm tra khả năng vận dụng.</p>
      <div class="row"><select class="input" style="width:auto" data-n aria-label="Số câu"><option value="10">10 câu</option><option value="15" selected>15 câu</option><option value="20">20 câu</option><option value="30">30 câu</option></select>
      <label class="check"><input type="checkbox" data-ch> Chế độ thử thách (gồm cả kiến thức chưa học)</label>
      <button class="btn primary" data-go>Bắt đầu ôn tập tổng hợp</button></div></div>`);
    $('[data-go]', main).onclick = () => start({ kind: $('[data-ch]', main).checked ? 'challenge' : 'mixed', count: Number($('[data-n]', main).value) });
    body.append(main);
    const goals = h(`<div class="card stack"><span class="eyebrow">E · Ôn tập theo mục tiêu</span><h2>Bạn có bao nhiêu thời gian?</h2>
      <p class="small muted">Thời lượng là ước tính (khoảng 30–40 giây mỗi câu). Kết quả sẽ hiển thị thời gian thực tế bạn đã dùng.</p>
      <div class="grid g3">${[5, 10, 15].map((m) => `<button class="card flat stack" style="cursor:pointer;text-align:left" data-min="${m}"><b style="font-size:22px">${m} phút</b><span class="small muted">khoảng ${{ 5: 8, 10: 15, 15: 22 }[m]} câu tổng hợp</span></button>`).join('')}</div>
      <div class="grid g3">
        <div class="stack tight"><span class="lbl">Ôn một chủ đề</span><div class="row"><select class="input" data-topic style="flex:1;min-width:0;width:100%">${data.topics.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select><button class="btn" data-gt>Ôn</button></div></div>
        <div class="stack tight"><span class="lbl">Ôn lỗi thường gặp</span><button class="btn" data-ge>Ôn nhóm lỗi tôi hay mắc</button></div>
        <div class="stack tight"><span class="lbl">Ôn trước kỳ thi</span><div class="row"><select class="input" data-lv style="flex:1;min-width:0;width:100%">${data.levels.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select><button class="btn" data-gx>Ôn</button></div></div>
      </div><p class="small faint">Câu sai đang theo dõi: ${mc.tracking || 0} · đến hạn: ${mc.due || 0} · đã khắc phục: ${mc.resolved || 0}</p></div>`);
    goals.addEventListener('click', (e) => { const b = e.target.closest('[data-min]'); if (b) start({ kind: 'mixed', minutes: Number(b.dataset.min) }); });
    $('[data-gt]', goals).onclick = () => start({ kind: 'topic', topic_id: Number($('[data-topic]', goals).value), count: 10, fresh: true });
    $('[data-ge]', goals).onclick = () => start({ kind: 'errors', count: 12 });
    $('[data-gx]', goals).onclick = () => start({ kind: 'exam_prep', level_id: Number($('[data-lv]', goals).value), count: 20 });
    body.append(goals);
  }

  function drawVocab() {
    const g = h('<div class="grid g3"></div>');
    data.vocab.forEach((b) => {
      const [label, desc] = BUCKET[b.bucket];
      const c = h(`<div class="card stack"><div class="row between"><b>${label}</b><span class="badge" style="background:${b.count ? 'var(--seal)' : 'var(--ink-3)'}">${b.count}</span></div><span class="small muted">${desc}</span>
        <div class="ko small">${b.sample.map((v) => esc(v.ko)).join(' · ') || '<span class="faint">Chưa có từ nào</span>'}</div>
        <div class="row"><a class="btn sm ${b.count ? 'primary' : ''}" href="#/flash?bucket=${b.bucket}" ${b.count ? '' : 'aria-disabled="true"'}>Thẻ ghi nhớ</a><button class="btn sm" data-quiz="${b.bucket}" ${b.count ? '' : 'disabled'}>Làm trắc nghiệm</button></div></div>`);
      g.append(c);
    });
    g.addEventListener('click', (e) => { const b = e.target.closest('[data-quiz]'); if (b) start({ kind: 'vocab', bucket: b.dataset.quiz, count: 12 }); });
    body.append(g);
  }

  function drawGrammar() {
    const gr = data.grammar;
    body.append(h(`<div class="card stack"><h2>Cấu trúc chưa nắm vững</h2>${gr.weak.length ? gr.weak.map((t) => `<div class="row between" style="border-top:1px solid var(--line);padding-top:8px"><div><b>${esc(t.name)}</b><div class="small muted">${esc(t.label)} · đúng ${pct(t.accuracy)} / ${t.answered} câu</div></div><div class="row"><a class="btn sm" href="#/topic/${t.id}">Ôn lý thuyết</a><button class="btn sm primary" data-topic="${t.id}">Luyện</button></div></div>`).join('')
      : '<p class="small muted">Chưa có cấu trúc nào bị đánh giá là yếu. Cấu trúc sẽ xuất hiện ở đây khi bạn làm đủ ít nhất 3 câu và tỷ lệ đúng còn thấp.</p>'}</div>`));
    body.append(h(`<div class="card stack"><h2>Các cặp ngữ pháp dễ nhầm</h2><div class="grid g2">${gr.pairs.map((p) => `<div class="card flat stack tight"><div class="row between"><b class="ko">${esc(p.a)} ↔ ${esc(p.b)}</b><span class="small num">${p.answered ? pct(p.accuracy) + ' đúng' : 'chưa luyện'}</span></div><span class="small muted">${esc(p.note)}</span><div class="row"><a class="btn sm" href="#/topic/${p.topic_id}">Xem so sánh</a><button class="btn sm" data-topic="${p.topic_id}">Luyện</button></div></div>`).join('')}</div></div>`));
    const tags = [['particle', 'Nhóm tiểu từ thường dùng sai'], ['conjugation', 'Lỗi chia động từ'], ['word_order', 'Lỗi trật tự câu'], ['grammar', 'Cấu trúc cần thực hành thêm']];
    body.append(h(`<div class="card stack"><h2>Nhóm lỗi trong 30 ngày</h2><div class="grid g2">${tags.map(([k, l]) => { const s = gr.tags.find((x) => x.error_tag === k) || { n: 0, wrong: 0 }; return `<div class="card flat stack tight"><div class="row between"><b>${l}</b><span class="small num">${s.wrong}/${s.n} câu sai</span></div><button class="btn sm" data-tag="${k}" ${s.n || data.learned_count ? '' : 'disabled'}>Luyện nhóm này</button></div>`; }).join('')}</div></div>`));
    body.addEventListener('click', onGrammarClick);
  }
  function onGrammarClick(e) {
    if (tab !== 'grammar') return;
    const t = e.target.closest('[data-topic]'); if (t) return start({ kind: 'topic', topic_id: Number(t.dataset.topic), count: 10, fresh: true });
    const g = e.target.closest('[data-tag]'); if (g) start({ kind: 'grammar', error_tags: [g.dataset.tag], count: 10 });
  }

  function drawMistakes() {
    const bar = h(`<div class="card flat row">
      <select class="input" data-f="state" style="width:auto" aria-label="Trạng thái"><option value="due">Cần làm lại</option><option value="tracking">Đang theo dõi</option><option value="resolved">Đã khắc phục</option></select>
      <select class="input" data-f="topic_id" style="width:auto" aria-label="Chủ đề"><option value="">Mọi chủ đề</option>${data.topics.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select>
      <select class="input" data-f="days" style="width:auto" aria-label="Thời gian"><option value="">Mọi thời gian</option><option value="1">24 giờ qua</option><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option></select>
      <span style="flex:1"></span><button class="btn sm" data-sel disabled>Làm lại câu đã chọn</button><button class="btn sm primary" data-all ${data.mistakes.length ? '' : 'disabled'}>Làm lại tất cả (${data.mistakes.length})</button></div>`);
    $$('[data-f]', bar).forEach((s) => { s.value = filters[s.dataset.f]; s.onchange = async () => { filters[s.dataset.f] = s.value; data = await api.get('/review?' + new URLSearchParams(filters)); draw(); }; });
    body.append(bar);
    body.append(h('<p class="small muted">Câu trả lời đúng một lần chưa được xoá khỏi danh sách: hệ thống hẹn kiểm tra lại sau 1 ngày và 3 ngày. Đúng ở các lần kiểm tra lại thì câu được ghi nhận “Đã khắc phục”, lịch sử vẫn được giữ.</p>'));
    if (!data.mistakes.length) { body.append(h(`<div class="card empty"><span class="glyph">좋</span><p>${filters.state === 'due' ? 'Không có câu sai nào cần làm lại lúc này.' : 'Không có câu nào trong bộ lọc này.'}</p></div>`)); return; }
    const list = h('<div class="card" style="padding:0"></div>');
    data.mistakes.forEach((m) => list.append(h(`<div class="row" style="padding:12px 16px;border-bottom:1px solid var(--line);align-items:flex-start;flex-wrap:nowrap">
      <input type="checkbox" value="${m.qid}" aria-label="Chọn câu" style="margin-top:6px;accent-color:var(--jade)">
      <div class="stack tight" style="flex:1;min-width:0"><div>${safeHtml(m.prompt)}</div><div class="small muted">${esc(m.topic)} · ${esc(m.tag_label || '')} · sai ${m.wrong_count} lần · ${ago(m.last_wrong_at)}</div>
        <div class="row"><span class="chip ${m.state === 'resolved' ? 'st-mastered' : m.state === 'open' ? 'st-needs_review' : 'st-in_progress'}">${esc(m.state_label)}</span>${m.state !== 'open' && m.state !== 'resolved' ? `<span class="small faint">Kiểm tra lại: ${fmtDate(m.next_check_at)}</span>` : ''}</div></div>
      <div class="row" style="flex:none"><button class="btn sm" data-view="${m.qid}">Xem giải thích</button><button class="btn sm" data-redo="${m.qid}">Làm lại</button></div></div>`)));
    body.append(list);
    const selBtn = $('[data-sel]', bar);
    list.addEventListener('change', () => { const n = $$('input:checked', list).length; selBtn.disabled = !n; selBtn.textContent = n ? `Làm lại ${n} câu đã chọn` : 'Làm lại câu đã chọn'; });
    selBtn.onclick = () => start({ kind: 'retry', question_ids: $$('input:checked', list).map((i) => Number(i.value)) });
    $('[data-all]', bar).onclick = () => start({ kind: 'retry', question_ids: data.mistakes.map((m) => m.qid) });
    list.addEventListener('click', async (e) => {
      const r = e.target.closest('[data-redo]'); if (r) return start({ kind: 'retry', question_ids: [Number(r.dataset.redo)] });
      const v = e.target.closest('[data-view]'); if (!v) return;
      const d = await api.get(`/mistakes/${v.dataset.view}`);
      const q = d.question;
      const b = h(`<div class="stack">
        ${q.passage && q.passage.ko_text ? `<div class="passage">${esc(q.passage.ko_text)}</div>` : ''}
        <div class="prompt">${safeHtml(q.prompt)} ${q.say ? speakBtn(q.say) : ''}</div>
        ${q.options ? `<div class="small muted">Phương án: ${q.options.map((o) => esc(o.text)).join(' · ')}</div>` : ''}
        <div class="callout bad"><span class="small">Lần sai gần nhất bạn trả lời:</span> <b class="ko">${esc(d.your_answer || '(bỏ trống)')}</b></div>
        <div class="callout ok"><span class="small">Đáp án đúng:</span> <b class="ko">${esc(d.correct_answer)}</b></div>
        ${d.choice_feedback ? `<div class="callout"><b>Vì sao chưa đúng:</b> ${esc(d.choice_feedback)}</div>` : ''}
        ${d.explanation ? `<p><b>Giải thích:</b> ${esc(d.explanation)}</p>` : ''}
        <div class="small muted">Lịch sử: ${d.history.map((x) => (x.is_correct ? '✓' : '✗')).join(' ')} (mới nhất trước)</div></div>`);
      const act = await modal({ title: 'Giải thích câu sai', body: b, actions: [{ label: 'Đã hiểu', value: 'ok' }, { label: 'Luyện câu tương tự', value: 'sim' }, { label: 'Làm lại câu này', value: 'redo', kind: 'primary' }] });
      if (act === 'ok') { await api.post(`/mistakes/${q.id}/understood`); toast('Đã đánh dấu. Câu này sẽ được kiểm tra lại sau 1 ngày.'); data = await api.get('/review?' + new URLSearchParams(filters)); draw(); }
      if (act === 'sim') start({ kind: 'similar', question_id: q.id });
      if (act === 'redo') start({ kind: 'retry', question_ids: [q.id] });
    });
  }
  draw();
  void plain;
}
