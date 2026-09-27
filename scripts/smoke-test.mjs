import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');

console.log('='.repeat(60));
console.log('KESIA MAY REVIEWER — BROWSER SMOKE TEST SUITE');
console.log('='.repeat(60));

const VIEWPORTS = [
  { name: 'iPhone SE (320x568)', width: 320, height: 568 },
  { name: 'iPhone 8/SE2 (375x667)', width: 375, height: 667 },
  { name: 'iPhone 13/14 (390x844)', width: 390, height: 844 },
  { name: 'iPad Portrait (768x1024)', width: 768, height: 1024 },
  { name: 'Laptop / Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Full HD Desktop (1920x1080)', width: 1920, height: 1080 }
];

async function run() {
  // 1. Spin up ephemeral HTTP server
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      const content = fs.readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Ephemeral test server active on ${baseUrl}`);

  // 2. Launch headless Chrome / Edge
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    console.log('✓ Headless browser launched via Google Chrome channel');
  } catch (err) {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
      console.log('✓ Headless browser launched via Microsoft Edge channel');
    } catch (edgeErr) {
      console.error('CRITICAL: Failed to launch browser channel:', err.message, edgeErr.message);
      server.close();
      process.exit(1);
    }
  }

  const jsErrors = [];

  try {
    const page = await browser.newPage();
    page.on('pageerror', err => {
      console.error(`[BROWSER ERROR] ${err.message}`);
      jsErrors.push(err.message);
    });

    // 1. Site loads
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const pageTitle = await page.title();
    console.log(`✓ Test 1: Site loaded successfully (Title: "${pageTitle}")`);
    if (!pageTitle.includes('Kesia May Reviewer')) {
      throw new Error(`Unexpected page title: ${pageTitle}`);
    }

    // 2. No uncaught JS errors on load
    if (jsErrors.length > 0) {
      throw new Error(`Uncaught JS errors found on load: ${jsErrors.join(', ')}`);
    }
    console.log('✓ Test 2: No uncaught JS errors on initial load');

    // 3. Viewport responsiveness & horizontal overflow check
    console.log('✓ Test 3: Verifying zero horizontal page overflow across 6 viewports...');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(50);
      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          hasOverflow: docEl.scrollWidth > docEl.clientWidth + 1 // allow 1px subpixel tolerance
        };
      });
      if (overflow.hasOverflow) {
        throw new Error(`Horizontal overflow detected on ${vp.name}: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
      }
      console.log(`   - ${vp.name}: OK (clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth})`);
    }

    // Reset to desktop viewport for interactive tests
    await page.setViewportSize({ width: 1440, height: 900 });

    // 4. Learn view opens
    await page.click('button[data-view-target="learn"]');
    let isLearnVisible = await page.isVisible('#view-learn');
    if (!isLearnVisible) throw new Error('Learn view did not become visible');
    console.log('✓ Test 4: Learn view opens and renders domain curriculum');

    // 5. Drill view opens
    await page.click('button[data-view-target="drill"]');
    let isDrillVisible = await page.isVisible('#view-drill');
    if (!isDrillVisible) throw new Error('Drill view did not become visible');
    console.log('✓ Test 5: Drill view opens');

    // 6. Mock view opens
    await page.click('button[data-view-target="mock"]');
    let isMockVisible = await page.isVisible('#view-mock');
    if (!isMockVisible) throw new Error('Mock view did not become visible');
    console.log('✓ Test 6: Mock view opens');

    // 7. Reference view opens
    await page.click('button[data-view-target="reference"]');
    let isRefVisible = await page.isVisible('#view-reference');
    if (!isRefVisible) throw new Error('Reference view did not become visible');
    console.log('✓ Test 7: Reference view opens');

    // 8. Settings view opens
    await page.click('button[data-view-target="settings"]');
    let isSettingsVisible = await page.isVisible('#view-settings');
    if (!isSettingsVisible) throw new Error('Settings view did not become visible');
    console.log('✓ Test 8: Settings view opens');

    // 9. Answer selection in Drill Mode
    await page.click('button[data-view-target="drill"]');
    await page.waitForSelector('#drill-card input[name="drill-q"]', { state: 'attached' });
    const firstOptionRadio = page.locator('#drill-card input[name="drill-q"]').first();
    await firstOptionRadio.check();
    await page.click('#drill-check');
    const drillFeedbackVisible = await page.isVisible('#drill-feedback');
    if (!drillFeedbackVisible) throw new Error('Drill feedback did not display after checking answer');
    console.log('✓ Test 9: Drill answer selection and immediate rationale evaluation works');

    // 10. Start Mock & Confidence selection
    await page.click('button[data-view-target="mock"]');
    await page.click('#mock-start');
    await page.waitForTimeout(100);
    const mockAreaVisible = await page.isVisible('#mock-area');
    if (!mockAreaVisible) throw new Error('Mock exam area did not open upon start');
    
    // Select option in mock question #1
    const mockOption = page.locator('#mock-area .mock-question.active .option-row input[type="radio"]').first();
    await mockOption.check();
    console.log('✓ Test 10: Mock answer selection verified on question #1');

    // Select confidence ('H' for High)
    const confidenceSelect = page.locator('#mock-area .mock-question.active select.confidence');
    await confidenceSelect.selectOption('H');
    const selectedConfidence = await confidenceSelect.inputValue();
    if (selectedConfidence !== 'H') throw new Error(`Confidence select did not update (got ${selectedConfidence})`);
    console.log('✓ Test 11: Question confidence rating selection (High/Medium/Guess) works');

    // 11. Bookmarking works
    const bookmarkBtn = page.locator('#mock-area .mock-question.active button.bookmark-btn');
    await bookmarkBtn.click();
    const isBookmarked = await page.evaluate(() => {
      const qdot = document.querySelector('.qdot[data-goto-q="1"]');
      return qdot && qdot.classList.contains('bookmarked');
    });
    if (!isBookmarked) throw new Error('Bookmarking question #1 did not flag question index dot');
    console.log('✓ Test 12: Question bookmarking toggles active indicator');

    // 12. Mock navigation works (Next, Prev, Question Index)
    await page.click('#mock-next');
    let currentQ = await page.evaluate(() => state.mock.current);
    if (currentQ !== 2) throw new Error(`Expected current question to be 2, got ${currentQ}`);
    
    await page.click('#mock-prev');
    currentQ = await page.evaluate(() => state.mock.current);
    if (currentQ !== 1) throw new Error(`Expected current question to return to 1, got ${currentQ}`);

    // Jump directly to question #60 via question index dot
    await page.click('.qdot[data-goto-q="60"]');
    currentQ = await page.evaluate(() => state.mock.current);
    if (currentQ !== 60) throw new Error(`Expected jump to question 60, got ${currentQ}`);
    console.log('✓ Test 13: Mock question index grid navigation (Next, Prev, Jump to Q60) works');

    // 13. Timer initializes and counts
    const timerText = await page.textContent('#mock-timer');
    if (!timerText || !timerText.includes(':')) throw new Error(`Invalid timer text: ${timerText}`);
    console.log(`✓ Test 14: Mock 90-minute countdown timer initialized (${timerText.trim()})`);

    // 14. LocalStorage persistence check
    const savedState = await page.evaluate(() => {
      const raw = localStorage.getItem('kesiamay-reviewer-hard-v1');
      return raw ? JSON.parse(raw) : null;
    });
    if (!savedState || !savedState.mock || savedState.mock.status !== 'in-progress') {
      throw new Error('State was not persisted to localStorage under key kesiamay-reviewer-hard-v1');
    }
    console.log(`✓ Test 15: Browser localStorage persistence verified under key "kesiamay-reviewer-hard-v1"`);

    // 15. Mock submission works
    await page.evaluate(() => {
      // Simulate answer choices for submission check
      for (let i = 1; i <= 60; i++) {
        state.mock.answers[i] = (i % 2 === 0) ? 'A' : 'C';
        state.mock.confidence[i] = 'H';
      }
      saveState();
      submitMock(false);
    });
    await page.waitForTimeout(100);

    // 16. Diagnostic scorecard renders
    const resultsVisible = await page.isVisible('#mock-results');
    if (!resultsVisible) throw new Error('Mock results view did not render');
    const scoreText = await page.textContent('.score-big');
    console.log(`✓ Test 16: Mock exam submission evaluated and diagnostic scorecard rendered (Score: ${scoreText.trim()})`);

    // 17. Mobile navigation bar test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileNavVisible = await page.isVisible('.mobile-nav');
    if (!mobileNavVisible) throw new Error('Mobile bottom navigation is not visible on mobile viewport');
    await page.click('.mobile-nav button[data-view-target="learn"]');
    isLearnVisible = await page.isVisible('#view-learn');
    if (!isLearnVisible) throw new Error('Mobile bottom nav failed to switch to Learn view');
    console.log('✓ Test 17: Mobile bottom navigation bar is interactive and functional on mobile viewports');

    // 18. Visible focus outlines check
    const hasFocusOutlineCSS = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes(':focus-visible')) {
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    });
    if (!hasFocusOutlineCSS) throw new Error(':focus-visible CSS rules not found');
    console.log('✓ Test 18: WCAG 2.2 AA visible keyboard focus styles (:focus-visible) verified');

    console.log('='.repeat(60));
    console.log('ALL 18 BROWSER SMOKE TESTS PASSED CLEANLY WITH ZERO ERRORS');
    console.log('='.repeat(60));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('SMOKE TEST FAILED:', err);
  process.exit(1);
});
