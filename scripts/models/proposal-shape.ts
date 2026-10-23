export type Raw = Record<string, unknown>;

export class ItemError extends Error {}

export class ProposalError extends Error {}

export const isObject = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export const isIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function text(o: Raw, key: string, max = 300): string {
  const value = o[key];
  if (typeof value !== "string" || value.trim() === "" || value.length > max) {
    throw new ItemError(`${key} must be a non-empty string of at most ${max} characters`);
  }
  return value;
}

export function optionalText(o: Raw, key: string, max = 300): string | undefined {
  return o[key] === undefined ? undefined : text(o, key, max);
}

export function finite(o: Raw, key: string): number {
  const value = o[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ItemError(`${key} must be a finite number`);
  return value;
}

export function positiveInteger(o: Raw, key: string): number {
  const value = finite(o, key);
  if (!Number.isInteger(value) || value <= 0) throw new ItemError(`${key} must be a positive integer`);
  return value;
}

export function optionalPositiveInteger(o: Raw, key: string): number | undefined {
  return o[key] === undefined ? undefined : positiveInteger(o, key);
}

export function flag(o: Raw, key: string): boolean {
  const value = o[key];
  if (typeof value !== "boolean") throw new ItemError(`${key} must be true or false`);
  return value;
}

export function optionalFlag(o: Raw, key: string): boolean | undefined {
  return o[key] === undefined ? undefined : flag(o, key);
}

export function httpsUrl(o: Raw, key: string): string {
  const value = text(o, key, 500);
  if (!isHttpsUrl(value)) throw new ItemError(`${key} must be an https URL`);
  return value;
}

export function optionalHttpsUrl(o: Raw, key: string): string | undefined {
  return o[key] === undefined ? undefined : httpsUrl(o, key);
}

export function textList(o: Raw, key: string, max = 300): string[] {
  const value = o[key];
  if (!Array.isArray(value) || value.length === 0) throw new ItemError(`${key} must be a non-empty list`);
  return value.map((entry, i) => {
    if (typeof entry !== "string" || entry.trim() === "" || entry.length > max) {
      throw new ItemError(`${key}[${i}] must be a non-empty string of at most ${max} characters`);
    }
    return entry;
  });
}

export function optionalTextList(o: Raw, key: string, max = 300): string[] | undefined {
  return o[key] === undefined ? undefined : textList(o, key, max);
}

export function dated(o: Raw, runDate: string): { sourceUrl: string; retrieved: string; evidence: string } {
  const sourceUrl = httpsUrl(o, "sourceUrl");
  const retrieved = text(o, "retrieved", 10);
  if (retrieved !== runDate) throw new ItemError(`retrieved must equal the run date ${runDate}, found ${retrieved}`);
  return { sourceUrl, retrieved, evidence: text(o, "evidence", 1000) };
}

export function list(root: Raw, key: string): unknown[] {
  const value = root[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ProposalError(`${key} must be a list`);
  return value;
}

export function header(root: unknown, runDate: string): Raw {
  if (!isObject(root)) throw new ProposalError("proposal file must hold a JSON object");
  if (root.runDate !== runDate) throw new ProposalError(`runDate must be ${runDate}, found ${String(root.runDate)}`);
  return root;
}
