// Kiểm thử bộ chia động từ với bảng kiểm tra tay. Chạy: node tests/korean.test.js
const { conjugate: c } = require('../server/seed/korean');
const { VERBS } = require('../server/seed/content');
let bad = 0, n = 0;
const eq = (got, exp, label) => { n++; if (got !== exp) { bad++; console.log('✗', label, '→', got, '≠', exp); } };
for (const [d, , formal, polite, past, an, ji] of VERBS) {
  eq(c(d, 'formal'), formal, d + ' formal'); eq(c(d, 'polite'), polite, d + ' polite'); eq(c(d, 'past'), past, d + ' past');
  if (an) { eq(c(d, 'an'), an, d + ' an'); eq(c(d, 'ji_anh'), ji, d + ' ji'); }
}
const X = [
  ['읽다', 'seyo', '읽으세요'], ['가다', 'seyo', '가세요'], ['살다', 'seyo', '사세요'], ['만들다', 'bsida', '만듭시다'], ['먹다', 'bsida', '먹읍시다'], ['가다', 'bsida', '갑시다'],
  ['듣다', 'seyo', '들으세요'], ['걷다', 'myeon', '걸으면'], ['덥다', 'myeon', '더우면'], ['돕다', 'polite', '도와요'], ['춥다', 'lgeoyeyo', '추울 거예요'],
  ['살다', 'lgeoyeyo', '살 거예요'], ['놀다', 'reo', '놀러'], ['먹다', 'reo', '먹으러'], ['사다', 'reo', '사러'], ['만들다', 'myeon', '만들면'],
  ['모르다', 'polite', '몰라요'], ['부르다', 'polite', '불러요'], ['빠르다', 'past', '빨랐어요'], ['다르다', 'polite', '달라요'],
  ['쓰다', 'polite', '써요'], ['바쁘다', 'polite', '바빠요'], ['예쁘다', 'polite', '예뻐요'], ['아프다', 'past', '아팠어요'], ['기쁘다', 'polite', '기뻐요'],
  ['되다', 'polite', '돼요'], ['보내다', 'polite', '보내요'], ['서다', 'polite', '서요'], ['켜다', 'polite', '켜요'], ['마시다', 'past', '마셨어요'],
  ['오다', 'polite', '와요'], ['배우다', 'polite', '배워요'], ['쉬다', 'polite', '쉬어요'], ['희다', 'polite', '희어요'],
  ['가다', 'lkkayo', '갈까요?'], ['먹다', 'lkkayo', '먹을까요?'], ['듣다', 'lkkayo', '들을까요?'], ['만들다', 'lkkayo', '만들까요?'],
  ['수영하다', 'lsu_itda', '수영할 수 있어요'], ['읽다', 'llaeyo', '읽을래요'], ['보다', 'ryeogo_hada', '보려고 해요'], ['먹다', 'ryeogo', '먹으려고'],
  ['공부하다', 'an', '공부 안 해요'], ['공부하다', 'mot', '공부 못 해요'], ['가다', 'mot', '못 가요'], ['먹다', 'go_sipda', '먹고 싶어요'],
  ['오다', 'aseo', '와서'], ['바쁘다', 'aseo', '바빠서'], ['만나다', 'aseo', '만나서'], ['하다', 'polite', '해요'], ['살다', 'neun_geot', '사는 것'],
  ['듣다', 'formal', '듣습니다'], ['덥다', 'formal', '덥습니다'], ['살다', 'formal', '삽니다'], ['읽다', 'formal_q', '읽습니까?'], ['가다', 'formal_q', '갑니까?'],
  ['따뜻하다', 'an', '안 따뜻해요'], ['좋아하다', 'an', '안 좋아해요'], ['일하다', 'mot', '일 못 해요'], ['오다', 'syeosseoyo', '오셨어요'], ['읽다', 'syeosseoyo', '읽으셨어요'], ['짓다', 'polite', '지어요'], ['낫다', 'myeon', '나으면'], ['입다', 'polite', '입어요'], ['좁다', 'polite', '좁아요'],
];
X.forEach(([d, f, e]) => eq(c(d, f), e, `${d} ${f}`));
console.log(`${n - bad}/${n} đúng`);
process.exit(bad ? 1 : 0);
