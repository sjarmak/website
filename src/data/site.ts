// Global site configuration. Non-collection data: identity, nav, socials.

export const site = {
  name: "Stephanie Jarmak",
  shortName: "S. Jarmak",
  domain: "sjarmak.ai",
  url: "https://sjarmak.ai",
  email: "steph.jarmak@gmail.com",
  tagline: "AI Engineer and Researcher",
  description:
    "Stephanie Jarmak is an AI engineer and researcher working on reliable AI systems: evaluating agents, retrieval and context for models, and agentic software engineering. AI Engineer at Omni and research affiliate with NASA SciX.",
  locale: "en",
} as const;

export type NavItem = { label: string; href: string };

export const nav: readonly NavItem[] = [
  { label: "Work", href: "/work" },
  { label: "Library", href: "/library" },
  { label: "Radar", href: "/radar" },
  { label: "Models", href: "/models" },
  { label: "Digest", href: "/digest" },
  { label: "Writing", href: "/writing" },
  { label: "Talks", href: "/talks" },
  { label: "CV", href: "/cv" },
  { label: "Art", href: "/art" },
  { label: "Games", href: "/games" },
];

export type SocialLink = { label: string; href: string; handle: string };

export const socials: readonly SocialLink[] = [
  { label: "GitHub", href: "https://github.com/sjarmak", handle: "sjarmak" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/stephanie-jarmak", handle: "stephanie-jarmak" },
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?user=dnZkNoUAAAAJ&hl=en",
    handle: "Stephanie Jarmak",
  },
  { label: "Medium", href: "https://medium.com/@sjarmak", handle: "@sjarmak" },
  { label: "Email", href: "mailto:steph.jarmak@gmail.com", handle: "steph.jarmak@gmail.com" },
];

// Affiliations surfaced in JSON-LD and the footer.
export const affiliations = [
  { name: "Omni", role: "AI Engineer", since: "September 2026 – Present", relation: "worksFor" },
  { name: "NASA Science Explorer (SciX)", role: "Research Affiliate", relation: "affiliation" },
] as const;
