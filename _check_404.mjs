import { chromium } from 'file:///C:/Users/nhatt/OneDrive/Desktop/Bunker%20invoice%20System%20File/bunker-invoicer-main/node_modules/playwright/index.mjs';
const CHROME = 'C:\\Users\\nhatt\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage();

const failed = [];
page.on('response', resp => { if (resp.status() >= 400) failed.push({ url: resp.url(), status: resp.status() }); });
page.on('requestfailed', req => failed.push({ url: req.url(), reason: req.failure()?.errorText }));

const routes = ['/', '/citizen', '/officer', '/officer/applications', '/officer/pipeline', '/officer/governance'];
for (const r of routes) {
  await page.goto(`http://localhost:3000${r}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}

// Also check after login
await page.goto('http://localhost:3000/citizen', { waitUntil: 'networkidle' });
await page.locator('input[type="text"]').first().fill('784-1985-4521458-1');
await page.locator('button:has-text("Continue with UAE PASS")').click();
await page.waitForTimeout(500);
for (let i = 0; i < 4; i++) {
  const inp = page.locator(`#otp-${i}`);
  if (await inp.count()) await inp.fill(String(i+1));
}
await page.waitForTimeout(3000);

console.log('\n=== FAILED REQUESTS ===');
if (failed.length === 0) console.log('No failed requests.');
else failed.forEach(f => console.log(`  ${f.status || 'ERR'} ${f.url?.slice(0, 120)} ${f.reason || ''}`));

// Check EN/AR toggle
await page.goto('http://localhost:3000/officer/applications', { waitUntil: 'networkidle' });
const arBtn = page.locator('button:has-text("AR")');
if (await arBtn.count()) {
  await arBtn.click();
  await page.waitForTimeout(800);
  const afterText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('\n=== AR TOGGLE RESULT ===');
  console.log(afterText.replace(/\n/g,' ').slice(0,200));
} else {
  console.log('\n=== AR TOGGLE: button not found ===');
}

// Check if Assess All button works and updates dashboard
console.log('\n=== ASSESS ALL FLOW ===');
await page.goto('http://localhost:3000/officer/applications', { waitUntil: 'networkidle' });
const assessAll = page.locator('button:has-text("Assess All")');
if (await assessAll.count()) {
  console.log('Assess All button found');
} else {
  console.log('No Assess All button found');
}

await browser.close();
