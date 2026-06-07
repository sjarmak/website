function init() {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-question-card]"),
  );
  const tagChips = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-tag-chip]"),
  );
  const statusChips = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-status-chip]"),
  );
  const countEl = document.querySelector<HTMLElement>("[data-question-count]");

  if (!cards.length) return;

  let activeTag: string | null = null;
  let activeStatus: string = "all";

  function updateCount(visible: number): void {
    if (!countEl) return;
    countEl.textContent = `${visible} question${visible === 1 ? "" : "s"}`;
  }

  function applyFilters(): void {
    let visible = 0;
    for (const card of cards) {
      const cardTags = (card.dataset.tags ?? "").split(",").map((t) => t.trim());
      const cardStatus = card.dataset.status ?? "";

      const tagMatch = activeTag === null || cardTags.includes(activeTag);
      const statusMatch = activeStatus === "all" || cardStatus === activeStatus;

      const show = tagMatch && statusMatch;
      card.hidden = !show;
      if (show) visible++;
    }
    updateCount(visible);
  }

  for (const chip of tagChips) {
    chip.addEventListener("click", () => {
      const tag = chip.dataset.tagChip ?? null;
      const selecting = activeTag !== tag;

      activeTag = selecting ? tag : null;

      for (const c of tagChips) {
        c.setAttribute("aria-pressed", String(c.dataset.tagChip === activeTag));
      }
      applyFilters();
    });

    chip.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        chip.click();
      }
    });
  }

  for (const chip of statusChips) {
    chip.addEventListener("click", () => {
      activeStatus = chip.dataset.statusChip ?? "all";

      for (const c of statusChips) {
        c.setAttribute(
          "aria-pressed",
          String(c.dataset.statusChip === activeStatus),
        );
      }
      applyFilters();
    });

    chip.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        chip.click();
      }
    });
  }

  updateCount(cards.length);
}

init();
document.addEventListener("astro:after-swap", init);

export {};
