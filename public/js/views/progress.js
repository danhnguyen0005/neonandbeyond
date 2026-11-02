// Tab 4: Tiến độ học tập — mọi chỉ số tính từ dữ liệu đã lưu trên server.
import { api, esc, h, $, pct, fmtDur, fmtDate, safeHtml, statusChip, masteryChip, GROUP, toast, modal } from '../core.js';
import { kindLabel } from './learn.js';

const ST_ORDER = ['not_started', 'in_progress', 'needs_review', 'completed', 'mastered'];
const ST_LABEL = { not_started: 'Chưa học', in_progress: 'Đang học', needs_review: 'Cần ôn tập', completed: 'Đã nắm kiến thức', mastered: 'Thành thạo' };

function weeklyChart(rows) {
  if (!rows.length) return '<p class="small muted">Chưa có dữ liệu theo tuần.</p>';
  const W = 560, H = 180, pad = 28, bw = Math.min(46, (W - pad * 2) / rows.length - 12);
  const maxN = Math.max(...rows.map((r) => r.n));
  const x = (i) => pad + i * ((W - pad * 2) / rows.length) + 6;
  const bars = rows.map((r, i) => {
    const bh = (r.n / maxN) * (H - 60);
    return `<rect x="${x(i)}" y="${H - 30 - bh}" width="${bw}" height="${bh}" rx="3" fill="var(--indigo-soft)" stroke="var(--indigo)" stroke-width="1"></rect>
      <text x="${x(i) + bw / 2}" y="${H - 14}" text-anchor="middle">${r.day.slice(5).split('-').reverse().join('/')}</text>
      <text x="${x(i) + bw / 2}" y="${H - 34 - bh}" text-anchor="middle">${r.n}</text>`;
  }).join('');
  const pts = rows.map((r, i) => `${x(i) + bw / 2},${H - 30 - r.acc * (H - 60)}`).join(' ');
  const dots = rows.map((r, i) => `<circle cx="${x(i) + bw / 2}" cy="${H - 30 - r.acc * (H - 60)}" r="4" fill="var(--jade)"></circle><text x="${x(i) + bw / 2 + 8}" y="${H - 34 - r.acc * (H - 60)}" style="fill:var(--jade);font-weight:600">${Math.round(r.acc * 100)}%</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Số câu và tỷ lệ đúng theo tuần">
    <line class="gridl" x1="${pad}" x2="${W - pad}" y1="${H - 30}" y2="${H - 30}"></line>${bars}
    <polyline points="${pts}" fill="none" stroke="var(--jade)" stroke-width="2"></polyline>${dots}</svg>
    <div class="legend"><span><i style="background:var(--indigo-soft);border-color:var(--indigo)"></i>Số câu đã làm</span><span><i style="background:var(--jade);border-color:var(--jade);border-radius:50%"></i>Tỷ lệ đúng</span></div>`;
}

export async function progressPage(root, ctx) {
  const d = await api.get('/progress');
  const s = d.summary;
  root.append(h(`<div class="head"><div class="stack tight"><span class="eyebrow">Tiến độ học tập</span><h1>Bảng theo dõi của bạn</h1>
    <p class="muted">Số liệu được tính từ chính các câu bạn đã làm, phiên luyện tập và bài thi đã nộp.</p></div><button class="btn" data-goal>Mục tiêu hằng ngày: ${s.daily_goal} câu</button></div>`));
  $('[data-goal]', root).onclick = async () => {
    const f = h(`<div class="field"><label for="goal">Số câu mỗi ngày (5–200)</label><input id="goal" class="input" type="number" min="5" max="200" value="${s.daily_goal}"></div>`);
    if (await modal({ title: 'Mục tiêu hằng ngày', body: f, actions: [{ label: 'Huỷ', value: false }, { label: 'Lưu', value: true, kind: 'primary' }] })) {
      await api.put('/me', { daily_goal: Number($('input', f).value) }); toast('Đã lưu mục tiêu.'); ctx.rerender();
    }
  };
  if (d.empty) {
    root.append(h(`<div class="card empty"><span class="glyph">시작</span><h2>Chưa có dữ liệu học tập</h2>
      <p style="max-width:520px">Bảng này sẽ tự cập nhật khi bạn bắt đầu học. Gợi ý cách bắt đầu:</p>
      <ol style="text-align:left;max-width:520px;margin:0;padding-left:20px"><li>Mở <b>Lộ trình</b>, chọn bài “Nguyên âm” và đọc phần kiến thức.</li><li>Bấm <b>Bắt đầu luyện tập</b> và làm một phiên 10 câu.</li><li>Ghé <b>Ôn tập</b> mỗi ngày để làm lại câu sai và ôn từ đến hạn.</li><li>Thử một đề trong <b>Thi thử</b> khi đã học xong vài chủ đề.</li></ol>
      <a class="btn primary" href="#/">Mở lộ trình</a></div>`));
    return;
  }
  const goalPct = Math.min(100, (s.today_answers / s.daily_goal) * 100);
  root.append(h(`<div class="grid g4">
    <div class="card kpi"><span class="l">Cấp độ hiện tại</span><span class="v" style="font-size:20px">${esc(s.level)}</span><span class="s">${s.topics_completed}/${s.topics_total} chủ đề đã hoàn thành · ${s.topics_mastered} thành thạo</span></div>
    <div class="card kpi"><span class="l">Từ vựng</span><span class="v num">${s.vocab_learned}<span class="muted" style="font-size:15px"> / ${s.vocab_total}</span></span><span class="s">${s.vocab_good} từ ghi nhớ tốt · tỷ lệ ghi nhớ ${pct(s.retention)}</span></div>
    <div class="card kpi"><span class="l">Tỷ lệ trả lời đúng</span><span class="v num">${pct(s.accuracy)}</span><span class="s">${s.answers} câu · ${s.practice_answers} luyện tập, ${s.exam_answers} thi</span></div>
    <div class="card kpi"><span class="l">Điểm thi thử trung bình</span><span class="v num">${s.exam_avg != null ? Math.round(s.exam_avg * 10) / 10 : '—'}</span><span class="s">${s.exam_count} lượt đã nộp</span></div>
    <div class="card kpi"><span class="l">Tổng thời gian học</span><span class="v" style="font-size:20px">${fmtDur(s.time_sec)}</span><span class="s">Hôm nay ${fmtDur(s.today_sec)}</span></div>
    <div class="card kpi"><span class="l">Chuỗi ngày học</span><span class="v num">${s.streak} ngày</span><span class="s">Tính các ngày có làm bài hoặc học ≥ 1 phút</span></div>
    <div class="card kpi" style="grid-column:span 2"><span class="l">Mục tiêu hôm nay</span><span class="v num">${s.today_answers}/${s.daily_goal} câu</span><div class="bar"><i style="width:${goalPct}%"></i></div></div></div>`));

  const counts = Object.fromEntries(ST_ORDER.map((k) => [k, d.map.filter((t) => t.status === k).length]));
  root.append(h(`<div class="card stack"><div class="head"><div><h2>Bản đồ kiến thức</h2><p class="small muted">Mỗi ô là một chủ đề, kèm nhãn trạng thái.</p></div>
    <div class="legend">${ST_ORDER.map((k) => `<span>${statusChip(k, `${ST_LABEL[k]} (${counts[k]})`)}</span>`).join('')}</div></div>
    <div class="kmap">${d.map.map((t) => `<a class="kcell st-${t.status}" href="#/topic/${t.id}"><span class="small faint">${esc(t.level_name)} · ${esc(GROUP[t.grp].label.split(' · ')[0])}</span><span class="n">${esc(t.name)}</span>${statusChip(t.status, t.status_label)}<span class="small faint">${esc(t.mastery_label)}${t.accuracy != null ? ' · ' + pct(t.accuracy) : ''}</span></a>`).join('')}</div></div>`));

  const maxE = Math.max(1, ...d.errors.map((e) => e.n));
  root.append(h(`<div class="grid g2">
    <div class="card stack"><h2>Phân tích lỗi</h2>${d.errors.length ? d.errors.map((e) => `<div class="hbar"><span>${esc(e.label)}</span><div class="bar bad"><i style="width:${(e.n / maxE) * 100}%"></i></div><span class="num small">${e.n}</span></div>`).join('') : '<p class="small muted">Chưa có câu sai nào.</p>'}</div>
    <div class="card stack"><h2>Tiến bộ theo tuần</h2>${weeklyChart(d.weekly)}</div></div>`));

  const tl = (list, empty) => (list.length ? list.map((t) => `<div class="row between"><a href="#/topic/${t.id}">${esc(t.name)}</a><span class="small">${masteryChip(t.mastery, t.mastery_label)} <b class="num">${pct(t.accuracy)}</b></span></div>`).join('') : `<p class="small muted">${empty}</p>`);
  root.append(h(`<div class="grid g3">
    <div class="card stack"><h2>Chủ đề mạnh</h2>${tl(d.strong, 'Cần làm ≥ 5 câu và đúng ≥ 80% ở một chủ đề.')}</div>
    <div class="card stack"><h2>Chủ đề yếu</h2>${tl(d.weak, 'Không có chủ đề nào dưới 70% đúng.')}</div>
    <div class="card stack"><h2>Nội dung cần ôn tiếp</h2><div class="row between"><span>Từ đến hạn ôn</span><b>${d.next_review.due_vocab}</b></div><div class="row between"><span>Câu sai cần làm lại</span><b>${d.next_review.due_mistakes}</b></div>
      ${d.next_review.topics.map((t) => `<a href="#/topic/${t.id}" class="small">${esc(t.name)}</a>`).join('')}<a class="btn sm" href="#/review">Ôn ngay</a></div></div>`));

  root.append(h(`<div class="card stack"><h2>Những lỗi thường gặp</h2>${d.common.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Câu hỏi</th><th>Chủ đề</th><th class="num">Số lần sai</th></tr></thead><tbody>${d.common.map((c) => `<tr><td>${safeHtml(c.prompt)}</td><td>${esc(c.topic)}</td><td class="num">${c.wrong_count}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Chưa có.</p>'}</div>`));

  root.append(h(`<div class="card stack"><h2>Lịch sử thi thử</h2>${d.attempts.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Đề</th><th>Ngày</th><th class="num">Điểm</th><th class="num">So với lần trước</th><th class="num">Thời gian</th><th></th></tr></thead><tbody>
    ${d.attempts.map((a) => `<tr><td>${esc(a.title)}</td><td>${fmtDate(a.started_at)}</td><td class="num">${a.score ?? (a.status === 'abandoned' ? 'Đã huỷ' : '—')}${a.pass_score != null && a.score != null ? (a.score >= a.pass_score ? ' ✓' : '') : ''}</td>
    <td class="num">${a.delta == null ? '—' : (a.delta >= 0 ? '+' : '') + a.delta}</td><td class="num">${fmtDur(a.duration_sec)}</td><td>${a.score != null ? `<a href="#/attempt/${a.id}">Xem</a>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Chưa có lượt thi nào.</p>'}</div>`));

  root.append(h(`<div class="grid g2"><div class="card stack"><h2>Phiên luyện tập gần đây</h2>${d.sessions.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Phiên</th><th>Ngày</th><th class="num">Kết quả</th><th class="num">Thời gian</th></tr></thead><tbody>
    ${d.sessions.map((x) => `<tr><td>${esc(x.topic || kindLabel[x.kind] || x.kind)}<div class="small faint">${x.status === 'active' ? '<a href="#/session/' + x.id + '">Đang dở — tiếp tục</a>' : x.status === 'abandoned' ? 'Đã bỏ dở' : ''}</div></td><td>${fmtDate(x.started_at)}</td><td class="num">${x.correct}/${x.answered}</td><td class="num">${fmtDur(x.duration_sec)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Chưa có.</p>'}</div>
    <div class="card stack"><h2>Bài đã hoàn thành</h2>${d.lessons_done.length ? d.lessons_done.map((l) => `<div class="row between small"><span>${esc(l.name)}</span><span class="faint">${fmtDate(l.completed_at, false)}</span></div>`).join('') : '<p class="small muted">Chưa có.</p>'}
    <h2 style="margin-top:12px">Thành tích</h2>${d.achievements.length ? d.achievements.map((a) => `<div class="row between small"><span>🏅 ${esc(a.label)}</span><span class="faint">${fmtDate(a.earned_at, false)}</span></div>`).join('') : '<p class="small muted">Hoàn thành phiên luyện tập đầu tiên để nhận thành tích.</p>'}</div></div>`));
  if (d.writings.length) root.append(h(`<div class="card stack"><h2>Bài viết & nhận xét</h2>${d.writings.map((w) => `<div class="stack tight" style="border-top:1px solid var(--line);padding-top:8px"><span class="small muted">${esc(w.prompt)}</span><span class="ko">${esc(w.text)}</span><span class="small">Chấm tự động ${Math.round(w.auto_score * 100)}% tiêu chí · ${fmtDate(w.created_at)}</span>${w.feedback ? `<div class="callout info small"><b>Giáo viên:</b> <span class="ink">${esc(w.feedback)}</span></div>` : '<span class="small faint">Chưa có nhận xét của giáo viên.</span>'}</div>`).join('')}</div>`));
}
