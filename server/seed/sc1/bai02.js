// Sơ cấp 1 · Bài 2 — 학교 (Trường học)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

module.exports = {
  unit: 2, ko: '학교', vi: 'Trường học', vocabName: 'nơi chốn, trường học, đồ vật',
  vocab: [
    ['Nơi chốn (1)', [['학교', 'trường học'], ['도서관', 'thư viện'], ['식당', 'nhà ăn, nhà hàng'], ['호텔', 'khách sạn'], ['극장', 'rạp, nhà hát'], ['우체국', 'bưu điện'], ['병원', 'bệnh viện'], ['은행', 'ngân hàng'],
      ['백화점', 'trung tâm thương mại'], ['약국', 'hiệu thuốc'], ['가게', 'cửa hàng'], ['사무실', 'văn phòng']]],
    ['Trang thiết bị trường học', [['강의실', 'giảng đường, phòng học'], ['교실', 'phòng học, lớp học'], ['화장실', 'nhà vệ sinh'], ['휴게실', 'phòng nghỉ'], ['어학실', 'phòng Lab ngoại ngữ'], ['동아리방', 'phòng câu lạc bộ'],
      ['체육관', 'nhà thi đấu'], ['운동장', 'sân vận động'], ['강당', 'hội trường'], ['학생 식당', 'nhà ăn sinh viên'], ['세미나실', 'phòng hội thảo'], ['서점', 'hiệu sách']]],
    ['Đồ vật trong phòng học', [['책상', 'cái bàn'], ['의자', 'cái ghế'], ['칠판', 'bảng'], ['문', 'cửa ra vào'], ['창문', 'cửa sổ'], ['시계', 'đồng hồ'], ['가방', 'cặp, túi'], ['컴퓨터', 'máy vi tính'],
      ['책', 'sách'], ['공책', 'vở'], ['사전', 'từ điển'], ['지우개', 'cục tẩy'], ['지도', 'bản đồ'], ['펜', 'bút'], ['필통', 'hộp bút']]],
    ['Từ mới trong bài', [['여기', 'ở đây'], ['거기', 'ở đó'], ['저기', 'ở kia'], ['어디', 'ở đâu'], ['이것', 'cái này'], ['그것', 'cái đó'], ['저것', 'cái kia'], ['무엇', 'cái gì'],
      ['있다', 'có, ở'], ['없다', 'không có'], ['많이', 'nhiều'], ['텔레비전', 'ti vi'], ['라디오', 'radio'], ['휴대전화', 'điện thoại di động']]],
  ],
  vocabNote: '이/그/저 = này/đó/kia: 이 gần người nói, 그 gần người nghe, 저 xa cả hai. Ghép với 것 (cái) → 이것/그것/저것; ghép với -기 (chỗ) → 여기/거기/저기.',
  grammar: [
    {
      name: '여기·거기·저기 / 이것·그것·저것', desc: 'Chỉ nơi chốn và đồ vật: đây/đó/kia, cái này/cái đó/cái kia.',
      lesson: {
        goal: 'Hỏi và trả lời “Đây là đâu?”, “Cái này là gì?”.',
        formula: '여기/거기/저기 + 는 + N입니다  ·  이것/그것/저것 + 은 + N입니다',
        explain: '여기 (đây) gần người nói, 거기 (đó) gần người nghe, 저기 (kia) xa cả hai người. Tương tự với đồ vật: 이것, 그것, 저것. Hỏi nơi chốn: 여기는 어디입니까? Hỏi đồ vật: 이것은 무엇입니까?',
        examples: [['여기는 도서관입니다.', 'Đây là thư viện.'], ['저기는 어디입니까?', 'Kia là đâu?'], ['이것은 무엇입니까?', 'Cái này là cái gì?'], ['그것은 사전입니다.', 'Cái đó là từ điển.']],
        mistakes: ['Hỏi đồ vật bằng 어디 hoặc hỏi nơi chốn bằng 무엇 — nơi chốn dùng 어디, đồ vật dùng 무엇.', '이것 có patchim → 이것은 (không phải 이것는).'],
        compare: 'Tiếng Việt có “đây/đó/kia” giống hệt ba cấp của tiếng Hàn.',
      },
      q: [
        mc('Cái túi ở ngay tay người nghe. Người nói hỏi: “___은 무엇입니까?”', ['그것', '이것', '저것', '여기'], 'Đồ vật gần người nghe → 그것.'),
        mc('Tòa nhà ở xa cả hai người. “___는 병원입니다.”', ['저기', '여기', '거기', '이것'], 'Nơi xa cả hai → 저기.'),
        mc('A: 여기는 어디입니까?  B: ___', ['여기는 우체국입니다.', '이것은 우체국입니다.', '네, 우체국입니까?', '우체국은 무엇입니까?'], 'Hỏi 어디 → trả lời tên nơi chốn.'),
        mc('A: 이것은 무엇입니까?  B: ___', ['그것은 지우개입니다.', '거기는 지우개입니다.', '이것은 어디입니까?', '저는 지우개입니다.'], 'Người nghe cầm đồ vật của người hỏi → gọi là 그것.', { d: 2 }),
        fill('Điền từ để hỏi: 저것은 ___입니까? (Cái kia là cái gì?)', ['무엇'], 'Hỏi đồ vật → 무엇.'),
        fill('Điền từ để hỏi: 여기는 ___입니까? (Đây là đâu?)', ['어디'], 'Hỏi nơi chốn → 어디.'),
        tr('Dịch: “Đây là thư viện.”', ['여기는 도서관입니다.', '여기는 도서관입니다'], '여기는 + 도서관입니다.'),
        ord('Sắp xếp: “Cái kia là đồng hồ.”', ['저것은', '시계입니다.'], '저것은 + N입니다.'),
      ],
    },
    {
      name: 'N이/가 (tiểu từ chủ ngữ)', desc: 'Đánh dấu chủ ngữ, hay đi với 있다/없다.',
      lesson: {
        goal: 'Chọn đúng 이/가 và dùng với 있습니다/없습니다.',
        formula: 'Có patchim + 이  ·  Không patchim + 가',
        explain: '이/가 đánh dấu chủ ngữ của câu, đặc biệt với 있다 (có) và 없다 (không có): 책이 있습니다, 시계가 없습니다. Khi trả lời câu hỏi 누가/무엇이, thông tin mới cũng đi với 이/가.',
        examples: [['책이 있습니다.', 'Có sách.'], ['시계가 없습니다.', 'Không có đồng hồ.'], ['컴퓨터가 많이 있습니다.', 'Có nhiều máy tính.']],
        mistakes: ['Dùng 은/는 cho mọi chủ ngữ — câu “có/không có cái gì” thường dùng 이/가.'],
        compare: '은/는 nêu chủ đề (“còn … thì”), 이/가 nêu chủ ngữ/thông tin mới.',
      },
      gen: [{ kind: 'particle', pair: ['이', '가'], note: '(이/가 chọn theo âm cuối của danh từ.)', items: [
        ['책', '교실에 책___ 있습니다.'], ['시계', '시계___ 없습니다.'], ['의자', '의자___ 많이 있습니다.'], ['칠판', '칠판___ 있습니까?'], ['컴퓨터', '컴퓨터___ 없습니다.'], ['창문', '창문___ 있습니다.'],
        ['가방', '가방___ 어디에 있습니까?'], ['지도', '지도___ 있습니다.'], ['필통', '필통___ 없습니다.'], ['사전', '사전___ 있습니까?'], ['화장실', '화장실___ 어디입니까?'], ['휴대전화', '휴대전화___ 없습니다.']] }],
      q: [
        err(['교실에', '시계는', '많이', '없습니다.'], 1, 'Câu “có/không có …” dùng 이/가: 시계가.', { d: 3 }),
      ],
    },
    {
      name: 'N에 있습니다/없습니다', desc: '“Có/không có ở …”: 에 chỉ vị trí tồn tại.',
      lesson: {
        goal: 'Nói đồ vật/người có ở đâu.',
        formula: 'Nơi chốn + 에 + N이/가 있습니다 / 없습니다',
        explain: '에 gắn sau danh từ chỉ nơi chốn để nói vị trí tồn tại, đi với 있다/없다. Hỏi: 화장실이 어디에 있습니까? Trả lời: 1층에 있습니다.',
        examples: [['교실에 컴퓨터가 있습니다.', 'Trong lớp có máy tính.'], ['학교에 은행이 없습니다.', 'Trong trường không có ngân hàng.'], ['도서관이 어디에 있습니까?', 'Thư viện ở đâu?']],
        mistakes: ['Bỏ 에 sau nơi chốn: “교실 컴퓨터가 있습니다” — cần 교실에.'],
      },
      q: [
        mc('“Trong phòng học có bảng.”', ['교실에 칠판이 있습니다.', '교실은 칠판에 있습니다.', '교실에 칠판가 있습니다.', '칠판에 교실이 있습니다.'], 'Nơi chốn + 에, vật + 이/가 + 있습니다.'),
        mc('A: 학교에 서점이 있습니까?  B: 아니요, ___', ['서점이 없습니다.', '서점이 있습니다.', '서점입니다.', '서점이 아닙니다.'], 'Phủ định của 있습니다 là 없습니다.'),
        fill('Điền tiểu từ: 도서관___ 컴퓨터가 많이 있습니다.', ['에'], 'Vị trí tồn tại → 에.'),
        fill('Điền: 화장실이 어디에 ___? (Nhà vệ sinh ở đâu?)', ['있습니까', '있습니까?'], 'Hỏi vị trí: 어디에 있습니까?'),
        tr('Dịch: “Trong lớp học không có máy tính.”', ['교실에 컴퓨터가 없습니다.', '교실에 컴퓨터가 없습니다', '교실에는 컴퓨터가 없습니다.'], '교실에 + 컴퓨터가 + 없습니다.'),
        ord('Sắp xếp: “Trong trường có thư viện.”', ['학교에', '도서관이', '있습니다.'], 'Nơi chốn에 → chủ ngữ이/가 → 있습니다.'),
      ],
    },
    {
      name: 'N이/가 아닙니다', desc: 'Phủ định danh từ: “không phải là …”.',
      lesson: {
        goal: 'Phủ định câu “A là B”.',
        formula: 'N + 이/가 아닙니다',
        explain: '아닙니다 là dạng trang trọng của 아니다 (không phải). Danh từ đứng trước đi với 이/가: 사전이 아닙니다, 의자가 아닙니다. Thường trả lời: 아니요, A이/가 아닙니다. B입니다.',
        examples: [['이것은 사전이 아닙니다.', 'Cái này không phải từ điển.'], ['아니요, 학생이 아닙니다. 선생님입니다.', 'Không, tôi không phải học sinh. Tôi là giáo viên.']],
        mistakes: ['Dùng 없습니다 thay cho 아닙니다: 없습니다 = không có; 아닙니다 = không phải.', 'Viết 의자이 아닙니다 — 의자 không patchim → 의자가.'],
      },
      q: [
        mc('A: 이것은 공책입니까?  B: 아니요, ___ 책입니다.', ['공책이 아닙니다.', '공책가 아닙니다.', '공책이 없습니다.', '공책은 있습니다.'], '공책 có patchim → 공책이 아닙니다.', { fb: { '공책이 없습니다.': '없습니다 = “không có”; muốn nói “không phải” dùng 아닙니다.' } }),
        mc('“Đây không phải là bệnh viện.”', ['여기는 병원이 아닙니다.', '여기는 병원이 없습니다.', '여기는 병원가 아닙니다.', '여기에 병원이 아닙니다.'], '병원 có patchim → 이 아닙니다.'),
        fill('Điền 이 hoặc 가: 저것은 시계___ 아닙니다.', ['가'], '시계 không patchim → 가.'),
        tr('Dịch: “Cái này không phải là bút.”', ['이것은 펜이 아닙니다.', '이것은 펜이 아닙니다'], '펜 có patchim ㄴ → 펜이 아닙니다.'),
        err(['그것은', '가방가', '아닙니다.'], 1, '가방 có patchim → 가방이.'),
      ],
    },
  ],
  pron: {
    name: 'Căng hoá (경음화)', desc: 'Sau patchim ㄱ, ㄷ, ㅂ, các âm ㄱ ㄷ ㅂ ㅅ ㅈ đọc thành âm căng.',
    lesson: { goal: 'Đọc đúng hiện tượng căng hoá.', explain: 'Khi âm tiết trước có patchim được đọc là [ㄱ], [ㄷ], [ㅂ] và âm sau bắt đầu bằng ㄱ, ㄷ, ㅂ, ㅅ, ㅈ, thì âm sau đọc thành ㄲ, ㄸ, ㅃ, ㅆ, ㅉ.',
      examples: [['식당 → [식땅]', 'nhà ăn'], ['책상 → [책쌍]', 'bàn học'], ['학교 → [학꾜]', 'trường học'], ['약국 → [약꾹]', 'hiệu thuốc']] },
    q: [
      mc('식당 được đọc là:', ['[식땅]', '[식당]', '[시당]', '[식탕]'], 'ㄱ + ㄷ → [ㄸ].', { fixed: true }),
      mc('책상 được đọc là:', ['[책쌍]', '[책상]', '[채상]', '[책장]'], 'ㄱ + ㅅ → [ㅆ].', { fixed: true }),
      mc('Từ nào có hiện tượng căng hoá?', ['약국', '의자', '교실', '시계'], '약국 [약꾹]: ㄱ + ㄱ → [ㄲ].'),
      ls('학교', ['[학꾜]', '[하교]', '[학교]', '[항교]'], 'ㄱ + ㄱ → [ㄲ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true }),
    ],
  },
  listening: {
    desc: 'Nghe hỏi đáp nơi chốn và đồ vật.',
    q: [
      ls('여기는 도서관입니다.', ['Đây là thư viện.', 'Đây là nhà ăn.', 'Kia là thư viện.', 'Thư viện ở đâu?'], '여기 = đây; 도서관 = thư viện.'),
      ls('저것은 무엇입니까?', ['Cái kia là gì?', 'Cái này là gì?', 'Kia là đâu?', 'Cái đó là gì?'], '저것 = cái kia.'),
      ls('교실에 컴퓨터가 없습니다.', ['Trong lớp không có máy tính.', 'Trong lớp có máy tính.', 'Máy tính ở trong lớp.', 'Lớp học ở đâu?'], '없습니다 = không có.'),
      ls('화장실이 어디에 있습니까?', ['Nhà vệ sinh ở đâu?', 'Đây là nhà vệ sinh.', 'Có nhà vệ sinh không?', 'Phòng nghỉ ở đâu?'], '어디에 있습니까 = ở đâu.'),
      ls('아니요, 사전이 아닙니다. 책입니다.', ['Không, không phải từ điển. Là sách.', 'Vâng, là từ điển.', 'Không có từ điển.', 'Có sách và từ điển.'], '아닙니다 = không phải.', { d: 2 }),
    ],
    passages: [{
      title: 'Tham quan trường', ko: '민준: 여기는 어디입니까?\n흐엉: 여기는 휴게실입니다.\n민준: 저기는 강의실입니까?\n흐엉: 아니요, 강의실이 아닙니다. 동아리방입니다.\n민준: 학교에 서점이 있습니까?\n흐엉: 네, 서점이 있습니다. 서점에 사전이 많이 있습니다.',
      q: [
        mc('Hai người đang ở đâu lúc đầu?', ['Phòng nghỉ', 'Giảng đường', 'Hiệu sách', 'Nhà ăn'], '여기는 휴게실입니다.'),
        mc('저기는 무엇입니까?', ['동아리방', '강의실', '서점', '학생 식당'], '강의실이 아닙니다. 동아리방입니다.'),
        mc('Câu nào đúng?', ['학교에 서점이 있습니다.', '학교에 서점이 없습니다.', '저기는 강의실입니다.', '여기는 동아리방입니다.'], '네, … 서점이 있습니다.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Ba địa điểm', ko: '여기는 명동입니다. 여기에 백화점이 있습니다. 은행도 있습니다.\n\n여기는 한국대학교입니다. 학교에 도서관이 있습니다. 강의실이 많이 있습니다. 그런데 병원은 없습니다.\n\n여기는 서울병원입니다. 병원 1층에 약국이 있습니다. 식당은 없습니다.',
      vi: 'Đây là Myeongdong: có trung tâm thương mại, ngân hàng. Đây là ĐH Hàn Quốc: có thư viện, nhiều giảng đường, nhưng không có bệnh viện. Đây là Bệnh viện Seoul: tầng 1 có hiệu thuốc, không có nhà ăn.',
      q: [
        mc('Ở 명동 có gì?', ['Trung tâm thương mại và ngân hàng', 'Thư viện', 'Hiệu thuốc', 'Bệnh viện'], '백화점이 있습니다. 은행도 있습니다.'),
        mc('한국대학교에 무엇이 없습니까?', ['병원', '도서관', '강의실', '은행'], '병원은 없습니다.'),
        mc('Câu nào đúng với bài đọc?', ['서울병원에 약국이 있습니다.', '서울병원에 식당이 있습니다.', '명동에 도서관이 있습니다.', '한국대학교에 강의실이 없습니다.'], '병원 1층에 약국이 있습니다.'),
      ],
    }],
  },
  culture: {
    title: 'Chế độ giáo dục Hàn Quốc',
    paras: [
      'Hệ thống trường học Hàn Quốc theo khung 6-3-3-4: tiểu học 6 năm, trung học cơ sở 3 năm, trung học phổ thông 3 năm, đại học 4 năm. Giáo dục bắt buộc kéo dài đến hết trung học cơ sở.',
      'Năm học có hai học kỳ: học kỳ 1 bắt đầu tháng 3, học kỳ 2 bắt đầu tháng 9. Đại học nghỉ hè khoảng cuối tháng 6 – cuối tháng 8 và nghỉ đông khoảng cuối tháng 12 – cuối tháng 2.',
      'Để vào đại học, học sinh được xét theo học bạ, kỳ thi năng lực đại học (수능) và có thể thêm phỏng vấn hoặc bài viết của từng trường. Áp lực thi cử lớn nên nhiều học sinh học thêm ở trung tâm (학원).',
    ],
    compare: 'Việt Nam theo khung 5-4-3 và năm học bắt đầu vào tháng 9; Hàn Quốc bắt đầu vào tháng 3.',
  },
  writing: [
    wr('Viết 3–4 câu giới thiệu trường của bạn: trường có gì, không có gì.', { min_len: 20, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có câu 여기는 … 입니다', kind: 'includes', value: '여기는', tip: 'Mở đầu: 여기는 + tên trường + 입니다.' },
      { label: 'Có 있습니다', kind: 'includes', value: '있습니다', tip: 'Nói trường có gì: …에 …이/가 있습니다.' },
      { label: 'Có 없습니다', kind: 'includes', value: '없습니다', tip: 'Nói trường không có gì: …이/가 없습니다.' }] },
    '여기는 하노이대학교입니다. 학교에 도서관이 있습니다. 강의실이 많이 있습니다. 수영장은 없습니다.', 'Dùng 에 cho nơi chốn và 이/가 cho đồ vật/nơi được nói đến.'),
    wr('Trong phòng học của bạn có gì? Viết 3 câu.', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có 교실에', kind: 'includes', value: '교실에', tip: 'Bắt đầu bằng 교실에 …' },
      { label: 'Dùng 이/가', kind: 'regex', value: '[가-힣](이|가) (있|없)', tip: 'Đồ vật + 이/가 + 있습니다/없습니다.' }] },
    '교실에 칠판이 있습니다. 책상이 많이 있습니다. 컴퓨터는 없습니다.', ''),
  ],
};
