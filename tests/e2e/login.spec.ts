import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'wrong');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid|error|échec/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);

    await page.click('button:has-text("Déconnexion"), button:has-text("Logout")');

    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });
  });
});
