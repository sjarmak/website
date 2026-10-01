interface MarkInfo {
  name: string;
  detail: string;
  x: number;
  y: number;
}

function markInfo(mark: SVGGElement): MarkInfo | null {
  const { name, detail, x, y } = mark.dataset;
  if (!name || !detail || x === undefined || y === undefined) return null;
  return { name, detail, x: Number(x), y: Number(y) };
}

function svgPoint(svg: SVGSVGElement, x: number, y: number): { left: number; top: number } {
  const ctm = svg.getScreenCTM();
  const host = svg.parentElement?.getBoundingClientRect();
  if (!ctm || !host) return { left: 0, top: 0 };
  const p = new DOMPoint(x, y).matrixTransform(ctm);
  return { left: p.x - host.left, top: p.y - host.top };
}

function wireChart(figure: HTMLElement) {
  if (figure.dataset.tooltipWired === "true") return;
  figure.dataset.tooltipWired = "true";
  const svg = figure.querySelector<SVGSVGElement>("svg");
  const tip = figure.querySelector<HTMLElement>(".pareto__tip");
  if (!svg || !tip) return;
  const marks = Array.from(svg.querySelectorAll<SVGGElement>(".pareto__mark"));
  const pinLayer = svg.querySelector<SVGGElement>(".pareto__pins");
  if (!pinLayer) return;

  const show = (mark: SVGGElement) => {
    const info = markInfo(mark);
    if (!info) return;
    const { left, top } = svgPoint(svg, info.x, info.y);
    tip.querySelector("strong")!.textContent = info.name;
    tip.querySelector("span")!.textContent = info.detail;
    tip.hidden = false;
    const flip = left > figure.clientWidth * 0.6;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.transform = flip ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)";
  };
  const hide = () => {
    tip.hidden = true;
  };

  const togglePin = (mark: SVGGElement) => {
    const info = markInfo(mark);
    if (!info) return;
    const existing = pinLayer.querySelector<SVGTextElement>(`[data-pin="${CSS.escape(info.name)}"]`);
    if (existing) {
      existing.remove();
      mark.classList.remove("pareto__mark--pinned");
      return;
    }
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const flip = info.x > Number(svg.viewBox.baseVal.width) - 160;
    text.setAttribute("x", String(flip ? info.x - 9 : info.x + 9));
    text.setAttribute("y", String(info.y));
    text.setAttribute("dy", "0.32em");
    text.setAttribute("text-anchor", flip ? "end" : "start");
    text.setAttribute("class", "pareto__label pareto__label--pinned");
    text.dataset.pin = info.name;
    text.textContent = info.name;
    pinLayer.appendChild(text);
    mark.classList.add("pareto__mark--pinned");
  };

  for (const mark of marks) {
    mark.addEventListener("pointerenter", () => show(mark));
    mark.addEventListener("pointerleave", hide);
    mark.addEventListener("focus", () => show(mark));
    mark.addEventListener("blur", hide);
    mark.addEventListener("click", (e) => {
      e.preventDefault();
      togglePin(mark);
      show(mark);
    });
    mark.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        togglePin(mark);
      }
    });
  }
  svg.addEventListener("pointerleave", hide);
}

function wireAll() {
  for (const figure of document.querySelectorAll<HTMLElement>("figure.pareto")) wireChart(figure);
}

wireAll();
document.addEventListener("astro:after-swap", wireAll);

export {};
