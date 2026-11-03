// Sơ cấp 1 · Bài 13 — 생일 (Sinh nhật)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const ASEO = [['작다', 'nhỏ'], ['아프다', 'đau'], ['바쁘다', 'bận'], ['피곤하다', 'mệt'], ['늦다', 'muộn'], ['비싸다', 'đắt'], ['좋다', 'tốt'], ['많다', 'nhiều'], ['덥다', 'nóng'], ['춥다', 'lạnh'], ['맛있다', 'ngon'],
  ['기쁘다', 'vui'], ['배고프다', 'đói'], ['오다', 'đến'], ['만나다', 'gặp'], ['일하다', 'làm việc'], ['멀다', 'xa'], ['어렵다', 'khó']];
const KKA = [['가다', 'đi'], ['먹다', 'ăn'], ['보다', 'xem'], ['만나다', 'gặp'], ['앉다', 'ngồi'], ['사다', 'mua'], ['만들다', 'làm'], ['준비하다', 'chuẩn bị'], ['읽다', 'đọc'], ['부르다', 'hát, gọi'], ['찾다', 'tìm'], ['놀다', 'chơi'], ['듣다', 'nghe'], ['걷다', 'đi bộ']];
const MOT = [['가다', 'đi'], ['먹다', 'ăn'], ['마시다', 'uống'], ['자다', 'ngủ'], ['오다', 'đến'], ['수영하다', 'bơi'], ['운전하다', 'lái xe'], ['숙제하다', 'làm bài tập'], ['읽다', 'đọc'], ['보다', 'xem'], ['만나다', 'gặp'], ['일하다', 'làm việc']];

