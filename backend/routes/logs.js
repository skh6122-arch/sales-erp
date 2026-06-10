const express = require('express');
const router = express.Router();
const { db, nextId, now } = require('../db/connection');

// 활동 통계
router.get('/stats/summary', (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0,7);
    const data = db.get('managers').filter({ is_active: true }).value().map(m => {
      const logs = db.get('activity_logs').filter(l => l.manager_id === m.id && l.activity_date.startsWith(month)).value();
      return {
        ...m,
        total_count:    logs.length,
        meeting_count:  logs.filter(l=>l.type==='미팅').length,
        call_count:     logs.filter(l=>l.type==='전화').length,
        proposal_count: logs.filter(l=>l.type==='제안').length,
        contract_count: logs.filter(l=>l.type==='계약').length,
        total_expected: logs.reduce((s,l) => s + (l.expected_amount||0), 0),
      };
    }).sort((a,b) => b.total_count - a.total_count);
    res.json({ success: true, data });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 로그 목록
router.get('/', (req, res) => {
  try {
    const { manager_id, type, month, limit=50, offset=0 } = req.query;
    let rows = db.get('activity_logs').value();
    if (manager_id) rows = rows.filter(l => l.manager_id === Number(manager_id));
    if (type)       rows = rows.filter(l => l.type === type);
    if (month)      rows = rows.filter(l => l.activity_date.startsWith(month));

    rows.sort((a,b) => b.activity_date.localeCompare(a.activity_date));
    const total = rows.length;
    rows = rows.slice(Number(offset), Number(offset)+Number(limit));

    rows = rows.map(l => {
      const m = db.get('managers').find({ id: l.manager_id }).value() || {};
      return { ...l, manager_name: m.name||'', manager_team: m.team||'', manager_color: m.color||'', manager_bg: m.bg_color||'',
        product_name: db.get('products').find({ id: l.product_id }).get('name').value() || '' };
    });

    res.json({ success: true, data: rows, total });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 로그 등록
router.post('/', (req, res) => {
  try {
    const { manager_id, product_id, activity_date, type, client, content, next_action, expected_amount } = req.body;
    if (!manager_id || !activity_date || !type || !client || !content)
      return res.status(400).json({ success: false, message: 'manager_id, activity_date, type, client, content는 필수입니다.' });
    const item = { id: nextId('activity_logs'), manager_id: Number(manager_id), product_id: product_id||null, activity_date, type, client, content, next_action: next_action||null, expected_amount: expected_amount||0, created_at: now() };
    db.get('activity_logs').push(item).write();
    res.json({ success: true, data: { id: item.id } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 로그 수정
router.put('/:id', (req, res) => {
  try {
    db.get('activity_logs').find({ id: Number(req.params.id) }).assign({ ...req.body, updated_at: now() }).write();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// 로그 삭제
router.delete('/:id', (req, res) => {
  try {
    db.get('activity_logs').remove({ id: Number(req.params.id) }).write();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
