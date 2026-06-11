import { chromium } from 'file:///C:/Users/nhatt/OneDrive/Desktop/Bunker%20invoice%20System%20File/bunker-invoicer-main/node_modules/playwright/index.mjs';
import { writeFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const DIR = dirname(fileURLToPath(import.meta.url));
const ss = (n, buf) => { writeFileSync(join(DIR, `audit_${n.toString().padStart(2,'0')}.png`), buf); console.log(`  📸 audit_${n.toString().padStart(2,'0')}.png`); };
const log = (msg) => { console.log(msg); appendFileSync(join(DIR, '_audit_report.txt'), msg + '\n'); };

writeFileSync(join(DIR, '_audit_report.txt'), '=== MOEI HACKATHON AUDIT REPORT ===\n\n');

const CHROME = 'C:\\Users\\nhatt\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const consoleErrors = [];
const pageErrors = [];

const page = await ctx.newPage();
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => pageErrors.push(err.message));

// ── PART 1: ROUTE CHECKS ──────────────────────────────────────────────────
log('\n=== PART 1: ROUTE HTTP STATUS ===');
const routes = ['/', '/citizen', '/officer', '/officer/applications', '/officer/pipeline', '/officer/governance',
                '/sample-docs/bank_statement_mansoori.html', '/sample-docs/salary_certificate_genuine.html',
                '/sample-docs/salary_certificate_tampered.html'];
for (const r of routes) {
  const resp = await page.goto(`http://localhost:3000${r}`);
  log(`  ${resp.status()}  ${r}`);
}

// ── PART 2: OFFICER DASHBOARD ────────────────────────────────────────────
log('\n=== PART 2: OFFICER DASHBOARD (/) ===');
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
ss(1, await page.screenshot());
const dashText = await page.evaluate(() => document.body.innerText);
// Capture all numbers visible on dashboard
const nums = dashText.match(/\b\d[\d,\.]+\b/g) || [];
log(`  Numbers on dashboard: ${[...new Set(nums)].slice(0,20).join(', ')}`);
// Check for hardcoded suspicious values
const hardcoded = ['1234', '9999', '0000', 'lorem', 'ipsum', 'placeholder', 'TODO', 'FIXME', 'test data'];
hardcoded.forEach(h => { if (dashText.toLowerCase().includes(h.toLowerCase())) log(`  ⚠ SUSPICIOUS TEXT: "${h}" found on dashboard`); });

