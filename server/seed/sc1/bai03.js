// Sơ cấp 1 · Bài 3 — 일상생활 (Sinh hoạt hằng ngày)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const V = [['가다', 'đi'], ['오다', 'đến'], ['자다', 'ngủ'], ['먹다', 'ăn'], ['마시다', 'uống'], ['이야기하다', 'nói chuyện'], ['읽다', 'đọc'], ['보다', 'xem, nhìn'],
  ['일하다', 'làm việc'], ['공부하다', 'học'], ['운동하다', 'tập thể thao'], ['쉬다', 'nghỉ'], ['만나다', 'gặp'], ['사다', 'mua'], ['좋아하다', 'thích']];
const A = [['크다', 'to, lớn'], ['작다', 'nhỏ'], ['많다', 'nhiều'], ['적다', 'ít'], ['좋다', 'tốt'], ['나쁘다', 'xấu, tồi'], ['재미있다', 'hay, thú vị'], ['재미없다', 'không hay']];

module.exports = {
  unit: 3, ko: '일상생활', vi: 'Sinh hoạt hằng ngày', vocabName: 'động từ, tính từ, đồ dùng hằng ngày',
  vocab: [
    ['Động từ (1)', [...V, ['듣다', 'nghe']]],
    ['Tính từ (1)', A],
    ['Từ thường dùng hằng ngày', [['차', 'trà'], ['커피', 'cà phê'], ['빵', 'bánh mì'], ['우유', 'sữa'], ['영화', 'phim'], ['음악', 'âm nhạc'], ['신문', 'báo'], ['친구', 'bạn bè']]],
    ['Đại từ để hỏi', [['무엇', 'cái gì'], ['어디', 'đâu'], ['누구', 'ai'], ['언제', 'khi nào']]],
    ['Từ mới trong bài', [['방', 'phòng'], ['사과', 'quả táo'], ['산책하다', 'đi dạo'], ['쇼핑하다', 'mua sắm'], ['시내', 'trung tâm thành phố'], ['시장', 'chợ'], ['식사하다', 'dùng bữa'], ['아이스크림', 'kem'],
      ['아주', 'rất'], ['여행', 'du lịch'], ['옷', 'quần áo'], ['자주', 'thường xuyên'], ['전화하다', 'gọi điện thoại'], ['지금', 'bây giờ'], ['카페', 'quán cà phê'], ['집', 'nhà']]],
  ],
  vocabNote: 'Động từ “danh từ + 하다” như 공부하다, 운동하다, 이야기하다 có thể chen 을/를: 공부를 하다. Khi 누구 làm chủ ngữ thì thành 누가: 누가 옵니까?',
  vocabMistakes: ['누구가 → sai, phải là 누가.'],
  grammar: [
    {
      name: '-ㅂ/습니다', desc: 'Đuôi câu trần thuật trang trọng của động từ, tính từ.',
      lesson: {
        goal: 'Chia động từ/tính từ ở thể trang trọng.',
        formula: 'Gốc không patchim + ㅂ니다  ·  Gốc có patchim + 습니다',
        explain: 'Bỏ 다 để lấy gốc. Gốc kết thúc bằng nguyên âm thì gắn ㅂ vào âm tiết cuối rồi thêm 니다 (가다 → 갑니다). Gốc có patchim thêm 습니다 (먹다 → 먹습니다). Đuôi này trang trọng, dùng trong thông báo, phát biểu, công việc.',
        examples: [['유진 씨가 잡니다.', 'Yujin ngủ.'], ['학생이 공부합니다.', 'Học sinh học bài.'], ['가방이 작습니다.', 'Cái túi nhỏ.'], ['저는 커피를 마십니다.', 'Tôi uống cà phê.']],
        mistakes: ['먹ㅂ니다 / 가습니다: nhầm điều kiện patchim.', 'Quên bỏ 다: 가다습니다 ✗.'],
      },
      gen: [{ kind: 'verb', form: 'formal', verbs: [...V, ...A], typed: 0.5 }],
      q: [
        fill('Chia động từ: 저는 매일 신문을 (읽다) ___.', ['읽습니다', '읽습니다.'], '읽 có patchim → 읽습니다.'),
        fill('Chia động từ: 친구가 집에 (오다) ___.', ['옵니다', '옵니다.'], '오 không patchim → 옵니다.'),
        err(['저는', '빵을', '먹ㅂ니다.'], 2, '먹 có patchim → 먹습니다.'),
      ],
    },
    {
      name: '-ㅂ/습니까?', desc: 'Đuôi câu hỏi trang trọng.',
      lesson: {
        goal: 'Đặt câu hỏi trang trọng với động từ/tính từ.',
        formula: 'Gốc không patchim + ㅂ니까?  ·  Gốc có patchim + 습니까?',
        explain: 'Cách chọn giống -ㅂ/습니다, chỉ đổi 다 thành 까 và thêm dấu hỏi. Trả lời: 네, …ㅂ/습니다 hoặc 아니요, … .',
        examples: [['지원 씨가 일합니까?', 'Jiwon đang làm việc à?'], ['가방이 큽니까?', 'Cái túi to không?'], ['아니요, 작습니다.', 'Không, nhỏ.'], ['무엇을 마십니까?', 'Bạn uống gì?']],
        mistakes: ['Câu hỏi nhưng dùng 습니다 và chỉ thêm dấu “?” — trong văn trang trọng phải là 습니까?'],
      },
      gen: [{ kind: 'verb', form: 'formal_q', verbs: [['가다', 'đi'], ['먹다', 'ăn'], ['보다', 'xem'], ['읽다', 'đọc'], ['쉬다', 'nghỉ'], ['좋다', 'tốt'], ['많다', 'nhiều'], ['공부하다', 'học'], ['재미있다', 'hay']], typed: 0.3 }],
      q: [
        mc('A: 영화가 재미있습니까?  B: 아니요, ___', ['재미없습니다.', '재미있습니까?', '재미없습니까?', '재미있습니다.'], 'Trả lời phủ định bằng từ trái nghĩa: 재미없습니다.'),
        mc('A: 무엇을 ___?  B: 커피를 마십니다.', ['마십니까', '마십니다', '마시습니까', '마셔요'], '마시다 → 마십니까?'),
      ],
    },
    {
      name: 'N을/를 (tiểu từ tân ngữ)', desc: 'Đánh dấu tân ngữ của động từ.',
      lesson: {
        goal: 'Gắn đúng 을/를 sau tân ngữ.',
        formula: 'Có patchim + 을  ·  Không patchim + 를',
        explain: '을/를 cho biết danh từ là đối tượng chịu tác động của hành động: 빵을 먹습니다 (ăn bánh mì), 친구를 만납니다 (gặp bạn). Trật tự câu tiếng Hàn: Chủ ngữ – Tân ngữ – Động từ.',
        examples: [['지원 씨가 빵을 먹습니다.', 'Jiwon ăn bánh mì.'], ['학생이 책을 읽습니다.', 'Học sinh đọc sách.'], ['준영 씨가 친구를 만납니다.', 'Junyoung gặp bạn.']],
        mistakes: ['Đặt động từ ở giữa câu như tiếng Việt: “저는 먹습니다 빵을” ✗.', '만나다 (gặp) dùng 을/를 chứ không dùng 와/과 như tiếng Việt “gặp với”.'],
        compare: 'Tiếng Việt: Chủ – Động – Tân (tôi ăn cơm); tiếng Hàn: Chủ – Tân – Động (저는 밥을 먹습니다).',
      },
      gen: [{ kind: 'particle', pair: ['을', '를'], note: '(을/를 chọn theo âm cuối của danh từ.)', items: [
        ['빵', '저는 빵___ 먹습니다.'], ['커피', '커피___ 마십니다.'], ['책', '책___ 읽습니다.'], ['영화', '영화___ 봅니다.'], ['친구', '친구___ 만납니다.'], ['음악', '음악___ 듣습니다.'],
        ['우유', '우유___ 삽니다.'], ['신문', '아버지가 신문___ 읽습니다.'], ['사과', '사과___ 좋아합니다.'], ['한국어', '한국어___ 공부합니다.'], ['옷', '시장에서 옷___ 삽니다.'], ['차', '차___ 마십니까?']] }],
      q: [
        ord('Sắp xếp: “Tôi xem phim.”', ['저는', '영화를', '봅니다.'], 'Chủ ngữ – tân ngữ – động từ.'),
        ord('Sắp xếp: “Mai uống sữa.”', ['마이 씨가', '우유를', '마십니다.'], 'Chủ ngữ – tân ngữ – động từ.'),
        tr('Dịch: “Tôi đọc sách.”', ['저는 책을 읽습니다.', '저는 책을 읽습니다', '책을 읽습니다.'], '책 + 을 + 읽습니다.'),
        err(['민수 씨가', '음악을', '듣다습니다.'], 2, 'Bỏ 다 trước khi gắn đuôi: 듣습니다.'),
      ],
    },
    {
      name: 'N에서 (nơi diễn ra hành động)', desc: '“Ở/tại …” với động từ hành động.',
      lesson: {
        goal: 'Phân biệt 에 (tồn tại) và 에서 (nơi hành động diễn ra).',
        formula: 'Nơi chốn + 에서 + động từ hành động',
        explain: '에서 gắn sau nơi chốn để chỉ nơi một hành động xảy ra: 집에서 쉽니다, 은행에서 일합니다. Với 있다/없다 (tồn tại) thì dùng 에.',
        examples: [['흐엉 씨가 집에서 쉽니다.', 'Hương nghỉ ở nhà.'], ['수빈 씨가 은행에서 일합니다.', 'Subin làm việc ở ngân hàng.'], ['카페에서 친구를 만납니다.', 'Gặp bạn ở quán cà phê.']],
        mistakes: ['도서관에 공부합니다 ✗ → 도서관에서 공부합니다.', '교실에서 있습니다 ✗ → 교실에 있습니다.'],
        compare: 'Tiếng Việt dùng chung “ở”; tiếng Hàn tách: 에 + 있다, 에서 + hành động.',
      },
      q: [
        mc('도서관___ 공부합니다.', ['에서', '에'], 'Học là hành động → 에서.', { fixed: true, tag: 'particle', fb: { '에': '에 đi với 있다/없다. Hành động 공부하다 dùng 에서.' } }),
        mc('식당___ 밥을 먹습니다.', ['에서', '에'], 'Ăn là hành động → 에서.', { fixed: true, tag: 'particle' }),
        mc('교실___ 컴퓨터가 있습니다.', ['에', '에서'], '있다 (tồn tại) → 에.', { fixed: true, tag: 'particle' }),
        mc('카페___ 친구를 만납니다.', ['에서', '에'], 'Gặp bạn là hành động → 에서.', { fixed: true, tag: 'particle' }),
        mc('A: 어디에서 일합니까?  B: ___', ['병원에서 일합니다.', '병원에 있습니다.', '병원입니다.', '병원을 일합니다.'], 'Hỏi 어디에서 → trả lời nơi chốn + 에서.'),
        fill('Điền tiểu từ: 공원___ 산책합니다.', ['에서'], 'Đi dạo là hành động → 에서.'),
        tr('Dịch: “Tôi uống cà phê ở quán cà phê.”', ['저는 카페에서 커피를 마십니다.', '카페에서 커피를 마십니다.', '저는 카페에서 커피를 마십니다', '카페에서 커피를 마십니다'], 'Nơi chốn + 에서, tân ngữ + 를, động từ.', { d: 3, common_wrong: [{ text: '카페에 커피를 마십니다', why: 'Uống cà phê là hành động diễn ra ở quán → 카페에서.' }, { text: '카페에서 커피을 마십니다', why: '커피 không có patchim → 커피를.' }] }),
        err(['저는', '시장에', '옷을', '삽니다.'], 1, 'Mua là hành động → 시장에서.', { d: 3 }),
      ],
    },
  ],
  pron: {
    name: 'Mũi hoá ㅂ → [ㅁ]', desc: 'Patchim ㅂ trước ㄴ, ㅁ đọc thành [ㅁ].',
    lesson: { goal: 'Đọc tự nhiên đuôi -ㅂ니다/-습니다.', explain: 'Patchim ㅂ đứng trước ㄴ hoặc ㅁ được đọc thành [ㅁ]. Vì vậy mọi đuôi -ㅂ니다/-습니다 đều đọc là [-ㅁ니다/-슴니다].',
      examples: [['갑니다 → [감니다]', 'đi'], ['합니까 → [함니까]', 'làm à?'], ['먹습니다 → [먹씀니다]', 'ăn'], ['재미있습니다 → [재미읻씀니다]', 'thú vị']] },
    q: [
      mc('갑니다 được đọc là:', ['[감니다]', '[갑니다]', '[간니다]', '[감미다]'], 'ㅂ + ㄴ → [ㅁ].', { fixed: true }),
      mc('먹습니다 được đọc là:', ['[먹씀니다]', '[먹습니다]', '[머습니다]', '[멍씀니다]'], 'Căng hoá ㄱ+ㅅ → [ㅆ], và ㅂ+ㄴ → [ㅁ].', { fixed: true, d: 2 }),
      ls('합니까', ['[함니까]', '[합니까]', '[한니까]', '[하니까]'], 'ㅂ + ㄴ → [ㅁ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true }),
    ],
  },
  listening: {
    desc: 'Nghe câu nói về hoạt động hằng ngày.',
    q: [
      ls('저는 커피를 마십니다.', ['Tôi uống cà phê.', 'Tôi uống trà.', 'Tôi mua cà phê.', 'Tôi thích cà phê.'], '커피 = cà phê; 마시다 = uống.'),
      ls('민수 씨가 도서관에서 공부합니다.', ['Minsu học ở thư viện.', 'Minsu làm việc ở thư viện.', 'Minsu ở thư viện.', 'Minsu đọc sách ở nhà.'], '도서관에서 공부합니다.'),
      ls('누가 옵니까?', ['Ai đến vậy?', 'Khi nào đến?', 'Đến đâu?', 'Bạn đến à?'], '누가 = ai (chủ ngữ).'),
      ls('영화가 재미없습니다.', ['Phim không hay.', 'Phim hay.', 'Không xem phim.', 'Không có phim.'], '재미없다 = không hay.'),
      ls('언제 친구를 만납니까?', ['Khi nào bạn gặp bạn bè?', 'Bạn gặp ai?', 'Bạn gặp bạn ở đâu?', 'Bạn bè đến lúc nào?'], '언제 = khi nào.', { d: 2 }),
    ],
    passages: [{
      title: 'Cuối tuần của Suji', ko: '민준: 수지 씨, 지금 어디에 있습니까?\n수지: 극장에 있습니다.\n민준: 극장에서 무엇을 합니까?\n수지: 영화를 봅니다. 영화가 아주 재미있습니다.\n민준: 극장에 사람이 많습니까?\n수지: 네, 많습니다.',
      q: [
        mc('수지 씨는 지금 어디에 있습니까?', ['극장', '집', '카페', '도서관'], '극장에 있습니다.'),
        mc('수지 씨는 무엇을 합니까?', ['영화를 봅니다.', '커피를 마십니다.', '공부합니다.', '쇼핑합니다.'], '영화를 봅니다.'),
        mc('Câu nào đúng?', ['극장에 사람이 많습니다.', '영화가 재미없습니다.', '극장에 사람이 적습니다.', '수지 씨는 혼자 있습니다.'], '네, 많습니다.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Một ngày của Minjae', ko: '민재 씨는 회사원입니다. 회사에서 일합니다. 점심에 회사 식당에서 밥을 먹습니다. 저녁에 헬스클럽에서 운동합니다. 그리고 집에서 음악을 듣습니다. 민재 씨는 음악을 아주 좋아합니다.',
      vi: 'Minjae là nhân viên công ty, làm việc ở công ty. Buổi trưa ăn ở nhà ăn công ty, buổi tối tập ở câu lạc bộ thể hình, rồi về nhà nghe nhạc. Minjae rất thích âm nhạc.',
      q: [
        mc('민재 씨는 어디에서 운동합니까?', ['헬스클럽', '회사', '집', '공원'], '헬스클럽에서 운동합니다.'),
        mc('민재 씨는 무엇을 좋아합니까?', ['음악', '영화', '커피', '책'], '음악을 아주 좋아합니다.'),
        mc('Câu nào SAI?', ['민재 씨는 집에서 일합니다.', '민재 씨는 회사원입니다.', '민재 씨는 회사 식당에서 밥을 먹습니다.', '민재 씨는 집에서 음악을 듣습니다.'], 'Minjae làm việc ở công ty (회사에서 일합니다).'),
      ],
    }],
  },
  culture: {
    title: 'Những điều người Hàn Quốc yêu thích',
    paras: [
      'Các khảo sát về sở thích của người Hàn thường cho thấy: món ăn được yêu thích hàng đầu là kim chi và các món nướng, hoạt động giải trí phổ biến là xem phim, leo núi, du lịch và gặp gỡ bạn bè ở quán cà phê.',
      'Văn hoá cà phê rất phát triển: các con phố lớn có rất nhiều quán, và “đi cà phê” (카페에 가다) là cách hẹn gặp phổ biến của người trẻ.',
    ],
    compare: 'Người Việt cũng có văn hoá cà phê mạnh; điểm khác là quán ở Hàn thường là chuỗi trong nhà, ít quán vỉa hè.',
  },
  writing: [
    wr('Viết 4 câu về một ngày của bạn bằng đuôi -ㅂ/습니다 (ở đâu, làm gì).', { min_len: 25, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng đuôi -ㅂ/습니다', kind: 'regex', value: '(니다)', tip: 'Ví dụ: 갑니다, 먹습니다.' },
      { label: 'Dùng 에서', kind: 'includes', value: '에서', tip: 'Nơi hành động: 학교에서 공부합니다.' },
      { label: 'Dùng 을/를', kind: 'regex', value: '[가-힣](을|를) ', tip: 'Tân ngữ + 을/를: 빵을 먹습니다.' }] },
    '저는 아침에 빵을 먹습니다. 학교에서 한국어를 공부합니다. 도서관에서 책을 읽습니다. 집에서 쉽니다.', 'Câu theo trật tự: nơi chốn에서 – tân ngữ을/를 – động từ.'),
    wr('Bạn thích gì? Viết 3 câu dùng 좋아합니다.', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng 좋아합니다', kind: 'includes', value: '좋아합니다', tip: 'N을/를 좋아합니다.' },
      { label: 'Dùng 을/를 trước 좋아합니다', kind: 'regex', value: '(을|를) 좋아합니다', tip: '좋아하다 cần tân ngữ + 을/를.' }] },
    '저는 커피를 좋아합니다. 한국 영화를 좋아합니다. 음악도 좋아합니다.', ''),
  ],
};
