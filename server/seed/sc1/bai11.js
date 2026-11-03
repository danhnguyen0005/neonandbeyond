// Sơ cấp 1 · Bài 11 — 날씨 (Thời tiết)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const GO = [['크다', 'to'], ['싸다', 'rẻ'], ['맛있다', 'ngon'], ['따뜻하다', 'ấm'], ['맑다', 'trong xanh'], ['좋다', 'tốt'], ['먹다', 'ăn'], ['씻다', 'rửa'], ['공부하다', 'học'], ['보다', 'xem'], ['넓다', 'rộng'], ['조용하다', 'yên tĩnh']];
const FUT = [['가다', 'đi'], ['먹다', 'ăn'], ['만나다', 'gặp'], ['읽다', 'đọc'], ['여행하다', 'du lịch'], ['살다', 'sống'], ['만들다', 'làm'], ['입다', 'mặc'], ['보다', 'xem'], ['쉬다', 'nghỉ'], ['배우다', 'học'], ['놀다', 'chơi'],
  ['춥다', 'lạnh'], ['덥다', 'nóng'], ['돕다', 'giúp'], ['듣다', 'nghe']];
const BIRR = [['덥다', 'nóng'], ['춥다', 'lạnh'], ['맵다', 'cay'], ['쉽다', 'dễ'], ['어렵다', 'khó'], ['가깝다', 'gần'], ['고맙다', 'cảm ơn'], ['무겁다', 'nặng'], ['가볍다', 'nhẹ'], ['귀엽다', 'dễ thương'], ['즐겁다', 'vui'],
  ['아름답다', 'đẹp'], ['시끄럽다', 'ồn ào'], ['반갑다', 'vui mừng'], ['돕다', 'giúp đỡ'], ['곱다', 'đẹp, xinh']];

