// Sơ cấp 1 · Bài 12 — 전화 (Điện thoại)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const JIMAN = [['어렵다', 'khó'], ['비싸다', 'đắt'], ['작다', 'nhỏ'], ['좋다', 'tốt'], ['맵다', 'cay'], ['바쁘다', 'bận'], ['먹다', 'ăn'], ['배우다', 'học'], ['춥다', 'lạnh'], ['많다', 'nhiều'], ['피곤하다', 'mệt'], ['멀다', 'xa']];
const RYEOGO = [['가다', 'đi'], ['배우다', 'học'], ['먹다', 'ăn'], ['읽다', 'đọc'], ['살다', 'sống'], ['만들다', 'làm'], ['보내다', 'gửi'], ['전화하다', 'gọi điện'], ['찾다', 'tìm'], ['입다', 'mặc'], ['쉬다', 'nghỉ'], ['놀다', 'chơi'], ['듣다', 'nghe'], ['사다', 'mua']];

module.exports = {
  unit: 12, ko: '전화', vi: 'Điện thoại', vocabName: 'điện thoại, cách nói khi gọi điện',
  vocab: [
    ['Từ liên quan đến điện thoại', [['집 전화', 'điện thoại nhà'], ['공중전화', 'điện thoại công cộng'], ['휴대전화', 'điện thoại di động'], ['휴대폰', 'điện thoại di động (nói)'], ['핸드폰', 'điện thoại di động (nói)'],
      ['전화번호', 'số điện thoại'], ['연락처', 'số liên lạc'], ['전화 요금', 'cước điện thoại'], ['전화 카드', 'thẻ điện thoại'], ['국내 전화', 'gọi trong nước'], ['국제전화', 'gọi quốc tế'], ['수신자 부담', 'người nhận trả tiền'],
      ['인터넷 전화', 'điện thoại internet'], ['국가 번호', 'mã quốc gia'], ['지역 번호', 'mã vùng']]],
    ['Biểu hiện về điện thoại', [['전화를 걸다', 'gọi điện'], ['전화가 오다', 'có cuộc gọi đến'], ['전화를 받다', 'nghe máy'], ['전화를 바꾸다', 'chuyển máy'], ['전화를 끊다', 'cúp máy'], ['통화 중이다', 'máy bận'],
      ['문자 메시지를 보내다', 'gửi tin nhắn'], ['문자 메시지를 받다', 'nhận tin nhắn'], ['답장을 보내다', 'gửi trả lời'], ['답장을 받다', 'nhận trả lời']]],
    ['Câu nói khi gọi điện', [['여보세요?', 'A lô?'], ['그런데요?', 'Vâng, có chuyện gì ạ?'], ['실례지만 누구세요?', 'Xin lỗi, ai đấy ạ?'], ['지금 없는데요.', 'Bây giờ không có ở đây.'], ['바꿔 주시겠어요?', 'Chuyển máy giúp tôi được không?'],
      ['잠깐 외출하셨는데요.', 'Vừa ra ngoài một lúc.'], ['메모 좀 전해 주세요.', 'Nhờ chuyển lời nhắn giúp.'], ['말씀 전해 드리겠습니다.', 'Tôi sẽ chuyển lời.'], ['다시 전화하겠습니다.', 'Tôi sẽ gọi lại.'], ['누구라고 전해 드릴까요?', 'Tôi nhắn lại là ai gọi ạ?'], ['잠깐만 기다리세요.', 'Xin đợi một lát.']]],
    ['Từ mới trong bài', [['약속', 'cuộc hẹn'], ['대사관', 'đại sứ quán'], ['사장님', 'giám đốc'], ['역사', 'lịch sử'], ['짐', 'hành lý'], ['소리', 'âm thanh'], ['들어오다', 'đi vào'], ['출발하다', 'xuất phát'], ['정하다', 'quyết định'],
      ['남기다', 'để lại'], ['맞다', 'đúng'], ['늦게', 'muộn'], ['드리다', 'biếu, đưa (kính ngữ)'], ['선물', 'quà'], ['주다', 'cho, tặng'], ['연락하다', 'liên lạc']]],
  ],
  vocabNote: 'Nhấc máy: 여보세요? Hỏi người cần gặp: 거기 ○○ 씨 댁이지요? / ○○ 씨 계세요? 휴대전화 trong văn nói thường là 휴대폰, 핸드폰.',
  grammar: [
    {
      name: 'N에게 / 한테 / 께', desc: 'Tiểu từ chỉ người nhận: “cho …, với …”.',
      lesson: {
        goal: 'Nói đối tượng nhận hành động (gọi cho, tặng cho, gửi cho).',
        formula: 'Người + 에게 (nói & viết) · 한테 (văn nói) · 께 (kính ngữ, người bề trên)',
        explain: 'Dùng với động từ trao – nhận, liên lạc: 주다, 보내다, 전화하다, 이야기하다, 가르치다. 한테 thân mật trong văn nói; 에게 dùng cả nói và viết; 께 dành cho người bề trên, thường đi với 드리다 (kính ngữ của 주다). Chỉ dùng cho người/động vật; nơi chốn dùng 에.',
        examples: [['란 씨가 안 씨에게 선물을 주었습니다.', 'Lan tặng quà cho An.'], ['제가 안 씨한테 전화했어요.', 'Tôi đã gọi điện cho An.'], ['선생님께 전화를 드리세요.', 'Hãy gọi điện cho thầy.'], ['친구에게 문자를 보냈어요.', 'Tôi đã gửi tin nhắn cho bạn.']],
        mistakes: ['Dùng 에게 với nơi chốn: 회사에게 ✗ → 회사에.', 'Dùng 께 nhưng vẫn dùng 주다: 할머니께 선물을 줬어요 → 드렸어요.'],
      },
      q: [
        mc('친구___ 문자 메시지를 보냈어요.', ['에게', '에', '에서', '께서'], 'Người nhận → 에게/한테.', { fixed: true, tag: 'particle', fb: { '에': '에 dùng cho nơi chốn; người nhận dùng 에게/한테.' } }),
        mc('“Tôi biếu bà món quà.”', ['할머니께 선물을 드렸어요.', '할머니께 선물을 줬어요.', '할머니한테 선물을 드세요.', '할머니께서 선물을 드렸어요.'], 'Người bề trên: 께 + 드리다.', { d: 3 }),
        mc('“Tôi gửi thư đến công ty.”', ['회사에 편지를 보냈어요.', '회사에게 편지를 보냈어요.', '회사한테 편지를 보냈어요.', '회사께 편지를 보냈어요.'], 'Nơi chốn/tổ chức → 에.', { d: 3 }),
        fill('Điền (văn nói): 어제 동생___ 전화했어요.', ['한테', '에게'], 'Người nhận → 한테/에게.'),
        tr('Dịch: “Tôi đã gọi điện cho mẹ.” (dùng 에게 hoặc 한테)', ['어머니에게 전화했어요.', '어머니한테 전화했어요.', '엄마한테 전화했어요.', '엄마에게 전화했어요.', '어머니께 전화했어요.', '어머니께 전화를 드렸어요.'], 'Người nhận + 에게/한테 + 전화했어요.'),
        err(['저는', '선생님한테', '선물을', '드렸어요.'], 1, 'Với người bề trên và 드리다 nên dùng 선생님께.', { d: 3 }),
      ],
    },
    {
      name: '-지만 (nhưng)', desc: 'Nối hai vế đối lập.',
      lesson: {
        goal: 'Nối hai ý trái ngược.',
        formula: 'Gốc V/A + 지만 (quá khứ: 았/었지만) · N이지만/(이)지만',
        explain: '-지만 nối hai mệnh đề có nội dung trái ngược, nghĩa “nhưng”. Gắn thẳng vào gốc; quá khứ: 힘들었지만. Với danh từ: 학생이지만, 의사지만.',
        examples: [['한국어는 어렵지만 재미있어요.', 'Tiếng Hàn khó nhưng thú vị.'], ['교실 밖은 춥지만 교실 안은 따뜻합니다.', 'Ngoài lớp lạnh nhưng trong lớp ấm.'], ['여행은 힘들었지만 즐거웠어요.', 'Chuyến đi mệt nhưng vui.']],
        mistakes: ['Dùng -지만 cho hai ý cùng chiều: 크지만 넓어요 ✗ → 크고 넓어요.', '어려워지만 ✗ → 어렵지만 (gắn vào gốc, không vào dạng -아/어).'],
        compare: '-고 (và) nối ý cùng chiều; -지만 (nhưng) nối ý ngược chiều.',
      },
      gen: [{ kind: 'verb', form: 'jiman', verbs: JIMAN, typed: 0.4 }],
      q: [
        mc('“Món này cay nhưng ngon.”', ['이 음식은 맵지만 맛있어요.', '이 음식은 매워지만 맛있어요.', '이 음식은 맵고 맛없어요.', '이 음식은 맵지만 맛없지만.'], 'Gốc 맵 + 지만.'),
        mc('Chọn cách nối hợp nghĩa: 날씨가 좋아요 / 집에 있어요', ['날씨가 좋지만 집에 있어요.', '날씨가 좋고 집에 있어요.', '날씨가 좋아서 집에 있어요.', '날씨가 좋지만 밖에 나가요.'], 'Hai ý trái ngược (trời đẹp ↔ ở nhà) → -지만.', { d: 2 }),
        fill('Nối câu: 한국어는 어려워요 + 재미있어요 → 한국어는 ___ 재미있어요.', ['어렵지만'], 'Gốc 어렵 + 지만.'),
        tr('Dịch: “Tôi là học sinh nhưng không học.”', ['저는 학생이지만 공부를 안 해요.', '저는 학생이지만 공부 안 해요.', '저는 학생이지만 공부하지 않아요.', '학생이지만 공부를 안 해요.'], 'N이지만.', { d: 3 }),
      ],
    },
    {
      name: '-(으)려고 하다 (định làm)', desc: 'Ý định, dự định làm gì.',
      lesson: {
        goal: 'Nói dự định của mình.',
        formula: 'Gốc không patchim / gốc ㄹ + 려고 하다 · có patchim + 으려고 하다',
        explain: 'Diễn tả ý định của chủ ngữ: “định …”. Gốc ㄹ chỉ thêm 려고: 살다 → 살려고 해요. Quá khứ -(으)려고 했어요 = đã định (nhưng có thể không làm).',
        examples: [['이번 겨울방학에 수영을 배우려고 합니다.', 'Kỳ nghỉ đông này tôi định học bơi.'], ['10년 후에 고향에서 살려고 해요.', '10 năm nữa tôi định sống ở quê.'], ['주말에 한국 음식을 먹으려고 해요.', 'Cuối tuần tôi định ăn món Hàn.']],
        mistakes: ['먹려고 ✗ → 먹으려고.', '살으려고 ✗ → 살려고.'],
        compare: '-고 싶다 (muốn) ↔ -(으)려고 하다 (định, có kế hoạch hơn) ↔ -(으)ㄹ 거예요 (sẽ).',
      },
      gen: [{ kind: 'verb', form: 'ryeogo_hada', verbs: RYEOGO, typed: 0.5 }],
      q: [
        mc('A: 방학에 뭐 할 거예요?  B: 한국어를 ___', ['배우려고 해요.', '배우으려고 해요.', '배워려고 해요.', '배우려고 했어요?'], '배우 + 려고 해요.'),
        mc('“Tôi định gửi tin nhắn cho bạn.”', ['친구에게 문자를 보내려고 해요.', '친구에게 문자를 보내으려고 해요.', '친구에서 문자를 보내려고 해요.', '친구에게 문자를 보내고 해요.'], '보내 + 려고 해요.'),
        err(['저녁에', '친구하고', '밥을', '먹려고 해요.'], 3, '먹 có patchim → 먹으려고 해요.'),
      ],
    },
  ],
  pron: {
    name: 'Lỏng hoá ㄴ + ㄹ → [ㄹㄹ]', desc: 'ㄴ đứng trước/sau ㄹ đọc thành [ㄹ].',
    lesson: { goal: 'Đọc đúng 연락, 설날…', explain: 'ㄴ và ㄹ không đọc liền nhau được, nên ㄴ đứng trước hoặc sau ㄹ biến thành [ㄹ].',
      examples: [['연락 → [열락]', 'liên lạc'], ['설날 → [설랄]', 'Tết'], ['한라산 → [할라산]', 'núi Halla'], ['난로 → [날로]', 'lò sưởi'], ['칠 년 → [칠련]', 'bảy năm']] },
    q: [
      mc('연락 được đọc là:', ['[열락]', '[연낙]', '[연락]', '[열낙]'], 'ㄴ + ㄹ → [ㄹㄹ].', { fixed: true }),
      mc('설날 được đọc là:', ['[설랄]', '[선날]', '[설날]', '[서날]'], 'ㄹ + ㄴ → [ㄹㄹ].', { fixed: true }),
      ls('한라산', ['[할라산]', '[한나산]', '[한라산]', '[하나산]'], 'ㄴ + ㄹ → [ㄹㄹ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true }),
    ],
  },
  listening: {
    desc: 'Nghe hội thoại qua điện thoại.',
    q: [
      ls('여보세요? 거기 민수 씨 댁이지요?', ['A lô, đó có phải nhà anh Minsu không?', 'A lô, anh Minsu đấy à?', 'A lô, anh Minsu có nhà không?', 'A lô, ai đấy ạ?'], '댁 = nhà (kính ngữ); -지요? = phải không.'),
      ls('지금 통화 중이에요.', ['Bây giờ máy bận.', 'Bây giờ không có ở đây.', 'Bây giờ đang ngủ.', 'Bây giờ tôi gọi lại.'], '통화 중 = đang gọi điện.'),
      ls('잠깐 외출하셨는데요.', ['Vừa ra ngoài một lát.', 'Đang đi công tác.', 'Đang trong phòng họp.', 'Đã về nhà.'], '외출하다 = ra ngoài.'),
      ls('나중에 다시 전화하겠습니다.', ['Tôi sẽ gọi lại sau.', 'Tôi đã gọi rồi.', 'Hãy gọi lại cho tôi.', 'Đừng gọi nữa.'], '다시 전화하다 = gọi lại.'),
      ls('메모 좀 전해 주세요.', ['Nhờ chuyển lời nhắn giúp.', 'Cho tôi xin số điện thoại.', 'Chuyển máy giúp tôi.', 'Hãy gửi tin nhắn.'], '전해 주세요 = chuyển giúp.'),
    ],
    passages: [{
      title: 'Gọi điện cho thầy', ko: '여자: 여보세요? 한국대학교 한국어과입니다.\n흐엉: 안녕하세요? 저는 학생 흐엉인데요. 김 선생님 계세요?\n여자: 지금 안 계세요. 수업에 들어가셨어요.\n흐엉: 그럼 메모 좀 전해 주시겠어요? 내일 숙제를 못 내요. 아파서 학교에 못 가요.\n여자: 네, 말씀 전해 드리겠습니다.\n흐엉: 감사합니다. 오후에 다시 전화하겠습니다.',
      q: [
        mc('흐엉 씨는 누구에게 전화했어요?', ['김 선생님', '친구', '어머니', '한국어과 학생'], '김 선생님 계세요?'),
        mc('김 선생님은 지금 어디에 계세요?', ['수업 중', '집', '병원', '출장 중'], '수업에 들어가셨어요.'),
        mc('흐엉 씨는 언제 다시 전화할 거예요?', ['오후', '내일 아침', '저녁', '다음 주'], '오후에 다시 전화하겠습니다.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Tin nhắn', ko: '[문자 메시지]\n투안 씨, 저 지나예요. 오늘 오후에 전화했지만 통화 중이었어요. 토요일에 약속이 있지요? 우리 토요일 세 시에 학교 앞 카페에서 만나요. 저는 투안 씨에게 한국어 책을 주려고 해요. 답장 주세요!',
      vi: 'Tuấn ơi, mình là Jina. Chiều nay mình gọi nhưng máy bận. Thứ bảy mình có hẹn nhỉ? Thứ bảy 3 giờ gặp ở quán cà phê trước trường nhé. Mình định đưa Tuấn quyển sách tiếng Hàn. Trả lời mình nhé!',
      q: [
        mc('지나 씨는 왜 문자를 보냈어요?', ['Vì gọi điện nhưng máy bận.', 'Vì không có số điện thoại.', 'Vì Tuấn không thích gọi điện.', 'Vì điện thoại hỏng.'], '전화했지만 통화 중이었어요.'),
        mc('두 사람은 어디에서 만나요?', ['학교 앞 카페', '학교 도서관', '지나 씨 집', '서점'], '학교 앞 카페에서 만나요.'),
        mc('지나 씨는 무엇을 주려고 해요?', ['한국어 책', '선물', '사전', '휴대폰'], '한국어 책을 주려고 해요.'),
      ],
    }],
  },
  culture: {
    title: 'Những số điện thoại thú vị',
    paras: [
      'Ở Hàn Quốc nhiều số điện thoại dịch vụ được chọn sao cho dễ nhớ nhờ cách đọc đồng âm. Ví dụ các ga tàu điện ngầm ở Seoul từng dùng đuôi 7788, đọc là 칠칠팔팔 — nghe gần giống 칙칙폭폭, tiếng tàu hoả “xình xịch” trong tiếng Hàn.',
      'Các cửa hàng giao đồ ăn thích những số như 8282 (팔이팔이 ≈ 빨리빨리 – nhanh lên nhanh lên), còn số cứu hoả, cấp cứu là 119, cảnh sát là 112.',
      'Mã quốc gia của Hàn Quốc là +82; khi gọi từ nước ngoài vào Seoul bấm 82-2-…',
    ],
    compare: 'Ở Việt Nam số cấp cứu là 115, cứu hoả 114, công an 113; người Việt cũng thích số đẹp có 6, 8, 9.',
  },
  writing: [
    wr('Viết đoạn hội thoại gọi điện tìm một người không có ở đó và nhờ nhắn lại (4–6 lượt).', { min_len: 40, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Mở đầu bằng 여보세요', kind: 'includes', value: '여보세요', tip: 'Nhấc máy: 여보세요?' },
      { label: 'Hỏi người cần gặp (계세요/있어요?)', kind: 'regex', value: '(계세요|있어요\\?|있습니까)', tip: '○○ 씨 계세요?' },
      { label: 'Có nhờ chuyển lời / gọi lại', kind: 'anyOf', value: ['전해', '다시 전화', '메모'], tip: '메모 좀 전해 주세요 / 다시 전화하겠습니다.' }] },
    'A: 여보세요?\nB: 여보세요? 민수 씨 계세요?\nA: 지금 없는데요. 실례지만 누구세요?\nB: 저는 친구 란이에요. 메모 좀 전해 주세요. 내일 약속이 있어요.\nA: 네, 전해 드리겠습니다.', ''),
    wr('Kỳ nghỉ tới bạn định làm gì? Viết 3 câu dùng -(으)려고 해요 và -지만.', { min_len: 25, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -(으)려고 해요', kind: 'includes', value: '려고 ', tip: 'V(으)려고 해요.' },
      { label: 'Dùng -지만', kind: 'includes', value: '지만', tip: 'A지만 B.' }] },
    '방학에 고향에 가려고 해요. 비행기표가 비싸지만 가족을 만나고 싶어요. 고향에서 친구들에게 한국 선물을 주려고 해요.', ''),
  ],
};
