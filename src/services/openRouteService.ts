import { findShortestOpenRoute } from '../utils/routeOptimizer';
import type { LineString } from 'geojson';

const ORS_BASE_URL = 'https://api.heigit.org/openrouteservice/v2';

export type TravelMode = 'walking' | 'cycling';

export interface RoutePoint {
  id: string;
  title: string;
  longitude: number;
  latitude: number;
}

export interface CalculatedRoute {
  geometry: LineString;
  orderedPoints: RoutePoint[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}

export class RoutingProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'RoutingProviderError';
  }
}

interface MatrixResponse {
  distances?: Array<Array<number | null>>;
}

interface DirectionsResponse {
  features?: Array<{
    geometry?: LineString;
    properties?: {
      summary?: {
        distance?: number;
        duration?: number;
      };
    };
  }>;
}

const profileFor = (mode: TravelMode) =>
  mode === 'walking' ? 'foot-walking' : 'cycling-regular';

async function requestJson<T>(url: string, apiKey: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json, application/geo+json',
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new RoutingProviderError('Rutetjenesten kunne ikke nås.', 504);
  }

  if (!response.ok) {
    throw new RoutingProviderError(
      response.status === 429
        ? 'Bruksgrensen for rutetjenesten er nådd. Prøv igjen senere.'
        : 'Rutetjenesten kunne ikke beregne denne ruten.',
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new RoutingProviderError('Rutetjenesten returnerte et ugyldig svar.', 502);
  }
}

export async function calculateRoute(
  points: RoutePoint[],
  mode: TravelMode,
  apiKey: string,
): Promise<CalculatedRoute> {
  const profile = profileFor(mode);
  const locations = points.map((point) => [point.longitude, point.latitude]);
  const matrix = await requestJson<MatrixResponse>(
    `${ORS_BASE_URL}/matrix/${profile}`,
    apiKey,
    { locations, metrics: ['distance'], units: 'm' },
  );

  if (!matrix.distances) {
    throw new RoutingProviderError('Rutetjenesten returnerte ingen avstandsmatrise.', 502);
  }

  const order = findShortestOpenRoute(matrix.distances);
  const orderedPoints = order.map((index) => points[index]);
  const orderedCoordinates = orderedPoints.map((point) => [point.longitude, point.latitude]);
  const directions = await requestJson<DirectionsResponse>(
    `${ORS_BASE_URL}/directions/${profile}/geojson`,
    apiKey,
    {
      coordinates: orderedCoordinates,
      instructions: false,
      preference: 'recommended',
    },
  );

  const route = directions.features?.[0];
  const summary = route?.properties?.summary;

  if (
    route?.geometry?.type !== 'LineString' ||
    typeof summary?.distance !== 'number' ||
    typeof summary.duration !== 'number'
  ) {
    throw new RoutingProviderError('Rutetjenesten returnerte en ufullstendig rute.', 502);
  }

  return {
    geometry: route.geometry,
    orderedPoints,
    totalDistanceMeters: summary.distance,
    totalDurationSeconds: summary.duration,
  };
}
