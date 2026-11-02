// Điểm vào cho Vercel: mọi request /api/*, /admin được chuyển tới ứng dụng Express.
module.exports = require('../server/app').app;
