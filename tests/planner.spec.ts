import { expect, test } from '@playwright/test';

test('selects and clears route stops', async ({ page }) => {
  await page.goto('/planner/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your Padova stops.');

  await page.getByText('Choose points of interest').click();
  const places = page.getByRole('checkbox');
  await expect(places).toHaveCount(14);

  const calculateButton = page.getByRole('button', { name: 'Calculate my route' });
  await expect(calculateButton).toBeDisabled();

  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  await expect(page.getByText('14 selected')).toBeVisible();
  await expect(calculateButton).toBeEnabled();

  await page.getByRole('button', { name: 'Deselect all' }).click();
  await expect(page.getByText('0 selected')).toBeVisible();
  await expect(calculateButton).toBeDisabled();

  await places.nth(0).check();
  await places.nth(1).check();
  await page.getByText('Choose points of interest').click();
  await calculateButton.click();

  await expect(page.getByText('2 stops selected. Your selection is ready for route calculation.')).toBeVisible();
});
