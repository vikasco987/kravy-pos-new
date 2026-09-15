const { chromium } = require('playwright');
const fs = require('fs');

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWNmNWRlMTM2NWFhY2VhYTU4ZTI1ZDMiLCJpYXQiOjE3ODkzNjQyNjYsImV4cCI6MTc4OTQ1MDY2Nn0.eny_dTwa7yB6EBpRZOZDaSQTiOYSZ12uvN7j6FcTxfY";

async function runBenchmark(scenarioName) {
  console.log(`=== STRICT BENCHMARK: ${scenarioName} ===`);

  for (let iteration = 1; iteration <= 3; iteration++) {
    console.log(`Running iteration ${iteration}...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addCookies([{ name: 'kravy_auth_token', value: VALID_TOKEN, url: 'http://localhost:3001' }]);

    const page = await context.newPage();
    page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
    await page.on('pageerror', err => console.error('PAGE ERROR:', err));
    page.on('request', request => console.log('>>', request.method(), request.url()));
await page.on('console', msg => {
  if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text());
  else console.log('CONSOLE:', msg.text());
});
    
    // Mock APIs
    await page.route('**/api/**', async route => { 
      // Log any unmocked API requests that fall through
      const req = route.request();
      route.on('response', response => {
        if (response && response.status() === 401) {
          console.log(`[AUTH-DEBUG] 401 ${req.method()} ${req.url()}`);
        }
      });
      await route.continue();
    });
    
    // Auth bypass mocks
    await page.route('**/api/auth/refresh-token*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: { success: true, token: "mock-token" } });
    });
    await page.route('**/api/staff/refresh-token*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: { success: true, token: "mock-token" } });
    });
    await page.route('**/api/auth/logout*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: { success: true } });
    });

    await page.route('**/api/notifications*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: { orders: [] } });
    });
    await page.route('**/api/orders*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: [] });
    });
    await page.route('**/api/profiles*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: { profiles: [], enableMultipleProfiles: false } });
    });
    await page.route('**/api/tables*', route => {
      console.log(`[MOCK] ${route.request().method()} ${route.request().url()} -> 200`);
      route.fulfill({ status: 200, json: [] });
    });

    await page.route('**/api/user/me*', route => route.fulfill({ status: 200, json: { id: "69cf5de1365aaceaa58e25d3", role: "admin", allowedPaths: ["/dashboard/menu/view"] } }));
    await page.route('**/api/categories*', route => route.fulfill({ status: 200, json: [{ id: "cat-1", name: "Category 1" }] }));
    await page.route('**/api/profile/zones*', route => route.fulfill({ status: 200, json: [] }));
    await page.route('**/api/profile*', route => route.fulfill({ status: 200, json: { businessName: "Test POS" } }));
    await page.route('**/api/menu-editor/addon-groups*', route => route.fulfill({ status: 200, json: [] }));
    
    await page.route('**/api/menu/view*', route => {
      console.log("[MOCK] Intercepted /api/menu/view");
      const url = new URL(route.request().url());
      const items = [];
      for (let i = 0; i < 1000; i++) {
        items.push({
          id: `item-${i}`,
          name: i === 0 ? "Manage your products" : (i < 10 ? `PIZZA ${i}` : (i < 200 ? `PIZZ ${i}` : (i < 400 ? `PIZ ${i}` : (i < 600 ? `PI ${i}` : (i < 800 ? `P ${i}` : `Burger ${i}`))))),
          description: "Test description",
          price: 10,
          type: "veg",
          status: true,
          categoryId: "cat-1"
        });
      }
      route.fulfill({ status: 200, json: items });
    });

    console.log("Navigating to page...");
    try {
      await page.goto('http://localhost:3001/dashboard/menu/view', { waitUntil: 'domcontentloaded' });
    } catch(e) {
      console.error(`Iteration ${iteration} failed:`, e.message);
      await browser.close();
      continue;
    }

    console.log("Waiting for list to render...");
    try {
      await page.waitForFunction(() => {
        const cards = Array.from(document.querySelectorAll('h4'));
        return cards.some(card => {
          const style = getComputedStyle(card);
          const rect = card.getBoundingClientRect();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0
          );
        });
      }, { timeout: 15000 });
    } catch (e) {
      console.error("Failed to render initial state.");
      console.log(await page.content());
      await browser.close();
      continue;
    }

    // Inject measurement script for input responsiveness
    await page.evaluate(() => {
      window.inputLatencyLogs = [];
      document.addEventListener('input', (e) => {
        if (e.target.placeholder && e.target.placeholder.includes('Search')) {
          const char = e.target.value;
          const start = performance.now();
          requestAnimationFrame(() => {
            const end = performance.now();
            window.inputLatencyLogs.push({ val: char, latency: end - start });
          });
        }
      }, true);
    });

    console.log("Page is ready. Testing typing responsiveness...");
    
    // Type PIZZA 0 slowly
    const term = "PIZZA 1"; // guaranteed existing item
    let currentStr = "";
    let finalResultLatency = 0;

    for (let i = 0; i < term.length; i++) {
      currentStr += term[i];
      
      const isLast = (i === term.length - 1);
      
      let prevCount = 0;
      let tStart = 0;
      if (isLast) {
        prevCount = await page.evaluate(() => document.querySelectorAll('h4').length);
        console.log(`Before result count: ${prevCount}`);
        tStart = Date.now();
      }

      await page.fill('input[placeholder="Search menu items..."]', currentStr);
      
      if (!isLast) {
        // Wait 100ms between keystrokes to simulate realistic typing
        await page.waitForTimeout(100);
      } else {
        // Wait for the filtered results to contain the expected term and have a visible card
        await page.waitForFunction(
          ({ pc, query }) => {
            const cards = Array.from(document.querySelectorAll('h4'));
            return (
              cards.length !== pc &&
              cards.some(c => c.textContent.trim().toLowerCase().includes(query.toLowerCase()))
            );
          },
          { pc: prevCount, query: currentStr },
          { timeout: 60000 }
        );

        // After condition met, capture after count and matching card text
        const afterCount = await page.evaluate(() => document.querySelectorAll('h4').length);
        const matchingText = await page.evaluate((q) => {
          const card = Array.from(document.querySelectorAll('h4')).find(c => c.textContent.includes(q));
          return card ? card.textContent.trim() : null;
        }, currentStr);
        console.log(`After result count: ${afterCount}`);
        console.log(`Matching card text: ${matchingText}`);

        const tEnd = Date.now();
        finalResultLatency = tEnd - tStart;
      }
    }

    // Wait 500ms to allow rAF callbacks to fire
    await page.waitForTimeout(500);

    const logs = await page.evaluate(() => window.inputLatencyLogs);
    const domCount = await page.evaluate(() => document.querySelectorAll('*').length);
    const visibleCards = await page.evaluate(() => document.querySelectorAll('h5[title]').length);
    
    console.log(`Iteration ${iteration} Results:`);
    console.log(`  - P Latency: ${logs.find(l => l.val === 'P')?.latency.toFixed(2)} ms`);
    console.log(`  - PIZZA 1 Latency: ${logs.find(l => l.val === 'PIZZA 1')?.latency.toFixed(2)} ms`);
    
    let totalR = 0, minR = Infinity, maxR = 0;
    logs.forEach(l => {
      totalR += l.latency;
      if (l.latency < minR) minR = l.latency;
      if (l.latency > maxR) maxR = l.latency;
    });
    
    console.log(`  - Avg Responsiveness: ${(totalR / logs.length).toFixed(2)} ms (Min: ${minR.toFixed(2)}, Max: ${maxR.toFixed(2)})`);
    console.log(`  - Final Search Latency (incl debounce): ${finalResultLatency} ms`);
    console.log(`  - DOM Nodes: ${domCount} (Visible Cards: ${visibleCards})`);

    const configPrefix = scenarioName.split('-')[0];
    const nameMap = { A: "Baseline", B: "Debounce", C: "MotionFix", D: "Both" };
    if (nameMap[configPrefix]) {
      const fileName = `${nameMap[configPrefix]}_results.json`;
      let results = [];
      if (fs.existsSync(fileName)) {
        results = JSON.parse(fs.readFileSync(fileName, 'utf8'));
      }
      let filterLatencies = {};
      logs.forEach(l => {
        filterLatencies[l.val] = {
          filterLatency: l.val === 'PIZZA 1' ? finalResultLatency : l.latency,
          rafLatency: 0
        };
      });
      results.push({
        metrics: { domNodes: domCount, visibleCards: visibleCards },
        latencies: filterLatencies
      });
      fs.writeFileSync(fileName, JSON.stringify(results, null, 2));
    }

    await browser.close();
  }
  console.log("=== DONE ===\n");
}

const scenario = process.argv[2] || "Baseline";
runBenchmark(scenario);
