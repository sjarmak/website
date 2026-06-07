// Global site configuration. Non-collection data: identity, nav, socials.

export const site = {
  name: "Stephanie Jarmak",
  shortName: "S. Jarmak",
  domain: "sjarmak.ai",
  url: "https://sjarmak.ai",
  email: "steph.jarmak@gmail.com",
  tagline: "Information scientist, AI agent advocate, and astrophotographer.",
  description:
    "Stephanie Jarmak — information scientist and applied research scientist, AI agent advocate at Sourcegraph, NASA SciX research affiliate. Knowledge graphs, retrieval, agents, and astrophotography.",
  locale: "en",
} as const;

export type NavItem = { label: string; href: string };

export const nav: readonly NavItem[] = [
  { label: "Work", href: "/work" },
  { label: "Library", href: "/library" },
  { label: "Threads", href: "/threads" },
  { label: "Writing", href: "/writing" },
  { label: "Talks", href: "/talks" },
  { label: "Learning", href: "/learning" },
  { label: "CV", href: "/cv" },
  { label: "Astrophotography", href: "/astrophotography" },
  { label: "Art", href: "/art" },
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
  { name: "Sourcegraph", role: "AI agent advocate / applied research scientist" },
  { name: "NASA Science Explorer (SciX)", role: "Research affiliate" },
] as const;
