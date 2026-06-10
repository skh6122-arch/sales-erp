/**
 * DB 연결 - lowdb 사용 (순수 JS, 별도 컴파일 불필요)
 * 데이터는 data/db.json 파일에 저장됩니다
 */

const low  = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const adapter = new FileSync(path.join(DATA_DIR, 'db.json'));
const db = low(adapter);

// 기본 구조 설정
db.defaults({
  managers: [],
  products: [],
  monthly_sales: [],
  activity_logs: [],
  missed_revenue: [],
  _seq: { managers: 0, products: 0, monthly_sales: 0, activity_logs: 0, missed_revenue: 0 }
}).write();

// 자동 증가 ID 생성
function nextId(table) {
  const seq = db.get(`_seq.${table}`).value() + 1;
  db.set(`_seq.${table}`, seq).write();
  return seq;
}

// 현재 시각
function now() {
  return new Date().toLocaleString('ko-KR');
}

module.exports = { db, nextId, now };
