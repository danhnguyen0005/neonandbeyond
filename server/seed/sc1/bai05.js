// Sơ cấp 1 · Bài 5 — 하루 일과 (Công việc trong ngày)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const NAT = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NAT_ADJ = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const native = (n) => TENS[Math.floor(n / 10)] + NAT[n % 10];
const nativeAdj = (n) => (n === 20 ? '스무' : TENS[Math.floor(n / 10)] + NAT_ADJ[n % 10]);
const SINO = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const sino = (n) => (n >= 10 ? (n >= 20 ? SINO[Math.floor(n / 10)] : '') + '십' : '') + SINO[n % 10];
const time = (h, m) => `${nativeAdj(h)} 시${m ? (m === 30 ? ' 반' : ` ${sino(m)} 분`) : ''}`;

const natQ = [1, 2, 3, 4, 7, 9, 11, 15, 20, 24, 33, 48, 56, 70, 99].map((n) => mc(`Số <b>${n}</b> đọc theo số thuần Hàn là:`,
  [native(n), ...[...new Set([native(n % 10 ? n + 1 : n + 2), native(n > 10 ? n - 10 : n + 10), native(n % 10 === 9 ? n - 2 : n + 2)])].filter((x) => x !== native(n)).slice(0, 3)], `${n} = ${native(n)}.`, { tag: 'number', d: n > 20 ? 2 : 1 }));
const timeQ = [[1, 0], [3, 10], [4, 30], [7, 15], [9, 45], [10, 20], [11, 5], [12, 0], [2, 50], [6, 30]].map(([h, m]) => {
  const right = time(h, m);
  const wrong = [`${sino(h)} 시${m ? (m === 30 ? ' 반' : ` ${sino(m)} 분`) : ''}`, `${nativeAdj(h)} 시${m ? ` ${native(m)} 분` : ' 반'}`, time(h === 12 ? 11 : h + 1, m)];
  return mc(`Đọc giờ <b>${h}:${String(m).padStart(2, '0')}</b>:`, [right, ...[...new Set(wrong)].filter((x) => x !== right)], `Giờ dùng số thuần Hàn (${nativeAdj(h)} 시), phút dùng số Hán Hàn${m === 30 ? '; 30 phút = 반' : ''}.`, { tag: 'number', d: 2 });
});
const POL = [['가다', 'đi'], ['오다', 'đến'], ['보다', 'xem'], ['자다', 'ngủ'], ['먹다', 'ăn'], ['읽다', 'đọc'], ['마시다', 'uống'], ['배우다', 'học'], ['만나다', 'gặp'], ['일어나다', 'thức dậy'],
  ['다니다', 'đi (thường xuyên)'], ['끝나다', 'kết thúc'], ['시작하다', 'bắt đầu'], ['공부하다', 'học'], ['청소하다', 'dọn dẹp'], ['좋다', 'tốt'], ['많다', 'nhiều'], ['쉬다', 'nghỉ'], ['주다', 'cho'], ['받다', 'nhận'], ['보내다', 'gửi'], ['세수하다', 'rửa mặt']];

