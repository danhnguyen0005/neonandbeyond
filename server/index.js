// Chạy cục bộ: npm start  →  http://localhost:3000
const { app, ready } = require('./app');
const EX = require('./exams');

const PORT = Number(process.env.PORT) || 3000;
ready().then(() => {
  // Tự nộp các lượt thi đã hết giờ (trên Vercel việc này được làm khi người học gọi API thi)
  setInterval(() => { EX.sweepExpired().catch((e) => console.error(e)); }, 30000).unref();
  app.listen(PORT, () => console.log(`Hàn Ngữ Sơ Cấp đang chạy tại http://localhost:${PORT}`));
}).catch((e) => { console.error('Không khởi động được:', e.message); process.exit(1); });
