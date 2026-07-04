// Canonical register→copy map — the SINGLE source of visitor-facing register
// wording. The R1 provenance badge and the R16 sitewide type stamps both
// consume this map; no component may carry its own register phrasing.
// (R16: stamp placement on `authored` pages is footer-quiet so the personal
// register is never visually co-labeled with the machine one.)

// .ts extension is deliberate: this module is also imported by plain-node
// test/check scripts (type stripping), which require explicit extensions.
import type { Register } from "./register.ts";
import { REGISTERS } from "./register.ts";

export type StampPlacement = "header" | "footer-quiet";

export interface RegisterCopy {
  /** Short type label (stamp text, chip text). */
  label: string;
  /** One-sentence provenance line for the badge/stamp tooltip or subline. */
  badgeCopy: string;
  /** Where the R16 stamp renders on pages of this register. */
  stampPlacement: StampPlacement;
}

export const REGISTER_COPY: Record<Register, RegisterCopy> = {
  authored: {
    label: "Written by Stephanie",
    badgeCopy: "Written by Stephanie Jarmak.",
    stampPlacement: "footer-quiet",
  },
  generated: {
    label: "Pipeline output",
    badgeCopy:
      "Compiled by an automated research pipeline — selection criteria and code by Stephanie Jarmak.",
    stampPlacement: "header",
  },
  hybrid: {
    label: "Hand-curated",
    badgeCopy: "Hand-curated by Stephanie Jarmak, assembled and rendered by her pipeline.",
    stampPlacement: "header",
  },
  reference: {
    label: "Reference",
    badgeCopy: "Curated reference material — structured records, kept current by hand.",
    stampPlacement: "footer-quiet",
  },
  lab: {
    label: "Lab prototype",
    badgeCopy: "A working experiment from the lab — rough edges expected.",
    stampPlacement: "header",
  },
};

// Defensive completeness assertion for plain-JS consumers (the TS Record type
// already guarantees this for typed callers).
for (const register of REGISTERS) {
  if (!REGISTER_COPY[register]) {
    throw new Error(`registerCopy: missing copy for register "${register}"`);
  }
}
