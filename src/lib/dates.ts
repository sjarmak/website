const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function year(d: Date): string {
  return String(d.getUTCFullYear());
}

export function monthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Render a CV-style range like "2021 – 2024", "2024 – Present", or a single "2023". */
export function rangeLabel(start: Date, end?: Date): string {
  if (end && year(start) === year(end)) return year(start);
  return `${year(start)} – ${end ? year(end) : "Present"}`;
}
