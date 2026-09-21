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

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your Padova stops.');

  await page.getByText('Choose points of interest').click();
  const places = page.getByRole('checkbox');
  await expect(places).toHaveCount(14);

  const calculateButton = page.getByRole('button', { name: 'Calculate my route' });
  const startSelect = page.getByLabel('Starting point');
  await expect(calculateButton).toBeDisabled();
  await expect(startSelect).toBeDisabled();

  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  await expect(page.getByText('14 selected')).toBeVisible();
  await expect(startSelect).toBeEnabled();
  await expect(startSelect.locator('option')).toHaveCount(15);
  await expect(calculateButton).toBeDisabled();

  await startSelect.selectOption('prato-della-valle');
  await expect(calculateButton).toBeEnabled();

  await page.getByRole('button', { name: 'Deselect all' }).click();
  await expect(page.getByText('0 selected')).toBeVisible();
  await expect(startSelect).toBeDisabled();
  await expect(startSelect).toHaveValue('');
  await expect(calculateButton).toBeDisabled();

  await places.nth(0).check();
  await places.nth(1).check();
  await page.getByText('Choose points of interest').click();
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

  await expect(page.getByText('Route calculated successfully.')).toBeVisible();
  await expect(page.getByText('1.2 km')).toBeVisible();
  await expect(page.getByText('15 min')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your itinerary' })).toBeVisible();
});
