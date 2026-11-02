// Hiển thị một câu hỏi (dùng chung cho luyện tập và thi thử) + phản hồi sau khi chấm.
import { esc, safeHtml, h, $, $$, say, speakBtn, ICON, TYPE_LABEL, DIFF_LABEL } from './core.js';
import { attachIme } from './ime.js';

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

// mode: 'practice' (chọn là nộp ngay với trắc nghiệm) | 'exam' (chọn rồi lưu, không hiện đáp án)
export function renderQuestion(q, { mode = 'practice', value = null, onPick = null, onChange = null, autoplay = true } = {}) {
  const el = h(`<div class="stack qbody g-${q.skill === 'hangul' ? 'hangul' : q.skill}"></div>`);
  const head = h(`<div class="qhead"><span class="qtype">${esc(TYPE_LABEL[q.type] || q.type)} · ${esc(q.topic_name || '')}</span><span>${DIFF_LABEL[q.difficulty] ? 'Độ khó: ' + DIFF_LABEL[q.difficulty] : ''}</span></div>`);
  el.append(head);
  if (q.passage) {
    if (q.passage.kind === 'listening') el.append(h(`<div class="callout row"><button type="button" class="btn sm" data-say="${esc(q.passage.say)}">${ICON.speak} Nghe đoạn hội thoại</button><span class="small muted">${esc(q.passage.title)}</span></div>`));
    else el.append(h(`<div class="stack tight"><span class="lbl">${esc(q.passage.title)}</span><div class="passage">${esc(q.passage.ko_text)}</div></div>`));
  }
  el.append(h(`<div class="prompt">${safeHtml(q.prompt)}</div>`));
  if (q.say) {
    el.append(h(`<div class="row"><button type="button" class="btn" data-say="${esc(q.say)}">${ICON.speak} Nghe</button><button type="button" class="btn ghost sm" data-slow>Nghe chậm</button><span class="small faint">Có thể nghe lại nhiều lần</span></div>`));
    $('[data-slow]', el).onclick = () => say(q.say, 0.6);
    if (autoplay) setTimeout(() => say(q.say), 300);
  }
  let getResponse = () => null;
  let lock = () => {};
  const changed = () => onChange && onChange(getResponse());

  if (['mcq', 'listen', 'error'].includes(q.type)) {
    const wrap = h(`<div class="${q.type === 'error' ? 'segs' : 'opts'}" role="group" aria-label="Phương án"></div>`);
    let chosen = value && value.option ? Number(value.option) : null;
    q.options.forEach((o, i) => {
      const b = h(`<button type="button" class="opt" data-id="${o.id}">${q.type === 'error' ? '' : `<span class="key">${KEYS[i]}</span>`}<span>${esc(o.text)}</span></button>`);
      if (o.id === chosen) b.classList.add('sel');
      b.onclick = () => {
        if (b.disabled) return;
        chosen = o.id; $$('.opt', wrap).forEach((x) => x.classList.toggle('sel', x === b));
        changed(); if (onPick) onPick(getResponse());
      };
      wrap.append(b);
    });
    if (q.type === 'error') el.append(h('<p class="small muted">Bấm vào phần của câu có lỗi sai.</p>'));
    el.append(wrap);
    getResponse = () => (chosen ? { option: chosen } : null);
    lock = (res) => {
      $$('.opt', wrap).forEach((b) => {
        b.disabled = true;
        if (res && res.correct_option && Number(b.dataset.id) === res.correct_option) b.classList.add('right');
        else if (res && Number(b.dataset.id) === chosen && !res.correct) b.classList.add('wrong');
        b.classList.remove('sel');
      });
    };
    el._keys = (k) => { const i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k.toLowerCase()); const b = $$('.opt', wrap)[i]; if (b) b.click(); };
  } else if (q.type === 'order') {
    const ans = h('<div class="tiles answer" aria-label="Câu của bạn"></div>');
    const bank = h('<div class="tiles" aria-label="Các từ"></div>');
    const start = value && value.words ? value.words : [];
    const remaining = [...q.words];
    start.forEach((w) => { const i = remaining.indexOf(w); if (i >= 0) remaining.splice(i, 1); });
    const mk = (w) => { const t = h(`<button type="button" class="tile">${esc(w)}</button>`); t.dataset.w = w; t.onclick = () => { if (t.disabled) return; (t.parentNode === bank ? ans : bank).append(t); changed(); }; return t; };
    start.forEach((w) => ans.append(mk(w))); remaining.forEach((w) => bank.append(mk(w)));
    el.append(h('<p class="small muted">Bấm từng từ theo đúng thứ tự. Bấm lại để bỏ ra.</p>'), ans, bank);
    getResponse = () => { const w = $$('.tile', ans).map((t) => t.dataset.w); return w.length === q.words.length ? { words: w } : (mode === 'exam' && w.length ? { words: w } : null); };
    lock = () => $$('.tile', el).forEach((t) => (t.disabled = true));
  } else {
    const isWrite = q.type === 'write';
    const input = isWrite ? h('<textarea class="input answer-input" rows="4" aria-label="Câu trả lời" autocomplete="off" spellcheck="false"></textarea>')
      : h('<input class="input answer-input" aria-label="Câu trả lời" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ câu trả lời bằng chữ Hàn">');
    if (value && value.text) input.value = value.text;
    let t; input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(changed, 400); });
    if (isWrite && q.criteria) el.append(h(`<div class="callout small"><b>Tiêu chí chấm:</b><ul style="margin:6px 0 0 18px;padding:0">${q.criteria.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`));
    el.append(input);
    const kbBtn = h(`<button type="button" class="btn ghost sm" style="align-self:flex-start">${ICON.keyboard} Bàn phím tiếng Hàn</button>`);
    let kb = null;
    kbBtn.onclick = () => { if (kb) { kb.remove(); kb = null; } else { kb = attachIme(input); kbBtn.after(kb); input.focus(); } };
    el.append(kbBtn);
    if (q.hint) el.append(h(`<p class="small faint">Gợi ý: ${esc(q.hint)}</p>`));
    getResponse = () => (input.value.trim() ? { text: input.value } : null);
    lock = () => { input.disabled = true; if (kb) { kb.remove(); kb = null; } kbBtn.remove(); };
    el._input = input;
  }
  return { el, getResponse: () => getResponse(), lock: (r) => lock(r), needsCheck: !['mcq', 'listen', 'error'].includes(q.type) };
}

