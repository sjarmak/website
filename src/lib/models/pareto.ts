export interface ParetoPoint {
  id: string;
  cost: number;
  value: number;
}

export function paretoFrontier(points: ParetoPoint[]): Set<string> {
  const frontier = new Set<string>();
  for (const p of points) {
    const dominated = points.some(
      (q) =>
        q.id !== p.id &&
        q.cost <= p.cost &&
        q.value >= p.value &&
        (q.cost < p.cost || q.value > p.value),
    );
    if (!dominated) frontier.add(p.id);
  }
  return frontier;
}

export function nearFrontier(points: ParetoPoint[], frontier: Set<string>, tolerance: number): Set<string> {
  const near = new Set<string>();
  const frontierPoints = points.filter((p) => frontier.has(p.id));
  for (const p of points) {
    if (frontier.has(p.id)) continue;
    const bestAtOrBelowCost = frontierPoints
      .filter((f) => f.cost <= p.cost)
      .reduce((best, f) => Math.max(best, f.value), -Infinity);
    if (bestAtOrBelowCost - p.value <= tolerance) near.add(p.id);
  }
  return near;
}
