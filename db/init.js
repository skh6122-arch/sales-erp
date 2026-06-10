/**
 * DB 초기화 - data/db.json 파일 생성
 * 실행: npm run init-db
 */

const { db } = require('./connection');

db.set('managers', []).write();
db.set('products', []).write();
db.set('monthly_sales', []).write();
db.set('activity_logs', []).write();
db.set('missed_revenue', []).write();
db.set('_seq', { managers:0, products:0, monthly_sales:0, activity_logs:0, missed_revenue:0 }).write();

console.log('✅ DB 초기화 완료 → data/db.json');