// ── PART 3: OFFICER APPLICATIONS ─────────────────────────────────────────
log('\n=== PART 3: OFFICER APPLICATIONS (/officer/applications) ===');
await page.goto('http://localhost:3000/officer/applications', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
ss(2, await page.screenshot());
const appText = await page.evaluate(() => document.body.innerText);
// Count rows
const rows = await page.locator('table tbody tr, [data-testid="app-row"]').count();
log(`  Table rows visible: ${rows}`);
// Check for assess buttons
const assessBtns = await page.locator('button').filter({ hasText: /assess|تقييم/i }).count();
log(`  Assess buttons found: ${assessBtns}`);

// ── PART 4: OFFICER PIPELINE ──────────────────────────────────────────────
log('\n=== PART 4: OFFICER PIPELINE (/officer/pipeline) ===');
await page.goto('http://localhost:3000/officer/pipeline', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
ss(3, await page.screenshot());
const pipeText = await page.evaluate(() => document.body.innerText);
hardcoded.forEach(h => { if (pipeText.toLowerCase().includes(h.toLowerCase())) log(`  ⚠ SUSPICIOUS: "${h}" on pipeline`); });
log(`  Pipeline content length: ${pipeText.length} chars`);

// ── PART 5: OFFICER GOVERNANCE ────────────────────────────────────────────
log('\n=== PART 5: OFFICER GOVERNANCE (/officer/governance) ===');
await page.goto('http://localhost:3000/officer/governance', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
ss(4, await page.screenshot());
const govText = await page.evaluate(() => document.body.innerText);
log(`  Governance content: ${govText.slice(0, 300).replace(/\n/g, ' ')}`);

// ── PART 6: THREE API ASSESSMENTS ────────────────────────────────────────
log('\n=== PART 6: API ASSESSMENTS ===');
const apps = await (await fetch('http://localhost:3000/api/applications')).json();
const ids = (apps.data || apps).slice(0,5).map(a => a.application_id);
log(`  First 5 app IDs: ${ids.join(', ')}`);

const results = [];
for (const id of ids.slice(0, 3)) {
  try {
    const r = await (await fetch(`http://localhost:3000/api/agent-assess/${id}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' })).json();
    const d = r.data || r;
    results.push({ id, rec: d.recommendation, status: d.application_status, hasInsight: !!d.historical_insight, traceSteps: (d.trace||[]).length });
    log(`  ${id}: rec=${d.recommendation} status=${d.application_status} insight=${!!d.historical_insight} traceSteps=${(d.trace||[]).length}`);
    if (d.historical_insight) log(`    insight: ${JSON.stringify(d.historical_insight).slice(0,100)}`);
  } catch(e) { log(`  ${id}: ERROR ${e.message}`); }
}

// Check decisions differ
const recs = results.map(r => r.rec);
if (new Set(recs).size === 1) log('  ⚠ WARN: All 3 assessments have same recommendation — may look fake');
else log(`  ✓ Decisions vary: ${recs.join(', ')}`);

// ── PART 7: CITIZEN JOURNEY ───────────────────────────────────────────────
log('\n=== PART 7: CITIZEN JOURNEY ===');
await page.goto('http://localhost:3000/citizen', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
ss(5, await page.screenshot());
const loginText = await page.evaluate(() => document.body.innerText);
log(`  Login page text snippet: ${loginText.slice(0,200).replace(/\n/g,' ')}`);

// Check for stray placeholder text
['demo', 'test', 'placeholder', 'lorem'].forEach(h => {
  if (loginText.toLowerCase().includes(h)) log(`  ⚠ LOGIN has "${h}"`);
});

// Login
await page.locator('input[type="text"]').first().fill('784-1985-4521458-1');
await page.waitForTimeout(300);
await page.locator('button:has-text("Continue with UAE PASS")').click();
await page.waitForTimeout(800);
ss(6, await page.screenshot());

// OTP — fill 4 digits
for (let i = 0; i < 4; i++) {
  const inp = page.locator(`#otp-${i}`);
  if (await inp.count()) await inp.fill(String(i+1));
}
await page.waitForTimeout(3000); // connecting animation
await page.waitForFunction(() => !document.body.innerText.includes('Enter OTP'), { timeout: 10000 }).catch(() => {});
ss(7, await page.screenshot());

// Check if we reached upload step or beneficiary
const postLoginText = await page.evaluate(() => document.body.innerText);
log(`  Post-login text: ${postLoginText.slice(0,200).replace(/\n/g,' ')}`);
if (postLoginText.includes('Upload') || postLoginText.includes('رفع')) log('  ✓ Reached upload step');
else if (postLoginText.includes('Not Found') || postLoginText.includes('غير موجود')) log('  ✓ Shows not-found state');
else log('  ? Unknown state after login');

// Check sample docs bar
if (postLoginText.includes('Sample Documents') || postLoginText.includes('المستندات')) log('  ✓ Sample docs bar present');
else log('  ⚠ Sample docs bar NOT visible');

// Check bank statement doc link
const bankLink = await page.locator('a[href*="bank_statement"]').count();
log(`  Bank statement link: ${bankLink > 0 ? '✓ present' : '⚠ MISSING'}`);

// ── PART 8: NON-EXISTENT EMIRATES ID ─────────────────────────────────────
log('\n=== PART 8: NON-EXISTENT EMIRATES ID ===');
await page.goto('http://localhost:3000/citizen', { waitUntil: 'networkidle' });
await page.locator('input[type="text"]').first().fill('784-0000-0000000-0');
await page.locator('button:has-text("Continue with UAE PASS")').click();
await page.waitForTimeout(800);
for (let i = 0; i < 4; i++) {
  const inp = page.locator(`#otp-${i}`);
  if (await inp.count()) await inp.fill('9');
}
await page.waitForTimeout(3500);
ss(8, await page.screenshot());
const notFoundText = await page.evaluate(() => document.body.innerText);
if (notFoundText.toLowerCase().includes('not found') || notFoundText.includes('غير') || notFoundText.includes('sorry') || notFoundText.includes('لم')) {
  log('  ✓ Not-found state shown for unknown Emirates ID');
} else {
  log('  ⚠ Unknown Emirates ID may not show proper error: ' + notFoundText.slice(0,100).replace(/\n/g,' '));
}

// ── PART 9: SECOND USER SESSION ISOLATION ────────────────────────────────
log('\n=== PART 9: SESSION ISOLATION (second user) ===');
await page.goto('http://localhost:3000/citizen', { waitUntil: 'networkidle' });
await page.locator('input[type="text"]').first().fill('784-1968-1234567-5');
await page.locator('button:has-text("Continue with UAE PASS")').click();
await page.waitForTimeout(800);
for (let i = 0; i < 4; i++) {
  const inp = page.locator(`#otp-${i}`);
  if (await inp.count()) await inp.fill('5');
}
await page.waitForTimeout(3500);
ss(9, await page.screenshot());
const user2Text = await page.evaluate(() => document.body.innerText);
// If still shows Mansoori's name, there's a state leak
if (user2Text.includes('Al-Mansoori') || user2Text.includes('المنصوري')) {
  log('  ⚠ POTENTIAL STATE LEAK: Al-Mansoori name visible for different EID');
} else {
  log('  ✓ No obvious state leak for different Emirates ID');
}

// ── PART 10: BANK STATEMENT PAGE ─────────────────────────────────────────
log('\n=== PART 10: BANK STATEMENT DOCUMENT ===');
const bsResp = await page.goto('http://localhost:3000/sample-docs/bank_statement_mansoori.html');
log(`  HTTP status: ${bsResp.status()}`);
await page.waitForTimeout(500);
ss(10, await page.screenshot());
const bsText = await page.evaluate(() => document.body.innerText);
if (bsText.includes('35,000')) log('  ✓ AED 35,000 salary visible');
else log('  ⚠ Salary amount NOT visible');
if (bsText.includes('EMIRATES STEEL')) log('  ✓ Employer name correct');
else log('  ⚠ Employer name missing');
if (bsText.includes('92,239')) log('  ✓ Closing balance correct (92,239.50)');
else log('  ⚠ Closing balance not matching expected');

// ── PART 11: ASSESS PANEL IN BROWSER ─────────────────────────────────────
log('\n=== PART 11: ASSESS PANEL IN BROWSER ===');
await page.goto('http://localhost:3000/officer/applications', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// Try clicking first Assess button
const firstAssess = page.locator('button').filter({ hasText: /assess/i }).first();
if (await firstAssess.count()) {
  await firstAssess.click();
  await page.waitForTimeout(8000); // wait for AI
  ss(11, await page.screenshot());
  const panelText = await page.evaluate(() => document.body.innerText);
  if (panelText.includes('APPROVE') || panelText.includes('REJECT') || panelText.includes('REFER') || panelText.includes('موافق')) {
    log('  ✓ Assessment panel shows decision');
  } else {
    log('  ⚠ No clear decision visible in panel');
  }
  if (panelText.includes('historical') || panelText.includes('precedent') || panelText.includes('سابقة')) {
    log('  ✓ Historical insight visible in panel');
  } else {
    log('  ⚠ No historical insight visible in panel');
  }
  // Check trace steps
  const traceCount = await page.locator('[class*="trace"], [class*="step"], [class*="pipeline"]').count();
  log(`  Trace/pipeline elements: ${traceCount}`);
} else {
  log('  ⚠ No Assess buttons found on page');
}

// ── PART 12: CONSOLE ERRORS SUMMARY ──────────────────────────────────────
log('\n=== PART 12: CONSOLE ERRORS ===');
if (consoleErrors.length === 0) log('  ✓ No console errors');
else {
  log(`  ⚠ ${consoleErrors.length} console error(s):`);
  consoleErrors.forEach(e => log(`    - ${e.slice(0,120)}`));
}
if (pageErrors.length === 0) log('  ✓ No page errors');
else {
  log(`  ⚠ ${pageErrors.length} page error(s):`);
  pageErrors.forEach(e => log(`    - ${e.slice(0,120)}`));
}

// ── PART 13: TEXT SWEEP — hardcoded/placeholder ───────────────────────────
log('\n=== PART 13: SUSPICIOUS TEXT SWEEP ===');
const pagesToCheck = ['/', '/officer/applications', '/officer/pipeline', '/officer/governance'];
for (const route of pagesToCheck) {
  await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const t = await page.evaluate(() => document.body.innerText);
  const suspects = ['lorem', 'ipsum', 'placeholder', 'undefined', 'NaN', 'null', 'TODO', '[object', '{}'];
  suspects.forEach(s => {
    if (t.toLowerCase().includes(s.toLowerCase())) log(`  ⚠ "${s}" on ${route}`);
  });
}
log('  Text sweep complete');

await browser.close();
log('\n=== AUDIT COMPLETE ===');
console.log('\n✅ Audit complete. Report at _audit_report.txt, screenshots audit_*.png');
