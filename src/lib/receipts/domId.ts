import { createHash } from "node:crypto";

export interface ReceiptIdentity {
  kind: "paper" | "repo" | "dataset" | "talk" | "post" | "press";
  source: string;
  url: string;
  id: string;
}

export function receiptDomId(identity: ReceiptIdentity): string {
  const seed = `${identity.id}\0${identity.kind}\0${identity.source}\0${identity.url}`;
  const suffix = createHash("sha256").update(seed).digest("hex").slice(0, 8);

  return `receipt-${suffix}`;
}
