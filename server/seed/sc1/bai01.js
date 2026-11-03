// Sơ cấp 1 · Bài 1 — 소개 (Giới thiệu). Phạm vi từ vựng/ngữ pháp theo giáo trình; ví dụ và bài tập là bản soạn riêng.
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

module.exports = {
  unit: 1, ko: '소개', vi: 'Giới thiệu', vocabName: 'quốc gia, nghề nghiệp, lời chào',
  vocab: [
    ['Quốc gia', [['한국', 'Hàn Quốc'], ['베트남', 'Việt Nam'], ['말레이시아', 'Malaysia'], ['일본', 'Nhật Bản'], ['미국', 'Mỹ'], ['중국', 'Trung Quốc'], ['태국', 'Thái Lan'], ['호주', 'Úc'],
      ['몽골', 'Mông Cổ'], ['인도네시아', 'Indonesia'], ['필리핀', 'Philippines'], ['인도', 'Ấn Độ'], ['영국', 'Anh'], ['독일', 'Đức'], ['프랑스', 'Pháp'], ['러시아', 'Nga']]],
    ['Nghề nghiệp', [['학생', 'học sinh'], ['회사원', 'nhân viên công ty'], ['은행원', 'nhân viên ngân hàng'], ['선생님', 'giáo viên'], ['의사', 'bác sĩ'], ['공무원', 'công chức'],
      ['관광 가이드', 'hướng dẫn viên du lịch'], ['주부', 'nội trợ'], ['약사', 'dược sĩ'], ['운전기사', 'tài xế']]],
    ['Lời chào', [['안녕하세요?', 'Xin chào (thân thiện, lịch sự)'], ['안녕하십니까?', 'Xin chào (trang trọng)'], ['안녕히 가세요.', 'Tạm biệt (nói với người ra về)'], ['안녕히 계세요.', 'Tạm biệt (nói với người ở lại)'],
      ['처음 뵙겠습니다.', 'Rất hân hạnh (lần đầu gặp)'], ['반갑습니다.', 'Rất vui được gặp']]],
    ['Từ mới trong bài', [['사람', 'người'], ['이름', 'tên'], ['저', 'tôi (khiêm tốn)'], ['제', 'của tôi'], ['씨', 'anh/chị/bạn (gắn sau tên)'], ['네', 'vâng, dạ'], ['아니요', 'không'],
      ['국적', 'quốc tịch'], ['직업', 'nghề nghiệp'], ['대학교', 'trường đại học'], ['대학생', 'sinh viên'], ['한국어', 'tiếng Hàn'], ['한국어과', 'khoa tiếng Hàn'], ['학과', 'khoa, bộ môn'],
      ['학번', 'mã số sinh viên'], ['학생증', 'thẻ sinh viên'], ['주소', 'địa chỉ'], ['전화', 'điện thoại'], ['이메일', 'email'], ['은행', 'ngân hàng']]],
  ],
  vocabNote: 'Tên nước + 사람 = người nước đó: 베트남 사람 (người Việt Nam), 한국 사람 (người Hàn Quốc). Khi gọi người khác, gắn 씨 sau tên: 마이 씨, 민수 씨 — không dùng 씨 cho chính mình.',
  vocabExamples: [['저는 베트남 사람입니다.', 'Tôi là người Việt Nam.'], ['민수 씨는 회사원입니다.', 'Anh Minsu là nhân viên công ty.']],
  vocabMistakes: ['Không tự gọi mình là “tên + 씨”.', '안녕히 가세요 nói với người RA VỀ; 안녕히 계세요 nói với người Ở LẠI.'],
  grammar: [
    {
      name: 'N입니다 / N입니까?', desc: 'Câu “là …” trang trọng và câu hỏi “có phải là … không?”.',
      lesson: {
        goal: 'Nói và hỏi “A là B” một cách trang trọng.',
        formula: 'Danh từ + 입니다. (là …)   ·   Danh từ + 입니까? (là … phải không?)',
        explain: '입니다 là dạng trang trọng của 이다 (là), gắn liền vào sau danh từ, không cần xét patchim. Câu hỏi đổi 다 → 까 và lên giọng: 학생입니까? Trả lời khẳng định bằng 네, …입니다.',
        examples: [['저는 마이입니다.', 'Tôi là Mai.'], ['회사원입니까?', '(Anh/chị) là nhân viên công ty phải không?'], ['네, 회사원입니다.', 'Vâng, tôi là nhân viên công ty.'], ['선생님은 한국 사람입니까?', 'Cô giáo là người Hàn Quốc phải không?']],
        mistakes: ['Viết tách “학생 입니다” — 입니다 phải viết liền với danh từ: 학생입니다.', 'Dùng 입니까 nhưng chấm câu bằng dấu chấm — câu hỏi phải có dấu “?”.'],
        compare: 'Trong tiếng Việt “là” đứng trước danh từ (là học sinh); tiếng Hàn đặt 입니다 sau danh từ (학생입니다).',
      },
      q: [
        mc('Chọn câu đúng: “Tôi là học sinh.”', ['저는 학생입니다.', '저는 입니다 학생.', '학생은 저입니까?', '저는 학생입니까?'], 'Danh từ + 입니다 đặt cuối câu.', { tag: 'word_order' }),
        mc('Câu hỏi “Anh là người Hàn Quốc phải không?”', ['한국 사람입니까?', '한국 사람입니다.', '한국입니까 사람?', '사람 한국입니까?'], 'Câu hỏi dùng 입니까? ở cuối.'),
        mc('A: 의사입니까?  B: 네, ___', ['의사입니다.', '의사입니까?', '학생입니까?', '아니요.'], 'Trả lời khẳng định: 네 + danh từ + 입니다.'),
        fill('Điền vào chỗ trống: 저는 베트남 사람___. (Tôi là người Việt Nam.)', ['입니다', '입니다.'], 'Câu trần thuật trang trọng: 입니다.'),
        fill('Điền vào chỗ trống: 민수 씨는 은행원___? (Minsu là nhân viên ngân hàng phải không?)', ['입니까', '입니까?'], 'Câu hỏi: 입니까?'),
        ord('Sắp xếp thành câu: “Tôi là giáo viên.”', ['저는', '선생님입니다.'], 'Chủ đề (저는) đứng trước, 입니다 ở cuối.'),
        ord('Sắp xếp thành câu: “Tên tôi là Hoa.”', ['제', '이름은', '화입니다.'], '제 이름은 + tên + 입니다.'),
        tr('Dịch sang tiếng Hàn: “Tôi là bác sĩ.”', ['저는 의사입니다.', '저는 의사입니다', '의사입니다.', '의사입니다'], '의사 (bác sĩ) + 입니다.'),
        err(['저는', '회사원', '입니까.'], 2, 'Câu trần thuật kết thúc bằng 입니다. (입니까 chỉ dùng cho câu hỏi).'),
        mc('Câu nào là câu hỏi?', ['투안 씨입니까?', '투안 씨입니다.', '저는 투안입니다.', '제 이름은 투안입니다.'], '입니까? là đuôi nghi vấn.', { d: 1 }),
      ],
    },
    {
      name: 'N은/는 (tiểu từ chủ đề)', desc: 'Đánh dấu chủ đề của câu: “… thì / … là”.',
      lesson: {
        goal: 'Gắn đúng 은 hoặc 는 sau danh từ làm chủ đề.',
        formula: 'Danh từ có patchim + 은  ·  Danh từ không patchim + 는',
        explain: '은/는 cho biết câu đang nói về ai/cái gì. Danh từ kết thúc bằng phụ âm (có patchim) dùng 은: 이름은, 선생님은. Kết thúc bằng nguyên âm dùng 는: 저는, 마이 씨는. Khi chủ đề đã rõ, người Hàn thường lược bỏ nó.',
        examples: [['저는 학생입니다.', 'Tôi là học sinh.'], ['제 이름은 남입니다.', 'Tên tôi là Nam.'], ['선생님은 한국 사람입니다.', 'Thầy giáo là người Hàn Quốc.'], ['리사 씨는 미국 사람입니까?', 'Lisa là người Mỹ phải không?']],
        mistakes: ['Nhìn chữ cái Latin để chọn — phải nhìn âm tiết Hangeul cuối: 선생님 (có ㅁ) → 은.', '씨 không có patchim nên luôn là 씨는.'],
        compare: 'Tiếng Việt không có tiểu từ chủ đề; có thể hiểu gần như “thì/là”: 저는 = “tôi thì”.',
      },
      gen: [{ kind: 'particle', pair: ['은', '는'], note: '(은/는 chọn theo âm cuối của danh từ.)', items: [
        ['저', '저___ 베트남 사람입니다.'], ['이름', '제 이름___ 하이입니다.'], ['선생님', '선생님___ 한국 사람입니다.'], ['마이 씨', '마이 씨___ 학생입니까?'], ['친구', '제 친구___ 의사입니다.'],
        ['민준 씨', '민준 씨___ 회사원입니다.'], ['직업', '직업___ 무엇입니까?'], ['국적', '국적___ 베트남입니다.'], ['어머니', '어머니___ 주부입니다.'], ['아버지', '아버지___ 공무원입니다.'],
        ['학생', '그 학생___ 일본 사람입니다.'], ['은행원', '은행원___ 누구입니까?']] }],
      q: [
        mc('“Tên tôi là Lan” — chọn câu đúng.', ['제 이름은 란입니다.', '제 이름는 란입니다.', '저 이름은 란입니다.', '제 이름은 란입니까?'], '이름 có patchim ㅁ → 은; “của tôi” là 제.', { fb: { '제 이름는 란입니다.': '이름 kết thúc bằng ㅁ (có patchim) nên dùng 은.', '저 이름은 란입니다.': '“Của tôi” là 제 (저 + 의), không phải 저.' } }),
        tr('Dịch: “Thầy giáo là người Hàn Quốc.”', ['선생님은 한국 사람입니다.', '선생님은 한국 사람입니다'], '선생님 có patchim → 은; 한국 사람 + 입니다.', { common_wrong: [{ text: '선생님는 한국 사람입니다', why: '선생님 kết thúc bằng ㅁ (có patchim) → 선생님은.' }] }),
        err(['저은', '베트남', '사람입니다.'], 0, '저 không có patchim → 저는.'),
        err(['흐엉 씨는', '선생님는', '아닙니다.'], 1, '선생님 có patchim → 선생님은.', { d: 3 }),
      ],
    },
  ],
  pron: {
    name: 'Nối âm (연음)', desc: 'Patchim nối sang âm tiết sau bắt đầu bằng nguyên âm.',
    lesson: {
      goal: 'Đọc đúng hiện tượng nối âm.',
      explain: 'Khi âm tiết trước có patchim và âm tiết sau bắt đầu bằng ㅇ (câm), patchim được đọc nối sang âm tiết sau.',
      examples: [['한국어 → [한구거]', 'tiếng Hàn'], ['이름은 → [이르믄]', 'tên thì…'], ['학생입니다 → [학쌩임니다]', 'là học sinh'], ['선생님은 → [선생니믄]', 'giáo viên thì…']],
    },
    q: [
      mc('한국어 được đọc là:', ['[한구거]', '[한국어]', '[항구거]', '[한구어]'], 'Patchim ㄱ nối sang 어 → 거.', { fixed: true }),
      mc('이름은 được đọc là:', ['[이르믄]', '[이름은]', '[이르은]', '[이름믄]'], 'Patchim ㅁ nối sang 은 → 믄.', { fixed: true }),
      mc('Từ nào KHÔNG có hiện tượng nối âm?', ['베트남 사람', '직업이', '선생님은', '한국어'], '사람 bắt đầu bằng phụ âm ㅅ nên 남 không nối âm.'),
      ls('공무원입니다', ['[공무워님니다]', '[공무원입니다]', '[공무워닙니다]', '[공문원임니다]'], 'ㄴ nối sang 입 → 닙, rồi ㅂ trước ㄴ đọc thành [ㅁ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 2 }),
    ],
  },
  listening: {
    desc: 'Nghe chào hỏi, quốc tịch, nghề nghiệp.',
    q: [
      ls('안녕하세요? 저는 마이입니다.', ['Xin chào, tôi là Mai.', 'Tạm biệt, tôi là Mai.', 'Tên bạn là Mai phải không?', 'Mai là người Việt Nam.'], '안녕하세요 = xin chào; 저는 마이입니다 = tôi là Mai.'),
      ls('저는 일본 사람입니다.', ['Tôi là người Nhật.', 'Tôi là người Hàn.', 'Tôi là người Trung Quốc.', 'Tôi là người Thái.'], '일본 = Nhật Bản.'),
      ls('민수 씨는 은행원입니다.', ['Minsu là nhân viên ngân hàng.', 'Minsu là nhân viên công ty.', 'Minsu là giáo viên.', 'Minsu là bác sĩ.'], '은행원 = nhân viên ngân hàng.'),
      ls('처음 뵙겠습니다.', ['Rất hân hạnh (lần đầu gặp).', 'Tạm biệt.', 'Cảm ơn.', 'Xin lỗi.'], '처음 뵙겠습니다 dùng khi gặp lần đầu.'),
      ls('학생입니까?', ['Bạn là học sinh phải không?', 'Tôi là học sinh.', 'Học sinh ở đâu?', 'Không phải học sinh.'], '입니까? = câu hỏi “phải không”.'),
      ls('안녕히 계세요.', ['Tạm biệt (nói với người ở lại).', 'Tạm biệt (nói với người ra về).', 'Xin chào.', 'Rất vui được gặp.'], '계세요 = ở lại; người nói đang ra về.', { d: 2 }),
    ],
    passages: [{
      title: 'Lần đầu gặp mặt', ko: '흐엉: 안녕하세요? 저는 흐엉입니다. 베트남 사람입니다.\n민준: 안녕하세요? 제 이름은 김민준입니다. 한국 사람입니다.\n흐엉: 민준 씨는 학생입니까?\n민준: 아니요, 저는 회사원입니다. 흐엉 씨는 학생입니까?\n흐엉: 네, 저는 대학생입니다. 반갑습니다.',
      vi: 'Hương: Xin chào, tôi là Hương, người Việt Nam. — Minjun: Xin chào, tên tôi là Kim Minjun, người Hàn Quốc. — Hương: Minjun là học sinh à? — Minjun: Không, tôi là nhân viên công ty. Hương là học sinh à? — Hương: Vâng, tôi là sinh viên. Rất vui được gặp.',
      q: [
        mc('민준 씨는 어느 나라 사람입니까?', ['Người Hàn Quốc', 'Người Việt Nam', 'Người Nhật', 'Người Mỹ'], '민준: 한국 사람입니다.'),
        mc('민준 씨의 직업은 무엇입니까?', ['Nhân viên công ty', 'Học sinh', 'Giáo viên', 'Sinh viên'], '민준: 저는 회사원입니다.'),
        mc('Câu nào đúng với đoạn hội thoại?', ['흐엉 씨는 대학생입니다.', '흐엉 씨는 회사원입니다.', '민준 씨는 베트남 사람입니다.', '두 사람은 선생님입니다.'], 'Hương nói: 저는 대학생입니다.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Thẻ sinh viên của Tuấn', ko: '안녕하십니까? 제 이름은 응우옌 반 뚜안입니다. 베트남 사람입니다. 저는 하노이 대학교 학생입니다. 한국어과 학생입니다. 제 친구는 다나카 씨입니다. 다나카 씨는 일본 사람입니다. 다나카 씨도 학생입니다.',
      vi: 'Xin chào. Tên tôi là Nguyễn Văn Tuấn. Tôi là người Việt Nam, sinh viên Đại học Hà Nội, khoa tiếng Hàn. Bạn tôi là Tanaka, người Nhật, cũng là sinh viên.',
      q: [
        mc('뚜안 씨는 무엇을 공부합니까? (Tuấn học gì?)', ['Tiếng Hàn', 'Tiếng Nhật', 'Tiếng Anh', 'Kinh tế'], '한국어과 학생 = sinh viên khoa tiếng Hàn.'),
        mc('다나카 씨의 국적은?', ['Nhật Bản', 'Việt Nam', 'Hàn Quốc', 'Trung Quốc'], '다나카 씨는 일본 사람입니다.'),
        mc('Câu nào SAI?', ['다나카 씨는 회사원입니다.', '뚜안 씨는 베트남 사람입니다.', '다나카 씨는 학생입니다.', '뚜안 씨는 대학생입니다.'], 'Đoạn văn nói 다나카 씨도 학생입니다.'),
      ],
    }, {
      title: 'Danh thiếp', ko: '이름: 박지원\n국적: 한국\n직업: 은행원\n회사: 한국은행\n전화: 010-2345-6789\n이메일: jiwon@bank.kr',
      vi: 'Tên: Park Jiwon · Quốc tịch: Hàn Quốc · Nghề nghiệp: nhân viên ngân hàng · Công ty: Ngân hàng Hàn Quốc · Điện thoại · Email.',
      q: [
        mc('박지원 씨의 직업은 무엇입니까?', ['은행원입니다.', '선생님입니다.', '의사입니다.', '학생입니다.'], '직업: 은행원.'),
        mc('Thông tin nào KHÔNG có trên danh thiếp?', ['주소 (địa chỉ)', '전화 (điện thoại)', '이메일', '국적 (quốc tịch)'], 'Danh thiếp không ghi 주소.'),
      ],
    }],
  },
  culture: {
    title: 'Cách chào hỏi của người Hàn Quốc',
    paras: [
      'Người Hàn chào nhau bằng cách cúi người. Với bạn bè cùng tuổi chỉ cần gật đầu nhẹ; với người lớn tuổi hoặc cấp trên thì cúi sâu hơn và giữ lâu hơn một chút.',
      'Khi bắt tay với người lớn, người nhỏ tuổi thường dùng hai tay hoặc đặt tay trái đỡ dưới cổ tay phải, đồng thời hơi cúi người.',
      '안녕하세요 dùng được trong hầu hết tình huống hằng ngày; 안녕하십니까 trang trọng hơn, hay nghe trong công sở, quân đội, phát thanh.',
    ],
    compare: 'Người Việt thường chào kèm đại từ xưng hô (“Cháu chào bác”), còn người Hàn dùng cùng một câu chào cho mọi người và thể hiện mức độ kính trọng qua động tác cúi người và đuôi câu.',
  },
  writing: [
    wr('Viết 3 câu tự giới thiệu bằng đuôi 입니다: tên, quốc tịch, nghề nghiệp.', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn hoặc bàn phím ảo.' },
      { label: 'Có nêu tên (저는 … / 제 이름은 …)', kind: 'anyOf', value: ['저는', '제 이름은'], tip: 'Mở đầu bằng 저는 + tên hoặc 제 이름은 + tên.' },
      { label: 'Có nêu quốc tịch (… 사람)', kind: 'includes', value: '사람', tip: 'Quốc tịch = tên nước + 사람.' },
      { label: 'Dùng đuôi 입니다', kind: 'includes', value: '입니다', tip: 'Bài này luyện đuôi trang trọng 입니다.' }] },
    '안녕하십니까? 제 이름은 응우옌 티 마이입니다. 베트남 사람입니다. 저는 대학생입니다.', 'Mỗi câu một ý; danh từ + 입니다.', { d: 1 }),
    wr('Giới thiệu một người bạn: tên, quốc tịch, nghề nghiệp (3 câu).', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng 씨 khi gọi tên bạn', kind: 'includes', value: '씨', tip: 'Gọi người khác: tên + 씨.' },
      { label: 'Dùng tiểu từ 은/는', kind: 'regex', value: '[가-힣](은|는) ', tip: 'Chủ đề + 은/는.' },
      { label: 'Kết thúc bằng 입니다', kind: 'includes', value: '입니다', tip: 'Dùng 입니다.' }] },
    '제 친구는 리사 씨입니다. 리사 씨는 미국 사람입니다. 리사 씨는 선생님입니다.', 'Nhớ: không tự gọi mình bằng 씨, nhưng gọi bạn thì dùng 씨.', { d: 2 }),
  ],
};
