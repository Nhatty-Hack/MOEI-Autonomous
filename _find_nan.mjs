import { chromium } from 'file:///C:/Users/nhatt/OneDrive/Desktop/Bunker%20invoice%20System%20File/bunker-invoicer-main/node_modules/playwright/index.mjs';
const CHROME = 'C:\\Users\\nhatt\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage();

for (const route of ['/officer/applications', '/officer/pipeline', '/officer/governance']) {
  await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // Find all text nodes containing NaN
  const nanNodes = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const found = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.includes('NaN')) {
        found.push({
          text: node.textContent.trim().slice(0, 80),
          parent: node.parentElement?.className || node.parentElement?.tagName || '?',
          outerHTML: node.parentElement?.outerHTML?.slice(0, 120) || '?'
        });
      }
    }
    return found;
  });
  if (nanNodes.length > 0) {
    console.log(`\n${route}:`);
    nanNodes.forEach(n => console.log(`  text: "${n.text}"  parent: ${n.parent}`));
    console.log(`  outerHTML: ${nanNodes[0].outerHTML}`);
  } else {
    console.log(`\n${route}: no NaN in DOM text nodes`);
  }
}

await browser.close();
