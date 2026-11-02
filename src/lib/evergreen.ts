/* Evergreen (non-seasonal) content library for Adobe Stock contributors.
   Bilingual educational content: design concepts, format guides (EPS / PNG / JPG),
   upload process and sales playbook. Specs below reflect Adobe Stock contributor
   documentation as researched in October 2026 — always re-check Adobe's docs. */

export interface Bilingual {
  en: string;
  bn: string;
}

export interface EvergreenCategory {
  id: string;
  icon: string;
  stars: number; // 1-5 sales-potential rating
  title: Bilingual;
  blurb: Bilingual;
  concepts: Bilingual[];
}

export const EVERGREEN_CATEGORIES: EvergreenCategory[] = [
  {
    id: "business",
    icon: "Briefcase",
    stars: 5,
    title: { en: "Business & Finance", bn: "ব্যবসা ও ফাইন্যান্স" },
    blurb: {
      en: "The highest-demand evergreen niche: companies buy visuals all year for decks, sites and ads.",
      bn: "সবচেয়ে চাহিদাসম্পন্ন এভারগ্রিন নিশ: কোম্পানিগুলো সারা বছর ডেক, সাইট ও বিজ্ঞাপনের জন্য ভিজ্যুয়াল কেনে।",
    },
    concepts: [
      { en: "Diverse team meeting around a laptop (copy space on one side)", bn: "ল্যাপটপ ঘিরে ডাইভার্স টিম মিটিং (এক পাশে কপি স্পেস)" },
      { en: "Handshake close-up on clean background", bn: "পরিষ্কার ব্যাকগ্রাউন্ডে হ্যান্ডশেক ক্লোজ-আপ" },
      { en: "Rising finance charts and coins, minimal style", bn: "ঊর্ধ্বমুখী ফাইন্যান্স চার্ট ও কয়েন, মিনিমাল স্টাইল" },
      { en: "Startup founder at whiteboard with sticky notes", bn: "হোয়াইটবোর্ডে স্টিকি নোটসহ স্টার্টআপ ফাউন্ডার" },
      { en: "Home office desk flat lay, top view", bn: "হোম অফিস ডেস্ক ফ্ল্যাট লে, টপ ভিউ" },
    ],
  },
  {
    id: "technology",
    icon: "Cpu",
    stars: 5,
    title: { en: "Technology & AI", bn: "প্রযুক্তি ও এআই" },
    blurb: {
      en: "Perennial buyer demand from SaaS, blogs and tech media. Abstract concepts outsell literal gadgets.",
      bn: "SaaS, ব্লগ ও টেক মিডিয়ার চিরন্তন চাহিদা। গ্যাজেটের ছবির চেয়ে অ্যাবস্ট্রাক্ট কনসেপ্ট বেশি বিক্রি হয়।",
    },
    concepts: [
      { en: "Abstract AI neural network, glowing nodes", bn: "অ্যাবস্ট্রাক্ট এআই নিউরাল নেটওয়ার্ক, জ্বলজ্বলে নোড" },
      { en: "Cybersecurity shield with lock over circuit board", bn: "সার্কিট বোর্ডের উপর লকসহ সাইবারসিকিউরিটি শিল্ড" },
      { en: "Cloud upload/download isometric illustration", bn: "ক্লাউড আপলোড/ডাউনলোড আইসোমেট্রিক ইলাস্ট্রেশন" },
      { en: "Smartphone with blank screen for mockups", bn: "মকআপের জন্য ফাঁকা স্ক্রিনের স্মার্টফোন" },
      { en: "Data dashboard UI on dark background", bn: "ডার্ক ব্যাকগ্রাউন্ডে ডেটা ড্যাশবোর্ড UI" },
    ],
  },
  {
    id: "wellness",
    icon: "HeartPulse",
    stars: 4,
    title: { en: "Health & Wellness", bn: "স্বাস্থ্য ও ওয়েলনেস" },
    blurb: {
      en: "Fitness brands, clinics and wellness blogs buy constantly. Show real, diverse, achievable bodies.",
      bn: "ফিটনেস ব্র্যান্ড, ক্লিনিক ও ওয়েলনেস ব্লগ নিয়মিত কেনে। বাস্তব, ডাইভার্স, অর্জনযোগ্য শরীর দেখান।",
    },
    concepts: [
      { en: "Morning yoga stretch by a bright window", bn: "উজ্জ্বল জানালার পাশে সকালের ইয়োগা স্ট্রেচ" },
      { en: "Healthy breakfast bowl, top-down flat lay", bn: "স্বাস্থ্যকর ব্রেকফাস্ট বোল, টপ-ডাউন ফ্ল্যাট লে" },
      { en: "Runner tying shoes at sunrise", bn: "সূর্যোদয়ে জুতা বাঁধছেন রানার" },
      { en: "Mental wellness: calm desk with plant and tea", bn: "মানসিক প্রশান্তি: গাছ ও চাসহ শান্ত ডেস্ক" },
      { en: "Doctor consulting patient, warm tones", bn: "রোগীর সাথে পরামর্শরত ডাক্তার, উষ্ণ টোন" },
    ],
  },
  {
    id: "people",
    icon: "Users",
    stars: 5,
    title: { en: "People & Lifestyle", bn: "মানুষ ও লাইফস্টাইল" },
    blurb: {
      en: "Authentic diversity wins. Everyday moments with genuine emotion license again and again.",
      bn: "খাঁটি ডাইভার্সিটি জেতে। আসল আবেগের দৈনন্দিন মুহূর্ত বারবার লাইসেন্স হয়।",
    },
    concepts: [
      { en: "Multigenerational family cooking together", bn: "একসাথে রান্না করছে মাল্টিজেনারেশনাল পরিবার" },
      { en: "Senior couple walking in a park, back view", bn: "পার্কে হাঁটছেন বয়স্ক দম্পতি, পেছন থেকে" },
      { en: "Friends laughing over coffee", bn: "কফি হাতে হাসছেন বন্ধুরা" },
      { en: "Parent helping child with homework", bn: "সন্তানকে পড়ায় সাহায্য করছেন বাবা-মা" },
      { en: "Freelancer working from a balcony", bn: "ব্যালকনি থেকে কাজ করছেন ফ্রিল্যান্সার" },
    ],
  },
  {
    id: "backgrounds",
    icon: "Layers",
    stars: 4,
    title: { en: "Backgrounds & Textures", bn: "ব্যাকগ্রাউন্ড ও টেক্সচার" },
    blurb: {
      en: "Designers need flexible canvases daily. Simple, clean and copy-space-friendly beats busy.",
      bn: "ডিজাইনারদের প্রতিদিন ফ্লেক্সিবল ক্যানভাস দরকার। ব্যস্ত ডিজাইনের চেয়ে সহজ, পরিষ্কার ও কপি-স্পেসবান্ধব ভালো।",
    },
    concepts: [
      { en: "Soft gradient mesh in warm neutrals", bn: "উষ্ণ নিউট্রালে নরম গ্রেডিয়েন্ট মেশ" },
      { en: "Subtle geometric pattern, seamless tile", bn: "সূক্ষ্ম জ্যামিতিক প্যাটার্ন, সিমলেস টাইল" },
      { en: "Paper texture with gentle shadows", bn: "হালকা ছায়াসহ কাগজের টেক্সচার" },
      { en: "Bokeh light background, dark version too", bn: "বোকেহ লাইট ব্যাকগ্রাউন্ড, ডার্ক ভার্সনসহ" },
      { en: "Minimal wave lines, duotone", bn: "মিনিমাল ঢেউ রেখা, ডুয়োটোন" },
    ],
  },
  {
    id: "icons",
    icon: "BarChart3",
    stars: 5,
    title: { en: "Icons & Infographics", bn: "আইকন ও ইনফোগ্রাফিক" },
    blurb: {
      en: "Icon sets sell as packs. Consistent stroke, consistent grid — one style per set, 20+ icons.",
      bn: "আইকন সেট প্যাক হিসেবে বিক্রি হয়। একই স্ট্রোক, একই গ্রিড — প্রতি সেটে এক স্টাইল, ২০+ আইকন।",
    },
    concepts: [
      { en: "Business line-icon set (50 icons, 2px stroke)", bn: "বিজনেস লাইন-আইকন সেট (৫০টি আইকন, ২px স্ট্রোক)" },
      { en: "Healthcare icon pack, rounded style", bn: "হেলথকেয়ার আইকন প্যাক, রাউন্ডেড স্টাইল" },
      { en: "Infographic chart elements: bars, donuts, timelines", bn: "ইনফোগ্রাফিক চার্ট এলিমেন্ট: বার, ডোনাট, টাইমলাইন" },
      { en: "Social media icon set, minimal glyphs", bn: "সোশ্যাল মিডিয়া আইকন সেট, মিনিমাল গ্লিফ" },
      { en: "Education icons: books, graduation, e-learning", bn: "শিক্ষা আইকন: বই, গ্র্যাজুয়েশন, ই-লার্নিং" },
    ],
  },
  {
    id: "food",
    icon: "UtensilsCrossed",
    stars: 4,
    title: { en: "Food & Drink", bn: "খাবার ও পানীয়" },
    blurb: {
      en: "Restaurants, blogs and packaging need appetizing shots year-round. Natural light, simple props.",
      bn: "রেস্টুরেন্ট, ব্লগ ও প্যাকেজিংয়ের সারা বছর লোভনীয় ছবি দরকার। প্রাকৃতিক আলো, সহজ প্রপস।",
    },
    concepts: [
      { en: "Fresh ingredients flat lay on dark wood", bn: "ডার্ক কাঠের উপর তাজা উপকরণের ফ্ল্যাট লে" },
      { en: "Pouring coffee, motion freeze", bn: "কফি ঢালা হচ্ছে, মোশন ফ্রিজ" },
      { en: "Healthy salad bowl, vibrant colors", bn: "স্বাস্থ্যকর সালাদ বোল, প্রাণবন্ত রং" },
      { en: "Baker's hands kneading dough", bn: "ময়দা মাখছেন বেকারের হাত" },
      { en: "Spices in spoons, top view", bn: "চামচে মসলা, টপ ভিউ" },
    ],
  },
  {
    id: "nature",
    icon: "Mountain",
    stars: 3,
    title: { en: "Nature & Travel", bn: "প্রকৃতি ও ভ্রমণ" },
    blurb: {
      en: "Avoid seasonal markers (snow, autumn leaves) to stay evergreen. Generic beauty travels far.",
      bn: "এভারগ্রিন রাখতে মৌসুমি চিহ্ন (তুষার, শরতের পাতা) এড়িয়ে চলুন। সাধারণ সৌন্দর্য দূর যায়।",
    },
    concepts: [
      { en: "Tropical beach with palm shadows, no people", bn: "পাম ছায়াসহ ট্রপিক্যাল বিচ, মানুষ ছাড়া" },
      { en: "Green rice field under soft sky", bn: "নরম আকাশের নিচে সবুজ ধানক্ষেত" },
      { en: "Mountain lake reflection at dawn", bn: "ভোরে পাহাড়ি লেকের প্রতিফলন" },
      { en: "Monstera leaves close-up, copy space", bn: "মনস্টেরা পাতার ক্লোজ-আপ, কপি স্পেসসহ" },
      { en: "Winding road through hills, aerial", bn: "পাহাড়ের মধ্যে আঁকাবাঁকা রাস্তা, এরিয়াল" },
    ],
  },
];

