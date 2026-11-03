// Sơ cấp 1 · Bài 7 — 물건 사기 (Mua sắm)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const EU = [['크다', 'to, cao'], ['바쁘다', 'bận'], ['아프다', 'đau, ốm'], ['예쁘다', 'đẹp'], ['나쁘다', 'xấu'], ['고프다', 'đói (bụng)'], ['쓰다', 'viết; đắng'], ['기쁘다', 'vui'], ['슬프다', 'buồn'], ['끄다', 'tắt']];
const WANT = [['가다', 'đi'], ['사다', 'mua'], ['먹다', 'ăn'], ['마시다', 'uống'], ['배우다', 'học'], ['보다', 'xem'], ['쉬다', 'nghỉ'], ['만나다', 'gặp'], ['살다', 'sống'], ['입다', 'mặc'], ['여행하다', 'du lịch'], ['자다', 'ngủ']];
const C = [['개', 'cái (đồ vật)'], ['명', 'người'], ['마리', 'con (động vật)'], ['잔', 'cốc, chén'], ['대', 'chiếc (xe, máy)'], ['병', 'chai'], ['켤레', 'đôi (giày, tất)'], ['권', 'quyển'], ['장', 'tờ, tấm']];
const ADJ = { 1: ['한', '하나', '일'], 2: ['두', '둘', '이'], 3: ['세', '셋', '삼'], 4: ['네', '넷', '사'], 5: ['다섯', '다섯', '오'], 6: ['여섯', '여섯', '육'], 10: ['열', '열', '십'], 20: ['스무', '스물', '이십'] };
const counterQ = [['사과', '개', 3, '3 quả táo'], ['학생', '명', 5, '5 học sinh'], ['고양이', '마리', 2, '2 con mèo'], ['커피', '잔', 1, '1 cốc cà phê'], ['자동차', '대', 4, '4 chiếc ô tô'], ['맥주', '병', 6, '6 chai bia'],
  ['구두', '켤레', 2, '2 đôi giày'], ['책', '권', 10, '10 quyển sách'], ['표', '장', 20, '20 tấm vé'], ['우유', '병', 3, '3 chai sữa']].map(([n, c, k, vi], i) => {
  const [adj, bare, sino] = ADJ[k];
  const other = C.map((x) => x[0]).filter((x) => x !== c)[i % 8];
  const opts = [`${n} ${adj} ${c}`, `${n} ${adj} ${other}`, `${n} ${sino} ${c}`];
  if (bare !== adj) opts.push(`${n} ${bare} ${c}`);
  return mc(`Chọn cách nói đúng: “${vi}”`, opts, `${n} + ${adj} (số thuần Hàn) + đơn vị ${c}.`, { tag: 'number', d: 2 });
});