module.exports = {
  unit: 11, ko: '날씨', vi: 'Thời tiết', vocabName: 'mùa, thời tiết, nhiệt độ',
  vocab: [
    ['Mùa', [['봄', 'mùa xuân'], ['여름', 'mùa hè'], ['가을', 'mùa thu'], ['겨울', 'mùa đông'], ['계절', 'mùa']]],
    ['Thời tiết', [['날씨', 'thời tiết'], ['따뜻하다', 'ấm áp'], ['덥다', 'nóng'], ['쌀쌀하다', 'se lạnh'], ['춥다', 'lạnh'], ['시원하다', 'mát mẻ'], ['비가 오다', 'trời mưa'], ['비가 그치다', 'tạnh mưa'], ['눈이 오다', 'tuyết rơi'],
      ['눈이 그치다', 'tuyết ngừng rơi'], ['맑다', 'trong xanh, nắng'], ['흐리다', 'âm u'], ['바람이 불다', 'gió thổi'], ['구름이 끼다', 'nhiều mây']]],
    ['Từ liên quan thời tiết', [['해', 'mặt trời'], ['비', 'mưa'], ['눈', 'tuyết'], ['구름', 'mây'], ['바람', 'gió'], ['기온', 'nhiệt độ không khí'], ['영상', 'trên 0 độ'], ['영하', 'dưới 0 độ, độ âm'], ['도', 'độ'], ['일기 예보', 'dự báo thời tiết']]],
    ['Từ mới trong bài', [['우산', 'ô, dù'], ['장갑', 'găng tay'], ['목도리', 'khăn quàng'], ['반바지', 'quần soóc'], ['반팔', 'áo cộc tay'], ['긴팔', 'áo dài tay'], ['부츠', 'giày bốt'], ['스키장', 'khu trượt tuyết'], ['단풍', 'lá phong (mùa thu)'],
      ['하늘', 'bầu trời'], ['노란색', 'màu vàng'], ['깨끗하다', 'sạch sẽ'], ['필요하다', 'cần thiết'], ['비슷하다', 'giống nhau'], ['가장', 'nhất'], ['입다', 'mặc'], ['좁다', 'hẹp'], ['돕다', 'giúp đỡ'], ['도와주다', 'giúp cho'], ['추억', 'kỷ niệm']]],
  ],
  vocabNote: 'Hỏi thời tiết: 날씨가 어때요? Nhiệt độ: 영상 5도 (5°C), 영하 10도 (−10°C). Mưa/tuyết “rơi” dùng 오다 hoặc 내리다.',
  grammar: [
    {
      name: '-고 (và, rồi)', desc: 'Nối hai mệnh đề: liệt kê hoặc trình tự thời gian.',
      lesson: {
        goal: 'Nối hai câu bằng -고.',
        formula: 'Gốc V/A + 고 + mệnh đề sau',
        explain: '-고 nối hai hành động, trạng thái ngang hàng (“và”): 비가 오고 바람이 불어요. Với động từ, -고 còn diễn tả trình tự (“rồi”): 손을 씻고 밥을 먹어요. Thì (quá khứ) thường chỉ chia ở động từ cuối câu.',
        examples: [['비가 오고 바람이 불어요.', 'Trời mưa và gió thổi.'], ['집이 크고 멋있어요.', 'Ngôi nhà to và đẹp.'], ['란 씨는 베트남 사람이고 유진 씨는 한국 사람이에요.', 'Lan là người Việt, còn Yujin là người Hàn.'], ['수업이 끝나고 도서관에 가요.', 'Học xong rồi tôi đến thư viện.']],
        mistakes: ['Chia quá khứ cả hai vế khi chỉ trình tự: 먹었고 갔어요 → thường nói 먹고 갔어요.', 'Với danh từ dùng (이)고: 학생이고.'],
      },
      gen: [{ kind: 'verb', form: 'go', verbs: GO, typed: 0.4 }],
      q: [
        mc('“Trời trong xanh và ấm áp.”', ['날씨가 맑고 따뜻해요.', '날씨가 맑아고 따뜻해요.', '날씨가 맑고 따뜻하고.', '날씨가 맑지만 따뜻해요.'], 'Gốc 맑 + 고.'),
        mc('“Tôi rửa tay rồi ăn cơm.”', ['손을 씻고 밥을 먹어요.', '손을 씻어고 밥을 먹어요.', '밥을 먹고 손을 씻어요.', '손을 씻지만 밥을 먹어요.'], 'Trình tự: V1고 V2.'),
        fill('Nối câu: 이 식당은 싸요 + 맛있어요 → 이 식당은 ___ 맛있어요.', ['싸고'], 'Gốc 싸 + 고.'),
        tr('Dịch: “Hôm qua tôi tan học rồi gặp bạn.”', ['어제 수업이 끝나고 친구를 만났어요.', '어제 수업이 끝나고 친구를 만났어요', '어제 수업 끝나고 친구를 만났어요.'], 'V1고 V2(quá khứ).', { d: 3 }),
        ord('Sắp xếp: “Mùa hè nóng và mùa đông lạnh.”', ['여름은', '덥고', '겨울은', '추워요.'], 'A고 B.'),
      ],
    },
    {
      name: 'N부터 N까지 (từ … đến …)', desc: 'Khoảng thời gian bắt đầu – kết thúc.',
      lesson: {
        goal: 'Nói khoảng thời gian.',
        formula: 'Thời gian 1 + 부터 + Thời gian 2 + 까지',
        explain: '부터 = “từ” (điểm bắt đầu), 까지 = “đến” (điểm kết thúc) của thời gian. Có thể dùng riêng: 내일부터 (từ ngày mai), 다섯 시까지 (đến 5 giờ). Với nơi chốn dùng 에서 ~ 까지 (Bài 15).',
        examples: [['세 시부터 다섯 시까지 운동을 합니다.', 'Tôi tập thể thao từ 3 đến 5 giờ.'], ['12월 20일부터 겨울방학입니다.', 'Từ 20/12 là nghỉ đông.'], ['한국은 6월부터 8월까지 덥습니다.', 'Hàn Quốc nóng từ tháng 6 đến tháng 8.']],
        mistakes: ['Dùng 에서 cho thời gian: 세 시에서 다섯 시까지 (văn nói có gặp nhưng chuẩn là 부터).'],
      },
      q: [
        mc('수업은 9시___ 12시___ 있어요.', ['부터 / 까지', '까지 / 부터', '에서 / 에', '에 / 까지'], 'Từ… đến… (thời gian) → 부터 ~ 까지.', { fixed: true, tag: 'particle' }),
        fill('Điền: 월요일___ 금요일까지 회사에 가요.', ['부터'], 'Điểm bắt đầu thời gian → 부터.'),
        fill('Điền: 밤 열두 시___ 공부했어요.', ['까지'], 'Điểm kết thúc → 까지.'),
        tr('Dịch: “Kỳ nghỉ từ tháng 7 đến tháng 8.”', ['7월부터 8월까지 방학이에요.', '칠월부터 팔월까지 방학이에요.', '방학은 7월부터 8월까지예요.', '7월부터 8월까지 방학입니다.'], '7월부터 8월까지.'),
        ls('아침부터 지금까지 비가 와요.', ['Trời mưa từ sáng đến giờ.', 'Từ giờ đến sáng sẽ mưa.', 'Sáng nay không mưa.', 'Mưa đến sáng thì tạnh.'], '아침부터 지금까지.'),
      ],
    },
    {
      name: '-(으)ㄹ 거예요 (sẽ; dự đoán)', desc: 'Kế hoạch tương lai và phỏng đoán.',
      lesson: {
        goal: 'Nói kế hoạch, dự định và phỏng đoán.',
        formula: 'Gốc không patchim + ㄹ 거예요 · có patchim + 을 거예요 · gốc ㄹ + 거예요',
        explain: 'Diễn tả kế hoạch, ý định trong tương lai: 다음 주에 한국에 갈 거예요. Cũng dùng để phỏng đoán (thường với 아마): 내일은 추울 거예요. Dạng trang trọng: -(으)ㄹ 겁니다. Gốc ㄹ: 만들다 → 만들 거예요.',
        examples: [['오늘 저녁에는 비빔밥을 먹을 거예요.', 'Tối nay tôi sẽ ăn cơm trộn.'], ['다음 주에 한국에 갈 거예요.', 'Tuần sau tôi sẽ đi Hàn Quốc.'], ['아마 극장에 사람이 많을 거예요.', 'Chắc rạp đông người lắm.'], ['내일은 날씨가 추울 거예요.', 'Ngày mai trời sẽ lạnh.']],
        mistakes: ['먹ㄹ 거예요 ✗ → 먹을 거예요.', '만들을 거예요 ✗ → 만들 거예요.', '춥을 거예요 ✗ → 추울 거예요 (bất quy tắc ㅂ).'],
        compare: '-겠- (Bài 8): ý định nói ngay lúc đó; -(으)ㄹ 거예요: kế hoạch đã định, hoặc dự đoán.',
      },
      gen: [{ kind: 'verb', form: 'lgeoyeyo', verbs: FUT, typed: 0.5 }],
      q: [
        mc('A: 이번 주말에 뭐 할 거예요?  B: ___', ['친구하고 등산할 거예요.', '친구하고 등산했어요.', '친구하고 등산할래요?', '친구하고 등산합시다.'], 'Kế hoạch → -(으)ㄹ 거예요.'),
        mc('“Chắc ngày mai trời mưa.”', ['내일은 아마 비가 올 거예요.', '내일은 아마 비가 왔어요.', '내일은 아마 비가 오세요.', '내일은 아마 비가 오겠어요?'], 'Phỏng đoán → 아마 + -(으)ㄹ 거예요.'),
        err(['방학에', '스키를', '배우을', '거예요.'], 2, '배우 không patchim → 배울 거예요.'),
        tr('Dịch: “Năm sau tôi sẽ sống ở Seoul.”', ['내년에 서울에서 살 거예요.', '내년에 서울에 살 거예요.', '저는 내년에 서울에서 살 거예요.', '저는 내년에 서울에 살 거예요.'], '살다 (gốc ㄹ) → 살 거예요.', { d: 3 }),
      ],
    },
    {
      name: 'Bất quy tắc ㅂ', desc: 'Gốc tận cùng ㅂ: ㅂ → 우 trước nguyên âm (춥다 → 추워요).',
      lesson: {
        goal: 'Chia đúng tính từ/động từ bất quy tắc ㅂ.',
        formula: 'ㅂ + -아/어 → 워 (춥다 → 추워요) · ㅂ + -(으) → 우 (춥다 → 추울 거예요) · 돕다, 곱다 → 와 (도와요)',
        explain: 'Phần lớn tính từ gốc ㅂ (덥다, 춥다, 맵다, 쉽다, 어렵다, 고맙다, 가깝다…) đổi ㅂ thành 우 khi gặp đuôi bắt đầu bằng nguyên âm: 더워요, 추웠어요, 매울 거예요. Riêng 돕다, 곱다 dùng 와: 도와요. Ngoại lệ KHÔNG biến đổi: 입다 (mặc), 좁다 (hẹp), 잡다 (nắm), 씹다 (nhai): 입어요, 좁아요.',
        examples: [['정말 고마워요.', 'Thật sự cảm ơn.'], ['김치는 매워요.', 'Kim chi cay.'], ['어제는 아주 추웠어요.', 'Hôm qua rất lạnh.'], ['도와주세요.', 'Xin hãy giúp tôi.'], ['코트를 입어요. (không biến đổi)', 'Tôi mặc áo khoác.']],
        mistakes: ['춥어요 ✗ → 추워요.', '입워요 ✗ → 입어요 (ngoại lệ).', '돕워요 ✗ → 도와요.'],
      },
      gen: [{ kind: 'verb', form: 'polite', verbs: BIRR, typed: 0.6, d: 2 }, { kind: 'verb', form: 'past', verbs: BIRR.slice(0, 8), typed: 0.3, d: 2 }],
      q: [
        mc('A: 날씨가 어때요?  B: 너무 ___', ['더워요.', '덥어요.', '덥워요.', '더와요.'], '덥다 → 더워요.'),
        mc('Câu nào ĐÚNG?', ['교실이 좁아요.', '교실이 조워요.', '옷을 이워요.', '김치가 맵아요.'], '좁다, 입다 là ngoại lệ; 맵다 → 매워요.', { d: 3 }),
        fill('Chia: 한국어가 (어렵다) ___. (-아/어요)', ['어려워요', '어려워요.'], '어렵 → 어려워요.'),
        fill('Chia: 친구가 저를 (돕다) ___. (-아/어요)', ['도와요', '도와요.'], '돕다 → 도와요.'),
      ],
    },
  ],
  pron: {
    name: 'Căng hoá sau -(으)ㄹ', desc: 'Sau định ngữ -(으)ㄹ, ㄱ ㄷ ㅂ ㅅ ㅈ đọc căng.',
    lesson: { goal: 'Đọc đúng -(으)ㄹ 거예요, -(으)ㄹ 수 있어요.', explain: 'Âm ㄱ, ㄷ, ㅂ, ㅅ, ㅈ đứng ngay sau định ngữ -(으)ㄹ được đọc căng: ㄲ, ㄸ, ㅃ, ㅆ, ㅉ.',
      examples: [['갈 거예요 → [갈 꺼예요]', 'sẽ đi'], ['할 수 있어요 → [할 쑤 이써요]', 'có thể làm'], ['먹을 거예요 → [머글 꺼예요]', 'sẽ ăn']] },
    q: [
      mc('갈 거예요 được đọc là:', ['[갈 꺼예요]', '[갈 거예요]', '[가 꺼예요]', '[갈 커예요]'], 'Sau -ㄹ, ㄱ → [ㄲ].', { fixed: true }),
      mc('먹을 거예요 được đọc là:', ['[머글 꺼예요]', '[먹을 거예요]', '[머글 거예요]', '[먹글 꺼예요]'], 'Nối âm + căng hoá.', { fixed: true, d: 2 }),
      ls('뭐 할 거예요?', ['[뭐 할 꺼예요]', '[뭐 하 거예요]', '[뭐 할 커예요]', '[뭐 할 거예요]'], 'Sau -ㄹ, ㄱ → [ㄲ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true }),
    ],
  },
  listening: {
    desc: 'Nghe dự báo thời tiết và kế hoạch.',
    q: [
      ls('오늘은 날씨가 맑고 따뜻해요.', ['Hôm nay trời nắng và ấm.', 'Hôm nay trời mưa và lạnh.', 'Hôm nay âm u.', 'Ngày mai trời ấm.'], '맑다 = trong xanh; 따뜻하다 = ấm.'),
      ls('내일은 비가 올 거예요. 우산을 가져가세요.', ['Mai sẽ mưa, hãy mang ô.', 'Mai trời nắng, không cần ô.', 'Hôm nay mưa, hãy mang ô.', 'Mai có tuyết.'], '비가 올 거예요 = sẽ mưa; 우산 = ô.'),
      ls('서울의 기온은 영하 오 도예요.', ['Seoul −5°C', 'Seoul 5°C', 'Seoul −15°C', 'Seoul 50°C'], '영하 = âm.', { tag: 'number', d: 2 }),
      ls('바람이 많이 불어요.', ['Gió thổi mạnh.', 'Mưa nhiều.', 'Nhiều mây.', 'Tuyết rơi nhiều.'], '바람이 불다 = gió thổi.'),
      ls('방학에 제주도를 여행할 거예요.', ['Kỳ nghỉ tôi sẽ đi du lịch Jeju.', 'Kỳ nghỉ tôi đã đi Jeju.', 'Tôi muốn sống ở Jeju.', 'Tôi sống ở Jeju.'], '-ㄹ 거예요 = sẽ.'),
    ],
    passages: [{
      title: 'Dự báo thời tiết', ko: '내일의 날씨입니다. 서울은 아침부터 오후까지 흐리고 비가 오겠습니다. 기온은 영상 십이 도입니다. 부산은 맑고 따뜻하겠습니다. 기온은 영상 십팔 도입니다. 제주도는 바람이 많이 불 거예요.',
      q: [
        mc('내일 서울 날씨는 어때요?', ['흐리고 비가 와요.', '맑고 따뜻해요.', '눈이 와요.', '바람이 많이 불어요.'], '서울은 흐리고 비가 오겠습니다.'),
        mc('부산의 기온은 몇 도예요?', ['18°C', '12°C', '8°C', '−18°C'], '영상 십팔 도.', { tag: 'number' }),
        mc('제주도 날씨는?', ['Gió mạnh', 'Mưa', 'Tuyết', 'Nóng'], '바람이 많이 불 거예요.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Thư gửi bạn', ko: '민수 씨에게\n\n민수 씨, 잘 지내요? 하노이는 요즘 아주 더워요. 낮 기온이 삼십오 도예요. 그래서 저는 반팔하고 반바지를 입어요. 서울은 지금 겨울이지요? 눈이 와요? 저는 눈을 아직 못 봤어요. 다음 달에 서울에 갈 거예요. 서울에서 스키를 배우고 싶어요. 그때 같이 스키장에 갈래요?\n\n하노이에서 란 씀',
      vi: 'Gửi Minsu: Hà Nội dạo này rất nóng, ban ngày 35 độ nên tôi mặc áo cộc và quần soóc. Seoul giờ là mùa đông nhỉ? Có tuyết không? Tôi chưa từng thấy tuyết. Tháng sau tôi sẽ đến Seoul, muốn học trượt tuyết. Khi đó cùng đi khu trượt tuyết nhé? — Lan, từ Hà Nội.',
      q: [
        mc('하노이 날씨는 어때요?', ['아주 더워요.', '아주 추워요.', '눈이 와요.', '시원해요.'], '하노이는 요즘 아주 더워요.'),
        mc('란 씨는 다음 달에 무엇을 할 거예요?', ['서울에 갈 거예요.', '하노이에 갈 거예요.', '반바지를 살 거예요.', '수영을 배울 거예요.'], '다음 달에 서울에 갈 거예요.'),
        mc('Câu nào đúng?', ['란 씨는 눈을 못 봤어요.', '서울은 지금 여름이에요.', '란 씨는 스키를 잘 타요.', '민수 씨는 하노이에 살아요.'], '저는 눈을 아직 못 봤어요.', { d: 2 }),
      ],
    }],
  },
  culture: {
    title: 'Bốn mùa ở Hàn Quốc',
    paras: [
      'Hàn Quốc có bốn mùa rõ rệt. Mùa xuân (tháng 3–5) ấm áp, hoa anh đào, hoa mộc lan, hoa đỗ quyên nở; đôi khi có bụi vàng.',
      'Mùa hè (tháng 6–8) nóng ẩm, có mùa mưa (장마) kéo dài khoảng tháng 6–7. Mùa thu (tháng 9–11) mát mẻ, trời cao, lá phong đỏ vàng (단풍) — mùa lý tưởng để leo núi.',
      'Mùa đông (tháng 12–2) lạnh và khô, nhiệt độ có thể xuống dưới −10°C; có tuyết, nhiều người đi trượt tuyết.',
    ],
    compare: 'Miền Bắc Việt Nam cũng có bốn mùa nhưng mùa đông hiếm khi có tuyết; miền Nam chỉ có mùa mưa và mùa khô.',
  },
  writing: [
    wr('Viết về thời tiết quê bạn (4 câu): mùa, nhiệt độ, bạn thường làm gì.', { min_len: 30, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có tên mùa', kind: 'anyOf', value: ['봄', '여름', '가을', '겨울'], tip: 'Ví dụ: 여름에는 …' },
      { label: 'Dùng -고 nối câu', kind: 'regex', value: '[가-힣]고 ', tip: 'Ví dụ: 덥고 비가 와요.' },
      { label: 'Có từ thời tiết', kind: 'anyOf', value: ['더워', '덥', '추워', '춥', '따뜻', '시원', '비', '눈', '바람', '맑', '흐리'], tip: 'Dùng từ thời tiết đã học.' }] },
    '제 고향은 하노이예요. 여름은 덥고 비가 많이 와요. 기온이 삼십오 도까지 올라가요. 겨울은 쌀쌀하고 바람이 불어요. 저는 가을을 가장 좋아해요.', ''),
    wr('Kế hoạch kỳ nghỉ sắp tới của bạn (3 câu, dùng -(으)ㄹ 거예요 và 부터 ~ 까지).', { min_len: 25, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -(으)ㄹ 거예요', kind: 'regex', value: '[가-힣] (거예요|겁니다)', tip: 'Ví dụ: 여행할 거예요.' },
      { label: 'Dùng 부터 … 까지', kind: 'regex', value: '부터.*까지', tip: 'Ví dụ: 7월부터 8월까지.' }] },
    '7월부터 8월까지 방학이에요. 방학에 가족하고 다낭에 갈 거예요. 바다에서 수영할 거예요.', ''),
  ],
};
