// Sơ cấp 1 · Bài 14 — 취미 (Sở thích)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const SU = [['수영하다', 'bơi'], ['운전하다', 'lái xe'], ['타다', 'đi (xe), cưỡi'], ['읽다', 'đọc'], ['만들다', 'làm'], ['가다', 'đi'], ['먹다', 'ăn'], ['치다', 'chơi (đàn, bóng)'], ['부르다', 'hát'], ['찍다', 'chụp'], ['걷다', 'đi bộ'], ['듣다', 'nghe'],
  ['쓰다', 'viết'], ['살다', 'sống'], ['돕다', 'giúp'], ['말하다', 'nói']];
const GI = [['보다', 'xem'], ['읽다', 'đọc'], ['찍다', 'chụp'], ['그리다', 'vẽ'], ['듣다', 'nghe'], ['만들다', 'làm'], ['걷다', 'đi bộ'], ['요리하다', 'nấu ăn'], ['수집하다', 'sưu tầm'], ['여행하다', 'du lịch'], ['노래하다', 'hát'], ['쓰다', 'viết']];
const DIRR = [['듣다', 'nghe'], ['걷다', 'đi bộ'], ['묻다', 'hỏi'], ['싣다', 'chất (lên xe)'], ['닫다', 'đóng'], ['받다', 'nhận'], ['믿다', 'tin'], ['얻다', 'giành được']];

