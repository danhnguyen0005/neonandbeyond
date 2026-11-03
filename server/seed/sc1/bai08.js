// Sơ cấp 1 · Bài 8 — 음식 (Ẩm thực)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const GESS = [['먹다', 'ăn'], ['마시다', 'uống'], ['하다', 'làm'], ['가다', 'đi'], ['기다리다', 'chờ'], ['주문하다', 'gọi món'], ['계산하다', 'tính tiền'], ['공부하다', 'học'], ['전화하다', 'gọi điện'], ['오다', 'đến']];
const JI = [['먹다', 'ăn'], ['가다', 'đi'], ['맵다', 'cay'], ['달다', 'ngọt'], ['짜다', 'mặn'], ['비싸다', 'đắt'], ['바쁘다', 'bận'], ['좋아하다', 'thích'], ['마시다', 'uống'], ['맛있다', 'ngon'], ['크다', 'to'], ['어렵다', 'khó'], ['피곤하다', 'mệt']];
const SEYO = [['오다', 'đến'], ['가다', 'đi'], ['주다', 'cho'], ['앉다', 'ngồi'], ['읽다', 'đọc'], ['기다리다', 'chờ'], ['쓰다', 'viết'], ['찾다', 'tìm'], ['입다', 'mặc'], ['만들다', 'làm'], ['열다', 'mở'], ['들어오다', 'đi vào'],
  ['쉬다', 'nghỉ'], ['조심하다', 'cẩn thận'], ['씻다', 'rửa'], ['닫다', 'đóng']];

