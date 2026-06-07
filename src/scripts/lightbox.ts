// In-page expand/collapse lightbox for image plates (progressive enhancement).
// Without JS the plate link still navigates to the full image; with JS it opens
// the image in an overlay that closes on the button, a backdrop click, or Escape.

let lastFocus: HTMLElement | null = null;
let docKeyWired = false;

function closeOverlay(overlay: HTMLElement): void {
  const imgEl = overlay.querySelector<HTMLImageElement>("[data-lightbox-img]");
  overlay.hidden = true;
  imgEl?.removeAttribute("src");
  document.body.style.overflow = "";
  lastFocus?.focus();
}

function setup(): void {
  const overlay = document.querySelector<HTMLElement>("[data-lightbox-overlay]");
  if (!overlay || overlay.dataset.wired === "true") return;
  const imgEl = overlay.querySelector<HTMLImageElement>("[data-lightbox-img]");
  const closeBtn = overlay.querySelector<HTMLElement>("[data-lightbox-close]");
  if (!imgEl || !closeBtn) return;
  overlay.dataset.wired = "true";

  const open = (src: string, alt: string): void => {
    lastFocus = document.activeElement as HTMLElement | null;
    imgEl.src = src;
    imgEl.alt = alt;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  document.querySelectorAll<HTMLAnchorElement>("[data-plate-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      open(link.href, link.dataset.alt ?? "");
    });
  });

  closeBtn.addEventListener("click", () => closeOverlay(overlay));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay(overlay);
  });

  if (!docKeyWired) {
    docKeyWired = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const ov = document.querySelector<HTMLElement>("[data-lightbox-overlay]");
      if (ov && !ov.hidden) closeOverlay(ov);
    });
  }
}

setup();
document.addEventListener("astro:after-swap", setup);

export {};
