import { assetCategoryById } from "./data";
import type { EventOccurrence, StockEvent } from "@/types/event";

export interface AssetConcept {
  title: string;
  assetType: string;
  description: string;
  composition: string;
}

export interface ContentPlan {
  concepts: AssetConcept[];
  collectionThemes: string[];
  designDirection: string[];
  compositionIdeas: string[];
  keywordPlan: string[];
  uploadChecklist: string[];
  ipGuardrails: string[];
}

const TRADEMARK_TERMS =
  /\b(disney|marvel|pokemon|pokémon|nike|adidas|coca-?cola|pepsi|apple inc|iphone|mcdonald|starbucks|lego|barbie|olympic rings|fifa logo|super bowl logo|nfl |nba |hello kitty|spider-?man|batman|superman|harry potter)\b/i;

/** Strip trademark-dependent phrasing from generated copy. */
function sanitize(s: string): string {
  return s.replace(TRADEMARK_TERMS, "generic festive").trim();
}

function pick<T>(arr: T[], n: number, seed: number): T[] {
  // deterministic rotation so plans are stable per event
  const out: T[] = [];
  if (arr.length === 0) return out;
  for (let i = 0; i < n; i++) out.push(arr[(seed + i * 3) % arr.length]);
  return out;
}

const CONCEPT_TEMPLATES: { type: string; build: (e: StockEvent, theme: string, kw: string) => { title: string; description: string; composition: string } }[] = [
  {
    type: "vector-eps",
    build: (e, theme, kw) => ({
      title: `${e.name} vector bundle — ${theme}`,
      description: `A cohesive set of 12+ hand-crafted vector elements around “${theme}”, built on clean paths with global color swatches for easy recoloring.`,
      composition: `Isolated elements on white plus one composed hero scene; consistent 8pt stroke system; ${kw} as the lead motif.`,
    }),
  },
  {
    type: "icons",
    build: (e, theme, kw) => ({
      title: `${e.name} icon collection — 24px grid`,
      description: `48 outlined + filled icons covering “${theme}”: consistent corner radius, 2px stroke, expandable to any size.`,
      composition: `Uniform grid presentation sheet; each icon centered with padding; ${kw} as the signature icon.`,
    }),
  },
  {
    type: "patterns",
    build: (e, theme, kw) => ({
      title: `${e.name} seamless pattern pack`,
      description: `6 seamless repeating patterns in the “${theme}” mood — tileable at any scale, ideal for wrapping paper, textiles and backgrounds.`,
      composition: `Half-drop repeats with balanced negative space; ${kw} alternating with supporting motifs.`,
    }),
  },
  {
    type: "stickers",
    build: (e, theme, kw) => ({
      title: `${e.name} sticker sheet`,
      description: `Die-cut style sticker collection with white borders and subtle drop shadows, themed “${theme}”.`,
      composition: `Scattered sheet layout on kraft background; ${kw} as the large hero sticker.`,
    }),
  },
  {
    type: "templates",
    build: (e, theme, kw) => ({
      title: `${e.name} social + print template kit`,
      description: `Editable greeting-card, banner and story templates in the “${theme}” style with free-font typography.`,
      composition: `Layered, well-named files; safe-area guides; ${kw} as the cover visual.`,
    }),
  },
  {
    type: "illustrations",
    build: (e, theme, kw) => ({
      title: `${e.name} editorial illustration — ${theme}`,
      description: `A conceptual editorial illustration telling a “${theme}” story with layered depth and a limited palette.`,
      composition: `Rule-of-thirds hero subject (${kw}) with supporting midground and textured background.`,
    }),
  },
  {
    type: "backgrounds",
    build: (e, theme, kw) => ({
      title: `${e.name} background collection`,
      description: `12 copy-space-rich backgrounds in the “${theme}” mood — gradients, textures and scene setters for designers.`,
      composition: `Generous negative space in the upper third; ${kw} anchoring a corner.`,
    }),
  },
  {
    type: "photo-jpg",
    build: (e, theme, kw) => ({
      title: `${e.name} lifestyle photo series — ${theme}`,
      description: `Authentic, well-lit photography capturing “${theme}” with real people and real settings (model releases secured).`,
      composition: `Natural light, shallow depth of field; ${kw} as the focal moment with environmental context.`,
    }),
  },
  {
    type: "photo-png",
    build: (e, theme, kw) => ({
      title: `${e.name} isolated objects on transparent`,
      description: `Cleanly cut-out ${theme.toLowerCase()} objects on transparency — perfect for designers compositing cards and banners.`,
      composition: `Single hero object (${kw}) centered with soft realistic shadow on transparency.`,
    }),
  },
  {
    type: "video",
    build: (e, theme, kw) => ({
      title: `${e.name} motion background loop`,
      description: `A 10–20s seamless loop evoking “${theme}” — slow, elegant motion suitable as a video backdrop.`,
      composition: `Looping ${kw} particles/light with gentle camera drift; no jarring cuts.`,
    }),
  },
];

