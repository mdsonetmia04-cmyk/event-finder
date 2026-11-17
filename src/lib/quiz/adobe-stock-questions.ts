/* Adobe Stock Quiz Battle — question bank.
   Facts: Adobe Stock Contributor help documentation only (see the source URLs
   in src/data/contributor-facts.ts). Never invent specs.
   NOTE (2026-11-17): Adobe's current "Titles and keywords" help page allows
   up to 49 keywords per asset — that is the figure used in Q09. */

export interface QuizQuestion {
  id: string;
  topic: string;
  topicBn: string;
  q: string;
  qBn: string;
  options: string[];
  optionsBn: string[];
  /** Index of the correct option in `options` / `optionsBn`. */
  answer: number;
  explanation: string;
  explanationBn: string;
}

export const ADOBE_STOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: "Q01",
    topic: "Photos",
    topicBn: "ছবি",
    q: "Which file format must photos be saved in for Adobe Stock?",
    qBn: "অ্যাডোবি স্টকের জন্য ছবি কোন ফাইল ফরম্যাটে সংরক্ষণ করতে হয়?",
    options: ["JPEG", "PNG", "TIFF", "GIF"],
    optionsBn: ["JPEG", "PNG", "TIFF", "GIF"],
    answer: 0,
    explanation: "Adobe Stock accepts photos only as JPEG files with an sRGB color profile.",
    explanationBn: "অ্যাডোবি স্টক ছবি শুধু sRGB কালার প্রোফাইলসহ JPEG ফাইল হিসেবে গ্রহণ করে।",
  },
  {
    id: "Q02",
    topic: "Photos",
    topicBn: "ছবি",
    q: "What is the minimum resolution for a photo submitted to Adobe Stock?",
    qBn: "অ্যাডোবি স্টকে জমা দেওয়া ছবির সর্বনিম্ন রেজোলিউশন কত?",
    options: ["1 megapixel", "2 megapixels", "4 megapixels", "12 megapixels"],
    optionsBn: ["১ মেগাপিক্সেল", "২ মেগাপিক্সেল", "৪ মেগাপিক্সেল", "১২ মেগাপিক্সেল"],
    answer: 2,
    explanation: "Photos must be at least 4 megapixels and at most 100 megapixels.",
    explanationBn: "ছবি কমপক্ষে ৪ মেগাপিক্সেল এবং সর্বোচ্চ ১০০ মেগাপিক্সেল হতে হবে।",
  },
  {
    id: "Q03",
    topic: "Photos",
    topicBn: "ছবি",
    q: "Which color profile should your photos use?",
    qBn: "আপনার ছবিতে কোন কালার প্রোফাইল ব্যবহার করা উচিত?",
    options: ["Adobe RGB", "CMYK", "ProPhoto RGB", "sRGB"],
    optionsBn: ["Adobe RGB", "CMYK", "ProPhoto RGB", "sRGB"],
    answer: 3,
    explanation: "Adobe Stock requires the sRGB color profile for photos.",
    explanationBn: "অ্যাডোবি স্টকের ছবির জন্য sRGB কালার প্রোফাইল প্রয়োজন।",
  },
  {
    id: "Q04",
    topic: "Photos",
    topicBn: "ছবি",
    q: "What is the maximum file size for a photo submission?",
    qBn: "ছবি জমা দেওয়ার ক্ষেত্রে সর্বোচ্চ ফাইল সাইজ কত?",
    options: ["10 MB", "45 MB", "100 MB", "5 MB"],
    optionsBn: ["১০ MB", "৪৫ MB", "১০০ MB", "৫ MB"],
    answer: 1,
    explanation: "Photo files must be 45 MB or smaller.",
    explanationBn: "ছবির ফাইল ৪৫ MB বা তার কম হতে হবে।",
  },
  {
    id: "Q05",
    topic: "Vectors",
    topicBn: "ভেক্টর",
    q: "Which file formats does Adobe Stock accept for vectors?",
    qBn: "ভেক্টরের জন্য অ্যাডোবি স্টক কোন ফাইল ফরম্যাট গ্রহণ করে?",
    options: ["PNG and JPEG", "PDF only", "AI, EPS and SVG", "ZIP folders"],
    optionsBn: ["PNG ও JPEG", "শুধু PDF", "AI, EPS ও SVG", "ZIP ফোল্ডার"],
    answer: 2,
    explanation:
      "Vectors must be submitted as AI, EPS or SVG files. Vectors saved in ZIP folders or uploaded as JPEGs are not accepted.",
    explanationBn:
      "ভেক্টর AI, EPS বা SVG ফাইল হিসেবে জমা দিতে হয়। ZIP ফোল্ডারে সংরক্ষিত বা JPEG হিসেবে আপলোড করা ভেক্টর গ্রহণ করা হয় না।",
  },
  {
    id: "Q06",
    topic: "Releases",
    topicBn: "রিলিজ",
    q: "When is a model release required?",
    qBn: "মডেল রিলিজ কখন প্রয়োজন হয়?",
    options: [
      "Only for photos of celebrities",
      "When a person in the content is recognizable",
      "Only for videos",
      "Never, if the photo is yours",
    ],
    optionsBn: [
      "শুধু সেলিব্রিটিদের ছবির ক্ষেত্রে",
      "কনটেন্টে থাকা কোনো ব্যক্তিকে চেনা গেলে",
      "শুধু ভিডিওর ক্ষেত্রে",
      "ছবিটি আপনার হলে কখনোই নয়",
    ],
    answer: 1,
    explanation:
      "Any identifiable person needs a signed model release — recognition can come from the face, tattoos, clothing or context.",
    explanationBn:
      "চেনা যায় এমন যেকোনো ব্যক্তির জন্য স্বাক্ষরিত মডেল রিলিজ দরকার — মুখ, ট্যাটু, পোশাক বা প্রেক্ষাপট দিয়েও কাউকে চেনা যেতে পারে।",
  },
  {
    id: "Q07",
    topic: "Releases",
    topicBn: "রিলিজ",
    q: "When is a property release required?",
    qBn: "প্রপার্টি রিলিজ কখন প্রয়োজন হয়?",
    options: [
      "For every outdoor photo",
      "Only for photos of cars",
      "Never for buildings",
      "When recognizable private property appears",
    ],
    optionsBn: [
      "প্রতিটি আউটডোর ছবির জন্য",
      "শুধু গাড়ির ছবির জন্য",
      "ভবনের জন্য কখনোই নয়",
      "চেনা যায় এমন ব্যক্তিগত সম্পত্তি দেখা গেলে",
    ],
    answer: 3,
    explanation:
      "Recognizable private property — such as a distinctive home, interior or artwork — needs a signed property release.",
    explanationBn:
      "চেনা যায় এমন ব্যক্তিগত সম্পত্তি — যেমন স্বতন্ত্র বাড়ি, ইন্টেরিয়র বা শিল্পকর্ম — এর জন্য স্বাক্ষরিত প্রপার্টি রিলিজ দরকার।",
  },
  {
    id: "Q08",
    topic: "Releases",
    topicBn: "রিলিজ",
    q: "Who must sign the model release when the model is under 18?",
    qBn: "মডেলের বয়স ১৮ বছরের কম হলে মডেল রিলিজে কে স্বাক্ষর করবেন?",
    options: ["The child", "The photographer only", "Any adult witness", "A parent or legal guardian"],
    optionsBn: ["শিশুটি নিজে", "শুধু ফটোগ্রাফার", "যেকোনো প্রাপ্তবয়স্ক সাক্ষী", "বাবা-মা বা আইনি অভিভাবক"],
    answer: 3,
    explanation:
      "Minors cannot give legal consent, so a parent or legal guardian must sign the release on their behalf.",
    explanationBn:
      "অপ্রাপ্তবয়স্করা আইনি সম্মতি দিতে পারে না, তাই তাদের পক্ষে বাবা-মা বা আইনি অভিভাবককে রিলিজে স্বাক্ষর করতে হয়।",
  },
  {
    id: "Q09",
    topic: "Keywords",
    topicBn: "কীওয়ার্ড",
    q: "What is the maximum number of keywords you can add to an asset?",
    qBn: "একটি অ্যাসেটে সর্বোচ্চ কয়টি কীওয়ার্ড যোগ করা যায়?",
    options: ["10", "25", "49", "100"],
    optionsBn: ["১০টি", "২৫টি", "৪৯টি", "১০০টি"],
    answer: 2,
    explanation:
      "Adobe Stock allows up to 49 keywords per asset — but 15 to 25 relevant ones are usually plenty.",
    explanationBn:
      "অ্যাডোবি স্টকে প্রতিটি অ্যাসেটে সর্বোচ্চ ৪৯টি কীওয়ার্ড দেওয়া যায় — তবে ১৫ থেকে ২৫টি প্রাসঙ্গিক কীওয়ার্ডই সাধারণত যথেষ্ট।",
  },
  {
    id: "Q10",
    topic: "Keywords",
    topicBn: "কীওয়ার্ড",
    q: "Which keywords matter most in Adobe Stock search?",
    qBn: "অ্যাডোবি স্টক সার্চে কোন কীওয়ার্ডগুলো সবচেয়ে গুরুত্বপূর্ণ?",
    options: [
      "The first 10 keywords",
      "The last 10 keywords",
      "Keywords in alphabetical order",
      "All keywords equally",
    ],
    optionsBn: ["প্রথম ১০টি কীওয়ার্ড", "শেষ ১০টি কীওয়ার্ড", "বর্ণানুক্রমিক কীওয়ার্ড", "সব কীওয়ার্ড সমান গুরুত্বপূর্ণ"],
    answer: 0,
    explanation:
      "Adobe's search gives the most weight to your first 10 keywords, so put the most important terms first.",
    explanationBn:
      "অ্যাডোবি সার্চ প্রথম ১০টি কীওয়ার্ডকে সবচেয়ে বেশি গুরুত্ব দেয়, তাই সবচেয়ে গুরুত্বপূর্ণ শব্দগুলো প্রথমে রাখুন।",
  },
  {
    id: "Q11",
    topic: "Keywords",
    topicBn: "কীওয়ার্ড",
    q: "What happens if you add popular but irrelevant keywords to your content?",
    qBn: "জনপ্রিয় কিন্তু অপ্রাসঙ্গিক কীওয়ার্ড যোগ করলে কী হয়?",
    options: [
      "It gets more downloads",
      "Nothing — keywords don't matter",
      "Adobe adds a bonus",
      "Your content can be rejected",
    ],
    optionsBn: [
      "ডাউনলোড বেড়ে যায়",
      "কিছুই হয় না — কীওয়ার্ড গুরুত্বপূর্ণ নয়",
      "অ্যাডোবি বোনাস দেয়",
      "আপনার কনটেন্ট বাতিল হতে পারে",
    ],
    answer: 3,
    explanation:
      "Irrelevant or misleading keywords can lead to rejection, and repeat offenders may have their accounts blocked.",
    explanationBn:
      "অপ্রাসঙ্গিক বা বিভ্রান্তিকর কীওয়ার্ডের কারণে কনটেন্ট বাতিল হতে পারে, আর বারবার এমন করলে অ্যাকাউন্ট ব্লকও হতে পারে।",
  },
  {
    id: "Q12",
    topic: "Titles",
    topicBn: "টাইটেল",
    q: "How long should an Adobe Stock title ideally be?",
    qBn: "অ্যাডোবি স্টকের টাইটেল আদর্শভাবে কত বড় হওয়া উচিত?",
    options: ["Over 200 characters", "Exactly 100 characters", "As long as possible", "Under 70 characters"],
    optionsBn: ["২০০ অক্ষরের বেশি", "ঠিক ১০০ অক্ষর", "যত বড় সম্ভব", "৭০ অক্ষরের কম"],
    answer: 3,
    explanation:
      "Adobe recommends keeping titles short — ideally under 70 characters. Longer titles may be automatically shortened.",
    explanationBn:
      "অ্যাডোবি টাইটেল ছোট রাখার পরামর্শ দেয় — আদর্শভাবে ৭০ অক্ষরের কম। বড় টাইটেল স্বয়ংক্রিয়ভাবে ছোট করে ফেলা হতে পারে।",
  },
  {
    id: "Q13",
    topic: "Titles",
    topicBn: "টাইটেল",
    q: "Which is a good Adobe Stock title?",
    qBn: "কোনটি একটি ভালো অ্যাডোবি স্টক টাইটেল?",
    options: [
      "dog beach sunset golden retriever summer fun vacation",
      "Family playing with their golden retriever at the beach",
      "Amazing beautiful stunning photo!!!",
      "IMG_2026_001",
    ],
    // Titles are written in the account language; the examples stay in English in both languages.
    optionsBn: [
      "dog beach sunset golden retriever summer fun vacation",
      "Family playing with their golden retriever at the beach",
      "Amazing beautiful stunning photo!!!",
      "IMG_2026_001",
    ],
    answer: 1,
    explanation:
      "A title should be a natural, descriptive phrase. Keyword strings, praise words and filenames get flagged by reviewers.",
    explanationBn:
      "টাইটেল হওয়া উচিত একটি স্বাভাবিক, বর্ণনামূলক বাক্যাংশ। কীওয়ার্ডের সারি, প্রশংসাসূচক শব্দ বা ফাইলের নাম রিভিউয়াররা ফ্ল্যাগ করেন।",
  },
  {
    id: "Q14",
    topic: "Metadata",
    topicBn: "মেটাডেটা",
    q: "Which language rule applies to your titles and keywords?",
    qBn: "টাইটেল ও কীওয়ার্ডের ক্ষেত্রে কোন ভাষার নিয়ম প্রযোজ্য?",
    options: [
      "Mix two languages for more reach",
      "Always write in the buyer's language",
      "Use one language only, matching your account setting",
      "Language does not matter",
    ],
    optionsBn: [
      "বেশি রিচের জন্য দুটি ভাষা মেশান",
      "সবসময় ক্রেতার ভাষায় লিখুন",
      "একটিই ভাষা ব্যবহার করুন, অ্যাকাউন্ট সেটিংসের সাথে মিলিয়ে",
      "ভাষা গুরুত্বপূর্ণ নয়",
    ],
    answer: 2,
    explanation:
      "Adobe requires titles and keywords in a single language that matches your contributor account setting. Search translates them automatically.",
    explanationBn:
      "অ্যাডোবি চায় টাইটেল ও কীওয়ার্ড একটি মাত্র ভাষায় হোক, যা আপনার কন্ট্রিবিউটর অ্যাকাউন্টের সেটিংসের সাথে মেলে। সার্চ সেগুলো স্বয়ংক্রিয়ভাবে অনুবাদ করে।",
  },
  {
    id: "Q15",
    topic: "Review",
    topicBn: "রিভিউ",
    q: "What is one of the most common reasons Adobe Stock rejects photos?",
    qBn: "অ্যাডোবি স্টক ছবি বাতিল করার সবচেয়ে সাধারণ কারণগুলোর একটি কী?",
    options: [
      "Too many downloads",
      "Quality issues like poor focus, noise or artifacts",
      "The photo is too colorful",
      "Uploading on weekends",
    ],
    optionsBn: [
      "অতিরিক্ত ডাউনলোড",
      "ফোকাস খারাপ, নয়েজ বা আর্টিফ্যাক্টের মতো মানের সমস্যা",
      "ছবিটি অতিরিক্ত রঙিন",
      "সপ্তাহান্তে আপলোড করা",
    ],
    answer: 1,
    explanation:
      "Reviewers reject content with soft focus, visible noise, compression artifacts or poor lighting. Always check your files at 100% zoom.",
    explanationBn:
      "নরম ফোকাস, দৃশ্যমান নয়েজ, কমপ্রেশন আর্টিফ্যাক্ট বা খারাপ আলোর কনটেন্ট রিভিউয়াররা বাতিল করেন। জমা দেওয়ার আগে ১০০% জুমে ফাইল যাচাই করুন।",
  },
  {
    id: "Q16",
    topic: "Review",
    topicBn: "রিভিউ",
    q: "Which of these must NEVER appear in a submitted photo?",
    qBn: "জমা দেওয়া ছবিতে কোনটি কখনোই থাকা যাবে না?",
    options: [
      "Natural sunlight",
      "A blurred background",
      "A smiling person",
      "A watermark or timestamp",
    ],
    optionsBn: ["প্রাকৃতিক সূর্যের আলো", "ঝাপসা ব্যাকগ্রাউন্ড", "হাসিমুখ মানুষ", "ওয়াটারমার্ক বা টাইমস্ট্যাম্প"],
    answer: 3,
    explanation: "Watermarks, timestamps, logos and branding are not allowed in submitted content.",
    explanationBn: "জমা দেওয়া কনটেন্টে ওয়াটারমার্ক, টাইমস্ট্যাম্প, লোগো ও ব্র্যান্ডিং অনুমোদিত নয়।",
  },
  {
    id: "Q17",
    topic: "AI Content",
    topicBn: "AI কনটেন্ট",
    q: "What must you do when submitting AI-generated content to Adobe Stock?",
    qBn: "AI দিয়ে তৈরি কনটেন্ট অ্যাডোবি স্টকে জমা দেওয়ার সময় আপনাকে কী করতে হবে?",
    options: [
      "Hide that it is AI-generated",
      "Submit it as a photograph",
      "Check the “Created using generative AI tools” box",
      "Add the AI tool's name to the title",
    ],
    optionsBn: [
      "এটি AI দিয়ে তৈরি তা গোপন করুন",
      "ফটোগ্রাফ হিসেবে জমা দিন",
      "“Created using generative AI tools” বাক্সে টিক দিন",
      "টাইটেলে AI টুলের নাম যোগ করুন",
    ],
    answer: 2,
    explanation: "The generative-AI checkbox is required for ALL AI-created content — always.",
    explanationBn: "AI দিয়ে তৈরি সব কনটেন্টের জন্য জেনারেটিভ AI চেকবক্স বাধ্যতামূলক — সবসময়।",
  },
  {
    id: "Q18",
    topic: "AI Content",
    topicBn: "AI কনটেন্ট",
    q: "Which AI-generated content is NOT allowed on Adobe Stock?",
    qBn: "কোন AI-তৈরি কনটেন্ট অ্যাডোবি স্টকে অনুমোদিত নয়?",
    options: [
      "A fantasy landscape",
      "An image depicting a real celebrity",
      "A cute cartoon animal",
      "An abstract pattern",
    ],
    optionsBn: ["কাল্পনিক ল্যান্ডস্কেপ", "বাস্তব সেলিব্রিটিকে দেখানো ছবি", "মিষ্টি কার্টুন প্রাণী", "অ্যাবস্ট্রাক্ট প্যাটার্ন"],
    answer: 1,
    explanation:
      "AI content must not depict real people, fictional characters, copyrighted works or third-party intellectual property.",
    explanationBn:
      "AI কনটেন্টে বাস্তব মানুষ, কাল্পনিক চরিত্র, কপিরাইটযুক্ত কাজ বা তৃতীয় পক্ষের মেধাসম্পদ দেখানো যাবে না।",
  },
  {
    id: "Q19",
    topic: "AI Content",
    topicBn: "AI কনটেন্ট",
    q: "Which of these is prohibited in AI prompts, titles and keywords?",
    qBn: "AI প্রম্পট, টাইটেল ও কীওয়ার্ডে কোনটি নিষিদ্ধ?",
    options: ["Colors", "Seasons", "Artist names", "Moods"],
    optionsBn: ["রং", "ঋতু", "শিল্পীদের নাম", "মেজাজ"],
    answer: 2,
    explanation:
      "Artist names, real people, fictional characters, copyrighted works and government agencies are prohibited in AI prompts, titles and keywords.",
    explanationBn:
      "AI প্রম্পট, টাইটেল ও কীওয়ার্ডে শিল্পীদের নাম, বাস্তব মানুষ, কাল্পনিক চরিত্র, কপিরাইটযুক্ত কাজ ও সরকারি সংস্থার নাম নিষিদ্ধ।",
  },
  {
    id: "Q20",
    topic: "AI Content",
    topicBn: "AI কনটেন্ট",
    q: "When is AI labeling NOT required?",
    qBn: "কখন AI লেবেলিং প্রয়োজন হয় না?",
    options: [
      "When AI only extended the background or removed a distraction",
      "When AI created the main subject",
      "When AI generated the whole image",
      "When AI added a new person",
    ],
    optionsBn: [
      "AI শুধু ব্যাকগ্রাউন্ড বাড়িয়েছে বা বিভ্রান্তিকর কিছু সরিয়েছে",
      "AI প্রধান বিষয়বস্তু তৈরি করেছে",
      "AI পুরো ছবিটি তৈরি করেছে",
      "AI নতুন একজন মানুষ যোগ করেছে",
    ],
    answer: 0,
    explanation:
      "Labeling is not required for background extension, removing IP, or retouching distractions — only when AI changed, augmented or added a new primary subject.",
    explanationBn:
      "ব্যাকগ্রাউন্ড এক্সটেনশন, IP অপসারণ বা বিভ্রান্তিকর উপাদান রিটাচের জন্য লেবেলিং দরকার হয় না — শুধু তখনই দরকার যখন AI প্রধান বিষয়বস্তু পরিবর্তন, বৃদ্ধি বা যোগ করেছে।",
  },
  {
    id: "Q21",
    topic: "Content Rules",
    topicBn: "কনটেন্ট নিয়ম",
    q: "Which content would Adobe Stock reject for intellectual property reasons?",
    qBn: "মেধাসম্পদজনিত কারণে অ্যাডোবি স্টক কোন কনটেন্ট বাতিল করবে?",
    options: [
      "A photo of a sunset",
      "A photo of your own sketch",
      "A photo with a clearly visible brand logo",
      "A photo of clouds",
    ],
    optionsBn: ["সূর্যাস্তের ছবি", "আপনার নিজের স্কেচের ছবি", "স্পষ্টভাবে দৃশ্যমান ব্র্যান্ড লোগোসহ ছবি", "মেঘের ছবি"],
    answer: 2,
    explanation: "Logos, brand marks, trademarked symbols and copyrighted characters are not allowed.",
    explanationBn: "লোগো, ব্র্যান্ড চিহ্ন, ট্রেডমার্কযুক্ত প্রতীক ও কপিরাইটযুক্ত চরিত্র অনুমোদিত নয়।",
  },
  {
    id: "Q22",
    topic: "Content Rules",
    topicBn: "কনটেন্ট নিয়ম",
    q: "How many significant variations of the same motif should you submit at most?",
    qBn: "একই মোটিফের সর্বোচ্চ কয়টি উল্লেখযোগ্য ভিন্নতা জমা দেওয়া উচিত?",
    options: ["10", "20", "As many as you want", "3"],
    optionsBn: ["১০টি", "২০টি", "যত খুশি", "৩টি"],
    answer: 3,
    explanation:
      "Adobe's similar-content guidance: submit at most 3 significant variations of a single motif. Build varied collections instead of duplicating one concept.",
    explanationBn:
      "অ্যাডোবির অনুরূপ কনটেন্ট নির্দেশিকা: একটি মোটিফের সর্বোচ্চ ৩টি উল্লেখযোগ্য ভিন্নতা জমা দিন। একটি ধারণা বারবার না দিয়ে বৈচিত্র্যময় সংগ্রহ তৈরি করুন।",
  },
  {
    id: "Q23",
    topic: "Licenses",
    topicBn: "লাইসেন্স",
    q: "Under a Standard License, a buyer may print up to how many copies?",
    qBn: "স্ট্যান্ডার্ড লাইসেন্সের অধীনে একজন ক্রেতা সর্বোচ্চ কত কপি ছাপতে পারেন?",
    options: ["1,000", "10,000", "500,000", "Unlimited"],
    optionsBn: ["১,০০০", "১০,০০০", "৫,০০,০০০", "সীমাহীন"],
    answer: 2,
    explanation:
      "The Standard License covers print runs up to 500,000 copies. Larger runs need an Extended License.",
    explanationBn:
      "স্ট্যান্ডার্ড লাইসেন্স ৫,০০,০০০ কপি পর্যন্ত প্রিন্ট রান কভার করে। এর বেশি হলে এক্সটেন্ডেড লাইসেন্স দরকার।",
  },
  {
    id: "Q24",
    topic: "Licenses",
    topicBn: "লাইসেন্স",
    q: "Which use REQUIRES an Extended License?",
    qBn: "কোন ব্যবহারের জন্য এক্সটেন্ডেড লাইসেন্স প্রয়োজন?",
    options: [
      "Using the image on a blog",
      "Selling T-shirts printed with the image",
      "Using the image in a social media post",
      "Using the image in a presentation",
    ],
    optionsBn: [
      "ব্লগে ছবিটি ব্যবহার করা",
      "ছবিটি ছাপিয়ে টি-শার্ট বিক্রি করা",
      "সোশ্যাল মিডিয়া পোস্টে ছবিটি ব্যবহার করা",
      "প্রেজেন্টেশনে ছবিটি ব্যবহার করা",
    ],
    answer: 1,
    explanation:
      "Merchandise for resale, templates for resale and unlimited print runs require an Extended License.",
    explanationBn:
      "পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজ, পুনঃবিক্রয়ের জন্য টেমপ্লেট ও সীমাহীন প্রিন্ট রানের জন্য এক্সটেন্ডেড লাইসেন্স প্রয়োজন।",
  },
  {
    id: "Q25",
    topic: "Earnings",
    topicBn: "আয়",
    q: "What royalty rate do Adobe Stock contributors earn?",
    qBn: "অ্যাডোবি স্টক কন্ট্রিবিউটররা কত হারে রয়্যালটি পান?",
    options: [
      "50% for everything",
      "33% for photos, vectors and illustrations; 35% for video",
      "15% for photos; 20% for video",
      "100% minus a monthly fee",
    ],
    optionsBn: [
      "সবকিছুতে ৫০%",
      "ছবি, ভেক্টর ও ইলাস্ট্রেশনে ৩৩%; ভিডিওতে ৩৫%",
      "ছবিতে ১৫%; ভিডিওতে ২০%",
      "মাসিক ফি বাদে ১০০%",
    ],
    answer: 1,
    explanation:
      "Contributors earn a flat 33% on non-video content and 35% on video, applied to the net price of each license.",
    explanationBn:
      "কন্ট্রিবিউটররা ভিডিও ছাড়া কনটেন্টে ফ্ল্যাট ৩৩% এবং ভিডিওতে ৩৫% পান — প্রতিটি লাইসেন্সের নিট মূল্যের ওপর।",
  },
  {
    id: "Q26",
    topic: "Earnings",
    topicBn: "আয়",
    q: "What is the minimum balance needed to request an Adobe Stock payout?",
    qBn: "অ্যাডোবি স্টক থেকে পেমেন্ট নিতে সর্বনিম্ন কত ব্যালেন্স দরকার?",
    options: ["US $5", "US $25", "US $100", "US $500"],
    optionsBn: ["৫ মার্কিন ডলার", "২৫ মার্কিন ডলার", "১০০ মার্কিন ডলার", "৫০০ মার্কিন ডলার"],
    answer: 1,
    explanation:
      "You can request a payout once you have at least US $25 in royalties and at least 45 days have passed since your first sale.",
    explanationBn:
      "কমপক্ষে ২৫ মার্কিন ডলার রয়্যালটি জমা হলে এবং প্রথম বিক্রির ৪৫ দিন পার হলে আপনি পেমেন্টের অনুরোধ করতে পারেন।",
  },
  {
    id: "Q27",
    topic: "Earnings",
    topicBn: "আয়",
    q: "Which payment methods does Adobe Stock use for contributor payouts?",
    qBn: "কন্ট্রিবিউটর পেমেন্টের জন্য অ্যাডোবি স্টক কোন পেমেন্ট পদ্ধতি ব্যবহার করে?",
    options: ["Bank transfer only", "Cryptocurrency", "PayPal, Payoneer or Skrill", "Cheque by post"],
    optionsBn: ["শুধু ব্যাংক ট্রান্সফার", "ক্রিপ্টোকারেন্সি", "PayPal, Payoneer বা Skrill", "ডাকে চেক"],
    answer: 2,
    explanation:
      "Payouts go to a valid PayPal, Payoneer or Skrill account linked to your contributor account.",
    explanationBn: "পেমেন্ট আপনার কন্ট্রিবিউটর অ্যাকাউন্টের সাথে যুক্ত বৈধ PayPal, Payoneer বা Skrill অ্যাকাউন্টে যায়।",
  },
  {
    id: "Q28",
    topic: "Uploading",
    topicBn: "আপলোড",
    q: "Which are valid ways to upload content to Adobe Stock?",
    qBn: "অ্যাডোবি স্টকে কনটেন্ট আপলোড করার বৈধ উপায় কোনগুলো?",
    options: [
      "Only by email",
      "Contributor portal drag-and-drop, SFTP, Lightroom or Bridge",
      "Only through WhatsApp",
      "Only from a mobile app",
    ],
    optionsBn: [
      "শুধু ইমেইলে",
      "কন্ট্রিবিউটর পোর্টালে ড্র্যাগ-অ্যান্ড-ড্রপ, SFTP, Lightroom বা Bridge",
      "শুধু WhatsApp-এর মাধ্যমে",
      "শুধু মোবাইল অ্যাপ থেকে",
    ],
    answer: 1,
    explanation:
      "You can upload through the contributor portal, via SFTP, or directly from Lightroom and Adobe Bridge.",
    explanationBn: "কন্ট্রিবিউটর পোর্টাল, SFTP, অথবা Lightroom ও Adobe Bridge থেকে সরাসরি আপলোড করা যায়।",
  },
  {
    id: "Q29",
    topic: "Categories",
    topicBn: "ক্যাটাগরি",
    q: "How should you choose a category for your asset?",
    qBn: "আপনার অ্যাসেটের জন্য ক্যাটাগরি কীভাবে বেছে নেওয়া উচিত?",
    options: [
      "Pick the most popular category",
      "Pick a random category",
      "Leave the category empty",
      "Pick the category that best matches the subject",
    ],
    optionsBn: [
      "সবচেয়ে জনপ্রিয় ক্যাটাগরি বেছে নিন",
      "এলোমেলো ক্যাটাগরি বেছে নিন",
      "ক্যাটাগরি খালি রাখুন",
      "বিষয়ের সাথে সবচেয়ে ভালো মেলে এমন ক্যাটাগরি বেছে নিন",
    ],
    answer: 3,
    explanation:
      "Choose the single most relevant category — it helps buyers find your content in category browsing.",
    explanationBn:
      "সবচেয়ে প্রাসঙ্গিক ক্যাটাগরিটি বেছে নিন — এটি ক্রেতাদের ক্যাটাগরি ব্রাউজিংয়ে আপনার কনটেন্ট খুঁজে পেতে সাহায্য করে।",
  },
  {
    id: "Q30",
    topic: "Dashboard",
    topicBn: "ড্যাশবোর্ড",
    q: "What can you check in the Adobe Stock Contributor dashboard?",
    qBn: "অ্যাডোবি স্টক কন্ট্রিবিউটর ড্যাশবোর্ডে আপনি কী দেখতে পারেন?",
    options: [
      "Your earnings, downloads and how your portfolio performs",
      "Other contributors' passwords",
      "Buyers' home addresses",
      "Adobe's company revenue",
    ],
    optionsBn: [
      "আপনার আয়, ডাউনলোড ও পোর্টফোলিও কেমন করছে",
      "অন্য কন্ট্রিবিউটরদের পাসওয়ার্ড",
      "ক্রেতাদের বাড়ির ঠিকানা",
      "অ্যাডোবির কোম্পানি আয়",
    ],
    answer: 0,
    explanation:
      "The dashboard shows your earnings, downloads and portfolio performance over time.",
    explanationBn: "ড্যাশবোর্ডে আপনার আয়, ডাউনলোড এবং সময়ের সাথে আপনার পোর্টফোলিও কেমন করছে তা দেখা যায়।",
  },
];

