const express = require('express');
const router = express.Router();
const { db, nextId, now } = require('../db/connection');

// 대시보드
router.get('/dashboard', (req, res) => {
  try {
    const period = req.query.period || new Date().toISOString().slice(0,7);
    const prev   = getPrev(period);
    const yoy    = getYoy(period);

    const allSales = db.get('monthly_sales');
    const total_current = allSales.filter({ period }).sumBy('amount').value() || 0;
    const total_prev    = allSales.filter({ period: prev }).sumBy('amount').value() || 0;
    const total_yoy     = allSales.filter({ period: yoy  }).sumBy('amount').value() || 0;

    const managers = db.get('managers').filter({ is_active: true }).value().map(m => ({
      ...m,
      current_sales: allSales.filter({ manager_id: m.id, period }).sumBy('amount').value() || 0,
      prev_sales:    allSales.filter({ manager_id: m.id, period: prev }).sumBy('amount').value() || 0,
      yoy_sales:     allSales.filter({ manager_id: m.id, period: yoy  }).sumBy('amount').value() || 0,
    })).sort((a,b) => b.current_sales - a.current_sales);

    const products = db.get('products').value();
    const active_count = products.filter(p => p.status === 'active').length;
    const total_count  = products.length;

    const missedItems = db.get('missed_revenue').filter({ period }).value().map(r => ({
      ...r,
      product_name: db.get('products').find({ id: r.product_id }).get('name').value() || '',
      manager_name: db.get('managers').find({ id: r.manager_id }).get('name').value() || '',
    }));
    const total_missed = missedItems.reduce((s,r) => s + r.expected_amount, 0);

    // 최근 6개월 추이
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const p = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      trend.push({ period: p, total: allSales.filter({ period: p }).sumBy('amount').value() || 0 });
    }

    // 유형별 매출
    const byType = ['regular','season'].map(type => ({
      type,
      total: products.filter(p=>p.type===type && p.status==='active')
        .reduce((s,p) => s + (allSales.filter({ product_id: p.id, period }).sumBy('amount').value()||0), 0)
    }));

    res.json({ success: true, data: {
      period,
      summary: {
        total_current, total_prev, total_yoy,
        mom_rate: total_prev ? ((total_current-total_prev)/total_prev*100).toFixed(1) : null,
        yoy_rate: total_yoy  ? ((total_current-total_yoy) /total_yoy *100).toFixed(1) : null,
        active_count, total_count,
        maintain_rate: total_count ? (active_count/total_count*100).toFixed(1) : 0,
        total_missed, missed_count: missedItems.length,
      },
      managers, trend, byType, missedItems,
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 기간 비교
router.get('/compare', (req, res) => {
  try {
    const period = req.query.period || new Date().toISOString().slice(0,7);
    const prev   = getPrev(period);
    const yoy    = getYoy(period);
    const allSales = db.get('monthly_sales');

    const data = db.get('managers').filter({ is_active: true }).value().map(m => {
      const cur  = allSales.filter({ manager_id: m.id, period }).sumBy('amount').value() || 0;
      const prv  = allSales.filter({ manager_id: m.id, period: prev }).sumBy('amount').value() || 0;
      const yyy  = allSales.filter({ manager_id: m.id, period: yoy  }).sumBy('amount').value() || 0;
      return {
        ...m, current_sales: cur, prev_sales: prv, yoy_sales: yyy,
        mom_rate: prv ? ((cur-prv)/prv*100).toFixed(1) : null,
        yoy_rate: yyy ? ((cur-yyy)/yyy*100).toFixed(1) : null,
        achieve_rate: m.target ? (cur/m.target*100).toFixed(1) : null,
      };
    }).sort((a,b) => b.current_sales - a.current_sales);

    res.json({ success: true, data, meta: { period, prevMonth: prev, yoyMonth: yoy } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 매출 입력 (UPSERT)
router.post('/', (req, res) => {
  try {
    const { manager_id, product_id, period, amount, note } = req.body;
    if (!manager_id || !product_id || !period || amount === undefined)
      return res.status(400).json({ success: false, message: 'manager_id, product_id, period, amount는 필수입니다.' });

    const existing = db.get('monthly_sales').find({ manager_id, product_id, period }).value();
    if (existing) {
      db.get('monthly_sales').find({ manager_id, product_id, period }).assign({ amount, note: note||null, updated_at: now() }).write();
    } else {
      db.get('monthly_sales').push({ id: nextId('monthly_sales'), manager_id, product_id, period, amount, note: note||null, created_at: now() }).write();
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 미발생분
router.get('/missed', (req, res) => {
  try {
    const { period } = req.query;
    let rows = db.get('missed_revenue').value();
    if (period) rows = rows.filter(r => r.period === period);
    rows = rows.map(r => ({
      ...r,
      product_name: db.get('products').find({ id: r.product_id }).get('name').value() || '',
      manager_name: db.get('managers').find({ id: r.manager_id }).get('name').value() || '',
    }));
    const total = rows.reduce((s,r) => s + r.expected_amount, 0);
    res.json({ success: true, data: rows, total });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

function getPrev(yyyymm) {
  const [y,m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m-2, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function getYoy(yyyymm) { return `${Number(yyyymm.slice(0,4))-1}${yyyymm.slice(4)}`; }

module.exports = router;
