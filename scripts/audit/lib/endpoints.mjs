// Endpoint adapters for the R14 LLM-bio audit.
//
// Each adapter answers one question against one public LLM/search endpoint
// and returns { answerText, citedUrls }. Adapters NEVER read keys from
// anywhere but the environment, and a missing key means the lane is skipped
// (recorded "unavailable"), never an error. runLane() converts every thrown
// failure — network refusal, timeout, HTTP error, bad payload — into a
// recorded status; a dead or blocking endpoint cannot crash the audit.

import { extractSjarmakUrls } from "./extract.mjs";

export const DEFAULT_TIMEOUT_MS = 30_000;

const asString = (v) => (typeof v === "string" ? v : "");

export const ENDPOINTS = [
  {
    id: "perplexity",
    label: "Perplexity chat (sonar)",
    envKey: "PERPLEXITY_API_KEY",
    async query(question, { key, fetchImpl, signal, env }) {
      const res = await fetchImpl("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        signal,
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: env.AUDIT_PERPLEXITY_MODEL || "sonar",
          messages: [{ role: "user", content: question }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return {
        answerText: asString(body?.choices?.[0]?.message?.content),
        citedUrls: (body?.citations ?? []).filter((u) => typeof u === "string"),
      };
    },
  },
  {
    id: "openai",
    label: "OpenAI chat completions",
    envKey: "OPENAI_API_KEY",
    async query(question, { key, fetchImpl, signal, env }) {
      const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: env.AUDIT_OPENAI_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: question }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return { answerText: asString(body?.choices?.[0]?.message?.content), citedUrls: [] };
    },
  },
  {
    id: "anthropic",
    label: "Anthropic messages",
    envKey: "ANTHROPIC_API_KEY",
    async query(question, { key, fetchImpl, signal, env }) {
      const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal,
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: env.AUDIT_ANTHROPIC_MODEL || "claude-sonnet-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: question }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const answerText = (body?.content ?? [])
        .map((block) => asString(block?.text))
        .join("\n");
      return { answerText, citedUrls: [] };
    },
  },
  {
    id: "brave-search",
    label: "Brave web search",
    envKey: "BRAVE_SEARCH_API_KEY",
    async query(question, { key, fetchImpl, signal }) {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(question)}`;
      const res = await fetchImpl(url, {
        signal,
        headers: { "x-subscription-token": key, accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const citedUrls = (body?.web?.results ?? [])
        .map((r) => r?.url)
        .filter((u) => typeof u === "string");
      return { answerText: "", citedUrls };
    },
  },
  {
    id: "duckduckgo",
    label: "DuckDuckGo instant answer (keyless)",
    envKey: null,
    async query(question, { fetchImpl, signal }) {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json&no_html=1`;
      const res = await fetchImpl(url, { signal, headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const citedUrls = [
        body?.AbstractURL,
        ...(body?.Results ?? []).map((r) => r?.FirstURL),
        ...(body?.RelatedTopics ?? []).map((t) => t?.FirstURL),
      ].filter((u) => typeof u === "string" && u.length > 0);
      return { answerText: asString(body?.AbstractText), citedUrls };
    },
  },
];

export function selectEndpoints(ids) {
  if (!ids || ids.length === 0) return ENDPOINTS;
  const known = new Map(ENDPOINTS.map((e) => [e.id, e]));
  return ids.map((id) => {
    const endpoint = known.get(id);
    if (!endpoint) {
      throw new Error(
        `unknown endpoint "${id}" (known: ${ENDPOINTS.map((e) => e.id).join(", ")})`,
      );
    }
    return endpoint;
  });
}

async function withTimeout(run, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// Run one lane (endpoint × all questions). Never throws for endpoint-side
// failures: a missing key, a dead endpoint, or all-question failure yields
// { status: "unavailable", reason }, a partially/fully answering endpoint
// yields { status: "ok", results: [...] } with per-question ok/error records.
export async function runLane(endpoint, questions, {
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  log = console.error,
} = {}) {
  const base = { id: endpoint.id, label: endpoint.label };
  const key = endpoint.envKey ? env[endpoint.envKey]?.trim() : null;
  if (endpoint.envKey && !key) {
    return { ...base, status: "unavailable", reason: `${endpoint.envKey} not set — lane skipped` };
  }

  const results = [];
  for (const question of questions) {
    try {
      const { answerText, citedUrls } = await withTimeout(
        (signal) => endpoint.query(question.text, { key, fetchImpl, signal, env }),
        timeoutMs,
      );
      const { sjarmakUrls, conceptUrls } = extractSjarmakUrls(answerText, citedUrls);
      results.push({ questionId: question.id, status: "ok", sjarmakUrls, conceptUrls });
    } catch (err) {
      const reason = err?.cause?.message ?? err?.message ?? String(err);
      log(`[audit] ${endpoint.id} × ${question.id}: ${reason}`);
      results.push({ questionId: question.id, status: "error", reason });
    }
  }

  if (results.every((r) => r.status === "error")) {
    return {
      ...base,
      status: "unavailable",
      reason: `all ${results.length} questions failed (first: ${results[0].reason})`,
      results,
    };
  }
  return { ...base, status: "ok", results };
}
