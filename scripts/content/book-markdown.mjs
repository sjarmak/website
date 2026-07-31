import katex from "katex";

export function renderAuthoredMath(body) {
  return body
    .replace(/\\\[\s*\n?([\s\S]*?)\n?\s*\\\]/g, (_match, expression) => {
      const mathml = katex.renderToString(expression.trim(), {
        displayMode: true,
        output: "mathml",
        throwOnError: true,
        strict: "error",
      });
      return `<div class="book-math book-math--display">${mathml}</div>`;
    })
    .replace(/\\\((.+?)\\\)/g, (_match, expression) =>
      katex.renderToString(expression, {
        displayMode: false,
        output: "mathml",
        throwOnError: true,
        strict: "error",
      }),
    );
}