module.exports = {
  unit: 14, ko: '취미', vi: 'Sở thích', vocabName: 'thể thao, sở thích, tần suất, khả năng',
  vocab: [
    ['Môn thể thao', [['축구', 'bóng đá'], ['농구', 'bóng rổ'], ['배구', 'bóng chuyền'], ['야구', 'bóng chày'], ['족구', 'bóng chuyền bằng chân'], ['탁구', 'bóng bàn'], ['배드민턴', 'cầu lông'], ['테니스', 'quần vợt'], ['태권도', 'taekwondo'],
      ['골프', 'gôn'], ['스키', 'trượt tuyết'], ['요가', 'yoga'], ['마라톤', 'chạy marathon'], ['스케이트', 'trượt băng'], ['볼링', 'bowling'], ['조깅', 'chạy bộ'], ['수영', 'bơi']]],
    ['Sở thích', [['취미', 'sở thích'], ['독서', 'đọc sách'], ['책 읽기', 'đọc sách'], ['사진 찍기', 'chụp ảnh'], ['그림 그리기', 'vẽ tranh'], ['음악 감상', 'nghe nhạc'], ['여행', 'du lịch'], ['운동', 'tập thể thao'], ['영화 보기', 'xem phim'],
      ['우표 수집', 'sưu tầm tem'], ['컴퓨터 게임', 'chơi điện tử'], ['등산', 'leo núi'], ['요리', 'nấu ăn'], ['낚시', 'câu cá']]],
    ['Tần suất', [['항상', 'luôn luôn'], ['언제나', 'lúc nào cũng'], ['자주', 'thường xuyên'], ['가끔', 'thỉnh thoảng'], ['거의 안', 'hầu như không'], ['전혀', 'hoàn toàn (không)'], ['매일', 'mỗi ngày'], ['일주일에 한 번', 'một tuần một lần']]],
    ['Biểu hiện khả năng', [['잘하다', 'giỏi, làm tốt'], ['못하다', 'kém, không giỏi'], ['보통이다', 'bình thường'], ['조금 하다', 'biết một chút']]],
    ['Từ mới trong bài', [['가요', 'nhạc pop'], ['경기', 'trận đấu'], ['경치', 'phong cảnh'], ['건강', 'sức khoẻ'], ['걱정하다', 'lo lắng'], ['고등학교', 'trường THPT'], ['기초', 'cơ bản'], ['도시락', 'cơm hộp'], ['동아리', 'câu lạc bộ'],
      ['만화책', 'truyện tranh'], ['소설책', 'tiểu thuyết'], ['자막', 'phụ đề'], ['피아노', 'đàn piano'], ['기타', 'đàn ghi-ta'], ['오토바이', 'xe máy'], ['채팅하다', 'chat'], ['통역하다', 'thông dịch'], ['특기', 'sở trường'], ['주로', 'chủ yếu'], ['앞으로', 'từ nay về sau']]],
  ],
  vocabNote: 'Hỏi sở thích: 취미가 뭐예요? — 제 취미는 사진 찍기예요. Nói tần suất: 자주 (thường), 가끔 (thỉnh thoảng), 전혀 안 (hoàn toàn không). 전혀, 거의 luôn đi với phủ định.',
  vocabMistakes: ['전혀 좋아해요 ✗ → 전혀 안 좋아해요 / 전혀 좋아하지 않아요.'],
  grammar: [
    {
      name: '-(으)ㄹ 수 있다/없다 (có thể / không thể)', desc: 'Khả năng hoặc điều kiện cho phép.',
      lesson: {
        goal: 'Nói mình có thể/không thể làm gì.',
        formula: 'Gốc không patchim + ㄹ 수 있다/없다 · có patchim + 을 수 있다/없다 · gốc ㄹ + 수 있다',
        explain: 'Diễn tả năng lực hoặc khả năng thực hiện do hoàn cảnh: 수영할 수 있어요 (tôi có thể bơi), 시간이 없어서 갈 수 없어요 (không có thời gian nên không đi được). Gốc ㄹ: 만들다 → 만들 수 있어요. Bất quy tắc: 듣다 → 들을 수, 돕다 → 도울 수.',
        examples: [['토요일에 같이 등산할 수 있어요?', 'Thứ bảy cùng đi leo núi được không?'], ['네, 토요일에는 시간이 있어서 갈 수 있어요.', 'Được, thứ bảy có thời gian nên đi được.'], ['저는 오토바이를 탈 수 없어요.', 'Tôi không đi được xe máy.'], ['한국 음식을 만들 수 있어요.', 'Tôi nấu được món Hàn.']],
        mistakes: ['먹ㄹ 수 있어요 ✗ → 먹을 수 있어요.', '만들을 수 ✗ → 만들 수.', '듣을 수 ✗ → 들을 수.'],
        compare: '못 + V ≈ V(으)ㄹ 수 없다 (không thể). 잘하다 = làm giỏi (mức độ), -(으)ㄹ 수 있다 = làm được (khả năng).',
      },
      gen: [{ kind: 'verb', form: 'lsu_itda', verbs: SU, typed: 0.5 }],
      q: [
        mc('A: 피아노를 칠 수 있어요?  B: 아니요, ___', ['칠 수 없어요.', '칠 수 있어요.', '칠을 수 없어요.', '안 칠 수 있어요.'], 'Phủ định khả năng → -(으)ㄹ 수 없어요.'),
        mc('“Tôi có thể nói tiếng Hàn một chút.”', ['한국어를 조금 할 수 있어요.', '한국어를 조금 하을 수 있어요.', '한국어를 조금 할 수 없어요.', '한국어를 조금 해 수 있어요.'], '하 + ㄹ 수 있어요.'),
        fill('Điền: 저는 한국 노래를 (부르다) ___ 수 있어요.', ['부를'], '부르 + ㄹ → 부를.'),
        tr('Dịch: “Tôi không thể đi xe đạp.”', ['자전거를 탈 수 없어요.', '저는 자전거를 탈 수 없어요.', '자전거를 못 타요.', '저는 자전거를 못 타요.'], '타 + ㄹ 수 없어요 (≈ 못 타요).'),
        err(['저는', '음악을', '듣을 수', '없어요.'], 2, '듣다 (bất quy tắc ㄷ) → 들을 수.', { d: 3 }),
      ],
    },
    {
      name: '-기 / -는 것 (danh từ hoá)', desc: 'Biến động từ thành danh từ: “việc …”.',
      lesson: {
        goal: 'Nói sở thích bằng danh từ hoá động từ.',
        formula: 'Gốc + 기 · Gốc + 는 것 (gốc ㄹ bỏ ㄹ: 만드는 것)',
        explain: '-기 và -는 것 biến động từ thành danh từ để làm chủ ngữ, tân ngữ: 제 취미는 영화 보기예요; 저는 혼자 걷는 것을 좋아해요. Sau đó gắn tiểu từ như danh từ: 걷는 것을, 읽는 것이. Văn nói hay rút 것을 → 걸, 것이 → 게.',
        examples: [['제 취미는 영화 보기예요.', 'Sở thích của tôi là xem phim.'], ['저는 혼자 걷는 것을 좋아해요.', 'Tôi thích đi bộ một mình.'], ['술을 많이 마시는 것은 건강에 좋지 않아요.', 'Uống nhiều rượu không tốt cho sức khoẻ.'], ['한국어 책을 읽는 것이 어려워요.', 'Đọc sách tiếng Hàn khó.']],
        mistakes: ['Dùng động từ nguyên dạng làm tân ngữ: 저는 걷다를 좋아해요 ✗ → 걷는 것을.', '만들는 것 ✗ → 만드는 것.'],
      },
      gen: [{ kind: 'verb', form: 'gi', verbs: GI, typed: 0.3 }, { kind: 'verb', form: 'neun_geot', verbs: GI, typed: 0.3 }],
      q: [
        mc('A: 취미가 뭐예요?  B: 제 취미는 사진 ___', ['찍기예요.', '찍다예요.', '찍어요예요.', '찍는예요.'], '찍 + 기 → 찍기.'),
        mc('“Tôi thích nghe nhạc.”', ['저는 음악을 듣는 것을 좋아해요.', '저는 음악을 듣다를 좋아해요.', '저는 음악을 들어 것을 좋아해요.', '저는 음악을 듣기를 좋아해요요.'], 'V는 것을 좋아해요.'),
        tr('Dịch: “Sở thích của tôi là đọc sách.”', ['제 취미는 책 읽기예요.', '제 취미는 독서예요.', '제 취미는 책을 읽는 것이에요.', '제 취미는 책 읽는 것이에요.'], '책 읽기 / 독서.'),
        err(['저는', '케이크를', '만들는 것을', '좋아해요.'], 2, 'Gốc ㄹ bỏ ㄹ trước 는: 만드는 것.', { d: 3 }),
      ],
    },
    {
      name: 'Bất quy tắc ㄷ', desc: 'Gốc tận cùng ㄷ: ㄷ → ㄹ trước nguyên âm (듣다 → 들어요).',
      lesson: {
        goal: 'Chia đúng 듣다, 걷다, 묻다.',
        formula: 'ㄷ + nguyên âm → ㄹ: 듣다 → 들어요, 들었어요, 들을 거예요 · ngoại lệ: 닫다, 받다, 믿다, 얻다 (không đổi)',
        explain: 'Một số động từ gốc ㄷ (듣다, 걷다, 묻다, 싣다) đổi ㄷ thành ㄹ khi gặp đuôi bắt đầu bằng nguyên âm: 들어요, 걸었어요, 물어보세요. Gặp phụ âm thì giữ nguyên: 듣고, 걷지만. Các động từ 닫다 (đóng), 받다 (nhận), 믿다 (tin), 얻다 (đạt) là quy tắc: 닫아요, 받아요.',
        examples: [['무슨 노래를 들었어요?', 'Bạn đã nghe bài gì?'], ['어려우면 선생님께 물어보세요.', 'Nếu khó thì hãy hỏi thầy.'], ['누가 창문을 닫았어요? (quy tắc)', 'Ai đã đóng cửa sổ?'], ['저는 그 사람의 이야기를 믿어요. (quy tắc)', 'Tôi tin câu chuyện của người đó.']],
        mistakes: ['듣어요 ✗ → 들어요.', '받아요 → 발아요 ✗ (받다 là quy tắc).'],
      },
      gen: [{ kind: 'verb', form: 'polite', verbs: DIRR, typed: 0.6, d: 2 }, { kind: 'verb', form: 'past', verbs: DIRR, typed: 0.3, d: 2 }],
      q: [
        mc('A: 매일 운동해요?  B: 네, 공원에서 한 시간 ___', ['걸어요.', '걷어요.', '걸러요.', '걷아요.'], '걷다 → 걸어요.'),
        mc('Câu nào ĐÚNG?', ['선물을 받았어요.', '선물을 발았어요.', '음악을 듣었어요.', '길을 묻었어요.'], '받다 quy tắc; 듣다 → 들었어요; 묻다 → 물었어요.', { d: 3 }),
        fill('Chia: 저는 매일 아침 라디오를 (듣다) ___. (-아/어요)', ['들어요', '들어요.'], '듣 → 들어요.'),
      ],
    },
  ],
  pron: {
    name: 'Mũi hoá ㄱ ㄷ ㅂ + ㄴ/ㅁ', desc: '[ㄱ]→[ㅇ], [ㄷ]→[ㄴ], [ㅂ]→[ㅁ] trước ㄴ, ㅁ.',
    lesson: { goal: 'Đọc đúng 찍는, 듣는, 입맛…', explain: 'Patchim đọc [ㄱ], [ㄷ], [ㅂ] đứng trước ㄴ hoặc ㅁ sẽ đổi thành âm mũi tương ứng [ㅇ], [ㄴ], [ㅁ].',
      examples: [['찍는 것 → [찡는 걷]', 'việc chụp'], ['듣는 것 → [든는 걷]', 'việc nghe'], ['입맛 → [임맏]', 'khẩu vị'], ['한국말 → [한궁말]', 'tiếng Hàn'], ['읽는 → [잉는]', 'đọc (định ngữ)']] },
    q: [
      mc('찍는 được đọc là:', ['[찡는]', '[찍는]', '[찌는]', '[찐는]'], '[ㄱ] + ㄴ → [ㅇ].', { fixed: true }),
      mc('한국말 được đọc là:', ['[한궁말]', '[한국말]', '[한구말]', '[항국말]'], '[ㄱ] + ㅁ → [ㅇ].', { fixed: true }),
      ls('듣는 것', ['[든는 걷]', '[듣는 것]', '[드는 걷]', '[듬는 걷]'], '[ㄷ] + ㄴ → [ㄴ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 2 }),
    ],
  },
  listening: {
    desc: 'Nghe nói về sở thích và khả năng.',
    q: [
      ls('제 취미는 등산이에요.', ['Sở thích của tôi là leo núi.', 'Sở thích của tôi là bơi.', 'Tôi không thích leo núi.', 'Tôi leo núi giỏi.'], '등산 = leo núi.'),
      ls('저는 수영을 잘해요.', ['Tôi bơi giỏi.', 'Tôi không biết bơi.', 'Tôi thích bơi.', 'Tôi bơi một chút.'], '잘하다 = giỏi.'),
      ls('일주일에 한 번 테니스를 쳐요.', ['Một tuần chơi quần vợt một lần.', 'Mỗi ngày chơi quần vợt.', 'Một tháng chơi quần vợt một lần.', 'Không chơi quần vợt.'], '일주일에 한 번 = một tuần một lần.', { tag: 'number' }),
      ls('저는 컴퓨터 게임을 전혀 안 해요.', ['Tôi hoàn toàn không chơi điện tử.', 'Tôi thỉnh thoảng chơi điện tử.', 'Tôi chơi điện tử giỏi.', 'Tôi luôn chơi điện tử.'], '전혀 안 = hoàn toàn không.'),
      ls('기타를 칠 수 있어요?', ['Bạn chơi được ghi-ta không?', 'Bạn có ghi-ta không?', 'Bạn thích ghi-ta không?', 'Bạn mua ghi-ta chưa?'], '-ㄹ 수 있어요? = có thể … không?'),
    ],
    passages: [{
      title: 'Câu lạc bộ', ko: '선배: 우리 동아리는 사진 동아리예요. 사진 찍는 것을 좋아해요?\n투안: 네, 아주 좋아해요. 그런데 잘 못 찍어요.\n선배: 괜찮아요. 처음에는 기초부터 배워요. 카메라가 있어요?\n투안: 휴대폰 카메라만 있어요.\n선배: 휴대폰으로도 찍을 수 있어요. 우리는 일주일에 두 번 만나요. 주말에는 가끔 밖에서 찍어요.',
      q: [
        mc('무슨 동아리예요?', ['사진 동아리', '음악 동아리', '등산 동아리', '요리 동아리'], '사진 동아리예요.'),
        mc('동아리는 일주일에 몇 번 만나요?', ['2 lần', '1 lần', '3 lần', 'Mỗi ngày'], '일주일에 두 번.', { tag: 'number' }),
        mc('Câu nào đúng?', ['투안 씨는 사진을 잘 못 찍어요.', '투안 씨는 카메라가 있어요.', '동아리는 매일 만나요.', '주말에는 항상 밖에서 찍어요.'], '잘 못 찍어요.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Sở thích của tôi', ko: '제 취미는 한국 드라마 보기예요. 일주일에 서너 번 드라마를 봐요. 처음에는 자막을 보고 이해했어요. 하지만 지금은 자막 없이 조금 이해할 수 있어요. 드라마를 보는 것은 한국어 공부에 아주 좋아요. 그리고 저는 요리하는 것도 좋아해요. 주말에는 가끔 드라마에서 본 한국 음식을 만들어요. 아직 잘 못 만들지만 재미있어요.',
      vi: 'Sở thích của tôi là xem phim truyền hình Hàn, tuần 3–4 lần. Lúc đầu xem phụ đề, giờ có thể hiểu một chút khi không có phụ đề. Xem phim rất tốt cho việc học tiếng Hàn. Tôi cũng thích nấu ăn; cuối tuần thỉnh thoảng nấu món Hàn đã thấy trong phim — chưa giỏi nhưng vui.',
      q: [
        mc('이 사람은 일주일에 몇 번 드라마를 봐요?', ['3–4 lần', '1 lần', 'Mỗi ngày', '2 lần'], '서너 번 = 3–4 lần.', { tag: 'number', d: 2 }),
        mc('지금은 어때요?', ['Hiểu một chút khi không có phụ đề.', 'Hiểu hết không cần phụ đề.', 'Vẫn phải xem phụ đề.', 'Không hiểu gì.'], '자막 없이 조금 이해할 수 있어요.'),
        mc('주말에 가끔 무엇을 해요?', ['한국 음식을 만들어요.', '드라마를 찍어요.', '한국어를 가르쳐요.', '요리 학원에 가요.'], '한국 음식을 만들어요.'),
      ],
    }],
  },
  culture: {
    title: 'Thú vui của người Hàn Quốc',
    paras: [
      'Sở thích của người Hàn thay đổi theo độ tuổi: người trẻ thích chơi game, xem phim, nghe nhạc, chụp ảnh; người trung niên chuộng leo núi, đánh gôn, câu cá.',
      'Leo núi là hoạt động quốc dân: từ thanh niên đến người cao tuổi đều đi, đặc biệt mùa thu ngắm lá đỏ. Đạp xe dọc sông Hàn và chạy bộ cũng rất phổ biến.',
      'Hát karaoke ở 노래방 sau bữa ăn là văn hoá quen thuộc của bạn bè, đồng nghiệp.',
    ],
    compare: 'Người Việt cũng mê karaoke và đá bóng; leo núi và đánh gôn ở Việt Nam chưa phổ biến bằng ở Hàn.',
  },
  writing: [
    wr('Giới thiệu sở thích của bạn (4 câu): sở thích là gì, làm bao lâu một lần, có thể làm gì.', { min_len: 35, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có 취미', kind: 'includes', value: '취미', tip: '제 취미는 … 예요/이에요.' },
      { label: 'Danh từ hoá -기 / -는 것', kind: 'regex', value: '(기예요|기입니다|기를|는 것)', tip: 'Ví dụ: 영화 보기, 걷는 것.' },
      { label: 'Có tần suất', kind: 'anyOf', value: ['자주', '가끔', '매일', '항상', '언제나', '번', '전혀', '거의'], tip: 'Ví dụ: 자주, 일주일에 두 번.' },
      { label: 'Dùng -(으)ㄹ 수 있어요', kind: 'regex', value: '수 (있|없)', tip: 'V(으)ㄹ 수 있어요.' }] },
    '제 취미는 운동하기예요. 저는 매일 아침 공원에서 조깅을 해요. 그리고 일주일에 두 번 배드민턴을 쳐요. 저는 수영도 할 수 있어요. 하지만 스키는 탈 수 없어요.', ''),
  ],
};