module.exports = {
  unit: 8, ko: '음식', vi: 'Ẩm thực', vocabName: 'món ăn Hàn, mùi vị, nhà hàng',
  vocab: [
    ['Món ăn Hàn Quốc', [['밥', 'cơm'], ['국', 'canh'], ['김치', 'kim chi'], ['불고기', 'bulgogi'], ['된장찌개', 'canh tương đậu'], ['비빔밥', 'cơm trộn'], ['냉면', 'mì lạnh'], ['떡', 'bánh gạo'],
      ['라면', 'mì gói'], ['삼겹살', 'thịt ba chỉ nướng'], ['김치찌개', 'canh kim chi'], ['갈비탕', 'canh sườn bò'], ['삼계탕', 'gà tần sâm'], ['볶음밥', 'cơm rang'], ['갈비', 'sườn nướng'], ['국수', 'mì, bún']]],
    ['Mùi vị', [['맛있다', 'ngon'], ['맛없다', 'không ngon'], ['달다', 'ngọt'], ['쓰다', 'đắng'], ['짜다', 'mặn'], ['시다', 'chua'], ['맵다', 'cay'], ['싱겁다', 'nhạt']]],
    ['Ở nhà hàng', [['숟가락', 'thìa'], ['젓가락', 'đũa'], ['메뉴', 'thực đơn'], ['컵', 'cốc'], ['테이블', 'bàn ăn'], ['종업원', 'người phục vụ'], ['손님', 'khách'], ['흡연석', 'chỗ hút thuốc'], ['금연석', 'chỗ cấm hút thuốc'],
      ['영수증', 'hoá đơn'], ['주문하다', 'gọi món'], ['계산하다', 'tính tiền'], ['계산서', 'phiếu tính tiền']]],
    ['Từ mới trong bài', [['반찬', 'món ăn kèm'], ['물', 'nước'], ['녹차', 'trà xanh'], ['인삼차', 'trà sâm'], ['콜라', 'cola'], ['케이크', 'bánh kem'], ['채소', 'rau'], ['고추', 'ớt'], ['가지', 'cà tím'], ['소금', 'muối'], ['레몬', 'chanh'],
      ['기다리다', 'chờ'], ['앉다', 'ngồi'], ['만들다', 'làm, nấu'], ['드시다', 'dùng (kính ngữ của 먹다)'], ['그래서', 'vì vậy'], ['더', 'thêm'], ['보통', 'thường'], ['특히', 'đặc biệt'], ['항상', 'luôn luôn'], ['잠깐만요', 'chờ một chút'], ['좀', 'một chút']]],
  ],
  vocabNote: 'Gọi người phục vụ: 여기요! hoặc 저기요! Gọi món: 비빔밥 하나 주세요. Thanh toán: 계산해 주세요.',
  grammar: [
    {
      name: '-겠- (ý định)', desc: '“Sẽ …”: ý định của người nói; hỏi ý định người nghe.',
      lesson: {
        goal: 'Nói ý định (gọi món, quyết định).',
        formula: 'Gốc + 겠어요 / 겠습니다',
        explain: '-겠- gắn vào gốc động từ (không xét patchim) để nói ý định của người nói (ngôi 1) hoặc hỏi ý định người nghe (ngôi 2). Rất hay dùng khi gọi món và trong các câu lịch sự cố định: 잘 먹겠습니다 (tôi xin phép ăn), 알겠습니다 (tôi hiểu rồi).',
        examples: [['저는 콜라를 마시겠어요.', 'Tôi sẽ uống cola.'], ['저는 비빔밥을 먹겠습니다.', 'Tôi sẽ ăn cơm trộn.'], ['무엇을 드시겠어요?', 'Anh/chị dùng gì ạ?'], ['잘 먹겠습니다.', 'Tôi xin phép ăn (nói trước bữa ăn).']],
        mistakes: ['Dùng -겠- cho ý định của ngôi thứ ba: 민수 씨가 가겠어요 ✗ (ý định người khác dùng -(으)ㄹ 거예요, Bài 11).'],
      },
      gen: [{ kind: 'verb', form: 'gess', verbs: GESS, typed: 0.4 }],
      q: [
        mc('Phục vụ: 뭘 드시겠어요?  Khách: ___', ['저는 냉면을 먹겠어요.', '저는 냉면을 먹었어요.', '저는 냉면을 먹지 않아요.', '냉면을 드시겠어요.'], 'Trả lời ý định gọi món bằng -겠어요.'),
        mc('Câu nói trước khi ăn:', ['잘 먹겠습니다.', '잘 먹었습니다.', '많이 드세요.', '맛있게 드셨어요?'], '잘 먹겠습니다 = xin phép ăn (trước bữa).'),
        mc('Câu nói sau khi ăn xong:', ['잘 먹었습니다.', '잘 먹겠습니다.', '어서 오세요.', '계산하겠습니다.'], '잘 먹었습니다 = cảm ơn bữa ăn (sau khi ăn).', { d: 2 }),
        fill('Điền: 저는 녹차를 (마시다) ___. (ý định)', ['마시겠어요', '마시겠어요.', '마시겠습니다', '마시겠습니다.'], 'Gốc 마시 + 겠어요.'),
      ],
    },
    {
      name: '-지 않다 (phủ định dài)', desc: '“Không …”: phủ định bằng -지 않아요.',
      lesson: {
        goal: 'Phủ định động từ, tính từ bằng -지 않다.',
        formula: 'Gốc + 지 않아요 / 지 않습니다',
        explain: '-지 않다 có nghĩa giống 안 nhưng gắn sau gốc, không xét patchim, và dùng được với mọi động từ “danh từ + 하다” mà không phải tách: 공부하지 않아요. Văn viết và câu trang trọng hay dùng -지 않다 hơn.',
        examples: [['주말에는 바쁘지 않아요.', 'Cuối tuần tôi không bận.'], ['이 케이크는 달지 않습니다.', 'Bánh này không ngọt.'], ['저는 김치를 먹지 않습니다.', 'Tôi không ăn kim chi.']],
        mistakes: ['맵지 안아요 ✗ → 맵지 않아요 (않 có ㅎ).', 'Gắn vào dạng đã chia: 먹어지 않아요 ✗ → 먹지 않아요.'],
        compare: '안 먹어요 = 먹지 않아요 (cùng nghĩa). Với 하다: 공부 안 해요 = 공부하지 않아요.',
      },
      gen: [{ kind: 'verb', form: 'ji_anh', verbs: JI, typed: 0.5 }],
      q: [
        mc('“Món này không cay.”', ['이 음식은 맵지 않아요.', '이 음식은 안 맵지 않아요.', '이 음식은 맵지 안아요.', '이 음식은 매워지 않아요.'], 'Gốc 맵 + 지 않아요.'),
        mc('Câu nào có nghĩa GIỐNG “안 마셔요”?', ['마시지 않아요.', '마시지 마세요.', '못 마셔요.', '마시고 싶어요.'], '안 V = V지 않아요.'),
        tr('Dịch (dùng -지 않아요): “Canh này không mặn.”', ['이 국은 짜지 않아요.', '국이 짜지 않아요.', '이 국은 짜지 않아요', '이 국은 짜지 않습니다.'], '짜 + 지 않아요.'),
        err(['저는', '고기를', '먹지', '안아요.'], 3, 'Viết đúng là 않아요 (않 có patchim ㄶ).'),
      ],
    },
    {
      name: '-(으)세요 (hãy, xin mời)', desc: 'Yêu cầu, mời lịch sự.',
      lesson: {
        goal: 'Đưa ra yêu cầu, lời mời lịch sự.',
        formula: 'Gốc không patchim + 세요 · có patchim + 으세요 · gốc ㄹ: bỏ ㄹ + 세요',
        explain: '-(으)세요 dùng để yêu cầu hoặc mời một cách lịch sự: 앉으세요 (mời ngồi), 주세요 (cho tôi). Gốc tận cùng ㄹ bỏ ㄹ: 만들다 → 만드세요, 열다 → 여세요. Một số động từ có dạng kính ngữ riêng: 먹다 → 드세요, 자다 → 주무세요, 있다 → 계세요.',
        examples: [['우유를 주세요.', 'Cho tôi sữa.'], ['여기에 앉으세요.', 'Mời ngồi đây.'], ['8시에 학교에 오세요.', 'Hãy đến trường lúc 8 giờ.'], ['맛있게 드세요.', 'Chúc ngon miệng.']],
        mistakes: ['앉세요 ✗ → 앉으세요.', '만들으세요 ✗ → 만드세요.'],
      },
      gen: [{ kind: 'verb', form: 'seyo', verbs: SEYO, typed: 0.5 }],
      q: [
        mc('Nhờ phục vụ mang thêm nước: “물 좀 더 ___.”', ['주세요', '줍니다', '주겠어요', '줬어요'], 'Yêu cầu: 주세요.'),
        mc('Mời khách ngồi:', ['여기 앉으세요.', '여기 앉세요.', '여기 앉아요?', '여기 앉겠어요.'], '앉 có patchim → 앉으세요.'),
        mc('Mời người lớn dùng bữa:', ['많이 드세요.', '많이 먹으세요.', '많이 먹겠어요.', '많이 먹었어요.'], 'Kính ngữ của 먹다 là 드시다 → 드세요.', { d: 3 }),
        tr('Dịch: “Cho tôi một bát cơm trộn.”', ['비빔밥 하나 주세요.', '비빔밥 한 그릇 주세요.', '비빔밥 하나 주세요', '비빔밥 한 개 주세요.'], 'Món + 하나 + 주세요.'),
        tr('Dịch: “Tính tiền cho tôi.”', ['계산해 주세요.', '계산해 주세요'], '계산하다 → 계산해 주세요.', { d: 3 }),
      ],
    },
  ],
  pron: {
    name: 'Căng hoá sau ㄱ ㄷ ㅂ (2)', desc: 'Ôn căng hoá với -겠-, -지, 과.',
    lesson: { goal: 'Đọc tự nhiên các đuôi -겠습니다, -지 않습니다.', explain: 'Sau patchim đọc [ㄱ, ㄷ, ㅂ], các âm ㄱ ㄷ ㅂ ㅅ ㅈ đứng sau đọc căng: 먹지 [먹찌], 밥과 [밥꽈], 맵습니다 [맵씀니다].',
      examples: [['밥과 빵 → [밥꽈 빵]', 'cơm và bánh mì'], ['먹겠습니다 → [먹껟씀니다]', 'sẽ ăn'], ['먹지 않습니다 → [먹찌 안씀니다]', 'không ăn'], ['맵습니다 → [맵씀니다]', 'cay']] },
    q: [
      mc('먹지 được đọc là:', ['[먹찌]', '[먹지]', '[머지]', '[멍지]'], 'ㄱ + ㅈ → [ㅉ].', { fixed: true }),
      mc('밥과 được đọc là:', ['[밥꽈]', '[밥과]', '[바꽈]', '[밤과]'], 'ㅂ + ㄱ → [ㄲ].', { fixed: true }),
      ls('먹겠습니다', ['[먹껟씀니다]', '[먹겠습니다]', '[머겟슴니다]', '[멍겟씀니다]'], 'ㄱ + ㄱ → [ㄲ], ㅆ + ㅅ → [ㅆ], ㅂ + ㄴ → [ㅁ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 3 }),
    ],
  },
  listening: {
    desc: 'Nghe gọi món và hội thoại ở nhà hàng.',
    q: [
      ls('여기요, 메뉴 좀 주세요.', ['Anh ơi, cho tôi xem thực đơn.', 'Anh ơi, tính tiền.', 'Cho tôi thêm nước.', 'Ở đây có thực đơn không?'], '메뉴 = thực đơn.'),
      ls('김치찌개 두 개 주세요.', ['Cho hai canh kim chi.', 'Cho một canh kim chi.', 'Cho hai kim chi.', 'Canh kim chi có cay không?'], '두 개 = hai phần.', { tag: 'number' }),
      ls('이 음식은 너무 짜요.', ['Món này mặn quá.', 'Món này cay quá.', 'Món này ngọt quá.', 'Món này nhạt quá.'], '짜다 = mặn.'),
      ls('저는 매운 음식을 먹지 않아요.', ['Tôi không ăn đồ cay.', 'Tôi thích đồ cay.', 'Tôi ăn đồ cay.', 'Đồ cay không ngon.'], '먹지 않아요 = không ăn.'),
      ls('잠깐만 기다리세요.', ['Xin chờ một chút.', 'Mời ngồi.', 'Mời vào.', 'Chúc ngon miệng.'], '기다리세요 = hãy chờ.'),
    ],
    passages: [{
      title: 'Gọi món', ko: '종업원: 어서 오세요. 몇 분이세요?\n손님: 두 명이에요.\n종업원: 이쪽으로 앉으세요. 뭘 드시겠어요?\n손님: 비빔밥 하나하고 냉면 하나 주세요. 비빔밥은 맵지 않게 해 주세요.\n종업원: 네, 알겠습니다. 음료수는요?\n손님: 물 주세요.',
      q: [
        mc('손님은 몇 명이에요?', ['2명', '1명', '3명', '4명'], '두 명이에요.'),
        mc('손님은 무엇을 주문했어요?', ['비빔밥과 냉면', '비빔밥 두 개', '냉면과 물냉면', '불고기와 냉면'], '비빔밥 하나하고 냉면 하나.'),
        mc('손님의 부탁은 무엇이에요?', ['Cơm trộn đừng làm cay.', 'Mì lạnh làm cay.', 'Cho thêm cơm.', 'Đổi chỗ ngồi.'], '맵지 않게 해 주세요.', { d: 3 }),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Bữa ăn của tôi', ko: '저는 보통 아침을 먹지 않습니다. 시간이 없습니다. 점심에는 학생 식당에서 김치찌개를 먹습니다. 김치찌개는 조금 맵습니다. 그런데 정말 맛있습니다. 저녁에는 집에서 밥과 국을 먹습니다. 저는 단 음식을 좋아하지 않습니다. 그래서 케이크를 먹지 않습니다.',
      vi: 'Tôi thường không ăn sáng vì không có thời gian. Trưa ăn canh kim chi ở nhà ăn — hơi cay, nhưng rất ngon. Tối ăn cơm và canh ở nhà. Tôi không thích đồ ngọt nên không ăn bánh kem.',
      q: [
        mc('왜 아침을 먹지 않아요?', ['시간이 없어요.', '배가 안 고파요.', '맛이 없어요.', '돈이 없어요.'], '시간이 없습니다.'),
        mc('점심에 무엇을 먹어요?', ['김치찌개', '케이크', '비빔밥', '냉면'], '학생 식당에서 김치찌개.'),
        mc('Câu nào đúng?', ['이 사람은 단 음식을 안 좋아해요.', '이 사람은 케이크를 자주 먹어요.', '저녁에 식당에서 먹어요.', '김치찌개는 맛없어요.'], '단 음식을 좋아하지 않습니다.'),
      ],
    }],
  },
  culture: {
    title: 'Văn hoá ẩm thực Hàn Quốc',
    paras: [
      'Bữa ăn Hàn gồm cơm, canh và nhiều món ăn kèm (반찬) đặt chung giữa bàn. Món ăn kèm thường được thêm miễn phí khi ăn ở quán.',
      'Người Hàn dùng thìa để ăn cơm và canh, dùng đũa (thường bằng kim loại, dẹt) để gắp món ăn kèm. Không nhấc bát cơm lên khi ăn và không cắm đũa thẳng vào bát cơm.',
      'Người nhỏ tuổi nên đợi người lớn cầm đũa trước. Trước bữa ăn nói 잘 먹겠습니다, sau bữa ăn nói 잘 먹었습니다.',
    ],
    compare: 'Người Việt bưng bát lên khi ăn và dùng đũa là chính; ở Hàn, bát để trên bàn và thìa quan trọng không kém đũa.',
  },
  writing: [
    wr('Viết đoạn hội thoại gọi món ở nhà hàng (4–6 lượt), có -겠어요 và -(으)세요.', { min_len: 35, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -겠어요/겠습니다', kind: 'regex', value: '겠(어요|습니다)', tip: 'Ví dụ: 비빔밥을 먹겠어요.' },
      { label: 'Dùng -(으)세요', kind: 'regex', value: '(세요)', tip: 'Ví dụ: 주세요, 앉으세요.' },
      { label: 'Có tên món ăn', kind: 'anyOf', value: ['비빔밥', '불고기', '냉면', '김치', '찌개', '삼겹살', '라면', '갈비', '김밥', '삼계탕', '떡', '볶음밥', '국수'], tip: 'Dùng tên món đã học.' }] },
    '종업원: 어서 오세요. 여기 앉으세요.\n손님: 메뉴 좀 주세요.\n종업원: 뭘 드시겠어요?\n손님: 저는 삼계탕을 먹겠어요. 물도 주세요.', ''),
    wr('Bạn thích món gì, không thích món gì? Viết 3 câu (có -지 않아요).', { min_len: 20, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -지 않아요', kind: 'regex', value: '지 않(아요|습니다)', tip: 'Ví dụ: 맵지 않아요, 좋아하지 않아요.' },
      { label: 'Có từ chỉ vị', kind: 'anyOf', value: ['맛있', '맛없', '달', '쓰', '짜', '시', '맵', '매워', '싱겁'], tip: 'Dùng tính từ mùi vị.' }] },
    '저는 불고기를 좋아해요. 불고기는 아주 맛있어요. 그런데 김치찌개는 좋아하지 않아요. 그리고 저는 쓴 커피를 마시지 않아요.', ''),
  ],
};