module.exports = {
  unit: 5, ko: '하루 일과', vi: 'Công việc trong ngày', vocabName: 'thời gian, sinh hoạt hằng ngày',
  vocab: [
    ['Thời gian', [['오전', 'buổi sáng (AM)'], ['오후', 'buổi chiều (PM)'], ['낮', 'ban ngày'], ['밤', 'ban đêm'], ['아침', 'buổi sáng; bữa sáng'], ['점심', 'buổi trưa; bữa trưa'], ['저녁', 'buổi tối; bữa tối'], ['새벽', 'rạng sáng'],
      ['시', 'giờ'], ['분', 'phút'], ['초', 'giây'], ['반', 'rưỡi']]],
    ['Động từ chỉ sinh hoạt hằng ngày', [['일어나다', 'thức dậy'], ['이를 닦다', 'đánh răng'], ['세수하다', 'rửa mặt'], ['다니다', 'đi lại (thường xuyên)'], ['배우다', 'học'], ['숙제하다', 'làm bài tập'],
      ['청소하다', 'dọn vệ sinh'], ['목욕하다', 'tắm'], ['출근하다', 'đi làm'], ['퇴근하다', 'tan làm'], ['시작하다', 'bắt đầu'], ['끝나다', 'kết thúc']]],
    ['Số thuần Hàn', [['하나', 'một'], ['둘', 'hai'], ['셋', 'ba'], ['넷', 'bốn'], ['다섯', 'năm'], ['여섯', 'sáu'], ['일곱', 'bảy'], ['여덟', 'tám'], ['아홉', 'chín'], ['열', 'mười'], ['스물', 'hai mươi'], ['서른', 'ba mươi'],
      ['마흔', 'bốn mươi'], ['쉰', 'năm mươi']]],
    ['Từ mới trong bài', [['수업', 'giờ học'], ['시험을 보다', 'thi'], ['고향', 'quê hương'], ['부모님', 'bố mẹ'], ['겨울', 'mùa đông'], ['공항', 'sân bay'], ['노래방', 'karaoke'], ['밥', 'cơm'], ['받다', 'nhận'],
      ['수영', 'bơi lội'], ['남자', 'nam'], ['여자', 'nữ'], ['영어', 'tiếng Anh'], ['운전하다', 'lái xe'], ['일기', 'nhật ký'], ['PC방', 'quán internet'], ['열심히', 'chăm chỉ'], ['명', 'người (đơn vị)']]],
  ],
  vocabNote: '아침, 점심, 저녁 vừa là buổi vừa là bữa ăn: 아침을 먹어요 (ăn sáng). 30 phút có thể nói 반: 한 시 반.',
  grammar: [
    {
      name: 'Số thuần Hàn & định từ số (1)', desc: 'Số 하나, 둘, 셋…; đọc giờ: giờ thuần Hàn, phút Hán Hàn.',
      lesson: {
        goal: 'Đếm bằng số thuần Hàn và nói giờ.',
        formula: '하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열 · 스물 서른 마흔 쉰 예순 일흔 여든 아흔 (≥100 dùng Hán Hàn)',
        explain: 'Trước danh từ đơn vị, 하나/둘/셋/넷/스물 đổi thành 한/두/세/네/스무: 한 명, 두 시, 스무 살. Nói giờ: giờ (시) dùng số thuần Hàn, phút (분) dùng số Hán Hàn: 세 시 사십 분. 몇 = mấy: 몇 시예요?',
        examples: [['지금 몇 시예요? — 열두 시예요.', 'Bây giờ mấy giờ? — 12 giờ.'], ['오후 세 시 사십 분이에요.', '3 giờ 40 chiều.'], ['한 시 반에 수업이 끝나요.', 'Giờ học kết thúc lúc 1 rưỡi.'], ['교실에 학생이 다섯 명 있어요.', 'Trong lớp có 5 học sinh.']],
        mistakes: ['하나 시 ✗ → 한 시.', 'Đọc phút bằng số thuần Hàn (열 분 ✗ → 십 분).', '스물 명 ✗ → 스무 명.'],
      },
      q: [
        ...natQ, ...timeQ,
        mc('“2 người” nói là:', ['두 명', '둘 명', '이 명', '두 사람이'], '둘 → 두 trước đơn vị.', { tag: 'number' }),
        fill('Viết bằng chữ Hàn: 4 giờ (dùng 시)', ['네 시', '네시'], '넷 → 네 trước 시.', { tag: 'number' }),
        fill('Viết bằng chữ Hàn: 20 người (dùng 명)', ['스무 명', '스무명'], '스물 → 스무 trước đơn vị.', { tag: 'number', d: 3 }),
        ls('여덟 시 반', ['8:30', '8:00', '9:30', '18:30'], '여덟 = 8, 반 = 30 phút.', { prompt: 'Nghe và chọn giờ đúng.', tag: 'number' }),
        ls('열한 시 오 분', ['11:05', '10:05', '11:50', '1:05'], '열한 시 = 11 giờ, 오 분 = 5 phút.', { prompt: 'Nghe và chọn giờ đúng.', tag: 'number' }),
      ],
    },
    {
      name: '-아/어요', desc: 'Đuôi câu thân mật lịch sự — dùng nhiều nhất trong giao tiếp.',
      lesson: {
        goal: 'Chia động từ/tính từ ở đuôi -아/어요.',
        formula: 'Nguyên âm cuối gốc ㅏ/ㅗ → 아요 · nguyên âm khác → 어요 · 하다 → 해요',
        explain: '-아/어요 lịch sự nhưng gần gũi, dùng cho câu trần thuật, câu hỏi (lên giọng), cả lời đề nghị. Gốc không patchim rút gọn: 가 + 아요 → 가요, 보 + 아요 → 봐요, 마시 + 어요 → 마셔요, 배우 + 어요 → 배워요, 보내 + 어요 → 보내요. Với danh từ: có patchim + 이에요, không patchim + 예요.',
        examples: [['지금 무엇을 해요? — 학교에서 공부해요.', 'Bây giờ làm gì? — Học ở trường.'], ['다음 주말에 여행을 가요.', 'Cuối tuần sau đi du lịch.'], ['카페에서 커피를 마셔요.', 'Uống cà phê ở quán.'], ['의사예요. / 선생님이에요.', 'Là bác sĩ. / Là giáo viên.']],
        mistakes: ['마시어요 → nên rút gọn 마셔요.', '먹아요 ✗ → 먹어요 (ㅓ không phải ㅏ/ㅗ).', '공부하어요 ✗ → 공부해요.'],
        compare: '-ㅂ/습니다 trang trọng (họp, phát biểu); -아/어요 dùng hằng ngày với người lạ, đồng nghiệp, người lớn tuổi.',
      },
      gen: [{ kind: 'verb', form: 'polite', verbs: POL, typed: 0.5 }],
      q: [
        mc('A: 몇 시에 일어나요?  B: 여섯 시에 ___', ['일어나요.', '일어나어요.', '일어너요.', '일어납니까?'], '일어나 + 아요 → 일어나요.'),
        fill('Chia: 저는 매일 한국어를 (배우다) ___.', ['배워요', '배워요.'], '배우 + 어요 → 배워요.'),
        fill('Điền 이에요/예요: 제 친구는 회사원___.', ['이에요', '이에요.'], '회사원 có patchim → 이에요.'),
        fill('Điền 이에요/예요: 저는 가수___.', ['예요', '예요.'], '가수 không patchim → 예요.'),
        tr('Dịch (đuôi -아/어요): “Tôi ăn cơm ở nhà ăn.”', ['식당에서 밥을 먹어요', '저는 식당에서 밥을 먹어요'], '식당에서 (nơi hành động) + 밥을 먹어요.', { common_wrong: [{ text: '식당에 밥을 먹어요', why: 'Hành động ăn diễn ra ở nhà ăn nên phải dùng 에서.' }, { text: '식당에서 밥을 먹아요', why: '먹 có nguyên âm ㅓ → 먹어요.' }] }),
        err(['저는', '아침에', '빵을', '먹아요.'], 3, '먹 có nguyên âm ㅓ → 먹어요.'),
        tr('Dịch (đuôi -아/어요): “Tôi xem phim ở rạp.”', ['극장에서 영화를 봐요.', '저는 극장에서 영화를 봐요.', '극장에서 영화를 봐요', '저는 극장에서 영화를 봐요'], '보 + 아요 → 봐요.'),
      ],
    },
    {
      name: 'N에 가다/오다/다니다', desc: 'Đi/đến/đi lại thường xuyên tới một nơi.',
      lesson: {
        goal: 'Nói nơi đến của sự di chuyển.',
        formula: 'Nơi chốn + 에 + 가다 / 오다 / 다니다',
        explain: '에 chỉ đích đến của động từ di chuyển. 다니다 = đi lại đều đặn (đi học, đi làm): 회사에 다녀요 = tôi đi làm ở công ty.',
        examples: [['지금 학교에 가요.', 'Bây giờ tôi đi đến trường.'], ['친구가 우리 집에 와요.', 'Bạn đến nhà tôi.'], ['저는 한국대학교에 다녀요.', 'Tôi đang học ở ĐH Hàn Quốc.']],
        mistakes: ['학교에서 가요 → nghĩa “đi từ trường”; đi ĐẾN trường là 학교에 가요.', 'Bỏ 에: 학교 가요 (văn nói có thể lược, nhưng khi học nên giữ).'],
      },
      q: [
        mc('저는 은행___ 가요.', ['에', '에서', '을', '이'], 'Nơi đến + 에 가다.', { fixed: true, tag: 'particle', fb: { '에서': '에서 + 가다 = đi TỪ đâu. Đi ĐẾN thì dùng 에.' } }),
        mc('“Tôi đi làm ở ngân hàng (thường xuyên).”', ['은행에 다녀요.', '은행에서 다녀요.', '은행을 다녀요.', '은행에 다니어요.'], '다니 + 어요 → 다녀요.'),
        fill('Điền tiểu từ: 내일 공항___ 가요.', ['에'], 'Nơi đến → 에.'),
        tr('Dịch: “Mấy giờ bạn đến trường?” (đuôi -아/어요)', ['몇 시에 학교에 가요?', '몇 시에 학교에 와요?', '몇 시에 학교에 가요'], '몇 시에 + 학교에 + 가요?'),
      ],
    },
    {
      name: '안 + V/A (phủ định)', desc: 'Phủ định ngắn: “không …”.',
      lesson: {
        goal: 'Phủ định động từ/tính từ bằng 안.',
        formula: '안 + động từ/tính từ  ·  N + 안 하다 (với động từ “danh từ + 하다”)',
        explain: '안 đặt ngay trước động từ: 안 가요, 안 먹어요. Với động từ dạng “danh từ + 하다” (공부하다, 운동하다), 안 chen giữa: 공부 안 해요. Tính từ có 하다 (따뜻하다) và 좋아하다 thì để nguyên: 안 좋아해요.',
        examples: [['지금 학교에 안 가요.', 'Bây giờ tôi không đến trường.'], ['동생이 사과를 안 먹어요.', 'Em tôi không ăn táo.'], ['주말에 공부 안 해요.', 'Cuối tuần tôi không học.']],
        mistakes: ['안 공부해요 ✗ → 공부 안 해요.', 'Đặt 안 cuối câu như tiếng Việt “không” ✗.'],
        compare: 'Tiếng Việt: “không + động từ” giống 안 + V; khác ở chỗ động từ N+하다 phải tách.',
      },
      gen: [{ kind: 'verb', form: 'an', verbs: [['가다', 'đi'], ['먹다', 'ăn'], ['마시다', 'uống'], ['자다', 'ngủ'], ['보다', 'xem'], ['공부하다', 'học'], ['운동하다', 'tập thể dục'], ['청소하다', 'dọn dẹp'], ['일하다', 'làm việc'], ['좋아하다', 'thích'], ['배우다', 'học'], ['읽다', 'đọc']], typed: 0.4 }],
      q: [
        mc('A: 아침을 먹어요?  B: 아니요, ___', ['안 먹어요.', '먹어요 안.', '안 먹아요.', '먹지 안 해요.'], '안 + 먹어요.'),
        err(['저는', '주말에', '안', '숙제해요.'], 2, '숙제하다 → 숙제 안 해요.', { d: 3 }),
        ord('Sắp xếp: “Hôm nay tôi không đi học.”', ['오늘', '학교에', '안', '가요.'], '안 đứng ngay trước động từ.'),
      ],
    },
  ],
  pron: {
    name: 'ㅎ yếu', desc: 'ㅎ giữa các âm hữu thanh thường đọc rất nhẹ hoặc mất.',
    lesson: { goal: 'Nhận ra ㅎ bị nhược hoá.', explain: 'ㅎ đứng sau nguyên âm hoặc ㄴ, ㄹ, ㅁ, ㅇ thường được đọc rất nhẹ, nhiều khi gần như không phát âm và phụ âm trước nối sang.',
      examples: [['시험 → [시험/시엄]', 'kỳ thi'], ['일하다 → [일하다/이라다]', 'làm việc'], ['열심히 → [열씸히/열씨미]', 'chăm chỉ'], ['전화 → [전화/저놔]', 'điện thoại']] },
    q: [
      mc('Khi nói nhanh, 일하다 thường nghe như:', ['[이라다]', '[일다]', '[일카다]', '[이하다]'], 'ㅎ yếu đi, ㄹ nối sang.', { fixed: true }),
      mc('Từ nào có ㅎ thường được đọc nhẹ?', ['은행', '하나', '한국', '학교'], 'ㅎ sau ㄴ (은행 → [으냉]) bị nhược hoá; ㅎ đầu từ vẫn đọc rõ.', { d: 2 }),
      ls('공부해요', ['[공부해요]', '[공부애요]', '[곰부해요]', '[공뿌해요]'], 'Đọc rõ ràng là [공부해요]; khi nói nhanh ㅎ có thể yếu.', { prompt: 'Nghe và chọn cách đọc chuẩn.', fixed: true }),
    ],
  },
  listening: {
    desc: 'Nghe giờ giấc và sinh hoạt trong ngày.',
    q: [
      ls('저는 아침 일곱 시에 일어나요.', ['Tôi dậy lúc 7 giờ sáng.', 'Tôi dậy lúc 8 giờ sáng.', 'Tôi ngủ lúc 7 giờ.', 'Tôi ăn sáng lúc 7 giờ.'], '일곱 시 = 7 giờ; 일어나요 = thức dậy.'),
      ls('수업이 몇 시에 끝나요?', ['Mấy giờ giờ học kết thúc?', 'Mấy giờ giờ học bắt đầu?', 'Giờ học ở đâu?', 'Hôm nay có giờ học không?'], '끝나다 = kết thúc.'),
      ls('저녁에 숙제를 해요.', ['Buổi tối tôi làm bài tập.', 'Buổi sáng tôi làm bài tập.', 'Buổi tối tôi không làm bài.', 'Buổi tối tôi dọn dẹp.'], '저녁 = buổi tối.'),
      ls('오늘은 회사에 안 가요.', ['Hôm nay tôi không đi làm.', 'Hôm nay tôi đi làm.', 'Ngày mai tôi không đi làm.', 'Hôm nay tôi đi học.'], '안 가요 = không đi.'),
      ls('아버지는 여섯 시에 퇴근해요.', ['Bố tan làm lúc 6 giờ.', 'Bố đi làm lúc 6 giờ.', 'Bố tan làm lúc 5 giờ.', 'Bố dậy lúc 6 giờ.'], '퇴근하다 = tan làm.', { d: 2 }),
    ],
    passages: [{
      title: 'Lịch học của Minjun', ko: '흐엉: 민준 씨, 내일 수업이 몇 시에 시작해요?\n민준: 아홉 시에 시작해요.\n흐엉: 몇 시에 끝나요?\n민준: 열두 시 반에 끝나요. 그리고 오후에 도서관에서 공부해요.\n흐엉: 저녁에는 뭐 해요?\n민준: 저녁에는 아르바이트를 해요.',
      q: [
        mc('수업은 몇 시에 시작해요?', ['9:00', '8:00', '12:30', '10:00'], '아홉 시에 시작해요.'),
        mc('수업은 몇 시에 끝나요?', ['12:30', '12:00', '2:30', '11:30'], '열두 시 반.'),
        mc('민준 씨는 저녁에 무엇을 해요?', ['아르바이트를 해요.', '도서관에서 공부해요.', '수업을 들어요.', '집에서 쉬어요.'], '저녁에는 아르바이트를 해요.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Một ngày của tôi', ko: '저는 매일 아침 여섯 시 반에 일어나요. 세수를 해요. 그리고 이를 닦아요. 일곱 시에 아침을 먹어요. 여덟 시에 학교에 가요. 수업은 아홉 시에 시작해요. 열두 시에 끝나요. 오후에는 도서관에서 숙제를 해요. 밤 열한 시에 자요. 주말에는 학교에 안 가요.',
      vi: 'Tôi dậy lúc 6:30, rửa mặt, đánh răng, ăn sáng lúc 7 giờ, 8 giờ đến trường. Học từ 9 đến 12 giờ. Chiều làm bài tập ở thư viện, 11 giờ đêm đi ngủ. Cuối tuần không đến trường.',
      q: [
        mc('Người viết dậy lúc mấy giờ?', ['6:30', '7:00', '8:00', '6:00'], '여섯 시 반에 일어나요.'),
        mc('오후에 어디에서 숙제를 해요?', ['도서관', '집', '교실', '카페'], '도서관에서 숙제를 해요.'),
        mc('Câu nào đúng?', ['주말에는 학교에 안 가요.', '수업은 오후에 있어요.', '밤 열 시에 자요.', '여덟 시에 아침을 먹어요.'], '주말에는 학교에 안 가요.'),
      ],
    }],
  },
  culture: {
    title: 'Đời sống sinh viên Hàn Quốc và Việt Nam',
    paras: [
      'Sinh viên đại học Hàn Quốc tự đăng ký môn học (수강 신청) mỗi học kỳ, nên lịch học mỗi người khác nhau. Nhiều bạn tham gia câu lạc bộ (동아리) và làm thêm (아르바이트) ở quán cà phê, cửa hàng tiện lợi.',
      'Nam sinh viên Hàn thường tạm nghỉ học để thực hiện nghĩa vụ quân sự khoảng 18–21 tháng rồi quay lại trường.',
      'Thư viện đại học ở Hàn mở cửa rất muộn, mùa thi nhiều sinh viên học tới khuya.',
    ],
    compare: 'Ở Việt Nam, nhiều trường vẫn xếp lớp theo niên chế, sinh viên học cùng lớp suốt các năm; ở Hàn mỗi môn có lớp riêng.',
  },
  writing: [
    wr('Viết 4 câu về một ngày của bạn có giờ cụ thể (đuôi -아/어요).', { min_len: 30, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Có giờ (… 시)', kind: 'regex', value: '시', tip: 'Ví dụ: 일곱 시에 일어나요.' },
      { label: 'Dùng đuôi -아/어요', kind: 'regex', value: '(아요|어요|해요|와요|워요|봐요|가요|자요|셔요|녀요)', tip: 'Ví dụ: 가요, 먹어요, 공부해요.' },
      { label: 'Dùng 에 sau giờ', kind: 'regex', value: '시에|반에|분에', tip: 'Giờ + 에.' }] },
    '저는 여섯 시에 일어나요. 일곱 시에 아침을 먹어요. 여덟 시에 회사에 가요. 저녁 여섯 시에 퇴근해요.', 'Giờ đọc bằng số thuần Hàn, phút bằng số Hán Hàn.'),
    wr('Cuối tuần bạn KHÔNG làm gì? Viết 2–3 câu dùng 안.', { min_len: 15, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng 안', kind: 'regex', value: '안 [가-힣]', tip: '안 + động từ.' }] },
    '주말에는 학교에 안 가요. 일찍 안 일어나요. 공부 안 해요.', ''),
  ],
};
