// Sơ cấp 1 · Bài 10 — 가족 (Gia đình)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const HON = [['가다', 'đi'], ['오다', 'đến'], ['읽다', 'đọc'], ['보다', 'xem'], ['일하다', 'làm việc'], ['좋아하다', 'thích'], ['앉다', 'ngồi'], ['살다', 'sống'], ['만들다', 'làm'], ['알다', 'biết'],
  ['운동하다', 'tập thể dục'], ['바쁘다', 'bận'], ['받다', 'nhận'], ['찾다', 'tìm'], ['기다리다', 'chờ'], ['전화하다', 'gọi điện']];
const LDROP = [['살다', 'sống'], ['알다', 'biết'], ['만들다', 'làm'], ['열다', 'mở'], ['놀다', 'chơi'], ['팔다', 'bán'], ['길다', 'dài'], ['멀다', 'xa'], ['달다', 'ngọt'], ['울다', 'khóc']];
const AGE = [[20, '스무 살'], [21, '스물한 살'], [22, '스물두 살'], [30, '서른 살'], [34, '서른네 살'], [45, '마흔다섯 살'], [53, '쉰세 살'], [18, '열여덟 살'], [11, '열한 살'], [67, '예순일곱 살']];
const ageQ = AGE.map(([n, right]) => {
  const w = { 20: ['스물 살', '이십 살', '스무 세'], 21: ['스물하나 살', '이십일 살', '스물한 세'], 22: ['스물둘 살', '이십이 살', '스무두 살'], 30: ['삼십 살', '서른 세', '서른한 살'], 34: ['서른넷 살', '삼십사 살', '서른세 살'],
    45: ['마흔다섯 세', '사십오 살', '쉰다섯 살'], 53: ['쉰셋 살', '오십삼 살', '쉰두 살'], 18: ['열여덜 살', '십팔 살', '열일곱 살'], 11: ['열하나 살', '십일 살', '열두 살'], 67: ['예순일곱 세', '육십칠 살', '일흔일곱 살'] }[n];
  return mc(`“${n} tuổi” nói là:`, [right, ...w], `Tuổi dùng số thuần Hàn + 살; 하나/둘/셋/넷/스물 → 한/두/세/네/스무.`, { tag: 'number', d: 2 });
});

