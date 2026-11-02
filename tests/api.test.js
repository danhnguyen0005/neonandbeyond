// Kiểm thử API đầu-cuối trên một DB tạm. Chạy: npm test
const os = require('os'), path = require('path'), fs = require('fs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hanngu-'));
process.env.DB_FILE = path.join(tmp, 'test.db');
process.env.ADMIN_PASSWORD = 'Admin@12345';
const app = require('../server/index');
const { db } = require('../server/db');

let pass = 0, fail = 0;
const ok = (cond, name, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗', name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); } };
function client(base) {
  let cookie = '';
  const call = async (method, url, body, raw) => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'hanngu', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
    const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    if (raw) return res;
    let data = null; try { data = await res.json(); } catch {}
    return { status: res.status, data };
  };
  return { get: (u) => call('GET', u), post: (u, b) => call('POST', u, b || {}), put: (u, b) => call('PUT', u, b || {}), del: (u) => call('DELETE', u), raw: (m, u, b) => call(m, u, b, true) };
}
// Lấy đáp án đúng trực tiếp từ DB (mô phỏng người học trả lời đúng)
function correctResponse(qid) {
  const q = require('../server/engine').loadQuestion(qid);
  if (['mcq', 'listen', 'error'].includes(q.type)) return { option: q.options.find((o) => o.is_correct).id };
  if (['fill', 'conjugate', 'translate'].includes(q.type)) return { text: q.answer.accepted[0] };
  if (q.type === 'order') return { words: q.answer.words };
  if (q.type === 'write') return { text: q.answer.reference };
}
function wrongResponse(qid) {
  const q = require('../server/engine').loadQuestion(qid);
  if (['mcq', 'listen', 'error'].includes(q.type)) return { option: q.options.find((o) => !o.is_correct).id };
  if (q.type === 'order') return { words: [...q.answer.words].reverse() };
  return { text: 'zzz' };
}
const topicId = (code) => db.prepare('SELECT id FROM topics WHERE code=?').get(code).id;

