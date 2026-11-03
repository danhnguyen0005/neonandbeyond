// Bộ chia động từ / tính từ tiếng Hàn (dùng để sinh câu hỏi chia động từ).
// Đã đối chiếu với bảng chia kiểm tra tay trong tests/korean.test.js.
const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
const V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
const T = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const dec = (ch) => { const c = ch.charCodeAt(0) - 0xac00; return { l: L[Math.floor(c / 588)], v: V[Math.floor((c % 588) / 28)], t: T[c % 28] }; };
const com = ({ l, v, t = '' }) => String.fromCharCode(0xac00 + (L.indexOf(l) * 21 + V.indexOf(v)) * 28 + T.indexOf(t));
const last = (s) => dec(s.slice(-1));
const setLast = (s, x) => s.slice(0, -1) + com({ ...last(s), ...x });
const addT = (s, t) => setLast(s, { t }); // gắn patchim vào âm tiết cuối

const IRR_B = new Set(['덥다', '춥다', '맵다', '쉽다', '어렵다', '가깝다', '귀엽다', '무겁다', '가볍다', '반갑다', '고맙다', '즐겁다', '아름답다', '뜨겁다', '차갑다', '돕다', '곱다', '시끄럽다', '더럽다', '부럽다', '외롭다', '새롭다', '싱겁다', '두껍다', '눕다', '굽다']);
const IRR_D = new Set(['듣다', '걷다', '묻다', '싣다', '깨닫다']);
const IRR_R = new Set(['모르다', '부르다', '빠르다', '다르다', '고르다', '자르다', '오르다', '마르다', '서두르다', '흐르다']);
const IRR_S = new Set(['짓다', '낫다', '붓다', '젓다']);

function info(dict) {
  const stem = dict.slice(0, -1);
  const lt = last(stem);
  let type = 'reg';
  if (IRR_B.has(dict)) type = 'b';
  else if (IRR_D.has(dict)) type = 'd';
  else if (IRR_R.has(dict)) type = 'r';
  else if (IRR_S.has(dict)) type = 's';
  else if (lt.t === 'ㄹ') type = 'l';
  else if (!lt.t && lt.v === 'ㅡ' && !stem.endsWith('하')) type = 'eu';
  return { stem, lt, type, ha: stem.endsWith('하') };
}
// nguyên âm "dương" (ㅏ, ㅗ, ㅑ) → 아, còn lại → 어
const bright = (v) => ['ㅏ', 'ㅗ', 'ㅑ'].includes(v);

// Dạng nối -아/어 (gốc của -아/어요, -았/었-, -아/어서...)
function aeo(dict) {
  const { stem, lt, type, ha } = info(dict);
  if (ha) return stem.slice(0, -1) + '해';
  if (type === 'b') return stem.slice(0, -1) + com({ ...lt, t: '' }) + (['돕다', '곱다'].includes(dict) ? '와' : '워');
  if (type === 'd') return addT(stem, 'ㄹ') + (bright(lt.v) ? '아' : '어');
  if (type === 's') return setLast(stem, { t: '' }) + (bright(lt.v) ? '아' : '어');
  if (type === 'r') {
    const prev = stem.length > 1 ? last(stem.slice(0, -1)).v : 'ㅓ';
    return addT(stem.slice(0, -1), 'ㄹ') + (bright(prev) ? '라' : '러');
  }
  if (type === 'eu') {
    const prev = stem.length > 1 ? last(stem.slice(0, -1)).v : null;
    const v = prev && bright(prev) ? 'ㅏ' : 'ㅓ';
    return setLast(stem, { v });
  }
  if (lt.t) return stem + (bright(lt.v) ? '아' : '어');
  // gốc không patchim: rút gọn nguyên âm
  const map = { 'ㅏ': 'ㅏ', 'ㅓ': 'ㅓ', 'ㅐ': 'ㅐ', 'ㅔ': 'ㅔ', 'ㅕ': 'ㅕ', 'ㅗ': 'ㅘ', 'ㅜ': 'ㅝ', 'ㅣ': 'ㅕ', 'ㅚ': 'ㅙ', 'ㅟ': null, 'ㅢ': null };
  const nv = map[lt.v];
  if (nv === null || nv === undefined) return stem + '어';
  if (lt.l === 'ㅇ' && lt.v === 'ㅣ') return setLast(stem, { v: 'ㅕ' }); // 이다 → 여
  return setLast(stem, { v: nv });
}

