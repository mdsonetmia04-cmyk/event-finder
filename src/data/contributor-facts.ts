/** Curated Adobe Stock contributor facts — official Adobe documentation only.
 *  Researched 2026-10-31. Keep the source URLs; never invent specs. */

export interface FactSection {
  title: string;
  facts: string[];
  sources: { label: string; url: string }[];
}

export const CONTRIBUTOR_FACTS: FactSection[] = [
  {
    title: "Photo submission specs",
    facts: [
      "Format: JPEG with sRGB color profile.",
      "Resolution: 4MP–100MP.",
      "Maximum file size: 45MB.",
      "No watermarks, timestamps or branding; sharp focus and clean lighting required.",
    ],
    sources: [
      {
        label: "Adobe Help — Photo technical & legal requirements",
        url: "https://helpx.adobe.com/stock/contributor/submit-your-content/submit-photos/technical-legal-requirements-photo-submission.html",
      },
    ],
  },
  {
    title: "Vector / illustration requirements",
    facts: [
      "Accepted formats: AI, EPS, SVG.",
      "Vectors saved in ZIP folders or uploaded as JPEGs are NOT accepted.",
      "EPS files should export at 15MP+ or with High Resolution Transparency Presets for best preview quality.",
      "Buyers receive an auto-generated JPEG preview plus the original file; contributors do not upload a separate PNG.",
    ],
    sources: [
      {
        label: "Adobe Help — Vector requirements",
        url: "https://helpx.adobe.com/stock/contributor/help/vector-requirements.html",
      },
      {
        label: "Adobe Help — Vector technical requirements",
        url: "https://helpx.adobe.com/stock/contributor/submit-your-content/submit-vectors/technical-requirements-for-vector-submissions.html",
      },
    ],
  },
  {
    title: "Video submission basics",
    facts: [
      "Accepted formats: MOV, MP4, MPG, AVI.",
      "Duration: 5–60 seconds (10–30s recommended for vertical).",
      "Maximum file size: 3900MB.",
      "Upload at native frame size — do not up- or down-convert.",
    ],
    sources: [
      {
        label: "Adobe Help — Video requirements",
        url: "https://helpx.adobe.com/stock/contributor/help/video-requirements.html",
      },
    ],
  },
  {
    title: "Generative AI disclosure",
    facts: [
      "The “Created using generative AI tools” checkbox is REQUIRED for all AI-created content — always.",
      "Label AI content when AI changed, augmented or added a new primary subject.",
      "Labeling is NOT required for background extension, removing IP, or retouching distractions.",
      "Prohibited in AI prompts, titles and keywords: artist names, real people, fictional characters, copyrighted works, government agencies, third-party IP.",
      "AI video must meet the same technical and legal requirements as traditional video.",
    ],
    sources: [
      {
        label: "Adobe Help — Generative AI content",
        url: "https://helpx.adobe.com/stock/contributor/help/generative-ai-content.html",
      },
      {
        label: "Adobe Help — Generative AI video guidelines",
        url: "https://helpx.adobe.com/stock/contributor/submit-your-content/submit-generative-ai-content/generative-ai-video-submission-guidelines.html",
      },
    ],
  },
  {
    title: "Metadata rules",
    facts: [
      "Up to 50 keywords per asset, ordered by relevance.",
      "The first 10 keywords are prioritized in search results.",
      "Titles should be specific and descriptive; avoid keyword stuffing.",
    ],
    sources: [
      {
        label: "Adobe Stock Contributor portal",
        url: "https://stock.adobe.com/contributor",
      },
    ],
  },
  {
    title: "Similar content & spam policy",
    facts: [
      "Do not submit many near-identical variations of the same asset.",
      "Adobe's similar-content guidance: max 3 significant variations of a single motif.",
      "Do not stuff unrelated trending terms into titles or keywords.",
      "Build varied collections around a theme instead of duplicating one concept.",
    ],
    sources: [
      {
        label: "Adobe Stock Contributor portal",
        url: "https://stock.adobe.com/contributor",
      },
    ],
  },
  {
    title: "Intellectual property restrictions",
    facts: [
      "No logos, brand marks or trademarked symbols.",
      "No copyrighted characters or artwork.",
      "No depictions implying real newsworthy events you did not document.",
      "Identifiable people need model releases; recognizable private property needs property releases.",
    ],
    sources: [
      {
        label: "Adobe Help — Generative AI content (IP section)",
        url: "https://helpx.adobe.com/stock/contributor/help/generative-ai-content.html",
      },
    ],
  },
];
