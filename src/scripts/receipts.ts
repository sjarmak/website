// receipts.ts — wire evidence chip popovers for [data-receipt] elements.
// No external deps. Re-runs safely after astro:after-swap.

type ReceiptEl = {
  root: HTMLElement;
  btn: HTMLButtonElement;
  pop: HTMLElement;
};

let activeReceipt: ReceiptEl | null = null;

function closeActive() {
  if (!activeReceipt) return;
  activeReceipt.btn.setAttribute("aria-expanded", "false");
  activeReceipt.pop.hidden = true;
  activeReceipt = null;
}

function openReceipt(receipt: ReceiptEl) {
  if (activeReceipt && activeReceipt.btn !== receipt.btn) {
    closeActive();
  }
  receipt.btn.setAttribute("aria-expanded", "true");
  receipt.pop.hidden = false;
  positionPop(receipt);
  activeReceipt = receipt;
}

function toggleReceipt(receipt: ReceiptEl) {
  const isOpen = receipt.btn.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeActive();
  } else {
    openReceipt(receipt);
  }
}

function positionPop(receipt: ReceiptEl) {
  const { pop, btn } = receipt;
  // Reset so we can measure natural position
  pop.style.left = "";
  pop.style.right = "";

  const btnRect = btn.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  const viewportW = document.documentElement.clientWidth;

  // If the popover overflows the right edge, anchor it to the right of the chip
  if (btnRect.left + popRect.width > viewportW - 8) {
    pop.style.left = "auto";
    pop.style.right = "0";
  } else {
    pop.style.left = "0";
    pop.style.right = "auto";
  }
}

function wireReceipts(scope: Document | HTMLElement = document) {
  const roots = Array.from(scope.querySelectorAll<HTMLElement>("[data-receipt]"));

  roots.forEach((root) => {
    if (root.dataset.receiptWired === "true") return;
    root.dataset.receiptWired = "true";

    const btn = root.querySelector<HTMLButtonElement>("[data-receipt-btn]");
    const pop = root.querySelector<HTMLElement>("[role='tooltip']");
    if (!btn || !pop) return;

    const receipt: ReceiptEl = { root, btn, pop };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleReceipt(receipt);
    });

    // Open on focus for keyboard users (not hover — hover alone is inaccessible)
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeActive();
        btn.focus();
      }
    });
  });
}

// Global close handlers — wired once. This module is evaluated a single time,
// so a module-level flag is sufficient (it persists across astro:after-swap).
let globalHandlersWired = false;
function ensureGlobalHandlers() {
  if (globalHandlersWired) return;
  globalHandlersWired = true;

  document.addEventListener("click", () => {
    closeActive();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeActive();
  });
}

function init() {
  wireReceipts();
  ensureGlobalHandlers();
}

// Initial page load
init();

// Re-init after Astro view transitions swap the DOM
document.addEventListener("astro:after-swap", init);

export {};