// Gốc dùng cho đuôi bắt đầu bằng -(으)
function euStem(dict) {
  const { stem, lt, type } = info(dict);
  if (type === 'b') return { base: stem.slice(0, -1) + com({ ...lt, t: '' }) + '우', vowelEnd: true };
  if (type === 'd') return { base: addT(stem, 'ㄹ') + '으', vowelEnd: true };
  if (type === 's') return { base: setLast(stem, { t: '' }) + '으', vowelEnd: true };
  if (type === 'l') return { base: stem, l: true };
  if (lt.t) return { base: stem + '으', vowelEnd: true };
  return { base: stem, vowelEnd: true };
}
// Ghép đuôi -(으)X. kind: 'n' (ㄴ/ㅂ/ㅅ đầu → ㄹ rơi), 'l' (ㄹ đầu), 'other' (면, 러, 려고)
function withEu(dict, ending, kind) {
  const e = euStem(dict);
  const first = ending[0];
  const jamo = { 'ㄹ': 'ㄹ', 'ㅂ': 'ㅂ', 'ㄴ': 'ㄴ' }[first];
  if (e.l) {
    const s = info(dict).stem;
    if (kind === 'n') { const dropped = setLast(s, { t: '' }); return jamo ? addT(dropped, jamo) + ending.slice(1) : dropped + ending; }
    if (kind === 'l') return s + ending.slice(1); // 살 + ㄹ 거예요 → 살 거예요
    return s + ending; // 살면, 살러
  }
  if (jamo) return addT(e.base, jamo) + ending.slice(1);
  return e.base + ending;
}

// Động từ "danh từ + 하다" thì 안/못 đứng trước 하다; tính từ -하다 và 좋아하다/싫어하다 thì không tách
const NOSPLIT = new Set(['하다', '좋아하다', '싫어하다', '따뜻하다', '시원하다', '깨끗하다', '조용하다', '피곤하다', '친절하다', '유명하다', '행복하다', '필요하다', '편하다', '불편하다',
  '똑똑하다', '날씬하다', '건강하다', '심심하다', '쌀쌀하다', '선선하다', '복잡하다', '중요하다', '이상하다', '간단하다', '착하다', '궁금하다', '미안하다', '비슷하다', '한가하다', '쌀쌀하다', '뚱뚱하다']);
const splitHa = (d) => d.endsWith('하다') && !NOSPLIT.has(d);
const F = {
  dict: (d) => d,
  formal: (d) => { const { stem, lt, type } = info(d); if (type === 'l') return addT(setLast(stem, { t: '' }), 'ㅂ') + '니다'; return lt.t && type !== 'b' && type !== 'd' && type !== 's' ? stem + '습니다' : (lt.t ? stem + '습니다' : addT(stem, 'ㅂ') + '니다'); },
  formal_q: (d) => F.formal(d).replace(/니다$/, '니까?').replace(/습니까\?$/, '습니까?'),
  polite: (d) => aeo(d) + '요',
  past: (d) => addT(aeo(d), 'ㅆ') + '어요',
  past_formal: (d) => addT(aeo(d), 'ㅆ') + '습니다',
  an: (d) => (splitHa(d) ? info(d).stem.slice(0, -1) + ' 안 해요' : '안 ' + aeo(d) + '요'),
  ji_anh: (d) => info(d).stem + '지 않아요',
  ji_mot: (d) => info(d).stem + '지 못해요',
  mot: (d) => (splitHa(d) ? info(d).stem.slice(0, -1) + ' 못 해요' : '못 ' + aeo(d) + '요'),
  go_sipda: (d) => info(d).stem + '고 싶어요',
  go: (d) => info(d).stem + '고',
  jiman: (d) => info(d).stem + '지만',
  gess: (d) => info(d).stem + '겠어요',
  seyo: (d) => withEu(d, '세요', 'n'),
  syeosseoyo: (d) => withEu(d, '셨어요', 'n'),
  sipnida: (d) => withEu(d, '십니다', 'n'),
  bsida: (d) => withEu(d, 'ㅂ시다', 'n'),
  lgeoyeyo: (d) => withEu(d, 'ㄹ 거예요', 'l'),
  llaeyo: (d) => withEu(d, 'ㄹ래요', 'l'),
  lkkayo: (d) => withEu(d, 'ㄹ까요?', 'l'),
  lsu_itda: (d) => withEu(d, 'ㄹ 수 있어요', 'l'),
  lsu_eopda: (d) => withEu(d, 'ㄹ 수 없어요', 'l'),
  reo: (d) => withEu(d, '러', 'other'),
  ryeogo: (d) => withEu(d, '려고', 'other'),
  ryeogo_hada: (d) => withEu(d, '려고 해요', 'other'),
  myeon: (d) => withEu(d, '면', 'other'),
  aseo: (d) => aeo(d) + '서',
  gi: (d) => info(d).stem + '기',
  neun_geot: (d) => { const { stem, type } = info(d); return (type === 'l' ? setLast(stem, { t: '' }) : stem) + '는 것'; },
};
const conjugate = (dict, form) => { if (!F[form]) throw new Error('Không có dạng ' + form); return F[form](dict); };

module.exports = { conjugate, aeo, info, FORMS: Object.keys(F), dec, com };