/** Generate a practical production plan for an event occurrence. */
export function generateContentPlan(occ: EventOccurrence): ContentPlan {
  const e = occ.event;
  const seed = e.id.length + occ.year;
  const themes = e.designThemes.length ? e.designThemes : ["festive", "minimal", "celebratory"];
  const kws = e.keywordIdeas.length ? e.keywordIdeas : [e.name.toLowerCase()];

  const conceptCount = Math.min(16, Math.max(10, e.assetSuggestions.length + 4));
  const concepts: AssetConcept[] = [];
  for (let i = 0; i < conceptCount; i++) {
    const tpl = CONCEPT_TEMPLATES[(seed + i) % CONCEPT_TEMPLATES.length];
    const theme = pick(themes, 1, seed + i)[0];
    const kw = pick(kws, 1, seed + i * 2)[0];
    const built = tpl.build(e, theme, kw);
    const catName = assetCategoryById[tpl.type]?.name ?? tpl.type;
    concepts.push({
      title: sanitize(built.title),
      assetType: catName,
      description: sanitize(built.description),
      composition: sanitize(built.composition),
    });
  }

  const collectionThemes = [
    `“${themes[0]}” — hero collection (vectors + templates + backgrounds)`,
    `“${themes[1 % themes.length]}” — photography & lifestyle series`,
    `“${themes[2 % themes.length]}” — patterns, stickers & icons micro-collection`,
    `Evergreen ${e.name} essentials — designs that sell year after year`,
  ];

  return {
    concepts,
    collectionThemes,
    designDirection: [
      `Lead with the “${themes[0]}” mood across all assets for a recognizable series identity.`,
      `Build a limited 4–6 color palette from the event's traditional colors; keep it consistent across vectors, templates and patterns.`,
      `Design mobile-first: bold shapes and legible type that read at thumbnail size.`,
      `Create each hero concept in 3 colorways to multiply listing coverage without extra ideation.`,
      `Avoid copyrighted characters, brand logos and trademarked symbols — use original, generic interpretations only.`,
    ],
    compositionIdeas: e.visualConcepts.slice(0, 6).map(sanitize),
    keywordPlan: [
      `Title formula: [Event] + [Asset type] + [Style] + [Use case] — e.g. “${sanitize(e.name)} vector bundle, ${sanitize(themes[0])} style, greeting card”.`,
      `Front-load the 10 most buyer-relevant keywords: ${pick(kws, Math.min(10, kws.length), seed).map(sanitize).join(", ")}.`,
      `Add conceptual terms (celebration, tradition, festive), setting terms and demographic terms buyers actually search.`,
      `Include the event year (${occ.year}) in titles of year-specific designs; keep evergreen designs year-free.`,
      `Never stuff artist names, brand names or trending unrelated terms — Adobe's spam policy penalizes it.`,
    ],
    uploadChecklist: [
      `Start creating by ${occ.creationStart} (${e.creationLeadDays} days before the event).`,
      `Begin uploading by ${occ.submissionStart}; finish the main push by ${occ.submissionDeadline}.`,
      "Export vectors as AI/EPS/SVG (never ZIPped or as JPEG); photos as sRGB JPEG, 4MP+.",
      "Tick “Created using generative AI tools” for any AI-assisted asset, every time.",
      "Attach model/property releases where recognizable people or private property appear.",
      "Write specific, honest titles — max 50 keywords, most relevant first.",
      "Vary the series: buyers license collections, not duplicates — avoid near-identical similars.",
      e.dateStatus === "provisional"
        ? "Date is provisional — re-verify the event date before the final upload push."
        : "Event date confirmed — schedule uploads against the windows above.",
    ],
    ipGuardrails: [
      "No copyrighted characters or mascots (cartoon, film, game or brand characters).",
      "No brand logos, team crests, or event trademarks (e.g., official Games/FIFA/Super Bowl marks).",
      "No artist names, celebrity likenesses or names in titles, keywords or prompts.",
      "Original interpretations of cultural symbols only — respectful, never stereotyped.",
    ],
  };
}
