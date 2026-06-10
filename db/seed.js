/**
 * 샘플 데이터 입력
 * 실행: npm run seed
 */

const { db, now } = require('./connection');

// 초기화
db.set('managers', []).set('products', []).set('monthly_sales', [])
  .set('activity_logs', []).set('missed_revenue', [])
  .set('_seq', { managers:0, products:0, monthly_sales:0, activity_logs:0, missed_revenue:0 })
  .write();

// 팀장
const managers = [
  { id:1, name:'조아라', team:'부산2', color:'#378ADD', bg_color:'#E6F1FB', target:10000, is_active:true, created_at:now() },
  { id:2, name:'전인호', team:'부산3', color:'#1D9E75', bg_color:'#E1F5EE', target:9000,  is_active:true, created_at:now() },
  { id:3, name:'손광훈', team:'부산4', color:'#534AB7', bg_color:'#EEEDFE', target:8000,  is_active:true, created_at:now() },
  { id:4, name:'김보라', team:'서울2', color:'#D85A30', bg_color:'#FAECE7', target:8500,  is_active:true, created_at:now() },
  { id:5, name:'김형준', team:'서울3', color:'#BA7517', bg_color:'#FAEEDA', target:9500,  is_active:true, created_at:now() },
];
db.set('managers', managers).set('_seq.managers', 5).write();

// 상품
const products = [
  { id:1, name:'프리미엄 패키지 A', type:'regular', status:'active', manager_id:1, start_date:'2024-01', end_date:'2025-12' },
  { id:2, name:'스탠다드 패키지 B', type:'regular', status:'active', manager_id:2, start_date:'2024-03', end_date:'2025-08' },
  { id:3, name:'베이직 패키지 C',   type:'regular', status:'active', manager_id:3, start_date:'2024-06', end_date:'2025-06' },
  { id:4, name:'기업 전용 D',       type:'regular', status:'active', manager_id:4, start_date:'2023-10', end_date:'2025-10' },
  { id:5, name:'여름 특가 E',       type:'season',  status:'active', manager_id:5, start_date:'2025-05', end_date:'2025-07' },
  { id:6, name:'상반기 프로모션 F', type:'season',  status:'active', manager_id:1, start_date:'2025-01', end_date:'2025-06' },
  { id:7, name:'신년 패키지 G',     type:'season',  status:'ended',  manager_id:2, start_date:'2025-01', end_date:'2025-04' },
  { id:8, name:'봄 특집 H',         type:'season',  status:'ended',  manager_id:3, start_date:'2025-03', end_date:'2025-05' },
  { id:9, name:'겨울 한정 I',       type:'regular', status:'ended',  manager_id:4, start_date:'2024-11', end_date:'2025-04' },
];
db.set('products', products).set('_seq.products', 9).write();

// 월별 매출
const salesRaw = [
  ['2024-12', 1,1,8800], ['2024-12', 2,2,8200], ['2024-12', 3,3,7000], ['2024-12', 4,4,7100], ['2024-12', 5,5,8600], ['2024-12', 1,6,3800], ['2024-12', 2,7,3200],
  ['2025-01', 1,1,9000], ['2025-01', 2,2,8400], ['2025-01', 3,3,7200], ['2025-01', 4,4,7200], ['2025-01', 5,5,8700], ['2025-01', 1,6,4100], ['2025-01', 2,7,3200],
  ['2025-02', 1,1,8500], ['2025-02', 2,2,8000], ['2025-02', 3,3,6800], ['2025-02', 4,4,7000], ['2025-02', 5,5,8400], ['2025-02', 1,6,4200],
  ['2025-03', 1,1,9200], ['2025-03', 2,2,8800], ['2025-03', 3,3,7400], ['2025-03', 4,4,7600], ['2025-03', 5,5,9000], ['2025-03', 1,6,4500], ['2025-03', 3,8,1800],
  ['2025-04', 1,1,9100], ['2025-04', 2,2,8600], ['2025-04', 3,3,7600], ['2025-04', 4,4,7800], ['2025-04', 5,5,8800], ['2025-04', 1,6,5100], ['2025-04', 2,7,3200], ['2025-04', 3,8,1800], ['2025-04', 4,9,2200],
  ['2025-05', 1,1,9200], ['2025-05', 2,2,8700], ['2025-05', 3,3,7500], ['2025-05', 4,4,7800], ['2025-05', 5,5,9800], ['2025-05', 1,6,4200],
];
const sales = salesRaw.map((r,i) => ({ id:i+1, period:r[0], manager_id:r[1], product_id:r[2], amount:r[3], created_at:now() }));
db.set('monthly_sales', sales).set('_seq.monthly_sales', sales.length).write();