module.exports = {
  unit: 13, ko: '생일', vi: 'Sinh nhật', vocabName: 'sinh nhật, quà tặng',
  vocab: [
    ['Từ vựng về sinh nhật', [['생일', 'sinh nhật'], ['케이크', 'bánh kem'], ['축하 노래', 'bài hát chúc mừng'], ['잔치', 'tiệc'], ['카드', 'thiệp'], ['초대', 'lời mời'], ['초대하다', 'mời'], ['축하하다', 'chúc mừng'],
      ['나이', 'tuổi'], ['살', 'tuổi (đơn vị)'], ['생신', 'sinh nhật (kính ngữ)'], ['연세', 'tuổi (kính ngữ)'], ['세', 'tuổi (văn viết)'], ['돌', 'thôi nôi'], ['환갑', 'mừng thọ 60 tuổi']]],
    ['Quà tặng', [['지갑', 'cái ví'], ['화장품', 'mỹ phẩm'], ['손수건', 'khăn tay'], ['넥타이', 'cà vạt'], ['귀걸이', 'bông tai'], ['목걸이', 'dây chuyền'], ['반지', 'nhẫn'], ['꽃다발', 'bó hoa'], ['향수', 'nước hoa'], ['스웨터', 'áo len'],
      ['장미', 'hoa hồng'], ['금반지', 'nhẫn vàng'], ['선물을 주다', 'tặng quà'], ['선물을 드리다', 'kính tặng quà'], ['선물을 받다', 'nhận quà'], ['선물을 고르다', 'chọn quà']]],
    ['Từ mới trong bài', [['가볍다', 'nhẹ'], ['무겁다', 'nặng'], ['길다', 'dài'], ['꼭', 'nhất định'], ['먼저', 'trước'], ['끝나다', 'xong, kết thúc'], ['되다', 'trở thành'], ['번째', 'lần thứ'], ['처음', 'lần đầu'], ['레스토랑', 'nhà hàng'],
      ['한식당', 'nhà hàng Hàn'], ['피자', 'pizza'], ['스파게티', 'mì Ý'], ['웃다', 'cười'], ['행복하다', 'hạnh phúc'], ['오래간만이에요', 'lâu rồi không gặp'], ['아빠', 'bố (thân mật)'], ['엄마', 'mẹ (thân mật)'], ['늦다', 'muộn'], ['죄송하다', 'xin lỗi']]],
  ],
  vocabNote: 'Chúc mừng sinh nhật: 생일 축하해요 / 생일 축하합니다. Với người lớn: 생신 축하드립니다. Tặng quà người lớn dùng 드리다.',
  grammar: [
    {
      name: '-아/어서 (vì … nên)', desc: 'Nêu lý do, nguyên nhân.',
      lesson: {
        goal: 'Giải thích lý do.',
        formula: 'ㅏ/ㅗ → 아서 · khác → 어서 · 하다 → 해서 · N(이)라서',
        explain: '-아/어서 nối lý do với kết quả: “vì … nên …”. KHÔNG chia quá khứ ở vế trước (늦었어서 ✗ → 늦어서), và KHÔNG dùng khi vế sau là câu mệnh lệnh -(으)세요 hay rủ rê -(으)ㅂ시다/-(으)ㄹ까요 (khi đó dùng -(으)니까, học ở Sơ cấp 2). Với danh từ dùng (이)라서: 일요일이라서.',
        examples: [['가방이 작아서 불편해요.', 'Túi nhỏ nên bất tiện.'], ['늦어서 죄송합니다.', 'Xin lỗi vì đến muộn.'], ['어제 피곤해서 일찍 잤어요.', 'Hôm qua mệt nên ngủ sớm.'], ['일요일이라서 백화점에 사람이 많아요.', 'Vì là chủ nhật nên trung tâm thương mại đông người.']],
        mistakes: ['늦었어서 ✗ → 늦어서.', '추워서 문을 닫읍시다 ✗ (vế sau rủ rê).', '바쁘어서 ✗ → 바빠서.'],
      },
      gen: [{ kind: 'verb', form: 'aseo', verbs: ASEO, typed: 0.5, d: 2 }],
      q: [
        mc('A: 어제 왜 학교에 안 왔어요?  B: 배가 ___ 병원에 갔어요.', ['아파서', '아팠어서', '아프어서', '아프고'], '아프 → 아파서; không chia quá khứ trước -아/어서.', { fb: { '아팠어서': 'Trước -아/어서 không dùng quá khứ; thì quá khứ đặt ở cuối câu.' } }),
        mc('Câu nào SAI?', ['날씨가 추워서 문을 닫으세요.', '날씨가 추워서 문을 닫았어요.', '비가 와서 집에 있었어요.', '시간이 없어서 못 갔어요.'], 'Vế sau là mệnh lệnh -(으)세요 → không dùng -아/어서.', { d: 3 }),
        mc('A: 왜 한국에 가요?  B: ___', ['한국 친구를 만나고 싶어서 가요.', '한국 친구를 만나고 싶어요서 가요.', '한국 친구를 만나서 싶어요.', '한국 친구를 만났어서 가요.'], '-고 싶다 + 어서 → -고 싶어서.', { d: 3 }),
        fill('Nối câu: 시간이 없어요 + 숙제를 못 했어요 → 시간이 ___ 숙제를 못 했어요.', ['없어서'], '없 + 어서.'),
        tr('Dịch: “Vì bận nên tôi không gặp được bạn.” (dùng 못)', ['바빠서 친구를 못 만났어요.', '바빠서 친구를 못 만나요.', '저는 바빠서 친구를 못 만났어요.', '바빠서 친구를 만나지 못했어요.'], '바쁘 → 바빠서 + 못 만났어요.', { d: 3 }),
      ],
    },
    {
      name: '-(으)ㄹ까요? (… nhé? / … nhỉ?)', desc: 'Hỏi ý kiến, đề nghị; phỏng đoán (ngôi 3).',
      lesson: {
        goal: 'Đề nghị, hỏi ý người nghe.',
        formula: 'Gốc không patchim / gốc ㄹ + ㄹ까요? · có patchim + 을까요?',
        explain: '(우리) V(으)ㄹ까요? = rủ cùng làm, trả lời bằng -(으)ㅂ시다 / 좋아요. (제가) V(으)ㄹ까요? = hỏi “tôi … nhé?”, trả lời -(으)세요. Chủ ngữ ngôi thứ ba: phỏng đoán “… nhỉ?” — 김 선생님이 학교에 계실까요?',
        examples: [['주말에 같이 영화를 볼까요? — 좋아요. 봅시다.', 'Cuối tuần cùng xem phim nhé? — Hay đấy, xem đi.'], ['점심에 뭘 먹을까요? — 불고기를 먹읍시다.', 'Trưa ăn gì nhỉ? — Ăn bulgogi đi.'], ['제가 카메라를 준비할까요? — 네, 준비하세요.', 'Tôi chuẩn bị máy ảnh nhé? — Vâng, chuẩn bị đi.']],
        mistakes: ['먹ㄹ까요 ✗ → 먹을까요.', '만들을까요 ✗ → 만들까요.', 'Trả lời (제가) …ㄹ까요? bằng -(으)ㅂ시다 ✗ → -(으)세요.'],
      },
      gen: [{ kind: 'verb', form: 'lkkayo', verbs: KKA, typed: 0.5 }],
      q: [
        mc('A: 우리 같이 케이크를 ___?  B: 좋아요. 같이 만듭시다.', ['만들까요', '만들을까요', '만드을까요', '만들어까요'], 'Gốc ㄹ: 만들 + 까요.'),
        mc('A: 제가 창문을 열까요?  B: ___', ['네, 열어 주세요.', '네, 엽시다.', '네, 열까요.', '네, 열었어요.'], '“Tôi … nhé?” → trả lời bằng yêu cầu.', { d: 3 }),
        mc('A: 생일 선물로 뭘 살까요?  B: ___', ['지갑을 삽시다.', '지갑을 샀어요.', '지갑을 살까요.', '지갑이 비싸요.'], 'Rủ cùng quyết định → -(으)ㅂ시다.'),
        tr('Dịch: “Chúng ta gặp nhau ở đâu nhỉ?”', ['어디에서 만날까요?', '우리 어디에서 만날까요?', '어디서 만날까요?', '우리 어디서 만날까요?'], '만나 + ㄹ까요?'),
      ],
    },
    {
      name: '못 + V (không thể)', desc: 'Phủ định khả năng: muốn nhưng không thể.',
      lesson: {
        goal: 'Nói “không thể làm”.',
        formula: '못 + động từ · N + 못 하다 (động từ N+하다) · V지 못하다',
        explain: '못 diễn tả chủ ngữ muốn làm nhưng không đủ khả năng hoặc vì hoàn cảnh: 김치를 못 먹어요 (không ăn được kim chi). Với động từ “danh từ + 하다”: 수영 못 해요, 숙제를 못 했어요. Dạng dài: V지 못해요. Chỉ dùng với động từ, không dùng với tính từ.',
        examples: [['저는 김치를 못 먹어요.', 'Tôi không ăn được kim chi.'], ['남 씨는 수영 못 해요.', 'Nam không biết bơi.'], ['어제 시간이 없어서 숙제를 못 했어요.', 'Hôm qua không có thời gian nên không làm được bài tập.']],
        mistakes: ['못 수영해요 ✗ → 수영 못 해요.', 'Dùng 못 với tính từ: 못 예뻐요 ✗.'],
        compare: '안 = không (do không muốn / sự thật); 못 = không thể (muốn nhưng không được).',
      },
      gen: [{ kind: 'verb', form: 'mot', verbs: MOT, typed: 0.4 }],
      q: [
        mc('“Tôi không biết lái xe.”', ['운전 못 해요.', '못 운전해요.', '운전 안 해요.', '운전 못해요요.'], 'N + 못 해요.', { fb: { '운전 안 해요.': '안 = không muốn/không làm; nói “không biết, không thể” dùng 못.' } }),
        mc('Câu nào tự nhiên nhất? “Hôm qua tôi ốm nên không thể đến trường.”', ['어제 아파서 학교에 못 갔어요.', '어제 아파서 학교에 안 갔어요.', '어제 아팠어서 학교에 못 갔어요.', '어제 아파서 못 학교에 갔어요.'], 'Không thể (do hoàn cảnh) → 못; 아파서 không chia quá khứ.', { d: 3 }),
        err(['저는', '어제', '못 숙제했어요.'], 2, 'Động từ N+하다: 숙제를 못 했어요 (못 đứng trước 하다).', { d: 2 }),
        tr('Dịch: “Tôi không uống được cà phê.”', ['커피를 못 마셔요.', '저는 커피를 못 마셔요.', '커피를 마시지 못해요.', '저는 커피를 마시지 못해요.'], '못 + 마셔요.'),
      ],
    },
  ],
  pron: {
    name: 'Vòm hoá ㄷ/ㅌ + 이 → [지/치]', desc: 'Patchim ㄷ, ㅌ gặp 이 đọc thành [지], [치].',
    lesson: { goal: 'Đọc đúng 같이, 맏이, 붙이다…', explain: 'Khi patchim ㄷ hoặc ㅌ gặp nguyên âm 이 (hoặc 히), chúng không nối âm bình thường mà đổi thành [ㅈ], [ㅊ].',
      examples: [['같이 → [가치]', 'cùng nhau'], ['맏이 → [마지]', 'con cả'], ['밑이 → [미치]', 'phía dưới thì…'], ['붙이다 → [부치다]', 'dán'], ['끝이 → [끄치]', 'kết thúc thì…']] },
    q: [
      mc('같이 được đọc là:', ['[가치]', '[가티]', '[갇이]', '[가지]'], 'ㅌ + 이 → [치].', { fixed: true }),
      mc('맏이 được đọc là:', ['[마지]', '[마디]', '[맏이]', '[마치]'], 'ㄷ + 이 → [지].', { fixed: true }),
      ls('끝이에요', ['[끄치에요]', '[끄티에요]', '[끝이에요]', '[끄지에요]'], 'ㅌ + 이 → [치].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 2 }),
    ],
  },
  listening: {
    desc: 'Nghe lời chúc, lời mời, lý do.',
    q: [
      ls('생일 축하해요!', ['Chúc mừng sinh nhật!', 'Cảm ơn món quà!', 'Sinh nhật bạn khi nào?', 'Hãy đến dự tiệc!'], '축하하다 = chúc mừng.'),
      ls('토요일에 우리 집에서 생일 파티를 할까요?', ['Thứ bảy tổ chức tiệc sinh nhật ở nhà mình nhé?', 'Thứ bảy là sinh nhật tôi.', 'Thứ bảy bạn đến nhà tôi chưa?', 'Tiệc sinh nhật ở nhà hàng.'], '-ㄹ까요? = đề nghị.'),
      ls('늦어서 죄송합니다.', ['Xin lỗi vì đến muộn.', 'Xin lỗi, tôi về trước.', 'Cảm ơn vì đã đến.', 'Không sao đâu.'], '늦어서 = vì muộn.'),
      ls('저는 매운 음식을 못 먹어요.', ['Tôi không ăn được đồ cay.', 'Tôi không thích đồ cay.', 'Tôi ăn được đồ cay.', 'Đồ cay không ngon.'], '못 먹다 = không ăn được.'),
      ls('어머니께 꽃다발을 드렸어요.', ['Tôi đã tặng mẹ bó hoa.', 'Mẹ đã tặng tôi bó hoa.', 'Tôi muốn mua bó hoa.', 'Tôi nhận được bó hoa.'], '께 … 드렸어요 = đã kính tặng.', { d: 2 }),
    ],
    passages: [{
      title: 'Chọn quà sinh nhật', ko: '민준: 다음 주 금요일이 수빈 씨 생일이에요. 같이 선물을 살까요?\n란: 좋아요. 뭘 살까요?\n민준: 수빈 씨는 음악을 좋아해서 CD를 사고 싶어요.\n란: 수빈 씨는 요즘 CD를 안 들어요. 휴대폰으로 들어요. 목걸이는 어때요?\n민준: 목걸이는 너무 비싸서 못 사요. 꽃다발하고 케이크를 삽시다.\n란: 좋아요. 그럼 제가 케이크를 준비하겠어요.',
      q: [
        mc('수빈 씨 생일은 언제예요?', ['다음 주 금요일', '이번 주 금요일', '다음 주 토요일', '오늘'], '다음 주 금요일.'),
        mc('왜 목걸이를 안 사요?', ['너무 비싸서', '수빈 씨가 안 좋아해서', '가게가 멀어서', '시간이 없어서'], '너무 비싸서 못 사요.'),
        mc('두 사람은 무엇을 사기로 했어요?', ['꽃다발과 케이크', 'CD와 케이크', '목걸이', '휴대폰'], '꽃다발하고 케이크를 삽시다.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Sinh nhật đáng nhớ', ko: '어제는 제 스무 번째 생일이었어요. 아침에 엄마가 미역국을 만들어 주셨어요. 한국에서는 생일에 미역국을 먹어요. 저녁에는 친구들이 레스토랑에서 파티를 해 주었어요. 친구들이 축하 노래를 부르고 케이크도 주었어요. 저는 너무 행복해서 많이 웃었어요. 그런데 비가 많이 와서 집에 늦게 왔어요.',
      vi: 'Hôm qua là sinh nhật lần thứ 20 của tôi. Sáng mẹ nấu canh rong biển — ở Hàn ngày sinh nhật ăn canh rong biển. Tối bạn bè tổ chức tiệc ở nhà hàng, hát mừng và tặng bánh. Tôi rất hạnh phúc, cười nhiều. Nhưng mưa to nên về nhà muộn.',
      q: [
        mc('이 사람은 몇 살이 되었어요?', ['20 tuổi', '21 tuổi', '19 tuổi', '30 tuổi'], '스무 번째 생일.', { tag: 'number' }),
        mc('한국에서는 생일에 무엇을 먹어요?', ['미역국', '김치찌개', '떡', '비빔밥'], '생일에 미역국을 먹어요.'),
        mc('왜 집에 늦게 왔어요?', ['비가 많이 와서', '파티가 늦게 끝나서', '버스가 없어서', '친구를 만나서'], '비가 많이 와서 집에 늦게 왔어요.'),
      ],
    }],
  },
  culture: {
    title: 'Thôi nôi — sinh nhật đặc biệt của người Hàn',
    paras: [
      'Sinh nhật tròn 1 tuổi gọi là 돌 (thôi nôi). Ngày xưa tỉ lệ trẻ sơ sinh tử vong cao nên việc em bé tròn một tuổi được xem là cột mốc rất đáng mừng.',
      'Trong tiệc 돌, em bé mặc hanbok và tham gia nghi thức 돌잡이: chọn một trong các đồ vật bày trước mặt. Mỗi đồ vật mang ý nghĩa: sợi chỉ – sống lâu, tiền – giàu có, bút/sách – học giỏi; ngày nay có thêm micro, ống nghe, bóng…',
      'Khách mời thường tặng nhẫn vàng nhỏ (금반지). Ngoài 돌, tiệc mừng thọ 60 tuổi (환갑) cũng là dịp quan trọng.',
    ],
    compare: 'Việt Nam cũng có lễ thôi nôi với tục “bắt đồ vật đoán tương lai” rất giống 돌잡이.',
  },
  writing: [
    wr('Viết thiệp mời bạn đến tiệc sinh nhật (3–4 câu, dùng -(으)ㄹ까요? hoặc -(으)세요).', { min_len: 30, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có thời gian, địa điểm', kind: 'regex', value: '(시|요일|일)에', tip: 'Ví dụ: 토요일 여섯 시에.' },
      { label: 'Có lời mời', kind: 'regex', value: '(까요\\?|오세요|와 주세요|초대)', tip: 'Ví dụ: 우리 집에 오세요.' }] },
    '다음 주 토요일이 제 생일이에요. 저녁 여섯 시에 우리 집에서 파티를 해요. 꼭 오세요. 같이 맛있는 음식을 먹을까요?', ''),
    wr('Kể lý do một việc bạn không làm được tuần này (2–3 câu, dùng -아/어서 và 못).', { min_len: 20, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -아/어서', kind: 'regex', value: '(아서|어서|해서|워서|라서|와서|봐서|져서)', tip: 'Lý do + 아/어서.' },
      { label: 'Dùng 못', kind: 'regex', value: '못 ', tip: '못 + động từ.' }] },
    '이번 주에 일이 많아서 운동을 못 했어요. 그리고 감기에 걸려서 친구 생일 파티에 못 갔어요.', ''),
  ],
};
