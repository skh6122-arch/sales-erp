const express = require('express');
const router = express.Router();
const { db, nextId, now } = require('../db/connection');

// 전체 팀장 목록
router.get('/', (req, res) => {
  try {
    const period = req.query.period || new Date().toISOString().slice(0,7);
    const prev   = getPrev(period);
    const yoy    = getYoy(period);

    const managers = db.get('managers').filter({ is_active: true }).value().map(m => {
      const sales = db.get('monthly_sales');
      return {
        ...m,
        current_sales: sales.filter({ manager_id: m.id, period }).sumBy('amount').value() || 0,
        prev_sales:    sales.filter({ manager_id: m.id, period: prev }).sumBy('amount').value() || 0,
        yoy_sales:     sales.filter({ manager_id: m.id, period: yoy }).sumBy('amount').value() || 0,
      };
    });
    res.json({ success: true, data: managers });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 팀장 상세
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const manager = db.get('managers').find({ id }).value();
    if (!manager) return res.status(404).json({ success: false, message: '팀장을 찾을 수 없습니다.' });

    const logs = db.get('activity_logs').filter({ manager_id: id })
      .orderBy(['activity_date'], ['desc']).take(20).value()
      .map(l => ({ ...l, product_name: db.get('products').find({ id: l.product_id }).get('name').value() || '' }));

    res.json({ success: true, data: { ...manager, logs } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 팀장 등록
router.post('/', (req, res) => {
  try {
    const { name, team, color, bg_color, target } = req.body;
    if (!name || !team) return res.status(400).json({ success: false, message: 'name, team은 필수입니다.' });
    const item = { id: nextId('managers'), name, team, color: color||'#378ADD', bg_color: bg_color||'#E6F1FB', target: target||0, is_active: true, created_at: now() };
    db.get('managers').push(item).write();
    res.json({ success: true, data: { id: item.id } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 팀장 수정
router.put('/:id', (req, res) => {
  try {
    db.get('managers').find({ id: Number(req.params.id) }).assign({ ...req.body, updated_at: now() }).write();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 팀장 비활성화
router.delete('/:id', (req, res) => {
  try {
    db.get('managers').find({ id: Number(req.params.id) }).assign({ is_active: false }).write();
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
