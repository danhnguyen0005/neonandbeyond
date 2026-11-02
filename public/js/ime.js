// Bàn phím tiếng Hàn trên màn hình (kiểu 2-beolsik) + bộ ghép âm tiết.
// Hoạt động cả khi người học gõ xen bằng bàn phím thật: mỗi lần bấm, toàn bộ ô nhập được tách thành jamo rồi ghép lại.
const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
const V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
const T = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const CV = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
const CT = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
const SV = Object.fromEntries(Object.entries(CV).map(([k, v]) => [v, k]));
const ST = Object.fromEntries(Object.entries(CT).map(([k, v]) => [v, k]));
const isC = (j) => L.includes(j) || T.includes(j) && j !== '';
const isV = (j) => V.includes(j);

export function decompose(str) {
  const out = [];
  for (const ch of str) {
    const c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) {
      const i = c - 0xac00, l = Math.floor(i / 588), v = Math.floor((i % 588) / 28), t = i % 28;
      out.push(L[l]);
      SV[V[v]] ? out.push(...SV[V[v]]) : out.push(V[v]);
      if (t) ST[T[t]] ? out.push(...ST[T[t]]) : out.push(T[t]);
    } else if (SV[ch]) out.push(...SV[ch]);
    else out.push(ch);
  }
  return out;
}
export function compose(seq) {
  let out = '', cur = null;
  const flush = () => {
    if (!cur) return;
    if (cur.l && cur.v) out += String.fromCharCode(0xac00 + (L.indexOf(cur.l) * 21 + V.indexOf(cur.v)) * 28 + (cur.t ? T.indexOf(cur.t) : 0));
    else out += (cur.l || '') + (cur.v || '');
    cur = null;
  };
  for (const j of seq) {
    if (isV(j)) {
      if (cur && cur.l && !cur.v) cur.v = j;
      else if (cur && cur.v && !cur.t && CV[cur.v + j]) cur.v = CV[cur.v + j];
      else if (cur && cur.t) {
        let carry;
        if (ST[cur.t]) { const [a, b] = ST[cur.t]; cur.t = a; carry = b; } else { carry = cur.t; cur.t = null; }
        flush(); cur = { l: carry, v: j };
      } else { flush(); cur = { v: j }; }
    } else if (isC(j)) {
      if (cur && cur.l && cur.v && !cur.t && T.includes(j)) cur.t = j;
      else if (cur && cur.t && CT[cur.t + j]) cur.t = CT[cur.t + j];
      else { flush(); cur = L.includes(j) ? { l: j } : null; if (!cur) out += j; }
    } else { flush(); out += j; }
  }
  flush();
  return out;
}

const ROWS = [['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'], ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'], ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']];
const SHIFT = { 'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ', 'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ' };

// Gắn bàn phím ảo vào một ô nhập. Trả về phần tử bàn phím.
export function attachIme(input) {
  let shift = false;
  const kb = document.createElement('div');
  kb.className = 'ime'; kb.setAttribute('aria-label', 'Bàn phím tiếng Hàn');
  const draw = () => {
    kb.innerHTML = '';
    ROWS.forEach((r, i) => {
      const row = document.createElement('div'); row.className = 'krow';
      if (i === 2) row.append(btn(shift ? '⇧ Bật' : '⇧', 'shift', 'wide' + (shift ? ' on' : '')));
      r.forEach((k) => row.append(btn(shift && SHIFT[k] ? SHIFT[k] : k, 'key')));
      if (i === 2) row.append(btn('⌫', 'back', 'wide'));
      kb.append(row);
    });
    const last = document.createElement('div'); last.className = 'krow';
    last.append(btn('Dấu cách', 'space', 'wide'), btn('.', 'key', ''), btn('?', 'key', ''));
    kb.append(last);
  };
  const btn = (label, act, cls = '') => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.className = cls; b.dataset.act = act; b.dataset.k = label;
    b.setAttribute('aria-label', act === 'back' ? 'Xoá' : act === 'shift' ? 'Phím Shift' : label);
    return b;
  };
  kb.addEventListener('pointerdown', (e) => e.preventDefault()); // giữ con trỏ trong ô nhập
  kb.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const seq = decompose(input.value);
    if (b.dataset.act === 'key') { seq.push(b.dataset.k); if (shift) { shift = false; draw(); } }
    else if (b.dataset.act === 'back') seq.pop();
    else if (b.dataset.act === 'space') seq.push(' ');
    else if (b.dataset.act === 'shift') { shift = !shift; draw(); return; }
    input.value = compose(seq);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    try { input.setSelectionRange(input.value.length, input.value.length); } catch { /* textarea ok */ }
  });
  draw();
  return kb;
}
