export class UnreachableRouteError extends Error {
  constructor() {
    super('De valgte stedene kan ikke kobles sammen med denne reisemåten.');
    this.name = 'UnreachableRouteError';
  }
}

/**
 * Finds the minimum-distance open route through a distance matrix.
 * Index 0 is fixed as the start; the final stop is chosen by the optimizer.
 */
export function findShortestOpenRoute(distances: Array<Array<number | null>>): number[] {
  const pointCount = distances.length;

  if (pointCount < 2 || pointCount > 15) {
    throw new RangeError('The route must contain between 2 and 15 points.');
  }

  if (distances.some((row) => row.length !== pointCount)) {
    throw new TypeError('The distance matrix must be square.');
  }

  const remainingCount = pointCount - 1;
  const stateCount = 1 << remainingCount;
  const costs = new Float64Array(stateCount * remainingCount);
  const parents = new Int16Array(stateCount * remainingCount);
  costs.fill(Number.POSITIVE_INFINITY);
  parents.fill(-1);

  const indexFor = (mask: number, end: number) => mask * remainingCount + end;
  const distanceBetween = (from: number, to: number) => {
    const value = distances[from]?.[to];
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : Number.POSITIVE_INFINITY;
  };

  for (let end = 0; end < remainingCount; end += 1) {
    costs[indexFor(1 << end, end)] = distanceBetween(0, end + 1);
  }

  for (let mask = 1; mask < stateCount; mask += 1) {
    for (let end = 0; end < remainingCount; end += 1) {
      const endBit = 1 << end;
      if ((mask & endBit) === 0) continue;

      const previousMask = mask ^ endBit;
      if (previousMask === 0) continue;

      for (let previous = 0; previous < remainingCount; previous += 1) {
        if ((previousMask & (1 << previous)) === 0) continue;

        const candidate =
          costs[indexFor(previousMask, previous)] + distanceBetween(previous + 1, end + 1);
        const currentIndex = indexFor(mask, end);

        if (candidate < costs[currentIndex]) {
          costs[currentIndex] = candidate;
          parents[currentIndex] = previous;
        }
      }
    }
  }

  const fullMask = stateCount - 1;
  let bestEnd = -1;
  let bestCost = Number.POSITIVE_INFINITY;

  for (let end = 0; end < remainingCount; end += 1) {
    const cost = costs[indexFor(fullMask, end)];
    if (cost < bestCost) {
      bestCost = cost;
      bestEnd = end;
    }
  }

  if (bestEnd < 0 || !Number.isFinite(bestCost)) throw new UnreachableRouteError();

  const reversedStops: number[] = [];
  let mask = fullMask;
  let end = bestEnd;

  while (end >= 0) {
    reversedStops.push(end + 1);
    const previous = parents[indexFor(mask, end)];
    mask ^= 1 << end;
    end = previous;
  }

  return [0, ...reversedStops.reverse()];
}
