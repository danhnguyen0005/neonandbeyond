// Sơ cấp 1 · Bài 9 — 집 (Nhà cửa, chỉ đường)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const LLAE = [['가다', 'đi'], ['먹다', 'ăn'], ['마시다', 'uống'], ['보다', 'xem'], ['읽다', 'đọc'], ['만나다', 'gặp'], ['앉다', 'ngồi'], ['놀다', 'chơi'], ['만들다', 'làm'], ['쉬다', 'nghỉ'], ['산책하다', 'đi dạo'], ['찾다', 'tìm'], ['살다', 'sống'], ['타다', 'đi (xe)']];

module.exports = {
  unit: 9, ko: '집', vi: 'Nhà cửa', vocabName: 'vị trí, phương hướng, nhà cửa, nơi chốn',
  vocab: [
    ['Vị trí & phương hướng', [['위', 'trên'], ['아래', 'dưới'], ['밑', 'dưới (sát dưới)'], ['안', 'trong'], ['밖', 'ngoài'], ['옆', 'bên cạnh'], ['사이', 'giữa'], ['앞', 'trước'], ['뒤', 'sau'],
      ['왼쪽', 'bên trái'], ['오른쪽', 'bên phải'], ['양쪽', 'hai bên'], ['건너편', 'phía đối diện'], ['맞은편', 'đối diện'], ['똑바로', 'thẳng'], ['쭉', 'thẳng (một mạch)'], ['동', 'đông'], ['서', 'tây'], ['남', 'nam'], ['북', 'bắc']]],
    ['Nhà cửa', [['주택', 'nhà riêng'], ['아파트', 'chung cư'], ['안방', 'phòng ngủ chính'], ['공부방', 'phòng học'], ['거실', 'phòng khách'], ['부엌', 'bếp'], ['화장실', 'nhà vệ sinh'], ['현관', 'lối vào'],
      ['베란다', 'ban công'], ['오피스텔', 'căn hộ văn phòng'], ['세탁실', 'phòng giặt'], ['침실', 'phòng ngủ']]],
    ['Đồ gia dụng', [['침대', 'giường'], ['책장', 'tủ sách'], ['옷장', 'tủ quần áo'], ['소파', 'ghế sofa'], ['탁자', 'bàn (thấp)'], ['식탁', 'bàn ăn'], ['화장대', 'bàn trang điểm'], ['신발장', 'tủ giày']]],
    ['Nơi chốn (2)', [['경찰서', 'đồn cảnh sát'], ['세탁소', 'tiệm giặt ủi'], ['박물관', 'viện bảo tàng'], ['슈퍼마켓', 'siêu thị'], ['지하철역', 'ga tàu điện ngầm'], ['버스 정류장', 'trạm xe buýt'], ['빵집', 'tiệm bánh'], ['꽃집', 'tiệm hoa'], ['미용실', 'tiệm làm tóc']]],
    ['Từ mới trong bài', [['기숙사', 'ký túc xá'], ['하숙집', 'nhà trọ (có nấu ăn)'], ['자취', 'ở riêng tự nấu'], ['정원', 'vườn'], ['지하', 'tầng hầm'], ['편리하다', 'tiện lợi'], ['불편하다', 'bất tiện'], ['편하다', 'thoải mái'],
      ['복잡하다', 'phức tạp, đông đúc'], ['친절하다', 'tử tế'], ['사용하다', 'sử dụng'], ['지내다', 'sống, trải qua'], ['혼자', 'một mình'], ['올라가다', 'đi lên'], ['내려가다', 'đi xuống'], ['들어가다', 'đi vào'], ['건너다', 'băng qua'], ['돌다', 'rẽ, quay']]],
  ],
  vocabNote: 'Vị trí: N + 위/아래/앞/뒤/옆/안/밖 + 에: 책상 위에 (trên bàn), 학교 앞에 (trước trường). Tủ: 책 + 장 = 책장 (tủ sách), 옷 + 장 = 옷장 (tủ quần áo).',
  grammar: [
    {
      name: 'N 위/아래/앞/뒤/옆…에 (vị trí)', desc: 'Nói vị trí: trên, dưới, trước, sau, cạnh, giữa…',
      lesson: {
        goal: 'Miêu tả vị trí đồ vật, toà nhà.',
        formula: 'N + vị trí + 에 있어요  ·  A와/과 B 사이에',
        explain: 'Từ chỉ vị trí đứng SAU danh từ (ngược tiếng Việt): 책상 위에 = trên bàn. “Giữa A và B”: A와/과 B 사이에.',
        examples: [['고양이가 의자 밑에 있어요.', 'Con mèo ở dưới ghế.'], ['은행은 우체국 옆에 있어요.', 'Ngân hàng ở cạnh bưu điện.'], ['약국은 병원과 꽃집 사이에 있어요.', 'Hiệu thuốc ở giữa bệnh viện và tiệm hoa.']],
        mistakes: ['위 책상에 ✗ → 책상 위에.', 'Quên 에 sau từ chỉ vị trí.'],
        compare: 'Tiếng Việt “trên bàn” (vị trí trước danh từ) ↔ tiếng Hàn 책상 위 (vị trí sau danh từ).',
      },
      q: [
        mc('“Quyển sách ở trên bàn.”', ['책이 책상 위에 있어요.', '책이 위 책상에 있어요.', '책상이 책 위에 있어요.', '책이 책상 위에서 있어요.'], 'N + 위 + 에 있어요.'),
        mc('“Ngân hàng ở đối diện trường.”', ['은행은 학교 건너편에 있어요.', '은행은 건너편 학교에 있어요.', '학교는 은행 건너편이에요 있어요.', '은행은 학교 건너편을 있어요.'], 'N + 건너편 + 에.'),
        mc('“Giữa thư viện và nhà ăn”', ['도서관과 식당 사이에', '도서관 사이 식당에', '사이에 도서관과 식당', '도서관 사이와 식당에'], 'A와/과 B 사이에.', { d: 2 }),
        fill('Điền từ vị trí: 가방이 의자 ___에 있어요. (dưới)', ['아래', '밑'], 'dưới = 아래/밑.'),
        fill('Điền từ vị trí: 화장실은 거실 ___에 있어요. (bên cạnh)', ['옆'], 'bên cạnh = 옆.'),
        tr('Dịch: “Con mèo ở trong phòng.”', ['고양이가 방 안에 있어요.', '고양이는 방 안에 있어요.', '고양이가 방에 있어요.', '고양이가 방 안에 있습니다.'], '방 + 안 + 에 있어요.'),
        ls('편의점은 은행 뒤에 있어요.', ['Cửa hàng tiện lợi ở sau ngân hàng.', 'Cửa hàng tiện lợi ở trước ngân hàng.', 'Ngân hàng ở sau cửa hàng tiện lợi.', 'Cửa hàng tiện lợi ở cạnh ngân hàng.'], '뒤 = sau.'),
        ls('왼쪽에 지하철역이 있어요.', ['Bên trái có ga tàu điện ngầm.', 'Bên phải có ga tàu điện ngầm.', 'Ga tàu ở phía trước.', 'Không có ga tàu.'], '왼쪽 = bên trái.'),
      ],
    },
    {
      name: 'N(으)로 (hướng)', desc: 'Chỉ hướng di chuyển: “về phía …”.',
      lesson: {
        goal: 'Chỉ đường, nói hướng đi.',
        formula: 'Có patchim (trừ ㄹ) + 으로 · không patchim hoặc patchim ㄹ + 로',
        explain: '(으)로 chỉ phương hướng của hành động di chuyển: 왼쪽으로 가세요 (đi về bên trái), 위로 올라가세요 (đi lên trên). Danh từ tận cùng ㄹ chỉ thêm 로 giống danh từ không patchim: 교실로, 서울로; còn 이 층 → 이 층으로.',
        examples: [['위로 올라가세요.', 'Hãy đi lên trên.'], ['왼쪽으로 오세요.', 'Đi về phía bên trái.'], ['교실로 들어가세요.', 'Hãy vào lớp.'], ['1층으로 오세요.', 'Hãy xuống tầng 1.']],
        mistakes: ['교실으로 ✗ → 교실로 (patchim ㄹ chỉ thêm 로).', 'Nhầm 에 và (으)로: 에 = đích đến; (으)로 = hướng đi.'],
      },
      gen: [{ kind: 'particle', pair: ['으로', '로'], note: '(Có patchim → 으로; không patchim hoặc patchim ㄹ → 로.)', items: [
        ['왼쪽', '왼쪽___ 가세요.'], ['오른쪽', '오른쪽___ 도세요.'], ['위', '위___ 올라가세요.'], ['앞', '앞___ 쭉 가세요.'], ['뒤', '뒤___ 가세요.'], ['아래', '아래___ 내려가세요.'],
        ['집', '집___ 가요.'], ['밖', '밖___ 나가요.'], ['부엌', '부엌___ 오세요.'], ['현관', '현관___ 들어오세요.']] }],
      q: [
        mc('교실___ 들어가세요.', ['로', '으로', '에서', '을'], '교실 có patchim ㄹ → 로.', { fixed: true, tag: 'particle', fb: { '으로': 'Patchim ㄹ là ngoại lệ: chỉ thêm 로.' }, d: 2 }),
        mc('Chỉ đường: “Đi thẳng rồi rẽ phải.”', ['쭉 가세요. 그리고 오른쪽으로 도세요.', '쭉 가세요. 그리고 오른쪽에 도세요.', '오른쪽으로 쭉 가세요.', '똑바로 왼쪽으로 가세요.'], 'Hướng → (으)로.'),
        fill('Điền 으로/로: 이 층___ 올라오세요.', ['으로'], '층 có patchim ㅇ → 으로.'),
        tr('Dịch: “Hãy đi về phía bên trái.”', ['왼쪽으로 가세요.', '왼쪽으로 가세요'], '왼쪽 + 으로 + 가세요.'),
      ],
    },
    {
      name: '-(으)ㄹ래요 (rủ, hỏi ý muốn)', desc: 'Hỏi ý người nghe / nói ý muốn của mình (thân mật).',
      lesson: {
        goal: 'Rủ rê, hỏi ý thân mật.',
        formula: 'Gốc không patchim / gốc ㄹ + ㄹ래요 · có patchim + 을래요',
        explain: 'Câu hỏi -(으)ㄹ래요? hỏi ý muốn của người nghe hoặc rủ rê nhẹ nhàng: 같이 갈래요? Câu trả lời -(으)ㄹ래요 nói ý muốn của mình: 저는 커피 마실래요. Dùng với người thân quen; không dùng với người bề trên.',
        examples: [['남 씨, 비빔밥 먹을래요?', 'Nam ơi, ăn cơm trộn không?'], ['우리 오늘 영화 볼래요?', 'Hôm nay mình xem phim nhé?'], ['저는 집에서 쉴래요.', 'Tôi muốn nghỉ ở nhà.']],
        mistakes: ['먹ㄹ래요 ✗ → 먹을래요.', '놀을래요 ✗ → 놀래요 (gốc ㄹ).'],
        compare: '-(으)ㅂ시다 (đề nghị dứt khoát) ↔ -(으)ㄹ래요? (hỏi ý, mềm mỏng hơn).',
      },
      gen: [{ kind: 'verb', form: 'llaeyo', verbs: LLAE, typed: 0.5 }],
      q: [
        mc('A: 우리 집에 ___?  B: 네, 좋아요.', ['올래요', '왔어요', '와요 싶어요', '오을래요'], '오 + ㄹ래요 → 올래요.'),
        mc('A: 뭐 마실래요?  B: 저는 녹차 ___', ['마실래요.', '마실래요?', '마셨어요.', '마시겠어요?'], 'Nói ý muốn của mình → 마실래요.'),
        err(['주말에', '같이', '공원에서', '놀을래요?'], 3, 'Gốc ㄹ: 놀 + 래요 → 놀래요.', { d: 3 }),
      ],
    },
    {
      name: 'N도 (cũng)', desc: '“… cũng …”: thay cho 은/는, 이/가, 을/를.',
      lesson: {
        goal: 'Nói “cũng”.',
        formula: 'N + 도 (thay 은/는, 이/가, 을/를; đi sau 에, 에서: 에도, 에서도)',
        explain: '도 gắn sau danh từ nghĩa là “cũng”. Nó THAY THẾ 은/는, 이/가, 을/를 (không viết 책을도), nhưng đứng SAU các tiểu từ khác: 학교에도, 집에서도.',
        examples: [['교실에 책상이 있어요. 의자도 있어요.', 'Trong lớp có bàn. Cũng có ghế.'], ['저는 한국어를 공부해요. 제 친구도 한국어를 공부해요.', 'Tôi học tiếng Hàn. Bạn tôi cũng học.'], ['김밥을 좋아해요. 불고기도 좋아해요.', 'Tôi thích kimbap. Cũng thích bulgogi.']],
        mistakes: ['커피를도 ✗ → 커피도.', '도 đặt trước động từ như tiếng Việt “cũng thích” ✗.'],
      },
      q: [
        mc('A: 저는 커피를 좋아해요.  B: 저___ 커피를 좋아해요.', ['도', '는도', '를', '가도'], 'Tôi cũng → 저도.', { fixed: true, tag: 'particle' }),
        mc('“Tôi thích kim chi. Cũng thích cơm trộn.”', ['김치를 좋아해요. 비빔밥도 좋아해요.', '김치를 좋아해요. 비빔밥을도 좋아해요.', '김치를 좋아해요. 도 비빔밥을 좋아해요.', '김치를 좋아해요. 비빔밥 좋아해요도.'], '도 thay 을/를.'),
        mc('“Ở nhà cũng học.”', ['집에서도 공부해요.', '집도에서 공부해요.', '집에서 공부도해요.', '집을도 공부해요.'], '도 đứng sau 에서.', { d: 3 }),
        err(['거실에', '소파가 있어요.', '탁자가도', '있어요.'], 2, '도 thay 이/가: 탁자도.'),
        tr('Dịch: “Bạn tôi cũng là sinh viên.”', ['제 친구도 대학생이에요.', '친구도 대학생이에요.', '제 친구도 대학생입니다.', '친구도 대학생입니다.'], 'N도 + N이에요.'),
      ],
    },
  ],
  pron: {
    name: 'Ba cách đọc ㄹ', desc: 'ㄹ giữa nguyên âm [r], ㄹ cuối [l], ㄹㄹ [ll].',
    lesson: { goal: 'Phát âm ㄹ đúng theo vị trí.', explain: 'ㄹ giữa hai nguyên âm: lưỡi chạm nhẹ, gần “r” (노래, 사람). ㄹ ở patchim: lưỡi cong chạm hàm trên, gần “l” (건물, 한글). Hai ㄹ liền nhau: đọc thành “l” rõ (별로, 몰라요).',
      examples: [['노래 → [no-re]', 'bài hát'], ['한글 → [han-geul]', 'chữ Hàn'], ['몰라요 → [mol-la-yo]', 'không biết'], ['생일이에요 → [생이리에요]', 'là sinh nhật']] },
    q: [
      mc('Trong từ nào ㄹ đọc gần “r” (giữa hai nguyên âm)?', ['우리', '한글', '별로', '건물'], '우리: ㄹ đứng giữa ㅜ và ㅣ.'),
      mc('Trong từ nào có “ll” (hai ㄹ liền nhau)?', ['갈래요', '사람', '얼굴', '노래'], '갈래요: patchim ㄹ + ㄹ.'),
      mc('여기 앉을래요? — 앉을래요 được đọc là:', ['[안즐래요]', '[앉을래요]', '[안을래요]', '[안글래요]'], 'Patchim ㄵ: ㅈ nối sang 을 → [안즐래요].', { fixed: true, d: 3 }),
    ],
  },
  listening: {
    desc: 'Nghe chỉ đường và miêu tả nhà.',
    q: [
      ls('똑바로 가세요. 그리고 왼쪽으로 가세요.', ['Đi thẳng rồi rẽ trái.', 'Đi thẳng rồi rẽ phải.', 'Rẽ trái rồi đi thẳng.', 'Quay lại phía sau.'], '왼쪽으로 = về bên trái.'),
      ls('은행은 우체국 옆에 있어요.', ['Ngân hàng ở cạnh bưu điện.', 'Ngân hàng ở trước bưu điện.', 'Ngân hàng ở sau bưu điện.', 'Ngân hàng ở đối diện bưu điện.'], '옆 = bên cạnh.'),
      ls('우리 집은 아파트예요.', ['Nhà tôi là chung cư.', 'Nhà tôi là nhà riêng.', 'Tôi sống ở ký túc xá.', 'Nhà tôi có vườn.'], '아파트 = chung cư.'),
      ls('같이 박물관에 갈래요?', ['Cùng đi bảo tàng không?', 'Bạn đã đi bảo tàng chưa?', 'Bảo tàng ở đâu?', 'Tôi muốn đi bảo tàng một mình.'], '-ㄹ래요? = rủ rê.'),
      ls('침대 위에 고양이가 있어요.', ['Trên giường có con mèo.', 'Dưới giường có con mèo.', 'Con mèo ở trên ghế sofa.', 'Con mèo ở ngoài.'], '침대 위 = trên giường.'),
    ],
    passages: [{
      title: 'Hỏi đường', ko: '마이: 실례지만, 국립박물관이 어디에 있어요?\n아저씨: 이 길로 쭉 가세요. 그리고 지하철역 앞에서 오른쪽으로 가세요.\n마이: 지하철역 앞에서 오른쪽이요?\n아저씨: 네. 박물관은 꽃집과 빵집 사이에 있어요.\n마이: 감사합니다.',
      q: [
        mc('마이 씨는 어디에 가요?', ['박물관', '지하철역', '꽃집', '빵집'], '국립박물관이 어디에 있어요?'),
        mc('지하철역 앞에서 어느 쪽으로 가요?', ['오른쪽', '왼쪽', '뒤쪽', '똑바로'], '오른쪽으로 가세요.'),
        mc('박물관은 어디에 있어요?', ['꽃집과 빵집 사이', '지하철역 안', '꽃집 앞', '빵집 뒤'], '꽃집과 빵집 사이에.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Nhà của tôi', ko: '저는 하숙집에서 살아요. 하숙집은 학교 뒤에 있어요. 제 방은 이 층에 있어요. 방에 침대와 책상이 있어요. 옷장도 있어요. 부엌은 일 층에 있어요. 하숙집 아주머니가 아주 친절해요. 그래서 하숙집 생활이 편해요. 그런데 화장실이 하나만 있어요. 그래서 아침에는 조금 불편해요.',
      vi: 'Tôi sống ở nhà trọ phía sau trường. Phòng tôi ở tầng 2, có giường, bàn học, cũng có tủ quần áo. Bếp ở tầng 1. Bà chủ rất tốt nên sống ở đây thoải mái. Nhưng chỉ có một nhà vệ sinh nên buổi sáng hơi bất tiện.',
      q: [
        mc('하숙집은 어디에 있어요?', ['학교 뒤', '학교 앞', '학교 옆', '학교 안'], '학교 뒤에 있어요.'),
        mc('제 방에 없는 것은?', ['소파', '침대', '책상', '옷장'], 'Phòng có 침대, 책상, 옷장; không nhắc 소파.'),
        mc('아침에 왜 불편해요?', ['Chỉ có một nhà vệ sinh.', 'Bếp ở xa.', 'Bà chủ không tốt.', 'Phòng nhỏ.'], '화장실이 하나만 있어요.'),
      ],
    }],
  },
  culture: {
    title: 'Nhà ở Hàn Quốc',
    paras: [
      'Nhà truyền thống Hàn Quốc (한옥) có hệ thống sưởi sàn ondol (온돌): khói nóng chạy dưới nền nhà làm ấm sàn. Ngày nay hầu hết nhà ở, kể cả chung cư, vẫn dùng sưởi sàn.',
      'Phần lớn người Hàn sống ở chung cư (아파트). Sinh viên thường ở ký túc xá, nhà trọ có nấu ăn (하숙집), phòng trọ tự nấu (자취방) hoặc căn hộ nhỏ (원룸, 오피스텔).',
      'Người Hàn cởi giày ở lối vào (현관) trước khi vào nhà; trong nhà thường ngồi, ăn và có khi ngủ ngay trên sàn ấm.',
    ],
    compare: 'Người Việt cũng cởi giày khi vào nhà, nhưng nhà ở Việt Nam thường là nhà ống nhiều tầng; ở Hàn, chung cư cao tầng chiếm đa số.',
  },
  writing: [
    wr('Miêu tả phòng của bạn: 4 câu, mỗi câu có từ chỉ vị trí.', { min_len: 30, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng từ vị trí + 에', kind: 'regex', value: '(위|아래|밑|앞|뒤|옆|안|밖|사이)에', tip: 'Ví dụ: 책상 위에, 침대 옆에.' },
      { label: 'Có 있어요/있습니다', kind: 'regex', value: '있(어요|습니다)', tip: 'N이/가 … 에 있어요.' },
      { label: 'Dùng 도', kind: 'regex', value: '[가-힣]도 ', tip: 'Ví dụ: 의자도 있어요.' }] },
    '제 방에 침대가 있어요. 침대 옆에 책상이 있어요. 책상 위에 컴퓨터가 있어요. 옷장도 있어요. 옷장은 문 뒤에 있어요.', ''),
    wr('Chỉ đường từ trường đến nhà bạn (3 câu, dùng (으)로 và -(으)세요).', { min_len: 25, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng (으)로', kind: 'regex', value: '(으로|쪽로|로) ', tip: 'Ví dụ: 왼쪽으로 가세요.' },
      { label: 'Dùng -(으)세요', kind: 'includes', value: '세요', tip: 'Ví dụ: 쭉 가세요.' }] },
    '학교 앞에서 오른쪽으로 가세요. 쭉 가세요. 은행 옆에 우리 아파트가 있어요.', ''),
  ],
};
