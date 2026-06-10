const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/managers', require('./routes/managers'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/sales',     require('./routes/sales'));
app.use('/api/logs',      require('./routes/logs'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 프론트엔드 정적 서빙
const frontendPath = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendPath));
app.get('*', (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Sales ERP 서버 실행 중`);
  console.log(`   주소: http://localhost:${PORT}`);
  console.log(`   확인: http://localhost:${PORT}/api/health\n`);
});
