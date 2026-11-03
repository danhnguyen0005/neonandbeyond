// Sơ cấp 1 · Bài 6 — 주말 (Cuối tuần)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const PAST = [['가다', 'đi'], ['오다', 'đến'], ['보다', 'xem'], ['먹다', 'ăn'], ['마시다', 'uống'], ['읽다', 'đọc'], ['만나다', 'gặp'], ['쉬다', 'nghỉ'], ['배우다', 'học'], ['자다', 'ngủ'],
  ['사다', 'mua'], ['받다', 'nhận'], ['보내다', 'gửi; trải qua'], ['등산하다', 'leo núi'], ['쇼핑하다', 'mua sắm'], ['수영하다', 'bơi'], ['외식하다', 'ăn ngoài'], ['산책하다', 'đi dạo'],
  ['여행하다', 'du lịch'], ['좋다', 'tốt'], ['많다', 'nhiều'], ['재미있다', 'thú vị'], ['피곤하다', 'mệt'], ['싫어하다', 'ghét'], ['일하다', 'làm việc'], ['요리하다', 'nấu ăn']];
const SUG = [['가다', 'đi'], ['보다', 'xem'], ['먹다', 'ăn'], ['읽다', 'đọc'], ['만나다', 'gặp'], ['쉬다', 'nghỉ'], ['마시다', 'uống'], ['공부하다', 'học'], ['등산하다', 'leo núi'], ['산책하다', 'đi dạo'],
  ['만들다', 'làm (đồ ăn)'], ['놀다', 'chơi'], ['앉다', 'ngồi'], ['찾다', 'tìm'], ['시작하다', 'bắt đầu'], ['타다', 'đi (xe)']];