module.exports = {
  unit: 10, ko: '가족', vi: 'Gia đình', vocabName: 'gia đình, nghề nghiệp (2), kính ngữ',
  vocab: [
    ['Gia đình', [['할아버지', 'ông nội'], ['할머니', 'bà nội'], ['외할아버지', 'ông ngoại'], ['외할머니', 'bà ngoại'], ['아버지', 'bố'], ['어머니', 'mẹ'], ['오빠', 'anh trai (em gái gọi)'], ['형', 'anh trai (em trai gọi)'],
      ['언니', 'chị gái (em gái gọi)'], ['누나', 'chị gái (em trai gọi)'], ['남동생', 'em trai'], ['여동생', 'em gái'], ['나', 'tôi (thân mật)'], ['가족', 'gia đình'], ['부모님', 'bố mẹ'], ['아내', 'vợ'], ['남편', 'chồng'],
      ['아들', 'con trai'], ['딸', 'con gái'], ['삼촌', 'chú, cậu'], ['고모', 'cô (chị em gái của bố)'], ['이모', 'dì'], ['사촌', 'anh chị em họ']]],
    ['Nghề nghiệp (2)', [['교수', 'giáo sư'], ['연구원', 'nhà nghiên cứu'], ['군인', 'quân nhân'], ['사업가', 'doanh nhân'], ['변호사', 'luật sư'], ['경찰관', 'cảnh sát'], ['통역사', 'thông dịch viên'], ['농부', 'nông dân'],
      ['사업을 하다', 'kinh doanh'], ['장사를 하다', 'buôn bán'], ['출장을 가다', 'đi công tác'], ['농사를 짓다', 'làm nông']]],
    ['Kính ngữ', [['계시다', 'có, ở (kính ngữ)'], ['드시다', 'ăn, uống (kính ngữ)'], ['잡수시다', 'ăn (kính ngữ)'], ['주무시다', 'ngủ (kính ngữ)'], ['말씀하시다', 'nói (kính ngữ)'], ['돌아가시다', 'qua đời'],
      ['댁', 'nhà (kính ngữ)'], ['성함', 'tên, quý danh'], ['생신', 'sinh nhật (kính ngữ)'], ['연세', 'tuổi (kính ngữ)'], ['진지', 'cơm (kính ngữ)'], ['말씀', 'lời nói (kính ngữ)'], ['분', 'vị, người (kính ngữ)']]],
    ['Từ mới trong bài', [['살', 'tuổi'], ['몇 살', 'mấy tuổi'], ['강아지', 'chó con'], ['결혼식', 'lễ cưới'], ['대가족', 'đại gia đình'], ['외아들', 'con trai một'], ['외동딸', 'con gái một'], ['전공하다', 'học chuyên ngành'],
      ['근무하다', 'làm việc (cơ quan)'], ['나중에', 'sau này'], ['되다', 'trở thành'], ['올해', 'năm nay'], ['술', 'rượu']]],
  ],
  vocabNote: 'Anh/chị gọi khác nhau theo giới của NGƯỜI NÓI: em gái gọi anh là 오빠, chị là 언니; em trai gọi anh là 형, chị là 누나. Nói về người lớn dùng từ kính ngữ: 할머니 연세 (tuổi của bà), 아버지 성함 (tên của bố).',
  vocabMistakes: ['Con trai gọi chị gái là 언니 ✗ → 누나.', 'Hỏi tuổi người lớn bằng 몇 살이에요? → nên dùng 연세가 어떻게 되세요?'],
  grammar: [
    {
      name: 'Định từ số (2): tuổi, đếm người', desc: 'Số thuần Hàn + 살 / 명 / 분.',
      lesson: {
        goal: 'Nói tuổi và số thành viên gia đình.',
        formula: 'Số thuần Hàn (한/두/세/네/스무…) + 살 · 명 · 분 (kính ngữ của 명)',
        explain: 'Tuổi và số người dùng số thuần Hàn: 스무 살 (20 tuổi), 스물두 살 (22 tuổi), 가족이 네 명이에요 (gia đình có 4 người). 분 là đơn vị kính ngữ của 명: 몇 분이세요? (mấy vị ạ?). Hỏi tuổi: 몇 살이에요? (bạn bè, trẻ em) / 연세가 어떻게 되세요? (người lớn).',
        examples: [['뜨엉 씨는 올해 스무 살입니다.', 'Năm nay Đường 20 tuổi.'], ['저는 스물두 살이에요.', 'Tôi 22 tuổi.'], ['우리 형은 서른네 살입니다.', 'Anh trai tôi 34 tuổi.'], ['가족이 모두 몇 명이에요? — 다섯 명이에요.', 'Gia đình có mấy người? — 5 người.']],
        mistakes: ['스물 살 ✗ → 스무 살.', 'Đọc tuổi bằng số Hán Hàn: 이십 살 ✗ (chỉ dùng 이십 세 trong văn bản).'],
      },
      q: [
        ...ageQ,
        mc('Hỏi tuổi ông bà lịch sự:', ['연세가 어떻게 되세요?', '몇 살이에요?', '나이가 몇이에요?', '몇 살이세요?'], '연세 là kính ngữ của 나이.', { d: 2 }),
        mc('A: 가족이 몇 명이에요?  B: ___ (4 người)', ['네 명이에요.', '넷 명이에요.', '사 명이에요.', '네 살이에요.'], '넷 → 네 + 명.', { tag: 'number' }),
        ls('저는 스물세 살이에요.', ['23 tuổi', '33 tuổi', '22 tuổi', '13 tuổi'], '스물세 = 23.', { prompt: 'Nghe và chọn tuổi đúng.', tag: 'number' }),
        fill('Viết: “30 tuổi” (số thuần Hàn + 살)', ['서른 살', '서른살'], '30 = 서른.', { tag: 'number' }),
      ],
    },
    {
      name: 'N께서 / 께서는', desc: 'Tiểu từ chủ ngữ/chủ đề kính ngữ.',
      lesson: {
        goal: 'Nói về người bề trên một cách kính trọng.',
        formula: 'N(người bề trên) + 께서 (thay 이/가) · 께서는 (thay 은/는)',
        explain: '께서 là dạng kính ngữ của 이/가, 께서는 là dạng kính ngữ của 은/는. Dùng khi chủ ngữ là người cần tôn kính (ông bà, bố mẹ, thầy cô), và vị ngữ đi kèm -(으)시-.',
        examples: [['아버지께서 오십니다.', 'Bố đến.'], ['선생님께서 전화하셨습니다.', 'Thầy đã gọi điện.'], ['할아버지께서는 텔레비전을 보십니다.', 'Ông nội xem ti vi.']],
        mistakes: ['Dùng 께서 cho bản thân: 저께서 ✗.', 'Dùng 께서 nhưng động từ không có -(으)시-: 할머니께서 자요 ✗ → 할머니께서 주무세요.'],
      },
      q: [
        mc('“Bà nội đang ngủ.” (kính ngữ)', ['할머니께서 주무세요.', '할머니가 자요.', '할머니께서 자요.', '할머니께서는 자세요.'], '께서 + 주무시다.', { d: 3 }),
        mc('선생님___ 한국 분이세요.', ['께서는', '께서가', '에게', '께는'], 'Kính ngữ của 은/는 → 께서는.', { fixed: true, tag: 'particle' }),
        err(['어머니께서', '부엌에서', '요리해요.'], 2, 'Chủ ngữ kính ngữ → 요리하세요.', { d: 3 }),
      ],
    },
    {
      name: '-(으)시- (kính ngữ chủ thể)', desc: 'Tôn kính chủ ngữ: 가세요, 읽으세요, 사십니다.',
      lesson: {
        goal: 'Chia động từ kính ngữ khi chủ ngữ là người bề trên.',
        formula: 'Gốc không patchim / gốc ㄹ (bỏ ㄹ) + 시 · có patchim + 으시 → -(으)세요, -(으)십니다, -(으)셨어요',
        explain: 'Khi chủ ngữ cần tôn kính, thêm -(으)시- vào gốc: 가다 → 가세요/가십니다, 읽다 → 읽으세요. Gốc ㄹ bỏ ㄹ: 살다 → 사세요. Một số động từ có từ kính ngữ riêng: 있다 → 계시다, 먹다 → 드시다/잡수시다, 자다 → 주무시다, 말하다 → 말씀하시다, 죽다 → 돌아가시다. Danh từ: 집 → 댁, 이름 → 성함, 생일 → 생신, 나이 → 연세, 밥 → 진지.',
        examples: [['부모님께서는 하노이에 사십니다.', 'Bố mẹ tôi sống ở Hà Nội.'], ['사장님, 오늘 신문을 읽으셨습니까?', 'Giám đốc đã đọc báo hôm nay chưa ạ?'], ['우리 선생님은 한국 분이세요.', 'Thầy giáo chúng tôi là người Hàn.'], ['할아버지 생신이 언제예요?', 'Sinh nhật ông nội là khi nào?']],
        mistakes: ['Dùng kính ngữ cho chính mình: 저는 가세요 ✗.', '먹으세요 với người lớn → nên 드세요.', '살으세요 ✗ → 사세요.'],
      },
      gen: [{ kind: 'verb', form: 'sipnida', verbs: HON, typed: 0.4, d: 2 }, { kind: 'verb', form: 'syeosseoyo', verbs: HON.slice(0, 10), typed: 0.3, d: 2 }],
      q: [
        mc('“Bố tôi ở nhà.” (kính ngữ)', ['아버지께서 댁에 계세요.', '아버지가 집에 있어요.', '아버지께서 집에 있으세요.', '아버지께서 댁에 있어요.'], '있다 (ở) → 계시다; 집 → 댁.', { d: 3 }),
        mc('Kính ngữ của 이름 là:', ['성함', '연세', '생신', '말씀'], '이름 → 성함.'),
        mc('Kính ngữ của 나이 là:', ['연세', '성함', '진지', '댁'], '나이 → 연세.'),
        mc('Kính ngữ của 자다 là:', ['주무시다', '드시다', '계시다', '돌아가시다'], '자다 → 주무시다.'),
        tr('Dịch (kính ngữ): “Ông nội đọc báo.”', ['할아버지께서 신문을 읽으세요.', '할아버지께서 신문을 읽으십니다.', '할아버지께서는 신문을 읽으세요.', '할아버지께서는 신문을 읽으십니다.'], '께서 + 읽으세요/읽으십니다.', { d: 3 }),
        err(['저는', '매일', '아침에', '운동하세요.'], 3, 'Không dùng kính ngữ cho bản thân → 운동해요.'),
      ],
    },
    {
      name: 'Giản lược ㄹ', desc: 'Gốc tận cùng ㄹ mất ㄹ trước ㄴ, ㅂ, ㅅ.',
      lesson: {
        goal: 'Chia đúng động từ gốc ㄹ (살다, 알다, 만들다…).',
        formula: 'Gốc ㄹ + đuôi bắt đầu bằng ㄴ, ㅂ, ㅅ → ㄹ rơi: 살다 → 삽니다, 사세요, 사는',
        explain: 'Những động từ/tính từ có gốc tận cùng ㄹ (살다, 알다, 만들다, 열다, 놀다, 팔다, 길다, 멀다) bỏ ㄹ khi gặp đuôi bắt đầu bằng ㄴ, ㅂ, ㅅ: 삽니다, 여세요, 만드세요. Với -아/어요 thì giữ ㄹ: 살아요, 만들어요.',
        examples: [['언니는 베트남에 삽니다.', 'Chị tôi sống ở Việt Nam.'], ['창문을 여세요.', 'Hãy mở cửa sổ.'], ['누가 김밥을 만드세요?', 'Ai làm kimbap vậy?'], ['저는 그 사람을 알아요.', 'Tôi biết người đó.']],
        mistakes: ['살습니다 ✗ → 삽니다.', '만들으세요 ✗ → 만드세요.', '사아요 ✗ (với -아/어요 vẫn giữ ㄹ: 살아요).'],
      },
      gen: [{ kind: 'verb', form: 'formal', verbs: LDROP, typed: 0.5, d: 2 }, { kind: 'verb', form: 'seyo', verbs: LDROP.filter(([v]) => !['길다', '멀다', '달다'].includes(v)), typed: 0.3, d: 2 }],
      q: [
        mc('A: 어디에 살아요?  B: 하노이에 ___ (trang trọng)', ['삽니다.', '살습니다.', '살ㅂ니다.', '사습니다.'], '살 + ㅂ니다 → 삽니다.'),
        tr('Dịch (trang trọng): “Tôi sống ở Hà Nội.”', ['하노이에 삽니다', '저는 하노이에 삽니다', '하노이에서 삽니다', '저는 하노이에서 삽니다'], '살다 → 삽니다 (bỏ ㄹ).', { tag: 'conjugation', common_wrong: [{ text: '하노이에 살습니다', why: 'Gốc tận cùng ㄹ: bỏ ㄹ rồi thêm ㅂ니다 → 삽니다.' }] }),
        mc('“Hãy mở cửa.”', ['문을 여세요.', '문을 열으세요.', '문을 열세요.', '문을 여으세요.'], '열 + 세요 → 여세요.'),
      ],
    },
  ],
  pron: {
    name: 'Mũi hoá [ㄷ] + ㄴ/ㅁ', desc: 'Patchim đọc [ㄷ] trước ㄴ, ㅁ → [ㄴ].',
    lesson: { goal: 'Đọc đúng 몇 명, 다섯 마리…', explain: 'Các patchim đọc là [ㄷ] (ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ) đứng trước ㄴ hoặc ㅁ thì đọc thành [ㄴ].',
      examples: [['몇 명 → [면 명]', 'mấy người'], ['몇 마리 → [면 마리]', 'mấy con'], ['다섯 나라 → [다선 나라]', 'năm nước'], ['여섯 마리 → [여선 마리]', 'sáu con']] },
    q: [
      mc('몇 명 được đọc là:', ['[면 명]', '[멷 명]', '[몃 명]', '[멱 명]'], '[ㄷ] + ㅁ → [ㄴ].', { fixed: true }),
      mc('다섯 마리 được đọc là:', ['[다선 마리]', '[다섣 마리]', '[다섬 마리]', '[다서 마리]'], 'ㅅ (đọc [ㄷ]) + ㅁ → [ㄴ].', { fixed: true }),
      ls('여섯 명', ['[여선 명]', '[여섯 명]', '[여섬 명]', '[여서 명]'], 'ㅅ + ㅁ → [ㄴ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 2 }),
    ],
  },
  listening: {
    desc: 'Nghe giới thiệu gia đình, kính ngữ.',
    q: [
      ls('우리 가족은 네 명이에요.', ['Gia đình tôi có 4 người.', 'Gia đình tôi có 3 người.', 'Gia đình tôi có 5 người.', 'Gia đình tôi có 2 người.'], '네 명 = 4 người.', { tag: 'number' }),
      ls('저는 언니하고 남동생이 있어요.', ['Tôi có chị gái và em trai.', 'Tôi có anh trai và em gái.', 'Tôi có chị gái và em gái.', 'Tôi là con một.'], '언니 = chị (em gái gọi); 남동생 = em trai.'),
      ls('아버지께서는 은행에서 일하세요.', ['Bố tôi làm ở ngân hàng.', 'Mẹ tôi làm ở ngân hàng.', 'Bố tôi làm ở bệnh viện.', 'Bố tôi đi ngân hàng.'], '아버지 = bố.'),
      ls('할머니께서 주무세요.', ['Bà đang ngủ.', 'Bà đang ăn.', 'Bà ở nhà.', 'Bà đã qua đời.'], '주무시다 = ngủ (kính ngữ).'),
      ls('성함이 어떻게 되세요?', ['Quý danh của ông/bà là gì ạ?', 'Ông/bà bao nhiêu tuổi ạ?', 'Nhà ông/bà ở đâu ạ?', 'Sinh nhật ông/bà khi nào ạ?'], '성함 = tên (kính ngữ).', { d: 2 }),
    ],
    passages: [{
      title: 'Ảnh gia đình', ko: '민준: 흐엉 씨, 이 사진은 가족 사진이에요?\n흐엉: 네. 이분은 우리 할머니세요. 올해 일흔다섯 살이세요.\n민준: 이분은 누구세요?\n흐엉: 우리 아버지세요. 고등학교 선생님이세요. 어머니께서는 병원에서 일하세요. 간호사세요.\n민준: 이 사람은 오빠예요?\n흐엉: 네, 오빠는 회사원이에요. 지금 서울에 출장을 갔어요.',
      q: [
        mc('할머니는 연세가 어떻게 되세요?', ['75 tuổi', '57 tuổi', '70 tuổi', '65 tuổi'], '일흔다섯 = 75.', { tag: 'number' }),
        mc('흐엉 씨 어머니의 직업은?', ['간호사', '선생님', '회사원', '의사'], '간호사세요.'),
        mc('오빠는 지금 어디에 있어요?', ['서울', '병원', '학교', '집'], '서울에 출장을 갔어요.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Giới thiệu gia đình', ko: '우리 가족은 다섯 명입니다. 할머니, 아버지, 어머니, 형 그리고 저입니다. 할머니께서는 연세가 많으십니다. 그래서 집에서 쉬십니다. 아버지께서는 회사에 다니십니다. 어머니께서는 작은 식당을 하십니다. 어머니의 음식은 정말 맛있습니다. 형은 대학교에서 경제학을 전공합니다. 저는 고등학생입니다.',
      vi: 'Gia đình tôi 5 người: bà, bố, mẹ, anh trai và tôi. Bà đã cao tuổi nên nghỉ ở nhà. Bố đi làm ở công ty. Mẹ mở một quán ăn nhỏ; món mẹ nấu rất ngon. Anh tôi học chuyên ngành kinh tế ở đại học. Tôi là học sinh cấp 3.',
      q: [
        mc('이 사람은 남자예요, 여자예요?', ['남자 (gọi anh trai là 형)', '여자', 'Không biết', 'Cả hai'], 'Gọi anh trai là 형 → người viết là nam.', { d: 3 }),
        mc('어머니께서는 무슨 일을 하세요?', ['식당을 하세요.', '회사에 다니세요.', '집에서 쉬세요.', '대학교에서 공부하세요.'], '작은 식당을 하십니다.'),
        mc('Câu nào đúng?', ['형은 대학생입니다.', '할머니께서는 회사에 다니십니다.', '가족은 네 명입니다.', '저는 대학생입니다.'], '형은 대학교에서 경제학을 전공합니다.'),
      ],
    }],
  },
  culture: {
    title: 'Cách xưng hô trong gia đình Hàn Quốc',
    paras: [
      'Cách gọi anh chị phụ thuộc vào giới của người nói: em gái gọi anh trai là 오빠, chị gái là 언니; em trai gọi anh trai là 형, chị gái là 누나. Em trai/em gái gọi chung là 동생.',
      'Họ hàng bên nội và bên ngoại có từ riêng: ông bà ngoại thêm 외- (외할머니); chị em gái của mẹ là 이모, chị em gái của bố là 고모, anh em trai của bố/mẹ có thể gọi là 삼촌.',
      'Người Hàn thường gọi người ngoài gia đình bằng từ xưng hô gia đình để thể hiện thân mật: 언니, 오빠, 이모 (gọi cô bán hàng ăn), 아저씨, 아주머니.',
    ],
    compare: 'Tiếng Việt cũng phân biệt nội/ngoại (cô, dì, chú, cậu) nhưng không phân biệt theo giới người nói như 오빠/형.',
  },
  writing: [
    wr('Giới thiệu gia đình bạn (5 câu): số người, nghề nghiệp, tuổi; dùng kính ngữ cho bố mẹ, ông bà.', { min_len: 40, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có số người (… 명)', kind: 'regex', value: '명', tip: '우리 가족은 … 명이에요.' },
      { label: 'Dùng kính ngữ -(으)시-', kind: 'regex', value: '(세요|십니다|셔요|셨어요|께서)', tip: 'Ví dụ: 아버지께서는 회사에 다니세요.' },
      { label: 'Có thành viên gia đình', kind: 'anyOf', value: ['아버지', '어머니', '할머니', '할아버지', '형', '오빠', '언니', '누나', '동생'], tip: 'Dùng từ chỉ thành viên gia đình.' }] },
    '우리 가족은 네 명이에요. 아버지, 어머니, 여동생 그리고 저예요. 아버지께서는 공무원이세요. 어머니께서는 선생님이세요. 여동생은 열다섯 살이에요. 중학생이에요.', 'Không dùng kính ngữ cho bản thân và em.'),
  ],
};