export interface FormatGuide {
  id: "eps" | "png" | "jpg";
  tab: Bilingual;
  tagline: Bilingual;
  specs: { label: Bilingual; value: Bilingual }[];
  ideas: Bilingual[];
  tips: Bilingual[];
}

export const FORMAT_GUIDES: FormatGuide[] = [
  {
    id: "eps",
    tab: { en: "EPS Vector", bn: "EPS ভেক্টর" },
    tagline: {
      en: "Infinitely scalable, endlessly reusable. Adobe Stock accepts AI, EPS and SVG vectors.",
      bn: "অসীম স্কেলেবল, অফুরন্ত পুনঃব্যবহারযোগ্য। Adobe Stock AI, EPS ও SVG ভেক্টর নেয়।",
    },
    specs: [
      { label: { en: "Accepted formats", bn: "গৃহীত ফরম্যাট" }, value: { en: "AI, EPS, SVG", bn: "AI, EPS, SVG" } },
      { label: { en: "Artwork", bn: "আর্টওয়ার্ক" }, value: { en: "Clean paths, expanded strokes, organized layers", bn: "পরিষ্কার পাথ, এক্সপান্ডেড স্ট্রোক, গোছানো লেয়ার" } },
      { label: { en: "Text", bn: "টেক্সট" }, value: { en: "Convert all text to outlines", bn: "সব টেক্সট আউটলাইনে রূপান্তর করুন" } },
      { label: { en: "Best sellers", bn: "সেরা বিক্রি" }, value: { en: "Icon sets, patterns, infographics, backgrounds", bn: "আইকন সেট, প্যাটার্ন, ইনফোগ্রাফিক, ব্যাকগ্রাউন্ড" } },
    ],
    ideas: [
      { en: "Sell icon sets as packs (20–50 icons, one consistent style)", bn: "আইকন সেট প্যাক হিসেবে বিক্রি করুন (২০–৫০টি, একই স্টাইল)" },
      { en: "Seamless patterns: floral, geometric, abstract", bn: "সিমলেস প্যাটার্ন: ফ্লোরাল, জ্যামিতিক, অ্যাবস্ট্রাক্ট" },
      { en: "Infographic template kits with editable charts", bn: "এডিটেবল চার্টসহ ইনফোগ্রাফিক টেমপ্লেট কিট" },
      { en: "Line-art illustrations for business and education", bn: "ব্যবসা ও শিক্ষার জন্য লাইন-আর্ট ইলাস্ট্রেশন" },
      { en: "Badges, labels and sticker packs", bn: "ব্যাজ, লেবেল ও স্টিকার প্যাক" },
    ],
    tips: [
      { en: "One style per set — buyers purchase the whole pack for consistency.", bn: "প্রতি সেটে এক স্টাইল — ক্রেতারা সামঞ্জস্যের জন্য পুরো প্যাক কেনে।" },
      { en: "Offer color variations of the same set as separate files.", bn: "একই সেটের রঙের ভ্যারিয়েশন আলাদা ফাইল হিসেবে দিন।" },
      { en: "No embedded raster images, no logos, no trademarked shapes.", bn: "এমবেডেড রাস্টার ছবি, লোগো বা ট্রেডমার্ক আকৃতি নয়।" },
    ],
  },
  {
    id: "png",
    tab: { en: "PNG (Transparent)", bn: "PNG (ট্রান্সপারেন্ট)" },
    tagline: {
      en: "Isolated objects on transparent backgrounds — designers drag, drop and composite them instantly.",
      bn: "ট্রান্সপারেন্ট ব্যাকগ্রাউন্ডে বিচ্ছিন্ন অবজেক্ট — ডিজাইনাররা টেনে এনে সাথে সাথে বসিয়ে দিতে পারে।",
    },
    specs: [
      { label: { en: "Background", bn: "ব্যাকগ্রাউন্ড" }, value: { en: "Transparent (None)", bn: "ট্রান্সপারেন্ট (None)" } },
      { label: { en: "Color mode", bn: "কালার মোড" }, value: { en: "sRGB", bn: "sRGB" } },
      { label: { en: "Resolution", bn: "রেজোলিউশন" }, value: { en: "Minimum 4 MP", bn: "সর্বনিম্ন 4 MP" } },
      { label: { en: "Best sellers", bn: "সেরা বিক্রি" }, value: { en: "Isolated icons, stickers, UI elements, badges", bn: "বিচ্ছিন্ন আইকন, স্টিকার, UI এলিমেন্ট, ব্যাজ" } },
    ],
    ideas: [
      { en: "Isolated 3D-style icons: mail, chat, cart, settings", bn: "বিচ্ছিন্ন 3D-স্টাইল আইকন: মেইল, চ্যাট, কার্ট, সেটিংস" },
      { en: "Sticker packs with white outline borders", bn: "সাদা আউটলাইন বর্ডারসহ স্টিকার প্যাক" },
      { en: "UI elements: buttons, toggles, badges, ribbons", bn: "UI এলিমেন্ট: বোতাম, টগল, ব্যাজ, রিবন" },
      { en: "Isolated food and product cutouts", bn: "বিচ্ছিন্ন খাবার ও প্রোডাক্ট কাটআউট" },
      { en: "Hand-drawn doodle elements pack", bn: "হাতে-আঁকা ডুডল এলিমেন্ট প্যাক" },
    ],
    tips: [
      { en: "Pixel-perfect clean edges — halos and fringes get rejected.", bn: "নিখুঁত পরিষ্কার এজ — হ্যালো ও ফ্রিঞ্জ রিজেক্ট হয়।" },
      { en: "Consistent lighting and angle across a pack.", bn: "পুরো প্যাকে একই লাইটিং ও অ্যাঙ্গেল।" },
      { en: "Keyword the use-case: 'sticker', 'icon', 'isolated', 'cutout'.", bn: "ব্যবহার-কেস দিয়ে কিওয়ার্ড দিন: 'sticker', 'icon', 'isolated', 'cutout'।" },
    ],
  },
  {
    id: "jpg",
    tab: { en: "JPG (Photo / Raster)", bn: "JPG (ফটো / রাস্টার)" },
    tagline: {
      en: "The volume format: photos and raster illustrations. Sharp, well-lit, minimum 4 megapixels.",
      bn: "ভলিউম ফরম্যাট: ফটো ও রাস্টার ইলাস্ট্রেশন। শার্প, ভালো আলো, সর্বনিম্ন ৪ মেগাপিক্সেল।",
    },
    specs: [
      { label: { en: "Color mode", bn: "কালার মোড" }, value: { en: "sRGB", bn: "sRGB" } },
      { label: { en: "Resolution", bn: "রেজোলিউশন" }, value: { en: "Minimum 4 MP, max 45 MB", bn: "সর্বনিম্ন 4 MP, সর্বোচ্চ 45 MB" } },
      { label: { en: "Quality", bn: "কোয়ালিটি" }, value: { en: "Sharp focus, no noise, no watermark", bn: "শার্প ফোকাস, নয়েজ নেই, ওয়াটারমার্ক নেই" } },
      { label: { en: "Best sellers", bn: "সেরা বিক্রি" }, value: { en: "Lifestyle, business, flat lays, textures", bn: "লাইফস্টাইল, বিজনেস, ফ্ল্যাট লে, টেক্সচার" } },
    ],
    ideas: [
      { en: "Authentic lifestyle series: same models, many scenarios", bn: "খাঁটি লাইফস্টাইল সিরিজ: একই মডেল, অনেক দৃশ্য" },
      { en: "Flat lays with copy space for text overlays", bn: "টেক্সট ওভারলের জন্য কপি স্পেসসহ ফ্ল্যাট লে" },
      { en: "Texture close-ups: wood, fabric, stone, paper", bn: "টেক্সচার ক্লোজ-আপ: কাঠ, কাপড়, পাথর, কাগজ" },
      { en: "Business portraits with clean backgrounds", bn: "পরিষ্কার ব্যাকগ্রাউন্ডে বিজনেস পোর্ট্রেট" },
      { en: "Season-neutral landscapes and cityscapes", bn: "ঋতুনিরপেক্ষ ল্যান্ডস্কেপ ও সিটিস্কেপ" },
    ],
    tips: [
      { en: "Shoot series, not singles — 5–10 variations of each setup.", bn: "একক নয়, সিরিজ তুলুন — প্রতি সেটআপের ৫–১০টি ভ্যারিয়েশন।" },
      { en: "Model and property releases: no recognizable face or brand without one.", bn: "মডেল ও প্রপার্টি রিলিজ: রিলিজ ছাড়া চেনা মুখ বা ব্র্যান্ড নয়।" },
      { en: "If AI-generated, always tick the 'Created using generative AI tools' checkbox.", bn: "AI-জেনারেটেড হলে 'Created using generative AI tools' চেকবক্সে টিক দিন।" },
    ],
  },
];