(async () => {
  const srv = app.listen(0); const base = `http://127.0.0.1:${srv.address().port}`;
  const A = client(base), B = client(base), ADM = client(base), ANON = client(base);

  console.log('• Xác thực & phân quyền');
  ok((await ANON.get('/api/overview')).status === 401, 'chưa đăng nhập → 401');
  const noCsrf = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  ok(noCsrf.status === 403, 'thiếu header chống CSRF → 403');
  ok((await A.post('/api/auth/register', { username: 'ab', password: '12345678' })).status === 400, 'tên đăng nhập quá ngắn bị từ chối');
  ok((await A.post('/api/auth/register', { username: 'hocvien_a', display_name: 'An', password: 'short' })).status === 400, 'mật khẩu ngắn bị từ chối');
  ok((await A.post('/api/auth/register', { username: 'hocvien_a', display_name: 'An', password: 'matkhau123' })).status === 200, 'đăng ký A');
  ok((await B.post('/api/auth/register', { username: 'hocvien_b', display_name: 'Bình', password: 'matkhau123' })).status === 200, 'đăng ký B');
  ok((await B.post('/api/auth/register', { username: 'HOCVIEN_A', password: 'matkhau123' })).status === 409, 'trùng tên đăng nhập (không phân biệt hoa thường)');
  ok((await ADM.post('/api/auth/login', { username: 'admin', password: 'Admin@12345' })).status === 200, 'admin đăng nhập');
  ok((await A.get('/api/admin/users')).status === 403, 'học viên gọi API quản trị → 403');
  ok((await A.raw('GET', '/admin')).status === 403, 'học viên mở trang /admin → 403');
  ok((await ADM.raw('GET', '/admin')).status === 200, 'admin mở trang /admin');

  console.log('• Lộ trình & trạng thái');
  let ov = (await A.get('/api/overview')).data;
  ok(ov.levels.length === 3 && ov.levels.every((l) => l.topics.every((t) => t.status === 'not_started')), 'người mới: mọi chủ đề “Chưa bắt đầu”');
  ok(ov.next && ov.next.code === 'H-VOW', 'đề xuất bài đầu tiên là Nguyên âm', ov.next);
  const tTopic = topicId('G-TOPIC');
  await A.post(`/api/topics/${tTopic}/viewed`);
  const td = (await A.get(`/api/topics/${tTopic}`)).data;
  ok(td.status.status === 'in_progress' && td.lessons.length === 1 && td.grammar.length === 1, 'xem lý thuyết → “Đang học”');

  console.log('• Phiên luyện tập: xáo trộn, không trùng, chấm điểm, lưu tiến độ');
  const positions = [];
  let firstOrder = null, sameOrder = 0;
  const tVocab = topicId('V-SCHOOL');
  for (let k = 0; k < 6; k++) {
    const s = (await A.post('/api/sessions', { kind: 'topic', topic_id: k % 2 ? tTopic : tVocab, count: 10, fresh: true })).data;
    const items = JSON.parse(db.prepare('SELECT items FROM practice_sessions WHERE id=?').get(s.id).items);
    ok(new Set(items.map((i) => i.q)).size === items.length, 'không lặp câu trong một phiên');
    const ord = items.map((i) => i.q).join(',');
    if (k % 2) { if (firstOrder === null) firstOrder = ord; else if (ord === firstOrder) sameOrder++; }
    for (const it of items) {
      const q = require('../server/engine').loadQuestion(it.q);
      if (q.options.length > 2 && !q.data.fixed_order) positions.push(it.o.findIndex((id) => q.options.find((o) => o.id === id).is_correct));
    }
  }
  ok(sameOrder === 0, 'thứ tự câu hỏi khác nhau giữa các phiên');
  ok(positions.length >= 20 && new Set(positions).size >= 3, 'đáp án đúng không cố định một vị trí', positions);
  let run3 = 0; for (let i = 2; i < positions.length; i++) if (positions[i] === positions[i - 1] && positions[i] === positions[i - 2]) run3++;
  ok(run3 <= 3, 'hạn chế đáp án đúng trùng vị trí 3 câu liền', run3);

  // Phiên thật: trả lời 7 đúng, 3 sai, rời giữa chừng rồi quay lại
  let s = (await A.post('/api/sessions', { kind: 'topic', topic_id: tTopic, count: 10, fresh: true })).data;
  const sid = s.id;
  let wrongQ = [];
  for (let i = 0; i < 4; i++) {
    const qid = s.question.id; const right = i !== 1;
    const r = (await A.post(`/api/sessions/${sid}/answer`, { question_id: qid, response: right ? correctResponse(qid) : wrongResponse(qid) })).data;
    ok(r.result.correct === right, `chấm câu ${i + 1} (${right ? 'đúng' : 'sai'})`, r.result);
    ok(r.result.why && r.result.correct_answer, 'có giải thích và đáp án đúng');
    if (!right) wrongQ.push(qid);
    s = r.state;
  }
  ok((await A.post(`/api/sessions/${sid}/answer`, { question_id: 999999, response: {} })).status === 409, 'trả lời sai câu so với tiến độ → 409');
  const resumed = (await A.post('/api/sessions', { kind: 'topic', topic_id: tTopic })).data;
  ok(resumed.id === sid && resumed.cursor === 4, 'quay lại chủ đề → khôi phục phiên đang dở', { id: resumed.id, cursor: resumed.cursor });
  s = resumed;
  for (let i = 4; i < 10; i++) {
    const qid = s.question.id; const right = i % 4 !== 3;
    const r = (await A.post(`/api/sessions/${sid}/answer`, { question_id: qid, response: right ? correctResponse(qid) : wrongResponse(qid) })).data;
    if (!right) wrongQ.push(qid);
    s = r.state;
  }
  ok(s.status === 'completed' && s.summary && s.summary.wrong_ids.length === wrongQ.length, 'kết thúc phiên có tổng kết và danh sách câu sai', s.summary && s.summary.wrong_ids);
  ok(s.answered === 10 && s.correct === 10 - wrongQ.length, 'đếm đúng/sai chính xác');
  const tp = db.prepare('SELECT * FROM topic_progress WHERE topic_id=? AND user_id=(SELECT id FROM users WHERE username=?)').get(tTopic, 'hocvien_a');
  ok(tp.completed_at && tp.sessions_count === 1, 'hoàn thành bài được lưu');
  const st1 = (await A.get(`/api/topics/${tTopic}`)).data.status;
  ok(st1.completed_at && st1.mastery.level !== 'mastered', '“hoàn thành” khác “thành thạo”', st1.mastery.level);

  console.log('• Câu sai: ghi nhận, không xoá khi đúng một lần');
  let rv = (await A.get('/api/review')).data;
  ok(rv.mistakes.length === wrongQ.length && rv.mistakes.every((m) => m.state === 'open'), 'câu sai vào danh sách cần ôn', rv.mistakes.length);
  const mk = (await A.post('/api/sessions', { kind: 'mistakes' })).data;
  ok(mk.total === wrongQ.length, 'phiên ôn câu sai');
  let ms = mk;
  while (ms.status === 'active') { const qid = ms.question.id; ms = (await A.post(`/api/sessions/${mk.id}/answer`, { question_id: qid, response: correctResponse(qid) })).data.state; }
  rv = (await A.get('/api/review?state=tracking')).data;
  ok(rv.mistakes.length === wrongQ.length && rv.mistakes.every((m) => m.state === 'fixing' && !m.due), 'đúng một lần → “đang sửa”, hẹn kiểm tra lại, chưa xoá', rv.mistakes.map((m) => m.state));
  const det = (await A.get(`/api/mistakes/${wrongQ[0]}`)).data;
  ok(det.explanation !== undefined && det.history.length >= 2, 'xem chi tiết câu sai kèm lịch sử');
  // giả lập đã qua hạn kiểm tra rồi trả lời đúng lần 2 → khắc phục
  db.prepare("UPDATE mistakes SET next_check_at=datetime('now','-1 minute') WHERE question_id=?").run(wrongQ[0]);
  const rt = (await A.post('/api/sessions', { kind: 'retry', question_ids: [wrongQ[0]] })).data;
  await A.post(`/api/sessions/${rt.id}/answer`, { question_id: wrongQ[0], response: correctResponse(wrongQ[0]) });
  ok(db.prepare('SELECT state FROM mistakes WHERE question_id=?').get(wrongQ[0]).state === 'resolved', 'đúng lại sau thời hạn → đã khắc phục (vẫn lưu lịch sử)');
  ok((await A.post(`/api/mistakes/${wrongQ[1]}/understood`)).data.ok === true, 'đánh dấu đã hiểu');

  console.log('• Chấm điểm toàn ngân hàng (mọi dạng câu)');
  const all = db.prepare("SELECT id,type FROM questions WHERE status='published'").all();
  const byType = {};
  const E = require('../server/engine');
  for (const q of all) {
    const Q = E.loadQuestion(q.id);
    const g = E.grade(Q, correctResponse(q.id)); const w = E.grade(Q, wrongResponse(q.id));
    byType[q.type] = byType[q.type] || { n: 0, bad: [] }; byType[q.type].n++;
    if (!g.correct || w.correct) byType[q.type].bad.push(Q.code);
    if (['mcq', 'listen', 'error'].includes(q.type) && Q.options.filter((o) => o.is_correct).length !== 1) byType[q.type].bad.push(Q.code + ':options');
  }
  for (const [t, v] of Object.entries(byType)) ok(v.bad.length === 0, `dạng ${t}: ${v.n} câu chấm đúng`, v.bad.slice(0, 5));
  // dung sai khoảng trắng / dấu câu khi tự nhập
  const tq = E.loadQuestion(db.prepare("SELECT id FROM questions WHERE type='translate' AND code LIKE 'G-LOC-%'").get().id);
  ok(E.grade(tq, { text: '  식당에서  밥을 먹어요!! ' }).correct, 'tự nhập: bỏ qua khoảng trắng thừa và dấu câu cuối');
  ok(E.grade(tq, { text: '식당에 밥을 먹어요' }).choice_feedback, 'tự nhập sai phổ biến → có giải thích lỗi cụ thể');
  const wq = E.loadQuestion(db.prepare("SELECT id FROM questions WHERE type='write' LIMIT 1").get().id);
  const wg = E.grade(wq, { text: 'xin chao toi la Mai' });
  ok(!wg.correct && wg.rubric.some((r) => !r.ok && r.tip), 'bài viết không đạt → chỉ ra tiêu chí thiếu');

  console.log('• Thành thạo cần ≥2 phiên đạt ngưỡng');
  const tObj = topicId('G-OBJ');
  for (let k = 0; k < 2; k++) {
    let ss = (await A.post('/api/sessions', { kind: 'topic', topic_id: tObj, count: 10, fresh: true })).data;
    while (ss.status === 'active') { const qid = ss.question.id; ss = (await A.post(`/api/sessions/${ss.id}/answer`, { question_id: qid, response: correctResponse(qid) })).data.state; }
    const lvl = E.computeMastery(db.prepare("SELECT id FROM users WHERE username='hocvien_a'").get().id, tObj).level;
    ok(k === 0 ? lvl === 'basic' : lvl === 'mastered', `sau phiên ${k + 1}: ${lvl}`);
  }
  ok((await A.get(`/api/topics/${tObj}`)).data.status.status === 'mastered', 'trạng thái chủ đề “Đã thành thạo”');

  console.log('• Ôn tập tổng hợp & theo mục tiêu');
  ok((await B.post('/api/sessions', { kind: 'mixed' })).status === 422, 'người mới chưa học gì → không tạo phiên tổng hợp mặc định');
  ok((await B.post('/api/sessions', { kind: 'challenge', count: 8 })).status === 200, 'chế độ thử thách cho phép kiến thức chưa học');
  const mx = (await A.post('/api/sessions', { kind: 'mixed', minutes: 5 })).data;
  const mxTopics = JSON.parse(db.prepare('SELECT items FROM practice_sessions WHERE id=?').get(mx.id).items).map((i) => E.loadQuestion(i.q).topic_id);
  ok(mx.total === 8 && mxTopics.every((t) => [tTopic, tObj].includes(t)), 'ôn 5 phút: 8 câu, chỉ từ chủ đề đã học', mxTopics);
  ok((await A.post('/api/sessions', { kind: 'errors' })).status === 200, 'ôn lỗi thường gặp');
  ok((await A.post('/api/sessions', { kind: 'similar', question_id: wrongQ[0] })).status === 200, 'luyện câu tương tự');
  ok((await B.post('/api/sessions', { kind: 'retry', question_ids: [wrongQ[0]] })).status === 422, 'không làm lại câu mình chưa từng làm');
  ok((await B.get(`/api/sessions/${sid}`)).status === 404, 'B không xem được phiên của A');

  console.log('• Từ vựng & SRS');
  const vt = topicId('V-INTRO');
  await A.post(`/api/topics/${vt}/viewed`);
  let deck = (await A.get(`/api/vocab/deck?bucket=new`)).data;
  ok(deck.length === 20, 'từ mới trong chủ đề đã mở', deck.length);
  await A.post(`/api/vocab/${deck[0].id}/review`, { known: true });
  await A.post(`/api/vocab/${deck[1].id}/review`, { known: false });
  ok(db.prepare('SELECT box FROM srs_records WHERE vocab_id=?').get(deck[0].id).box === 1, 'nhớ → lên hộp');
  ok((await A.get('/api/vocab/deck?bucket=due')).data.some((v) => v.id === deck[1].id), 'chưa nhớ → đến hạn ôn ngay');

  console.log('• Thi thử');
  let ex = (await A.get('/api/exams')).data;
  ok(ex.official.length === 3 && ex.official.every((e) => e.question_count > 0), 'có 3 đề chính thức');
  const e1 = ex.official[0];
  const unv = db.prepare("SELECT id FROM questions WHERE verified=0").all().map((x) => x.id);
  ok(ex.official.every((e) => !JSON.parse(db.prepare('SELECT question_ids FROM mock_exams WHERE id=?').get(e.id).question_ids).some((id) => unv.includes(id))), 'đề chính thức không chứa câu chưa xác minh');
  let at = (await A.post(`/api/exams/${e1.id}/start`)).data;
  ok(at.status === 'in_progress' && at.questions.length === e1.question_count, 'bắt đầu thi');
  ok(at.questions.every((q) => q.options === undefined || q.options.every((o) => o.is_correct === undefined)), 'đề thi không lộ đáp án');
  const again = (await A.post(`/api/exams/${e1.id}/start`)).data;
  ok(again.id === at.id, 'bắt đầu lại khi còn giờ → khôi phục cùng lượt');
  const half = Math.floor(at.questions.length / 2);
  for (let i = 0; i < at.questions.length - 2; i++) {
    const q = at.questions[i];
    await A.put(`/api/attempts/${at.id}/answer`, { question_id: q.id, response: i < half ? correctResponse(q.id) : wrongResponse(q.id) });
  }
  await A.put(`/api/attempts/${at.id}/flag`, { question_id: at.questions[0].id, flagged: true });
  const mid = (await A.get(`/api/attempts/${at.id}`)).data;
  ok(Object.keys(mid.answers).length === at.questions.length - 2 && mid.flags.length === 1, 'lưu câu trả lời và đánh dấu');
  ok((await B.get(`/api/attempts/${at.id}`)).status === 404, 'B không xem được lượt thi của A');
  const res1 = (await A.post(`/api/attempts/${at.id}/submit`)).data;
  ok(res1.status === 'submitted' && res1.correct === half && res1.total === at.questions.length, 'chấm điểm thi đúng', { c: res1.correct, half });
  ok(Math.abs(res1.score - Math.round(half / at.questions.length * 1000) / 10) < 0.01 && res1.by_skill && res1.questions.length === at.questions.length, 'điểm, kỹ năng, chi tiết câu');
  ok((await A.put(`/api/attempts/${at.id}/answer`, { question_id: at.questions[0].id, response: {} })).status === 409, 'không sửa bài sau khi nộp');
  // hết giờ → tự nộp
  const at2 = (await A.post(`/api/exams/${e1.id}/start`)).data;
  ok(at2.id !== at.id, 'lượt mới sau khi nộp');
  await A.put(`/api/attempts/${at2.id}/answer`, { question_id: at2.questions[0].id, response: correctResponse(at2.questions[0].id) });
  db.prepare("UPDATE exam_attempts SET deadline_at=datetime('now','-5 minutes') WHERE id=?").run(at2.id);
  ok((await A.put(`/api/attempts/${at2.id}/answer`, { question_id: at2.questions[1].id, response: {} })).status === 409, 'hết giờ → từ chối lưu');
  const r2 = (await A.get(`/api/attempts/${at2.id}`)).data;
  ok(r2.status === 'auto_submitted' && r2.correct === 1, 'hết giờ → tự động nộp với câu đã lưu', { st: r2.status, c: r2.correct });
  const at3 = (await A.post(`/api/exams/${e1.id}/start`)).data;
  ok((await A.post(`/api/attempts/${at3.id}/abandon`)).data.ok, 'huỷ lượt thi');
  ok(db.prepare('SELECT score FROM exam_attempts WHERE id=?').get(at3.id).score === null, 'lượt huỷ không bị tính điểm');

  console.log('• Tạo đề ngẫu nhiên');
  const big = await A.post('/api/exams/generate', { topic_ids: [tTopic], count: 60 });
  ok(big.status === 422 && big.data.available > 0, 'không đủ câu → báo rõ số câu có thể tạo', big.data);
  const sc1 = db.prepare("SELECT id FROM levels WHERE code='sc1'").get().id;
  const g1 = (await A.post('/api/exams/generate', { level_id: sc1, count: 30, difficulty: 'mixed' })).data;
  const ids1 = JSON.parse(db.prepare('SELECT question_ids FROM mock_exams WHERE id=?').get(g1.id).question_ids);
  const perTopic = {}; ids1.forEach((id) => { const t = E.loadQuestion(id).topic_id; perTopic[t] = (perTopic[t] || 0) + 1; });
  ok(ids1.length === 30 && new Set(ids1).size === 30, 'đề 30 câu, không trùng');
  ok(Math.max(...Object.values(perTopic)) <= 3, 'không chủ đề nào chiếm quá nhiều câu', perTopic);
  ok(!ids1.some((id) => unv.includes(id)), 'đề tự tạo không chứa câu chưa xác minh');
  const g2 = (await A.post('/api/exams/generate', { level_id: sc1, count: 30, difficulty: 'mixed' })).data;
  const ids2 = JSON.parse(db.prepare('SELECT question_ids FROM mock_exams WHERE id=?').get(g2.id).question_ids);
  ok(ids1.filter((x) => ids2.includes(x)).length < 15, 'hai đề tạo liên tiếp khác nhau');
  ok((await B.get(`/api/exams/${g1.id}`)).status === 404, 'B không mở được đề tự tạo của A');

  console.log('• Quản trị học liệu (luồng 6)');
  const lv = (await ADM.get('/api/admin/meta')).data.levels.find((l) => l.code === 'sc2');
  const nt = await ADM.post('/api/admin/topics', { code: 'G-TEST', level_id: lv.id, grp: 'grammar', name: 'Chủ đề kiểm thử', description: 'Tạo bởi test', sort: 99 });
  ok(nt.status === 200, 'tạo chủ đề');
  ok((await ADM.post('/api/admin/topics', { code: 'G-TEST', level_id: lv.id, grp: 'grammar', name: 'x' })).status === 400, 'trùng mã chủ đề bị từ chối');
  ok((await ADM.post('/api/admin/lessons', { topic_id: nt.data.id, title: 'Bài kiểm thử', goal: 'Mục tiêu', body: { explain: 'Giải thích', examples: [['가요', 'đi']] } })).status === 200, 'tạo bài học');
  const qBody = { topic_id: nt.data.id, type: 'mcq', prompt: 'Câu kiểm thử: chọn 가요', skill: 'grammar', error_tag: 'grammar', difficulty: 1, explanation: 'Vì …',
    options: [{ text: '가요', is_correct: true }, { text: '가아요' }], status: 'published' };
  ok((await ADM.post('/api/admin/questions', qBody)).status === 400, 'chưa xác minh → không cho xuất bản');
  ok((await ADM.post('/api/admin/questions', { ...qBody, options: [{ text: 'a', is_correct: true }, { text: 'b', is_correct: true }], status: 'draft' })).status === 400, '2 đáp án đúng → từ chối');
  const nq = await ADM.post('/api/admin/questions', { ...qBody, status: 'review' });
  ok(nq.status === 200, 'tạo câu hỏi (chờ xác minh)');
  ok((await ADM.post('/api/admin/questions', { ...qBody, status: 'review' })).status === 409, 'phát hiện câu trùng');
  ok((await ADM.post(`/api/admin/questions/${nq.data.id}/status`, { status: 'published' })).status === 400, 'xuất bản trước khi xác minh → từ chối');
  await ADM.post(`/api/admin/questions/${nq.data.id}/verify`, { verified: true });
  ok((await ADM.post(`/api/admin/questions/${nq.data.id}/status`, { status: 'published' })).status === 200, 'xác minh → xuất bản');
  const lsess = (await A.post('/api/sessions', { kind: 'topic', topic_id: nt.data.id })).data;
  ok(lsess.question && lsess.question.id === nq.data.id, 'người học luyện được câu vừa xuất bản');
  const ed = (await ADM.put(`/api/admin/questions/${nq.data.id}`, { options: [{ text: '가요', is_correct: false }, { text: '가아요', is_correct: true }] })).data;
  ok(ed.verified === 0 && ed.status === 'review', 'đổi đáp án → phải xác minh lại');
  const pubIds = db.prepare("SELECT id FROM questions WHERE code LIKE 'G-TOPIC-%' LIMIT 1").get().id;
  const del = (await ADM.del(`/api/admin/questions/${pubIds}`)).data;
  ok(del.archived && del.usage.answers >= 0, 'xoá câu đã dùng → lưu trữ, không xoá cứng', del);
  ok(db.prepare('SELECT COUNT(*) n FROM user_answers WHERE question_id=?').get(pubIds).n >= 0 && db.prepare('SELECT archived FROM questions WHERE id=?').get(pubIds).archived === 1, 'lịch sử học tập được bảo toàn');
  ok((await ADM.get('/api/admin/questions?q=가요&type=mcq')).data.total >= 1, 'tìm kiếm & lọc câu hỏi');
  ok(Array.isArray((await ADM.get('/api/admin/questions/duplicates')).data), 'quét trùng lặp');

  console.log('• Quản trị đề thi');
  const ne = (await ADM.post('/api/admin/exams', { title: 'Đề kiểm thử', level_id: sc1, matrix: [{ topic_id: tTopic, count: 5 }, { topic_id: tObj, count: 5 }], duration_min: 10, pass_score: 50, show_answers: true })).data;
  const gen = (await ADM.post(`/api/admin/exams/${ne.id}/generate`)).data;
  ok(gen.count === 10, 'sinh câu theo ma trận');
  ok((await ADM.post(`/api/admin/exams/${ne.id}/status`, { status: 'published' })).status === 200, 'xuất bản đề');
  ok((await A.get('/api/exams')).data.official.some((e) => e.id === ne.id), 'người học thấy đề mới');
  await ADM.put(`/api/admin/exams/${ne.id}`, { open_at: new Date(Date.now() + 86400000).toISOString() });
  ok(!(await A.get('/api/exams')).data.official.some((e) => e.id === ne.id), 'đề chưa đến giờ mở thì ẩn');
  ok((await ADM.get(`/api/admin/exams/${e1.id}/stats`)).data.attempts.length >= 2, 'thống kê theo đề');

  console.log('• Báo cáo & người dùng (luồng 7)');
  const rep = (await ADM.get('/api/admin/reports')).data;
  ok(rep.users.accounts === 2 && rep.users.active_learners === 1 && rep.users.visited === 2, 'phân biệt đăng ký / truy cập / thực sự học', rep.users);
  ok(rep.activity.answers === db.prepare("SELECT COUNT(*) n FROM user_answers").get().n, 'số câu trả lời khớp dữ liệu');
  const csv = await ADM.raw('GET', '/api/admin/reports/export?type=topics');
  const buf = Buffer.from(await csv.arrayBuffer());
  ok(csv.status === 200 && buf[0] === 0xef && buf[1] === 0xbb && buf.toString('utf8').includes('Chủ đề'), 'xuất CSV (UTF-8 có BOM cho Excel)');
  const users = (await ADM.get('/api/admin/users?q=hocvien')).data;
  ok(users.length === 2, 'tìm người dùng');
  const ud = (await ADM.get(`/api/admin/users/${users.find((u) => u.username === 'hocvien_a').id}`)).data;
  ok(ud.attempts.length >= 2 && ud.map.length > 20, 'xem tiến độ & lịch sử thi của học viên');
  const bId = users.find((u) => u.username === 'hocvien_b').id;
  await ADM.put(`/api/admin/users/${bId}/status`, { status: 'locked' });
  ok((await B.get('/api/overview')).status === 401, 'khoá tài khoản → mất phiên đăng nhập');
  ok((await B.post('/api/auth/login', { username: 'hocvien_b', password: 'matkhau123' })).status === 403, 'tài khoản bị khoá không đăng nhập được');
  const admId = db.prepare("SELECT id FROM users WHERE username='admin'").get().id;
  ok((await ADM.put(`/api/admin/users/${admId}/status`, { status: 'locked' })).status === 400, 'admin không tự khoá mình');
  ok((await ADM.get('/api/admin/logs')).data.length > 5, 'nhật ký thao tác quản trị');
  ok((await ADM.put('/api/admin/settings', { mastery: { mastered_min_accuracy: 1.5 } })).status === 400, 'cài đặt sai giá trị bị từ chối');
  ok((await ADM.put('/api/admin/settings', { mastery: { mastered_min_sessions: 3 } })).status === 200, 'đổi ngưỡng thành thạo');
  ok(E.computeMastery(db.prepare("SELECT id FROM users WHERE username='hocvien_a'").get().id, tObj).level === 'basic', 'ngưỡng mới áp dụng ngay (cần 3 phiên)');

  console.log('• Dashboard người học');
  const dash = (await A.get('/api/progress')).data;
  const nAns = db.prepare("SELECT COUNT(*) n FROM user_answers WHERE user_id=(SELECT id FROM users WHERE username='hocvien_a')").get().n;
  ok(dash.summary.answers === nAns && dash.summary.topics_completed >= 2, 'số liệu dashboard tính từ dữ liệu thật', dash.summary);
  ok(dash.errors.length > 0 && dash.attempts.length >= 2 && dash.map.length > 20, 'phân tích lỗi, lịch sử thi, bản đồ kiến thức');
  ok(dash.attempts.some((a) => a.delta !== null), 'so sánh tiến bộ giữa các lần thi');
  ok((await (async () => { const C = client(base); await C.post('/api/auth/register', { username: 'moi_tinh', password: 'matkhau123' }); return (await C.get('/api/progress')).data.empty; })()) === true, 'người mới: dashboard trạng thái rỗng');

  srv.close();
  console.log(`\n${pass} kiểm tra đạt, ${fail} lỗi`);
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