/* ------------------------------------------------------------------ */
/* Battle helpers                                                      */
/* ------------------------------------------------------------------ */

/** One battle question: the source question plus a shuffled display order
 *  (display position -> index into the question's options). Shuffling the
 *  order per battle keeps replays fresh and moves the correct answer. */
export interface BattleQuestion {
  question: QuizQuestion;
  /** order[displayIndex] = option index in the source question. */
  order: number[];
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Draw `count` random questions from the bank, each with shuffled options. */
export function drawBattleQuestions(count = 10): BattleQuestion[] {
  return shuffled(ADOBE_STOCK_QUESTIONS)
    .slice(0, Math.min(count, ADOBE_STOCK_QUESTIONS.length))
    .map((question) => ({
      question,
      order: shuffled(question.options.map((_, i) => i)),
    }));
}

/** Display index of the correct option for a battle question. */
export function correctDisplayIndex(bq: BattleQuestion): number {
  return bq.order.indexOf(bq.question.answer);
}

export interface BotPlan {
  /** Display index the bot will pick. */
  answerIndex: number;
  /** Human-like delay before the bot "answers", in ms. */
  delayMs: number;
}

/** Plan the bot's answer: ~70% accurate, answering after 3–10 seconds. */
export function planBotAnswer(
  correctIndex: number,
  optionCount = 4,
  accuracy = 0.7,
): BotPlan {
  const delayMs = 3000 + Math.floor(Math.random() * 7000);
  if (Math.random() < accuracy) {
    return { answerIndex: correctIndex, delayMs };
  }
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== correctIndex);
  return { answerIndex: wrong[Math.floor(Math.random() * wrong.length)], delayMs };
}

export interface ScoreBreakdown {
  base: number;
  speed: number;
  streak: number;
  total: number;
}

/**
 * Score one answer: 100 base for a correct answer, up to +50 speed bonus
 * scaled by remaining time, and +25 per consecutive correct answer beyond
 * the first (streakAfter counts the current answer).
 */
export function scoreForAnswer(
  correct: boolean,
  timeLeftMs: number,
  totalMs: number,
  streakAfter: number,
): ScoreBreakdown {
  if (!correct) return { base: 0, speed: 0, streak: 0, total: 0 };
  const base = 100;
  const speed = Math.round((Math.max(0, timeLeftMs) / totalMs) * 50);
  const streak = streakAfter >= 2 ? 25 * (streakAfter - 1) : 0;
  return { base, speed, streak, total: base + speed + streak };
}
