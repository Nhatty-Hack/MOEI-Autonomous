import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:3000';
const issues = [];
const log = (...a) => console.log('[AUDIT]', ...a);

function flag(severity, url, what, screenshot, fix) {
  issues.push({ severity, url, what, screenshot: screenshot || null, fix });
  console.log(`[${severity}] ${url} — ${what}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  let sc = 1;
  const shot = async (name) => {
    const fn = `audit_${String(sc++).padStart(2,'0')}.png`;
    await page.screenshot({ path: fn, fullPage: true });
    log(`Screenshot saved: ${fn} (${name})`);
    return fn;
  };

  // ─── 1. HOME PAGE ────────────────────────────────────────────────────────────
  log('=== HOME PAGE ===');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  let f1 = await shot('home');
  const homeTitle = await page.title();
  log('Home title:', homeTitle);
  const homeH1 = await page.evaluate(() => document.body.innerText.substring(0, 400));
  log('Home body text snippet:', homeH1.substring(0, 200));
  if (!homeH1 || homeH1.trim().length < 10) flag('CRITICAL', '/', 'Home page blank or no content', f1, 'Check React hydration');

  // ─── 2. OFFICER DASHBOARD ────────────────────────────────────────────────────
  log('=== OFFICER DASHBOARD ===');
  await page.goto(`${BASE}/officer`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  let f2 = await shot('officer-dashboard');
  const dashText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  log('Dashboard text:', dashText.substring(0, 500));

  // Check for hardcoded compliance 98%
  if (dashText.includes('98%')) flag('MAJOR', '/officer', '"Comply: 98%" is hardcoded in Dashboard.tsx (line 217) — not computed from real assessments', f2, 'Compute compliance from actual rule-check results');
  // Check for DEMO_TICKER fallback
  if (dashText.includes('Saeed Al-Mansoori') && !dashText.includes('Processing Time')) {
    // ticker might be real data
  }

  // Check for sparkline seeds
  // SPARK_APPROVE and SPARK_COMP are hardcoded seeds
  flag('MAJOR', '/officer', 'Dashboard "Approval Rate" and "Compliance Score" sparklines use hardcoded seed arrays (SPARK_APPROVE, SPARK_COMP) — not live data', f2, 'Replace seed arrays with data derived from actual assessments');
  flag('MAJOR', '/officer', 'DEMO_TICKER is hardcoded with 10 fictitious names/decisions; only replaced if assessed.length >= 4', f2, 'Set threshold to 1 or always show real data when any assessment exists');

  // Check total cases count
  const casesMatch = dashText.match(/(\d+)\s*CASES/);
  log('Cases count:', casesMatch ? casesMatch[1] : 'not found');

  // ─── 3. OFFICER APPLICATIONS ─────────────────────────────────────────────────
  log('=== OFFICER APPLICATIONS ===');
  await page.goto(`${BASE}/officer/applications`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  let f3 = await shot('officer-applications');
  const appText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  log('Applications text:', appText.substring(0, 600));

  // Count Assess buttons
  const assessBtns = await page.$$eval('button', btns => btns.filter(b => b.textContent.includes('Assess') || b.textContent.includes('assess')).map(b => b.textContent.trim()));
  log('Assess buttons:', assessBtns.length, assessBtns.slice(0,3));
  if (assessBtns.length === 0) flag('CRITICAL', '/officer/applications', 'No Assess buttons found on applications page', f3, 'Check ApplicationCard component renders buttons');

  // ─── 4. CLICK ASSESS on 3 applications (deterministic endpoint) ──────────────
  log('=== ASSESSING 3 APPLICATIONS ===');
  // Get application IDs from API
  let appIds = [];
  try {
    const appsResp = await page.evaluate(async () => {
      const r = await fetch('/api/applications');
      return r.json();
    });
    appIds = appsResp.slice(0, 5).map(a => a.application_id);
    log('App IDs:', appIds);
  } catch (e) {
    log('Failed to fetch apps:', e.message);
    flag('CRITICAL', '/api/applications', 'Cannot fetch applications list', null, 'Check server is running');
  }

  const assessResults = [];
  for (const id of appIds.slice(0, 3)) {
    try {
      const res = await page.evaluate(async (appId) => {
        const r = await fetch(`/api/assess/${appId}`, { method: 'POST' });
        return { status: r.status, data: await r.json() };
      }, id);
      log(`Assess ${id}: status=${res.status}, recommendation=${res.data?.data?.recommendation}`);
      assessResults.push({ id, recommendation: res.data?.data?.recommendation, plan: res.data?.data?.proposed_plan });
    } catch (e) {
      log(`Assess ${id} failed:`, e.message);
      flag('CRITICAL', `/api/assess/${id}`, `Assessment endpoint error: ${e.message}`, null, 'Check assessment service');
    }
  }

  // Check if decisions differ
  const uniqueDecisions = [...new Set(assessResults.map(r => r.recommendation))];
  log('Unique decisions across 3 apps:', uniqueDecisions);
  if (uniqueDecisions.length === 1) flag('MAJOR', '/api/assess', 'All 3 assessed applications return the same decision — engine may not be differentiating cases', null, 'Verify mock data has diverse profiles');

  // ─── 5. OFFICER PIPELINE ─────────────────────────────────────────────────────
  log('=== OFFICER PIPELINE ===');
  await page.goto(`${BASE}/officer/pipeline`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  let f4 = await shot('officer-pipeline');
  const pipelineText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  log('Pipeline text:', pipelineText.substring(0, 800));
  if (pipelineText.toLowerCase().includes('lorem ipsum')) flag('CRITICAL', '/officer/pipeline', 'Lorem ipsum placeholder text found', f4, 'Replace with real content');

  // Check for static blob vs live trace
  const hasStepwiseTrace = pipelineText.includes('Tool:') || pipelineText.includes('PASSED') || pipelineText.includes('PROCESSING') || pipelineText.includes('step_name') || pipelineText.includes('Compliance Engine') || pipelineText.includes('UAE PASS') || pipelineText.includes('NLP Reasoning');
  log('Has stepwise trace indicators:', hasStepwiseTrace);

  // ─── 6. OFFICER GOVERNANCE ───────────────────────────────────────────────────
  log('=== OFFICER GOVERNANCE ===');
  await page.goto(`${BASE}/officer/governance`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  let f5 = await shot('officer-governance');
  const govText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  log('Governance text:', govText.substring(0, 600));
  if (govText.toLowerCase().includes('lorem ipsum')) flag('CRITICAL', '/officer/governance', 'Lorem ipsum placeholder text found', f5, 'Replace with real content');

  // ─── 7. CITIZEN PORTAL — UAE PASS LOGIN ──────────────────────────────────────
  log('=== CITIZEN PORTAL ===');
  await page.goto(`${BASE}/citizen`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  let f6 = await shot('citizen-login');
  const citizenText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  log('Citizen text:', citizenText.substring(0, 400));

  // Try to find Emirates ID input
  const emiratesInput = await page.$('input[type="text"], input[placeholder*="784"], input[placeholder*="Emira"], input[name*="emirates"], input[name*="id"]');
  log('Emirates ID input found:', !!emiratesInput);

  if (emiratesInput) {
    // Test valid Emirates ID
    await emiratesInput.fill('784-1985-4521458-1');
    const loginBtn = await page.$('button[type="submit"], button');
    if (loginBtn) {
      const btnText = await loginBtn.textContent();
      log('Login button text:', btnText);
      await loginBtn.click();
      await page.waitForTimeout(1500);
      let f7 = await shot('citizen-after-login');
      const afterLoginText = await page.evaluate(() => document.body.innerText.substring(0, 600));
      log('After login text:', afterLoginText.substring(0, 300));

      // Check for OTP screen
      const otpInput = await page.$('input[type="number"], input[maxlength="4"], input[placeholder*="OTP"], input[placeholder*="otp"], input[placeholder*="code"]');
      log('OTP input found:', !!otpInput);

      if (otpInput) {
        await otpInput.fill('1234');
        const otpBtn = await page.$('button');
        if (otpBtn) {
          await otpBtn.click();
          await page.waitForTimeout(1500);
          let f8 = await shot('citizen-otp-submitted');
          const otpAfterText = await page.evaluate(() => document.body.innerText.substring(0, 600));
          log('After OTP text:', otpAfterText.substring(0, 300));
        }
      }
    }
  } else {
    flag('MAJOR', '/citizen', 'Emirates ID input not found — login step may be missing or uses different selector', f6, 'Verify UAEPassLogin component renders input correctly');
  }

  // Navigate to upload state directly by checking CitizenPortal component
  // Try going through full flow
  await page.goto(`${BASE}/citizen`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // Find all inputs
  const allInputs = await page.$$eval('input', inputs => inputs.map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name, id: i.id })));
  log('All inputs on citizen page:', JSON.stringify(allInputs));

  const allBtns = await page.$$eval('button', btns => btns.map(b => b.textContent.trim().substring(0,40)));
  log('All buttons on citizen page:', allBtns);

  // ─── 8. CHECK SAMPLE DOC ENDPOINT ────────────────────────────────────────────
  log('=== SAMPLE DOC ENDPOINT ===');
  const bankStmtResp = await page.evaluate(async () => {
    try {
      const r = await fetch('/sample-docs/bank_statement_mansoori.html');
      return { status: r.status, ok: r.ok, text: (await r.text()).substring(0, 200) };
    } catch (e) {
      return { status: 0, ok: false, error: e.message };
    }
  });
  log('Bank statement response:', bankStmtResp);
  if (!bankStmtResp.ok) {
    flag('MAJOR', '/sample-docs/bank_statement_mansoori.html', `Returns ${bankStmtResp.status} — sample bank statement not served`, null, 'Add static file serving for /public/sample-docs/ or copy to dist');
  }

  // ─── 9. CHECK /officer ASSESS BUTTON IN UI ───────────────────────────────────
  log('=== ASSESS VIA UI ===');
  await page.goto(`${BASE}/officer/applications`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Click first Assess button
  const firstAssessBtn = await page.$('button');
  const allAssessBtns = await page.$$eval('button', btns =>
    btns.map((b, i) => ({ idx: i, text: b.textContent.trim().substring(0,50), disabled: b.disabled }))
  );
  log('All buttons on applications page:', JSON.stringify(allAssessBtns.slice(0,10)));

  // Try clicking an Assess button
  for (const btn of allAssessBtns) {
    if (btn.text.toLowerCase().includes('assess') && !btn.disabled) {
      const btns2 = await page.$$('button');
      if (btns2[btn.idx]) {
        await btns2[btn.idx].click();
        await page.waitForTimeout(3000);
        let f9 = await shot('after-assess-click');
        const postAssessText = await page.evaluate(() => document.body.innerText.substring(0, 600));
        log('Post-assess text:', postAssessText.substring(0, 300));
        break;
      }
    }
  }

  // ─── 10. API AGENT-ASSESS — check distinct decisions ────────────────────────
  log('=== AGENT-ASSESS API CHECK ===');
  const agentResults = [];
  for (const id of appIds.slice(0, 3)) {
    try {
      const res = await page.evaluate(async (appId) => {
        const r = await fetch(`/api/agent-assess/${appId}`, { method: 'POST' });
        const json = await r.json();
        return { status: r.status, recommendation: json?.data?.recommendation, historical_insight: json?.data?.historical_insight, trace_len: json?.data?.trace?.length };
      }, id);
      log(`AgentAssess ${id}: rec=${res.recommendation}, hist_insight=${!!res.historical_insight}, trace_len=${res.trace_len}`);
      agentResults.push(res);
    } catch (e) {
      log(`AgentAssess ${id} failed:`, e.message);
    }
  }

  const hasHistoricalInsight = agentResults.some(r => r.historical_insight);
  log('historical_insight present in any result:', hasHistoricalInsight);
  if (!hasHistoricalInsight) flag('MAJOR', '/api/agent-assess', 'historical_insight absent from assessment results — historical Excel data may not be loaded or file missing', null, 'Ensure RescheduleArrears.xlsx exists in project root');

  const agentUniqueDecisions = [...new Set(agentResults.map(r => r.recommendation))];
  log('Agent-assess unique decisions:', agentUniqueDecisions);
  if (agentUniqueDecisions.length === 1 && agentResults.length >= 2) flag('MAJOR', '/api/agent-assess', `All agent assessments return same decision (${agentUniqueDecisions[0]}) — applications may have identical profiles`, null, 'Ensure mock data includes rejectable/referable cases');

  // ─── 11. CITIZEN FULL JOURNEY with screenshots ───────────────────────────────
  log('=== CITIZEN FULL JOURNEY ===');
  await page.goto(`${BASE}/citizen`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  // Walk through the citizen flow more carefully
  const citizenFullText = await page.evaluate(() => document.body.innerText);
  log('Full citizen page text length:', citizenFullText.length);
  log('Full citizen text:', citizenFullText.substring(0, 800));

  let f10 = await shot('citizen-full');

  // Try to find and interact with UAE PASS login
  const inputEls = await page.$$('input');
  log('Total input elements on citizen page:', inputEls.length);

  for (let i = 0; i < inputEls.length; i++) {
    const info = await inputEls[i].evaluate(el => ({
      type: el.type, placeholder: el.placeholder, name: el.name,
      value: el.value, visible: el.offsetParent !== null
    }));
    log(`Input ${i}:`, JSON.stringify(info));
  }

  // ─── 12. INVALID EMIRATES ID ─────────────────────────────────────────────────
  log('=== INVALID EMIRATES ID TEST ===');
  // Already on /citizen — look for text input
  const textInputs = await page.$$('input[type="text"], input:not([type])');
  log('Text inputs:', textInputs.length);
  if (textInputs.length > 0) {
    await textInputs[0].fill('000-0000-0000000-0');
    const submitBtns = await page.$$eval('button[type="submit"], button', btns =>
      btns.filter(b => !b.disabled).map((b, i) => ({ i, text: b.textContent.trim() }))
    );
    log('Submit buttons:', submitBtns);
    if (submitBtns.length > 0) {
      const btns2 = await page.$$('button');
      if (btns2[submitBtns[0].i]) {
        await btns2[submitBtns[0].i].click();
        await page.waitForTimeout(1500);
        let f11 = await shot('citizen-invalid-id');
        const invalidText = await page.evaluate(() => document.body.innerText.substring(0, 400));
        log('Invalid ID response:', invalidText.substring(0, 200));
        if (!invalidText.toLowerCase().includes('not found') && !invalidText.toLowerCase().includes('invalid') && !invalidText.toLowerCase().includes('error') && !invalidText.toLowerCase().includes('غير')) {
          flag('MAJOR', '/citizen', 'Entering non-existent Emirates ID does not show clear error message', f11, 'Show "Emirates ID not found" error in UAEPassLogin component');
        }
      }
    }
  }

  // ─── 13. OFFICER DASHBOARD — check if stats update after assessment ───────────
  log('=== DASHBOARD AFTER ASSESSMENT ===');
  // Navigate to officer, check current stats, run an assessment, check again
  await page.goto(`${BASE}/officer`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  const beforeDashText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  log('Dashboard before assess:', beforeDashText.substring(0, 300));

  // Run assessment via API
  if (appIds.length > 0) {
    await page.evaluate(async (id) => fetch(`/api/assess/${id}`, { method: 'POST' }), appIds[0]);
    await page.waitForTimeout(500);
    // The dashboard only updates if React state updates — API call alone won't change UI
    const afterDashText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    if (beforeDashText === afterDashText) {
      flag('MAJOR', '/officer', 'Dashboard stats do not update when assessments are run via API — React state not refreshed automatically', null, 'Poll /api/applications or use WebSocket/EventSource to push updates');
    }
  }

  let f12 = await shot('officer-dashboard-final');

  // ─── 14. 404 ROUTE ───────────────────────────────────────────────────────────
  log('=== 404 ROUTE ===');
  await page.goto(`${BASE}/nonexistent-route`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  const notFoundText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  log('404 route redirects to:', page.url(), notFoundText.substring(0, 100));

  // ─── 15. FINAL CONSOLE ERRORS ────────────────────────────────────────────────
  log('=== CONSOLE ERRORS ===');
  log('Console errors collected:', consoleErrors.length);
  consoleErrors.forEach(e => log('  Console error:', e.substring(0, 200)));
  pageErrors.forEach(e => log('  Page error:', e.substring(0, 200)));

  if (consoleErrors.length > 0) {
    flag('MAJOR', 'browser', `${consoleErrors.length} browser console errors: ${consoleErrors.slice(0,3).join(' | ').substring(0, 200)}`, null, 'Fix React/TS errors before demo');
  }
  if (pageErrors.length > 0) {
    flag('CRITICAL', 'browser', `${pageErrors.length} uncaught page errors: ${pageErrors.slice(0,2).join(' | ').substring(0, 200)}`, null, 'Fix uncaught exceptions');
  }

  // ─── 16. Examine all numbers on each officer page ────────────────────────────
  log('=== NUMBER AUDIT ON ALL OFFICER PAGES ===');
  for (const [label, url] of [['dashboard', '/officer'], ['applications', '/officer/applications'], ['pipeline', '/officer/pipeline'], ['governance', '/officer/governance']]) {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    const txt = await page.evaluate(() => document.body.innerText);
    const numbers = txt.match(/[\d,]+(?:\.\d+)?%?/g) || [];
    log(`${label} numbers:`, numbers.slice(0, 30).join(', '));
  }

  await browser.close();

  // ─── OUTPUT REPORT ────────────────────────────────────────────────────────────
  log('');
  log('=== FINAL ISSUE LIST ===');
  const crits = issues.filter(i => i.severity === 'CRITICAL');
  const majors = issues.filter(i => i.severity === 'MAJOR');
  const minors = issues.filter(i => i.severity === 'MINOR');
  log(`CRITICAL: ${crits.length}, MAJOR: ${majors.length}, MINOR: ${minors.length}`);

  const report = {
    summary: { critical: crits.length, major: majors.length, minor: minors.length },
    critical: crits,
    major: majors,
    minor: minors,
    console_errors: consoleErrors,
    page_errors: pageErrors,
    assess_results: assessResults,
    agent_results: agentResults,
  };

  writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
  log('Report saved to audit_report.json');

  // Print all issues
  for (const issue of issues) {
    console.log(`\n[${issue.severity}] ${issue.url}`);
    console.log(`  WHAT: ${issue.what}`);
    if (issue.screenshot) console.log(`  SCREENSHOT: ${issue.screenshot}`);
    console.log(`  FIX: ${issue.fix}`);
  }

  return report;
}

run().catch(e => { console.error('Audit runner failed:', e); process.exit(1); });