module.exports = {
  unit: 6, ko: '주말', vi: 'Cuối tuần', vocabName: 'từ để hỏi, hoạt động cuối tuần',
  vocab: [
    ['Từ để hỏi (định từ)', [['무슨', 'gì (loại gì)'], ['어떤', '(thế) nào'], ['어느', 'nào (trong số)']]],
    ['Hoạt động cuối tuần', [['등산하다', 'leo núi'], ['영화를 보다', 'xem phim'], ['운동하다', 'vận động'], ['여행하다', 'du lịch'], ['쇼핑하다', 'mua sắm'], ['수영하다', 'bơi'], ['쉬다', 'nghỉ'], ['외식하다', 'ăn ngoài'],
      ['친구를 만나다', 'gặp bạn'], ['산책하다', 'đi dạo'], ['소풍 가다', 'đi dã ngoại'], ['책을 읽다', 'đọc sách']]],
    ['Từ mới trong bài', [['가수', 'ca sĩ'], ['갈비', 'sườn nướng'], ['불고기', 'thịt bò xào/nướng'], ['비빔밥', 'cơm trộn'], ['김밥', 'cơm cuộn'], ['라면', 'mì gói'], ['개', 'con chó'], ['고양이', 'con mèo'],
      ['새', 'con chim'], ['동물', 'động vật'], ['나무', 'cây'], ['바다', 'biển'], ['과일', 'hoa quả'], ['딸기', 'dâu tây'], ['포도', 'nho'], ['배', 'quả lê'], ['선물', 'quà tặng'], ['골프', 'gôn'], ['낚시', 'câu cá'],
      ['농구', 'bóng rổ'], ['야구', 'bóng chày'], ['테니스', 'quần vợt'], ['공포 영화', 'phim kinh dị'], ['액션 영화', 'phim hành động'], ['드라마', 'phim truyền hình'], ['빨래하다', 'giặt đồ'], ['요리하다', 'nấu ăn'],
      ['싫어하다', 'ghét'], ['피곤하다', 'mệt'], ['일찍', 'sớm'], ['춤을 추다', 'nhảy múa'], ['치다', 'chơi (đánh bóng, đàn)'], ['보내다', 'trải qua (thời gian)']]],
  ],
  vocabNote: '무슨: hỏi loại gì (무슨 영화? phim gì?). 어떤: hỏi tính chất (어떤 사람? người thế nào?). 어느: chọn một trong số (어느 나라? nước nào?).',
  vocabMistakes: ['Hỏi quốc tịch: 어느 나라 사람이에요? (không dùng 무슨 나라).'],
  grammar: [
    {
      name: '-았/었- (quá khứ)', desc: 'Diễn tả sự việc đã xảy ra.',
      lesson: {
        goal: 'Nói về việc đã làm (cuối tuần trước, hôm qua…).',
        formula: 'ㅏ/ㅗ → 았어요 · nguyên âm khác → 었어요 · 하다 → 했어요 · N이었어요/였어요',
        explain: 'Chọn 았/었 giống quy tắc -아/어요, rồi thêm 어요 (hoặc 습니다). Gốc không patchim rút gọn: 가다 → 갔어요, 보다 → 봤어요, 마시다 → 마셨어요. Danh từ: có patchim + 이었어요, không patchim + 였어요.',
        examples: [['지난 주말에 여행을 갔어요.', 'Cuối tuần trước tôi đi du lịch.'], ['극장에서 영화를 봤어요.', 'Tôi đã xem phim ở rạp.'], ['어제 뭘 했어요? — 도서관에서 숙제했어요.', 'Hôm qua làm gì? — Làm bài tập ở thư viện.'], ['아버지는 의사였어요.', 'Bố tôi (đã) là bác sĩ.']],
        mistakes: ['먹았어요 ✗ → 먹었어요.', '하었어요 ✗ → 했어요.', 'Quên dùng quá khứ khi có 어제, 지난주…'],
      },
      gen: [{ kind: 'verb', form: 'past', verbs: PAST, typed: 0.5 }],
      q: [
        mc('A: 어제 뭐 했어요?  B: 친구를 ___', ['만났어요.', '만나요.', '만납시다.', '만났습니까?'], 'Hôm qua → quá khứ 만났어요.'),
        mc('Câu nào đúng?', ['어제 비빔밥을 먹었어요.', '어제 비빔밥을 먹어요.', '내일 비빔밥을 먹었어요.', '어제 비빔밥을 먹았어요.'], '어제 + quá khứ; 먹 → 었.'),
        fill('Chia quá khứ: 지난 주말에 바다에 (가다) ___.', ['갔어요', '갔어요.', '갔습니다', '갔습니다.'], '가 + 았어요 → 갔어요.'),
        fill('Điền 이었어요/였어요: 여기는 도서관___. 지금은 식당이에요.', ['이었어요', '이었어요.'], '도서관 có patchim → 이었어요.'),
        err(['저는', '어제', '집에서', '쉬였어요.'], 3, '쉬 + 었어요 → 쉬었어요.'),
        tr('Dịch: “Cuối tuần trước tôi đã leo núi.”', ['지난 주말에 등산했어요.', '지난 주말에 등산을 했어요.', '저는 지난 주말에 등산했어요.', '지난주 주말에 등산했어요.'], '지난 주말에 + 등산했어요.'),
      ],
    },
    {
      name: 'N하고 (và, cùng với)', desc: 'Nối danh từ (văn nói) và chỉ người cùng làm.',
      lesson: {
        goal: 'Nối danh từ và nói “làm cùng ai”.',
        formula: 'N + 하고 (không phân biệt patchim)  ·  N하고 (같이) + V',
        explain: '하고 nghĩa giống 와/과 nhưng dùng nhiều trong văn nói và không cần xét patchim. Ngoài nối danh từ, 하고 còn chỉ người cùng tham gia: 친구하고 공부했어요 (học cùng bạn), thường đi với 같이 (cùng nhau).',
        examples: [['가게에서 빵하고 우유를 샀어요.', 'Tôi đã mua bánh mì và sữa ở cửa hàng.'], ['어제 친구하고 도서관에서 공부했어요.', 'Hôm qua tôi học ở thư viện cùng bạn.'], ['불고기하고 갈비를 좋아해요.', 'Tôi thích bulgogi và galbi.']],
        mistakes: ['Viết 하고 cách ra: 빵 하고 → viết liền 빵하고.', 'Với người lớn, nên dùng (와/과) 함께 trong văn viết trang trọng.'],
        compare: '와/과 (văn viết, xét patchim) ≈ 하고 (văn nói, không xét patchim).',
      },
      q: [
        mc('“Tôi mua sách và vở.”', ['책하고 공책을 샀어요.', '책하고 공책하고를 샀어요.', '책와 공책을 샀어요.', '책을 하고 공책 샀어요.'], 'N하고 N + 을/를.'),
        mc('“Hôm qua tôi đi xem phim cùng em gái.”', ['어제 여동생하고 영화를 봤어요.', '어제 여동생을 영화를 봤어요.', '어제 여동생에서 영화를 봤어요.', '어제 여동생하고 영화를 봐요.'], 'Người cùng làm + 하고; hôm qua → quá khứ.'),
        fill('Điền tiểu từ “cùng với”: 주말에 가족___ 외식했어요.', ['하고', '과', '와 함께', '하고 같이'], 'Người cùng làm → 하고.'),
        tr('Dịch: “Tôi thích chó và mèo.”', ['개하고 고양이를 좋아해요.', '저는 개하고 고양이를 좋아해요.', '개와 고양이를 좋아해요.', '저는 개와 고양이를 좋아해요.'], 'N하고 N을/를 좋아해요.'),
        ord('Sắp xếp: “Tôi đã học cùng bạn ở thư viện.”', ['친구하고', '도서관에서', '공부했어요.'], 'Người cùng làm하고 – nơi chốn에서 – động từ.'),
      ],
    },
    {
      name: '-(으)ㅂ시다 (hãy cùng …)', desc: 'Rủ rê, đề nghị cùng làm.',
      lesson: {
        goal: 'Rủ ai đó cùng làm gì.',
        formula: 'Gốc không patchim + ㅂ시다 · có patchim + 읍시다 · gốc ㄹ: bỏ ㄹ + ㅂ시다',
        explain: '-(으)ㅂ시다 dùng với người ngang hàng hoặc ít tuổi hơn để rủ cùng làm. Không dùng với người lớn tuổi/cấp trên (với họ nên nói -(으)시지요 hoặc hỏi -(으)ㄹ까요?). Gốc tận cùng ㄹ: 만들다 → 만듭시다.',
        examples: [['우리 같이 영화를 봅시다.', 'Chúng ta cùng xem phim nhé.'], ['오늘은 한국 음식을 먹읍시다.', 'Hôm nay hãy ăn món Hàn.'], ['저녁 식사를 같이 만듭시다.', 'Cùng nấu bữa tối nhé.']],
        mistakes: ['먹ㅂ시다 ✗ → 먹읍시다.', '만들읍시다 ✗ → 만듭시다.', 'Rủ thầy cô bằng -ㅂ시다 → thiếu lịch sự.'],
      },
      gen: [{ kind: 'verb', form: 'bsida', verbs: SUG, typed: 0.4 }],
      q: [
        mc('A: 주말에 뭐 할까요?  B: 같이 ___', ['등산합시다.', '등산했어요.', '등산합니까?', '등산읍시다.'], 'Rủ rê: 등산하다 → 등산합시다.'),
        mc('Nói với bạn: “Cùng ngồi đây nhé.”', ['여기에 앉읍시다.', '여기에 앉ㅂ시다.', '여기에 앉았어요.', '여기에서 앉읍시다.'], '앉 có patchim → 앉읍시다.'),
        err(['우리', '같이', '점심을', '먹ㅂ시다.'], 3, '먹 có patchim → 먹읍시다.'),
      ],
    },
  ],
  pron: {
    name: 'Bật hơi hoá (격음화)', desc: 'ㄱ, ㄷ, ㅂ, ㅈ gặp ㅎ → ㅋ, ㅌ, ㅍ, ㅊ.',
    lesson: { goal: 'Đọc đúng khi patchim gặp ㅎ.', explain: 'Patchim ㄱ, ㄷ, ㅂ, ㅈ đứng trước ㅎ (hoặc ㅎ đứng trước ㄱ, ㄷ, ㅈ) thì hợp lại thành âm bật hơi ㅋ, ㅌ, ㅍ, ㅊ.',
      examples: [['축하하다 → [추카하다]', 'chúc mừng'], ['도착하다 → [도차카다]', 'đến nơi'], ['백화점 → [배콰점]', 'trung tâm thương mại'], ['입학 → [이팍]', 'nhập học']] },
    q: [
      mc('축하합니다 được đọc là:', ['[추카함니다]', '[축하합니다]', '[추가함니다]', '[축카합니다]'], 'ㄱ + ㅎ → [ㅋ]; ㅂ + ㄴ → [ㅁ].', { fixed: true }),
      mc('백화점 được đọc là:', ['[배콰점]', '[백화점]', '[배과점]', '[백콰점]'], 'ㄱ + ㅎ → [ㅋ].', { fixed: true }),
      ls('도착했어요', ['[도차캐써요]', '[도착해써요]', '[도차개써요]', '[도착캐서요]'], 'ㄱ + ㅎ → [ㅋ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 2 }),
    ],
  },
  listening: {
    desc: 'Nghe kể chuyện cuối tuần và lời rủ rê.',
    q: [
      ls('지난 주말에 등산했어요.', ['Cuối tuần trước tôi leo núi.', 'Cuối tuần này tôi leo núi.', 'Cuối tuần trước tôi bơi.', 'Cuối tuần sau leo núi nhé.'], '지난 주말 = cuối tuần trước.'),
      ls('어제 친구하고 쇼핑했어요.', ['Hôm qua tôi đi mua sắm cùng bạn.', 'Hôm nay tôi đi mua sắm cùng bạn.', 'Hôm qua tôi gặp bạn.', 'Hôm qua tôi mua quà cho bạn.'], '쇼핑했어요 = đã mua sắm.'),
      ls('같이 점심을 먹읍시다.', ['Cùng ăn trưa nhé.', 'Tôi đã ăn trưa.', 'Bạn ăn trưa chưa?', 'Tôi không ăn trưa.'], '-읍시다 = rủ rê.'),
      ls('무슨 영화를 좋아해요?', ['Bạn thích phim gì?', 'Bạn xem phim ở đâu?', 'Bạn có thích phim không?', 'Phim có hay không?'], '무슨 = gì (loại).'),
      ls('어느 나라 사람이에요?', ['Bạn là người nước nào?', 'Bạn đi nước nào?', 'Nước bạn ở đâu?', 'Bạn thích nước nào?'], '어느 = nào.', { d: 2 }),
    ],
    passages: [{
      title: 'Cuối tuần vừa rồi', ko: '마이: 투안 씨, 주말에 뭐 했어요?\n투안: 토요일에 친구하고 바다에 갔어요. 수영했어요.\n마이: 일요일에는요?\n투안: 일요일에는 집에서 쉬었어요. 좀 피곤했어요. 마이 씨는요?\n마이: 저는 백화점에서 쇼핑했어요. 그리고 가족하고 외식했어요.\n투안: 다음 주말에는 같이 등산합시다.',
      q: [
        mc('투안 씨는 토요일에 무엇을 했어요?', ['바다에서 수영했어요.', '집에서 쉬었어요.', '쇼핑했어요.', '등산했어요.'], '토요일에 바다에 갔어요. 수영했어요.'),
        mc('마이 씨는 누구하고 외식했어요?', ['가족', '친구', '투안 씨', '선생님'], '가족하고 외식했어요.'),
        mc('다음 주말에 두 사람은 무엇을 할 거예요?', ['등산', '수영', '쇼핑', '외식'], '같이 등산합시다.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Nhật ký chủ nhật', ko: '오늘은 일요일이었어요. 아침에 일찍 일어났어요. 공원에서 산책했어요. 날씨가 아주 좋았어요. 점심에 친구하고 김밥하고 라면을 먹었어요. 오후에는 극장에서 액션 영화를 봤어요. 영화가 정말 재미있었어요. 저녁에는 집에서 빨래했어요.',
      vi: 'Hôm nay chủ nhật. Sáng dậy sớm, đi dạo ở công viên, trời rất đẹp. Trưa ăn kimbap và mì với bạn. Chiều xem phim hành động ở rạp, phim rất hay. Tối giặt đồ ở nhà.',
      q: [
        mc('아침에 무엇을 했어요?', ['공원에서 산책했어요.', '영화를 봤어요.', '빨래했어요.', '라면을 먹었어요.'], '아침에… 공원에서 산책했어요.'),
        mc('무슨 영화를 봤어요?', ['액션 영화', '공포 영화', '한국 드라마', '만화 영화'], '액션 영화를 봤어요.'),
        mc('Câu nào đúng?', ['저녁에 집에서 빨래했어요.', '날씨가 나빴어요.', '혼자 점심을 먹었어요.', '영화가 재미없었어요.'], '저녁에는 집에서 빨래했어요.'),
      ],
    }],
  },
  culture: {
    title: 'Hoạt động cuối tuần của người Hàn Quốc',
    paras: [
      'Từ khi áp dụng tuần làm việc 5 ngày, người Hàn dành cuối tuần nhiều hơn cho nghỉ ngơi và giải trí: leo núi, xem phim, du lịch gần, cắm trại.',
      'Leo núi (등산) đặc biệt phổ biến vì Hàn Quốc có nhiều núi ngay sát thành phố; cuối tuần dễ thấy những đoàn người mặc đồ leo núi sặc sỡ trên tàu điện ngầm.',
      'Giới trẻ thích đi cà phê, xem phim, chơi ở phòng karaoke (노래방) hoặc phòng game; nhiều gia đình đi ăn ngoài (외식) vào cuối tuần.',
    ],
    compare: 'Cuối tuần ở Việt Nam thường gắn với họp mặt gia đình, đi cà phê, về quê; leo núi chưa phổ biến bằng ở Hàn.',
  },
  writing: [
    wr('Cuối tuần trước bạn đã làm gì? Viết 4 câu (quá khứ -았/었어요).', { min_len: 30, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có mốc thời gian quá khứ', kind: 'anyOf', value: ['지난', '어제', '토요일', '일요일', '주말'], tip: 'Ví dụ: 지난 주말에, 토요일에.' },
      { label: 'Dùng quá khứ -았/었-', kind: 'regex', value: '(았|었|했|갔|봤|왔|셨|웠|냈|났|샀|잤)어요', tip: 'Ví dụ: 갔어요, 먹었어요, 했어요.' },
      { label: 'Dùng 하고', kind: 'includes', value: '하고', tip: 'Ai cùng làm: 친구하고.' }] },
    '지난 주말에 친구하고 시내에 갔어요. 백화점에서 쇼핑했어요. 식당에서 불고기를 먹었어요. 정말 재미있었어요.', 'Đừng quên dùng quá khứ khi có “지난 주말”.'),
    wr('Viết tin nhắn rủ bạn đi chơi cuối tuần này (2–3 câu, dùng -(으)ㅂ시다).', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -(으)ㅂ시다', kind: 'regex', value: '(ㅂ시다|읍시다|합시다|갑시다|봅시다|납시다)', tip: 'Ví dụ: 같이 영화를 봅시다.' },
      { label: 'Có 같이', kind: 'includes', value: '같이', tip: '같이 = cùng nhau.' }] },
    '민수 씨, 이번 주말에 시간이 있어요? 같이 영화를 봅시다. 그리고 저녁도 같이 먹읍시다.', ''),
  ],
};
