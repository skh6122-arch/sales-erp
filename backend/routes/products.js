const express = require('express');
const router = express.Router();
const { db, nextId, now } = require('../db/connection');

router.get('/', (req, res) => {
  try {
    const { type, status, period } = req.query;
    const target = period || new Date().toISOString().slice(0,7);
    const prev   = getPrev(target);
    const yoy    = getYoy(target);

    let products = db.get('products').value();
    if (type)   products = products.filter(p => p.type   === type);
    if (status) products = products.filter(p => p.status === status);

    products = products.map(p => {
      const s = db.get('monthly_sales');
      const manager = db.get('managers').find({ id: p.manager_id }).value() || {};
      const cumulative = db.get('monthly_sales').filter({ product_id: p.id }).sumBy('amount').value() || 0;
      return {
        ...p,
        manager_name: manager.name || '',
        manager_team: manager.team || '',
        current_sales: s.filter({ product_id: p.id, period: target }).sumBy('amount').value() || 0,
        prev_sales:    s.filter({ product_id: p.id, period: prev   }).sumBy('amount').value() || 0,
        yoy_sales:     s.filter({ product_id: p.id, period: yoy    }).sumBy('amount').value() || 0,
        cumulative_sales: cumulative,
      };
    });

    res.json({ success: true, data: products });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.get('products').find({ id: Number(req.params.id) }).value();
    if (!product) return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    const manager = db.get('managers').find({ id: product.manager_id }).value() || {};
    res.json({ success: true, data: { ...product, manager_name: manager.name, manager_team: manager.team } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { name, type, manager_id, start_date, end_date, description } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, message: 'name, type은 필수입니다.' });
    const item = { id: nextId('products'), name, type, status: 'active', manager_id: manager_id||null, start_date: start_date||null, end_date: end_date||null, description: description||null, created_at: now() };
    db.get('products').push(item).write();
    res.json({ success: true, data: { id: item.id } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    db.get('products').find({ id: Number(req.params.id) }).assign({ ...req.body, updated_at: now() }).write();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id/end', (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = db.get('products').find({ id }).value();
    if (!product) return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    db.get('products').find({ id }).assign({ status: 'ended', updated_at: now() }).write();
    const { period, expected_amount, reason } = req.body;
    if (expected_amount > 0) {
      const item = { id: nextId('missed_revenue'), product_id: id, manager_id: product.manager_id, period: period || new Date().toISOString().slice(0,7), expected_amount, reason: reason||null, created_at: now() };
      db.get('missed_revenue').push(item).write();
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

function getPrev(yyyymm) {
  const [y,m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m-2, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function getYoy(yyyymm) { return `${Number(yyyymm.slice(0,4))-1}${yyyymm.slice(4)}`; }

module.exports = router;
