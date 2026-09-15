const { chromium } = require('playwright');

async function runBenchmark() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'kravy_auth_token', value: 'dummy', url: 'http://localhost:3000' }]);

  const page = await context.newPage();
  
  page.on('response', response => {
    if (response.status() === 500) {
      console.log(`[500 ERROR] URL: ${response.url()}`);
    }
  });

  await page.route('**/api/user/me', route => route.fulfill({ status: 200, body: JSON.stringify({ role: 'USER' }) }));
  await page.route('**/api/profile', route => route.fulfill({ status: 200, body: JSON.stringify({}) }));
  await page.route('**/api/profile/zones', route => route.fulfill({ status: 200, body: JSON.stringify({ zones: [] }) }));
  await page.route('**/api/categories', route => route.fulfill({ status: 200, body: JSON.stringify([]) }));
  await page.route('**/api/menu-editor/addon-groups', route => route.fulfill({ status: 200, body: JSON.stringify([]) }));
  await page.route('**/api/menu/view*', route => route.fulfill({ status: 200, body: JSON.stringify([]) }));

  await page.goto('http://localhost:3000/dashboard/menu/view');
  await page.waitForTimeout(5000);

  await browser.close();
}

runBenchmark().then(() => console.log("Done."));
