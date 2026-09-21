import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateRoute } from './openRouteService';

const points = [
  { id: 'start', title: 'Start', longitude: 11.87, latitude: 45.4 },
  { id: 'far', title: 'Far', longitude: 11.89, latitude: 45.42 },
  { id: 'near', title: 'Near', longitude: 11.88, latitude: 45.41 },
];

afterEach(() => vi.unstubAllGlobals());

describe('calculateRoute', () => {
  it('optimizes the stop order and requests walking geometry in that order', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          distances: [
            [0, 8, 1],
            [8, 0, 1],
            [1, 1, 0],
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          features: [
            {
              geometry: {
                type: 'LineString',
                coordinates: [
                  [11.87, 45.4],
                  [11.88, 45.41],
                  [11.89, 45.42],
                ],
              },
              properties: { summary: { distance: 2_500, duration: 1_800 } },
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const route = await calculateRoute(points, 'walking', 'test-key');

    expect(route.orderedPoints.map((point) => point.id)).toEqual(['start', 'near', 'far']);
    expect(route.totalDistanceMeters).toBe(2_500);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/matrix/foot-walking');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/directions/foot-walking/geojson');

    const directionsRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(directionsRequest.coordinates).toEqual([
      [11.87, 45.4],
      [11.88, 45.41],
      [11.89, 45.42],
    ]);
  });
});
