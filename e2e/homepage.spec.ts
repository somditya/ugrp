import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders the welcome heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/UGRP/);
    await expect(page.locator('h1')).toContainText('Welcome to UGRP');
  });

  test('has a link to posts page', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a', { hasText: 'View Posts' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/.*posts/);
    await expect(page.locator('h1')).toContainText('Posts');
  });

  test('has a link to API health', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a', { hasText: 'API Health' });
    await expect(link).toBeVisible();
  });
});
