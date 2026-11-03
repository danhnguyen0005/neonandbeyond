// Sơ cấp 1 · Bài 4 — 날짜와 요일 (Ngày và thứ)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const D = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
// Đọc số Hán Hàn (đến 99.999.999)
function sino(n) {
  if (n === 0) return '영';
  const unit = (x) => { let s = ''; [[1000, '천'], [100, '백'], [10, '십']].forEach(([v, w]) => { const d = Math.floor(x / v) % 10; if (d) s += (d === 1 ? '' : D[d]) + w; }); return s + D[x % 10]; };
  const man = Math.floor(n / 10000), rest = n % 10000;
  return (man ? (man === 1 ? '' : unit(man)) + '만' : '') + unit(rest);
}
const month = (m) => (m === 6 ? '유월' : m === 10 ? '시월' : sino(m) + '월');
const shuffleNear = (n, fn) => [fn(n), fn(n + 1), fn(n + 10 <= 31 ? n + 10 : n - 10), fn(Math.max(1, n - 1))];

const numQ = [3, 11, 14, 20, 26, 38, 45, 57, 61, 79, 84, 96, 100, 105, 250, 1000, 3600, 10000, 25000].map((n) => {
  const right = sino(n);
  const wrongs = [...new Set([sino(n + 1), sino(n * 10), sino(n + 10), sino(Math.max(1, n - 1)), sino(n + 100)])].filter((x) => x !== right).slice(0, 3);
  return mc(`Số <b>${n.toLocaleString('vi-VN')}</b> đọc theo số Hán Hàn là:`, [right, ...wrongs], `${n} = ${right}.`, { tag: 'number', d: n >= 1000 ? 2 : 1 });
});
const dateQ = [[1, 1], [3, 15], [5, 8], [6, 25], [9, 2], [10, 9], [12, 24], [4, 30], [7, 17], [11, 11]].map(([m, d]) => {
  const right = `${month(m)} ${sino(d)} 일`;
  const wrong = [m === 6 ? `육월 ${sino(d)} 일` : m === 10 ? `십월 ${sino(d)} 일` : `${month(m === 12 ? 11 : m + 1)} ${sino(d)} 일`, `${month(m)} ${sino(d === 31 ? 30 : d + 1)} 일`, `${sino(d)}월 ${sino(m)} 일`];
  return mc(`Đọc ngày <b>${m}월 ${d}일</b>:`, [right, ...wrong.filter((x) => x !== right)], `${m}월 ${d}일 = ${right}${m === 6 || m === 10 ? ' (tháng 6, 10 đọc biến âm: 유월, 시월)' : ''}.`, { tag: 'number', d: m === 6 || m === 10 ? 2 : 1 });
});
void shuffleNear;

