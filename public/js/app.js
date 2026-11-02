// Khung ứng dụng người học: điều hướng không tải lại trang, giữ trạng thái, ghi nhận thời gian học.
import { api, esc, h, $, $$, ICON, toast, confirmBox, store } from './core.js';
import { overview, practiceCenter, topicPage } from './views/learn.js';
import { sessionPage, flashPage } from './views/session.js';
import { reviewPage } from './views/review.js';
import { examsPage, examInfoPage, attemptPage } from './views/exams.js';
import { progressPage } from './views/progress.js';

const NAV = [
  ['overview', '#/', 'Lộ trình', ICON.map], ['practice', '#/practice', 'Luyện tập', ICON.practice], ['review', '#/review', 'Ôn tập', ICON.review],
  ['exams', '#/exams', 'Thi thử', ICON.exam], ['progress', '#/progress', 'Tiến độ', ICON.progress],
];
const ROUTES = [
  [/^\/?$/, 'overview', (r, c) => overview(r, c)],
  [/^\/practice$/, 'practice', (r, c) => practiceCenter(r, c)],
  [/^\/topic\/(\d+)$/, 'practice', (r, c, m) => topicPage(r, c, m[1])],
  [/^\/session\/(\d+)$/, 'practice', (r, c, m) => sessionPage(r, c, m[1])],
  [/^\/flash$/, 'review', (r, c, m, p) => flashPage(r, c, p)],
  [/^\/review$/, 'review', (r, c, m, p) => reviewPage(r, c, p)],
  [/^\/exams$/, 'exams', (r, c) => examsPage(r, c)],
  [/^\/exam\/(\d+)$/, 'exams', (r, c, m) => examInfoPage(r, c, m[1])],
  [/^\/attempt\/(\d+)$/, 'exams', (r, c, m) => attemptPage(r, c, m[1])],
  [/^\/progress$/, 'progress', (r, c) => progressPage(r, c)],
];

let user = null, leaveFns = [], dirty = null, lastHash = location.hash, ignoreNext = false;

// Chủ đề sáng/tối
const THEMES = ['system', 'light', 'dark'];
const applyTheme = (t) => { if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); };
applyTheme(store.get('theme', 'system'));

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path: path.startsWith('/') ? path : '/' + path, params: new URLSearchParams(qs || '') };
}

function shell() {
  document.body.innerHTML = '';
  const initial = esc((user.display_name || '?').trim()[0].toUpperCase());
  const app = h(`<div class="shell">
    <aside class="side" aria-label="Điều hướng chính"><a class="brand" href="#/"><span class="seal">한</span><span>Hàn Ngữ Sơ Cấp</span></a>
      <nav class="nav">${NAV.map(([k, href, l, ic]) => `<a href="${href}" data-k="${k}">${ic}<span>${l}</span></a>`).join('')}</nav>
      <div class="foot"><div class="who"><span class="avatar">${initial}</span><div class="stack tight" style="min-width:0"><b style="overflow:hidden;text-overflow:ellipsis">${esc(user.display_name)}</b><span class="faint">${esc(user.username)}</span></div></div>
        ${user.role === 'admin' ? '<a class="btn sm" href="/admin">Trang quản trị</a>' : ''}
        <div class="row"><button class="btn sm ghost" data-theme>Giao diện</button><button class="btn sm ghost" data-logout>Đăng xuất</button></div></div></aside>
    <div style="min-width:0"><header class="topbar"><a class="brand" href="#/" style="padding:0"><span class="seal">한</span></a><b class="grow">Hàn Ngữ Sơ Cấp</b>
      ${user.role === 'admin' ? '<a class="btn sm" href="/admin">Quản trị</a>' : ''}<button class="btn sm ghost" data-theme aria-label="Đổi giao diện sáng tối">◐</button><button class="btn sm ghost" data-logout>Thoát</button></header>
      <main class="main" id="main"><div class="page" id="view"></div></main></div>
    <nav class="bottomnav" aria-label="Điều hướng">${NAV.map(([k, href, l, ic]) => `<a href="${href}" data-k="${k}">${ic}<span>${l}</span></a>`).join('')}</nav></div>`);
  document.body.append(app);
  $$('[data-logout]').forEach((b) => (b.onclick = async () => { await api.post('/auth/logout'); user = null; location.hash = '#/'; boot(); }));
  $$('[data-theme]').forEach((b) => (b.onclick = () => { const cur = store.get('theme', 'system'); const nx = THEMES[(THEMES.indexOf(cur) + 1) % 3]; store.set('theme', nx); applyTheme(nx); toast('Giao diện: ' + { system: 'theo thiết bị', light: 'sáng', dark: 'tối' }[nx]); }));
}

