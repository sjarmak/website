/**
 * Offline fixture for NASA ADS / SciX papers.
 *
 * Populated from the real publication content files in src/content/publications/*.
 * citationCount is set to 0 for all entries — live mode (ads/client.ts) overwrites
 * these with real counts from the ADS `citation_count` field.
 */

export type AdsPaper = {
  bibcode?: string;
  title: string;
  year: number;
  authors: string[];
  authorString?: string;
  venue?: string;
  type: string;
  /** 0 in fixture; filled by live ADS response. */
  citationCount: number;
  url: string;
  abstract?: string;
  arxiv?: string;
  doi?: string;
  field: "planetary" | "information";
};

export const adsFixture: AdsPaper[] = [
  // ── planetary science ──────────────────────────────────────────────────────

  {
    title: "CubeSat Particle Aggregation Collision Experiment (Q-PACE): Design of a 3U CubeSat mission to investigate planetesimal formation",
    year: 2019,
    authors: ["S. Jarmak", "J. Brisset", "J. Colwell", "A. Dove", "D. Maukonen", "S. A. Rawashdeh"],
    authorString: "S. Jarmak, J. Brisset, J. Colwell, A. Dove, D. Maukonen, S. A. Rawashdeh, et al.",
    venue: "Acta Astronautica",
    type: "journal",
    citationCount: 0, // unknown offline; filled by live ADS response
    url: "https://www.sciencedirect.com/science/article/abs/pii/S0094576518310865",
    field: "planetary",
  },
  {
    title: "QUEST: A New Frontiers Uranus orbiter mission concept study",
    year: 2020,
    authors: ["S. Jarmak", "E. Leonard", "A. Akins", "E. Dahl", "D. R. Cremons", "S. Cofield", "A. Curtis"],
    authorString: "S. Jarmak, E. Leonard, A. Akins, E. Dahl, D. R. Cremons, S. Cofield, A. Curtis, et al.",
    venue: "Acta Astronautica",
    type: "journal",
    citationCount: 0, // unknown offline; filled by live ADS response
    url: "https://www.sciencedirect.com/science/article/abs/pii/S0094576520300412",
    field: "planetary",
  },
  {
    title: "The Adhesive Response of Regolith to Low-Energy Disturbances in Microgravity",
    year: 2021,
    authors: ["S. Jarmak", "J. Colwell", "A. Dove", "J. Brisset"],
    authorString: "S. Jarmak, J. Colwell, A. Dove, J. Brisset",
    venue: "Gravitational and Space Research",
    type: "journal",
    citationCount: 0, // unknown offline; filled by live ADS response
    doi: "10.2478/gsr-2021-0001",
    url: "https://reference-global.com/article/10.2478/gsr-2021-0001",
    field: "planetary",
  },
  {
    title: "Solar occultation observations of Saturn's rings with Cassini UVIS",
    year: 2022,
    authors: ["S. G. Jarmak", "T. M. Becker", "J. E. Colwell", "R. G. Jerousek", "L. W. Esposito"],
    authorString: "S. G. Jarmak, T. M. Becker, J. E. Colwell, R. G. Jerousek, L. W. Esposito",
    venue: "Icarus",
    type: "journal",
    citationCount: 0, // unknown offline; filled by live ADS response
    url: "https://www.sciencedirect.com/science/article/abs/pii/S001910352200330X",
    field: "planetary",
  },
  {
    title: "Apophis Specific Action Team Report",
    year: 2022,
    authors: ["J. L. Dotson", "M. Brozović", "S. Chesley", "S. Jarmak", "N. Moskovitz", "A. Rivkin"],
    authorString: "J. L. Dotson, M. Brozović, S. Chesley, S. Jarmak, N. Moskovitz, A. Rivkin, et al.",
    venue: "USGS Report",
    type: "abstract",
    citationCount: 0, // unknown offline; filled by live ADS response
    url: "https://scixplorer.org/search?p=1&q=author%3Ajarmak&sort=score+desc&sort=date+desc&d=general",
    field: "planetary",
  },
  {
    title: "Cassini UVIS solar occultation observations of Saturn's rings (data bundle)",
    year: 2023,
    authors: ["T. M. Becker", "S. G. Jarmak"],
    authorString: "T. M. Becker, S. G. Jarmak",
    venue: "NASA Planetary Data System (PDS)",
    type: "software",
    citationCount: 0, // unknown offline; filled by live ADS response
    url: "https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn:nasa:pds:cassini_uvis_solarocc_beckerjarmak2023&version=1.1",
    field: "planetary",
  },
  {
    title: "Estimate of water and hydroxyl abundance on asteroid (16) Psyche from JWST data",
    year: 2024,
    authors: ["S. G. Jarmak", "T. M. Becker", "C. E. Woodward", "C. I. Honniball", "A. S. Rivkin"],
    authorString: "S. G. Jarmak, T. M. Becker, C. E. Woodward, C. I. Honniball, A. S. Rivkin, et al.",
    venue: "The Planetary Science Journal",
    type: "journal",
    citationCount: 0, // unknown offline; filled by live ADS response
    doi: "10.3847/PSJ/ad66b9",
    url: "https://iopscience.iop.org/article/10.3847/PSJ/ad66b9",
    field: "planetary",
  },
  {
    title: "JWST Spectroscopy of (142) Polana: Connection to NEAs (101955) Bennu and (162173) Ryugu",
    year: 2025,
    authors: ["A. Arredondo", "T. M. Becker", "M. M. McAdam", "A. S. Rivkin", "S. Jarmak", "I. Wong"],
    authorString: "A. Arredondo, T. M. Becker, M. M. McAdam, A. S. Rivkin, S. Jarmak, I. Wong",
    venue: "The Planetary Science Journal",
    type: "journal",
    citationCount: 0, // unknown offline; filled by live ADS response
    url: "https://scixplorer.org/search?p=1&q=author%3Ajarmak&sort=score+desc&sort=date+desc&d=general",
    field: "planetary",
  },

  // ── information science ────────────────────────────────────────────────────

  {
    title: "Experimenting with Large Language Models and vector embeddings in NASA SciX",
    year: 2023,
    authors: ["S. Blanco-Cuaresma", "I. Ciucă", "A. Accomazzi", "M. J. Kurtz", "E. A. Henneken", "S. Jarmak"],
    authorString: "S. Blanco-Cuaresma, I. Ciucă, A. Accomazzi, M. J. Kurtz, E. A. Henneken, et al.",
    venue: "arXiv preprint",
    type: "preprint",
    citationCount: 0, // unknown offline; filled by live ADS response
    arxiv: "2312.14211",
    url: "https://arxiv.org/abs/2312.14211",
    field: "information",
  },
];
