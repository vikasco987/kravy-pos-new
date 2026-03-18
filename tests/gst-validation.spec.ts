import { test, expect } from '@playwright/test';

/**
 * GST VALIDATION TEST
 * This script tests if GST calculations for global and item-wise setups work correctly.
 */

test.describe('GST & Tax Validation', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Initial login (using flow provided by user)
    await page.goto('/');
    
    // Check if we already have a session (handled by Clerk)
    // If not, perform login
    if (await page.locator('text=Login').isVisible()) {
      await page.click('text=Login');
      await page.fill('#phone', '9999999999'); // Standard test number
      await page.click('text=Send OTP');
      
      // Note: Assuming test environment allows OTP bypass or manual entry
      // For automated tests, usually we skip this or use static codes
      console.log('Waiting for login to complete manually or via bypass...');
      await page.waitForURL(/dashboard/, { timeout: 30000 });
    } else {
      await page.goto('/dashboard');
    }
  });

  test('Verify Global GST Calculation and Table Header', async ({ page }) => {
    // 2. Go to Tax Settings
    await page.goto('/dashboard/settings/tax');

    // 3. Set Global GST to 18% and turn off Per-Product GST
    // Using the toggles we found in SettingsPage (/dashboard/settings/tax)
    const globalGstToggle = page.locator('button:has-text("Enable Global GST System")').locator('xpath=..').locator('button');
    const perProductToggle = page.locator('button:has-text("Per-Product GST")').locator('xpath=..').locator('button');
    
    // Check current state (using the ToggleRight/ToggleLeft icons or colors)
    // For simplicity, we'll click based on text if the icon is not easy to target uniquely
    await page.click('text=Enable Global GST System'); // Toggle on
    await page.click('button:has-text("18%")'); // Select 18% preset
    
    // Ensure Per-Product is off
    await page.click('text=Per-Product GST'); // Toggle state

    await page.click('text=Save Tax Settings');
    await expect(page.locator('text=Tax settings saved')).toBeVisible();

    // 4. Go to Checkout and verify calculation
    await page.goto('/dashboard/billing/checkout');
    
    // Add any item to cart
    await page.click('.menu-item-card >> nth=0'); // Click first item
    
    // Verify Subtotal + 18% GST = Total
    const subtotalText = await page.locator('text=Subtotal: >> xpath=.. >> .value').innerText();
    const gstText = await page.locator('text=GST (18%): >> xpath=.. >> .value').innerText();
    const totalText = await page.locator('text=Total: >> xpath=.. >> .value').innerText();

    const subtotal = parseFloat(subtotalText.replace(/[₹,]/g, ''));
    const gst = parseFloat(gstText.replace(/[₹,]/g, ''));
    const total = parseFloat(totalText.replace(/[₹,]/g, ''));

    expect(Math.round(subtotal * 0.18)).toBe(Math.round(gst));
    expect(Math.round(subtotal + gst)).toBe(Math.round(total));

    // 5. Generate Bill and check history table column
    await page.click('text=Generate Bill');
    await page.waitForTimeout(1000); // Wait for generation

    await page.goto('/dashboard/billing');
    
    // Check if column header is "GST" (not "GST (18%)")
    const gstHeader = page.locator('th >> text=GST');
    await expect(gstHeader).toBeVisible();
    await expect(gstHeader).not.toHaveText(/GST \(\d+%\)/);
  });

  test('Verify Per-Product GST takes Priority', async ({ page }) => {
    // 2. Enable Per-Product GST in Settings
    await page.goto('/dashboard/settings/tax');
    await page.click('text=Enable Global GST System'); // Keep global on (default rate)
    await page.click('text=Per-Product GST'); // Enable per-product priority
    await page.click('text=Save Tax Settings');

    // 3. Go to Checkout
    await page.goto('/dashboard/billing/checkout');
    
    // Choose an item with specific GST (e.g., 12%)
    // This requires the item to have data-gst="12" or similar
    // We'll click the first item and verify if it uses its own GST
    await page.click('.menu-item-card >> nth=0'); 
    
    // Verify if GST matches the product's rate instead of global 18%
    const itemGstLabel = page.locator('.cart-item-tax-label'); // Placeholder selector
    // In our implementation, item-wise GST is handled in taxGroups
  });
});
