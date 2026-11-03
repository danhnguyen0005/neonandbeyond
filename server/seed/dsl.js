// Ký hiệu gọn để soạn câu hỏi trong các file nội dung.
// mc(đề, [đúng, sai...], giải thích, {d, tag, fb:{phươngÁnSai: lý do}, skill})
const mc = (prompt, o, expl, x = {}) => ({ type: 'mcq', prompt, o, expl, ...x });
const fill = (prompt, acc, expl, x = {}) => ({ type: 'fill', prompt, acc, expl, d: 2, ...x });
const conj = (prompt, acc, expl, x = {}) => ({ type: 'conjugate', prompt, acc, expl, d: 2, tag: 'conjugation', ...x });
const tr = (prompt, acc, expl, x = {}) => ({ type: 'translate', prompt, acc, expl, d: 3, ...x });
const ord = (prompt, words, expl, x = {}) => ({ type: 'order', prompt, words, expl, d: 2, tag: 'word_order', ...x });
const err = (parts, wrong, expl, x = {}) => ({ type: 'error', prompt: 'Tìm phần sai trong câu.', parts, wrong, expl, d: 2, ...x });
const ls = (say, o, expl, x = {}) => ({ type: 'listen', prompt: x.prompt || 'Nghe và chọn nghĩa đúng.', say, o, expl, tag: 'listening', skill: 'listening', ...x });
const wr = (prompt, rubric, reference, expl, x = {}) => ({ type: 'write', prompt, rubric, reference, expl, d: 2, tag: 'writing', ...x });

// Patchim của âm tiết cuối (0 = không có; 8 = ㄹ)
const batchim = (word) => { const c = String(word).trim().slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; };
const hasB = (w) => batchim(w) > 0;
// Ghép tiểu từ đúng theo patchim
const P = {
  eun: (w) => (hasB(w) ? '은' : '는'), i: (w) => (hasB(w) ? '이' : '가'), eul: (w) => (hasB(w) ? '을' : '를'),
  wa: (w) => (hasB(w) ? '과' : '와'), ro: (w) => (hasB(w) && batchim(w) !== 8 ? '으로' : '로'), ieyo: (w) => (hasB(w) ? '이에요' : '예요'),
};

module.exports = { mc, fill, conj, tr, ord, err, ls, wr, batchim, hasB, P };