export interface UploadStep {
  title: Bilingual;
  body: Bilingual;
}

export const UPLOAD_STEPS: UploadStep[] = [
  {
    title: { en: "Prepare to spec", bn: "স্পেসিফিকেশন অনুযায়ী প্রস্তুত করুন" },
    body: {
      en: "sRGB color, minimum 4 MP, max 45 MB. Vectors: clean paths, outlined text. PNGs: truly transparent background.",
      bn: "sRGB কালার, সর্বনিম্ন 4 MP, সর্বোচ্চ 45 MB। ভেক্টর: পরিষ্কার পাথ, আউটলাইন টেক্সট। PNG: সত্যিকারের ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড।",
    },
  },
  {
    title: { en: "Upload", bn: "আপলোড করুন" },
    body: {
      en: "Use the contributor portal web uploader (or FTP for batches). Upload in themed batches to keyword faster.",
      bn: "কন্ট্রিবিউটর পোর্টালের ওয়েব আপলোডার ব্যবহার করুন (ব্যাচের জন্য FTP)। দ্রুত কিওয়ার্ডের জন্য থিমভিত্তিক ব্যাচে আপলোড করুন।",
    },
  },
  {
    title: { en: "Write buyer-language titles", bn: "ক্রেতার ভাষায় টাইটেল লিখুন" },
    body: {
      en: "Describe what it is and how it is used: 'Diverse business team meeting in modern office with copy space'.",
      bn: "এটা কী এবং কীভাবে ব্যবহৃত হয় তা লিখুন: 'কপি স্পেসসহ আধুনিক অফিসে ডাইভার্স বিজনেস টিম মিটিং'।",
    },
  },
  {
    title: { en: "Keyword smart (max 25)", bn: "বুদ্ধিমানের কিওয়ার্ড (সর্বোচ্চ ২৫)" },
    body: {
      en: "The first 10 keywords matter most. Think like a buyer: what would a designer type to find this?",
      bn: "প্রথম ১০টি কিওয়ার্ড সবচেয়ে গুরুত্বপূর্ণ। ক্রেতার মতো ভাবুন: ডিজাইনার এটা খুঁজতে কী লিখবে?",
    },
  },
  {
    title: { en: "Category and releases", bn: "ক্যাটাগরি ও রিলিজ" },
    body: {
      en: "Pick the closest category. Attach model releases for recognizable people and property releases for brands.",
      bn: "সবচেয়ে কাছের ক্যাটাগরি বেছে নিন। চেনা মানুষের জন্য মডেল রিলিজ, ব্র্যান্ডের জন্য প্রপার্টি রিলিজ সংযুক্ত করুন।",
    },
  },
  {
    title: { en: "Disclose AI use", bn: "AI ব্যবহার ঘোষণা করুন" },
    body: {
      en: "If any generative AI tool touched the file, tick 'Created using generative AI tools' — it is mandatory.",
      bn: "ফাইলে কোনো জেনারেটিভ AI টুলের ছোঁয়া থাকলে 'Created using generative AI tools'-এ টিক দিন — এটা বাধ্যতামূলক।",
    },
  },
  {
    title: { en: "Submit and track", bn: "সাবমিট ও ট্র্যাক করুন" },
    body: {
      en: "Review usually takes a few days. Rejections are feedback: fix the stated reason and resubmit better files.",
      bn: "রিভিউতে সাধারণত কয়েক দিন লাগে। রিজেকশন মানে ফিডব্যাক: কারণ ঠিক করে আরও ভালো ফাইল আবার দিন।",
    },
  },
];