async function render() {
  leaveFns.forEach((f) => { try { f(); } catch { /* ignore */ } }); leaveFns = []; dirty = null;
  const { path, params } = parseHash();
  const view = $('#view'); if (!view) return;
  const route = ROUTES.find(([re]) => re.test(path)) || ROUTES[0];
  $$('[data-k]').forEach((a) => a.classList.toggle('on', a.dataset.k === route[1]));
  const fresh = h('<div class="page view-enter" id="view"></div>');
  view.replaceWith(fresh);
  const ctx = { user, onLeave: (f) => leaveFns.push(f), setDirtyCheck: (f) => { dirty = f; }, rerender: render };
  try { await route[2](fresh, ctx, path.match(route[0]), params); }
  catch (e) {
    if (e.status === 401) return;
    fresh.append(h(`<div class="card empty"><span class="glyph">?</span><p>${esc(e.message || 'Không tải được nội dung.')}</p><a class="btn" href="#/">Về lộ trình</a></div>`));
  }
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', async () => {
  if (ignoreNext) { ignoreNext = false; return; }
  if (!user) return boot();
  const msg = dirty && dirty();
  if (msg) {
    const ok = await confirmBox('Rời khỏi trang?', esc(msg), 'Rời đi');
    if (!ok) { ignoreNext = true; location.hash = lastHash; return; }
  }
  lastHash = location.hash;
  render();
});
window.addEventListener('beforeunload', (e) => { if (dirty && dirty()) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('auth:lost', () => { if (user) { user = null; toast('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 'bad'); boot(); } });

// Ghi nhận thời gian học: chỉ tính khi tab đang mở và có tương tác trong 60 giây gần nhất
let lastAct = Date.now();
['pointerdown', 'keydown', 'scroll'].forEach((ev) => window.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => { if (user && document.visibilityState === 'visible' && Date.now() - lastAct < 60000) api.post('/activity/ping', { seconds: 30 }).catch(() => {}); }, 30000);

function authScreen() {
  const { path, params } = parseHash();
  let mode = path.includes('register') ? 'register' : 'login';
  document.body.innerHTML = '';
  const wrap = h(`<div class="auth"><div class="art"><a class="brand" href="#/" style="color:#fff;padding:0"><span class="seal" style="background:#fff;color:var(--seal)">한</span><span>Hàn Ngữ Sơ Cấp</span></a>
    <div class="wg" aria-hidden="true"><span>한</span><span>국</span><span>어</span><span>요</span></div>
    <div class="stack tight"><h1 style="color:#fff">Học tiếng Hàn từ bảng chữ cái đến hội thoại sơ cấp</h1><p style="opacity:.9">Lộ trình theo chủ đề, luyện tập có giải thích, ôn tập ngắt quãng và thi thử có đồng hồ.</p></div></div>
    <div class="form"><form class="card stack" novalidate></form></div></div>`);
  document.body.append(wrap);
  const form = $('form', wrap);
  const draw = () => {
    form.innerHTML = `<div class="stack tight"><h2>${mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2><p class="small muted">${mode === 'login' ? 'Tiếp tục lộ trình học của bạn.' : 'Tiến độ học được lưu theo tài khoản, dùng được trên mọi thiết bị.'}</p></div>
      ${mode === 'register' ? '<div class="field"><label for="dn">Tên hiển thị</label><input id="dn" class="input" autocomplete="name" maxlength="60"></div>' : ''}
      <div class="field"><label for="un">Tên đăng nhập</label><input id="un" class="input" autocomplete="username" required></div>
      <div class="field"><label for="pw">Mật khẩu</label><input id="pw" class="input" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required>${mode === 'register' ? '<span class="small faint">Ít nhất 8 ký tự.</span>' : ''}</div>
      <div class="small" data-err style="color:var(--bad)" role="alert"></div>
      <button class="btn primary" type="submit">${mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
      <button class="btn ghost" type="button" data-sw>${mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button>`;
    $('[data-sw]', form).onclick = () => { mode = mode === 'login' ? 'register' : 'login'; draw(); };
    $('#un', form).focus();
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = { username: $('#un', form).value.trim(), password: $('#pw', form).value };
    if (mode === 'register') body.display_name = $('#dn', form).value.trim();
    try {
      const r = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', body);
      if (params.get('next') === 'admin' && r.role === 'admin') { location.href = '/admin'; return; }
      location.hash = '#/'; boot();
    } catch (er) { $('[data-err]', form).textContent = er.message; }
  };
  draw();
}

async function boot() {
  try { user = (await api.get('/me')).user; } catch { user = null; }
  if (!user) return authScreen();
  shell(); lastHash = location.hash; render();
}
boot();
