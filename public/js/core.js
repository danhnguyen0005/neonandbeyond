// Tiện ích dùng chung: gọi API, dựng DOM, định dạng, thông báo, hộp thoại, phát âm.
export const api = {
  async req(method, url, body) {
    const res = await fetch('/api' + url, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'hanngu' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* không phải JSON */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Lỗi ${res.status}`);
      err.status = res.status; err.data = data;
      if (res.status === 401 && !url.startsWith('/auth')) window.dispatchEvent(new CustomEvent('auth:lost'));
      throw err;
    }
    return data;
  },
  get(u) { return this.req('GET', u); },
  post(u, b = {}) { return this.req('POST', u, b); },
  put(u, b = {}) { return this.req('PUT', u, b); },
  del(u) { return this.req('DELETE', u); },
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Nội dung câu hỏi do quản trị viên soạn có thể chứa vài thẻ định dạng: chỉ giữ lại b/i/em/strong/u/br/span(class)
export function safeHtml(s) {
  return esc(s).replace(/&lt;(\/?)(b|i|em|strong|u|br|span)((?:\s+class=(?:&quot;|&#39;)[\w\s-]*(?:&quot;|&#39;))?)\s*\/?&gt;/g,
    (_, slash, tag, attr) => `<${slash}${tag}${attr.replace(/&quot;|&#39;/g, '"')}>`);
}
export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const pct = (x, d = 0) => (x == null ? '—' : `${(x * 100).toFixed(d)}%`);
export const fmtDur = (sec) => { if (sec == null) return '—'; sec = Math.round(sec); if (sec < 60) return `${sec} giây`; const m = Math.floor(sec / 60); if (m < 60) return `${m} phút ${sec % 60 ? (sec % 60) + ' giây' : ''}`.trim(); return `${Math.floor(m / 60)} giờ ${m % 60} phút`; };
export const fmtDate = (iso, withTime = true) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + (withTime ? ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''); };
export const ago = (iso) => { if (!iso) return '—'; const s = (Date.now() - new Date(iso)) / 1000; if (s < 60) return 'vừa xong'; if (s < 3600) return `${Math.floor(s / 60)} phút trước`; if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`; return `${Math.floor(s / 86400)} ngày trước`; };
export const plain = (html) => String(html || '').replace(/<[^>]+>/g, '');

export function toast(msg, kind = '') {
  let box = $('.toasts'); if (!box) { box = h('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.append(box); }
  const t = h(`<div class="toast ${kind}">${esc(msg)}</div>`); box.append(t);
  setTimeout(() => t.remove(), 3800);
}
// Hộp thoại xác nhận dựng trong trang (không dùng confirm() của trình duyệt)
export function modal({ title, body = '', actions = [{ label: 'Đóng', value: null }], wide = false }) {
  return new Promise((resolve) => {
    const back = h(`<div class="modal-back" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal ${wide ? 'wide' : ''}">
      <div class="row between"><h2>${esc(title)}</h2><button class="btn ghost sm" data-x aria-label="Đóng">✕</button></div>
      <div class="mbody"></div><div class="row" style="justify-content:flex-end"></div></div></div>`);
    const mb = $('.mbody', back);
    if (typeof body === 'string') mb.innerHTML = body; else mb.append(body);
    const bar = back.querySelector('.modal > .row:last-child');
    actions.forEach((a) => { const b = h(`<button class="btn ${a.kind || ''}">${esc(a.label)}</button>`); b.onclick = () => close(a.value); bar.append(b); });
    const close = (v) => { back.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-x]')) close(null); });
    document.addEventListener('keydown', onKey);
    document.body.append(back);
    (bar.querySelector('.primary') || bar.lastElementChild || back).focus();
  });
}
export const confirmBox = (title, body, okLabel = 'Đồng ý', kind = 'primary') =>
  modal({ title, body, actions: [{ label: 'Huỷ', value: false }, { label: okLabel, value: true, kind }] });

// Phát âm bằng giọng tiếng Hàn của thiết bị
let koVoice = null;
const loadVoice = () => { try { koVoice = speechSynthesis.getVoices().find((v) => /^ko/i.test(v.lang)) || null; } catch { /* ignore */ } };
try { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; } catch { /* ignore */ }
export const hasKoVoice = () => !!koVoice;
export function say(text, rate = 0.85) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\n/g, '. '));
    u.lang = 'ko-KR'; u.rate = rate; if (koVoice) u.voice = koVoice;
    speechSynthesis.speak(u);
  } catch { toast('Thiết bị không hỗ trợ đọc tiếng Hàn.', 'bad'); }
}
export const ICON = {
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>',
  exam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6l1 3h3v15H5V6h3z"/><path d="M9 12l2 2 4-4"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
};
export const GROUP = {
  hangul: { label: 'Hangul · Bảng chữ cái', glyph: '한' }, vocab: { label: 'Từ vựng', glyph: '어' }, grammar: { label: 'Ngữ pháp', glyph: '법' },
  listening: { label: 'Luyện nghe', glyph: '듣' }, reading: { label: 'Luyện đọc', glyph: '읽' }, writing: { label: 'Luyện viết', glyph: '쓰' },
};
export const gicon = (grp) => `<span class="gicon g-${grp}" aria-hidden="true">${GROUP[grp] ? GROUP[grp].glyph : '?'}</span>`;
export const statusChip = (st, label) => `<span class="chip st-${st}">${esc(label)}</span>`;
export const masteryChip = (m, label) => `<span class="chip m-${m}">${esc(label)}</span>`;
export const speakBtn = (text) => `<button type="button" class="speak" data-say="${esc(text)}" aria-label="Nghe">${ICON.speak}</button>`;
document.addEventListener('click', (e) => { const b = e.target.closest('[data-say]'); if (b) { e.preventDefault(); say(b.dataset.say); } });

export const store = {
  get(k, d) { try { const v = localStorage.getItem('hn:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hn:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};
export const TYPE_LABEL = { mcq: 'Trắc nghiệm', listen: 'Nghe', fill: 'Điền từ', conjugate: 'Chia động từ', order: 'Sắp xếp câu', translate: 'Dịch câu', error: 'Tìm lỗi sai', write: 'Viết câu' };
export const DIFF_LABEL = { 1: 'Dễ', 2: 'Vừa', 3: 'Khó' };
export const SKILL_LABEL = { hangul: 'Hangul', vocab: 'Từ vựng', grammar: 'Ngữ pháp', listening: 'Nghe', reading: 'Đọc', writing: 'Viết' };