export interface SalesPlay {
  title: Bilingual;
  body: Bilingual;
}

export const SALES_PLAYS: SalesPlay[] = [
  {
    title: { en: "Design with copy space", bn: "কপি স্পেস রেখে ডিজাইন করুন" },
    body: {
      en: "Buyers add headlines and logos. Leave clean, uncluttered areas — files with text room license far more often.",
      bn: "ক্রেতারা হেডলাইন ও লোগো বসায়। পরিষ্কার ফাঁকা জায়গা রাখুন — টেক্সট-রুমসহ ফাইল অনেক বেশি লাইসেন্স হয়।",
    },
  },
  {
    title: { en: "Think in series, not singles", bn: "একক নয়, সিরিজ ভাবুন" },
    body: {
      en: "One concept, many executions: angles, colors, crops, with and without people. Series lift each other's sales.",
      bn: "এক কনসেপ্ট, অনেক রূপ: অ্যাঙ্গেল, রং, ক্রপ, মানুষসহ ও ছাড়া। সিরিজ একে অপরের বিক্রি বাড়ায়।",
    },
  },
  {
    title: { en: "The 70/30 portfolio rule", bn: "৭০/৩০ পোর্টফোলিও নিয়ম" },
    body: {
      en: "Keep roughly 70% evergreen for steady income and 30% seasonal for spikes. Evergreen pays the bills.",
      bn: "স্থির আয়ের জন্য প্রায় ৭০% এভারগ্রিন, স্পাইকের জন্য ৩০% সিজনাল রাখুন। এভারগ্রিনই বিল মেটায়।",
    },
  },
  {
    title: { en: "Keyword like a buyer", bn: "ক্রেতার মতো কিওয়ার্ড দিন" },
    body: {
      en: "Nobody searches 'beautiful'. They search 'team meeting office copy space'. Concrete, commercial, specific.",
      bn: "কেউ 'beautiful' লিখে খোঁজে না। খোঁজে 'team meeting office copy space'। কংক্রিট, বাণিজ্যিক, নির্দিষ্ট।",
    },
  },
  {
    title: { en: "Upload consistently", bn: "নিয়মিত আপলোড করুন" },
    body: {
      en: "Portfolios that grow weekly compound. Set a rhythm — e.g. 20 files every Friday — and protect it.",
      bn: "যে পোর্টফোলিও প্রতি সপ্তাহে বাড়ে তা চক্রবৃদ্ধি হয়। একটা ছন্দ ঠিক করুন — যেমন প্রতি শুক্রবার ২০টা ফাইল — এবং ধরে রাখুন।",
    },
  },
  {
    title: { en: "Dodge the rejection traps", bn: "রিজেকশনের ফাঁদ এড়িয়ে চলুন" },
    body: {
      en: "No logos, no trademarks, no recognizable faces without releases, no noise or watermarks. Clean files pass.",
      bn: "লোগো নয়, ট্রেডমার্ক নয়, রিলিজ ছাড়া চেনা মুখ নয়, নয়েজ বা ওয়াটারমার্ক নয়। পরিষ্কার ফাইল পাস করে।",
    },
  },
];