export function renderFeedback(r) {
  const ok = r.correct;
  const fb = h(`<div class="feedback ${ok ? 'ok' : 'no'}" role="status"></div>`);
  fb.append(h(`<div class="v">${ok ? 'Chính xác!' : r.rubric ? 'Chưa đạt yêu cầu' : 'Chưa đúng'}${r.rubric ? ` · ${Math.round(r.score * 100)}% tiêu chí` : ''}</div>`));
  if (r.rubric) {
    fb.append(h(`<ul class="rubric">${r.rubric.map((c) => `<li><span class="${c.ok ? 'y' : 'n'}">${c.ok ? '✓' : '✗'}</span><span>${esc(c.label)}${!c.ok && c.tip ? `<br><span class="small muted">${esc(c.tip)}</span>` : ''}</span></li>`).join('')}</ul>`));
    if (r.correct_answer) fb.append(h(`<div class="small"><span class="muted">Bài mẫu tham khảo:</span> <span class="ko">${esc(r.correct_answer)}</span> ${speakBtn(r.correct_answer)}</div>`));
  } else {
    if (!ok && r.chosen) fb.append(h(`<div class="small"><span class="muted">Bạn chọn:</span> <span class="ko">${esc(r.chosen)}</span></div>`));
    if (r.correct_answer) fb.append(h(`<div><span class="muted small">Đáp án đúng:</span> <b class="ko">${esc(r.correct_answer)}</b> ${/[가-힣]/.test(r.correct_answer) ? speakBtn(r.correct_answer) : ''}</div>`));
    if (!ok && r.choice_feedback) fb.append(h(`<div class="callout small"><b>Vì sao chưa đúng:</b> <span class="ink">${esc(r.choice_feedback)}</span></div>`));
  }
  if (r.why) fb.append(h(`<div class="small"><b>Giải thích:</b> ${esc(r.why)}</div>`));
  return fb;
}

// Hiển thị câu hỏi + đáp án (dùng trong Review Center và kết quả thi)
export function reviewBlock(item) {
  return h(`<div class="stack tight">
    <div class="prompt" style="font-size:16px">${safeHtml(item.prompt)} ${item.say ? speakBtn(item.say) : ''}</div>
    ${item.your_answer != null ? `<div class="small"><span class="muted">Bạn trả lời:</span> <span class="ko">${esc(item.your_answer || '(bỏ trống)')}</span></div>` : '<div class="small muted">Bạn chưa trả lời câu này.</div>'}
    ${item.correct_answer ? `<div class="small"><span class="muted">Đáp án đúng:</span> <b class="ko">${esc(item.correct_answer)}</b></div>` : ''}
    ${item.choice_feedback ? `<div class="small"><b>Vì sao chưa đúng:</b> ${esc(item.choice_feedback)}</div>` : ''}
    ${item.explanation ? `<div class="small muted">${esc(item.explanation)}</div>` : ''}
  </div>`);
}
