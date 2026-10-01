type Direction = "asc" | "desc";

function sortValue(row: HTMLTableRowElement, key: string): number | string | null {
  const raw = row.dataset[key];
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
}

function compare(a: number | string | null, b: number | string | null, direction: Direction): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const sign = direction === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * sign;
  return String(a).localeCompare(String(b)) * sign;
}

function wireTable(table: HTMLTableElement) {
  if (table.dataset.sortWired === "true") return;
  table.dataset.sortWired = "true";
  const body = table.tBodies[0];
  if (!body) return;
  const headers = Array.from(table.querySelectorAll<HTMLButtonElement>("th [data-sort-key]"));

  const apply = (key: string, direction: Direction) => {
    const rows = Array.from(body.querySelectorAll<HTMLTableRowElement>("tr[data-model]"));
    const sorted = [...rows].sort((ra, rb) => {
      const primary = compare(sortValue(ra, key), sortValue(rb, key), direction);
      if (primary !== 0) return primary;
      return compare(sortValue(ra, "name"), sortValue(rb, "name"), "asc");
    });
    for (const row of sorted) body.appendChild(row);
    for (const h of headers) {
      const th = h.closest("th");
      if (!th) continue;
      if (h.dataset.sortKey === key) th.setAttribute("aria-sort", direction === "asc" ? "ascending" : "descending");
      else th.removeAttribute("aria-sort");
    }
  };

  for (const h of headers) {
    h.addEventListener("click", () => {
      const key = h.dataset.sortKey ?? "";
      const th = h.closest("th");
      const current = th?.getAttribute("aria-sort");
      const defaultDirection: Direction = h.dataset.sortDefault === "asc" ? "asc" : "desc";
      const next: Direction =
        current === "descending" ? "asc" : current === "ascending" ? "desc" : defaultDirection;
      apply(key, next);
    });
  }
}

function wireAll() {
  for (const table of document.querySelectorAll<HTMLTableElement>("table[data-sortable]")) wireTable(table);
}

wireAll();
document.addEventListener("astro:after-swap", wireAll);

export {};
