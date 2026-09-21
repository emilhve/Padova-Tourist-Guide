import { expect, test } from '@playwright/test';

test('selects and clears route stops', async ({ page }) => {
  await page.route('**/api/route', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'walking',
        orderedStops: [
          {
            id: 'prato-della-valle',
            title: 'Prato della Valle',
            longitude: 11.87658,
            latitude: 45.39847,
          },
          {
            id: 'abbazia-di-santa-giustina',
            title: 'Abbazia di Santa Giustina',
            longitude: 11.879722,
            latitude: 45.396389,
          },
        ],
        geometry: {
          type: 'LineString',
          coordinates: [
            [11.87658, 45.39847],
            [11.879722, 45.396389],
          ],
        },
        totalDistanceMeters: 1200,
        totalDurationSeconds: 900,
      }),
    });
  });

  await page.goto('/planner/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Velg stoppene dine i Padova.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'no');

  await page.locator('.poi-dropdown summary').click();
  const places = page.getByRole('checkbox');
  await expect(places).toHaveCount(14);

  const calculateButton = page.getByRole('button', { name: 'Beregn ruten min' });
  const startSelect = page.getByLabel('Startsted');
  await expect(calculateButton).toBeDisabled();
  await expect(startSelect).toBeDisabled();

  await page.getByRole('button', { name: 'Velg alle', exact: true }).click();
  await expect(page.getByText('14 valgt')).toBeVisible();
  await expect(startSelect).toBeEnabled();
  await expect(startSelect.locator('option')).toHaveCount(15);
  await expect(calculateButton).toBeDisabled();

  await startSelect.selectOption('prato-della-valle');
  await expect(calculateButton).toBeEnabled();

  await page.getByRole('button', { name: 'Fjern alle valg' }).click();
  await expect(page.getByText('0 valgt')).toBeVisible();
  await expect(startSelect).toBeDisabled();
  await expect(startSelect).toHaveValue('');
  await expect(calculateButton).toBeDisabled();

  await places.nth(0).check();
  await places.nth(1).check();
  await page.locator('.poi-dropdown summary').click();
  await startSelect.selectOption('prato-della-valle');
  await expect(calculateButton).toBeEnabled();

  const routeRequest = page.waitForRequest('**/api/route');
  await calculateButton.click();
  const request = await routeRequest;

  expect(request.postDataJSON()).toEqual({
    placeIds: ['prato-della-valle', 'abbazia-di-santa-giustina'],
    startPlaceId: 'prato-della-valle',
    mode: 'walking',
  });

  await expect(page.getByText('Ruten er beregnet.')).toBeVisible();
  await expect(page.getByText('1.2 km')).toBeVisible();
  await expect(page.getByText('15 min')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Din reiserute' })).toBeVisible();
});