module.exports = {
  unit: 7, ko: '물건 사기', vi: 'Mua sắm', vocabName: 'đơn vị đếm, đồ mua sắm, câu mua bán',
  vocab: [
    ['Danh từ đơn vị (1)', [...C, ['여러', 'nhiều, vài']]],
    ['Đồ mua sắm', [['과일', 'hoa quả'], ['채소', 'rau'], ['음료수', 'đồ uống'], ['옷', 'quần áo'], ['바지', 'quần'], ['치마', 'váy'], ['구두', 'giày da'], ['모자', 'mũ'], ['티셔츠', 'áo phông'], ['과자', 'bánh quy'],
      ['생선', 'cá'], ['주스', 'nước ép'], ['망고', 'xoài'], ['수박', 'dưa hấu'], ['귤', 'quýt'], ['카메라', 'máy ảnh'], ['소설책', 'tiểu thuyết']]],
    ['Câu nói khi mua bán', [['어서 오세요.', 'Xin mời vào.'], ['무엇을 찾으세요?', 'Anh/chị tìm gì ạ?'], ['이거 얼마예요?', 'Cái này bao nhiêu tiền?'], ['이거 두 개 주세요.', 'Cho tôi 2 cái này.'], ['여기 있어요.', 'Đây ạ.'],
      ['너무 비싸요.', 'Đắt quá.'], ['깎아 주세요.', 'Bớt cho tôi đi.'], ['싸게 해 주세요.', 'Bán rẻ cho tôi đi.'], ['다음에 또 오세요.', 'Lần sau lại đến nhé.'], ['손님', 'khách'], ['주인', 'chủ cửa hàng'], ['원', 'won (tiền Hàn)'],
      ['비싸다', 'đắt'], ['싸다', 'rẻ'], ['세일', 'giảm giá'], ['마트', 'siêu thị'], ['문구점', 'văn phòng phẩm'], ['전자상가', 'khu bán đồ điện tử']]],
  ],
  vocabNote: 'Đếm: Danh từ + số thuần Hàn + đơn vị: 사과 세 개, 학생 두 명. 하나/둘/셋/넷/스물 → 한/두/세/네/스무 trước đơn vị. Giá tiền đọc bằng số Hán Hàn: 만 오천 원.',
  grammar: [
    {
      name: 'Danh từ đơn vị & hỏi giá', desc: '개, 명, 마리, 잔, 대, 병, 켤레, 권, 장 + hỏi giá 얼마예요?',
      lesson: {
        goal: 'Đếm đồ vật và mua bán.',
        formula: 'N + số thuần Hàn + đơn vị (+ 주세요)  ·  N 얼마예요? — (số Hán Hàn) 원이에요',
        explain: 'Tiếng Hàn đặt số và đơn vị SAU danh từ: 커피 두 잔 (hai cốc cà phê). Tiền tệ dùng số Hán Hàn: 3.500원 = 삼천오백 원, 12.000원 = 만 이천 원.',
        examples: [['사과 세 개 주세요.', 'Cho tôi 3 quả táo.'], ['이 모자 얼마예요? — 만 오천 원이에요.', 'Cái mũ này bao nhiêu? — 15.000 won.'], ['커피 한 잔하고 주스 두 잔 주세요.', 'Cho một cà phê và hai nước ép.']],
        mistakes: ['Đặt số trước danh từ như tiếng Việt: 세 사과 (ít dùng) → 사과 세 개.', 'Đọc giá bằng số thuần Hàn: 다섯 천 원 ✗ → 오천 원.'],
      },
      q: [
        ...counterQ,
        mc('Giá 15.000원 đọc là:', ['만 오천 원', '일만 오천 원', '십오천 원', '열다섯천 원'], '10.000 = 만 (không đọc 일만).', { tag: 'number' }),
        mc('Giá 3.500원 đọc là:', ['삼천오백 원', '셋천다섯백 원', '삼천오십 원', '삼백오천 원'], 'Tiền dùng số Hán Hàn.', { tag: 'number' }),
        mc('Khách muốn hỏi giá cái túi: ___', ['이 가방 얼마예요?', '이 가방 몇 개예요?', '이 가방 있어요?', '이 가방 주세요.'], '얼마예요? = bao nhiêu tiền?'),
        mc('Chủ cửa hàng nói “Xin mời vào”: ___', ['어서 오세요.', '안녕히 가세요.', '다음에 또 오세요.', '여기 있어요.'], '어서 오세요 dùng khi khách bước vào.'),
        fill('Viết: “2 quyển sách” (책 + số + 권)', ['책 두 권', '책 두권'], '둘 → 두 + 권.', { tag: 'number' }),
        ls('이 치마 얼마예요?', ['Cái váy này bao nhiêu tiền?', 'Cái váy này đẹp không?', 'Có váy không?', 'Cho tôi cái váy này.'], '얼마예요 = bao nhiêu tiền.'),
        ls('삼만 원이에요.', ['30.000 won', '3.000 won', '300.000 won', '13.000 won'], '삼만 = 30.000.', { tag: 'number', d: 2 }),
        tr('Dịch: “Cho tôi 2 cốc cà phê.”', ['커피 두 잔 주세요.', '커피 두 잔 주세요', '커피를 두 잔 주세요.'], '커피 + 두 잔 + 주세요.'),
      ],
    },
    {
      name: 'Giản lược “ㅡ”', desc: 'Gốc tận cùng ㅡ (바쁘다, 크다…) mất ㅡ trước -아/어.',
      lesson: {
        goal: 'Chia đúng động/tính từ có gốc tận cùng ㅡ.',
        formula: 'Bỏ ㅡ → nếu âm tiết trước là ㅏ/ㅗ thêm 아요, còn lại thêm 어요 (gốc một âm tiết → 어요)',
        explain: '아프다: 아프 → 아ㅍ + 아요 → 아파요 (âm tiết trước 아 có ㅏ). 예쁘다 → 예뻐요 (âm tiết trước 예). 크다, 쓰다 chỉ có một âm tiết → 커요, 써요. Quy tắc này cũng áp dụng cho quá khứ: 바빴어요, 컸어요.',
        examples: [['배가 너무 고파요.', 'Tôi đói bụng quá.'], ['민준 씨는 키가 커요.', 'Minjun cao.'], ['어제 바빴어요.', 'Hôm qua tôi bận.'], ['이 옷이 정말 예뻐요.', 'Bộ quần áo này đẹp thật.']],
        mistakes: ['바쁘어요 ✗ → 바빠요.', '크어요 ✗ → 커요.'],
      },
      gen: [{ kind: 'verb', form: 'polite', verbs: EU, typed: 0.6, d: 2 }, { kind: 'verb', form: 'past', verbs: EU.slice(0, 6), typed: 0.3, d: 2 }],
      q: [
        mc('A: 왜 밥을 안 먹어요?  B: 배가 ___', ['아파요.', '아퍼요.', '아프어요.', '아프요.'], '아프 → 아파요 (âm tiết trước 아).'),
        err(['이', '가방이', '아주', '예쁘어요.'], 3, '예쁘다 → 예뻐요.'),
      ],
    },
    {
      name: 'N은/는 (đối chiếu)', desc: '은/는 dùng để so sánh, đối chiếu hai đối tượng.',
      lesson: {
        goal: 'Dùng 은/는 để đối chiếu.',
        formula: 'A은/는 …, B은/는 …',
        explain: 'Ngoài chỉ chủ đề, 은/는 còn nhấn mạnh sự đối lập: “A thì…, còn B thì…”. Có thể gắn sau cả danh từ đã có tiểu từ khác: 주말에는 (cuối tuần thì), 학교에서는.',
        examples: [['라면은 싸요. 불고기는 비싸요.', 'Mì gói thì rẻ. Bulgogi thì đắt.'], ['수박은 커요. 망고는 작아요.', 'Dưa hấu thì to. Xoài thì nhỏ.'], ['저는 한국에 살아요. 친구는 베트남에 살아요.', 'Tôi sống ở Hàn, còn bạn tôi sống ở Việt Nam.'], ['평일에는 바빠요. 주말에는 안 바빠요.', 'Ngày thường bận, cuối tuần thì không bận.']],
        mistakes: ['Dùng 이/가 cho cả hai vế khi muốn đối chiếu → nên dùng 은/는.'],
      },
      q: [
        mc('“Táo thì rẻ, còn dưa hấu thì đắt.”', ['사과는 싸요. 수박은 비싸요.', '사과가 싸요. 수박이 비싸요.', '사과는 싸요. 수박는 비싸요.', '사과은 싸요. 수박은 비싸요.'], 'Đối chiếu → 은/는; 사과 không patchim → 는, 수박 có patchim → 은.'),
        fill('Điền: 커피는 좋아해요. 그런데 차___ 안 좋아해요.', ['는'], 'Đối chiếu, 차 không patchim → 는.'),
        fill('Điền: 평일에___ 회사에 가요. 주말에는 쉬어요.', ['는'], '에 + 는 → 에는 (đối chiếu).', { d: 3 }),
        tr('Dịch: “Tôi thì là học sinh, còn bạn tôi là nhân viên công ty.”', ['저는 학생이에요. 친구는 회사원이에요.', '저는 학생이에요. 제 친구는 회사원이에요.', '저는 학생입니다. 친구는 회사원입니다.', '저는 학생입니다. 제 친구는 회사원입니다.'], 'Hai vế đều dùng 은/는.', { d: 3 }),
      ],
    },
    {
      name: '-고 싶다 (muốn)', desc: 'Diễn tả mong muốn làm gì.',
      lesson: {
        goal: 'Nói điều mình muốn làm.',
        formula: 'Gốc động từ + 고 싶어요 / 고 싶습니다  ·  Ngôi thứ ba: 고 싶어 해요',
        explain: 'Gắn -고 싶다 vào gốc động từ, không xét patchim. Chủ ngữ là ngôi thứ ba (anh ấy, Hoa…) dùng -고 싶어 하다. Phủ định: 안 + V고 싶어요 hoặc V고 싶지 않아요.',
        examples: [['저는 한국에 가고 싶어요.', 'Tôi muốn đi Hàn Quốc.'], ['컴퓨터를 사고 싶습니다.', 'Tôi muốn mua máy tính.'], ['화 씨는 한국어를 배우고 싶어 해요.', 'Hoa muốn học tiếng Hàn.'], ['뭐 먹고 싶어요?', 'Bạn muốn ăn gì?']],
        mistakes: ['Dùng -고 싶다 với danh từ: 커피 싶어요 ✗ → 커피를 마시고 싶어요.', 'Ngôi thứ ba: 화 씨는 가고 싶어요 → nên nói 가고 싶어 해요.'],
      },
      gen: [{ kind: 'verb', form: 'go_sipda', verbs: WANT, typed: 0.4 }],
      q: [
        mc('A: 주말에 뭐 하고 싶어요?  B: ___', ['바다에 가고 싶어요.', '바다에 가요 싶어요.', '바다에 가고 싶다요.', '바다에 가고 싶어 해요.'], 'Bản thân muốn → V고 싶어요.'),
        mc('“Minsu muốn mua giày.” (ngôi thứ ba)', ['민수 씨는 구두를 사고 싶어 해요.', '민수 씨는 구두를 사고 싶어요.', '민수 씨는 구두를 싶어 해요.', '민수 씨는 구두를 사요 싶어요.'], 'Ngôi thứ ba → -고 싶어 해요.', { d: 3 }),
        tr('Dịch: “Tôi muốn uống nước ép.”', ['주스를 마시고 싶어요.', '저는 주스를 마시고 싶어요.', '주스를 마시고 싶습니다.', '저는 주스를 마시고 싶습니다.'], 'N을/를 + V고 싶어요.'),
        ord('Sắp xếp: “Tôi muốn học tiếng Hàn.”', ['저는', '한국어를', '배우고', '싶어요.'], 'V고 싶어요 đứng cuối.'),
      ],
    },
  ],
  pron: {
    name: 'Âm thường – bật hơi – căng', desc: 'Phân biệt ㄱ/ㅋ/ㄲ, ㄷ/ㅌ/ㄸ, ㅂ/ㅍ/ㅃ, ㅈ/ㅊ/ㅉ, ㅅ/ㅆ.',
    lesson: { goal: 'Nghe và đọc phân biệt 3 loại phụ âm.', explain: 'Âm thường (ㄱ ㄷ ㅂ ㅈ ㅅ) nhẹ; âm bật hơi (ㅋ ㅌ ㅍ ㅊ) có luồng hơi mạnh; âm căng (ㄲ ㄸ ㅃ ㅉ ㅆ) căng cổ họng, không bật hơi. Đổi loại âm sẽ đổi nghĩa: 불 (lửa) – 풀 (cỏ) – 뿔 (sừng).',
      examples: [['불 / 풀 / 뿔', 'lửa / cỏ / sừng'], ['달 / 탈 / 딸', 'mặt trăng / mặt nạ / con gái'], ['굴 / 꿀', 'hàu / mật ong'], ['자다 / 차다 / 짜다', 'ngủ / đá (chân) / mặn']] },
    q: [
      ls('딸', ['딸', '달', '탈', '팔'], 'ㄸ căng, không bật hơi.', { prompt: 'Nghe và chọn từ đúng.', d: 3 }),
      ls('풀', ['풀', '불', '뿔', '둘'], 'ㅍ bật hơi mạnh.', { prompt: 'Nghe và chọn từ đúng.', d: 3 }),
      ls('꿀', ['꿀', '굴', '쿨', '물'], 'ㄲ căng.', { prompt: 'Nghe và chọn từ đúng.', d: 3 }),
      mc('짜다 nghĩa là gì?', ['mặn', 'ngủ', 'đá (chân)', 'mua'], '짜다 = mặn (âm căng ㅉ).'),
    ],
  },
  listening: {
    desc: 'Nghe mua bán, hỏi giá, số lượng.',
    q: [
      ls('사과 다섯 개 주세요.', ['Cho tôi 5 quả táo.', 'Cho tôi 4 quả táo.', 'Táo bao nhiêu tiền?', 'Có táo không?'], '다섯 개 = 5 cái.', { tag: 'number' }),
      ls('너무 비싸요. 깎아 주세요.', ['Đắt quá, bớt cho tôi đi.', 'Rẻ quá, cho tôi 2 cái.', 'Đắt quá, tôi không mua.', 'Bao nhiêu tiền vậy?'], '깎아 주세요 = bớt giá.'),
      ls('구두 한 켤레에 오만 원이에요.', ['Một đôi giày 50.000 won.', 'Năm đôi giày 10.000 won.', 'Một đôi giày 15.000 won.', 'Một đôi giày 5.000 won.'], '오만 = 50.000.', { tag: 'number', d: 2 }),
      ls('저는 모자를 사고 싶어요.', ['Tôi muốn mua mũ.', 'Tôi đã mua mũ.', 'Tôi không mua mũ.', 'Mũ này đẹp.'], '사고 싶어요 = muốn mua.'),
      ls('다음에 또 오세요.', ['Lần sau lại đến nhé.', 'Xin mời vào.', 'Đây ạ.', 'Tạm biệt (nói với người ở lại).'], 'Câu chủ cửa hàng chào khách ra về.'),
    ],
    passages: [{
      title: 'Ở cửa hàng hoa quả', ko: '주인: 어서 오세요. 무엇을 찾으세요?\n손님: 망고 있어요?\n주인: 네, 있어요. 한 개에 이천 원이에요.\n손님: 너무 비싸요. 싸게 해 주세요.\n주인: 그럼 세 개에 오천 원에 드릴게요.\n손님: 좋아요. 세 개 주세요. 그리고 귤도 한 봉지 주세요.',
      q: [
        mc('망고 한 개는 처음에 얼마예요?', ['2.000원', '5.000원', '3.000원', '1.500원'], '한 개에 이천 원.'),
        mc('손님은 망고를 몇 개 샀어요?', ['3개', '1개', '2개', '5개'], '세 개 주세요.'),
        mc('손님은 망고 세 개에 얼마를 냈어요?', ['5.000원', '6.000원', '2.000원', '3.000원'], '세 개에 오천 원.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Quảng cáo giảm giá', ko: '한국마트 주말 세일!\n사과 (5개) 6,000원 → 4,500원\n우유 (1병) 2,500원 → 2,000원\n티셔츠 (1장) 15,000원 → 9,900원\n구두 (1켤레) 59,000원 → 39,000원\n토요일, 일요일 오전 10시 ~ 오후 9시',
      vi: 'Siêu thị Hàn Quốc giảm giá cuối tuần: táo (5 quả) 6.000 → 4.500; sữa 2.500 → 2.000; áo phông 15.000 → 9.900; giày 59.000 → 39.000. Thứ bảy, chủ nhật 10h–21h.',
      q: [
        mc('세일하는 날은 언제예요?', ['토요일과 일요일', '월요일', '평일', '금요일'], '토요일, 일요일.'),
        mc('구두 한 켤레는 세일 가격이 얼마예요?', ['39.000원', '59.000원', '9.900원', '45.000원'], '59,000원 → 39,000원.'),
        mc('사과 다섯 개를 사면 얼마를 깎아요? (giảm bao nhiêu)', ['1.500원', '1.000원', '4.500원', '6.000원'], '6.000 − 4.500 = 1.500.', { d: 3 }),
      ],
    }],
  },
  culture: {
    title: 'Tiền tệ của Hàn Quốc',
    paras: [
      'Đơn vị tiền tệ Hàn Quốc là won (원). Tiền xu có các mệnh giá 10, 50, 100, 500 won; tiền giấy có 1.000, 5.000, 10.000 và 50.000 won.',
      'Trên tiền giấy in chân dung các nhân vật lịch sử: học giả Toegye Yi Hwang (1.000), Yulgok Yi I (5.000), vua Sejong – người sáng tạo chữ Hangeul (10.000) và Sin Saimdang – nữ hoạ sĩ, thi sĩ thời Joseon (50.000).',
      'Ở Hàn, thanh toán bằng thẻ và điện thoại rất phổ biến, kể cả với số tiền nhỏ.',
    ],
    compare: 'Việt Nam dùng tiền polymer mệnh giá lớn đến 500.000 đồng; khi quy đổi, 1.000 won ≈ 18.000–19.000 đồng (tham khảo, thay đổi theo tỷ giá).',
  },
  writing: [
    wr('Viết đoạn hội thoại mua hàng (4 lượt): hỏi có hàng không, hỏi giá, xin bớt, mua.', { min_len: 35, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Hỏi giá 얼마예요?', kind: 'includes', value: '얼마', tip: 'N 얼마예요?' },
      { label: 'Có số lượng + đơn vị', kind: 'regex', value: '(한|두|세|네|다섯|여섯) ?(개|명|마리|잔|대|병|켤레|권|장)', tip: 'Ví dụ: 두 개, 한 잔.' },
      { label: 'Dùng 주세요', kind: 'includes', value: '주세요', tip: 'N + số + đơn vị + 주세요.' }] },
    '손님: 사과 있어요?\n주인: 네, 있어요.\n손님: 얼마예요?\n주인: 한 개에 천 원이에요.\n손님: 싸게 해 주세요.\n주인: 다섯 개에 사천 원에 드릴게요.\n손님: 다섯 개 주세요.', ''),
    wr('Bạn muốn làm gì vào kỳ nghỉ? Viết 3 câu dùng -고 싶어요.', { min_len: 20, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -고 싶어요', kind: 'includes', value: '고 싶어', tip: 'V고 싶어요.' }] },
    '방학에 한국에 가고 싶어요. 서울에서 한국 음식을 먹고 싶어요. 그리고 예쁜 옷을 사고 싶어요.', ''),
  ],
};
