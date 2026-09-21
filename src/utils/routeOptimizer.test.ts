import { describe, expect, it } from 'vitest';
import { findShortestOpenRoute, UnreachableRouteError } from './routeOptimizer';

describe('findShortestOpenRoute', () => {
  it('keeps the first point fixed and chooses the shortest open order', () => {
    const distances = [
      [0, 2, 8, 9],
      [2, 0, 2, 8],
      [8, 2, 0, 2],
      [9, 8, 2, 0],
    ];

    expect(findShortestOpenRoute(distances)).toEqual([0, 1, 2, 3]);
  });

  it('supports asymmetric travel distances', () => {
    const distances = [
      [0, 8, 1],
      [1, 0, 8],
      [8, 1, 0],
    ];

    expect(findShortestOpenRoute(distances)).toEqual([0, 2, 1]);
  });

  it('rejects a selection containing an unreachable point', () => {
    const distances = [
      [0, 1, null],
      [1, 0, null],
      [null, null, 0],
    ];

    expect(() => findShortestOpenRoute(distances)).toThrow(UnreachableRouteError);
  });
});
