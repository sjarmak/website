export type SortDirection = "asc" | "desc";
export type Comparator<T> = (a: T, b: T) => number;

function directionMultiplier(direction: SortDirection): number {
  return direction === "asc" ? 1 : -1;
}

export function byString<T>(select: (item: T) => string, direction: SortDirection = "asc"): Comparator<T> {
  const multiplier = directionMultiplier(direction);
  return (a, b) => select(a).localeCompare(select(b)) * multiplier;
}

export function byId<T extends { id: string }>(direction: SortDirection = "asc"): Comparator<T> {
  return byString((item) => item.id, direction);
}

export function byNumber<T>(select: (item: T) => number, direction: SortDirection = "asc"): Comparator<T> {
  const multiplier = directionMultiplier(direction);
  return (a, b) => {
    const av = select(a);
    const bv = select(b);
    if (av === bv) return 0;
    return (av < bv ? -1 : 1) * multiplier;
  };
}

export function byDate<T>(select: (item: T) => Date, direction: SortDirection = "asc"): Comparator<T> {
  return byNumber((item) => select(item).getTime(), direction);
}

export function thenBy<T>(...comparators: Comparator<T>[]): Comparator<T> {
  return (a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}
