import { OPENROUTESERVICE_API_KEY } from 'astro:env/server';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import {
  calculateRoute,
  RoutingProviderError,
  type RoutePoint,
  type TravelMode,
} from '../../services/openRouteService';
import { UnreachableRouteError } from '../../utils/routeOptimizer';

export const prerender = false;

interface RouteRequest {
  placeIds?: unknown;
  startPlaceId?: unknown;
  mode?: unknown;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: RouteRequest;

  try {
    body = (await request.json()) as RouteRequest;
  } catch {
    return json({ error: 'Ruteforespørselen må inneholde gyldig JSON.' }, 400);
  }

  const placeIds = Array.isArray(body.placeIds)
    ? body.placeIds.filter((id): id is string => typeof id === 'string')
    : [];
  const uniquePlaceIds = [...new Set(placeIds)];
  const startPlaceId = typeof body.startPlaceId === 'string' ? body.startPlaceId : '';
  const mode: TravelMode | null =
    body.mode === 'walking' || body.mode === 'cycling' ? body.mode : null;

  if (
    uniquePlaceIds.length !== placeIds.length ||
    uniquePlaceIds.length < 2 ||
    uniquePlaceIds.length > 15
  ) {
    return json({ error: 'Velg mellom 2 og 15 unike severdigheter.' }, 400);
  }

  if (!startPlaceId || !uniquePlaceIds.includes(startPlaceId)) {
    return json({ error: 'Velg en av de valgte severdighetene som startsted.' }, 400);
  }

  if (!mode) return json({ error: 'Velg om du vil gå eller sykle.' }, 400);

  const places = await getCollection('places');
  const placesById = new Map(places.map((place) => [place.id, place]));

  if (uniquePlaceIds.some((id) => !placesById.has(id))) {
    return json({ error: 'Ett eller flere av de valgte stedene finnes ikke.' }, 400);
  }

  const orderedIds = [startPlaceId, ...uniquePlaceIds.filter((id) => id !== startPlaceId)];
  const points: RoutePoint[] = orderedIds.map((id) => {
    const place = placesById.get(id)!;
    return {
      id,
      title: place.data.title,
      longitude: place.data.coordinates.longitude,
      latitude: place.data.coordinates.latitude,
    };
  });

  try {
    const route = await calculateRoute(points, mode, OPENROUTESERVICE_API_KEY);

    return json({
      mode,
      orderedStops: route.orderedPoints,
      geometry: route.geometry,
      totalDistanceMeters: route.totalDistanceMeters,
      totalDurationSeconds: route.totalDurationSeconds,
    });
  } catch (error) {
    if (error instanceof UnreachableRouteError) return json({ error: error.message }, 422);

    if (error instanceof RoutingProviderError) {
      return json({ error: error.message }, error.status === 429 ? 429 : error.status === 504 ? 504 : 502);
    }

    return json({ error: 'Det oppstod en uventet feil under ruteberegningen.' }, 500);
  }
};

export const ALL: APIRoute = () => json({ error: 'Metoden er ikke tillatt.' }, 405);