module.exports = {
  unit: 4, ko: '날짜와 요일', vi: 'Ngày và thứ', vocabName: 'thứ, ngày tháng, thời gian',
  vocab: [
    ['Thứ trong tuần', [['월요일', 'thứ hai'], ['화요일', 'thứ ba'], ['수요일', 'thứ tư'], ['목요일', 'thứ năm'], ['금요일', 'thứ sáu'], ['토요일', 'thứ bảy'], ['일요일', 'chủ nhật']]],
    ['Ngày tháng', [['년', 'năm'], ['월', 'tháng'], ['일', 'ngày'], ['시', 'giờ'], ['유월', 'tháng sáu'], ['시월', 'tháng mười'], ['그저께', 'hôm kia'], ['어제', 'hôm qua'], ['오늘', 'hôm nay'], ['내일', 'ngày mai'], ['모레', 'ngày kia']]],
    ['Tuần, tháng, năm', [['지난해', 'năm ngoái'], ['작년', 'năm ngoái'], ['올해', 'năm nay'], ['내년', 'năm sau'], ['지난달', 'tháng trước'], ['이번 달', 'tháng này'], ['다음 달', 'tháng sau'],
      ['지난주', 'tuần trước'], ['이번 주', 'tuần này'], ['다음 주', 'tuần sau'], ['평일', 'ngày thường'], ['주말', 'cuối tuần']]],
    ['Từ mới trong bài', [['생일', 'sinh nhật'], ['생일 파티', 'tiệc sinh nhật'], ['시험', 'kỳ thi'], ['숙제', 'bài tập'], ['방학', 'kỳ nghỉ (học sinh)'], ['휴가', 'kỳ nghỉ (đi làm)'], ['설날', 'Tết'], ['명절', 'ngày lễ truyền thống'],
      ['한글날', 'ngày Hangeul'], ['크리스마스', 'Giáng sinh'], ['등산', 'leo núi'], ['산', 'núi'], ['아르바이트', 'việc làm thêm'], ['전화번호', 'số điện thoại'], ['졸업', 'tốt nghiệp'], ['회의하다', 'họp'],
      ['구경하다', 'ngắm, tham quan'], ['아름답다', 'đẹp'], ['층', 'tầng'], ['호', 'số (phòng)'], ['며칠', 'ngày mấy'], ['몇', 'mấy']]],
  ],
  vocabNote: 'Tháng 6 và tháng 10 đọc biến âm: 유월 (không phải 육월), 시월 (không phải 십월). Hỏi ngày: 며칠이에요? Hỏi thứ: 무슨 요일이에요?',
  vocabMistakes: ['Viết 몇 일 → đúng là 며칠.', '육월, 십월 → đúng là 유월, 시월.'],
  grammar: [
    {
      name: 'Số từ Hán Hàn', desc: 'Số 일, 이, 삼… dùng cho ngày tháng năm, số điện thoại, tầng, số phòng, tiền.',
      lesson: {
        goal: 'Đọc và nói số Hán Hàn: ngày tháng, số điện thoại, số tầng.',
        formula: '0 영/공 · 1 일 · 2 이 · 3 삼 · 4 사 · 5 오 · 6 육 · 7 칠 · 8 팔 · 9 구 · 10 십 · 100 백 · 1.000 천 · 10.000 만',
        explain: 'Số lớn ghép theo hàng: 23 = 이십삼, 105 = 백오, 2.500 = 이천오백. Số 1 đứng đầu hàng 십/백/천/만 không đọc: 10 = 십 (không phải 일십), 100 = 백. Lưu ý 10.000 là 만 — người Hàn đếm theo nhóm 4 chữ số: 50.000 = 오만. Trong số điện thoại, dấu “-” đọc là 에, số 0 đọc là 공.',
        examples: [['오늘은 2월 15일입니다.', 'Hôm nay là ngày 15 tháng 2. (이월 십오 일)'], ['제 전화번호는 010-2873-1954입니다.', 'Số điện thoại của tôi là… (공일공에 이팔칠삼에 일구오사)'], ['식당이 3층에 있습니다.', 'Nhà ăn ở tầng 3. (삼 층)'], ['저는 2024년에 졸업합니다.', 'Tôi tốt nghiệp năm 2024. (이천이십사 년)']],
        mistakes: ['Đọc 10.000 là 십천 — đúng là 만.', 'Đọc 100 là 일백 — chỉ cần 백.', '유월/시월 viết theo cách đọc biến âm.'],
        compare: 'Tiếng Việt nhóm số theo nghìn (1.000.000 = một triệu), tiếng Hàn nhóm theo vạn (1.000.000 = 백만 = một trăm vạn).',
      },
      q: [
        ...numQ, ...dateQ,
        mc('Số phòng 305호 đọc là:', ['삼백오 호', '삼공오 호', '삼백영오 호', '셋백다섯 호'], '305 = 삼백오.', { tag: 'number' }),
        mc('A: 생일이 며칠이에요?  B: ___', ['시월 구 일이에요.', '십월 구 일이에요.', '목요일이에요.', '구 시예요.'], 'Hỏi 며칠 → trả lời ngày; tháng 10 đọc 시월.', { d: 2 }),
        mc('A: 전화번호가 몇 번이에요?  B: 010-7623-5959 — dấu “-” đọc là:', ['에', '의', '하고', '이'], 'Dấu gạch nối trong số điện thoại đọc là 에.', { tag: 'number' }),
        fill('Viết bằng chữ Hàn số: 47 (Hán Hàn)', ['사십칠'], '40 = 사십, 7 = 칠.', { tag: 'number' }),
        fill('Viết bằng chữ Hàn số: 1.500 (Hán Hàn)', ['천오백'], '1.000 = 천 (không đọc 일), 500 = 오백.', { tag: 'number' }),
        fill('Viết bằng chữ Hàn số: 20.000 (Hán Hàn)', ['이만'], '10.000 = 만 → 20.000 = 이만.', { tag: 'number', d: 3 }),
        ls('이천이십육 년', ['2026', '2016', '2006', '2062'], '이천 (2000) + 이십육 (26).', { prompt: 'Nghe và chọn số đúng.', fixed: false, tag: 'number' }),
        ls('삼월 십사 일', ['14/3', '4/3', '13/4', '3/14'], '삼월 = tháng 3, 십사 일 = ngày 14.', { prompt: 'Nghe và chọn ngày đúng.', tag: 'number' }),
        ls('구 층', ['Tầng 9', 'Tầng 6', 'Tầng 2', 'Tầng 10'], '구 = 9, 층 = tầng.', { prompt: 'Nghe và chọn đáp án đúng.', tag: 'number' }),
      ],
    },
    {
      name: 'N와/과 (và)', desc: 'Nối hai danh từ: “A và B”.',
      lesson: {
        goal: 'Nối hai danh từ bằng 와/과.',
        formula: 'Danh từ không patchim + 와  ·  Danh từ có patchim + 과',
        explain: '와/과 nối hai danh từ ngang hàng. Chọn theo danh từ ĐỨNG TRƯỚC: 시계와 가방 (시계 không patchim), 책상과 의자 (책상 có patchim). Lưu ý: ngược với 은/는, 이/가 — ở đây dạng có patchim là 과.',
        examples: [['교실에 책상과 의자가 있습니다.', 'Trong lớp có bàn và ghế.'], ['여기에 시계와 가방이 있습니다.', 'Ở đây có đồng hồ và cặp.'], ['토요일과 일요일에 쉽니다.', 'Nghỉ thứ bảy và chủ nhật.']],
        mistakes: ['Chọn theo danh từ đứng sau — phải nhìn danh từ đứng TRƯỚC 와/과.', 'Nhầm chiều: có patchim → 과 (không phải 와).'],
      },
      gen: [{ kind: 'particle', pair: ['과', '와'], note: '(와/과 chọn theo danh từ đứng trước.)', items: [
        ['책상', '책상___ 의자'], ['시계', '시계___ 가방'], ['빵', '빵___ 우유'], ['커피', '커피___ 차'], ['월요일', '월요일___ 수요일'], ['어머니', '어머니___ 아버지'], ['한국', '한국___ 베트남'],
        ['사과', '사과___ 빵'], ['연필', '연필___ 공책'], ['친구', '친구___ 선생님'], ['숙제', '숙제___ 시험'], ['토요일', '토요일___ 일요일']] }],
      q: [
        tr('Dịch: “Có sách và từ điển.”', ['책과 사전이 있습니다.', '책과 사전이 있습니다', '책과 사전이 있어요.'], '책 có patchim → 과.'),
        err(['저는', '커피과', '빵을', '좋아합니다.'], 1, '커피 không patchim → 커피와.'),
      ],
    },
    {
      name: 'N에 (thời gian)', desc: '“Vào lúc …”: 에 sau từ chỉ thời gian.',
      lesson: {
        goal: 'Nói thời điểm xảy ra hành động.',
        formula: 'Thời gian + 에 (trừ 언제, 어제, 오늘, 내일, 그저께, 모레, 지금)',
        explain: '에 gắn sau danh từ chỉ thời gian: 토요일에, 3월에, 아침에, 주말에. Các từ 언제, 어제, 오늘, 내일, 그저께, 모레, 지금 tự nó là trạng từ nên KHÔNG thêm 에.',
        examples: [['토요일에 영화를 봅니다.', 'Thứ bảy tôi xem phim.'], ['12월 10일에 생일 파티를 합니다.', 'Tổ chức tiệc sinh nhật vào ngày 10/12.'], ['내일 시험을 봅니다.', 'Ngày mai thi. (không có 에)']],
        mistakes: ['오늘에, 내일에, 언제에 ✗ — bỏ 에.'],
      },
      q: [
        mc('Chọn câu đúng:', ['내일 친구를 만납니다.', '내일에 친구를 만납니다.', '내일에서 친구를 만납니다.', '내일을 친구를 만납니다.'], '내일 không đi với 에.', { fb: { '내일에 친구를 만납니다.': '내일, 오늘, 어제… không thêm 에.' } }),
        mc('주말___ 등산을 합니다.', ['에', '에서', '을', '(không cần)'], 'Thời gian 주말 + 에.', { fixed: true, tag: 'particle' }),
        mc('Câu nào SAI?', ['언제에 시험을 봅니까?', '금요일에 시험을 봅니다.', '오늘 숙제를 합니다.', '3월에 방학을 합니다.'], '언제 không đi với 에.', { d: 2 }),
        fill('Điền tiểu từ (nếu cần): 일요일___ 쉽니다.', ['에'], 'Thứ trong tuần + 에.'),
        tr('Dịch: “Ngày 15 tháng 2 tôi có kỳ thi.” (dùng 시험이 있습니다)', ['2월 15일에 시험이 있습니다.', '이월 십오 일에 시험이 있습니다.', '2월 15일에 시험이 있습니다', '2월 15일에 시험이 있어요.'], 'Ngày tháng + 에.', { d: 3 }),
        ord('Sắp xếp: “Thứ bảy tôi xem phim.”', ['토요일에', '영화를', '봅니다.'], 'Thời gian에 – tân ngữ – động từ.'),
      ],
    },
  ],
  pron: {
    name: '7 âm cuối đại diện', desc: 'Patchim chỉ có 7 cách đọc: [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ].',
    lesson: { goal: 'Đọc đúng patchim cuối từ.', explain: 'ㄱ, ㅋ, ㄲ đọc [ㄱ]; ㅂ, ㅍ đọc [ㅂ]; ㄷ, ㅌ, ㅅ, ㅆ, ㅈ, ㅊ, ㅎ đọc [ㄷ]. Các patchim ㄴ, ㄹ, ㅁ, ㅇ đọc như chữ.',
      examples: [['부엌 → [부억]', 'bếp'], ['잎 → [입]', 'lá'], ['옷 → [옫]', 'áo'], ['꽃 → [꼳]', 'hoa'], ['밖 → [박]', 'bên ngoài']] },
    q: [
      mc('옷 được đọc là:', ['[옫]', '[옷]', '[오]', '[옥]'], 'ㅅ ở cuối đọc [ㄷ].', { fixed: true }),
      mc('Cặp nào có patchim ĐỌC GIỐNG nhau?', ['박 – 밖', '입 – 잎 – 일', '낫 – 낭', '꽃 – 꼼'], '박 và 밖 đều đọc [박].', { d: 2 }),
      mc('끝 được đọc là:', ['[끋]', '[끝]', '[끅]', '[끕]'], 'ㅌ ở cuối đọc [ㄷ].', { fixed: true }),
      ls('부엌', ['[부억]', '[부어]', '[부엉]', '[부업]'], 'ㅋ ở cuối đọc [ㄱ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true }),
    ],
  },
  listening: {
    desc: 'Nghe ngày tháng, thứ, số điện thoại.',
    q: [
      ls('오늘은 수요일입니다.', ['Hôm nay là thứ tư.', 'Hôm nay là thứ năm.', 'Ngày mai là thứ tư.', 'Hôm qua là thứ tư.'], '수요일 = thứ tư.'),
      ls('내일은 토요일입니다.', ['Ngày mai là thứ bảy.', 'Hôm nay là thứ bảy.', 'Ngày mai là chủ nhật.', 'Hôm qua là thứ bảy.'], '내일 = ngày mai.'),
      ls('생일이 유월 이십 일입니다.', ['Sinh nhật ngày 20/6.', 'Sinh nhật ngày 2/6.', 'Sinh nhật ngày 20/10.', 'Sinh nhật ngày 26/1.'], '유월 = tháng 6, 이십 일 = ngày 20.', { d: 2 }),
      ls('다음 주 금요일에 시험을 봅니다.', ['Thứ sáu tuần sau thi.', 'Thứ sáu tuần này thi.', 'Thứ năm tuần sau thi.', 'Thứ sáu tuần trước thi.'], '다음 주 = tuần sau, 금요일 = thứ sáu.', { d: 2 }),
      ls('공일공에 삼사오육에 칠팔구공', ['010-3456-7890', '010-3546-7980', '011-3456-7890', '010-3456-7809'], '공 = 0, 에 = dấu gạch.', { prompt: 'Nghe và chọn số điện thoại đúng.', d: 3, tag: 'number' }),
    ],
    passages: [{
      title: 'Hẹn ngày', ko: '란: 민수 씨, 생일이 언제예요?\n민수: 시월 십칠 일이에요.\n란: 그날이 무슨 요일이에요?\n민수: 금요일이에요. 금요일 저녁에 생일 파티를 해요.\n란: 파티는 어디에서 해요?\n민수: 학교 앞 카페에서 해요.',
      q: [
        mc('민수 씨의 생일은 언제입니까?', ['17/10', '7/10', '17/4', '10/17'], '시월 십칠 일 = 17/10.'),
        mc('생일 파티는 무슨 요일에 합니까?', ['금요일', '토요일', '목요일', '일요일'], '금요일 저녁에 생일 파티를 해요.'),
        mc('파티는 어디에서 합니까?', ['카페', '학교', '집', '식당'], '학교 앞 카페에서.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Lịch tháng 10 của Hoa', ko: '10월 3일(월): 한국어 시험\n10월 5일(수): 아르바이트\n10월 9일(일): 한글날 — 친구와 경복궁 구경\n10월 14일(금): 회의\n10월 22일(토): 등산',
      vi: 'Lịch: 3/10 thi tiếng Hàn; 5/10 làm thêm; 9/10 ngày Hangeul – tham quan Gyeongbokgung với bạn; 14/10 họp; 22/10 leo núi.',
      q: [
        mc('화 씨는 언제 시험을 봅니까?', ['시월 삼 일', '시월 오 일', '시월 구 일', '시월 십사 일'], '10월 3일: 한국어 시험.'),
        mc('토요일에 무엇을 합니까?', ['등산을 합니다.', '회의를 합니다.', '아르바이트를 합니다.', '시험을 봅니다.'], '10월 22일(토): 등산.'),
        mc('한글날은 며칠입니까?', ['10월 9일', '10월 3일', '10월 14일', '10월 22일'], '10월 9일: 한글날.'),
      ],
    }],
  },
  culture: {
    title: 'Cách biểu hiện số trong tiếng Hàn',
    paras: [
      'Tiếng Hàn có hai hệ số: số Hán Hàn (일, 이, 삼…) và số thuần Hàn (하나, 둘, 셋…). Ngày, tháng, năm, số điện thoại, số tầng, số phòng, tiền dùng số Hán Hàn; đếm đồ vật, tuổi, giờ dùng số thuần Hàn (học ở Bài 5).',
      'Người Hàn chia số lớn theo đơn vị vạn (만 = 10.000), nên 100.000 là 십만, 1.000.000 là 백만. Đây là điểm người Việt hay nhầm khi nói giá tiền.',
      'Số 4 (사) đồng âm với chữ “tử” nên một số toà nhà ghi tầng 4 là F thay vì 4.',
    ],
    compare: 'Tiếng Việt cũng kiêng số 4 ở một số nơi, nhưng phổ biến hơn là con số may mắn 8 và 9.',
  },
  writing: [
    wr('Viết lịch tuần này của bạn: 3 câu, mỗi câu có thứ + 에 + việc làm.', { min_len: 20, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có thứ trong tuần', kind: 'regex', value: '요일', tip: 'Ví dụ: 월요일, 토요일.' },
      { label: 'Dùng 에 sau thời gian', kind: 'regex', value: '요일에', tip: 'Thứ + 에: 월요일에.' }] },
    '월요일에 한국어를 공부합니다. 수요일에 아르바이트를 합니다. 토요일에 친구와 영화를 봅니다.', ''),
    wr('Giới thiệu sinh nhật và số điện thoại của bạn (2 câu, viết số bằng chữ số).', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có 생일', kind: 'includes', value: '생일', tip: '제 생일은 …월 …일입니다.' },
      { label: 'Có 전화번호', kind: 'includes', value: '전화번호', tip: '제 전화번호는 …입니다.' }] },
    '제 생일은 5월 12일입니다. 제 전화번호는 090-123-4567입니다.', ''),
  ],
};
