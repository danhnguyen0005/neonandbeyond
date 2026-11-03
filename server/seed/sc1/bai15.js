// Sơ cấp 1 · Bài 15 — 교통 (Giao thông)
const { mc, fill, tr, ord, err, ls, wr } = require('../dsl');

const REO = [['먹다', 'ăn'], ['사다', 'mua'], ['보다', 'xem'], ['공부하다', 'học'], ['놀다', 'chơi'], ['만나다', 'gặp'], ['찾다', 'tìm'], ['배우다', 'học'], ['만들다', 'làm'], ['읽다', 'đọc'], ['쉬다', 'nghỉ'], ['구경하다', 'tham quan'],
  ['수영하다', 'bơi'], ['찍다', 'chụp'], ['받다', 'nhận'], ['듣다', 'nghe']];

module.exports = {
  unit: 15, ko: '교통', vi: 'Giao thông', vocabName: 'phương tiện, phó từ nghi vấn, giao thông',
  vocab: [
    ['Phương tiện giao thông (1)', [['버스', 'xe buýt'], ['기차', 'tàu hoả'], ['택시', 'taxi'], ['지하철', 'tàu điện ngầm'], ['오토바이', 'xe máy'], ['자동차', 'ô tô'], ['배', 'thuyền, tàu thuỷ'], ['비행기', 'máy bay'],
      ['자전거', 'xe đạp'], ['전차', 'tàu điện'], ['세옴', 'xe ôm'], ['시클로', 'xích lô'], ['KTX', 'tàu cao tốc'], ['리무진 버스', 'xe buýt sân bay']]],
    ['Phó từ nghi vấn', [['어떻게', 'như thế nào, bằng cách nào'], ['얼마나', 'bao nhiêu, bao lâu'], ['언제', 'khi nào'], ['왜', 'tại sao']]],
    ['Xe buýt, tàu điện, taxi', [['버스 정류장', 'trạm xe buýt'], ['정거장', 'điểm dừng'], ['고속버스', 'xe buýt cao tốc'], ['시내버스', 'xe buýt nội thành'], ['마을버스', 'xe buýt tuyến ngắn'], ['버스 터미널', 'bến xe khách'],
      ['교통 카드', 'thẻ giao thông'], ['매표소', 'quầy vé'], ['지하철역', 'ga tàu điện ngầm'], ['노선도', 'bản đồ tuyến'], ['호선', 'tuyến (số)'], ['모범택시', 'taxi cao cấp'], ['개인택시', 'taxi cá nhân'], ['요금', 'cước phí']]],
    ['Giao thông khác', [['기차역', 'ga tàu hoả'], ['공항', 'sân bay'], ['주차장', 'bãi đỗ xe'], ['주유소', 'trạm xăng'], ['횡단보도', 'vạch qua đường'], ['육교', 'cầu vượt'], ['지하도', 'đường hầm'], ['신호등', 'đèn giao thông'],
      ['고속도로', 'đường cao tốc'], ['도로', 'đường'], ['타다', 'lên, đi (xe)'], ['내리다', 'xuống (xe)'], ['갈아타다', 'đổi (xe, tuyến)'], ['길이 막히다', 'tắc đường'], ['시간이 걸리다', 'mất thời gian'], ['교통사고가 나다', 'xảy ra tai nạn']]],
    ['Từ mới trong bài', [['편의점', 'cửa hàng tiện lợi'], ['간식', 'đồ ăn vặt'], ['야경', 'cảnh đêm'], ['남산', 'núi Namsan'], ['시내', 'trung tâm thành phố'], ['지각하다', 'đến muộn'], ['학생회관', 'hội quán sinh viên'], ['요리 학원', 'lớp dạy nấu ăn'],
      ['쯤', 'khoảng'], ['정도', 'khoảng, mức'], ['빨리', 'nhanh'], ['천천히', 'chậm'], ['보통', 'thường']]],
  ],
  vocabNote: 'Đi bằng phương tiện: 버스로 가요 = 버스를 타고 가요. Lên xe: N을/를 타다; xuống xe: N에서 내리다. Hỏi mất bao lâu: 시간이 얼마나 걸려요? — 30분쯤 걸려요.',
  grammar: [
    {
      name: 'N에서 N까지 (từ … đến …: nơi chốn)', desc: 'Phạm vi điểm đi – điểm đến.',
      lesson: {
        goal: 'Nói quãng đường đi từ đâu đến đâu.',
        formula: 'Nơi chốn 1 + 에서 + nơi chốn 2 + 까지',
        explain: '에서 chỉ điểm xuất phát, 까지 chỉ điểm kết thúc về không gian. Thời gian dùng 부터 ~ 까지 (Bài 11). Thường đi với 어떻게 가요? và 얼마나 걸려요?',
        examples: [['집에서 학교까지 어떻게 가요?', 'Từ nhà đến trường đi bằng gì?'], ['한국에서 베트남까지 시간이 얼마나 걸려요?', 'Từ Hàn Quốc đến Việt Nam mất bao lâu?'], ['다섯 시간쯤 걸려요.', 'Mất khoảng 5 tiếng.']],
        mistakes: ['Dùng 부터 cho nơi chốn: 집부터 학교까지 → chuẩn là 집에서 학교까지.', 'Nhầm 에서 (từ) với 에 (đến).'],
      },
      q: [
        mc('하노이___ 호찌민___ 비행기로 두 시간 걸려요.', ['에서 / 까지', '부터 / 에서', '까지 / 에서', '에 / 까지'], 'Nơi chốn: 에서 ~ 까지.', { fixed: true, tag: 'particle' }),
        mc('“Từ 9 giờ đến 6 giờ” và “từ nhà đến công ty” lần lượt là:', ['아홉 시부터 여섯 시까지 / 집에서 회사까지', '아홉 시에서 여섯 시까지 / 집부터 회사까지', '아홉 시부터 여섯 시에 / 집에서 회사에', '아홉 시까지 여섯 시부터 / 집까지 회사에서'], 'Thời gian 부터, nơi chốn 에서.', { d: 3 }),
        fill('Điền: 서울역___ 공항까지 기차로 가요.', ['에서'], 'Điểm xuất phát → 에서.'),
        tr('Dịch: “Từ nhà đến trường mất bao lâu?”', ['집에서 학교까지 얼마나 걸려요?', '집에서 학교까지 시간이 얼마나 걸려요?', '집에서 학교까지 얼마나 걸려요', '집에서 학교까지 얼마나 걸립니까?'], '에서 ~ 까지 + 얼마나 걸려요?'),
        ls('집에서 회사까지 한 시간쯤 걸려요.', ['Từ nhà đến công ty mất khoảng 1 tiếng.', 'Từ công ty về nhà mất 2 tiếng.', 'Nhà gần công ty.', 'Tôi đi làm lúc 1 giờ.'], '한 시간쯤 = khoảng 1 tiếng.'),
      ],
    },
    {
      name: 'N(으)로 (phương tiện, cách thức)', desc: '“Bằng …”: phương tiện, công cụ.',
      lesson: {
        goal: 'Nói đi bằng phương tiện gì, làm bằng gì.',
        formula: 'Có patchim (trừ ㄹ) + 으로 · không patchim / patchim ㄹ + 로',
        explain: '(으)로 chỉ phương tiện, công cụ, cách thức: 버스로, 지하철로, 손으로, 한국어로. Với phương tiện có thể nói N(으)로 가다 hoặc N을/를 타고 가다: 버스로 가요 = 버스를 타고 가요.',
        examples: [['저는 학교까지 오토바이로 와요.', 'Tôi đến trường bằng xe máy.'], ['한국 사람은 보통 버스와 지하철로 회사에 가요.', 'Người Hàn thường đi làm bằng xe buýt và tàu điện.'], ['한국어로 이야기해요.', 'Nói chuyện bằng tiếng Hàn.']],
        mistakes: ['지하철으로 ✗ → 지하철로 (patchim ㄹ).', '버스로 타요 ✗ → 버스를 타요 / 버스로 가요.'],
      },
      gen: [{ kind: 'particle', pair: ['으로', '로'], note: '(Có patchim → 으로; không patchim hoặc patchim ㄹ → 로.)', items: [
        ['버스', '버스___ 가요.'], ['지하철', '지하철___ 가요.'], ['택시', '택시___ 왔어요.'], ['자전거', '자전거___ 학교에 가요.'], ['기차', '부산까지 기차___ 가요.'], ['비행기', '제주도에 비행기___ 가요.'],
        ['배', '섬까지 배___ 가요.'], ['오토바이', '오토바이___ 출근해요.'], ['자동차', '자동차___ 여행해요.'], ['한국어', '한국어___ 말해요.'], ['손', '손___ 먹어요.'], ['젓가락', '젓가락___ 먹어요.'],
        ['연필', '연필___ 써요.'], ['고속버스', '고속버스___ 가요.']] }],
      q: [
        mc('“Tôi đi làm bằng tàu điện ngầm.” — chọn câu đúng:', ['지하철로 출근해요.', '지하철으로 출근해요.', '지하철을 출근해요.', '지하철에서 출근해요.'], '지하철 (patchim ㄹ) → 로.', { fb: { '지하철으로 출근해요.': 'Patchim ㄹ chỉ thêm 로.' } }),
        mc('Câu nào có nghĩa GIỐNG “버스로 가요”?', ['버스를 타고 가요.', '버스에서 가요.', '버스를 가요.', '버스에 가요.'], 'N(으)로 가다 = N을/를 타고 가다.', { d: 2 }),
        tr('Dịch: “Tôi đi Busan bằng tàu cao tốc KTX.”', ['부산에 KTX로 가요.', 'KTX로 부산에 가요.', '저는 KTX로 부산에 가요.', '저는 부산에 KTX로 가요.', 'KTX를 타고 부산에 가요.'], 'KTX + 로.'),
        err(['저는', '학교에', '자전거으로', '가요.'], 2, '자전거 không patchim → 자전거로.'),
      ],
    },
    {
      name: '-(으)러 가다/오다 (đi để …)', desc: 'Mục đích của sự di chuyển.',
      lesson: {
        goal: 'Nói đi/đến đâu để làm gì.',
        formula: 'Gốc không patchim / gốc ㄹ + 러 · có patchim + 으러 + 가다/오다/다니다/나가다…',
        explain: '-(으)러 chỉ mục đích, CHỈ đi với động từ di chuyển (가다, 오다, 다니다, 나가다, 들어가다…). Nơi đến dùng 에: 식당에 밥 먹으러 가요.',
        examples: [['저는 한국에 한국어를 공부하러 왔어요.', 'Tôi đến Hàn Quốc để học tiếng Hàn.'], ['우리는 지금 밥 먹으러 가요.', 'Bây giờ chúng tôi đi ăn cơm.'], ['토요일에 공원에 놀러 갈까요?', 'Thứ bảy đi công viên chơi nhé?']],
        mistakes: ['Dùng với động từ không di chuyển: 공부하러 만나요 ✗ (dùng -(으)려고).', '먹러 ✗ → 먹으러; 놀으러 ✗ → 놀러.'],
        compare: '-(으)러 + chỉ động từ di chuyển; -(으)려고 (Bài 12) dùng với mọi động từ.',
      },
      gen: [{ kind: 'verb', form: 'reo', verbs: REO, typed: 0.5 }],
      q: [
        mc('A: 어디에 가요?  B: 우체국에 편지를 ___ 가요.', ['보내러', '보내으러', '보내려', '보내고'], '보내 + 러.'),
        mc('Câu nào SAI?', ['친구를 만나러 공부해요.', '친구를 만나러 카페에 가요.', '책을 사러 서점에 가요.', '밥을 먹으러 식당에 왔어요.'], '-(으)러 chỉ đi với động từ di chuyển.', { d: 3 }),
        fill('Điền: 주말에 남산에 야경을 (보다) ___ 가요.', ['보러'], '보 + 러.'),
        tr('Dịch: “Tôi đi đến thư viện để đọc sách.”', ['도서관에 책을 읽으러 가요.', '책을 읽으러 도서관에 가요.', '저는 도서관에 책을 읽으러 가요.', '저는 책을 읽으러 도서관에 가요.'], '읽 + 으러 가요.'),
        ord('Sắp xếp: “Tôi đến Hàn Quốc để học tiếng Hàn.”', ['한국어를', '배우러', '한국에', '왔어요.'], 'Mục đích (으)러 + nơi đến에 + 왔어요.'),
      ],
    },
  ],
  pron: {
    name: 'Bật hơi hoá ㅎ + ㄱ ㄷ ㅈ', desc: 'Patchim ㅎ trước ㄱ, ㄷ, ㅈ → [ㅋ, ㅌ, ㅊ].',
    lesson: { goal: 'Đọc đúng 좋고, 많지, 싫다…', explain: 'Patchim ㅎ (kể cả ㄶ, ㅀ) đứng trước ㄱ, ㄷ, ㅈ thì hợp lại thành âm bật hơi [ㅋ], [ㅌ], [ㅊ].',
      examples: [['좋고 → [조코]', 'tốt và'], ['많지 → [만치]', 'nhiều đấy'], ['싫다 → [실타]', 'ghét'], ['놓고 → [노코]', 'đặt rồi'], ['좋지 않아요 → [조치 아나요]', 'không tốt']] },
    q: [
      mc('좋고 được đọc là:', ['[조코]', '[좋고]', '[조고]', '[종고]'], 'ㅎ + ㄱ → [ㅋ].', { fixed: true }),
      mc('많다 được đọc là:', ['[만타]', '[많다]', '[마다]', '[만다]'], 'ㄶ: ㅎ + ㄷ → [ㅌ].', { fixed: true }),
      ls('그렇지만', ['[그러치만]', '[그럳지만]', '[그러지만]', '[그럿치만]'], 'ㅎ + ㅈ → [ㅊ].', { prompt: 'Nghe và chọn cách đọc đúng.', fixed: true, d: 2 }),
    ],
  },
  listening: {
    desc: 'Nghe hỏi đường, phương tiện, thời gian di chuyển.',
    q: [
      ls('학교까지 버스로 이십 분 걸려요.', ['Đến trường mất 20 phút bằng xe buýt.', 'Đến trường mất 20 phút đi bộ.', 'Đến trường mất 2 tiếng.', 'Trường cách 20 km.'], '이십 분 = 20 phút.', { tag: 'number' }),
      ls('시청역에서 2호선으로 갈아타세요.', ['Đổi sang tuyến số 2 ở ga Toà thị chính.', 'Xuống ở ga số 2.', 'Đi tuyến 2 đến Toà thị chính.', 'Ga Toà thị chính ở tuyến 2.'], '갈아타다 = đổi tuyến.', { d: 2 }),
      ls('길이 많이 막혀요.', ['Đường tắc lắm.', 'Đường xa lắm.', 'Đường rất rộng.', 'Không có đường.'], '길이 막히다 = tắc đường.'),
      ls('어디에서 내려요?', ['Xuống ở đâu?', 'Lên xe ở đâu?', 'Đi đâu vậy?', 'Đổi tuyến ở đâu?'], '내리다 = xuống xe.'),
      ls('친구를 만나러 명동에 가요.', ['Đi Myeongdong để gặp bạn.', 'Gặp bạn ở Myeongdong rồi về.', 'Bạn tôi sống ở Myeongdong.', 'Đi Myeongdong mua sắm.'], '만나러 가요 = đi để gặp.'),
    ],
    passages: [{
      title: 'Đi Namsan', ko: '마이: 민수 씨, 남산에 어떻게 가요?\n민수: 지하철 4호선을 타고 명동역에서 내리세요. 거기에서 남산까지 걸어서 이십 분쯤 걸려요.\n마이: 버스는 없어요?\n민수: 있어요. 명동역 앞에서 남산 순환버스를 타세요. 버스로 가면 십 분 정도 걸려요.\n마이: 고마워요. 오늘 저녁에 야경을 보러 갈 거예요.',
      q: [
        mc('지하철 몇 호선을 타요?', ['4호선', '2호선', '1호선', '3호선'], '지하철 4호선.', { tag: 'number' }),
        mc('명동역에서 남산까지 걸어서 얼마나 걸려요?', ['20 phút', '10 phút', '30 phút', '1 tiếng'], '걸어서 이십 분쯤.', { tag: 'number' }),
        mc('마이 씨는 왜 남산에 가요?', ['야경을 보러', '등산하러', '친구를 만나러', '버스를 타러'], '야경을 보러 갈 거예요.'),
      ],
    }],
  },
  reading: {
    passages: [{
      title: 'Đường đến trường', ko: '저는 매일 아침 지하철로 학교에 가요. 집에서 지하철역까지 마을버스로 오 분쯤 걸려요. 지하철을 타고 한 번 갈아타요. 집에서 학교까지 모두 사십 분쯤 걸려요. 지하철은 빠르고 편리해요. 그렇지만 아침에는 사람이 너무 많아요. 그래서 가끔 지각해요. 오늘도 늦게 일어나서 택시를 탔어요. 그런데 길이 막혀서 지하철보다 더 늦게 도착했어요.',
      vi: 'Sáng nào tôi cũng đến trường bằng tàu điện ngầm. Từ nhà ra ga đi xe buýt tuyến ngắn mất khoảng 5 phút, đổi tàu một lần, tổng cộng khoảng 40 phút. Tàu điện nhanh và tiện, nhưng buổi sáng đông người nên thỉnh thoảng đi muộn. Hôm nay dậy muộn nên đi taxi, nhưng tắc đường nên đến còn muộn hơn đi tàu.',
      q: [
        mc('집에서 학교까지 얼마나 걸려요?', ['40 phút', '5 phút', '14 phút', '1 tiếng'], '모두 사십 분쯤.', { tag: 'number' }),
        mc('오늘은 무엇을 타고 학교에 갔어요?', ['택시', '지하철', '마을버스', '자전거'], '택시를 탔어요.'),
        mc('Câu nào đúng?', ['오늘 길이 막혀서 늦게 도착했어요.', '지하철은 아침에 사람이 적어요.', '이 사람은 지하철을 갈아타지 않아요.', '오늘 일찍 일어났어요.'], '길이 막혀서 … 늦게 도착했어요.'),
      ],
    }],
  },
  culture: {
    title: 'Giao thông công cộng ở Hàn Quốc',
    paras: [
      'Các thành phố lớn của Hàn Quốc có hệ thống tàu điện ngầm và xe buýt dày đặc. Xe buýt được phân màu theo loại tuyến: xanh dương (tuyến chính), xanh lá (tuyến nhánh, nối ga tàu), đỏ (tuyến nhanh nối ngoại ô), vàng (tuyến vòng trong trung tâm).',
      'Thẻ giao thông (교통 카드) dùng được cho cả xe buýt, tàu điện ngầm và taxi; đổi tuyến trong khoảng thời gian quy định được giảm hoặc miễn phí.',
      'Giữa các thành phố có tàu cao tốc KTX (Seoul – Busan khoảng 2 giờ 30 phút) và xe buýt cao tốc. Trên tàu, xe có ghế ưu tiên dành cho người già, người khuyết tật, phụ nữ mang thai.',
    ],
    compare: 'Ở Việt Nam xe máy là phương tiện chính; các thành phố lớn mới bắt đầu có tàu điện đô thị (Hà Nội, TP.HCM).',
  },
  writing: [
    wr('Bạn đi từ nhà đến trường/công ty như thế nào? Viết 4 câu (에서 ~ 까지, (으)로, 걸려요).', { min_len: 35, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng 에서 … 까지', kind: 'regex', value: '에서.*까지', tip: '집에서 학교까지 …' },
      { label: 'Dùng (으)로 chỉ phương tiện', kind: 'regex', value: '(버스|지하철|택시|오토바이|자전거|기차|자동차|비행기|배)(으로|로)', tip: 'Ví dụ: 오토바이로 가요.' },
      { label: 'Có 걸려요', kind: 'regex', value: '걸(려요|립니다|렸어요)', tip: '… 분쯤 걸려요.' }] },
    '저는 매일 오토바이로 학교에 가요. 집에서 학교까지 이십 분쯤 걸려요. 아침에는 길이 많이 막혀요. 그래서 일찍 출발해요.', ''),
    wr('Cuối tuần bạn sẽ đi đâu để làm gì? Viết 3 câu dùng -(으)러 가요.', { min_len: 25, criteria: [
      { label: 'Viết bằng chữ Hàn', kind: 'hangul', tip: 'Dùng bàn phím tiếng Hàn.' },
      { label: 'Dùng -(으)러 + động từ di chuyển', kind: 'regex', value: '러 (가|와|갈|올|갔|왔|다녀|나가)', tip: 'Ví dụ: 영화를 보러 가요.' }] },
    '토요일에 친구를 만나러 시내에 갈 거예요. 백화점에 옷을 사러 가요. 일요일에는 공원에 산책하러 가요.', ''),
  ],
};
