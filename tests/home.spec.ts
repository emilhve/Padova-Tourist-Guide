import { expect, test } from '@playwright/test';

test('shows the guide and links to a place', async ({ page }) => {
  const workerResponse = page.waitForResponse(
    (response) => response.url().includes('maplibre-gl-worker') && response.ok(),
  );

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Meet Padova');
  await expect(page.locator('#guide-map canvas')).toBeVisible();
  await workerResponse;
  await page.getByRole('link', { name: /Prato della Valle/ }).first().click();
  await expect(page).toHaveURL(/\/places\/prato-della-valle\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prato della Valle');
});
