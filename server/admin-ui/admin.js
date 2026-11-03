// Trang quản trị: báo cáo, người dùng, học liệu, ngân hàng câu hỏi, đề thi, bài viết, cài đặt, nhật ký.
// Quyền được kiểm tra ở server (/api/admin/* chỉ cho admin); giao diện này chỉ là lớp hiển thị.
import { api, esc, h, $, $$, pct, fmtDate, fmtDur, toast, modal, confirmBox, safeHtml, plain, statusChip, masteryChip, TYPE_LABEL, DIFF_LABEL, SKILL_LABEL, store } from '/js/core.js';
import { renderQuestion } from '/js/question.js';

const NAV = [['reports', 'Báo cáo'], ['users', 'Người dùng'], ['content', 'Học liệu'], ['questions', 'Ngân hàng câu hỏi'], ['exams', 'Đề thi'], ['writing', 'Bài viết'], ['settings', 'Cài đặt'], ['logs', 'Nhật ký']];
let META = null;
const topicName = (id) => (META.topics.find((t) => t.id === Number(id)) || {}).name || '—';
const QST = { draft: ['Nháp', 'st-not_started'], review: ['Cần xác minh', 'st-needs_review'], published: ['Đã xuất bản', 'st-mastered'], hidden: ['Đã ẩn', 'st-not_started'] };
const qChip = (s) => `<span class="chip ${QST[s][1]}">${QST[s][0]}</span>`;
const sel = (opts, val, extra = '') => `<select class="input" ${extra}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const topicOpts = (withAll) => [...(withAll ? [['', 'Mọi chủ đề']] : []), ...META.topics.filter((t) => !t.archived).map((t) => [t.id, `${t.name} (${t.code})`])];
const levelOpts = (withAll) => [...(withAll ? [['', 'Mọi cấp độ']] : []), ...META.levels.filter((l) => !l.archived).map((l) => [l.id, l.name])];
const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

async function boot() {
  try { META = await api.get('/admin/meta'); } catch (e) { document.body.innerHTML = `<main class="main"><div class="card empty"><p>${esc(e.message)}</p><a class="btn" href="/">Về trang học</a></div></main>`; return; }
  document.body.append(h(`<div class="shell"><aside class="side"><a class="brand" href="#reports"><span class="seal">한</span><span>Quản trị</span></a>
    <nav class="nav">${NAV.map(([k, l]) => `<a href="#${k}" data-k="${k}"><span>${l}</span></a>`).join('')}</nav>
    <div class="foot"><span class="faint" style="padding:0 8px">Đăng nhập: ${esc(META.me.username)}</span><a class="btn sm" href="/">Về trang học</a><button class="btn sm" data-logout>Đăng xuất</button></div></aside>
    <main class="main"><div class="page" id="view"></div></main></div>`));
  $('[data-logout]').onclick = async () => { await api.post('/auth/logout'); location.href = '/'; };
  window.addEventListener('hashchange', route);
  window.addEventListener('auth:lost', () => { location.href = '/#login?next=admin'; });
  route();
}
async function route() {
  const k = (location.hash.slice(1) || 'reports').split('?')[0];
  $$('[data-k]').forEach((a) => a.classList.toggle('on', a.dataset.k === k));
  const v = h('<div class="page view-enter" id="view"></div>'); $('#view').replaceWith(v);
  try { await ({ reports, users, content, questions, exams, writing, settings, logs }[k] || reports)(v); }
  catch (e) { v.append(h(`<div class="card empty"><p>${esc(e.message)}</p></div>`)); }
}

/* ------------------------------ BÁO CÁO ------------------------------ */
async function reports(root) {
  const f = store.get('adm:rep', {});
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Thống kê & báo cáo</span><h1>Tổng quan hệ thống</h1></div></div>`));
  const exams = await api.get('/admin/exams');
  const bar = h(`<div class="card flat filters">
    <div class="field"><label>Từ ngày</label><input type="date" class="input" data-f="from" value="${f.from || ''}"></div>
    <div class="field"><label>Đến ngày</label><input type="date" class="input" data-f="to" value="${f.to || ''}"></div>
    <div class="field"><label>Cấp độ</label>${sel(levelOpts(true), f.level_id, 'data-f="level_id"')}</div>
    <div class="field"><label>Chủ đề</label>${sel(topicOpts(true), f.topic_id, 'data-f="topic_id"')}</div>
    <div class="field"><label>Bài thi</label>${sel([['', 'Mọi bài thi'], ...exams.map((e) => [e.id, e.title])], f.exam_id, 'data-f="exam_id"')}</div>
    <button class="btn primary" data-apply>Áp dụng</button></div>`);
  root.append(bar);
  const body = h('<div class="stack"></div>'); root.append(body);
  const load = async () => {
    const q = {}; $$('[data-f]', bar).forEach((i) => { if (i.value) q[i.dataset.f] = i.value; });
    store.set('adm:rep', q);
    const r = await api.get('/admin/reports?' + new URLSearchParams(q));
    $('[data-f=from]', bar).value = r.range.from; $('[data-f=to]', bar).value = r.range.to;
    body.innerHTML = '';
    const U = r.users, A = r.activity;
    body.append(h(`<div class="grid g4">
      <div class="card kpi"><span class="l">Tài khoản học viên</span><span class="v">${U.accounts}</span><span class="s">${U.registered_in_range} đăng ký trong kỳ · ${U.locked} bị khoá</span></div>
      <div class="card kpi"><span class="l">Người truy cập (đăng nhập) trong kỳ</span><span class="v">${U.visited}</span><span class="s">Có ít nhất một lần đăng nhập</span></div>
      <div class="card kpi"><span class="l">Người thực sự học trong kỳ</span><span class="v">${U.active_learners}</span><span class="s">Có trả lời ít nhất một câu</span></div>
      <div class="card kpi"><span class="l">Hoạt động ngày / tuần / tháng</span><span class="v">${U.dau} / ${U.wau} / ${U.mau}</span><span class="s">Tính đến ${r.range.to}</span></div>
      <div class="card kpi"><span class="l">Phiên luyện tập</span><span class="v">${A.sessions}</span><span class="s">${A.sessions_completed} phiên làm đến hết</span></div>
      <div class="card kpi"><span class="l">Câu trả lời · tỷ lệ đúng</span><span class="v">${A.answers}</span><span class="s">Đúng ${pct(A.accuracy)}</span></div>
      <div class="card kpi"><span class="l">Lượt thi đã nộp</span><span class="v">${A.attempts}</span><span class="s">Tỷ lệ đạt ${pct(A.pass_rate)}</span></div>
      <div class="card kpi"><span class="l">Tỷ lệ hoàn thành bài học</span><span class="v">${pct(A.lesson_completion_rate)}</span><span class="s">Trong số chủ đề học viên đã bắt đầu</span></div></div>`));
    body.append(h(`<div class="card stack"><div class="row between"><h2>Xuất báo cáo (CSV, mở được bằng Excel)</h2><div class="row">${[['topics', 'Theo chủ đề'], ['exams', 'Theo bài thi'], ['daily', 'Theo ngày'], ['attempts', 'Từng lượt thi'], ['users', 'Học viên']].map(([t, l]) => `<a class="btn sm" href="/api/admin/reports/export?${new URLSearchParams({ ...q, type: t })}">${l}</a>`).join('')}</div></div></div>`));
    const maxD = Math.max(1, ...r.daily.map((d) => d.users));
    body.append(h(`<div class="grid g2"><div class="card stack"><h2>Người học hoạt động theo ngày</h2>${r.daily.length ? `<div class="stack tight">${r.daily.slice(-21).map((d) => `<div class="hbar"><span class="num small">${d.day}</span><div class="bar indigo"><i style="width:${(d.users / maxD) * 100}%"></i></div><span class="num small">${d.users} người · ${d.answers} câu</span></div>`).join('')}</div>` : '<p class="small muted">Chưa có hoạt động trong kỳ.</p>'}</div>
      <div class="card stack"><h2>Phân bố điểm thi</h2>${A.attempts ? `<div class="stack tight">${r.score_distribution.map((n, i) => `<div class="hbar"><span class="num small">${i * 10}–${i === 9 ? 100 : i * 10 + 9}</span><div class="bar"><i style="width:${(n / Math.max(1, ...r.score_distribution)) * 100}%"></i></div><span class="num small">${n}</span></div>`).join('')}</div>` : '<p class="small muted">Chưa có lượt thi.</p>'}</div></div>`));
    body.append(h(`<div class="card stack"><h2>Tiến bộ theo tuần</h2>${r.weekly.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Tuần bắt đầu</th><th class="num">Người học</th><th class="num">Câu trả lời</th><th class="num">Tỷ lệ đúng</th><th class="num">Điểm thi TB</th></tr></thead><tbody>${r.weekly.map((w) => `<tr><td>${w.day}</td><td class="num">${w.users}</td><td class="num">${w.n}</td><td class="num">${pct(w.acc)}</td><td class="num">${w.exam_avg != null ? w.exam_avg.toFixed(1) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Chưa có dữ liệu.</p>'}</div>`));
    const tlist = (l) => (l.length ? l.map((t) => `<div class="row between small"><span>${esc(t.name)}</span><span class="num">${t.answers} câu · sai ${pct(t.wrong_rate)}</span></div>`).join('') : '<p class="small muted">Chưa đủ dữ liệu.</p>');
    body.append(h(`<div class="grid g2"><div class="card stack"><h2>Chủ đề được học nhiều nhất</h2>${tlist(r.most_practiced)}</div><div class="card stack"><h2>Chủ đề có tỷ lệ sai cao nhất</h2><p class="small faint">Chỉ xét chủ đề có ≥ 10 câu trả lời.</p>${tlist(r.hardest)}</div></div>`));
    body.append(h(`<div class="card stack"><h2>Theo chủ đề</h2><div class="table-wrap"><table class="t"><thead><tr><th>Chủ đề</th><th>Cấp độ</th><th class="num">Câu trả lời</th><th class="num">Người học</th><th class="num">Tỷ lệ đúng</th><th class="num">Hoàn thành</th><th class="num">Thành thạo / đã luyện</th></tr></thead>
      <tbody>${r.topics.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.level)}</td><td class="num">${t.answers}</td><td class="num">${t.users}</td><td class="num">${pct(t.acc)}</td><td class="num">${t.completed}</td><td class="num">${t.mastered}/${t.practiced} (${pct(t.mastery_rate)})</td></tr>`).join('')}</tbody></table></div></div>`));
    body.append(h(`<div class="card stack"><h2>Theo bài thi</h2>${r.exams.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Đề</th><th>Loại</th><th class="num">Lượt</th><th class="num">Người thi</th><th class="num">Điểm TB</th><th class="num">Thấp–cao</th><th class="num">Tỷ lệ đạt</th></tr></thead><tbody>
      ${r.exams.map((e) => `<tr><td>${esc(e.title)}</td><td>${e.kind === 'custom' ? 'Tự tạo' : 'Chính thức'}</td><td class="num">${e.attempts}</td><td class="num">${e.users}</td><td class="num">${e.avg.toFixed(1)}</td><td class="num">${e.min}–${e.max}</td><td class="num">${e.pass_score != null ? pct(e.passed / e.attempts) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Chưa có lượt thi trong kỳ.</p>'}</div>`));
  };
  $('[data-apply]', bar).onclick = load;
  await load();
}

/* ------------------------------ NGƯỜI DÙNG ------------------------------ */
async function users(root) {
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Quản lý người dùng</span><h1>Người dùng</h1></div></div>'));
  const bar = h(`<div class="card flat filters"><div class="field" style="flex:1"><label>Tìm theo tên đăng nhập hoặc tên hiển thị</label><input class="input" data-q></div>
    <div class="field"><label>Vai trò</label>${sel([['', 'Tất cả'], ['learner', 'Học viên'], ['admin', 'Quản trị']], '', 'data-role')}</div>
    <div class="field"><label>Trạng thái</label>${sel([['', 'Tất cả'], ['active', 'Hoạt động'], ['locked', 'Bị khoá']], '', 'data-st')}</div><button class="btn primary" data-go>Tìm</button></div>`);
  const list = h('<div></div>'); root.append(bar, list);
  const load = async () => {
    const rows = await api.get('/admin/users?' + new URLSearchParams({ q: $('[data-q]', bar).value, role: $('[data-role]', bar).value, status: $('[data-st]', bar).value }));
    list.innerHTML = '';
    list.append(h(`<div class="table-wrap"><table class="t"><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th class="num">Câu đã làm</th><th class="num">Tỷ lệ đúng</th><th class="num">Chủ đề xong</th><th class="num">Lượt thi</th><th>Đăng nhập cuối</th><th></th></tr></thead><tbody>
      ${rows.map((u) => `<tr><td><b>${esc(u.display_name)}</b><div class="small faint">${esc(u.username)}</div></td><td>${u.role === 'admin' ? 'Quản trị' : 'Học viên'}</td><td>${u.status === 'active' ? '<span class="pill-ok">Hoạt động</span>' : '<span class="pill-no">Bị khoá</span>'}</td>
      <td class="num">${u.answers}</td><td class="num">${pct(u.acc)}</td><td class="num">${u.topics_done}</td><td class="num">${u.exams}</td><td>${fmtDate(u.last_login_at)}</td><td><button class="btn sm" data-u="${u.id}">Chi tiết</button></td></tr>`).join('') || '<tr><td colspan="9" class="muted">Không có người dùng.</td></tr>'}</tbody></table></div>`));
  };
  $('[data-go]', bar).onclick = load; $('[data-q]', bar).onkeydown = (e) => { if (e.key === 'Enter') load(); };
  list.onclick = async (e) => {
    const b = e.target.closest('[data-u]'); if (!b) return;
    const d = await api.get('/admin/users/' + b.dataset.u);
    const u = d.user, s = d.summary;
    const box = h(`<div class="stack">
      <div class="grid g3"><div class="kpi"><span class="l">Tài khoản</span><b>${esc(u.username)}</b><span class="s">Tạo ${fmtDate(u.created_at)} · ${u.role === 'admin' ? 'Quản trị' : 'Học viên'}</span></div>
      <div class="kpi"><span class="l">Tiến độ</span><b>${s.topics_completed}/${s.topics_total} chủ đề</b><span class="s">${s.topics_mastered} thành thạo · ${s.vocab_learned} từ đã học</span></div>
      <div class="kpi"><span class="l">Kết quả</span><b>${pct(s.accuracy)} đúng</b><span class="s">${s.answers} câu · ${s.exam_count} lượt thi · thời gian ${fmtDur(s.time_sec)}</span></div></div>
      <div class="stack tight"><span class="lbl">Chủ đề còn yếu</span>${d.weak.length ? d.weak.map((t) => `<div class="row between small"><span>${esc(t.name)}</span><span>${pct(t.accuracy)}</span></div>`).join('') : '<span class="small muted">Không có.</span>'}</div>
      <div class="stack tight"><span class="lbl">Trạng thái các chủ đề</span><div class="row">${d.map.filter((t) => t.status !== 'not_started').map((t) => `<span class="small">${esc(t.name)} ${statusChip(t.status, t.status_label)}</span>`).join(' ') || '<span class="small muted">Chưa học chủ đề nào.</span>'}</div></div>
      <div class="stack tight"><span class="lbl">Lịch sử thi</span>${d.attempts.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Đề</th><th>Ngày</th><th class="num">Điểm</th><th>Trạng thái</th></tr></thead><tbody>${d.attempts.map((a) => `<tr><td>${esc(a.title)}</td><td>${fmtDate(a.started_at)}</td><td class="num">${a.score ?? '—'}</td><td>${a.status}</td></tr>`).join('')}</tbody></table></div>` : '<span class="small muted">Chưa thi.</span>'}</div>
      <div class="stack tight"><span class="lbl">Lỗi theo nhóm</span><span class="small">${d.errors.map((x) => `${esc(x.label)}: ${x.n}`).join(' · ') || '—'}</span></div></div>`);
    const isSelf = u.id === META.me.id;
    const act = await modal({ title: u.display_name, body: box, wide: true, actions: isSelf ? [{ label: 'Đóng', value: null }] : [
      { label: u.role === 'admin' ? 'Chuyển thành học viên' : 'Cấp quyền quản trị', value: 'role' },
      { label: u.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá', value: 'lock', kind: u.status === 'active' ? 'danger' : 'primary' }] });
    if (act === 'lock' && await confirmBox(u.status === 'active' ? 'Khoá tài khoản?' : 'Mở khoá tài khoản?', u.status === 'active' ? 'Người dùng sẽ bị đăng xuất và không thể đăng nhập cho đến khi được mở khoá. Dữ liệu học tập vẫn được giữ.' : 'Người dùng có thể đăng nhập lại.', 'Xác nhận', 'danger')) {
      await api.put(`/admin/users/${u.id}/status`, { status: u.status === 'active' ? 'locked' : 'active' }); toast('Đã cập nhật.'); load();
    }
    if (act === 'role' && await confirmBox('Đổi vai trò?', u.role === 'admin' ? 'Tài khoản sẽ mất quyền quản trị.' : 'Tài khoản sẽ có toàn quyền quản trị hệ thống.', 'Xác nhận', 'danger')) {
      await api.put(`/admin/users/${u.id}/role`, { role: u.role === 'admin' ? 'learner' : 'admin' }); toast('Đã cập nhật.'); load();
    }
  };
  load();
}

/* ------------------------------ HỌC LIỆU ------------------------------ */
const lines = (arr) => (arr || []).map((x) => (Array.isArray(x) ? x.join(' | ') : x)).join('\n');
const parsePairs = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|').map((x) => x.trim()));
const RES = {
  levels: { label: 'Cấp độ', cols: [['code', 'Mã'], ['name', 'Tên'], ['goal', 'Mục tiêu']], fields: [['code', 'Mã', 'text'], ['name', 'Tên', 'text'], ['description', 'Mô tả', 'textarea'], ['goal', 'Mục tiêu học tập', 'textarea'], ['sort', 'Thứ tự', 'number']] },
  topics: { label: 'Chủ đề', filter: 'level', cols: [['code', 'Mã'], ['name', 'Tên'], ['grp', 'Nhóm'], ['level_id', 'Cấp độ']], fields: [['code', 'Mã (duy nhất)', 'text'], ['name', 'Tên', 'text'], ['level_id', 'Cấp độ', 'level'], ['grp', 'Nhóm kiến thức', 'grp'], ['description', 'Mô tả ngắn', 'textarea'], ['source', 'Nguồn trong giáo trình', 'text'], ['unit', 'Bài số (để nhóm theo bài, tuỳ chọn)', 'number'], ['sort', 'Thứ tự', 'number'], ['mastery_rules', 'Ngưỡng thành thạo riêng (JSON, tuỳ chọn)', 'json']] },
  lessons: { label: 'Bài học', filter: 'topic', cols: [['title', 'Tiêu đề'], ['topic_id', 'Chủ đề'], ['goal', 'Mục tiêu']], fields: [['topic_id', 'Chủ đề', 'topic'], ['title', 'Tiêu đề', 'text'], ['goal', 'Mục tiêu bài học', 'text'], ['body.explain', 'Giải thích', 'textarea'], ['body.formula', 'Công thức', 'text'], ['body.examples', 'Ví dụ (mỗi dòng: tiếng Hàn | nghĩa)', 'pairs'], ['body.mistakes', 'Lỗi thường gặp (mỗi dòng một lỗi)', 'list'], ['body.compare', 'So sánh dễ nhầm', 'textarea'], ['sort', 'Thứ tự', 'number']] },
  vocabulary: { label: 'Từ vựng', filter: 'topic', cols: [['ko', 'Tiếng Hàn'], ['vi', 'Nghĩa'], ['topic_id', 'Chủ đề']], fields: [['topic_id', 'Chủ đề', 'topic'], ['ko', 'Tiếng Hàn', 'text'], ['vi', 'Nghĩa tiếng Việt', 'text'], ['note', 'Ghi chú', 'text']] },
  grammar: { label: 'Ngữ pháp', filter: 'topic', cols: [['pattern', 'Cấu trúc'], ['meaning', 'Ý nghĩa'], ['topic_id', 'Chủ đề']], fields: [['topic_id', 'Chủ đề', 'topic'], ['pattern', 'Cấu trúc', 'text'], ['meaning', 'Ý nghĩa', 'text'], ['formula', 'Công thức', 'text'], ['explanation', 'Giải thích', 'textarea'], ['examples', 'Ví dụ (tiếng Hàn | nghĩa)', 'pairs'], ['mistakes', 'Lỗi thường gặp (mỗi dòng một lỗi)', 'list'], ['compare', 'So sánh', 'textarea']] },
  passages: { label: 'Bài đọc / nghe', filter: 'topic', cols: [['title', 'Tiêu đề'], ['kind', 'Loại'], ['topic_id', 'Chủ đề']], fields: [['topic_id', 'Chủ đề', 'topic'], ['kind', 'Loại', 'kind'], ['title', 'Tiêu đề', 'text'], ['ko_text', 'Nội dung tiếng Hàn (bài nghe: văn bản được đọc)', 'textarea'], ['vi_text', 'Bản dịch / tóm tắt', 'textarea']] },
};
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function formFields(fields, rec = {}) {
  const f = h('<div class="stack"></div>');
  for (const [k, label, type] of fields) {
    let v = getPath(rec, k);
    let ctl;
    if (type === 'textarea') ctl = `<textarea class="input" data-k="${k}">${esc(v || '')}</textarea>`;
    else if (type === 'pairs' || type === 'list') ctl = `<textarea class="input ko" data-k="${k}" data-t="${type}">${esc(lines(v))}</textarea>`;
    else if (type === 'json') ctl = `<textarea class="input" data-k="${k}" data-t="json" placeholder='{"mastered_min_accuracy": 0.9}'>${v ? esc(typeof v === 'string' ? v : JSON.stringify(v)) : ''}</textarea>`;
    else if (type === 'topic') ctl = sel(topicOpts(false), v, `data-k="${k}" data-t="num"`);
    else if (type === 'level') ctl = sel(levelOpts(false), v, `data-k="${k}" data-t="num"`);
    else if (type === 'grp') ctl = sel(Object.entries(META.groups), v, `data-k="${k}"`);
    else if (type === 'kind') ctl = sel([['reading', 'Bài đọc'], ['listening', 'Bài nghe']], v, `data-k="${k}"`);
    else ctl = `<input class="input" data-k="${k}" ${type === 'number' ? 'type="number" data-t="num"' : ''} value="${esc(v ?? '')}">`;
    f.append(h(`<div class="field"><label>${esc(label)}</label>${ctl}</div>`));
  }
  return f;
}
function readFields(f) {
  const out = {};
  $$('[data-k]', f).forEach((el) => {
    let v = el.value; const t = el.dataset.t;
    if (t === 'num') v = v === '' ? null : Number(v);
    if (t === 'pairs') v = parsePairs(v).map((p) => [p[0], p[1] || '']);
    if (t === 'list') v = v.split('\n').map((x) => x.trim()).filter(Boolean);
    if (t === 'json') { v = v.trim() ? JSON.parse(v) : null; }
    const path = el.dataset.k.split('.');
    if (path.length === 2) { out[path[0]] = out[path[0]] || {}; out[path[0]][path[1]] = v; } else out[path[0]] = v;
  });
  return out;
}
async function deleteFlow(res, id, label) {
  const u = await api.get(`/admin/usage/${res}/${id}`);
  const usedAny = Object.values(u).some((n) => n > 0);
  const detail = Object.entries(u).map(([k, n]) => `<li>${esc({ topics: 'Chủ đề', exams: 'Đề thi', questions: 'Câu hỏi', answers: 'Câu trả lời của học viên', learners: 'Học viên đã học', lessons: 'Bài học', grammar: 'Điểm ngữ pháp', passages: 'Bài đọc/nghe', vocabulary: 'Từ vựng', srs_records: 'Bản ghi ôn tập', mistakes: 'Bản ghi câu sai', writings: 'Bài viết', attempts: 'Lượt thi' }[k] || k)}: <b>${n}</b></li>`).join('');
  const ok = await confirmBox(usedAny ? 'Dữ liệu đang được sử dụng' : 'Xoá vĩnh viễn?',
    usedAny ? `<p>“${esc(label)}” đang được dùng trong lịch sử học tập:</p><ul>${detail}</ul><p>Để bảo toàn lịch sử, bản ghi sẽ được <b>lưu trữ (ẩn khỏi người học)</b> thay vì xoá. Có thể khôi phục sau.</p>` : `<p>“${esc(label)}” chưa được sử dụng ở đâu. Thao tác này không thể hoàn tác.</p>`,
    usedAny ? 'Lưu trữ' : 'Xoá', 'danger');
  if (!ok) return false;
  const r = await api.del(`/admin/${res}/${id}`);
  toast(r.archived ? 'Đã lưu trữ.' : 'Đã xoá.');
  META = await api.get('/admin/meta');
  return true;
}
async function content(root) {
  let res = store.get('adm:res', 'topics');
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Quản lý học liệu</span><h1>Học liệu</h1><p class="muted small">Cấp độ → chủ đề → bài học, từ vựng, ngữ pháp, bài đọc/nghe. Dữ liệu đã dùng trong lịch sử học tập chỉ được lưu trữ, không xoá cứng.</p></div></div>'));
  const tabs = h(`<div class="tabs">${Object.entries(RES).map(([k, c]) => `<button data-r="${k}">${c.label}</button>`).join('')}</div>`);
  const body = h('<div class="stack"></div>'); root.append(tabs, body);
  tabs.onclick = (e) => { const b = e.target.closest('[data-r]'); if (b) { res = b.dataset.r; store.set('adm:res', res); draw(); } };
  let filt = store.get('adm:cfilt', '');
  let showArch = false;
  const draw = async () => {
    $$('button', tabs).forEach((b) => b.classList.toggle('on', b.dataset.r === res));
    const C = RES[res];
    body.innerHTML = '';
    const bar = h(`<div class="row between"><div class="row">${C.filter === 'topic' ? sel(topicOpts(true), filt, 'data-fl style="width:auto"') : C.filter === 'level' ? sel(levelOpts(true), filt, 'data-fl style="width:auto"') : ''}
      <label class="check"><input type="checkbox" data-arch ${showArch ? 'checked' : ''}> Hiện mục đã lưu trữ</label></div><button class="btn primary" data-new>Thêm ${C.label.toLowerCase()}</button></div>`);
    body.append(bar);
    const fl = $('[data-fl]', bar); if (fl) fl.onchange = () => { filt = fl.value; store.set('adm:cfilt', filt); draw(); };
    $('[data-arch]', bar).onchange = (e) => { showArch = e.target.checked; draw(); };
    const qs = new URLSearchParams(); if (filt && C.filter) qs.set(C.filter === 'topic' ? 'topic_id' : 'level_id', filt); if (showArch) qs.set('include_archived', 1);
    const rows = await api.get(`/admin/${res}?${qs}`);
    const show = (row, k) => (k === 'topic_id' ? topicName(row[k]) : k === 'level_id' ? (META.levels.find((l) => l.id === row[k]) || {}).name : k === 'grp' ? META.groups[row[k]] : row[k]);
    body.append(h(`<div class="table-wrap"><table class="t"><thead><tr>${C.cols.map(([, l]) => `<th>${l}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rows.map((r) => `<tr ${r.archived ? 'style="opacity:.55"' : ''}>${C.cols.map(([k]) => `<td class="${k === 'ko' ? 'ko' : ''}">${esc(String(show(r, k) ?? '').slice(0, 120))}</td>`).join('')}
      <td style="white-space:nowrap">${r.archived ? `<button class="btn sm" data-restore="${r.id}">Khôi phục</button>` : `<button class="btn sm" data-edit="${r.id}">Sửa</button> <button class="btn sm danger" data-del="${r.id}">Xoá</button>`}</td></tr>`).join('') || `<tr><td colspan="${C.cols.length + 1}" class="muted">Chưa có dữ liệu.</td></tr>`}</tbody></table></div>`));
    const edit = async (rec) => {
      const f = formFields(C.fields, rec || (C.filter === 'topic' && filt ? { topic_id: Number(filt) } : {}));
      const ok = await modal({ title: (rec ? 'Sửa ' : 'Thêm ') + C.label.toLowerCase(), body: f, wide: true, actions: [{ label: 'Huỷ', value: false }, { label: 'Lưu', value: true, kind: 'primary' }] });
      if (!ok) return;
      try {
        const data = readFields(f);
        if (rec) await api.put(`/admin/${res}/${rec.id}`, data); else await api.post(`/admin/${res}`, data);
        toast('Đã lưu.'); META = await api.get('/admin/meta'); draw();
      } catch (e) { toast(e.message, 'bad'); }
    };
    $('[data-new]', bar).onclick = () => edit(null);
    body.onclick = async (e) => {
      const ed = e.target.closest('[data-edit]'); if (ed) return edit(rows.find((r) => r.id === Number(ed.dataset.edit)));
      const dl = e.target.closest('[data-del]'); if (dl) { const r = rows.find((x) => x.id === Number(dl.dataset.del)); if (await deleteFlow(res, r.id, r.name || r.title || r.ko || r.pattern || r.code)) draw(); return; }
      const rs = e.target.closest('[data-restore]'); if (rs) { await api.post(`/admin/${res}/${rs.dataset.restore}/restore`); toast('Đã khôi phục.'); META = await api.get('/admin/meta'); draw(); }
    };
  };
  draw();
}

/* ------------------------------ NGÂN HÀNG CÂU HỎI ------------------------------ */
async function questions(root) {
  const F = store.get('adm:qf', { page: 1 });
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Ngân hàng câu hỏi</span><h1>Câu hỏi</h1><p class="small muted">Quy trình: tạo (nháp) → xác minh đáp án → xuất bản. Chỉ câu đã xác minh mới được đưa vào đề thi. Đổi đáp án của câu đã xác minh sẽ yêu cầu xác minh lại.</p></div><div class="row"><button class="btn" data-dup>Quét trùng lặp</button><button class="btn primary" data-new>Tạo câu hỏi</button></div></div>'));
  const bar = h(`<div class="card flat filters">
    <div class="field" style="flex:1;min-width:180px"><label>Tìm (nội dung, mã, phương án)</label><input class="input" data-f="q" value="${esc(F.q || '')}"></div>
    <div class="field"><label>Cấp độ</label>${sel(levelOpts(true), F.level_id, 'data-f="level_id"')}</div>
    <div class="field"><label>Chủ đề</label>${sel(topicOpts(true), F.topic_id, 'data-f="topic_id"')}</div>
    <div class="field"><label>Loại</label>${sel([['', 'Tất cả'], ...Object.entries(TYPE_LABEL)], F.type, 'data-f="type"')}</div>
    <div class="field"><label>Trạng thái</label>${sel([['', 'Tất cả'], ...Object.entries(QST).map(([k, v]) => [k, v[0]])], F.status, 'data-f="status"')}</div>
    <div class="field"><label>Xác minh</label>${sel([['', 'Tất cả'], ['1', 'Đã xác minh'], ['0', 'Chưa xác minh']], F.verified, 'data-f="verified"')}</div>
    <div class="field"><label>Độ khó</label>${sel([['', 'Tất cả'], ['1', 'Dễ'], ['2', 'Vừa'], ['3', 'Khó']], F.difficulty, 'data-f="difficulty"')}</div>
    <button class="btn primary" data-go>Lọc</button></div>`);
  const list = h('<div class="stack"></div>'); root.append(bar, list);
  const load = async () => {
    $$('[data-f]', bar).forEach((i) => { F[i.dataset.f] = i.value; }); store.set('adm:qf', F);
    const q = Object.fromEntries(Object.entries(F).filter(([, v]) => v !== '' && v != null));
    const r = await api.get('/admin/questions?' + new URLSearchParams(q));
    list.innerHTML = '';
    list.append(h(`<div class="row between small muted"><span>${r.total} câu hỏi</span><div class="pager"><button class="btn sm" data-pg="-1" ${r.page <= 1 ? 'disabled' : ''}>←</button><span>Trang ${r.page}/${Math.max(1, Math.ceil(r.total / r.size))}</span><button class="btn sm" data-pg="1" ${r.page * r.size >= r.total ? 'disabled' : ''}>→</button></div></div>`));
    list.append(h(`<div class="table-wrap"><table class="t"><thead><tr><th>Mã</th><th>Câu hỏi</th><th>Chủ đề</th><th>Loại</th><th>Độ khó</th><th>Trạng thái</th><th>Xác minh</th><th class="num">Lượt làm · đúng</th><th></th></tr></thead><tbody>
      ${r.rows.map((x) => `<tr ${x.archived ? 'style="opacity:.5"' : ''}><td class="small">${esc(x.code)}</td><td class="prompt-cell">${esc(plain(x.prompt)).slice(0, 140)}</td><td class="small">${esc(x.topic)}</td><td class="small">${TYPE_LABEL[x.type]}</td><td class="small">${DIFF_LABEL[x.difficulty]}</td>
      <td>${qChip(x.status)}</td><td>${x.verified ? '<span class="pill-ok">✓ Đã xác minh</span>' : '<span class="pill-no">Chưa</span>'}</td><td class="num small">${x.answers} · ${pct(x.acc)}</td>
      <td style="white-space:nowrap"><button class="btn sm" data-edit="${x.id}">Sửa</button> <button class="btn sm" data-pv="${x.id}">Xem trước</button>${x.verified ? '' : ` <button class="btn sm" data-ver="${x.id}">Xác minh</button>`}
      ${x.status === 'published' ? ` <button class="btn sm" data-st="hidden" data-id="${x.id}">Ẩn</button>` : x.verified ? ` <button class="btn sm primary" data-st="published" data-id="${x.id}">Xuất bản</button>` : ''} <button class="btn sm danger" data-del="${x.id}">Xoá</button></td></tr>`).join('') || '<tr><td colspan="9" class="muted">Không có câu hỏi.</td></tr>'}</tbody></table></div>`));
  };
  $('[data-go]', bar).onclick = () => { F.page = 1; load(); };
  list.onclick = async (e) => {
    const pg = e.target.closest('[data-pg]'); if (pg) { F.page = Math.max(1, (Number(F.page) || 1) + Number(pg.dataset.pg)); store.set('adm:qf', F); return load(); }
    const ed = e.target.closest('[data-edit]'); if (ed) return editQuestion(Number(ed.dataset.edit), load);
    const pv = e.target.closest('[data-pv]'); if (pv) return previewQuestion(Number(pv.dataset.pv));
    const vr = e.target.closest('[data-ver]'); if (vr) { const q = await api.get('/admin/questions/' + vr.dataset.ver); if (await verifyDialog(q)) { await api.post(`/admin/questions/${q.id}/verify`, { verified: true }); toast('Đã xác minh.'); load(); } return; }
    const st = e.target.closest('[data-st]'); if (st) { try { await api.post(`/admin/questions/${st.dataset.id}/status`, { status: st.dataset.st }); toast(st.dataset.st === 'published' ? 'Đã xuất bản.' : 'Đã ẩn.'); load(); } catch (er) { toast(er.message, 'bad'); } return; }
    const dl = e.target.closest('[data-del]'); if (dl) { if (await deleteFlow('questions', Number(dl.dataset.del), 'câu hỏi này')) load(); }
  };
  $('[data-new]', root).onclick = () => editQuestion(null, load);
  $('[data-dup]', root).onclick = async () => {
    const g = await api.get('/admin/questions/duplicates');
    modal({ title: 'Kết quả quét trùng lặp', body: g.length ? `<p>${g.length} nhóm câu có nội dung và phương án giống nhau:</p>${g.map((grp) => `<div class="callout small">${grp.map((q) => `<b>${esc(q.code)}</b> (${esc(q.topic)}): ${esc(plain(q.prompt)).slice(0, 80)}`).join('<br>')}</div>`).join('')}` : '<p>Không phát hiện câu hỏi trùng lặp.</p>', wide: true });
  };
  load();
}
async function verifyDialog(q) {
  const ans = q.options.length ? q.options.map((o) => `<li>${o.is_correct ? '<b>✓ ' : ''}${esc(o.text)}${o.is_correct ? '</b>' : ''}</li>`).join('') : `<li>${esc(JSON.stringify(q.answer))}</li>`;
  return confirmBox('Xác minh đáp án', `<div class="prompt">${safeHtml(q.prompt)}</div><ul>${ans}</ul><p class="small"><b>Giải thích:</b> ${esc(q.explanation || '(trống)')}</p><p class="small muted">Xác nhận rằng đáp án đúng và giải thích chính xác. Câu đã xác minh mới được dùng trong đề thi.</p>`, 'Đáp án chính xác');
}
async function previewQuestion(id) {
  const q = await api.get('/admin/questions/' + id);
  const R = renderQuestion(q.preview, { mode: 'exam', autoplay: false });
  const box = h('<div class="stack"></div>'); box.append(h('<p class="small muted">Hiển thị như người học nhìn thấy (thứ tự phương án được xáo trộn khi luyện).</p>'), R.el);
  box.append(h(`<div class="callout small"><b>Đáp án:</b> ${q.options.length ? esc((q.options.find((o) => o.is_correct) || {}).text || '') : esc((q.answer.accepted || q.answer.words || [q.answer.reference]).join(q.type === 'order' ? ' ' : ' / '))}<br><b>Giải thích:</b> ${esc(q.explanation)}<br><span class="faint">Đã có ${q.stats.n} lượt làm · ${pct(q.stats.acc)} đúng</span></div>`));
  modal({ title: `Xem trước ${q.code}`, body: box, wide: true });
}
async function editQuestion(id, after) {
  const q = id ? await api.get('/admin/questions/' + id) : { type: 'mcq', topic_id: store.get('adm:qf', {}).topic_id || META.topics[0].id, difficulty: 1, skill: 'grammar', error_tag: 'grammar', status: 'draft', verified: 0, data: {}, answer: {}, options: [{ text: '', is_correct: 1 }, { text: '' }, { text: '' }] };
  const passages = await api.get('/admin/passages');
  const f = h(`<div class="stack">
    <div class="grid g4"><div class="field"><label>Chủ đề</label>${sel(topicOpts(false), q.topic_id, 'data-x="topic_id"')}</div>
      <div class="field"><label>Loại câu hỏi</label>${sel(Object.entries(TYPE_LABEL), q.type, 'data-x="type"')}</div>
      <div class="field"><label>Kỹ năng</label>${sel(Object.entries(SKILL_LABEL), q.skill, 'data-x="skill"')}</div>
      <div class="field"><label>Nhóm lỗi</label>${sel(Object.entries(META.tags), q.error_tag, 'data-x="error_tag"')}</div></div>
    <div class="grid g4"><div class="field"><label>Độ khó</label>${sel([[1, 'Dễ'], [2, 'Vừa'], [3, 'Khó']], q.difficulty, 'data-x="difficulty"')}</div>
      <div class="field"><label>Trạng thái</label>${sel(Object.entries(QST).map(([k, v]) => [k, v[0]]), q.status, 'data-x="status"')}</div>
      <div class="field"><label>Bài đọc/nghe đi kèm</label>${sel([['', 'Không có'], ...passages.map((p) => [p.id, p.title])], q.data.passage_id, 'data-x="passage_id"')}</div>
      <label class="check" style="align-self:end"><input type="checkbox" data-x="verified" ${q.verified ? 'checked' : ''}> Đã xác minh đáp án</label></div>
    <div class="field"><label>Nội dung câu hỏi (cho phép &lt;b&gt;, &lt;i&gt;, &lt;span class="ko"&gt;)</label><textarea class="input ko" data-x="prompt" rows="2">${esc(q.prompt || '')}</textarea></div>
    <div class="field" data-for="listen"><label>Văn bản được đọc (câu nghe)</label><input class="input ko" data-x="say" value="${esc(q.data.say || '')}"></div>
    <div class="stack tight" data-for="mcq listen error"><span class="lbl">Phương án (chọn 1 đáp án đúng; “phản hồi” giải thích vì sao phương án sai)</span><div data-opts class="stack tight"></div><button type="button" class="btn sm" data-addopt style="align-self:flex-start">+ Thêm phương án</button></div>
    <div class="field" data-for="fill conjugate translate"><label>Đáp án chấp nhận (mỗi dòng một cách viết đúng)</label><textarea class="input ko" data-x="accepted" rows="3">${esc((q.answer.accepted || []).join('\n'))}</textarea></div>
    <div class="field" data-for="fill conjugate translate"><label>Lỗi sai phổ biến (mỗi dòng: câu sai | vì sao sai) — tuỳ chọn</label><textarea class="input ko" data-x="common_wrong" rows="2">${esc((q.answer.common_wrong || []).map((w) => w.text + ' | ' + w.why).join('\n'))}</textarea></div>
    <div class="field" data-for="order"><label>Các từ theo đúng thứ tự (mỗi dòng một cụm)</label><textarea class="input ko" data-x="words" rows="4">${esc((q.answer.words || []).join('\n'))}</textarea></div>
    <div class="stack tight" data-for="write"><div class="grid g2"><div class="field"><label>Độ dài tối thiểu (ký tự, không tính khoảng trắng)</label><input class="input" type="number" data-x="min_len" value="${(q.data.rubric && q.data.rubric.min_len) || 0}"></div>
      <div class="field"><label>Bài mẫu tham khảo</label><input class="input ko" data-x="reference" value="${esc(q.answer.reference || '')}"></div></div>
      <div class="field"><label>Tiêu chí chấm (mỗi dòng: mô tả | kiểu: includes/anyOf/regex/endsWith/hangul | giá trị (anyOf ngăn cách bởi ;) | gợi ý khi chưa đạt)</label>
      <textarea class="input ko" data-x="criteria" rows="4">${esc(((q.data.rubric && q.data.rubric.criteria) || []).map((c) => [c.label, c.kind, Array.isArray(c.value) ? c.value.join(';') : c.value || '', c.tip || ''].join(' | ')).join('\n'))}</textarea></div></div>
    <div class="field"><label>Giải thích đáp án</label><textarea class="input" data-x="explanation" rows="2">${esc(q.explanation || '')}</textarea></div></div>`);
  const opts = $('[data-opts]', f);
  const addOpt = (o = {}) => { const r = h(`<div class="opt-row"><input type="radio" name="corr" ${o.is_correct ? 'checked' : ''} aria-label="Đáp án đúng"><input class="input ko" placeholder="Phương án" value="${esc(o.text || '')}"><input class="input" placeholder="Phản hồi khi chọn sai (tuỳ chọn)" value="${esc(o.feedback || '')}"><button type="button" class="btn sm ghost" aria-label="Xoá">✕</button></div>`); $('button', r).onclick = () => r.remove(); opts.append(r); };
  (q.options && q.options.length ? q.options : [{ is_correct: 1 }, {}, {}]).forEach(addOpt);
  $('[data-addopt]', f).onclick = () => addOpt();
  const typeSel = $('[data-x=type]', f);
  const syncType = () => $$('[data-for]', f).forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(typeSel.value); });
  typeSel.onchange = syncType; syncType();
  const collect = () => {
    const g = (k) => $(`[data-x=${k}]`, f);
    const type = typeSel.value;
    const body = { topic_id: Number(g('topic_id').value), type, skill: g('skill').value, error_tag: g('error_tag').value, difficulty: Number(g('difficulty').value), status: g('status').value,
      verified: g('verified').checked, prompt: g('prompt').value.trim(), explanation: g('explanation').value.trim(), data: { ...(q.data || {}) }, answer: {} };
    body.data.passage_id = g('passage_id').value ? Number(g('passage_id').value) : undefined;
    if (type === 'listen') body.data.say = g('say').value.trim(); else delete body.data.say;
    if (['mcq', 'listen', 'error'].includes(type)) { body.options = $$('.opt-row', opts).map((r) => ({ text: $$('input', r)[1].value.trim(), is_correct: $$('input', r)[0].checked, feedback: $$('input', r)[2].value.trim() || null })).filter((o) => o.text); if (type === 'error') body.data.fixed_order = true; }
    else body.options = [];
    if (['fill', 'conjugate', 'translate'].includes(type)) { body.answer.accepted = g('accepted').value.split('\n').map((x) => x.trim()).filter(Boolean); const cw = parsePairs(g('common_wrong').value).map(([text, why]) => ({ text, why: why || '' })); if (cw.length) body.answer.common_wrong = cw; }
    if (type === 'order') body.answer.words = g('words').value.split('\n').map((x) => x.trim()).filter(Boolean);
    if (type === 'write') {
      body.answer.reference = g('reference').value.trim();
      body.data.rubric = { min_len: Number(g('min_len').value) || 0, criteria: parsePairs(g('criteria').value).map(([label, kind, value, tip]) => ({ label, kind: kind || 'includes', value: kind === 'anyOf' ? (value || '').split(';').map((x) => x.trim()).filter(Boolean) : value, tip: tip || null })) };
    }
    return body;
  };
  while (true) {
    const act = await modal({ title: id ? `Sửa câu ${q.code}` : 'Tạo câu hỏi', body: f, wide: true, actions: [{ label: 'Huỷ', value: null }, { label: 'Xem trước', value: 'pv' }, { label: 'Lưu', value: 'save', kind: 'primary' }] });
    if (!act) return;
    const body = collect();
    if (act === 'pv') {
      const pq = { ...body, id: 0, topic_name: topicName(body.topic_id), options: (body.options || []).map((o, i) => ({ id: i + 1, text: o.text })), words: body.answer.words ? [...body.answer.words].reverse() : undefined, say: body.data.say,
        criteria: body.data.rubric ? body.data.rubric.criteria.map((c) => c.label) : undefined };
      const R = renderQuestion(pq, { mode: 'exam', autoplay: false });
      await modal({ title: 'Xem trước như người học', body: R.el, wide: true, actions: [{ label: 'Quay lại chỉnh sửa', value: 1, kind: 'primary' }] });
      continue;
    }
    try {
      let r;
      if (id) r = await api.put('/admin/questions/' + id, body);
      else {
        try { r = await api.post('/admin/questions', body); }
        catch (e) { if (e.status === 409 && await confirmBox('Có thể trùng lặp', esc(e.message) + ' Vẫn lưu?', 'Vẫn lưu')) r = await api.post('/admin/questions', { ...body, allow_duplicate: true }); else throw e; }
      }
      toast(r.note || 'Đã lưu câu hỏi.'); after(); return;
    } catch (e) { toast(e.message, 'bad'); }
  }
}

/* ------------------------------ ĐỀ THI ------------------------------ */
const EST = { draft: ['Bản nháp', 'st-not_started'], published: ['Đã xuất bản', 'st-mastered'], archived: ['Lưu trữ', 'st-not_started'] };
async function exams(root) {
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Quản lý đề thi</span><h1>Đề thi</h1><p class="small muted">Thiết lập ma trận chủ đề × số câu, sinh câu hỏi từ ngân hàng (chỉ câu đã xác minh), xem trước rồi xuất bản.</p></div><button class="btn primary" data-new>Tạo đề thi</button></div>'));
  const list = h('<div></div>'); root.append(list);
  const load = async () => {
    const rows = await api.get('/admin/exams');
    list.innerHTML = '';
    list.append(h(`<div class="table-wrap"><table class="t"><thead><tr><th>Đề</th><th>Trạng thái</th><th class="num">Số câu</th><th class="num">Thời gian</th><th class="num">Điểm đạt</th><th>Mở / đóng</th><th class="num">Lượt nộp · điểm TB</th><th></th></tr></thead><tbody>
      ${rows.map((e) => `<tr><td><b>${esc(e.title)}</b><div class="small faint">${esc(e.scope || '')}</div></td><td><span class="chip ${EST[e.status][1]}">${EST[e.status][0]}</span></td><td class="num">${e.question_ids.length}</td><td class="num">${e.duration_min}′</td><td class="num">${e.pass_score ?? '—'}</td>
      <td class="small">${e.open_at ? fmtDate(e.open_at) : 'Luôn mở'}<br>${e.close_at ? fmtDate(e.close_at) : ''}</td><td class="num">${e.attempts} · ${e.avg != null ? e.avg.toFixed(1) : '—'}</td>
      <td style="white-space:nowrap"><button class="btn sm" data-edit="${e.id}">Sửa</button> <button class="btn sm" data-stats="${e.id}">Thống kê</button> ${e.status === 'published' ? `<button class="btn sm" data-st="draft" data-id="${e.id}">Gỡ xuống</button>` : `<button class="btn sm primary" data-st="published" data-id="${e.id}">Xuất bản</button>`} <button class="btn sm danger" data-del="${e.id}">Xoá</button></td></tr>`).join('') || '<tr><td colspan="8" class="muted">Chưa có đề.</td></tr>'}</tbody></table></div>`));
  };
  list.onclick = async (e) => {
    const ed = e.target.closest('[data-edit]'); if (ed) return editExam(Number(ed.dataset.edit), load);
    const stb = e.target.closest('[data-stats]'); if (stb) return examStats(Number(stb.dataset.stats));
    const st = e.target.closest('[data-st]'); if (st) { try { await api.post(`/admin/exams/${st.dataset.id}/status`, { status: st.dataset.st }); toast('Đã cập nhật.'); load(); } catch (er) { toast(er.message, 'bad'); } return; }
    const dl = e.target.closest('[data-del]'); if (dl) { if (await deleteFlow('exams', Number(dl.dataset.del), 'đề thi này')) load(); }
  };
  $('[data-new]', root).onclick = () => editExam(null, load);
  load();
}
async function editExam(id, after) {
  let e = id ? await api.get('/admin/exams/' + id) : { title: '', description: '', level_id: META.levels[1] && META.levels[1].id, matrix: [], question_ids: [], questions: [], duration_min: 20, pass_score: 60, show_answers: 1 };
  const f = h(`<div class="stack">
    <div class="grid g2"><div class="field"><label>Tên đề</label><input class="input" data-x="title" value="${esc(e.title)}"></div><div class="field"><label>Cấp độ</label>${sel(levelOpts(false), e.level_id, 'data-x="level_id"')}</div></div>
    <div class="field"><label>Mô tả</label><input class="input" data-x="description" value="${esc(e.description || '')}"></div>
    <div class="grid g4"><div class="field"><label>Thời gian (phút)</label><input class="input" type="number" data-x="duration_min" value="${e.duration_min}"></div>
      <div class="field"><label>Điểm đạt (0–100, để trống nếu không quy định)</label><input class="input" type="number" data-x="pass_score" value="${e.pass_score ?? ''}"></div>
      <div class="field"><label>Mở đề lúc</label><input class="input" type="datetime-local" data-x="open_at" value="${toLocalInput(e.open_at)}"></div>
      <div class="field"><label>Đóng đề lúc</label><input class="input" type="datetime-local" data-x="close_at" value="${toLocalInput(e.close_at)}"></div></div>
    <label class="check" style="align-self:flex-start"><input type="checkbox" data-x="show_answers" ${e.show_answers ? 'checked' : ''}> Hiển thị đáp án và giải thích sau khi nộp</label>
    <div class="stack tight"><span class="lbl">Ma trận đề (chủ đề × độ khó × số câu)</span><div data-matrix class="stack tight"></div><button type="button" class="btn sm" data-addrow style="align-self:flex-start">+ Thêm dòng</button></div>
    <div class="stack tight"><div class="row between"><span class="lbl" data-qcount>Câu hỏi trong đề: ${e.question_ids.length}</span><div class="row"><input class="input" data-addcode placeholder="Thêm câu theo mã, ví dụ G-LOC-MC-001" style="width:280px"><button type="button" class="btn sm" data-addq>Thêm</button></div></div>
      <div data-qs class="table-wrap" style="max-height:260px;overflow:auto"></div></div></div>`);
  const mx = $('[data-matrix]', f);
  const addRow = (m = {}) => { const r = h(`<div class="mrow">${sel(topicOpts(false), m.topic_id, 'data-m="topic_id"')}${sel([['', 'Mọi độ khó'], [1, 'Dễ'], [2, 'Vừa'], [3, 'Khó']], m.difficulty || '', 'data-m="difficulty"')}<input class="input" type="number" min="1" data-m="count" value="${m.count || 3}" aria-label="Số câu"><button type="button" class="btn sm ghost" aria-label="Xoá dòng">✕</button></div>`); $('button', r).onclick = () => r.remove(); mx.append(r); };
  e.matrix.forEach(addRow);
  $('[data-addrow]', f).onclick = () => addRow();
  let qids = [...e.question_ids]; let qmeta = new Map((e.questions || []).map((q) => [q.id, q]));
  const drawQs = () => {
    $('[data-qcount]', f).textContent = `Câu hỏi trong đề: ${qids.length}`;
    $('[data-qs]', f).innerHTML = `<table class="t"><tbody>${qids.map((id2) => { const q = qmeta.get(id2) || { code: '#' + id2, prompt: '' }; return `<tr><td class="small">${esc(q.code)}</td><td class="small">${esc(plain(q.prompt)).slice(0, 90)}</td><td class="small">${q.verified === 0 ? '<span class="pill-no">Chưa xác minh</span>' : ''}</td><td><button type="button" class="btn sm ghost" data-rm="${id2}">Bỏ</button></td></tr>`; }).join('') || '<tr><td class="muted">Chưa có câu hỏi. Lưu ma trận rồi bấm “Sinh câu hỏi”.</td></tr>'}</tbody></table>`;
  };
  drawQs();
  f.addEventListener('click', (ev) => { const rm = ev.target.closest('[data-rm]'); if (rm) { qids = qids.filter((x) => x !== Number(rm.dataset.rm)); drawQs(); } });
  $('[data-addq]', f).onclick = async () => {
    const code = $('[data-addcode]', f).value.trim(); if (!code) return;
    const r = await api.get('/admin/questions?' + new URLSearchParams({ q: code, size: 5 }));
    const q = r.rows.find((x) => x.code.toLowerCase() === code.toLowerCase());
    if (!q) return toast('Không tìm thấy mã câu hỏi.', 'bad');
    if (!q.verified || q.status !== 'published') toast('Lưu ý: câu này chưa xác minh/chưa xuất bản nên đề sẽ không xuất bản được.', 'bad');
    if (!qids.includes(q.id)) { qids.push(q.id); qmeta.set(q.id, q); drawQs(); }
    $('[data-addcode]', f).value = '';
  };
  const collect = () => {
    const g = (k) => $(`[data-x=${k}]`, f);
    return { title: g('title').value, description: g('description').value, level_id: Number(g('level_id').value), duration_min: Number(g('duration_min').value), pass_score: g('pass_score').value,
      open_at: g('open_at').value ? new Date(g('open_at').value).toISOString() : null, close_at: g('close_at').value ? new Date(g('close_at').value).toISOString() : null, show_answers: g('show_answers').checked,
      matrix: $$('.mrow', mx).map((r) => ({ topic_id: Number($('[data-m=topic_id]', r).value), difficulty: $('[data-m=difficulty]', r).value || undefined, count: Number($('[data-m=count]', r).value) })),
      question_ids: qids, scope: [...new Set($$('.mrow', mx).map((r) => topicName($('[data-m=topic_id]', r).value)))].join(', ') };
  };
  while (true) {
    const act = await modal({ title: id ? 'Sửa đề thi' : 'Tạo đề thi', body: f, wide: true, actions: [{ label: 'Đóng', value: null }, { label: 'Lưu & sinh câu hỏi từ ma trận', value: 'gen' }, { label: 'Xem trước đề', value: 'pv' }, { label: 'Lưu bản nháp', value: 'save', kind: 'primary' }] });
    if (!act) { after(); return; }
    try {
      const body = collect();
      if (!id) { id = (await api.post('/admin/exams', body)).id; } else await api.put('/admin/exams/' + id, body);
      if (act === 'gen') {
        const g = await api.post(`/admin/exams/${id}/generate`);
        const fresh = await api.get('/admin/exams/' + id);
        qids = fresh.question_ids; qmeta = new Map(fresh.questions.map((q) => [q.id, q])); drawQs();
        toast(g.problems.length ? `Sinh được ${g.count} câu. Một số dòng không đủ câu đã xác minh: ${g.problems.map((p) => `${topicName(p.topic_id)} cần ${p.need}, có ${p.available}`).join('; ')}` : `Đã sinh ${g.count} câu.`, g.problems.length ? 'bad' : '');
        continue;
      }
      if (act === 'pv') {
        const fresh = await api.get('/admin/exams/' + id);
        const box = h('<div class="stack"></div>');
        for (const q of fresh.questions.slice(0, 60)) { const full = await api.get('/admin/questions/' + q.id); const R = renderQuestion(full.preview, { mode: 'exam', autoplay: false }); const wrap = h('<div class="card flat"></div>'); wrap.append(R.el); box.append(wrap); }
        await modal({ title: `Xem trước: ${fresh.title} (${fresh.questions.length} câu)`, body: box, wide: true, actions: [{ label: 'Quay lại', value: 1, kind: 'primary' }] });
        continue;
      }
      toast('Đã lưu bản nháp.'); after(); return;
    } catch (er) { toast(er.message, 'bad'); }
  }
}
async function examStats(id) {
  const s = await api.get(`/admin/exams/${id}/stats`);
  const box = h(`<div class="stack"><div class="grid g3"><div class="kpi"><span class="l">Lượt thi</span><span class="v">${s.attempts.length}</span></div><div class="kpi"><span class="l">Điểm trung bình</span><span class="v">${s.avg != null ? s.avg.toFixed(1) : '—'}</span></div><div class="kpi"><span class="l">Tỷ lệ đạt</span><span class="v">${pct(s.pass_rate)}</span></div></div>
    <div class="stack tight"><span class="lbl">Phân bố điểm</span>${s.distribution.map((n, i) => `<div class="hbar"><span class="small num">${i * 10}–${i === 9 ? 100 : i * 10 + 9}</span><div class="bar"><i style="width:${(n / Math.max(1, ...s.distribution)) * 100}%"></i></div><span class="small num">${n}</span></div>`).join('')}</div>
    <div class="stack tight"><span class="lbl">Câu có tỷ lệ đúng thấp nhất</span><div class="table-wrap"><table class="t"><tbody>${s.per_question.slice(0, 10).map((q) => `<tr><td class="small">${esc(q.code)}</td><td class="small">${esc(plain(q.prompt)).slice(0, 80)}</td><td class="num small">${q.n} lượt · ${pct(q.acc)}</td></tr>`).join('') || '<tr><td class="muted">Chưa có dữ liệu.</td></tr>'}</tbody></table></div></div>
    <div class="stack tight"><span class="lbl">Các lượt thi</span><div class="table-wrap"><table class="t"><thead><tr><th>Người học</th><th>Bắt đầu</th><th>Trạng thái</th><th class="num">Điểm</th></tr></thead><tbody>${s.attempts.map((a) => `<tr><td>${esc(a.display_name)}</td><td>${fmtDate(a.started_at)}</td><td>${a.status}</td><td class="num">${a.score ?? '—'}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Chưa có.</td></tr>'}</tbody></table></div></div></div>`);
  modal({ title: 'Thống kê: ' + s.exam.title, body: box, wide: true });
}

/* ------------------------------ BÀI VIẾT ------------------------------ */
async function writing(root) {
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Bài viết của học viên</span><h1>Chấm & nhận xét bài viết</h1><p class="small muted">Hệ thống chấm tự động theo tiêu chí. Giáo viên có thể bổ sung nhận xét; học viên xem trong trang chủ đề và trang Tiến độ.</p></div><label class="check"><input type="checkbox" data-p checked> Chỉ bài chưa nhận xét</label></div>'));
  const list = h('<div class="stack"></div>'); root.append(list);
  const load = async () => {
    const rows = await api.get('/admin/writing' + ($('[data-p]', root).checked ? '?pending=1' : ''));
    list.innerHTML = rows.length ? '' : '<div class="card empty"><p>Không có bài viết nào.</p></div>';
    rows.forEach((w) => {
      const c = h(`<div class="card stack"><div class="row between small"><span><b>${esc(w.display_name)}</b> · ${esc(w.code)} · ${fmtDate(w.created_at)}</span><span>Chấm tự động: <b>${Math.round(w.auto_score * 100)}%</b></span></div>
        <span class="muted small">${esc(w.prompt)}</span><div class="passage">${esc(w.text)}</div>
        <ul class="rubric small">${w.rubric_result.map((r) => `<li><span class="${r.ok ? 'y' : 'n'}">${r.ok ? '✓' : '✗'}</span>${esc(r.label)}</li>`).join('')}</ul>
        ${w.feedback ? `<div class="callout info small">Nhận xét gần nhất: <span class="ink">${esc(w.feedback)}</span></div>` : ''}
        <div class="row"><input class="input" placeholder="Nhận xét cho học viên" style="flex:1"><input class="input" type="number" min="0" max="100" placeholder="Điểm" style="width:90px"><button class="btn primary">Gửi nhận xét</button></div></div>`);
      $('button', c).onclick = async () => { const [cm, sc] = $$('input', c); try { await api.post(`/admin/writing/${w.id}/feedback`, { comment: cm.value, score: sc.value }); toast('Đã gửi nhận xét.'); load(); } catch (e) { toast(e.message, 'bad'); } };
      list.append(c);
    });
  };
  $('[data-p]', root).onchange = load; load();
}

/* ------------------------------ CÀI ĐẶT & NHẬT KÝ ------------------------------ */
async function settings(root) {
  const { settings: s, defaults } = await api.get('/admin/settings');
  const M = [['window', 'Số câu gần nhất dùng để tính tỷ lệ đúng'], ['basic_min_questions', 'Số câu tối thiểu để đánh giá “cơ bản / cần luyện thêm”'], ['basic_min_accuracy', 'Tỷ lệ đúng tối thiểu cho “Đã nắm cơ bản” (0–1)'],
    ['mastered_min_questions', 'Số câu tối thiểu cho “Thành thạo”'], ['mastered_min_accuracy', 'Tỷ lệ đúng tối thiểu cho “Thành thạo” (0–1)'], ['mastered_min_sessions', 'Số phiên khác nhau phải đạt ngưỡng'], ['session_min_answers', 'Số câu tối thiểu trong một phiên để phiên được tính']];
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Cài đặt hệ thống</span><h1>Quy tắc đánh giá</h1><p class="small muted">Mức thành thạo được tính độc lập với tiến độ học. Có thể ghi đè ngưỡng cho từng chủ đề trong Học liệu › Chủ đề (trường JSON).</p></div></div>'));
  const f = h(`<div class="card stack"><h2>Mức thành thạo</h2><div class="grid g2">${M.map(([k, l]) => `<div class="field"><label>${l}</label><input class="input" type="number" step="any" data-m="${k}" value="${s.mastery[k]}"><span class="small faint">Mặc định: ${defaults.mastery[k]}</span></div>`).join('')}</div>
    <h2>Khác</h2><div class="grid g2"><div class="field"><label>Ngưỡng đạt của bài viết (tỷ lệ tiêu chí, 0–1)</label><input class="input" type="number" step="any" data-o="writing_pass" value="${s.writing_pass}"></div>
    <div class="field"><label>Thời gian ân hạn khi nộp bài thi (giây)</label><input class="input" type="number" data-o="exam_grace_seconds" value="${s.exam_grace_seconds}"></div></div>
    <div class="row"><button class="btn primary">Lưu cài đặt</button></div></div>`);
  $('button', f).onclick = async () => {
    const body = { mastery: {} }; $$('[data-m]', f).forEach((i) => { body.mastery[i.dataset.m] = Number(i.value); }); $$('[data-o]', f).forEach((i) => { body[i.dataset.o] = Number(i.value); });
    if (!(await confirmBox('Lưu cài đặt?', 'Quy tắc mới áp dụng ngay cho mọi người học khi trạng thái được tính lại.', 'Lưu'))) return;
    try { await api.put('/admin/settings', body); toast('Đã lưu.'); } catch (e) { toast(e.message, 'bad'); }
  };
  root.append(f);
}
async function logs(root) {
  const rows = await api.get('/admin/logs?limit=300');
  root.append(h('<div class="head"><div class="stack tight"><span class="eyebrow">Nhật ký</span><h1>Thao tác quản trị</h1></div></div>'));
  root.append(h(`<div class="table-wrap"><table class="t"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>${rows.map((l) => `<tr><td class="small">${fmtDate(l.at)}</td><td>${esc(l.username)}</td><td>${esc(l.action)}</td><td>${esc(l.target_type || '')} ${l.target_id ? '#' + l.target_id : ''}</td><td class="small faint">${esc((l.detail || '').slice(0, 140))}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có.</td></tr>'}</tbody></table></div>`));
}

boot();
void masteryChip;
