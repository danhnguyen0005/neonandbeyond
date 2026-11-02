// Kiểm thử nhanh giao diện người học bằng trình duyệt thật (Playwright)
const { chromium } = require('playwright');
const OUT = process.env.SHOTS || '/tmp/shots';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://localhost:3000/');
  await p.waitForSelector('form');
  await p.click('[data-sw]');
  await p.fill('#dn', 'Ngọc Anh'); await p.fill('#un', 'ngocanh' + Date.now() % 100000); await p.fill('#pw', 'matkhau123');
  await p.click('button[type=submit]');
  await p.waitForSelector('.trow');
  await p.screenshot({ path: OUT + '/1-overview.png', fullPage: false });
  await p.click('a[href="#/practice"]'); await p.waitForSelector('.tcard'); await p.screenshot({ path: OUT + '/2-practice.png' });
  await p.click('.tcard >> nth=10'); await p.waitForSelector('[data-new]'); await p.screenshot({ path: OUT + '/3-topic.png', fullPage: true });
  await p.click('[data-new]'); await p.waitForSelector('.qbody');
  await p.screenshot({ path: OUT + '/4-q.png' });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
