// Kiểm thử giao diện bằng Chromium: luồng học viên (luyện tập, thi thử), quản trị, mobile. Cần server đang chạy ở :3000.
const { chromium } = require('playwright');
const OUT = process.env.SHOTS || '.';
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'Admin@12345';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const watch = (p, tag) => { p.on('pageerror', (e) => errs.push(`${tag} pageerror: ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|403/.test(m.text())) errs.push(`${tag}: ${m.text()}`); }); };
  // Học viên
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); watch(p, 'learner');
  await p.goto('http://localhost:3000/'); await p.click('[data-sw]');
  await p.fill('#dn', 'Thử nghiệm'); await p.fill('#un', 'ui' + Date.now() % 1e6); await p.fill('#pw', 'matkhau123'); await p.click('button[type=submit]');
  await p.waitForSelector('.trow'); await p.click('.trow >> nth=0'); await p.click('[data-new]');
  for (let i = 0; i < 10; i++) {
    await p.waitForSelector('.qbody');
    const opt = await p.$('.opt:not([disabled])');
    if (opt) await opt.click(); else { await p.fill('.answer-input', '가'); await p.click('text=Kiểm tra'); }
    await p.waitForSelector('.feedback'); await p.click('.feedback ~ .row .btn.primary');
  }
  await p.waitForSelector('.score-big'); await p.screenshot({ path: OUT + '/5-summary.png' });
  for (const r of ['#/review', '#/progress']) { await p.goto('http://localhost:3000/' + r); await p.waitForTimeout(600); }
  await p.screenshot({ path: OUT + '/6-progress.png' });
  await p.goto('http://localhost:3000/#/exams'); await p.waitForSelector('a[href^="#/exam/"]'); await p.click('a[href^="#/exam/"] >> nth=0');
  await p.click('[data-go]'); await p.waitForSelector('.qnav');
  await p.click('.opt >> nth=0'); await p.click('[data-flag]'); await p.screenshot({ path: OUT + '/7-exam.png' });
  await p.click('[data-submit]'); await p.click('.modal .btn.primary'); await p.waitForSelector('.score-big'); await p.screenshot({ path: OUT + '/8-result.png' });
  // Mobile
  const m = await b.newPage({ viewport: { width: 390, height: 844 } }); watch(m, 'mobile');
  await m.context().addCookies(await p.context().cookies());
  for (const r of ['#/', '#/practice', '#/review', '#/exams']) { await m.goto('http://localhost:3000/' + r); await m.waitForTimeout(700); const w = await m.evaluate(() => document.documentElement.scrollWidth); if (w > 392) errs.push(`mobile overflow ${r}: ${w}px`); }
  await m.screenshot({ path: OUT + '/9-mobile.png' });
  // Quản trị
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 860 } }); const a = await ctx2.newPage(); watch(a, 'admin');
  await a.goto('http://localhost:3000/'); await a.fill('#un', 'admin'); await a.fill('#pw', ADMIN_PW); await a.click('button[type=submit]'); await a.waitForSelector('.trow');
  for (const k of ['reports', 'users', 'content', 'questions', 'exams', 'writing', 'settings', 'logs']) { await a.goto('http://localhost:3000/admin#' + k); await a.waitForTimeout(700); }
  await a.goto('http://localhost:3000/admin#questions'); await a.waitForSelector('[data-edit]'); await a.click('[data-edit] >> nth=0'); await a.waitForSelector('.modal'); await a.screenshot({ path: OUT + '/10-admin-q.png' });
  await a.goto('http://localhost:3000/admin#reports'); await a.waitForTimeout(800); await a.screenshot({ path: OUT + '/11-admin-rep.png' });
  console.log(errs.length ? errs.join('\n') : 'Không có lỗi JavaScript.');
  await b.close(); process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