// 미발생분
const missed = [
  { id:1, product_id:7, manager_id:2, period:'2025-05', expected_amount:3200, reason:'신년 패키지 계약 종료', created_at:now() },
  { id:2, product_id:8, manager_id:3, period:'2025-05', expected_amount:1800, reason:'봄 특집 시즌 종료', created_at:now() },
  { id:3, product_id:9, manager_id:4, period:'2025-05', expected_amount:2200, reason:'겨울 한정 계약 종료', created_at:now() },
];
db.set('missed_revenue', missed).set('_seq.missed_revenue', 3).write();

// 활동 로그
const logs = [
  { id:1, manager_id:1, product_id:1, activity_date:'2025-05-28', type:'미팅',  client:'(주)테크솔루션',     content:'분기 계약 갱신 미팅. 추가 계약 의향 확인, 유지 확정.',       next_action:'다음달 추가계약 상담 예정', expected_amount:1500, created_at:now() },
  { id:2, manager_id:2, product_id:2, activity_date:'2025-05-27', type:'제안',  client:'글로벌(주)',          content:'신규 패키지 제안서 발송. 긍정적 반응, 추가 질문 있음.',       next_action:'이번주 내 전화 팔로업',     expected_amount:900,  created_at:now() },
  { id:3, manager_id:5, product_id:5, activity_date:'2025-05-25', type:'계약',  client:'비즈니스파트너(주)',  content:'시즌 특가 패키지 계약 완료. 3개월 약정.',                     next_action:'서비스 온보딩 안내 예정',   expected_amount:1950, created_at:now() },
  { id:4, manager_id:3, product_id:3, activity_date:'2025-05-24', type:'전화',  client:'미래산업(주)',        content:'계약 만료 관련 전화. 고객사 예산 문제로 갱신 어려움 표명.',   next_action:'2주 내 재연락 예정',        expected_amount:0,    created_at:now() },
  { id:5, manager_id:4, product_id:4, activity_date:'2025-05-22', type:'미팅',  client:'코리아엔터프라이즈',  content:'기업 전용 서비스 추가 확장 미팅. 2개 부서 추가 도입 논의.',  next_action:'제안서 작성 후 발송',       expected_amount:2200, created_at:now() },
  { id:6, manager_id:1, product_id:6, activity_date:'2025-05-20', type:'기타',  client:'내부 미팅',           content:'월간 영업 전략 회의 참석. 신규 타겟 고객군 발굴 계획 수립.', next_action:'다음주 첫 콜드콜 실시',     expected_amount:0,    created_at:now() },
  { id:7, manager_id:2, product_id:2, activity_date:'2025-05-15', type:'전화',  client:'스마트솔루션(주)',    content:'기존 고객 만족도 확인 전화. 추가 니즈 발굴.',                 next_action:'제안서 준비',               expected_amount:800,  created_at:now() },
  { id:8, manager_id:5, product_id:5, activity_date:'2025-05-10', type:'제안',  client:'퓨처테크(주)',        content:'여름 특가 상품 제안. 경쟁사 대비 가격 비교 요청.',            next_action:'가격 비교표 발송',          expected_amount:600,  created_at:now() },
];
db.set('activity_logs', logs).set('_seq.activity_logs', 8).write();

console.log('✅ 샘플 데이터 입력 완료');
console.log('   팀장', managers.length, '명 / 상품', products.length, '개 / 매출', sales.length, '건 / 로그', logs.length, '건');
