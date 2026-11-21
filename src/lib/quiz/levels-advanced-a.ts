import type { QuizQuestion } from "./adobe-stock-questions";

/** Levels 16–22 (Advanced, part 1): multi-rule reasoning and exceptions. 30 questions per level. */
export const LEVELS_ADVANCED_A: Record<number, QuizQuestion[]> = {
  16: [
    {
      id: "L16-Q01",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A photo is 3 megapixels. What happens when you submit it to Adobe Stock?",
      qBn: "একটি ছবি ৩ মেগাপিক্সেলের। অ্যাডোবি স্টকে জমা দিলে কী হবে?",
      options: [
        "It is accepted if it is saved as PNG",
        "It is accepted as-is",
        "It is accepted if the file is under 45 MB",
        "It is rejected — it is below the 4 megapixel minimum",
      ],
      optionsBn: [
        "PNG হিসেবে সংরক্ষণ করলে গৃহীত হবে",
        "যেমন আছে তেমনই গৃহীত হবে",
        "ফাইল ৪৫ MB-এর কম হলে গৃহীত হবে",
        "বাতিল হবে — এটি ৪ মেগাপিক্সেলের সর্বনিম্ন সীমার নিচে",
      ],
      answer: 3,
      explanation:
        "Photos must be at least 4 megapixels. A 3 megapixel photo fails the minimum resolution rule no matter how small the file is.",
      explanationBn:
        "ছবি কমপক্ষে ৪ মেগাপিক্সেল হতে হবে। ৩ মেগাপিক্সেলের ছবি ফাইল যত ছোটই হোক, সর্বনিম্ন রেজোলিউশন নিয়মে ব্যর্থ হবে।",
    },
    {
      id: "L16-Q02",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A photo is 120 megapixels, saved as JPEG with sRGB. What happens?",
      qBn: "একটি ছবি ১২০ মেগাপিক্সেলের, JPEG হিসেবে sRGB-সহ সংরক্ষিত। কী হবে?",
      options: [
        "It is accepted — bigger is always better",
        "It is rejected — it is above the 100 megapixel maximum",
        "It is accepted after compression",
        "It is accepted only if saved as TIFF",
      ],
      optionsBn: [
        "গৃহীত হবে — বড় হলেই ভালো",
        "বাতিল হবে — এটি ১০০ মেগাপিক্সেলের সর্বোচ্চ সীমার উপরে",
        "কমপ্রেস করার পর গৃহীত হবে",
        "TIFF হিসেবে সংরক্ষণ করলেই শুধু গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "Photos must be between 4 and 100 megapixels. A 120 megapixel file exceeds the maximum, even though the format and color profile are correct.",
      explanationBn:
        "ছবি ৪ থেকে ১০০ মেগাপিক্সেলের মধ্যে হতে হবে। ফরম্যাট ও কালার প্রোফাইল ঠিক থাকলেও ১২০ মেগাপিক্সেলের ফাইল সর্বোচ্চ সীমা ছাড়িয়ে যায়।",
    },
    {
      id: "L16-Q03",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A JPEG photo is 20 megapixels with sRGB, but the file is 50 MB. What happens?",
      qBn: "একটি JPEG ছবি ২০ মেগাপিক্সেলের, sRGB-সহ, কিন্তু ফাইলটি ৫০ MB। কী হবে?",
      options: [
        "It is accepted — the resolution is fine",
        "It is accepted if you rename the file",
        "It is accepted if uploaded through SFTP",
        "It is rejected — it is over the 45 MB file size limit",
      ],
      optionsBn: [
        "গৃহীত হবে — রেজোলিউশন ঠিক আছে",
        "ফাইলের নাম বদলালে গৃহীত হবে",
        "SFTP দিয়ে আপলোড করলে গৃহীত হবে",
        "বাতিল হবে — এটি ৪৫ MB ফাইল সাইজ সীমার উপরে",
      ],
      answer: 3,
      explanation:
        "Photo files must be 45 MB or smaller, whatever the upload method. A 50 MB file must be recompressed or resized below the limit.",
      explanationBn:
        "ছবির ফাইল ৪৫ MB বা তার কম হতে হবে, আপলোডের মাধ্যম যাই হোক। ৫০ MB ফাইলকে সীমার নিচে আনতে আবার কমপ্রেস বা রিসাইজ করতে হবে।",
    },
    {
      id: "L16-Q04",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your camera saved a photo in Adobe RGB. What must you do before submitting it?",
      qBn: "আপনার ক্যামেরা একটি ছবি Adobe RGB-তে সংরক্ষণ করেছে। জমা দেওয়ার আগে আপনাকে কী করতে হবে?",
      options: [
        "Convert it to sRGB before submitting",
        "Submit it as-is — Adobe RGB is accepted",
        "Submit it as-is if the file is under 45 MB",
        "Nothing — only videos need sRGB",
      ],
      optionsBn: [
        "জমা দেওয়ার আগে এটিকে sRGB-তে রূপান্তর করতে হবে",
        "যেমন আছে তেমনই জমা দিন — Adobe RGB গৃহীত হয়",
        "ফাইল ৪৫ MB-এর কম হলে যেমন আছে তেমনই জমা দিন",
        "কিছুই নয় — শুধু ভিডিওতেই sRGB দরকার",
      ],
      answer: 0,
      explanation:
        "Adobe Stock requires the sRGB color profile for photos. A photo in Adobe RGB or CMYK must be converted to sRGB first.",
      explanationBn:
        "অ্যাডোবি স্টকের ছবির জন্য sRGB কালার প্রোফাইল প্রয়োজন। Adobe RGB বা CMYK-তে থাকা ছবি আগে sRGB-তে রূপান্তর করতে হবে।",
    },
    {
      id: "L16-Q05",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You submit a photo as a PNG file. What happens?",
      qBn: "আপনি একটি ছবি PNG ফাইল হিসেবে জমা দিলেন। কী হবে?",
      options: [
        "It is accepted — PNG is lossless",
        "It is accepted for illustrations only",
        "It is rejected — photos must be JPEG",
        "It is accepted if the file is under 45 MB",
      ],
      optionsBn: [
        "গৃহীত হবে — PNG লসলেস",
        "শুধু ইলাস্ট্রেশনের ক্ষেত্রে গৃহীত হবে",
        "বাতিল হবে — ছবি JPEG হতেই হবে",
        "ফাইল ৪৫ MB-এর কম হলে গৃহীত হবে",
      ],
      answer: 2,
      explanation:
        "Adobe Stock accepts photos only as JPEG files. PNG, TIFF and GIF are not accepted for photo submissions, however good the image looks.",
      explanationBn:
        "অ্যাডোবি স্টক ছবি শুধু JPEG ফাইল হিসেবে গ্রহণ করে। ছবি যত ভালোই হোক, PNG, TIFF বা GIF ছবি জমা দেওয়ার ক্ষেত্রে গৃহীত হয় না।",
    },
    {
      id: "L16-Q06",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo has a small watermark with your name in the corner. What happens?",
      qBn: "আপনার ছবির কোণায় আপনার নামের একটি ছোট ওয়াটারমার্ক আছে। কী হবে?",
      options: [
        "It is accepted if the watermark is small",
        "It is rejected — watermarks are never allowed",
        "It is accepted if the watermark is your own name",
        "It is accepted for editorial submissions",
      ],
      optionsBn: [
        "ওয়াটারমার্ক ছোট হলে গৃহীত হবে",
        "বাতিল হবে — ওয়াটারমার্ক কখনোই অনুমোদিত নয়",
        "ওয়াটারমার্কে আপনার নিজের নাম থাকলে গৃহীত হবে",
        "এডিটোরিয়াল জমার ক্ষেত্রে গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "Watermarks, timestamps and branding are never allowed in submitted content, even small ones or your own name. Remove the watermark before submitting.",
      explanationBn:
        "জমা দেওয়া কনটেন্টে ওয়াটারমার্ক, টাইমস্ট্যাম্প ও ব্র্যান্ডিং কখনোই অনুমোদিত নয় — ছোট হলেও বা আপনার নিজের নাম হলেও নয়। জমা দেওয়ার আগে ওয়াটারমার্ক সরিয়ে ফেলুন।",
    },
    {
      id: "L16-Q07",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your camera stamped the date and time onto the photo itself. What happens?",
      qBn: "আপনার ক্যামেরা ছবির ওপরেই তারিখ ও সময় ছাপিয়ে দিয়েছে। কী হবে?",
      options: [
        "It is accepted — the stamp proves when it was taken",
        "It is accepted for news photos",
        "It is accepted if the stamp is small",
        "It is rejected — timestamps are not allowed",
      ],
      optionsBn: [
        "গৃহীত হবে — স্ট্যাম্প প্রমাণ করে কখন তোলা হয়েছে",
        "সংবাদের ছবির ক্ষেত্রে গৃহীত হবে",
        "স্ট্যাম্প ছোট হলে গৃহীত হবে",
        "বাতিল হবে — টাইমস্ট্যাম্প অনুমোদিত নয়",
      ],
      answer: 3,
      explanation:
        "Timestamps burned into the image are not allowed, just like watermarks. Turn off the camera's date stamp and submit a clean image.",
      explanationBn:
        "ছবির মধ্যে ছাপানো টাইমস্ট্যাম্প অনুমোদিত নয়, ওয়াটারমার্কের মতোই। ক্যামেরার ডেট স্ট্যাম্প বন্ধ করে পরিষ্কার ছবি জমা দিন।",
    },
    {
      id: "L16-Q08",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Before submitting a photo, at what zoom level should you check it for focus and noise?",
      qBn: "ছবি জমা দেওয়ার আগে ফোকাস ও নয়েজ যাচাই করতে কোন জুম লেভেলে দেখা উচিত?",
      options: [
        "At 100% zoom",
        "At 25% zoom",
        "At thumbnail size",
        "At 50% zoom",
      ],
      optionsBn: [
        "১০০% জুমে",
        "২৫% জুমে",
        "থাম্বনেইল সাইজে",
        "৫০% জুমে",
      ],
      answer: 0,
      explanation:
        "Adobe advises checking files at 100% zoom, because soft focus, noise and compression artifacts that are invisible in a thumbnail show up at full size.",
      explanationBn:
        "অ্যাডোবি ১০০% জুমে ফাইল যাচাই করার পরামর্শ দেয়, কারণ থাম্বনেইলে অদৃশ্য নরম ফোকাস, নয়েজ ও কমপ্রেশন আর্টিফ্যাক্ট পূর্ণ সাইজে ধরা পড়ে।",
    },
    {
      id: "L16-Q09",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo has soft focus on the subject and visible noise in the shadows. What is the likely result?",
      qBn: "আপনার ছবিতে বিষয়বস্তুর ফোকাস নরম এবং ছায়ায় দৃশ্যমান নয়েজ আছে। সম্ভাব্য ফলাফল কী?",
      options: [
        "It is accepted — buyers can fix it",
        "It is accepted if the subject is interesting",
        "It is rejected for quality reasons",
        "It is accepted as an artistic style",
      ],
      optionsBn: [
        "গৃহীত হবে — ক্রেতারা ঠিক করে নিতে পারবেন",
        "বিষয়বস্তু আকর্ষণীয় হলে গৃহীত হবে",
        "মানের কারণে বাতিল হবে",
        "শিল্পশৈলী হিসেবে গৃহীত হবে",
      ],
      answer: 2,
      explanation:
        "Quality issues such as soft focus, visible noise, compression artifacts and poor lighting are among the most common reasons photos are rejected.",
      explanationBn:
        "নরম ফোকাস, দৃশ্যমান নয়েজ, কমপ্রেশন আর্টিফ্যাক্ট ও খারাপ আলোর মতো মানের সমস্যা ছবি বাতিল হওয়ার সবচেয়ে সাধারণ কারণগুলোর মধ্যে পড়ে।",
    },
    {
      id: "L16-Q10",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo shows heavy compression artifacts around the edges of the subject. What happens?",
      qBn: "আপনার ছবিতে বিষয়বস্তুর কিনারায় ভারী কমপ্রেশন আর্টিফ্যাক্ট দেখা যাচ্ছে। কী হবে?",
      options: [
        "It is accepted — compression is normal",
        "It is rejected — artifacts are a quality failure",
        "It is accepted if the file is under 45 MB",
        "It is accepted for web use only",
      ],
      optionsBn: [
        "গৃহীত হবে — কমপ্রেশন স্বাভাবিক",
        "বাতিল হবে — আর্টিফ্যাক্ট মানের ত্রুটি",
        "ফাইল ৪৫ MB-এর কম হলে গৃহীত হবে",
        "শুধু ওয়েব ব্যবহারের জন্য গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "Visible compression artifacts are a quality failure. Re-export the photo at higher quality or from the original file before submitting.",
      explanationBn:
        "দৃশ্যমান কমপ্রেশন আর্টিফ্যাক্ট মানের ত্রুটি। জমা দেওয়ার আগে মূল ফাইল থেকে উচ্চ মানের ছবি আবার এক্সপোর্ট করুন।",
    },
    {
      id: "L16-Q11",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You title a commercial photo of a protest with a date and event name, like a news caption. What happens?",
      qBn: "আপনি একটি বিক্ষোভের বাণিজ্যিক ছবির টাইটেলে সংবাদের ক্যাপশনের মতো তারিখ ও অনুষ্ঠানের নাম দিলেন। কী হবে?",
      options: [
        "It is accepted — captions help buyers",
        "It is accepted for all commercial content",
        "It is accepted if the photo is newsworthy",
        "It is rejected — commercial content must not use editorial-style captions",
      ],
      optionsBn: [
        "গৃহীত হবে — ক্যাপশন ক্রেতাদের সাহায্য করে",
        "সব বাণিজ্যিক কনটেন্টের ক্ষেত্রে গৃহীত হবে",
        "ছবিটি সংবাদমূল্য থাকলে গৃহীত হবে",
        "বাতিল হবে — বাণিজ্যিক কনটেন্টে এডিটোরিয়াল-ধাঁচের ক্যাপশন ব্যবহার করা যাবে না",
      ],
      answer: 3,
      explanation:
        "Adobe does not accept editorial-style titles or captions on commercial content, and it does not currently accept Editorial Use Only content from individual contributors — with the limited exception of Illustrative Editorial. Use a descriptive title instead, such as what the people are doing.",
      explanationBn:
        "অ্যাডোবি বাণিজ্যিক কনটেন্টে এডিটোরিয়াল-ধাঁচের টাইটেল বা ক্যাপশন গ্রহণ করে না, এবং ব্যক্তিগত কন্ট্রিবিউটরদের কাছ থেকে Editorial Use Only কনটেন্টও বর্তমানে গ্রহণ করে না — Illustrative Editorial-এর সীমিত ব্যতিক্রম ছাড়া। বরং মানুষ কী করছে, এমন বর্ণনামূলক টাইটেল ব্যবহার করুন।",
    },
    {
      id: "L16-Q12",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A commercial photo shows a recognizable stranger and you have no model release. What should you do?",
      qBn: "একটি বাণিজ্যিক ছবিতে চেনা যায় এমন একজন অপরিচিত মানুষ আছেন, কিন্তু আপনার কাছে মডেল রিলিজ নেই। আপনার কী করা উচিত?",
      options: [
        "Get a signed model release before submitting it commercially",
        "Submit it as commercial anyway",
        "Submit it as editorial — Adobe accepts Editorial Use Only from individual contributors",
        "Submit it without a release and hope reviewers miss it",
      ],
      optionsBn: [
        "বাণিজ্যিকভাবে জমা দেওয়ার আগে স্বাক্ষরিত মডেল রিলিজ নিন",
        "তবুও বাণিজ্যিক হিসেবে জমা দিন",
        "এডিটোরিয়াল হিসেবে জমা দিন — অ্যাডোবি ব্যক্তিগত কন্ট্রিবিউটরদের কাছ থেকে Editorial Use Only গ্রহণ করে",
        "রিলিজ ছাড়াই জমা দিন এবং আশা করুন রিভিউয়াররা ধরতে পারবেন না",
      ],
      answer: 0,
      explanation:
        "Any identifiable person in commercial content needs a signed model release. Adobe does not currently accept Editorial Use Only content from individual contributors as a workaround, except for Illustrative Editorial.",
      explanationBn:
        "বাণিজ্যিক কনটেন্টে চেনা যায় এমন যেকোনো ব্যক্তির জন্য স্বাক্ষরিত মডেল রিলিজ দরকার। Illustrative Editorial ছাড়া, ব্যক্তিগত কন্ট্রিবিউটরদের কাছ থেকে Editorial Use Only কনটেন্ট অ্যাডোবি বর্তমানে বিকল্প হিসেবে গ্রহণ করে না।",
    },
    {
      id: "L16-Q13",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A famous modern building fills the whole frame as the main subject of your photo. What is needed?",
      qBn: "একটি বিখ্যাত আধুনিক ভবন আপনার ছবির পুরো ফ্রেম জুড়ে প্রধান বিষয়বস্তু হিসেবে আছে। কী দরকার?",
      options: [
        "No release is needed — buildings are always public",
        "Only a model release is needed",
        "A property release is needed — it is recognizable private property",
        "No release is needed if photographed from the street",
      ],
      optionsBn: [
        "কোনো রিলিজ দরকার নেই — ভবন সবসময় সর্বজনীন",
        "শুধু মডেল রিলিজ দরকার",
        "প্রপার্টি রিলিজ দরকার — এটি চেনা যায় এমন ব্যক্তিগত সম্পত্তি",
        "রাস্তা থেকে তোলা হলে কোনো রিলিজ দরকার নেই",
      ],
      answer: 2,
      explanation:
        "Famous landmarks, historic locations and modern architecture need a property release when they are the recognizable main subject — photographing from a public street does not remove the requirement.",
      explanationBn:
        "বিখ্যাত ল্যান্ডমার্ক, ঐতিহাসিক স্থান ও আধুনিক স্থাপত্য যখন চেনা যায় এমন প্রধান বিষয়বস্তু হয়, তখন প্রপার্টি রিলিজ দরকার — সর্বজনীন রাস্তা থেকে তোলা হলেও এই নিয়ম বদলায় না।",
    },
    {
      id: "L16-Q14",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You shoot a wide, generic cityscape from a public street — no single building dominates. Is a property release needed?",
      qBn: "আপনি সর্বজনীন রাস্তা থেকে একটি প্রশস্ত, সাধারণ শহরের দৃশ্য তুললেন — কোনো একক ভবন প্রাধান্য পায়নি। প্রপার্টি রিলিজ কি দরকার?",
      options: [
        "A property release is required",
        "No property release is needed — it is a generic urban scene",
        "A model release is required",
        "It must be submitted as editorial",
      ],
      optionsBn: [
        "প্রপার্টি রিলিজ প্রয়োজন",
        "প্রপার্টি রিলিজ দরকার নেই — এটি একটি সাধারণ শহুরে দৃশ্য",
        "মডেল রিলিজ প্রয়োজন",
        "এটি এডিটোরিয়াল হিসেবে জমা দিতে হবে",
      ],
      answer: 1,
      explanation:
        "No property release is needed for generic urban photos such as a cityscape shot from a public street, where no recognizable private property is the main subject.",
      explanationBn:
        "সর্বজনীন রাস্তা থেকে তোলা শহরের দৃশ্যের মতো সাধারণ শহুরে ছবির জন্য প্রপার্টি রিলিজ দরকার হয় না, যেখানে চেনা যায় এমন কোনো ব্যক্তিগত সম্পত্তি প্রধান বিষয়বস্তু নয়।",
    },
    {
      id: "L16-Q15",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo shows a clearly visible brand logo on a person's jacket. What is the correct action?",
      qBn: "আপনার ছবিতে একজন মানুষের জ্যাকেটে স্পষ্টভাবে একটি ব্র্যান্ড লোগো দেখা যাচ্ছে। সঠিক পদক্ষেপ কী?",
      options: [
        "Submit it — logos add realism",
        "Submit it if the logo is small",
        "Submit it for editorial use only",
        "Remove the logo or the photo may be rejected for commercial use",
      ],
      optionsBn: [
        "জমা দিন — লোগো বাস্তবতা বাড়ায়",
        "লোগো ছোট হলে জমা দিন",
        "শুধু এডিটোরিয়াল ব্যবহারের জন্য জমা দিন",
        "লোগো সরিয়ে ফেলুন, নইলে বাণিজ্যিক ব্যবহারের জন্য ছবিটি বাতিল হতে পারে",
      ],
      answer: 3,
      explanation:
        "Logos, brand marks and trademarked symbols are not allowed in commercial content. Remove or clone out the logo before submitting.",
      explanationBn:
        "বাণিজ্যিক কনটেন্টে লোগো, ব্র্যান্ড চিহ্ন ও ট্রেডমার্কযুক্ত প্রতীক অনুমোদিত নয়। জমা দেওয়ার আগে লোগো সরিয়ে ফেলুন।",
    },
    {
      id: "L16-Q16",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Which of these photos meets Adobe Stock's technical requirements?",
      qBn: "নিচের কোন ছবিটি অ্যাডোবি স্টকের কারিগরি প্রয়োজনীয়তা পূরণ করে?",
      options: [
        "JPEG, sRGB, 8 megapixels, 20 MB",
        "PNG, sRGB, 8 megapixels, 20 MB",
        "JPEG, Adobe RGB, 8 megapixels, 20 MB",
        "JPEG, sRGB, 3 megapixels, 20 MB",
      ],
      optionsBn: [
        "JPEG, sRGB, ৮ মেগাপিক্সেল, ২০ MB",
        "PNG, sRGB, ৮ মেগাপিক্সেল, ২০ MB",
        "JPEG, Adobe RGB, ৮ মেগাপিক্সেল, ২০ MB",
        "JPEG, sRGB, ৩ মেগাপিক্সেল, ২০ MB",
      ],
      answer: 0,
      explanation:
        "Only the first option passes every rule at once: JPEG format, sRGB profile, 4–100 megapixels, and 45 MB or smaller.",
      explanationBn:
        "শুধু প্রথম বিকল্পটিই একসাথে সব নিয়ম পূরণ করে: JPEG ফরম্যাট, sRGB প্রোফাইল, ৪–১০০ মেগাপিক্সেল এবং ৪৫ MB বা তার কম।",
    },
    {
      id: "L16-Q17",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A model's face is not shown, but a distinctive tattoo on their arm is clearly visible. Is a release needed?",
      qBn: "একজন মডেলের মুখ দেখা যাচ্ছে না, কিন্তু তার বাহুতে একটি স্বতন্ত্র ট্যাটু স্পষ্টভাবে দেখা যাচ্ছে। রিলিজ কি দরকার?",
      options: [
        "No release is needed — the face is hidden",
        "A property release is needed",
        "A model release is needed — a tattoo can identify a person",
        "A release is needed only if the tattoo shows a brand logo",
      ],
      optionsBn: [
        "রিলিজ দরকার নেই — মুখ লুকানো আছে",
        "প্রপার্টি রিলিজ দরকার",
        "মডেল রিলিজ দরকার — ট্যাটু দিয়ে একজন মানুষকে চেনা যেতে পারে",
        "ট্যাটুতে ব্র্যান্ড লোগো থাকলেই শুধু রিলিজ দরকার",
      ],
      answer: 2,
      explanation:
        "Recognition is not only about the face. Adobe's test is whether the person would recognize themselves — a distinctive tattoo, clothing or voice can identify them too.",
      explanationBn:
        "চেনা যাওয়া শুধু মুখের ব্যাপার নয়। অ্যাডোবির পরীক্ষা হলো ব্যক্তিটি নিজেকে চিনতে পারবেন কি না — স্বতন্ত্র ট্যাটু, পোশাক বা কণ্ঠ দিয়েও কাউকে চেনা যেতে পারে।",
    },
    {
      id: "L16-Q18",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo's main subject is the distinctive interior of a private home. What is needed?",
      qBn: "আপনার ছবির প্রধান বিষয়বস্তু একটি ব্যক্তিগত বাড়ির স্বতন্ত্র ইন্টেরিয়র। কী দরকার?",
      options: [
        "No release — interiors are free to photograph",
        "A property release",
        "A model release",
        "An editorial submission only",
      ],
      optionsBn: [
        "কোনো রিলিজ নয় — ইন্টেরিয়রের ছবি তোলা স্বাধীন",
        "প্রপার্টি রিলিজ",
        "মডেল রিলিজ",
        "শুধু এডিটোরিয়াল জমা",
      ],
      answer: 1,
      explanation:
        "Recognizable private property needs a property release, and that includes identifiable interiors — not only building exteriors.",
      explanationBn:
        "চেনা যায় এমন ব্যক্তিগত সম্পত্তির জন্য প্রপার্টি রিলিজ দরকার, আর এর মধ্যে চেনা যায় এমন ইন্টেরিয়রও পড়ে — শুধু ভবনের বাইরের অংশ নয়।",
    },
    {
      id: "L16-Q19",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You photograph a copyrighted painting hanging in a gallery. What happens if you submit it commercially?",
      qBn: "আপনি একটি গ্যালারিতে ঝোলানো একটি কপিরাইটযুক্ত পেইন্টিংয়ের ছবি তুললেন। বাণিজ্যিকভাবে জমা দিলে কী হবে?",
      options: [
        "It is accepted — art in public view is free to use",
        "It is accepted if you credit the artist",
        "It is rejected — copyrighted artwork needs permission or a property release",
        "It is accepted as editorial",
      ],
      optionsBn: [
        "গৃহীত হবে — প্রকাশ্যে থাকা শিল্পকর্ম ব্যবহার করা যায়",
        "শিল্পীর নাম উল্লেখ করলে গৃহীত হবে",
        "বাতিল হবে — কপিরাইটযুক্ত শিল্পকর্মের জন্য অনুমতি বা প্রপার্টি রিলিজ দরকার",
        "এডিটোরিয়াল হিসেবে গৃহীত হবে",
      ],
      answer: 2,
      explanation:
        "Copyrighted works — including art, books, maps and fictional characters — need a property release or permission. Crediting the artist does not make it legal to sell.",
      explanationBn:
        "কপিরাইটযুক্ত কাজ — শিল্পকর্ম, বই, মানচিত্র ও কাল্পনিক চরিত্রসহ — এর জন্য প্রপার্টি রিলিজ বা অনুমতি দরকার। শিল্পীর নাম উল্লেখ করলেই তা বিক্রি করা বৈধ হয় না।",
    },
    {
      id: "L16-Q20",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A child appears in your commercial photo. Who must sign the model release?",
      qBn: "আপনার বাণিজ্যিক ছবিতে একটি শিশু আছে। মডেল রিলিজে কে স্বাক্ষর করবেন?",
      options: [
        "A parent or legal guardian must sign it",
        "No release is needed for children",
        "The child can sign it",
        "Any adult present at the shoot can sign it",
      ],
      optionsBn: [
        "বাবা-মা বা আইনি অভিভাবককে স্বাক্ষর করতে হবে",
        "শিশুদের জন্য রিলিজ দরকার হয় না",
        "শিশুটি নিজে স্বাক্ষর করতে পারে",
        "শুটিংয়ে উপস্থিত যেকোনো প্রাপ্তবয়স্ক স্বাক্ষর করতে পারেন",
      ],
      answer: 0,
      explanation:
        "Minors cannot give legal consent, so a parent or legal guardian must sign the model release on their behalf.",
      explanationBn:
        "অপ্রাপ্তবয়স্করা আইনি সম্মতি দিতে পারে না, তাই তাদের পক্ষে বাবা-মা বা আইনি অভিভাবককে মডেল রিলিজে স্বাক্ষর করতে হয়।",
    },
    {
      id: "L16-Q21",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You upscale a 2 megapixel photo to 4 megapixels in software. Will it pass review?",
      qBn: "আপনি সফটওয়্যারে একটি ২ মেগাপিক্সেলের ছবিকে ৪ মেগাপিক্সেলে বড় করলেন। এটি কি রিভিউ পাস করবে?",
      options: [
        "Yes — it now meets the minimum",
        "Yes, if it is saved as JPEG",
        "It will still likely be rejected — upscaling creates softness and artifacts",
        "Yes, if the file stays under 45 MB",
      ],
      optionsBn: [
        "হ্যাঁ — এটি এখন সর্বনিম্ন সীমা পূরণ করে",
        "হ্যাঁ, JPEG হিসেবে সংরক্ষণ করলে",
        "তবুও সম্ভবত বাতিল হবে — আপস্কেল করলে নরম ভাব ও আর্টিফ্যাক্ট তৈরি হয়",
        "হ্যাঁ, ফাইল ৪৫ MB-এর কম থাকলে",
      ],
      answer: 2,
      explanation:
        "Upscaling cannot add real detail — it creates softness and artifacts that reviewers reject for quality. Only submit photos that are natively 4 megapixels or larger.",
      explanationBn:
        "আপস্কেল করে আসল ডিটেইল যোগ করা যায় না — এতে নরম ভাব ও আর্টিফ্যাক্ট তৈরি হয়, যা মানের কারণে রিভিউয়াররা বাতিল করেন। শুধু সেসব ছবিই জমা দিন যেগুলো আসলেই ৪ মেগাপিক্সেল বা তার বেশি।",
    },
    {
      id: "L16-Q22",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo is saved in CMYK color mode. What happens?",
      qBn: "আপনার ছবি CMYK কালার মোডে সংরক্ষিত। কী হবে?",
      options: [
        "It is accepted — CMYK is for print",
        "It is rejected — photos must use sRGB",
        "It is accepted if converted to PNG",
        "It is accepted for vector submissions",
      ],
      optionsBn: [
        "গৃহীত হবে — CMYK ছাপার জন্য",
        "বাতিল হবে — ছবিতে sRGB ব্যবহার করতেই হবে",
        "PNG-তে রূপান্তর করলে গৃহীত হবে",
        "ভেক্টর জমার ক্ষেত্রে গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "CMYK is a print color mode, not a screen one. Adobe Stock photos must use the sRGB color profile — convert CMYK files to sRGB before submitting.",
      explanationBn:
        "CMYK ছাপার কালার মোড, স্ক্রিনের নয়। অ্যাডোবি স্টকের ছবিতে sRGB কালার প্রোফাইল ব্যবহার করতেই হবে — CMYK ফাইল জমা দেওয়ার আগে sRGB-তে রূপান্তর করুন।",
    },
    {
      id: "L16-Q23",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Which check is most likely to catch noise and focus problems before reviewers do?",
      qBn: "রিভিউয়ারদের আগে নয়েজ ও ফোকাসের সমস্যা ধরতে কোন যাচাইটি সবচেয়ে কার্যকর?",
      options: [
        "Checking the thumbnail",
        "Checking the file name",
        "Checking the keyword count",
        "Viewing the image at 100% zoom",
      ],
      optionsBn: [
        "থাম্বনেইল দেখা",
        "ফাইলের নাম যাচাই করা",
        "কীওয়ার্ডের সংখ্যা যাচাই করা",
        "১০০% জুমে ছবিটি দেখা",
      ],
      answer: 3,
      explanation:
        "A thumbnail hides flaws. Checking at 100% zoom reveals soft focus, noise and artifacts exactly as reviewers will see them.",
      explanationBn:
        "থাম্বনেইলে ত্রুটি লুকিয়ে থাকে। ১০০% জুমে দেখলে নরম ফোকাস, নয়েজ ও আর্টিফ্যাক্ট ধরা পড়ে — ঠিক যেভাবে রিভিউয়াররা দেখবেন।",
    },
    {
      id: "L16-Q24",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Your photo is overexposed — the sky is blown out white with no detail left. What is the likely result?",
      qBn: "আপনার ছবি অতিরিক্ত এক্সপোজড — আকাশ সম্পূর্ণ সাদা হয়ে গেছে, কোনো ডিটেইল নেই। সম্ভাব্য ফলাফল কী?",
      options: [
        "It is rejected — poor exposure is a quality failure",
        "It is accepted — bright photos sell well",
        "It is accepted — buyers can recover the highlights",
        "It is accepted as an artistic effect",
      ],
      optionsBn: [
        "বাতিল হবে — খারাপ এক্সপোজার মানের ত্রুটি",
        "গৃহীত হবে — উজ্জ্বল ছবি ভালো বিক্রি হয়",
        "গৃহীত হবে — ক্রেতারা হাইলাইট ফিরিয়ে আনতে পারবেন",
        "শিল্পশৈলী হিসেবে গৃহীত হবে",
      ],
      answer: 0,
      explanation:
        "Poor lighting and exposure — including blown-out highlights with no recoverable detail — are quality failures that reviewers reject.",
      explanationBn:
        "খারাপ আলো ও এক্সপোজার — পুনরুদ্ধারযোগ্য ডিটেইল ছাড়া সম্পূর্ণ সাদা হয়ে যাওয়া হাইলাইটসহ — মানের ত্রুটি, যা রিভিউয়াররা বাতিল করেন।",
    },
    {
      id: "L16-Q25",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You shoot a photo on your phone. It is sharp, well-lit, JPEG, sRGB and 12 megapixels. Can you submit it to Adobe Stock?",
      qBn: "আপনি ফোনে একটি ছবি তুললেন। এটি তীক্ষ্ণ, ভালোভাবে আলোকিত, JPEG, sRGB ও ১২ মেগাপিক্সেল। অ্যাডোবি স্টকে কি এটি জমা দেওয়া যাবে?",
      options: [
        "Yes, Adobe accepts photos from any camera, including a mobile device, if they meet the requirements",
        "No, phone photos are never accepted",
        "Yes, but only if the phone is an iPhone",
        "Yes, but only as an editorial photo",
      ],
      optionsBn: [
        "হ্যাঁ, অ্যাডোবি মোবাইলসহ যেকোনো ক্যামেরার ছবি গ্রহণ করে, যদি তা প্রয়োজনীয়তা মেটায়",
        "না, ফোনের ছবি কখনোই গৃহীত হয় না",
        "হ্যাঁ, তবে ফোনটি iPhone হলে",
        "হ্যাঁ, তবে শুধু এডিটোরিয়াল ছবি হিসেবে",
      ],
      answer: 0,
      explanation:
        "Adobe Stock accepts photos shot with any camera, including a mobile device, as long as they meet the technical, legal and quality requirements.",
      explanationBn:
        "অ্যাডোবি স্টক মোবাইলসহ যেকোনো ক্যামেরায় তোলা ছবি গ্রহণ করে, যদি তা কারিগরি, আইনি ও মানের প্রয়োজনীয়তা মেটায়।",
    },
    {
      id: "L16-Q26",
      topic: "Photos",
      topicBn: "ছবি",
      q: "You submit a photo of your own original sketch — no one else's artwork is in it. What happens?",
      qBn: "আপনি আপনার নিজের আঁকা একটি স্কেচের ছবি জমা দিলেন — এতে অন্য কারো শিল্পকর্ম নেই। কী হবে?",
      options: [
        "It is rejected — sketches are never accepted",
        "It is accepted — it is your own original work",
        "It needs a property release from yourself",
        "It is accepted only as a vector",
      ],
      optionsBn: [
        "বাতিল হবে — স্কেচ কখনোই গৃহীত হয় না",
        "গৃহীত হবে — এটি আপনার নিজের মৌলিক কাজ",
        "নিজের কাছ থেকে প্রপার্টি রিলিজ দরকার",
        "শুধু ভেক্টর হিসেবে গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "Your own original work is fine to submit. The IP rules block other people's copyrighted work — logos, characters and artwork you did not create.",
      explanationBn:
        "আপনার নিজের মৌলিক কাজ জমা দেওয়া ঠিক আছে। মেধাসম্পদ নিয়ম আটকায় অন্যের কপিরাইটযুক্ত কাজ — লোগো, চরিত্র ও শিল্পকর্ম যা আপনি তৈরি করেননি।",
    },
    {
      id: "L16-Q27",
      topic: "Photos",
      topicBn: "ছবি",
      q: "From one shoot you have a wide shot and a close-up with a different mood and composition. Can you submit both?",
      qBn: "একটি শুট থেকে আপনার কাছে একটি ওয়াইড শট ও ভিন্ন মেজাজ ও কম্পোজিশনের একটি ক্লোজ-আপ আছে। দুটিই কি জমা দিতে পারবেন?",
      options: [
        "No — both are spam, submit only one",
        "No — only the wide shot can be submitted",
        "No — photos from one shoot are always too similar",
        "Yes — they are meaningfully different variations",
      ],
      optionsBn: [
        "না — দুটিই স্প্যাম, শুধু একটি জমা দিন",
        "না — শুধু ওয়াইড শট জমা দেওয়া যাবে",
        "না — এক শুটের ছবি সবসময়ই অতিরিক্ত মিল থাকে",
        "হ্যাঁ — এগুলো অর্থবহভাবে ভিন্ন ভিন্নতা",
      ],
      answer: 3,
      explanation:
        "Adobe allows up to three significant variations of a motif. A different composition, mood or story counts as a meaningful variation — a mere crop, flip or filter change does not.",
      explanationBn:
        "অ্যাডোবি একটি মোটিফের সর্বোচ্চ ৩টি উল্লেখযোগ্য ভিন্নতা অনুমোদন করে। ভিন্ন কম্পোজিশন, মেজাজ বা গল্প অর্থবহ ভিন্নতা হিসেবে গণ্য হয় — শুধু ক্রপ, ফ্লিপ বা ফিল্টার বদল নয়।",
    },
    {
      id: "L16-Q28",
      topic: "Photos",
      topicBn: "ছবি",
      q: "Which pair of limits must a photo satisfy at the same time?",
      qBn: "একটি ছবিকে একসাথে কোন জোড়া সীমা পূরণ করতে হয়?",
      options: [
        "45 MB or smaller, and 4–100 megapixels",
        "100 MB or smaller, and 4–100 megapixels",
        "45 MB or smaller, and up to 200 megapixels",
        "3900 MB or smaller, and 4–100 megapixels",
      ],
      optionsBn: [
        "৪৫ MB বা তার কম, এবং ৪–১০০ মেগাপিক্সেল",
        "১০০ MB বা তার কম, এবং ৪–১০০ মেগাপিক্সেল",
        "৪৫ MB বা তার কম, এবং সর্বোচ্চ ২০০ মেগাপিক্সেল",
        "৩৯০০ MB বা তার কম, এবং ৪–১০০ মেগাপিক্সেল",
      ],
      answer: 0,
      explanation:
        "Both limits apply together: a photo must be 45 MB or smaller AND between 4 and 100 megapixels. The 3900 MB figure is the video limit, not the photo limit.",
      explanationBn:
        "দুটি সীমাই একসাথে প্রযোজ্য: ছবি ৪৫ MB বা তার কম হতেই হবে এবং ৪ থেকে ১০০ মেগাপিক্সেলের মধ্যে হতেই হবে। ৩৯০০ MB হলো ভিডিওর সীমা, ছবির নয়।",
    },
    {
      id: "L16-Q29",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A small brand logo is visible on a coffee cup in the background of your photo. What should you do?",
      qBn: "আপনার ছবির ব্যাকগ্রাউন্ডে একটি কফি কাপে ছোট একটি ব্র্যান্ড লোগো দেখা যাচ্ছে। আপনার কী করা উচিত?",
      options: [
        "Nothing — background logos never matter",
        "Nothing if the cup is out of focus",
        "Remove it, or the photo may be rejected for IP reasons",
        "Submit it for commercial use with a property release",
      ],
      optionsBn: [
        "কিছুই নয় — ব্যাকগ্রাউন্ডের লোগো কখনোই গুরুত্বপূর্ণ নয়",
        "কাপটি ঝাপসা থাকলে কিছুই নয়",
        "এটি সরিয়ে ফেলুন, নইলে মেধাসম্পদজনিত কারণে ছবিটি বাতিল হতে পারে",
        "প্রপার্টি রিলিজসহ বাণিজ্যিক ব্যবহারের জন্য জমা দিন",
      ],
      answer: 2,
      explanation:
        "Even a small visible logo can trigger an IP rejection in commercial content. Clone it out or crop it away before submitting.",
      explanationBn:
        "ছোট দৃশ্যমান লোগোও বাণিজ্যিক কনটেন্টে মেধাসম্পদজনিত বাতিলের কারণ হতে পারে। জমা দেওয়ার আগে এটি মুছে ফেলুন বা ক্রপ করে বাদ দিন।",
    },
    {
      id: "L16-Q30",
      topic: "Photos",
      topicBn: "ছবি",
      q: "A photo is sharp, well-lit, JPEG, sRGB, 24 megapixels, 12 MB, with no logos and no people in it. What can you say about it?",
      qBn: "একটি ছবি তীক্ষ্ণ, ভালো আলোযুক্ত, JPEG, sRGB, ২৪ মেগাপিক্সেল, ১২ MB, এতে কোনো লোগো বা মানুষ নেই। এটি সম্পর্কে কী বলা যায়?",
      options: [
        "It will definitely sell",
        "It meets the technical requirements — it can be submitted",
        "It needs a property release",
        "It must be submitted as editorial",
      ],
      optionsBn: [
        "এটি অবশ্যই বিক্রি হবে",
        "এটি কারিগরি প্রয়োজনীয়তা পূরণ করে — জমা দেওয়া যাবে",
        "এর জন্য প্রপার্টি রিলিজ দরকার",
        "এটি এডিটোরিয়াল হিসেবে জমা দিতে হবে",
      ],
      answer: 1,
      explanation:
        "It passes every technical rule — JPEG, sRGB, 4–100 megapixels, under 45 MB — and has no IP or release issues. Meeting the rules means it can be submitted, not that it is guaranteed to sell.",
      explanationBn:
        "এটি প্রতিটি কারিগরি নিয়ম পূরণ করে — JPEG, sRGB, ৪–১০০ মেগাপিক্সেল, ৪৫ MB-এর কম — এবং এতে কোনো মেধাসম্পদ বা রিলিজ সমস্যা নেই। নিয়ম পূরণের অর্থ জমা দেওয়া যাবে, বিক্রি নিশ্চিত হবে এমন নয়।",
    },
  ],
  17: [
    {
      id: "L17-Q01",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your photo shows a golden retriever playing on a beach at sunset. Which keyword belongs in the first 10?",
      qBn: "আপনার ছবিতে সূর্যাস্তের সময় সমুদ্রসৈকতে একটি গোল্ডেন রিট্রিভার খেলছে। কোন কীওয়ার্ডটি প্রথম ১০টিতে থাকা উচিত?",
      options: [
        "Golden retriever",
        "Happiness",
        "Summer",
        "Vacation",
      ],
      optionsBn: [
        "Golden retriever",
        "Happiness",
        "Summer",
        "Vacation",
      ],
      answer: 0,
      explanation:
        "The first 10 keywords carry the most search weight, so they must hold the most literal, specific terms — the actual subject. Broad concepts like happiness or vacation belong later in the list.",
      explanationBn:
        "প্রথম ১০টি কীওয়ার্ড সার্চে সবচেয়ে বেশি গুরুত্ব পায়, তাই সেখানে সবচেয়ে আক্ষরিক ও নির্দিষ্ট শব্দ — আসল বিষয়বস্তু — থাকতে হবে। সুখ বা ছুটির মতো বিস্তৃত ধারণা তালিকার পরে রাখা উচিত।",
    },
    {
      id: "L17-Q02",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "You add 55 keywords to an asset. What happens to the extras?",
      qBn: "আপনি একটি অ্যাসেটে ৫৫টি কীওয়ার্ড যোগ করলেন। অতিরিক্তগুলোর কী হবে?",
      options: [
        "All 55 are used — there is no limit",
        "Adobe keeps the best 55 and drops the rest",
        "Adobe charges extra for keywords over 49",
        "Only the first 49 are kept — the rest are dropped",
      ],
      optionsBn: [
        "৫৫টিই ব্যবহৃত হবে — কোনো সীমা নেই",
        "অ্যাডোবি সেরা ৫৫টি রেখে বাকিগুলো বাদ দেয়",
        "৪৯টির বেশি কীওয়ার্ডের জন্য অ্যাডোবি অতিরিক্ত চার্জ নেয়",
        "শুধু প্রথম ৪৯টি রাখা হয় — বাকিগুলো বাদ পড়ে",
      ],
      answer: 3,
      explanation:
        "Adobe Stock allows up to 49 keywords per asset. Anything beyond 49 is dropped, so a 55-keyword list silently loses its last 6 terms.",
      explanationBn:
        "অ্যাডোবি স্টকে প্রতিটি অ্যাসেটে সর্বোচ্চ ৪৯টি কীওয়ার্ড দেওয়া যায়। ৪৯টির বেশি হলে অতিরিক্তগুলো বাদ পড়ে, তাই ৫৫টি কীওয়ার্ডের তালিকা নীরবে শেষ ৬টি শব্দ হারায়।",
    },
    {
      id: "L17-Q03",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Adobe allows 49 keywords, but what range does it say is often plenty?",
      qBn: "অ্যাডোবি ৪৯টি কীওয়ার্ড অনুমোদন করে, কিন্তু কোন পরিসরকে তারা প্রায়শই যথেষ্ট বলে?",
      options: [
        "15 to 35 keywords",
        "40 to 49 keywords",
        "Exactly 49 keywords",
        "1 to 5 keywords",
      ],
      optionsBn: [
        "১৫ থেকে ৩৫টি কীওয়ার্ড",
        "৪০ থেকে ৪৯টি কীওয়ার্ড",
        "ঠিক ৪৯টি কীওয়ার্ড",
        "১ থেকে ৫টি কীওয়ার্ড",
      ],
      answer: 0,
      explanation:
        "More is not always better: Adobe says 15 to 35 accurate, relevant keywords are often plenty. Accuracy matters far more to buyers than the raw count.",
      explanationBn:
        "বেশি মানেই ভালো নয়: অ্যাডোবি বলে ১৫ থেকে ৩৫টি নির্ভুল ও প্রাসঙ্গিক কীওয়ার্ড প্রায়শই যথেষ্ট। সংখ্যার চেয়ে নির্ভুলতা ক্রেতাদের কাছে অনেক বেশি গুরুত্বপূর্ণ।",
    },
    {
      id: "L17-Q04",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Why should the important words from your title also appear in your first 10 keywords?",
      qBn: "আপনার টাইটেলের গুরুত্বপূর্ণ শব্দগুলো প্রথম ১০টি কীওয়ার্ডেও কেন থাকা উচিত?",
      options: [
        "It lets you use fewer than 15 keywords",
        "It makes the title longer",
        "It is required by the upload form",
        "It gives the content an extra boost for relevant searches",
      ],
      optionsBn: [
        "এতে ১৫টির কম কীওয়ার্ড ব্যবহার করা যায়",
        "এতে টাইটেল লম্বা হয়",
        "আপলোড ফরমে এটি বাধ্যতামূলক",
        "এতে প্রাসঙ্গিক সার্চে কনটেন্ট অতিরিক্ত গুরুত্ব পায়",
      ],
      answer: 3,
      explanation:
        "Adobe's own metadata guidance says to include all the important words from your title in the top 10 keywords — it boosts the asset for searches matching those queries.",
      explanationBn:
        "অ্যাডোবির নিজের মেটাডেটা নির্দেশিকা বলে টাইটেলের সব গুরুত্বপূর্ণ শব্দ শীর্ষ ১০টি কীওয়ার্ডে রাখতে — এতে সেসব অনুসন্ধানের সাথে মেলে এমন সার্চে অ্যাসেটটি অতিরিক্ত গুরুত্ব পায়।",
    },
    {
      id: "L17-Q05",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your photo is a quiet mountain lake. You add the trending keywords “concert”, “festival” and “party”. What is the risk?",
      qBn: "আপনার ছবিতে একটি শান্ত পাহাড়ি হ্রদ। আপনি ট্রেন্ডিং কীওয়ার্ড “concert”, “festival” ও “party” যোগ করলেন। ঝুঁকি কী?",
      options: [
        "The content can be rejected for irrelevant keywords",
        "The photo will appear in concert searches and sell more",
        "Nothing — trending keywords are encouraged",
        "Adobe will move the photo to the music category",
      ],
      optionsBn: [
        "অপ্রাসঙ্গিক কীওয়ার্ডের কারণে কনটেন্ট বাতিল হতে পারে",
        "ছবিটি কনসার্ট সার্চে দেখা যাবে এবং বেশি বিক্রি হবে",
        "কিছুই নয় — ট্রেন্ডিং কীওয়ার্ড ব্যবহারে উৎসাহ দেওয়া হয়",
        "অ্যাডোবি ছবিটিকে সংগীত ক্যাটাগরিতে সরিয়ে দেবে",
      ],
      answer: 0,
      explanation:
        "Stuffing unrelated trending terms into keywords is spam. Irrelevant or misleading keywords can lead to rejection, and repeat offenders may have their accounts blocked.",
      explanationBn:
        "অপ্রাসঙ্গিক ট্রেন্ডিং শব্দ কীওয়ার্ডে ভরা স্প্যাম। অপ্রাসঙ্গিক বা বিভ্রান্তিকর কীওয়ার্ডের কারণে কনটেন্ট বাতিল হতে পারে, আর বারবার এমন করলে অ্যাকাউন্ট ব্লকও হতে পারে।",
    },
    {
      id: "L17-Q06",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "When you upload a photo, Adobe Sensei automatically suggests keywords. How many can it suggest?",
      qBn: "ছবি আপলোড করলে Adobe Sensei স্বয়ংক্রিয়ভাবে কীওয়ার্ড সাজেস্ট করে। সর্বোচ্চ কয়টি সাজেস্ট করতে পারে?",
      options: [
        "Up to 5 keywords",
        "Up to 10 keywords",
        "Up to 49 keywords",
        "Up to 25 keywords",
      ],
      optionsBn: [
        "সর্বোচ্চ ৫টি কীওয়ার্ড",
        "সর্বোচ্চ ১০টি কীওয়ার্ড",
        "সর্বোচ্চ ৪৯টি কীওয়ার্ড",
        "সর্বোচ্চ ২৫টি কীওয়ার্ড",
      ],
      answer: 3,
      explanation:
        "Adobe's AI, Adobe Sensei, automatically recommends up to 25 keywords for your content — but you must still review them, order the best first, and remove any that are inaccurate.",
      explanationBn:
        "অ্যাডোবির AI, Adobe Sensei, আপনার কনটেন্টের জন্য সর্বোচ্চ ২৫টি কীওয়ার্ড স্বয়ংক্রিয়ভাবে সুপারিশ করে — তবে আপনাকে সেগুলো যাচাই করে সেরাগুলো প্রথমে সাজাতে হবে এবং ভুলগুলো সরাতে হবে।",
    },
    {
      id: "L17-Q07",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your contributor account is set to English. You add keywords in English and Spanish mixed together. What is the problem?",
      qBn: "আপনার কন্ট্রিবিউটর অ্যাকাউন্ট ইংরেজিতে সেট করা। আপনি ইংরেজি ও স্প্যানিশ মিশিয়ে কীওয়ার্ড যোগ করলেন। সমস্যা কী?",
      options: [
        "Titles and keywords must be in one language matching your account setting",
        "Spanish keywords are banned on Adobe Stock",
        "There is no problem at all",
        "Mixed languages reach more buyers",
      ],
      optionsBn: [
        "টাইটেল ও কীওয়ার্ড একটি মাত্র ভাষায় হতে হবে, অ্যাকাউন্ট সেটিংসের সাথে মিলিয়ে",
        "অ্যাডোবি স্টকে স্প্যানিশ কীওয়ার্ড নিষিদ্ধ",
        "এতে কোনো সমস্যাই নেই",
        "মিশ্র ভাষা বেশি ক্রেতার কাছে পৌঁছায়",
      ],
      answer: 0,
      explanation:
        "Adobe requires titles and keywords in a single language that matches your contributor account setting. Search translates them automatically for buyers in other languages.",
      explanationBn:
        "অ্যাডোবি চায় টাইটেল ও কীওয়ার্ড একটি মাত্র ভাষায় হোক, যা আপনার কন্ট্রিবিউটর অ্যাকাউন্টের সেটিংসের সাথে মেলে। সার্চ অন্য ভাষার ক্রেতাদের জন্য সেগুলো স্বয়ংক্রিয়ভাবে অনুবাদ করে।",
    },
    {
      id: "L17-Q08",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your photo shows a plain red coffee mug. Which keyword should you NOT add?",
      qBn: "আপনার ছবিতে একটি সাধারণ লাল কফি মগ দেখা যাচ্ছে। কোন কীওয়ার্ডটি যোগ করা উচিত নয়?",
      options: [
        "Ceramic cup",
        "Red mug",
        "Coffee",
        "A famous coffee brand name",
      ],
      optionsBn: [
        "Ceramic cup",
        "Red mug",
        "Coffee",
        "একটি বিখ্যাত কফি ব্র্যান্ডের নাম",
      ],
      answer: 3,
      explanation:
        "Brand names and trademarks are not allowed in titles or keywords, even when the brand appears in the photo. Describe the object generically instead.",
      explanationBn:
        "ছবিতে ব্র্যান্ড দেখা গেলেও টাইটেল বা কীওয়ার্ডে ব্র্যান্ডের নাম ও ট্রেডমার্ক অনুমোদিত নয়। বরং বস্তুটি সাধারণভাবে বর্ণনা করুন।",
    },
    {
      id: "L17-Q09",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "You submit three similar photos of the same beach, all with the exact same title and keywords. What can happen?",
      qBn: "আপনি একই সমুদ্রসৈকতের তিনটি একই ধরনের ছবি জমা দিলেন, সবগুলোতে একই টাইটেল ও কীওয়ার্ড। কী হতে পারে?",
      options: [
        "They can be refused — repeating the same metadata on similar submissions is a spam signal",
        "They sell faster because the metadata matches",
        "Nothing — identical metadata is required for similar photos",
        "Adobe merges them into one listing",
      ],
      optionsBn: [
        "এগুলো বাতিল হতে পারে — একই ধরনের জমায় একই মেটাডেটা পুনরাবৃত্তি স্প্যামের লক্ষণ",
        "মেটাডেটা মেলায় এগুলো দ্রুত বিক্রি হয়",
        "কিছুই নয় — একই ধরনের ছবিতে অভিন্ন মেটাডেটা বাধ্যতামূলক",
        "অ্যাডোবি এগুলোকে এক লিস্টিংয়ে একত্র করে",
      ],
      answer: 0,
      explanation:
        "Adobe's similar-content guidance says to diversify metadata: repeating the same titles and keywords across similar submissions can lead to refusal for being too similar.",
      explanationBn:
        "অ্যাডোবির অনুরূপ কনটেন্ট নির্দেশিকা বলে মেটাডেটা বৈচিত্র্যময় করতে হবে: একই ধরনের জমায় একই টাইটেল ও কীওয়ার্ড পুনরাবৃত্তি করলে অতিরিক্ত মিলের কারণে বাতিল হতে পারে।",
    },
    {
      id: "L17-Q10",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Which ordering of keywords is best for search?",
      qBn: "সার্চের জন্য কীওয়ার্ডের কোন ক্রমটি সবচেয়ে ভালো?",
      options: [
        "Alphabetical order",
        "Random order",
        "In the order the ideas occurred to you",
        "By importance — most important and most literal first",
      ],
      optionsBn: [
        "বর্ণানুক্রমিক ক্রম",
        "এলোমেলো ক্রম",
        "যে ক্রমে ধারণাগুলো মাথায় এসেছে",
        "গুরুত্ব অনুযায়ী — সবচেয়ে গুরুত্বপূর্ণ ও আক্ষরিক শব্দ প্রথমে",
      ],
      answer: 3,
      explanation:
        "Keyword order is a ranking signal: the first 10 carry the most weight. Arrange keywords by importance, starting with the main subject, then actions, location, visual details and broader concepts.",
      explanationBn:
        "কীওয়ার্ডের ক্রম একটি র‍্যাঙ্কিং সংকেত: প্রথম ১০টি সবচেয়ে বেশি গুরুত্ব পায়। প্রধান বিষয়বস্তু দিয়ে শুরু করে, তারপর কাজ, স্থান, দৃশ্যমান বিবরণ ও বিস্তৃত ধারণা — গুরুত্ব অনুযায়ী সাজান।",
    },
    {
      id: "L17-Q11",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "A buyer searches for “golden retriever puppy beach”. Your photo matches, but “puppy” is your 40th keyword. What is the effect?",
      qBn: "একজন ক্রেতা “golden retriever puppy beach” খুঁজছেন। আপনার ছবি মেলে, কিন্তু “puppy” আপনার ৪০তম কীওয়ার্ড। এর প্রভাব কী?",
      options: [
        "The photo still counts, but with less weight than if “puppy” were in the first 10",
        "The photo will not appear at all",
        "Adobe will move “puppy” to the first 10 automatically",
        "The photo will rank at the very top",
      ],
      optionsBn: [
        "ছবিটি তবুও গণ্য হবে, তবে “puppy” প্রথম ১০টিতে থাকলে যতটা গুরুত্ব পেত তার চেয়ে কম",
        "ছবিটি একদমই দেখা যাবে না",
        "অ্যাডোবি “puppy”-কে স্বয়ংক্রিয়ভাবে প্রথম ১০টিতে নিয়ে যাবে",
        "ছবিটি একদম শীর্ষে র‍্যাঙ্ক করবে",
      ],
      answer: 0,
      explanation:
        "Keywords 11 to 49 still count in search, just with less weight than the first 10. A key subject word buried at position 40 weakens the photo's ranking for that search.",
      explanationBn:
        "১১ থেকে ৪৯ নম্বর কীওয়ার্ড সার্চে তবুও গণ্য হয়, তবে প্রথম ১০টির চেয়ে কম গুরুত্ব পায়। ৪০ নম্বরে চাপা পড়া একটি মূল বিষয়বস্তুর শব্দ সেই সার্চে ছবির র‍্যাঙ্কিং দুর্বল করে।",
    },
    {
      id: "L17-Q12",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Which keyword adds the least search value to a photo of a red sports car?",
      qBn: "একটি লাল স্পোর্টস কারের ছবিতে কোন কীওয়ার্ডটি সবচেয়ে কম সার্চ মূল্য যোগ করে?",
      options: [
        "Vehicle",
        "Red sports car",
        "Automobile",
        "Beautiful",
      ],
      optionsBn: [
        "Vehicle",
        "Red sports car",
        "Automobile",
        "Beautiful",
      ],
      answer: 3,
      explanation:
        "Adobe's metadata guidance says to describe content precisely. Subjective praise words like “beautiful” describe an opinion, not the content — buyers search for what is in the image, not how pretty it is.",
      explanationBn:
        "অ্যাডোবির মেটাডেটা নির্দেশিকা বলে কনটেন্ট নির্ভুলভাবে বর্ণনা করতে। “Beautiful”-এর মতো ব্যক্তিগত প্রশংসাসূচক শব্দ মতামত বোঝায়, কনটেন্ট নয় — ক্রেতারা ছবিতে যা আছে তা খোঁজেন, ছবিটি কত সুন্দর তা নয়।",
    },
    {
      id: "L17-Q13",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "You misspell a key subject word in your keywords, writing “retriver” instead of “retriever”. What is the effect?",
      qBn: "আপনি কীওয়ার্ডে একটি মূল বিষয়বস্তুর শব্দ ভুল বানান লিখলেন — “retriever”-এর বদলে “retriver”। এর প্রভাব কী?",
      options: [
        "The misspelled keyword is useless for that search and wastes a slot",
        "Adobe corrects spelling automatically",
        "The photo is rejected for a spelling error",
        "Buyers searching for the correct spelling will still find the photo",
      ],
      optionsBn: [
        "ভুল বানানের কীওয়ার্ডটি সেই সার্চের জন্য অকেজো এবং একটি স্লট নষ্ট করে",
        "অ্যাডোবি স্বয়ংক্রিয়ভাবে বানান ঠিক করে দেয়",
        "বানান ভুলের কারণে ছবিটি বাতিল হয়",
        "সঠিক বানান খুঁজছেন এমন ক্রেতারা তবুও ছবিটি পাবেন",
      ],
      answer: 0,
      explanation:
        "Keywords must be accurate: a misspelled term will not match buyers' correctly spelled searches, so that keyword slot is wasted and the photo loses discoverability.",
      explanationBn:
        "কীওয়ার্ড নির্ভুল হতে হবে: ভুল বানানের শব্দ ক্রেতাদের সঠিক বানানের সার্চের সাথে মিলবে না, তাই সেই কীওয়ার্ড স্লটটি নষ্ট হয় এবং ছবির খুঁজে পাওয়ার সম্ভাবনা কমে।",
    },
    {
      id: "L17-Q14",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Do videos follow the same keyword limit as photos on Adobe Stock?",
      qBn: "অ্যাডোবি স্টকে ভিডিও কি ছবির মতো একই কীওয়ার্ড সীমা অনুসরণ করে?",
      options: [
        "No — videos need no keywords at all",
        "No — videos allow 100 keywords",
        "No — videos allow only 10 keywords",
        "Yes — up to 49 keywords for all asset types",
      ],
      optionsBn: [
        "না — ভিডিওতে কোনো কীওয়ার্ডই দরকার হয় না",
        "না — ভিডিওতে ১০০টি কীওয়ার্ড দেওয়া যায়",
        "না — ভিডিওতে শুধু ১০টি কীওয়ার্ড দেওয়া যায়",
        "হ্যাঁ — সব ধরনের অ্যাসেটে সর্বোচ্চ ৪৯টি কীওয়ার্ড",
      ],
      answer: 3,
      explanation:
        "The 49-keyword limit applies to all asset types on Adobe Stock — photos, videos, vectors and illustrations alike.",
      explanationBn:
        "৪৯টি কীওয়ার্ডের সীমা অ্যাডোবি স্টকের সব ধরনের অ্যাসেটে প্রযোজ্য — ছবি, ভিডিও, ভেক্টর ও ইলাস্ট্রেশন সবক্ষেত্রেই।",
    },
    {
      id: "L17-Q15",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your photo was taken in Paris, but Paris is not visible in the image. Should “Paris” be a keyword?",
      qBn: "আপনার ছবিটি প্যারিসে তোলা, কিন্তু ছবিতে প্যারিস দেখা যাচ্ছে না। “Paris” কি কীওয়ার্ড হওয়া উচিত?",
      options: [
        "Yes — the shoot location is always a keyword",
        "No — keywords must describe what is actually visible or true of the content",
        "Yes — location keywords always boost sales",
        "No — location keywords are banned",
      ],
      optionsBn: [
        "হ্যাঁ — শুটিংয়ের স্থান সবসময়ই কীওয়ার্ড",
        "না — কীওয়ার্ডে যা আসলে দৃশ্যমান বা কনটেন্ট সম্পর্কে সত্য, তা-ই বর্ণনা করতে হবে",
        "হ্যাঁ — স্থানের কীওয়ার্ড সবসময় বিক্রি বাড়ায়",
        "না — স্থানের কীওয়ার্ড নিষিদ্ধ",
      ],
      answer: 1,
      explanation:
        "Keywords must accurately describe the content. A location that cannot be seen or verified in the image is misleading — only add a location keyword when it is genuinely relevant to what the image shows.",
      explanationBn:
        "কীওয়ার্ড কনটেন্টকে নির্ভুলভাবে বর্ণনা করতে হবে। ছবিতে দেখা বা যাচাই করা যায় না এমন স্থান বিভ্রান্তিকর — স্থানের কীওয়ার্ড তখনই যোগ করুন যখন তা ছবিতে যা দেখা যাচ্ছে তার সাথে সত্যিই প্রাসঙ্গিক।",
    },
    {
      id: "L17-Q16",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Which of these is a good keyword habit?",
      qBn: "নিচের কোনটি একটি ভালো কীওয়ার্ড অভ্যাস?",
      options: [
        "Copying the same 49 keywords onto every photo",
        "Adding keywords for things that are not in the image",
        "Ordering keywords by importance, most literal first",
        "Using only broad words like “nice” and “good”",
      ],
      optionsBn: [
        "প্রতিটি ছবিতে একই ৪৯টি কীওয়ার্ড কপি করা",
        "ছবিতে নেই এমন জিনিসের কীওয়ার্ড যোগ করা",
        "গুরুত্ব অনুযায়ী কীওয়ার্ড সাজানো, সবচেয়ে আক্ষরিক শব্দ প্রথমে",
        "শুধু “nice” ও “good”-এর মতো বিস্তৃত শব্দ ব্যবহার করা",
      ],
      answer: 2,
      explanation:
        "Arrange keywords in order of importance: the most literal subject terms first, then actions, location, visual details and broader concepts. Copying identical lists or adding invisible subjects hurts discoverability and risks refusal.",
      explanationBn:
        "গুরুত্ব অনুযায়ী কীওয়ার্ড সাজান: সবচেয়ে আক্ষরিক বিষয়বস্তুর শব্দ প্রথমে, তারপর কাজ, স্থান, দৃশ্যমান বিবরণ ও বিস্তৃত ধারণা। অভিন্ন তালিকা কপি করা বা অদৃশ্য বিষয়ের কীওয়ার্ড যোগ করা খুঁজে পাওয়ার সম্ভাবনা কমায় এবং বাতিলের ঝুঁকি তৈরি করে।",
    },
    {
      id: "L17-Q17",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "You repeat the same keyword twice in your list, once as “dog” and once as “dogs”. What is the effect?",
      qBn: "আপনি আপনার তালিকায় একই কীওয়ার্ড দুবার দিলেন — একবার “dog”, আরেকবার “dogs”। এর প্রভাব কী?",
      options: [
        "It doubles the photo's ranking for dog searches",
        "It wastes a keyword slot — use distinct, relevant terms instead",
        "It is required for plural searches",
        "Adobe merges the two automatically",
      ],
      optionsBn: [
        "এতে কুকুরের সার্চে ছবির র‍্যাঙ্কিং দ্বিগুণ হয়",
        "এটি একটি কীওয়ার্ড স্লট নষ্ট করে — বরং স্বতন্ত্র ও প্রাসঙ্গিক শব্দ ব্যবহার করুন",
        "বহুবচন সার্চের জন্য এটি বাধ্যতামূলক",
        "অ্যাডোবি দুটিকে স্বয়ংক্রিয়ভাবে একত্র করে",
      ],
      answer: 1,
      explanation:
        "Each keyword slot is precious — only 49 exist and the first 10 matter most. Repeating near-identical terms wastes a slot that could hold a distinct, useful search term.",
      explanationBn:
        "প্রতিটি কীওয়ার্ড স্লট মূল্যবান — মাত্র ৪৯টি আছে এবং প্রথম ১০টি সবচেয়ে গুরুত্বপূর্ণ। প্রায় অভিন্ন শব্দ পুনরাবৃত্তি করলে একটি স্লট নষ্ট হয়, যেখানে একটি স্বতন্ত্র ও কার্যকর সার্চ শব্দ থাকতে পারত।",
    },
    {
      id: "L17-Q18",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your AI-generated image shows a fantasy dragon. Which keyword choice is correct?",
      qBn: "আপনার AI-তৈরি ছবিতে একটি কাল্পনিক ড্রাগন দেখা যাচ্ছে। কোন কীওয়ার্ড পছন্দটি সঠিক?",
      options: [
        "Keywords naming a famous fantasy movie character",
        "Keywords naming a real celebrity",
        "Descriptive keywords like “dragon” and “fantasy” with no artist or character names",
        "Keywords naming the AI tool that made it",
      ],
      optionsBn: [
        "বিখ্যাত ফ্যান্টাসি সিনেমার চরিত্রের নামযুক্ত কীওয়ার্ড",
        "বাস্তব সেলিব্রিটির নামযুক্ত কীওয়ার্ড",
        "“dragon” ও “fantasy”-এর মতো বর্ণনামূলক কীওয়ার্ড, কোনো শিল্পী বা চরিত্রের নাম ছাড়া",
        "যে AI টুল এটি বানিয়েছে তার নামযুক্ত কীওয়ার্ড",
      ],
      answer: 2,
      explanation:
        "Artist names, real people, fictional characters, copyrighted works and government agencies are prohibited in AI prompts, titles and keywords. Describe the content generically instead.",
      explanationBn:
        "AI প্রম্পট, টাইটেল ও কীওয়ার্ডে শিল্পীদের নাম, বাস্তব মানুষ, কাল্পনিক চরিত্র, কপিরাইটযুক্ত কাজ ও সরকারি সংস্থার নাম নিষিদ্ধ। বরং কনটেন্টটি সাধারণভাবে বর্ণনা করুন।",
    },
    {
      id: "L17-Q19",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "A keyword describes a concept that is not visible in the image at all. What should you do?",
      qBn: "একটি কীওয়ার্ড এমন একটি ধারণা বর্ণনা করে যা ছবিতে একদমই দেখা যাচ্ছে না। আপনার কী করা উচিত?",
      options: [
        "Keep it — extra concepts help",
        "Remove it — keywords must describe the actual content",
        "Move it to the first 10 so it gets more weight",
        "Keep it only if it is trending",
      ],
      optionsBn: [
        "রেখে দিন — অতিরিক্ত ধারণা সাহায্য করে",
        "সরিয়ে ফেলুন — কীওয়ার্ডে আসল কনটেন্টই বর্ণনা করতে হবে",
        "বেশি গুরুত্ব পেতে এটিকে প্রথম ১০টিতে নিয়ে যান",
        "ট্রেন্ডিং হলে শুধু তখনই রাখুন",
      ],
      answer: 1,
      explanation:
        "Irrelevant keywords mislead buyers and can lead to rejection. Every keyword must describe something genuinely present in the content.",
      explanationBn:
        "অপ্রাসঙ্গিক কীওয়ার্ড ক্রেতাদের বিভ্রান্ত করে এবং বাতিলের কারণ হতে পারে। প্রতিটি কীওয়ার্ডে কনটেন্টে সত্যিই আছে এমন কিছু বর্ণনা করতে হবে।",
    },
    {
      id: "L17-Q20",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Which keyword structure does Adobe recommend for a photo of a chef cooking pasta in a kitchen?",
      qBn: "রান্নাঘরে একজন শেফ পাস্তা রান্না করছেন — এমন ছবির জন্য অ্যাডোবি কোন কীওয়ার্ড কাঠামো সুপারিশ করে?",
      options: [
        "Only the word “cooking” repeated 49 times",
        "Broad concepts first, subject last",
        "Main subject first, then action, location, details and broader concepts",
        "Keywords in alphabetical order",
      ],
      optionsBn: [
        "শুধু “cooking” শব্দটি ৪৯ বার পুনরাবৃত্তি",
        "বিস্তৃত ধারণা প্রথমে, বিষয়বস্তু শেষে",
        "প্রধান বিষয়বস্তু প্রথমে, তারপর কাজ, স্থান, বিবরণ ও বিস্তৃত ধারণা",
        "বর্ণানুক্রমিক কীওয়ার্ড",
      ],
      answer: 2,
      explanation:
        "Adobe's recommended structure: start with the main subject, then add actions, locations, visual details and finally broader concepts — always in order of importance.",
      explanationBn:
        "অ্যাডোবির সুপারিশকৃত কাঠামো: প্রধান বিষয়বস্তু দিয়ে শুরু করুন, তারপর কাজ, স্থান, দৃশ্যমান বিবরণ এবং শেষে বিস্তৃত ধারণা যোগ করুন — সবসময় গুরুত্বের ক্রমে।",
    },
    {
      id: "L17-Q21",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "You add the camera model “Canon EOS R5” as a keyword. Is that useful?",
      qBn: "আপনি ক্যামেরার মডেল “Canon EOS R5” কীওয়ার্ড হিসেবে যোগ করলেন। এটি কি কার্যকর?",
      options: [
        "Yes — buyers search by camera model",
        "No — buyers search for content, not gear; it wastes a slot and names a brand",
        "Yes — it proves the photo's quality",
        "No — camera keywords are banned outright",
      ],
      optionsBn: [
        "হ্যাঁ — ক্রেতারা ক্যামেরা মডেল দিয়ে খোঁজেন",
        "না — ক্রেতারা কনটেন্ট খোঁজেন, যন্ত্রপাতি নয়; এতে একটি স্লট নষ্ট হয় এবং ব্র্যান্ডের নাম আসে",
        "হ্যাঁ — এটি ছবির মান প্রমাণ করে",
        "না — ক্যামেরার কীওয়ার্ড সম্পূর্ণ নিষিদ্ধ",
      ],
      answer: 1,
      explanation:
        "Buyers search for subjects, actions and concepts — not the gear used. A camera model also introduces a brand name, which is not allowed in keywords, and wastes a slot better used for a real content term.",
      explanationBn:
        "ক্রেতারা বিষয়বস্তু, কাজ ও ধারণা খোঁজেন — ব্যবহৃত যন্ত্রপাতি নয়। ক্যামেরার মডেল ব্র্যান্ডের নামও আনে, যা কীওয়ার্ডে অনুমোদিত নয়, এবং একটি স্লট নষ্ট করে যেখানে আসল কনটেন্ট শব্দ থাকতে পারত।",
    },
    {
      id: "L17-Q22",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your photo shows a Christmas tree, but it is June. Should you add the keyword “Christmas”?",
      qBn: "আপনার ছবিতে একটি ক্রিসমাস ট্রি দেখা যাচ্ছে, কিন্তু এখন জুন মাস। “Christmas” কীওয়ার্ডটি কি যোগ করা উচিত?",
      options: [
        "No — seasonal keywords are banned",
        "No — it is June, so the keyword is false",
        "Yes — the keyword must match what is visible, and the tree is visible",
        "Yes — but only in the last 10 keywords",
      ],
      optionsBn: [
        "না — ঋতুভিত্তিক কীওয়ার্ড নিষিদ্ধ",
        "না — এখন জুন মাস, তাই কীওয়ার্ডটি মিথ্যা",
        "হ্যাঁ — কীওয়ার্ডে যা দৃশ্যমান তা-ই থাকতে হবে, আর ট্রিটি দৃশ্যমান",
        "হ্যাঁ — তবে শুধু শেষ ১০টি কীওয়ার্ডে",
      ],
      answer: 2,
      explanation:
        "Keywords describe what is in the image, not when you uploaded it. A Christmas tree is visible, so “Christmas” is accurate — buyers planning ahead search for seasonal content all year.",
      explanationBn:
        "কীওয়ার্ড ছবিতে যা আছে তা বর্ণনা করে, আপনি কখন আপলোড করলেন তা নয়। ক্রিসমাস ট্রি দৃশ্যমান, তাই “Christmas” নির্ভুল — আগে থেকে পরিকল্পনাকারী ক্রেতারা সারা বছর ঋতুভিত্তিক কনটেন্ট খোঁজেন।",
    },
    {
      id: "L17-Q23",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "You have only 8 relevant keywords for a photo. What is the best approach?",
      qBn: "একটি ছবির জন্য আপনার কাছে মাত্র ৮টি প্রাসঙ্গিক কীওয়ার্ড আছে। সেরা পদ্ধতি কী?",
      options: [
        "Add 41 filler words to reach 49",
        "Submit with only the 8 accurate keywords",
        "Copy keywords from a popular unrelated photo",
        "Leave the keyword field empty",
      ],
      optionsBn: [
        "৪৯টিতে পৌঁছাতে ৪১টি অপ্রয়োজনীয় শব্দ যোগ করুন",
        "শুধু ৮টি নির্ভুল কীওয়ার্ড দিয়েই জমা দিন",
        "একটি জনপ্রিয় কিন্তু অপ্রাসঙ্গিক ছবি থেকে কীওয়ার্ড কপি করুন",
        "কীওয়ার্ডের ঘর খালি রাখুন",
      ],
      answer: 1,
      explanation:
        "Accuracy beats quantity: Adobe says 15 to 35 keywords are often plenty, and fewer accurate terms are far better than filler. Padding with irrelevant words risks rejection.",
      explanationBn:
        "নির্ভুলতা সংখ্যার চেয়ে গুরুত্বপূর্ণ: অ্যাডোবি বলে ১৫ থেকে ৩৫টি কীওয়ার্ড প্রায়শই যথেষ্ট, এবং কম নির্ভুল শব্দও অপ্রয়োজনীয় শব্দের চেয়ে অনেক ভালো। অপ্রাসঙ্গিক শব্দ দিয়ে ভরলে বাতিলের ঝুঁকি তৈরি হয়।",
    },
    {
      id: "L17-Q24",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Which keyword mistake can get your whole account blocked if you keep doing it?",
      qBn: "কোন কীওয়ার্ড ভুল বারবার করলে আপনার পুরো অ্যাকাউন্ট ব্লক হতে পারে?",
      options: [
        "Using fewer than 15 keywords",
        "Forgetting one keyword",
        "Repeatedly adding irrelevant or misleading keywords",
        "Putting the subject keyword in position 11",
      ],
      optionsBn: [
        "১৫টির কম কীওয়ার্ড ব্যবহার করা",
        "একটি কীওয়ার্ড ভুলে যাওয়া",
        "বারবার অপ্রাসঙ্গিক বা বিভ্রান্তিকর কীওয়ার্ড যোগ করা",
        "বিষয়বস্তুর কীওয়ার্ড ১১ নম্বরে রাখা",
      ],
      answer: 2,
      explanation:
        "Irrelevant or misleading keywords can lead to rejection, and Adobe warns that repeat offenders may have their accounts blocked.",
      explanationBn:
        "অপ্রাসঙ্গিক বা বিভ্রান্তিকর কীওয়ার্ডের কারণে কনটেন্ট বাতিল হতে পারে, এবং অ্যাডোবি সতর্ক করে যে বারবার এমন করলে অ্যাকাউন্ট ব্লক হতে পারে।",
    },
    {
      id: "L17-Q25",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "What is the smartest use of Adobe Sensei's suggested keywords?",
      qBn: "Adobe Sensei-এর সাজেস্ট করা কীওয়ার্ডগুলো সবচেয়ে বুদ্ধিমানের মতো কীভাবে ব্যবহার করবেন?",
      options: [
        "Accept all 25 suggestions exactly as given",
        "Review them, keep the accurate ones, order the best first, and remove the wrong ones",
        "Ignore them — AI suggestions are never allowed",
        "Use them only as the last 10 keywords",
      ],
      optionsBn: [
        "২৫টি সাজেশন যেমন দেওয়া হয়েছে ঠিক তেমনই গ্রহণ করুন",
        "যাচাই করুন, নির্ভুলগুলো রাখুন, সেরাগুলো প্রথমে সাজান এবং ভুলগুলো সরান",
        "উপেক্ষা করুন — AI সাজেশন কখনোই অনুমোদিত নয়",
        "শুধু শেষ ১০টি কীওয়ার্ড হিসেবে ব্যবহার করুন",
      ],
      answer: 1,
      explanation:
        "Sensei suggests up to 25 keywords, but suggestions are a starting point, not a final list. You are responsible for accuracy and order — the first 10 must hold your strongest, most literal terms.",
      explanationBn:
        "Sensei সর্বোচ্চ ২৫টি কীওয়ার্ড সাজেস্ট করে, তবে সাজেশন শুধু শুরু, চূড়ান্ত তালিকা নয়। নির্ভুলতা ও ক্রমের দায়িত্ব আপনার — প্রথম ১০টিতে আপনার সবচেয়ে শক্তিশালী ও আক্ষরিক শব্দ থাকতে হবে।",
    },
    {
      id: "L17-Q26",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your photo is a vector illustration of a rocket. Which keyword is NOT allowed?",
      qBn: "আপনার ছবিটি একটি রকেটের ভেক্টর ইলাস্ট্রেশন। কোন কীওয়ার্ডটি অনুমোদিত নয়?",
      options: [
        "Rocket",
        "Space",
        "A famous space agency's name",
        "Launch",
      ],
      optionsBn: [
        "Rocket",
        "Space",
        "একটি বিখ্যাত মহাকাশ সংস্থার নাম",
        "Launch",
      ],
      answer: 2,
      explanation:
        "Government agencies are prohibited in AI prompts, titles and keywords, and brand and trademarked names are not allowed in keywords generally. Describe the content generically instead.",
      explanationBn:
        "AI প্রম্পট, টাইটেল ও কীওয়ার্ডে সরকারি সংস্থার নাম নিষিদ্ধ, এবং সাধারণভাবে কীওয়ার্ডে ব্র্যান্ড ও ট্রেডমার্কযুক্ত নাম অনুমোদিত নয়। বরং কনটেন্টটি সাধারণভাবে বর্ণনা করুন।",
    },
    {
      id: "L17-Q27",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Two keywords describe the same visible thing: “beach” and “seashore”. Is it fine to use both?",
      qBn: "দুটি কীওয়ার্ড একই দৃশ্যমান জিনিস বর্ণনা করে: “beach” ও “seashore”। দুটিই ব্যবহার করা কি ঠিক?",
      options: [
        "No — synonyms are banned",
        "Yes — synonyms are useful because buyers search with different words",
        "No — only one word per concept is allowed",
        "Yes — but only if both are in the first 10",
      ],
      optionsBn: [
        "না — সমার্থক শব্দ নিষিদ্ধ",
        "হ্যাঁ — সমার্থক শব্দ কার্যকর, কারণ ক্রেতারা ভিন্ন ভিন্ন শব্দে খোঁজেন",
        "না — প্রতিটি ধারণার জন্য শুধু একটি শব্দ অনুমোদিত",
        "হ্যাঁ — তবে শুধু দুটিই প্রথম ১০টিতে থাকলে",
      ],
      answer: 1,
      explanation:
        "Synonyms are genuinely useful: different buyers search with different words for the same thing. Reserve the first slots for your primary subject and its direct synonyms.",
      explanationBn:
        "সমার্থক শব্দ সত্যিই কার্যকর: ভিন্ন ক্রেতারা একই জিনিস ভিন্ন শব্দে খোঁজেন। প্রথম স্লটগুলো আপনার প্রধান বিষয়বস্তু ও তার সরাসরি সমার্থক শব্দের জন্য রাখুন।",
    },
    {
      id: "L17-Q28",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Your keyword list is ordered by importance, but the main subject word sits at position 15. What should you change?",
      qBn: "আপনার কীওয়ার্ড তালিকা গুরুত্ব অনুযায়ী সাজানো, কিন্তু প্রধান বিষয়বস্তুর শব্দটি ১৫ নম্বরে আছে। কী বদলানো উচিত?",
      options: [
        "Nothing — position 15 is fine",
        "Delete the first 14 keywords",
        "Move the main subject word into the first 10",
        "Add 34 more keywords after it",
      ],
      optionsBn: [
        "কিছুই নয় — ১৫ নম্বর ঠিক আছে",
        "প্রথম ১৪টি কীওয়ার্ড মুছে ফেলুন",
        "প্রধান বিষয়বস্তুর শব্দটিকে প্রথম ১০টির মধ্যে নিয়ে আসুন",
        "এর পরে আরও ৩৪টি কীওয়ার্ড যোগ করুন",
      ],
      answer: 2,
      explanation:
        "The first 10 keywords have the biggest impact on search results, so the main subject and its most important words must sit there — not buried at position 15.",
      explanationBn:
        "প্রথম ১০টি কীওয়ার্ড সার্চ ফলাফলে সবচেয়ে বড় প্রভাব ফেলে, তাই প্রধান বিষয়বস্তু ও তার সবচেয়ে গুরুত্বপূর্ণ শব্দ সেখানেই থাকতে হবে — ১৫ নম্বরে চাপা পড়ে নয়।",
    },
    {
      id: "L17-Q29",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "Which combination shows the best keyword strategy for a photo of a woman drinking coffee at sunrise?",
      qBn: "সূর্যোদয়ের সময় একজন নারী কফি পান করছেন — এমন ছবির জন্য কোন সমন্বয়টি সেরা কীওয়ার্ড কৌশল দেখায়?",
      options: [
        "First 10: woman, coffee, sunrise, morning, drinking, cup, happy, lifestyle, beautiful, amazing",
        "First 10: woman drinking coffee, morning coffee, sunrise coffee, coffee lover, best coffee",
        "First 10: coffee, woman, sunrise, morning, cafe, breakfast, lifestyle, relaxation, warm, light",
        "First 10: coffee, coffee, coffee, woman, woman, sunrise, sunrise, morning, morning, cup",
      ],
      optionsBn: [
        "প্রথম ১০টি: woman, coffee, sunrise, morning, drinking, cup, happy, lifestyle, beautiful, amazing",
        "প্রথম ১০টি: woman drinking coffee, morning coffee, sunrise coffee, coffee lover, best coffee",
        "প্রথম ১০টি: coffee, woman, sunrise, morning, cafe, breakfast, lifestyle, relaxation, warm, light",
        "প্রথম ১০টি: coffee, coffee, coffee, woman, woman, sunrise, sunrise, morning, morning, cup",
      ],
      answer: 2,
      explanation:
        "The best list puts the literal subject terms first — coffee, woman, sunrise — then action, setting and concepts, with no repeated words and no subjective praise words like “beautiful” or “amazing”.",
      explanationBn:
        "সেরা তালিকায় আক্ষরিক বিষয়বস্তুর শব্দ প্রথমে থাকে — coffee, woman, sunrise — তারপর কাজ, পরিবেশ ও ধারণা, কোনো পুনরাবৃত্তি ছাড়া এবং “beautiful” বা “amazing”-এর মতো ব্যক্তিগত প্রশংসাসূচক শব্দ ছাড়া।",
    },
    {
      id: "L17-Q30",
      topic: "Keywords",
      topicBn: "কীওয়ার্ড",
      q: "A keyword is accurate, but it describes a tiny background detail almost no buyer would search for. What is the best call?",
      qBn: "একটি কীওয়ার্ড নির্ভুল, কিন্তু এটি ছবির একটি ক্ষুদ্র ব্যাকগ্রাউন্ড বিবরণ বর্ণনা করে যা প্রায় কোনো ক্রেতাই খুঁজবেন না। সেরা সিদ্ধান্ত কী?",
      options: [
        "Put it in the first 10 anyway",
        "Keep it, but place it after the first 10 — the top slots are for the main subject",
        "Delete it — only main subjects may be keywords",
        "Repeat it three times so it ranks higher",
      ],
      optionsBn: [
        "তবুও এটিকে প্রথম ১০টিতে রাখুন",
        "রাখুন, তবে প্রথম ১০টির পরে রাখুন — শীর্ষ স্লটগুলো প্রধান বিষয়বস্তুর জন্য",
        "মুছে ফেলুন — শুধু প্রধান বিষয়বস্তুই কীওয়ার্ড হতে পারে",
        "উচ্চ র‍্যাঙ্ক পেতে এটিকে তিনবার পুনরাবৃত্তি করুন",
      ],
      answer: 1,
      explanation:
        "Minor details can still be legitimate keywords — buyers do search for small details — but they belong in the later slots. The first 10 are reserved for the most important, most literal terms.",
      explanationBn:
        "ছোট বিবরণও বৈধ কীওয়ার্ড হতে পারে — ক্রেতারা ছোট বিবরণও খোঁজেন — তবে সেগুলো পরের স্লটে থাকে। প্রথম ১০টি সবচেয়ে গুরুত্বপূর্ণ ও আক্ষরিক শব্দের জন্য সংরক্ষিত।",
    },
  ],
  18: [
    {
      id: "L18-Q01",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Adobe recommends titles of about 70 characters, but what is the hard maximum a title can be?",
      qBn: "অ্যাডোবি প্রায় ৭০ অক্ষরের টাইটেল সুপারিশ করে, কিন্তু টাইটেলের কঠিন সর্বোচ্চ সীমা কত?",
      options: [
        "There is no maximum",
        "70 characters",
        "200 characters",
        "500 characters",
      ],
      optionsBn: [
        "কোনো সর্বোচ্চ সীমা নেই",
        "৭০ অক্ষর",
        "২০০ অক্ষর",
        "৫০০ অক্ষর",
      ],
      answer: 2,
      explanation:
        "Titles can run up to 200 characters, but Adobe recommends describing the content in about 70. Longer titles may be automatically shortened during submission.",
      explanationBn:
        "টাইটেল সর্বোচ্চ ২০০ অক্ষর পর্যন্ত হতে পারে, তবে অ্যাডোবি প্রায় ৭০ অক্ষরে কনটেন্ট বর্ণনা করার সুপারিশ করে। লম্বা টাইটেল জমা দেওয়ার সময় স্বয়ংক্রিয়ভাবে ছোট করে ফেলা হতে পারে।",
    },
    {
      id: "L18-Q02",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title is 150 characters long. What is the risk?",
      qBn: "আপনার টাইটেল ১৫০ অক্ষরের লম্বা। ঝুঁকি কী?",
      options: [
        "The file is rejected outright",
        "The title is deleted completely",
        "The keywords are deleted instead",
        "The title may be automatically shortened, losing important information",
      ],
      optionsBn: [
        "ফাইলটি সরাসরি বাতিল হয়",
        "টাইটেলটি সম্পূর্ণ মুছে যায়",
        "এর বদলে কীওয়ার্ডগুলো মুছে যায়",
        "টাইটেলটি স্বয়ংক্রিয়ভাবে ছোট হয়ে যেতে পারে, গুরুত্বপূর্ণ তথ্য হারিয়ে",
      ],
      answer: 3,
      explanation:
        "Titles over the recommended ~70 characters may be automatically shortened during the submission process — so keep titles concise to avoid losing important information.",
      explanationBn:
        "সুপারিশকৃত প্রায় ৭০ অক্ষরের বেশি টাইটেল জমা দেওয়ার সময় স্বয়ংক্রিয়ভাবে ছোট হয়ে যেতে পারে — তাই গুরুত্বপূর্ণ তথ্য হারানো এড়াতে টাইটেল সংক্ষিপ্ত রাখুন।",
    },
    {
      id: "L18-Q03",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which title best follows Adobe's guidance for a photo of a family cooking together in a kitchen?",
      qBn: "রান্নাঘরে একসাথে রান্না করা একটি পরিবারের ছবির জন্য অ্যাডোবির নির্দেশিকা অনুযায়ী কোন টাইটেলটি সবচেয়ে ভালো?",
      options: [
        "Family cooking together in a bright modern kitchen",
        "family kitchen cooking together happy fun food dinner",
        "Amazing beautiful wonderful family photo!!!",
        "IMG_4521_kitchen_final",
      ],
      optionsBn: [
        "Family cooking together in a bright modern kitchen",
        "family kitchen cooking together happy fun food dinner",
        "Amazing beautiful wonderful family photo!!!",
        "IMG_4521_kitchen_final",
      ],
      answer: 0,
      explanation:
        "A title should be a natural, descriptive phrase covering the subject, action and setting. Keyword strings, praise words, exclamation marks and filenames get flagged by reviewers.",
      explanationBn:
        "টাইটেল হওয়া উচিত একটি স্বাভাবিক, বর্ণনামূলক বাক্যাংশ যা বিষয়বস্তু, কাজ ও পরিবেশ তুলে ধরে। কীওয়ার্ডের সারি, প্রশংসাসূচক শব্দ, বিস্ময়চিহ্ন ও ফাইলের নাম রিভিউয়াররা ফ্ল্যাগ করেন।",
    },
    {
      id: "L18-Q04",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title is “dog beach sunset golden retriever summer fun vacation”. What is wrong with it?",
      qBn: "আপনার টাইটেল “dog beach sunset golden retriever summer fun vacation”। এতে সমস্যা কী?",
      options: [
        "It is too short",
        "It is in the wrong language",
        "It is a keyword string, not a descriptive phrase",
        "It mentions a dog",
      ],
      optionsBn: [
        "এটি খুব ছোট",
        "এটি ভুল ভাষায় লেখা",
        "এটি একটি কীওয়ার্ডের সারি, বর্ণনামূলক বাক্যাংশ নয়",
        "এতে কুকুরের কথা বলা হয়েছে",
      ],
      answer: 2,
      explanation:
        "Titles must be specific, descriptive phrases — not keyword stuffing. A comma-free string of search terms reads as spam and gets flagged by reviewers.",
      explanationBn:
        "টাইটেল হতে হবে নির্দিষ্ট, বর্ণনামূলক বাক্যাংশ — কীওয়ার্ড ঠাসা নয়। অনুসন্ধান শব্দের সারি স্প্যাম মনে হয় এবং রিভিউয়াররা তা ফ্ল্যাগ করেন।",
    },
    {
      id: "L18-Q05",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which title would a reviewer most likely flag?",
      qBn: "কোন টাইটেলটি রিভিউয়ার সবচেয়ে বেশি ফ্ল্যাগ করবেন?",
      options: [
        "Woman reading a book in a sunny park",
        "Red bicycle leaning against a brick wall",
        "Children playing soccer on a grass field",
        "BEST PHOTO EVER!!! Amazing stunning beautiful!!!",
      ],
      optionsBn: [
        "Woman reading a book in a sunny park",
        "Red bicycle leaning against a brick wall",
        "Children playing soccer on a grass field",
        "BEST PHOTO EVER!!! Amazing stunning beautiful!!!",
      ],
      answer: 3,
      explanation:
        "Praise words and exclamation marks are not descriptions of the content. Titles must describe what is actually visible — the subject, action and setting.",
      explanationBn:
        "প্রশংসাসূচক শব্দ ও বিস্ময়চিহ্ন কনটেন্টের বর্ণনা নয়। টাইটেলে আসলে যা দৃশ্যমান — বিষয়বস্তু, কাজ ও পরিবেশ — তা-ই বর্ণনা করতে হবে।",
    },
    {
      id: "L18-Q06",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "You use your camera file name, “DSC_0892”, as the title. What happens?",
      qBn: "আপনি ক্যামেরার ফাইলের নাম “DSC_0892” টাইটেল হিসেবে ব্যবহার করলেন। কী হবে?",
      options: [
        "It is accepted for photos but not for videos",
        "It is accepted — file names are good titles",
        "It is flagged — a file name tells buyers nothing about the content",
        "It is accepted if the keywords are good",
      ],
      optionsBn: [
        "ছবির ক্ষেত্রে গৃহীত হবে, ভিডিওর ক্ষেত্রে নয়",
        "গৃহীত হবে — ফাইলের নাম ভালো টাইটেল",
        "ফ্ল্যাগ হবে — ফাইলের নাম ক্রেতাদের কনটেন্ট সম্পর্কে কিছুই জানায় না",
        "কীওয়ার্ড ভালো হলে গৃহীত হবে",
      ],
      answer: 2,
      explanation:
        "Titles must be specific and descriptive. A filename like DSC_0892 describes nothing, so reviewers flag it — and buyers cannot find the content from it.",
      explanationBn:
        "টাইটেল নির্দিষ্ট ও বর্ণনামূলক হতেই হবে। DSC_0892-এর মতো ফাইলের নাম কিছুই বর্ণনা করে না, তাই রিভিউয়াররা তা ফ্ল্যাগ করেন — আর ক্রেতারাও তা দিয়ে কনটেন্ট খুঁজে পান না।",
    },
    {
      id: "L18-Q07",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your account language is English, but you write a title in French. What is the problem?",
      qBn: "আপনার অ্যাকাউন্টের ভাষা ইংরেজি, কিন্তু আপনি ফরাসিতে টাইটেল লিখলেন। সমস্যা কী?",
      options: [
        "Titles must be in one language matching your account setting",
        "French titles are banned on Adobe Stock",
        "There is no problem — more languages mean more buyers",
        "French titles are allowed only for photos of France",
      ],
      optionsBn: [
        "টাইটেল একটি মাত্র ভাষায় হতে হবে, অ্যাকাউন্ট সেটিংসের সাথে মিলিয়ে",
        "অ্যাডোবি স্টকে ফরাসি টাইটেল নিষিদ্ধ",
        "কোনো সমস্যা নেই — বেশি ভাষা মানে বেশি ক্রেতা",
        "ফরাসি টাইটেল শুধু ফ্রান্সের ছবির ক্ষেত্রে অনুমোদিত",
      ],
      answer: 0,
      explanation:
        "Adobe requires titles and keywords in a single language that matches your contributor account setting. Search translates them automatically for buyers in other languages.",
      explanationBn:
        "অ্যাডোবি চায় টাইটেল ও কীওয়ার্ড একটি মাত্র ভাষায় হোক, যা আপনার কন্ট্রিবিউটর অ্যাকাউন্টের সেটিংসের সাথে মেলে। সার্চ অন্য ভাষার ক্রেতাদের জন্য সেগুলো স্বয়ংক্রিয়ভাবে অনুবাদ করে।",
    },
    {
      id: "L18-Q08",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your photo shows a laptop on a desk. Which title is NOT allowed?",
      qBn: "আপনার ছবিতে একটি ডেস্কের ওপর একটি ল্যাপটপ দেখা যাচ্ছে। কোন টাইটেলটি অনুমোদিত নয়?",
      options: [
        "Laptop computer on a wooden desk",
        "Person working on a laptop at a desk",
        "A popular laptop brand name and model in the title",
        "Open laptop on a desk in a home office",
      ],
      optionsBn: [
        "Laptop computer on a wooden desk",
        "Person working on a laptop at a desk",
        "টাইটেলে একটি জনপ্রিয় ল্যাপটপ ব্র্যান্ডের নাম ও মডেল",
        "Open laptop on a desk in a home office",
      ],
      answer: 2,
      explanation:
        "Brand names and trademarks are not allowed in titles or keywords. Describe the object generically — “laptop computer” — instead of naming the brand.",
      explanationBn:
        "টাইটেল বা কীওয়ার্ডে ব্র্যান্ডের নাম ও ট্রেডমার্ক অনুমোদিত নয়। ব্র্যান্ডের নাম না দিয়ে বস্তুটি সাধারণভাবে বর্ণনা করুন — “laptop computer”।",
    },
    {
      id: "L18-Q09",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your AI image shows a wizard that looks like a famous movie character. Which title is correct?",
      qBn: "আপনার AI ছবিতে একজন জাদুকর আছেন যিনি একটি বিখ্যাত সিনেমার চরিত্রের মতো দেখতে। কোন টাইটেলটি সঠিক?",
      options: [
        "A title naming the famous movie character",
        "A title naming the actor who played the character",
        "A title naming the movie studio",
        "A generic title like “Wizard casting a spell in a dark forest”",
      ],
      optionsBn: [
        "বিখ্যাত সিনেমার চরিত্রের নামযুক্ত টাইটেল",
        "চরিত্রটি যে অভিনেতা অভিনয় করেছেন তার নামযুক্ত টাইটেল",
        "সিনেমা স্টুডিওর নামযুক্ত টাইটেল",
        "“Wizard casting a spell in a dark forest”-এর মতো সাধারণ টাইটেল",
      ],
      answer: 3,
      explanation:
        "Fictional characters, real people, artist names and copyrighted works are prohibited in AI titles. In fact, AI content depicting a copyrighted character is not allowed at all — describe the content generically and never name the character.",
      explanationBn:
        "AI টাইটেলে কাল্পনিক চরিত্র, বাস্তব মানুষ, শিল্পীদের নাম ও কপিরাইটযুক্ত কাজ নিষিদ্ধ। আসলে কপিরাইটযুক্ত চরিত্র দেখানো AI কনটেন্ট মোটেই অনুমোদিত নয় — কনটেন্টটি সাধারণভাবে বর্ণনা করুন এবং চরিত্রের নাম কখনোই উল্লেখ করবেন না।",
    },
    {
      id: "L18-Q10",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Adobe's guidance says a title should focus on what. Choose the best completion: “Focus on the ___ content.”",
      qBn: "অ্যাডোবির নির্দেশিকা বলে টাইটেলে কিসের ওপর ফোকাস করা উচিত? সেরা সমাপ্তি বেছে নিন: “___ কনটেন্টের ওপর ফোকাস করুন।”",
      options: [
        "Most colorful",
        "Most expensive",
        "Visually important",
        "Most popular",
      ],
      optionsBn: [
        "সবচেয়ে রঙিন",
        "সবচেয়ে দামি",
        "দৃশ্যত গুরুত্বপূর্ণ",
        "সবচেয়ে জনপ্রিয়",
      ],
      answer: 2,
      explanation:
        "Adobe advises titles to be brief and clear, focusing on the visually important content — what a buyer can actually see in the image.",
      explanationBn:
        "অ্যাডোবি পরামর্শ দেয় টাইটেল সংক্ষিপ্ত ও স্পষ্ট রাখতে এবং দৃশ্যত গুরুত্বপূর্ণ কনটেন্টের ওপর ফোকাস করতে — ছবিতে ক্রেতা আসলে যা দেখতে পান।",
    },
    {
      id: "L18-Q11",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which title is acceptable for a commercial photo of people marching in a protest?",
      qBn: "বিক্ষোভে মিছিল করা মানুষের বাণিজ্যিক ছবির জন্য কোন টাইটেলটি গ্রহণযোগ্য?",
      options: [
        "Protesters raise their arms in solidarity while marching together",
        "May 30th, 2020, crowds protesting the death of a man in downtown Seattle, USA",
        "Protest march in Seattle on May 30th 2020 against police violence",
        "Crowds at the George Floyd protest, Seattle, Washington, USA",
      ],
      optionsBn: [
        "Protesters raise their arms in solidarity while marching together",
        "May 30th, 2020, crowds protesting the death of a man in downtown Seattle, USA",
        "Protest march in Seattle on May 30th 2020 against police violence",
        "Crowds at the George Floyd protest, Seattle, Washington, USA",
      ],
      answer: 0,
      explanation:
        "Adobe explicitly accepts descriptive titles like the first option and rejects editorial-style captions with specific dates, names of people, brand names and event names on commercial content.",
      explanationBn:
        "অ্যাডোবি প্রথম বিকল্পের মতো বর্ণনামূলক টাইটেল স্পষ্টভাবে গ্রহণ করে এবং বাণিজ্যিক কনটেন্টে নির্দিষ্ট তারিখ, মানুষের নাম, ব্র্যান্ডের নাম ও অনুষ্ঠানের নামসহ এডিটোরিয়াল-ধাঁচের ক্যাপশন বাতিল করে।",
    },
    {
      id: "L18-Q12",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Why does Adobe warn against putting specific dates in a commercial title?",
      qBn: "বাণিজ্যিক টাইটেলে নির্দিষ্ট তারিখ দেওয়ার বিরুদ্ধে অ্যাডোবি কেন সতর্ক করে?",
      options: [
        "Dates confuse the search algorithm",
        "Dates are only allowed in video titles",
        "Dates make titles too long",
        "Dates are a form of editorial-style captioning, which is not accepted on commercial content",
      ],
      optionsBn: [
        "তারিখ সার্চ অ্যালগরিদমকে বিভ্রান্ত করে",
        "তারিখ শুধু ভিডিওর টাইটেলে অনুমোদিত",
        "তারিখ টাইটেলকে খুব লম্বা করে",
        "তারিখ এডিটোরিয়াল-ধাঁচের ক্যাপশনের একটি রূপ, যা বাণিজ্যিক কনটেন্টে গ্রহণ করা হয় না",
      ],
      answer: 3,
      explanation:
        "Commercial content must have descriptive titles, not editorial-style captions. Specific dates, names of people, brand names and event names belong in news captions — not in stock titles.",
      explanationBn:
        "বাণিজ্যিক কনটেন্টের টাইটেল বর্ণনামূলক হতেই হবে, এডিটোরিয়াল-ধাঁচের ক্যাপশন নয়। নির্দিষ্ট তারিখ, মানুষের নাম, ব্র্যান্ডের নাম ও অনুষ্ঠানের নাম সংবাদের ক্যাপশনে মানায় — স্টক টাইটেলে নয়।",
    },
    {
      id: "L18-Q13",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title mentions your camera: “Shot on Canon EOS R5, 50mm lens, f/1.8”. What is wrong?",
      qBn: "আপনার টাইটেলে ক্যামেরার কথা বলা হয়েছে: “Shot on Canon EOS R5, 50mm lens, f/1.8”। সমস্যা কী?",
      options: [
        "Nothing — camera details help buyers",
        "Nothing — it proves the photo is professional",
        "Nothing — gear details are recommended",
        "Titles should describe the content, not the gear — avoid technical and camera details",
      ],
      optionsBn: [
        "কিছুই নয় — ক্যামেরার বিবরণ ক্রেতাদের সাহায্য করে",
        "কিছুই নয় — এটি প্রমাণ করে ছবিটি পেশাদার",
        "কিছুই নয় — যন্ত্রপাতির বিবরণ সুপারিশ করা হয়",
        "টাইটেলে কনটেন্ট বর্ণনা করা উচিত, যন্ত্রপাতি নয় — কারিগরি ও ক্যামেরার বিবরণ এড়িয়ে চলুন",
      ],
      answer: 3,
      explanation:
        "Adobe's title guidance says to avoid overly technical or gear-heavy terms. Buyers search for what the image shows, not what camera took it — and brand names are not allowed in titles.",
      explanationBn:
        "অ্যাডোবির টাইটেল নির্দেশিকা বলে অতিরিক্ত কারিগরি বা যন্ত্রপাতি-কেন্দ্রিক শব্দ এড়িয়ে চলতে। ক্রেতারা ছবিতে যা দেখা যায় তা খোঁজেন, কোন ক্যামেরায় তোলা হয়েছে তা নয় — আর টাইটেলে ব্র্যান্ডের নাম অনুমোদিত নয়।",
    },
    {
      id: "L18-Q14",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title is 250 characters long. What must you do?",
      qBn: "আপনার টাইটেল ২৫০ অক্ষরের লম্বা। আপনাকে কী করতে হবে?",
      options: [
        "Shorten it — titles cannot exceed 200 characters",
        "Split it into two titles",
        "Move the extra words into the file name",
        "Submit it — there is no maximum",
      ],
      optionsBn: [
        "ছোট করুন — টাইটেল ২০০ অক্ষর ছাড়াতে পারবে না",
        "এটিকে দুটি টাইটেলে ভাগ করুন",
        "অতিরিক্ত শব্দগুলো ফাইলের নামে নিয়ে যান",
        "জমা দিন — কোনো সর্বোচ্চ সীমা নেই",
      ],
      answer: 0,
      explanation:
        "The hard maximum for a title is 200 characters. A 250-character title must be shortened — and ideally kept around 70 characters so nothing important is cut off.",
      explanationBn:
        "টাইটেলের কঠিন সর্বোচ্চ সীমা ২০০ অক্ষর। ২৫০ অক্ষরের টাইটেল ছোট করতেই হবে — এবং আদর্শভাবে প্রায় ৭০ অক্ষরে রাখুন, যাতে গুরুত্বপূর্ণ কিছু কাটা না পড়ে।",
    },
    {
      id: "L18-Q15",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title is “Sunset over the sea, photo by John Smith”. What is wrong with it?",
      qBn: "আপনার টাইটেল: “Sunset over the sea, photo by John Smith”। এতে কী ভুল?",
      options: [
        "Nothing — a credit in the title is good practice",
        "Only the comma is wrong",
        "It is fine as long as the title is under 70 characters",
        "People's names, including the photographer's own name, do not belong in titles",
      ],
      optionsBn: [
        "কিছুই না — টাইটেলে কৃতিত্ব দেওয়া ভালো চর্চা",
        "শুধু কমাটি ভুল",
        "টাইটেল ৭০ অক্ষরের কম হলে ঠিক আছে",
        "টাইটেলে মানুষের নাম, এমনকি ফটোগ্রাফারের নিজের নামও, থাকা উচিত নয়",
      ],
      answer: 3,
      explanation:
        "Adobe's guidance says brand names, product names and people's names should not appear in titles — describe what is visible instead of crediting yourself.",
      explanationBn:
        "অ্যাডোবির নির্দেশনা বলে টাইটেলে ব্র্যান্ডের নাম, পণ্যের নাম ও মানুষের নাম থাকা উচিত নয় — নিজেকে কৃতিত্ব না দিয়ে যা দৃশ্যমান তা বর্ণনা করুন।",
    },
    {
      id: "L18-Q16",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "You write a title in two languages: “Sunset over the sea / Surja dubonto sagore”. What is the problem?",
      qBn: "আপনি দুটি ভাষায় একটি টাইটেল লিখলেন: “Sunset over the sea / Surja dubonto sagore”। সমস্যা কী?",
      options: [
        "Two languages double the reach",
        "Titles must be in a single language matching your account setting",
        "Bengali titles are banned",
        "It is fine as long as English comes first",
      ],
      optionsBn: [
        "দুটি ভাষা রিচ দ্বিগুণ করে",
        "টাইটেল একটি মাত্র ভাষায় হতে হবে, অ্যাকাউন্ট সেটিংসের সাথে মিলিয়ে",
        "বাংলা টাইটেল নিষিদ্ধ",
        "ইংরেজি প্রথমে থাকলে ঠিক আছে",
      ],
      answer: 1,
      explanation:
        "Mixing two languages in a title breaks the single-language rule. Pick the one language that matches your account setting — search translates it automatically for other buyers.",
      explanationBn:
        "একটি টাইটেলে দুটি ভাষা মেশানো একক-ভাষার নিয়ম ভঙ্গ করে। অ্যাকাউন্ট সেটিংসের সাথে মেলে এমন একটি ভাষা বেছে নিন — সার্চ অন্য ক্রেতাদের জন্য তা স্বয়ংক্রিয়ভাবে অনুবাদ করে।",
    },
    {
      id: "L18-Q17",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title repeats the word “coffee” five times to rank higher. What happens?",
      qBn: "আপনার টাইটেলে উচ্চ র‍্যাঙ্ক পেতে “coffee” শব্দটি পাঁচবার পুনরাবৃত্তি করা হয়েছে। কী হবে?",
      options: [
        "The photo ranks five times higher",
        "Nothing — repetition is a good SEO trick",
        "It is keyword stuffing and can be flagged by reviewers",
        "Adobe removes the extra copies automatically and approves it",
      ],
      optionsBn: [
        "ছবিটি পাঁচগুণ উচ্চ র‍্যাঙ্ক পায়",
        "কিছুই নয় — পুনরাবৃত্তি একটি ভালো SEO কৌশল",
        "এটি কীওয়ার্ড ঠাসা এবং রিভিউয়াররা ফ্ল্যাগ করতে পারেন",
        "অ্যাডোবি অতিরিক্ত কপিগুলো স্বয়ংক্রিয়ভাবে সরিয়ে অনুমোদন দেয়",
      ],
      answer: 2,
      explanation:
        "Repeating a word to game search is keyword stuffing, not a description. Titles must be natural, descriptive phrases — reviewers flag stuffed titles.",
      explanationBn:
        "সার্চে এগিয়ে যেতে শব্দ পুনরাবৃত্তি করা কীওয়ার্ড ঠাসা, বর্ণনা নয়। টাইটেল স্বাভাবিক, বর্ণনামূলক বাক্যাংশ হতেই হবে — ঠাসা টাইটেল রিভিউয়াররা ফ্ল্যাগ করেন।",
    },
    {
      id: "L18-Q18",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Do video titles follow the same rules as photo titles?",
      qBn: "ভিডিওর টাইটেল কি ছবির টাইটেলের মতো একই নিয়ম অনুসরণ করে?",
      options: [
        "No — video titles can be any length",
        "Yes — the same title rules apply: descriptive phrase, about 70 characters, one language",
        "No — video titles must be keyword strings",
        "No — videos do not need titles at all",
      ],
      optionsBn: [
        "না — ভিডিওর টাইটেল যেকোনো দৈর্ঘ্যের হতে পারে",
        "হ্যাঁ — একই টাইটেল নিয়ম প্রযোজ্য: বর্ণনামূলক বাক্যাংশ, প্রায় ৭০ অক্ষর, একটি ভাষা",
        "না — ভিডিওর টাইটেল কীওয়ার্ডের সারি হতেই হবে",
        "না — ভিডিওতে টাইটেল একদমই দরকার হয় না",
      ],
      answer: 1,
      explanation:
        "Title rules apply to every asset type. A video title must also be a short, descriptive phrase in one language — keyword strings and praise words are flagged just the same.",
      explanationBn:
        "টাইটেল নিয়ম প্রতিটি অ্যাসেটের ক্ষেত্রে প্রযোজ্য। ভিডিওর টাইটেলও সংক্ষিপ্ত, বর্ণনামূলক বাক্যাংশ হতে হবে একটি ভাষায় — কীওয়ার্ডের সারি ও প্রশংসাসূচক শব্দ একইভাবে ফ্ল্যাগ হয়।",
    },
    {
      id: "L18-Q19",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which title is best for a video of waves crashing on rocks?",
      qBn: "পাথরে আছড়ে পড়া ঢেউয়ের ভিডিওর জন্য কোন টাইটেলটি সবচেয়ে ভালো?",
      options: [
        "Ocean waves crashing against rocky cliffs at sunset",
        "waves ocean sea water beach nature beautiful amazing",
        "WAVE_VIDEO_FINAL_v3.mp4",
        "The most amazing ocean video you will ever see!!!",
      ],
      optionsBn: [
        "Ocean waves crashing against rocky cliffs at sunset",
        "waves ocean sea water beach nature beautiful amazing",
        "WAVE_VIDEO_FINAL_v3.mp4",
        "The most amazing ocean video you will ever see!!!",
      ],
      answer: 0,
      explanation:
        "The first title is a natural, descriptive phrase with subject, action and setting, within the recommended length. The others are a keyword string, a filename and praise-word hype.",
      explanationBn:
        "প্রথম টাইটেলটি বিষয়বস্তু, কাজ ও পরিবেশসহ একটি স্বাভাবিক, বর্ণনামূলক বাক্যাংশ, সুপারিশকৃত দৈর্ঘ্যের মধ্যে। বাকিগুলো কীওয়ার্ডের সারি, ফাইলের নাম ও প্রশংসাসূচক প্রচারণা।",
    },
    {
      id: "L18-Q20",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title describes a snowy mountain, but the photo shows a tropical beach. What is the risk?",
      qBn: "আপনার টাইটেলে তুষারাবৃত পাহাড়ের কথা বলা হয়েছে, কিন্তু ছবিতে একটি গ্রীষ্মমণ্ডলীয় সমুদ্রসৈকত দেখা যাচ্ছে। ঝুঁকি কী?",
      options: [
        "Nothing — titles are just suggestions",
        "The photo may be rejected for misleading metadata",
        "Buyers will enjoy the surprise",
        "Adobe will fix the title automatically",
      ],
      optionsBn: [
        "কিছুই নয় — টাইটেল শুধু পরামর্শ",
        "বিভ্রান্তিকর মেটাডেটার কারণে ছবিটি বাতিল হতে পারে",
        "ক্রেতারা চমকটি উপভোগ করবেন",
        "অ্যাডোবি টাইটেলটি স্বয়ংক্রিয়ভাবে ঠিক করে দেবে",
      ],
      answer: 1,
      explanation:
        "Titles and keywords must accurately describe the content. Misleading metadata confuses buyers and can lead to rejection — describe what is actually in the image.",
      explanationBn:
        "টাইটেল ও কীওয়ার্ডে কনটেন্ট নির্ভুলভাবে বর্ণনা করতে হবে। বিভ্রান্তিকর মেটাডেটা ক্রেতাদের বিভ্রান্ত করে এবং বাতিলের কারণ হতে পারে — ছবিতে আসলে যা আছে তা-ই বর্ণনা করুন।",
    },
    {
      id: "L18-Q21",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title uses the main subject word once, and your keywords include synonyms of it. Why is that better than repeating the same word in the title?",
      qBn: "আপনার টাইটেলে প্রধান বিষয়বস্তুর শব্দটি একবার ব্যবহার করা হয়েছে, এবং আপনার কীওয়ার্ডে এর সমার্থক শব্দ আছে। টাইটেলে একই শব্দ পুনরাবৃত্তি করার চেয়ে এটি কেন ভালো?",
      options: [
        "It makes the title shorter than 70 characters",
        "It is required by the upload form",
        "Titles must be natural descriptive phrases, and repeating a word is keyword stuffing — synonyms in keywords cover the search variants",
        "It lets you use fewer keywords overall",
      ],
      optionsBn: [
        "এতে টাইটেল ৭০ অক্ষরের চেয়ে ছোট হয়",
        "আপলোড ফরমে এটি বাধ্যতামূলক",
        "টাইটেল স্বাভাবিক বর্ণনামূলক বাক্যাংশ হতেই হবে, এবং শব্দ পুনরাবৃত্তি কীওয়ার্ড ঠাসা — কীওয়ার্ডের সমার্থক শব্দ সার্চের ভিন্নতাগুলো কভার করে",
        "এতে মোট কম কীওয়ার্ড ব্যবহার করা যায়",
      ],
      answer: 2,
      explanation:
        "A title must read as a natural descriptive phrase — repeating a word to game search is keyword stuffing and gets flagged. Synonyms belong in the keywords, where different buyers' search words are covered without stuffing the title.",
      explanationBn:
        "টাইটেল স্বাভাবিক বর্ণনামূলক বাক্যাংশ হিসেবে পড়তে হবে — সার্চে এগিয়ে যেতে শব্দ পুনরাবৃত্তি করা কীওয়ার্ড ঠাসা এবং তা ফ্ল্যাগ হয়। সমার্থক শব্দ কীওয়ার্ডে থাকে, যেখানে ভিন্ন ক্রেতাদের সার্চ শব্দগুলো টাইটেল ঠাসা ছাড়াই কভার হয়।",
    },
    {
      id: "L18-Q22",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "A title reads: “Business team meeting office”. What is the best fix?",
      qBn: "একটি টাইটেলে লেখা: “Business team meeting office”। সেরা সংশোধন কী?",
      options: [
        "Add more keywords to it",
        "Rewrite it as a sentence: “Business team having a meeting in a modern office”",
        "Make it all capital letters",
        "Add exclamation marks to make it exciting",
      ],
      optionsBn: [
        "এতে আরও কীওয়ার্ড যোগ করুন",
        "বাক্য হিসেবে আবার লিখুন: “Business team having a meeting in a modern office”",
        "সব বড় হাতের অক্ষরে লিখুন",
        "উত্তেজনাপূর্ণ করতে বিস্ময়চিহ্ন যোগ করুন",
      ],
      answer: 1,
      explanation:
        "A title should be a natural, descriptive phrase — a sentence-like description of the subject, action and setting — not a bare string of nouns.",
      explanationBn:
        "টাইটেল হওয়া উচিত একটি স্বাভাবিক, বর্ণনামূলক বাক্যাংশ — বিষয়বস্তু, কাজ ও পরিবেশের বাক্যের মতো বর্ণনা — শুধু বিশেষ্যের সারি নয়।",
    },
    {
      id: "L18-Q23",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which title follows Adobe's rules for an AI-generated image of a futuristic city?",
      qBn: "ভবিষ্যতের শহরের AI-তৈরি ছবির জন্য অ্যাডোবির নিয়ম অনুযায়ী কোন টাইটেলটি সঠিক?",
      options: [
        "Futuristic city skyline with flying vehicles at dusk",
        "A title naming a famous science-fiction movie",
        "A title naming a famous concept artist",
        "A title naming a real city and claiming the image is a real photo of it",
      ],
      optionsBn: [
        "Futuristic city skyline with flying vehicles at dusk",
        "একটি বিখ্যাত কল্পবিজ্ঞান সিনেমার নামযুক্ত টাইটেল",
        "একটি বিখ্যাত কনসেপ্ট শিল্পীর নামযুক্ত টাইটেল",
        "একটি বাস্তব শহরের নাম দিয়ে ছবিটিকে তার আসল ছবি বলে দাবি করা টাইটেল",
      ],
      answer: 0,
      explanation:
        "AI titles must not contain artist names, real people, fictional characters or copyrighted works — and an AI image must never be presented as a real photo of a real place or event. A generic descriptive title is correct.",
      explanationBn:
        "AI টাইটেলে শিল্পীদের নাম, বাস্তব মানুষ, কাল্পনিক চরিত্র বা কপিরাইটযুক্ত কাজ থাকা যাবে না — এবং AI ছবিকে কখনোই কোনো বাস্তব স্থান বা ঘটনার আসল ছবি হিসেবে উপস্থাপন করা যাবে না। সাধারণ বর্ণনামূলক টাইটেলই সঠিক।",
    },
    {
      id: "L18-Q24",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title is exactly 70 characters and describes the subject, action and setting. What does Adobe say about it?",
      qBn: "আপনার টাইটেল ঠিক ৭০ অক্ষরের এবং বিষয়বস্তু, কাজ ও পরিবেশ বর্ণনা করে। অ্যাডোবি এ সম্পর্কে কী বলে?",
      options: [
        "It is too short",
        "It is ideal — about 70 characters is the recommended length",
        "It must be shortened to 50 characters",
        "It must be lengthened to 200 characters",
      ],
      optionsBn: [
        "এটি খুব ছোট",
        "এটি আদর্শ — প্রায় ৭০ অক্ষরই সুপারিশকৃত দৈর্ঘ্য",
        "এটি ৫০ অক্ষরে ছোট করতে হবে",
        "এটি ২০০ অক্ষরে বড় করতে হবে",
      ],
      answer: 1,
      explanation:
        "Adobe recommends describing content in around 70 characters. A 70-character descriptive title hits the recommendation exactly — and stays safely under the 200-character maximum.",
      explanationBn:
        "অ্যাডোবি প্রায় ৭০ অক্ষরে কনটেন্ট বর্ণনা করার সুপারিশ করে। ৭০ অক্ষরের বর্ণনামূলক টাইটেল সুপারিশটি ঠিকঠাক পূরণ করে — এবং ২০০ অক্ষরের সর্বোচ্চ সীমার নিরাপদে নিচে থাকে।",
    },
    {
      id: "L18-Q25",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "You submit three similar photos of the same market stall. What should their titles be?",
      qBn: "আপনি একই বাজারের স্টলের তিনটি একই ধরনের ছবি জমা দিচ্ছেন। তাদের টাইটেল কেমন হওয়া উচিত?",
      options: [
        "All three with the exact same title",
        "All three with no title at all",
        "All three with the same title plus a number: “Market stall 1, 2, 3”",
        "Each with its own accurate title reflecting what makes that shot different",
      ],
      optionsBn: [
        "তিনটিতেই ঠিক একই টাইটেল",
        "তিনটিতেই কোনো টাইটেল নয়",
        "তিনটিতেই একই টাইটেল সাথে নম্বর: “Market stall 1, 2, 3”",
        "প্রতিটিতে নিজস্ব নির্ভুল টাইটেল, যা সেই শটের ভিন্নতা প্রতিফলিত করে",
      ],
      answer: 3,
      explanation:
        "Adobe's similar-content guidance says to diversify metadata: repeating the same titles and keywords across similar submissions can lead to refusal. Each variation needs its own accurate title.",
      explanationBn:
        "অ্যাডোবির অনুরূপ কনটেন্ট নির্দেশিকা বলে মেটাডেটা বৈচিত্র্যময় করতে হবে: একই ধরনের জমায় একই টাইটেল ও কীওয়ার্ড পুনরাবৃত্তি করলে বাতিল হতে পারে। প্রতিটি ভিন্নতার জন্য নিজস্ব নির্ভুল টাইটেল দরকার।",
    },
    {
      id: "L18-Q26",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which of these titles is written in the style Adobe recommends?",
      qBn: "নিচের কোন টাইটেলটি অ্যাডোবির সুপারিশকৃত ধাঁচে লেখা?",
      options: [
        "STUNNING SUNSET!!! BEST EVER!!!",
        "Sunset over calm ocean water with fishing boats",
        "sunset sea boats water sky orange beautiful",
        "sunset_final_edit_v2.jpg",
      ],
      optionsBn: [
        "STUNNING SUNSET!!! BEST EVER!!!",
        "Sunset over calm ocean water with fishing boats",
        "sunset sea boats water sky orange beautiful",
        "sunset_final_edit_v2.jpg",
      ],
      answer: 1,
      explanation:
        "Adobe recommends a brief, clear, descriptive phrase in natural language. The correct option describes subject, action and setting in about 70 characters or fewer.",
      explanationBn:
        "অ্যাডোবি স্বাভাবিক ভাষায় সংক্ষিপ্ত, স্পষ্ট, বর্ণনামূলক বাক্যাংশ সুপারিশ করে। সঠিক বিকল্পটি প্রায় ৭০ অক্ষর বা তার কমে বিষয়বস্তু, কাজ ও পরিবেশ বর্ণনা করে।",
    },
    {
      id: "L18-Q27",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "A title says “Happy family on vacation in Hawaii”. The photo shows a family at a beach, but no location is identifiable. What is the problem?",
      qBn: "একটি টাইটেলে বলা হয়েছে “Happy family on vacation in Hawaii”। ছবিতে সমুদ্রসৈকতে একটি পরিবার দেখা যাচ্ছে, কিন্তু কোনো স্থান চেনা যাচ্ছে না। সমস্যা কী?",
      options: [
        "Claiming a specific location that is not visible makes the title misleading",
        "Family photos are not allowed",
        "The word “happy” is banned",
        "There is no problem at all",
      ],
      optionsBn: [
        "দেখা যায় না এমন নির্দিষ্ট স্থানের দাবি টাইটেলটিকে বিভ্রান্তিকর করে",
        "পরিবারের ছবি অনুমোদিত নয়",
        "“happy” শব্দটি নিষিদ্ধ",
        "এতে কোনো সমস্যাই নেই",
      ],
      answer: 0,
      explanation:
        "Titles must accurately describe the content. Naming a specific place that cannot be seen or verified in the image is misleading metadata — describe only what the image actually shows.",
      explanationBn:
        "টাইটেলে কনটেন্ট নির্ভুলভাবে বর্ণনা করতে হবে। ছবিতে দেখা বা যাচাই করা যায় না এমন নির্দিষ্ট স্থানের নাম দেওয়া বিভ্রান্তিকর মেটাডেটা — ছবিতে আসলে যা দেখা যাচ্ছে তা-ই বর্ণনা করুন।",
    },
    {
      id: "L18-Q28",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Your title is a single word: “Sunset”. Why is that weak?",
      qBn: "আপনার টাইটেল একটি মাত্র শব্দ: “Sunset”। এটি দুর্বল কেন?",
      options: [
        "One-word titles are banned",
        "It describes nothing about the subject, action or setting",
        "It is too long",
        "It is in the wrong language",
      ],
      optionsBn: [
        "এক শব্দের টাইটেল নিষিদ্ধ",
        "এটি বিষয়বস্তু, কাজ বা পরিবেশ সম্পর্কে কিছুই বর্ণনা করে না",
        "এটি খুব লম্বা",
        "এটি ভুল ভাষায় লেখা",
      ],
      answer: 1,
      explanation:
        "Adobe wants titles that are specific and descriptive. A single word gives buyers almost no information — a phrase like “Sunset over calm ocean water with fishing boats” tells them what the image actually shows.",
      explanationBn:
        "অ্যাডোবি চায় টাইটেল নির্দিষ্ট ও বর্ণনামূলক হোক। একটি মাত্র শব্দ ক্রেতাদের প্রায় কোনো তথ্য দেয় না — “Sunset over calm ocean water with fishing boats”-এর মতো বাক্যাংশ জানায় ছবিতে আসলে কী দেখা যাচ্ছে।",
    },
    {
      id: "L18-Q29",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "Which title mistake is most likely to get a photo flagged by a reviewer?",
      qBn: "কোন টাইটেল ভুলের কারণে একটি ছবি রিভিউয়ারের ফ্ল্যাগ পাওয়ার সম্ভাবনা সবচেয়ে বেশি?",
      options: [
        "A 60-character descriptive phrase",
        "A title in the account language",
        "A title naming the subject, action and setting",
        "A title that is a string of keywords with no sentence structure",
      ],
      optionsBn: [
        "৬০ অক্ষরের বর্ণনামূলক বাক্যাংশ",
        "অ্যাকাউন্টের ভাষায় লেখা টাইটেল",
        "বিষয়বস্তু, কাজ ও পরিবেশের নামযুক্ত টাইটেল",
        "বাক্য কাঠামো ছাড়া কীওয়ার্ডের সারি দিয়ে তৈরি টাইটেল",
      ],
      answer: 3,
      explanation:
        "Keyword strings, praise words and filenames are exactly what reviewers flag. A natural descriptive phrase of about 70 characters in the account language is what Adobe asks for.",
      explanationBn:
        "কীওয়ার্ডের সারি, প্রশংসাসূচক শব্দ ও ফাইলের নাম — এগুলোই রিভিউয়াররা ফ্ল্যাগ করেন। অ্যাকাউন্টের ভাষায় প্রায় ৭০ অক্ষরের স্বাভাবিক বর্ণনামূলক বাক্যাংশই অ্যাডোবি চায়।",
    },
    {
      id: "L18-Q30",
      topic: "Titles",
      topicBn: "টাইটেল",
      q: "You write a great 60-character title, but it is in a different language from your keywords. What is wrong?",
      qBn: "আপনি একটি চমৎকার ৬০ অক্ষরের টাইটেল লিখলেন, কিন্তু এটি আপনার কীওয়ার্ডের ভাষা থেকে ভিন্ন। সমস্যা কী?",
      options: [
        "Nothing — titles and keywords can be in different languages",
        "Titles and keywords must be in one language matching your account setting",
        "The title must be translated into the keyword language by hand",
        "It is fine as long as the title is short",
      ],
      optionsBn: [
        "কিছুই নয় — টাইটেল ও কীওয়ার্ড ভিন্ন ভাষায় হতে পারে",
        "টাইটেল ও কীওয়ার্ড একটি মাত্র ভাষায় হতে হবে, অ্যাকাউন্ট সেটিংসের সাথে মিলিয়ে",
        "টাইটেলটি হাতে কীওয়ার্ডের ভাষায় অনুবাদ করতে হবে",
        "টাইটেল ছোট হলে ঠিক আছে",
      ],
      answer: 1,
      explanation:
        "The single-language rule covers titles and keywords together: both must be in one language matching your contributor account setting. Search translates them automatically.",
      explanationBn:
        "একক-ভাষার নিয়ম টাইটেল ও কীওয়ার্ড উভয়ের ক্ষেত্রেই প্রযোজ্য: দুটিই একটি মাত্র ভাষায় হতে হবে, অ্যাকাউন্ট সেটিংসের সাথে মিলিয়ে। সার্চ সেগুলো স্বয়ংক্রিয়ভাবে অনুবাদ করে।",
    },
  ],
  19: [
    {
      id: "L19-Q01",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Adobe's test for whether a model release is needed is: “Would the person ___ themselves in the photo?”",
      qBn: "মডেল রিলিজ দরকার কি না, অ্যাডোবির পরীক্ষা হলো: “ব্যক্তিটি কি ছবিতে নিজেকে ___ পারবেন?”",
      options: [
        "Like",
        "Buy",
        "Recognize",
        "Forget",
      ],
      optionsBn: [
        "পছন্দ করবেন",
        "কিনবেন",
        "চিনতে পারবেন",
        "ভুলে যাবেন",
      ],
      answer: 2,
      explanation:
        "Adobe's rule: ask whether the person would recognize themselves in the photo — not whether a stranger could identify them. Recognition can come from the face, tattoos, clothing, voice, equipment or location.",
      explanationBn:
        "অ্যাডোবির নিয়ম: ব্যক্তিটি ছবিতে নিজেকে চিনতে পারবেন কি না তা জিজ্ঞাসা করুন — অপরিচিত কেউ চিনতে পারবেন কি না তা নয়। মুখ, ট্যাটু, পোশাক, কণ্ঠ, যন্ত্রপাতি বা স্থান দিয়েও চেনা যেতে পারে।",
    },
    {
      id: "L19-Q02",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your video includes a voiceover by a speaker who never appears on camera. Is a model release needed?",
      qBn: "আপনার ভিডিওতে একজন বক্তার ভয়েসওভার আছে, যিনি ক্যামেরায় কখনো আসেননি। মডেল রিলিজ কি দরকার?",
      options: [
        "Yes — a voice can identify a person, so the speaker needs a model release",
        "No — only faces need releases",
        "No — voices are not personal data",
        "Yes — but only if the speaker is famous",
      ],
      optionsBn: [
        "হ্যাঁ — কণ্ঠ দিয়ে একজন মানুষকে চেনা যায়, তাই বক্তার মডেল রিলিজ দরকার",
        "না — শুধু মুখের জন্যই রিলিজ দরকার",
        "না — কণ্ঠ ব্যক্তিগত তথ্য নয়",
        "হ্যাঁ — তবে শুধু বক্তা বিখ্যাত হলে",
      ],
      answer: 0,
      explanation:
        "Adobe requires a model release from the speaker when a video includes voices. A voice is one of the things that can make a person recognizable.",
      explanationBn:
        "ভিডিওতে কণ্ঠ থাকলে অ্যাডোবি বক্তার কাছ থেকে মডেল রিলিজ চায়। কণ্ঠ এমন একটি জিনিস যা দিয়ে একজন মানুষকে চেনা যেতে পারে।",
    },
    {
      id: "L19-Q03",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "A model is photographed nude, but their face and body are not recognizable. Is a model release still required?",
      qBn: "একজন মডেলকে নগ্ন অবস্থায় তোলা হয়েছে, কিন্তু তার মুখ ও শরীর চেনা যায় না। তবুও কি মডেল রিলিজ দরকার?",
      options: [
        "No — no one can recognize them",
        "No — nude photos are never accepted anyway",
        "No — only the face matters",
        "Yes — and the release must include a copy of the model's photo ID",
      ],
      optionsBn: [
        "না — কেউ তাদের চিনতে পারবে না",
        "না — নগ্ন ছবি এমনিতেই কখনো গৃহীত হয় না",
        "না — শুধু মুখই গুরুত্বপূর্ণ",
        "হ্যাঁ — এবং রিলিজের সাথে মডেলের ছবিযুক্ত পরিচয়পত্রের কপি থাকতে হবে",
      ],
      answer: 3,
      explanation:
        "If the model is nude or depicted in a sexual way but otherwise not recognizable, a model release is still required — and it must include a copy of the model's photo ID to verify that the model is an adult.",
      explanationBn:
        "মডেল নগ্ন বা যৌনভাবে চিত্রিত হলে, চেনা না গেলেও মডেল রিলিজ দরকার — এবং মডেল প্রাপ্তবয়স্ক তা যাচাই করতে রিলিজের সাথে মডেলের ছবিযুক্ত পরিচয়পত্রের কপি থাকতে হবে।",
    },
    {
      id: "L19-Q04",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You take a self-portrait and submit it commercially. How must you sign the model release?",
      qBn: "আপনি একটি সেলফ-পোর্ট্রেট তুলে বাণিজ্যিকভাবে জমা দিলেন। মডেল রিলিজে কীভাবে স্বাক্ষর করতে হবে?",
      options: [
        "Sign it twice — once as the photographer and once as the model",
        "Ask a friend to sign as the model",
        "Sign only as the photographer",
        "No release is needed for your own photo",
      ],
      optionsBn: [
        "দুবার স্বাক্ষর করুন — একবার ফটোগ্রাফার হিসেবে, আরেকবার মডেল হিসেবে",
        "একজন বন্ধুকে মডেল হিসেবে স্বাক্ষর করতে বলুন",
        "শুধু ফটোগ্রাফার হিসেবে স্বাক্ষর করুন",
        "নিজের ছবির জন্য রিলিজ দরকার হয় না",
      ],
      answer: 0,
      explanation:
        "Self-portraits still need a model release. You must sign as both the photographer and the model, because you are both.",
      explanationBn:
        "সেলফ-পোর্ট্রেটের জন্যও মডেল রিলিজ দরকার। আপনাকে ফটোগ্রাফার ও মডেল — দুই ভূমিকাতেই স্বাক্ষর করতে হবে, কারণ আপনি দুটোই।",
    },
    {
      id: "L19-Q05",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You photograph a football team of 11 players. How many model releases do you need?",
      qBn: "আপনি ১১ জন খেলোয়াড়ের একটি ফুটবল দলের ছবি তুললেন। কয়টি মডেল রিলিজ দরকার?",
      options: [
        "One — signed by the coach for the whole team",
        "One — signed by the team captain",
        "One for each person — 11 separate releases",
        "None — team photos are exempt",
      ],
      optionsBn: [
        "একটি — পুরো দলের পক্ষে কোচ স্বাক্ষর করবেন",
        "একটি — দলের অধিনায়ক স্বাক্ষর করবেন",
        "প্রত্যেকের জন্য একটি করে — ১১টি আলাদা রিলিজ",
        "কোনোটিই নয় — দলের ছবি ছাড় পায়",
      ],
      answer: 2,
      explanation:
        "When photographing a group, you need the names and signatures of each person on a separate release. The coach cannot sign for the whole group.",
      explanationBn:
        "দলের ছবি তুললে প্রত্যেক ব্যক্তির নাম ও স্বাক্ষর আলাদা রিলিজে দরকার। কোচ পুরো দলের পক্ষে স্বাক্ষর করতে পারেন না।",
    },
    {
      id: "L19-Q06",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "A 16-year-old model signs the release, and one parent signs as witness. What does Adobe recommend to reduce the risk of consent being revoked?",
      qBn: "একজন ১৬ বছর বয়সী মডেল রিলিজে স্বাক্ষর করেছে, এবং একজন বাবা-মা সাক্ষী হিসেবে স্বাক্ষর করেছেন। সম্মতি প্রত্যাহারের ঝুঁকি কমাতে অ্যাডোবি কী সুপারিশ করে?",
      options: [
        "Try to get both parents to sign — one as parent/guardian, the other as witness",
        "One parent's signature is always enough",
        "The minor's own signature is enough",
        "No signatures are needed for minors",
      ],
      optionsBn: [
        "দুজন বাবা-মায়ের স্বাক্ষর নেওয়ার চেষ্টা করুন — একজন বাবা-মা/অভিভাবক হিসেবে, অন্যজন সাক্ষী হিসেবে",
        "একজন বাবা-মায়ের স্বাক্ষরই সবসময় যথেষ্ট",
        "অপ্রাপ্তবয়স্কের নিজের স্বাক্ষরই যথেষ্ট",
        "অপ্রাপ্তবয়স্কদের জন্য কোনো স্বাক্ষর দরকার হয় না",
      ],
      answer: 0,
      explanation:
        "For minors, a parent or legal guardian must sign. Adobe recommends trying to get both parents to sign — one as the parent or legal guardian and the other as the witness — to reduce the risk that one parent later tries to revoke the other's consent.",
      explanationBn:
        "অপ্রাপ্তবয়স্কদের ক্ষেত্রে বাবা-মা বা আইনি অভিভাবককে স্বাক্ষর করতে হয়। অ্যাডোবি সুপারিশ করে দুজন বাবা-মায়ের স্বাক্ষর নেওয়ার চেষ্টা করতে — একজন বাবা-মা বা আইনি অভিভাবক হিসেবে, অন্যজন সাক্ষী হিসেবে — যাতে একজন বাবা-মা পরে অন্যের সম্মতি প্রত্যাহারের চেষ্টা করার ঝুঁকি কমে।",
    },
    {
      id: "L19-Q07",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You photograph your own child for a commercial submission. How do you sign the release?",
      qBn: "আপনি বাণিজ্যিক জমার জন্য আপনার নিজের সন্তানের ছবি তুললেন। রিলিজে কীভাবে স্বাক্ষর করবেন?",
      options: [
        "Your child signs it",
        "You sign once as the photographer",
        "No release is needed for your own child",
        "You print your name and sign twice — once as the artist and once as the parent",
      ],
      optionsBn: [
        "আপনার সন্তান স্বাক্ষর করবে",
        "আপনি শুধু ফটোগ্রাফার হিসেবে একবার স্বাক্ষর করবেন",
        "নিজের সন্তানের জন্য রিলিজ দরকার হয় না",
        "আপনি নাম লিখে দুবার স্বাক্ষর করবেন — একবার শিল্পী হিসেবে, আরেকবার বাবা-মা হিসেবে",
      ],
      answer: 3,
      explanation:
        "If you are a parent photographing your child, you must print your name and sign twice: once as the artist and once as the parent.",
      explanationBn:
        "আপনি যদি বাবা-মা হিসেবে নিজের সন্তানের ছবি তোলেন, তাহলে আপনার নাম লিখে দুবার স্বাক্ষর করতে হবে: একবার শিল্পী হিসেবে, আরেকবার বাবা-মা হিসেবে।",
    },
    {
      id: "L19-Q08",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your model release is complete except it does not say when or where the shoot happened. What is the problem?",
      qBn: "আপনার মডেল রিলিজ সম্পূর্ণ, শুধু শুট কখন বা কোথায় হয়েছিল তা লেখা নেই। সমস্যা কী?",
      options: [
        "Nothing — the shoot date and location are optional details",
        "Only the location is required, not the date",
        "The release must include information about the date and location of the shoot",
        "Only the date is required, not the location",
      ],
      optionsBn: [
        "কিছুই না — শুটের তারিখ ও স্থান ঐচ্ছিক তথ্য",
        "শুধু স্থান প্রয়োজন, তারিখ নয়",
        "রিলিজে শুটের তারিখ ও স্থানের তথ্য থাকতে হবে",
        "শুধু তারিখ প্রয়োজন, স্থান নয়",
      ],
      answer: 2,
      explanation:
        "Adobe's model release checklist requires information about the date and location of the recording session — a release missing them is incomplete.",
      explanationBn:
        "অ্যাডোবির মডেল রিলিজ চেকলিস্টে শুটের তারিখ ও স্থানের তথ্য প্রয়োজন — এগুলো না থাকলে রিলিজ অসম্পূর্ণ।",
    },
    {
      id: "L19-Q09",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You collect signatures using Adobe Sign from inside the Contributor portal. What changes about the witness requirement?",
      qBn: "আপনি কন্ট্রিবিউটর পোর্টালের ভেতর থেকে Adobe Sign ব্যবহার করে স্বাক্ষর সংগ্রহ করলেন। সাক্ষীর প্রয়োজনীয়তায় কী পরিবর্তন হয়?",
      options: [
        "A witness becomes mandatory",
        "The witness must be a lawyer",
        "No witness signature is required",
        "Two witnesses are required",
      ],
      optionsBn: [
        "সাক্ষী বাধ্যতামূলক হয়ে যায়",
        "সাক্ষীকে আইনজীবী হতে হয়",
        "সাক্ষীর স্বাক্ষর দরকার হয় না",
        "দুজন সাক্ষী প্রয়োজন হয়",
      ],
      answer: 2,
      explanation:
        "A signature from a witness is not required if you use the Adobe Sign feature to collect electronic signatures. Adobe accepts Acrobat Sign routing from inside the portal, with no software to install.",
      explanationBn:
        "ইলেকট্রনিক স্বাক্ষর সংগ্রহে Adobe Sign ফিচার ব্যবহার করলে সাক্ষীর স্বাক্ষর দরকার হয় না। অ্যাডোবি পোর্টালের ভেতর থেকে Acrobat Sign রাউটিং গ্রহণ করে, কোনো সফটওয়্যার ইনস্টল ছাড়াই।",
    },
    {
      id: "L19-Q10",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "In what file format and size must model and property releases be uploaded?",
      qBn: "মডেল ও প্রপার্টি রিলিজ কোন ফাইল ফরম্যাটে ও সাইজে আপলোড করতে হয়?",
      options: [
        "JPEG files, maximum 10 MB",
        "PDF files, maximum 45 MB",
        "PNG files, any size",
        "ZIP folders of scans",
      ],
      optionsBn: [
        "JPEG ফাইল, সর্বোচ্চ ১০ MB",
        "PDF ফাইল, সর্বোচ্চ ৪৫ MB",
        "PNG ফাইল, যেকোনো সাইজ",
        "স্ক্যানের ZIP ফোল্ডার",
      ],
      answer: 0,
      explanation:
        "Releases can only be uploaded as JPEGs, with a maximum size of 10 MB. Upload high-resolution scans so the form stays legible.",
      explanationBn:
        "রিলিজ শুধু JPEG হিসেবে আপলোড করা যায়, সর্বোচ্চ ১০ MB সাইজে। ফরমটি পড়া যায় এমন রাখতে উচ্চ রেজোলিউশনের স্ক্যান আপলোড করুন।",
    },
    {
      id: "L19-Q11",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "A release file is named “ModelReleaseForTheBeachPhotoshootWithSaraAndJohn”. What is the problem?",
      qBn: "একটি রিলিজ ফাইলের নাম “ModelReleaseForTheBeachPhotoshootWithSaraAndJohn”। সমস্যা কী?",
      options: [
        "The name is too descriptive",
        "The name must be in capital letters",
        "The name must match the model's ID exactly",
        "Release titles must be fewer than 30 characters long",
      ],
      optionsBn: [
        "নামটি খুব বেশি বর্ণনামূলক",
        "নামটি বড় হাতের অক্ষরে হতে হবে",
        "নামটি মডেলের পরিচয়পত্রের সাথে ঠিক মিলতে হবে",
        "রিলিজের টাইটেল ৩০ অক্ষরের কম হতে হবে",
      ],
      answer: 3,
      explanation:
        "Adobe requires model release titles to be fewer than 30 characters long. A long descriptive filename like this one will be rejected.",
      explanationBn:
        "অ্যাডোবি চায় মডেল রিলিজের টাইটেল ৩০ অক্ষরের কম হোক। এ ধরনের লম্বা বর্ণনামূলক ফাইলের নাম বাতিল হবে।",
    },
    {
      id: "L19-Q12",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "On a model release, the model signed on Monday and the photographer signed on Friday. What is the problem?",
      qBn: "একটি মডেল রিলিজে মডেল সোমবার স্বাক্ষর করেছেন এবং ফটোগ্রাফার শুক্রবার স্বাক্ষর করেছেন। সমস্যা কী?",
      options: [
        "Nothing — different dates are fine",
        "All signatures must be dated and the dates must match",
        "The photographer's date must be earlier",
        "Only the model's date matters",
      ],
      optionsBn: [
        "কিছুই নয় — ভিন্ন তারিখ ঠিক আছে",
        "সব স্বাক্ষরে তারিখ থাকতে হবে এবং তারিখগুলো মিলতে হবে",
        "ফটোগ্রাফারের তারিখ আগে হতে হবে",
        "শুধু মডেলের তারিখই গুরুত্বপূর্ণ",
      ],
      answer: 1,
      explanation:
        "Adobe's release checklist requires all signatures to be dated, and the dates must match. Mismatched dates make the release invalid.",
      explanationBn:
        "অ্যাডোবির রিলিজ চেকলিস্টে সব স্বাক্ষরে তারিখ থাকা বাধ্যতামূলক, এবং তারিখগুলো মিলতে হবে। তারিখ না মিললে রিলিজটি অবৈধ হয়।",
    },
    {
      id: "L19-Q13",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your Adobe Stock account is under the name “Md Sonet Mia”, but the release lists the photographer as “Sonet Photography”. What happens?",
      qBn: "আপনার অ্যাডোবি স্টক অ্যাকাউন্ট “Md Sonet Mia” নামে, কিন্তু রিলিজে ফটোগ্রাফার হিসেবে “Sonet Photography” লেখা। কী হবে?",
      options: [
        "It is accepted — a studio name is fine",
        "It is accepted if the model agrees",
        "It is rejected — the photographer name must match the account holder name",
        "It is accepted for photos but not for videos",
      ],
      optionsBn: [
        "গৃহীত হবে — স্টুডিওর নাম ঠিক আছে",
        "মডেল রাজি থাকলে গৃহীত হবে",
        "বাতিল হবে — ফটোগ্রাফারের নাম অ্যাকাউন্টধারীর নামের সাথে মিলতে হবে",
        "ছবির ক্ষেত্রে গৃহীত হবে, ভিডিওর ক্ষেত্রে নয়",
      ],
      answer: 2,
      explanation:
        "Adobe's checklist states the name of the photographer must be the same as the Adobe Stock account holder name. A different studio or brand name makes the release invalid.",
      explanationBn:
        "অ্যাডোবির চেকলিস্টে বলা আছে ফটোগ্রাফারের নাম অ্যাডোবি স্টক অ্যাকাউন্টধারীর নামের সাথে একই হতে হবে। ভিন্ন স্টুডিও বা ব্র্যান্ডের নাম রিলিজটিকে অবৈধ করে।",
    },
    {
      id: "L19-Q14",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You scan a signed release, but part of it is cut off and you digitally paste in the missing signature from another scan. What happens?",
      qBn: "আপনি একটি স্বাক্ষরিত রিলিজ স্ক্যান করলেন, কিন্তু একাংশ কাটা পড়েছে এবং আপনি অন্য স্ক্যান থেকে অনুপস্থিত স্বাক্ষরটি ডিজিটালভাবে বসিয়ে দিলেন। কী হবে?",
      options: [
        "It is accepted — the information is complete",
        "It is rejected — moderators cannot accept a release that appears stitched together digitally",
        "It is accepted if the paste is neat",
        "It is accepted for model releases but not property releases",
      ],
      optionsBn: [
        "গৃহীত হবে — তথ্য সম্পূর্ণ আছে",
        "বাতিল হবে — ডিজিটালভাবে জোড়া লাগানো মনে হয় এমন রিলিজ মডারেটররা গ্রহণ করতে পারেন না",
        "জোড়া নিখুঁত হলে গৃহীত হবে",
        "মডেল রিলিজের ক্ষেত্রে গৃহীত হবে, প্রপার্টি রিলিজের ক্ষেত্রে নয়",
      ],
      answer: 1,
      explanation:
        "Adobe explicitly warns that moderators cannot accept a release that appears stitched together digitally. Re-scan the complete original form instead.",
      explanationBn:
        "অ্যাডোবি স্পষ্টভাবে সতর্ক করে যে ডিজিটালভাবে জোড়া লাগানো মনে হয় এমন রিলিজ মডারেটররা গ্রহণ করতে পারেন না। বরং সম্পূর্ণ মূল ফরমটি আবার স্ক্যান করুন।",
    },
    {
      id: "L19-Q15",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your photo's main subject is a historic castle that is a famous landmark. What is needed to sell it commercially?",
      qBn: "আপনার ছবির প্রধান বিষয়বস্তু একটি ঐতিহাসিক দুর্গ যা একটি বিখ্যাত ল্যান্ডমার্ক। বাণিজ্যিকভাবে বিক্রি করতে কী দরকার?",
      options: [
        "Nothing — historic places are public domain",
        "Only a model release",
        "A property release from the owner — but castles never have owners",
        "A property release — famous landmarks and historic locations require one",
      ],
      optionsBn: [
        "কিছুই নয় — ঐতিহাসিক স্থান সর্বজনীন",
        "শুধু মডেল রিলিজ",
        "মালিকের কাছ থেকে প্রপার্টি রিলিজ — তবে দুর্গের তো মালিক থাকে না",
        "প্রপার্টি রিলিজ — বিখ্যাত ল্যান্ডমার্ক ও ঐতিহাসিক স্থানের জন্য এটি দরকার",
      ],
      answer: 3,
      explanation:
        "Adobe's property release list covers famous landmarks, historic locations and modern architecture. When such a place is the recognizable main subject, a signed property release is required.",
      explanationBn:
        "অ্যাডোবির প্রপার্টি রিলিজ তালিকায় বিখ্যাত ল্যান্ডমার্ক, ঐতিহাসিক স্থান ও আধুনিক স্থাপত্য রয়েছে। এমন স্থান যখন চেনা যায় এমন প্রধান বিষয়বস্তু হয়, তখন স্বাক্ষরিত প্রপার্টি রিলিজ দরকার।",
    },
    {
      id: "L19-Q16",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Who signs a property release?",
      qBn: "প্রপার্টি রিলিজে কে স্বাক্ষর করেন?",
      options: [
        "The photographer",
        "The owner of the property (or their authorized representative)",
        "Any person who appears in the photo",
        "The model",
      ],
      optionsBn: [
        "ফটোগ্রাফার",
        "সম্পত্তির মালিক (বা তাদের অনুমোদিত প্রতিনিধি)",
        "ছবিতে থাকা যেকোনো ব্যক্তি",
        "মডেল",
      ],
      answer: 1,
      explanation:
        "A property release is permission from the property owner to use images of their recognizable private property commercially. Only the owner — or someone they authorize — can grant it.",
      explanationBn:
        "প্রপার্টি রিলিজ হলো সম্পত্তির মালিকের অনুমতি, যাতে তাদের চেনা যায় এমন ব্যক্তিগত সম্পত্তির ছবি বাণিজ্যিকভাবে ব্যবহার করা যায়। শুধু মালিক — বা তিনি যাকে অনুমোদন দেন — তা দিতে পারেন।",
    },
    {
      id: "L19-Q17",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your illustration is based on a real person's face. Is a model release needed?",
      qBn: "আপনার ইলাস্ট্রেশন একজন বাস্তব মানুষের মুখের ওপর ভিত্তি করে আঁকা। মডেল রিলিজ কি দরকার?",
      options: [
        "No — illustrations never need releases",
        "No — only photos need releases",
        "Yes — illustrations and vectors based on real people need model releases",
        "Yes — but only if the person is famous",
      ],
      optionsBn: [
        "না — ইলাস্ট্রেশনে কখনো রিলিজ দরকার হয় না",
        "না — শুধু ছবিতেই রিলিজ দরকার",
        "হ্যাঁ — বাস্তব মানুষের ওপর ভিত্তি করে আঁকা ইলাস্ট্রেশন ও ভেক্টরের জন্য মডেল রিলিজ দরকার",
        "হ্যাঁ — তবে শুধু ব্যক্তিটি বিখ্যাত হলে",
      ],
      answer: 2,
      explanation:
        "Adobe requires model releases for illustrations or vector artwork based on real people or body parts — the rule is about recognizability, not about the medium.",
      explanationBn:
        "অ্যাডোবি বাস্তব মানুষ বা শরীরের অংশের ওপর ভিত্তি করে আঁকা ইলাস্ট্রেশন বা ভেক্টর শিল্পকর্মের জন্যও মডেল রিলিজ চায় — নিয়মটি চেনা যাওয়া নিয়ে, মাধ্যম নিয়ে নয়।",
    },
    {
      id: "L19-Q18",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "A friend agrees by text message to be in your commercial photo, but signs no release. Is that enough?",
      qBn: "একজন বন্ধু টেক্সট মেসেজে আপনার বাণিজ্যিক ছবিতে থাকতে রাজি হলেন, কিন্তু কোনো রিলিজে স্বাক্ষর করলেন না। এটা কি যথেষ্ট?",
      options: [
        "Yes — a text message is written consent",
        "No — Adobe requires a signed model release, not informal permission",
        "Yes — friends and family never need releases",
        "No — only a verbal agreement on video counts",
      ],
      optionsBn: [
        "হ্যাঁ — টেক্সট মেসেজ লিখিত সম্মতি",
        "না — অ্যাডোবি স্বাক্ষরিত মডেল রিলিজ চায়, অনানুষ্ঠানিক অনুমতি নয়",
        "হ্যাঁ — বন্ধু ও পরিবারের কখনো রিলিজ দরকার হয় না",
        "না — শুধু ভিডিওতে মৌখিক সম্মতিই গণ্য হয়",
      ],
      answer: 1,
      explanation:
        "Whether the model is a professional or a friend or family member, commercial use requires a signed model release. A text message is not a signed release.",
      explanationBn:
        "মডেল পেশাদার হোক বা বন্ধু-পরিবারের সদস্য, বাণিজ্যিক ব্যবহারের জন্য স্বাক্ষরিত মডেল রিলিজ দরকার। টেক্সট মেসেজ স্বাক্ষরিত রিলিজ নয়।",
    },
    {
      id: "L19-Q19",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your photo shows a recognizable person only in the distant background, slightly out of focus. Is a release needed?",
      qBn: "আপনার ছবিতে দূরের ব্যাকগ্রাউন্ডে একজন চেনা যায় এমন মানুষ আছেন, সামান্য ঝাপসা। রিলিজ কি দরকার?",
      options: [
        "No — background people never need releases",
        "No — out of focus means unrecognizable",
        "No — only the main subject needs a release",
        "Yes — if the person is recognizable, a release is needed wherever they appear in the frame",
      ],
      optionsBn: [
        "না — ব্যাকগ্রাউন্ডের মানুষের কখনো রিলিজ দরকার হয় না",
        "না — ঝাপসা মানে চেনা যায় না",
        "না — শুধু প্রধান বিষয়বস্তুর জন্যই রিলিজ দরকার",
        "হ্যাঁ — ব্যক্তিটি চেনা গেলে ফ্রেমের যেখানেই থাকুন, রিলিজ দরকার",
      ],
      answer: 3,
      explanation:
        "The rule applies to any identifiable person in the content, not only the main subject. If that background person would recognize themselves — by face, clothing or context — a signed release is required.",
      explanationBn:
        "নিয়মটি কনটেন্টের যেকোনো চেনা যায় এমন ব্যক্তির ক্ষেত্রে প্রযোজ্য, শুধু প্রধান বিষয়বস্তুর ক্ষেত্রে নয়। ব্যাকগ্রাউন্ডের সেই ব্যক্তি নিজেকে চিনতে পারলে — মুখ, পোশাক বা প্রেক্ষাপট দিয়ে — স্বাক্ষরিত রিলিজ দরকার।",
    },
    {
      id: "L19-Q20",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your AI-generated image depicts an identifiable real person. What documentation is needed?",
      qBn: "আপনার AI-তৈরি ছবিতে চেনা যায় এমন একজন বাস্তব মানুষ দেখা যাচ্ছে। কী ডকুমেন্টেশন দরকার?",
      options: [
        "Nothing — AI people are fictional by definition",
        "A model release for that person, uploaded with the submission",
        "Only the “People and Property are fictional” checkbox",
        "A property release",
      ],
      optionsBn: [
        "কিছুই নয় — AI মানুষ সংজ্ঞা অনুযায়ী কাল্পনিক",
        "সেই ব্যক্তির মডেল রিলিজ, জমার সাথে আপলোড করতে হবে",
        "শুধু “People and Property are fictional” চেকবক্স",
        "প্রপার্টি রিলিজ",
      ],
      answer: 1,
      explanation:
        "Any generative AI content depicting or intended to portray an identifiable person requires documentation — a signed model release uploaded with the submission. You may only prompt using images of people for whom you have a signed release.",
      explanationBn:
        "চেনা যায় এমন ব্যক্তিকে দেখানো বা চিত্রিত করতে চাওয়া যেকোনো জেনারেটিভ AI কনটেন্টের জন্য ডকুমেন্টেশন দরকার — জমার সাথে আপলোড করা স্বাক্ষরিত মডেল রিলিজ। যাদের স্বাক্ষরিত রিলিজ আপনার কাছে আছে, শুধু তাদের ছবি দিয়েই প্রম্পট করতে পারবেন।",
    },
    {
      id: "L19-Q21",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your AI image shows an invented person who was not based on anyone real, but looks like a real person. What should you do?",
      qBn: "আপনার AI ছবিতে একজন উদ্ভাবিত মানুষ দেখা যাচ্ছে, যিনি কোনো বাস্তব ব্যক্তির ওপর ভিত্তি করে তৈরি নন, কিন্তু একজন বাস্তব মানুষের মতো দেখতে। আপনার কী করা উচিত?",
      options: [
        "Submit it as a photo of a real person",
        "Upload a model release for a random person",
        "Select the “People and Property are fictional” checkbox",
        "Do nothing — it is not a real person",
      ],
      optionsBn: [
        "বাস্তব মানুষের ছবি হিসেবে জমা দিন",
        "এলোমেলো একজন ব্যক্তির মডেল রিলিজ আপলোড করুন",
        "“People and Property are fictional” চেকবক্সটি নির্বাচন করুন",
        "কিছুই করবেন না — এটি বাস্তব মানুষ নয়",
      ],
      answer: 2,
      explanation:
        "Adobe's FAQ says: if the content was not based on a real person but resembles one, select the “People and Property are fictional” checkbox. Do not tag it with inaccurate descriptors.",
      explanationBn:
        "অ্যাডোবির FAQ বলে: কনটেন্ট কোনো বাস্তব ব্যক্তির ওপর ভিত্তি করে তৈরি না হলেও যদি তার মতো দেখায়, তাহলে “People and Property are fictional” চেকবক্সটি নির্বাচন করুন। ভুল বর্ণনাকারী শব্দ দিয়ে ট্যাগ করবেন না।",
    },
    {
      id: "L19-Q22",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You already have a signed release uploaded in your account. How do you attach it to a new photo?",
      qBn: "আপনার অ্যাকাউন্টে ইতিমধ্যে একটি স্বাক্ষরিত রিলিজ আপলোড করা আছে। নতুন ছবিতে এটি কীভাবে সংযুক্ত করবেন?",
      options: [
        "Select the content, answer Yes under “Recognizable people or property?”, then search for the existing release",
        "Email it to Adobe support",
        "Upload the photo again with the release as the file name",
        "Releases attach automatically to all future uploads",
      ],
      optionsBn: [
        "কনটেন্টটি নির্বাচন করুন, “Recognizable people or property?”-এ Yes দিন, তারপর বিদ্যমান রিলিজটি খুঁজুন",
        "অ্যাডোবি সাপোর্টকে ইমেইল করুন",
        "রিলিজটিকে ফাইলের নাম হিসেবে দিয়ে ছবিটি আবার আপলোড করুন",
        "রিলিজ ভবিষ্যতের সব আপলোডে স্বয়ংক্রিয়ভাবে সংযুক্ত হয়",
      ],
      answer: 0,
      explanation:
        "In the Uploaded Files tab, select the content, choose Yes under “Recognizable people or property?”, then choose “Search for an existing release” to attach a release you already uploaded.",
      explanationBn:
        "Uploaded Files ট্যাবে কনটেন্টটি নির্বাচন করুন, “Recognizable people or property?”-এ Yes বেছে নিন, তারপর আগে আপলোড করা রিলিজ সংযুক্ত করতে “Search for an existing release” বেছে নিন।",
    },
    {
      id: "L19-Q23",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "After attaching a release to your asset, what must you do to send the release for verification?",
      qBn: "আপনার অ্যাসেটে রিলিজ সংযুক্ত করার পর যাচাইয়ের জন্য রিলিজটি পাঠাতে কী করতে হবে?",
      options: [
        "Nothing — it is verified automatically",
        "Delete the asset and re-upload it",
        "Wait 45 days",
        "Complete the metadata and select “Review request”",
      ],
      optionsBn: [
        "কিছুই নয় — এটি স্বয়ংক্রিয়ভাবে যাচাই হয়",
        "অ্যাসেটটি মুছে আবার আপলোড করুন",
        "৪৫ দিন অপেক্ষা করুন",
        "মেটাডেটা সম্পূর্ণ করুন এবং “Review request” নির্বাচন করুন",
      ],
      answer: 3,
      explanation:
        "Selecting “Review request” sends the attached release for verification and links it to the asset. The review then appears listed under the asset in your Uploaded Files tab.",
      explanationBn:
        "“Review request” নির্বাচন করলে সংযুক্ত রিলিজটি যাচাইয়ের জন্য পাঠানো হয় এবং অ্যাসেটের সাথে সংযুক্ত হয়। এরপর রিভিউটি আপনার Uploaded Files ট্যাবে অ্যাসেটের নিচে তালিকাভুক্ত দেখা যায়।",
    },
    {
      id: "L19-Q24",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your release form has the model's name spelled “Jon” but their ID says “John”. What should you do?",
      qBn: "আপনার রিলিজ ফরমে মডেলের নাম “Jon” লেখা, কিন্তু তাদের পরিচয়পত্রে “John”। আপনার কী করা উচিত?",
      options: [
        "Submit it — small spelling differences do not matter",
        "Fix the spelling so names match exactly, then re-upload",
        "Use the nickname everywhere instead",
        "Submit it and explain the difference in the title",
      ],
      optionsBn: [
        "জমা দিন — ছোট বানান পার্থক্য গুরুত্বপূর্ণ নয়",
        "বানান ঠিক করুন যাতে নামগুলো ঠিক মেলে, তারপর আবার আপলোড করুন",
        "বরং সর্বত্র ডাকনাম ব্যবহার করুন",
        "জমা দিন এবং টাইটেলে পার্থক্যটি ব্যাখ্যা করুন",
      ],
      answer: 1,
      explanation:
        "Adobe advises double-checking that the spelling of names matches the release, and that names are printed in capital letters for legibility. A name that does not match the ID can invalidate the release.",
      explanationBn:
        "অ্যাডোবি পরামর্শ দেয় নামের বানান রিলিজের সাথে মিলছে কি না তা দুবার যাচাই করতে, এবং পাঠযোগ্যতার জন্য নামগুলো বড় হাতের অক্ষরে লিখতে। পরিচয়পত্রের সাথে না মেলা নাম রিলিজটিকে অবৈধ করতে পারে।",
    },
    {
      id: "L19-Q25",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "A photo shows a distinctive, recognizable piece of street art on a public wall. What is needed for commercial use?",
      qBn: "একটি ছবিতে একটি সর্বজনীন দেয়ালে একটি স্বতন্ত্র, চেনা যায় এমন স্ট্রিট আর্ট দেখা যাচ্ছে। বাণিজ্যিক ব্যবহারের জন্য কী দরকার?",
      options: [
        "Nothing — street art is public",
        "A model release from the artist",
        "A property release — recognizable artwork and distinctive objects need one",
        "Only a credit to the artist in the title",
      ],
      optionsBn: [
        "কিছুই নয় — স্ট্রিট আর্ট সর্বজনীন",
        "শিল্পীর কাছ থেকে মডেল রিলিজ",
        "প্রপার্টি রিলিজ — চেনা যায় এমন শিল্পকর্ম ও স্বতন্ত্র বস্তুর জন্য এটি দরকার",
        "শুধু টাইটেলে শিল্পীর নাম উল্লেখ",
      ],
      answer: 2,
      explanation:
        "A property release is required for recognizable private property, artwork or distinctive objects. Crediting the artist does not replace the release.",
      explanationBn:
        "চেনা যায় এমন ব্যক্তিগত সম্পত্তি, শিল্পকর্ম বা স্বতন্ত্র বস্তুর জন্য প্রপার্টি রিলিজ দরকার। শিল্পীর নাম উল্লেখ করলে রিলিজের বিকল্প হয় না।",
    },
    {
      id: "L19-Q26",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Why is a missing or invalid release one of the most common rejection reasons?",
      qBn: "অনুপস্থিত বা অবৈধ রিলিজ কেন বাতিলের সবচেয়ে সাধারণ কারণগুলোর একটি?",
      options: [
        "Missing or invalid releases mean the content is not legally cleared for commercial licensing",
        "Releases make photos load slower",
        "Adobe rejects all photos with people",
        "Releases are only checked for videos",
      ],
      optionsBn: [
        "অনুপস্থিত বা অবৈধ রিলিজের অর্থ কনটেন্টটি বাণিজ্যিক লাইসেন্সের জন্য আইনত পরিষ্কার নয়",
        "রিলিজ ছবি লোড হতে ধীর করে",
        "অ্যাডোবি মানুষের সব ছবি বাতিল করে",
        "রিলিজ শুধু ভিডিওর ক্ষেত্রে যাচাই করা হয়",
      ],
      answer: 0,
      explanation:
        "Releases are the legal proof that recognizable people and property may be used commercially. Without valid, complete, matching releases, Adobe cannot legally license the content — so it is rejected.",
      explanationBn:
        "রিলিজ হলো আইনি প্রমাণ যে চেনা যায় এমন মানুষ ও সম্পত্তি বাণিজ্যিকভাবে ব্যবহার করা যাবে। বৈধ, সম্পূর্ণ ও মিলে যাওয়া রিলিজ ছাড়া অ্যাডোবি কনটেন্টটি আইনত লাইসেন্স দিতে পারে না — তাই তা বাতিল হয়।",
    },
    {
      id: "L19-Q27",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "You have releases for a photo shoot, but one model's release is a blurry, unreadable scan. What should you do?",
      qBn: "একটি ফটোশুটের জন্য আপনার কাছে রিলিজ আছে, কিন্তু একজন মডেলের রিলিজটি ঝাপসা, পড়া যায় না এমন স্ক্যান। আপনার কী করা উচিত?",
      options: [
        "Submit it — reviewers can guess the details",
        "Submit it and add the details in the keywords",
        "Submit a different model's release instead",
        "Upload a high-resolution, legible scan of the complete release",
      ],
      optionsBn: [
        "জমা দিন — রিভিউয়াররা বিবরণ অনুমান করে নিতে পারবেন",
        "জমা দিন এবং বিবরণ কীওয়ার্ডে যোগ করুন",
        "বরং অন্য মডেলের রিলিজ জমা দিন",
        "সম্পূর্ণ রিলিজের উচ্চ রেজোলিউশনের, পড়া যায় এমন স্ক্যান আপলোড করুন",
      ],
      answer: 3,
      explanation:
        "Adobe advises uploading high-resolution scans so every field stays legible, and that each release in a multi-release document must be legible and complete. An unreadable release is an invalid release.",
      explanationBn:
        "অ্যাডোবি পরামর্শ দেয় উচ্চ রেজোলিউশনের স্ক্যান আপলোড করতে, যাতে প্রতিটি ক্ষেত্র পড়া যায়, এবং একাধিক রিলিজের ডকুমেন্টে প্রতিটি রিলিজ পড়া যায় এমন ও সম্পূর্ণ হতে হবে। পড়া যায় না এমন রিলিজ অবৈধ রিলিজ।",
    },
    {
      id: "L19-Q28",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Your paper release has all signatures, but the model's name is written in small lowercase handwriting that is hard to read. What does Adobe require?",
      qBn: "আপনার কাগজের রিলিজে সব স্বাক্ষর আছে, কিন্তু মডেলের নাম ছোট ছোট হাতের লেখায় লেখা, যা পড়া কঠিন। অ্যাডোবি কী চায়?",
      options: [
        "Names must be printed in capital letters to assure legibility",
        "Handwriting style does not matter",
        "Names must be written in cursive",
        "Names are not needed if the signature is clear",
      ],
      optionsBn: [
        "পাঠযোগ্যতা নিশ্চিত করতে নামগুলো বড় হাতের অক্ষরে লিখতে হবে",
        "হাতের লেখার ধাঁচ গুরুত্বপূর্ণ নয়",
        "নাম কারসিভে লিখতে হবে",
        "স্বাক্ষর স্পষ্ট হলে নাম দরকার হয় না",
      ],
      answer: 0,
      explanation:
        "Adobe's release checklist says: to assure legibility, print all names in capital letters. Illegible names can make an otherwise complete release invalid.",
      explanationBn:
        "অ্যাডোবির রিলিজ চেকলিস্টে বলা আছে: পাঠযোগ্যতা নিশ্চিত করতে সব নাম বড় হাতের অক্ষরে লিখুন। পড়া যায় না এমন নাম সম্পূর্ণ রিলিজকেও অবৈধ করতে পারে।",
    },
    {
      id: "L19-Q29",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "A recognizable person appears in your photo, but you only want to sell it for news use. Can you skip the model release?",
      qBn: "আপনার ছবিতে চেনা যায় এমন একজন মানুষ আছেন, কিন্তু আপনি এটি শুধু সংবাদের ব্যবহারের জন্য বিক্রি করতে চান। মডেল রিলিজ কি এড়ানো যাবে?",
      options: [
        "Yes — news photos never need releases",
        "Yes — just mark it editorial and upload it",
        "No — Adobe does not currently accept Editorial Use Only content from individual contributors, except Illustrative Editorial",
        "No — but you can sell it commercially without a release instead",
      ],
      optionsBn: [
        "হ্যাঁ — সংবাদের ছবিতে কখনো রিলিজ দরকার হয় না",
        "হ্যাঁ — শুধু এডিটোরিয়াল চিহ্নিত করে আপলোড করুন",
        "না — Illustrative Editorial ছাড়া, ব্যক্তিগত কন্ট্রিবিউটরদের কাছ থেকে Editorial Use Only কনটেন্ট অ্যাডোবি বর্তমানে গ্রহণ করে না",
        "না — তবে বরং রিলিজ ছাড়াই বাণিজ্যিকভাবে বিক্রি করতে পারেন",
      ],
      answer: 2,
      explanation:
        "Editorial images do not have model releases and are therefore not cleared for commercial use — but Adobe currently sources its editorial collection through outside agencies such as Reuters and does not accept Editorial Use Only content from individual contributors, with the limited exception of Illustrative Editorial.",
      explanationBn:
        "এডিটোরিয়াল ছবিতে মডেল রিলিজ থাকে না, তাই সেগুলো বাণিজ্যিক ব্যবহারের জন্য পরিষ্কার নয় — তবে অ্যাডোবি বর্তমানে রয়টার্সের মতো বাইরের সংস্থার মাধ্যমে তার এডিটোরিয়াল সংগ্রহ সংগ্রহ করে এবং Illustrative Editorial-এর সীমিত ব্যতিক্রম ছাড়া ব্যক্তিগত কন্ট্রিবিউটরদের কাছ থেকে Editorial Use Only কনটেন্ট গ্রহণ করে না।",
    },
    {
      id: "L19-Q30",
      topic: "Releases",
      topicBn: "রিলিজ",
      q: "Which combination correctly matches each release to its trigger?",
      qBn: "কোন সমন্বয়টি প্রতিটি রিলিজকে তার ট্রিগারের সাথে সঠিকভাবে মেলায়?",
      options: [
        "Model release for a famous building; property release for a person's face",
        "Model release for any identifiable person; property release for recognizable private property, artwork or distinctive objects",
        "Model release for a cityscape; property release for a crowd",
        "Model release for a logo; property release for a sunset",
      ],
      optionsBn: [
        "বিখ্যাত ভবনের জন্য মডেল রিলিজ; মানুষের মুখের জন্য প্রপার্টি রিলিজ",
        "চেনা যায় এমন যেকোনো ব্যক্তির জন্য মডেল রিলিজ; চেনা যায় এমন ব্যক্তিগত সম্পত্তি, শিল্পকর্ম বা স্বতন্ত্র বস্তুর জন্য প্রপার্টি রিলিজ",
        "শহরের দৃশ্যের জন্য মডেল রিলিজ; ভিড়ের জন্য প্রপার্টি রিলিজ",
        "লোগোর জন্য মডেল রিলিজ; সূর্যাস্তের জন্য প্রপার্টি রিলিজ",
      ],
      answer: 1,
      explanation:
        "The split is simple: a model release is required for any identifiable person, and a property release is required for recognizable private property, artwork or distinctive objects.",
      explanationBn:
        "বিভাজনটি সহজ: চেনা যায় এমন যেকোনো ব্যক্তির জন্য মডেল রিলিজ দরকার, এবং চেনা যায় এমন ব্যক্তিগত সম্পত্তি, শিল্পকর্ম বা স্বতন্ত্র বস্তুর জন্য প্রপার্টি রিলিজ দরকার।",
    },
  ],
  20: [
    {
      id: "L20-Q01",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You generate an image, a vector and a video with AI tools. Which of them need the “Created using generative AI tools” checkbox?",
      qBn: "আপনি AI টুল দিয়ে একটি ছবি, একটি ভেক্টর ও একটি ভিডিও তৈরি করলেন। কোনগুলোতে “Created using generative AI tools” চেকবক্স দরকার?",
      options: [
        "All three — the checkbox is required for ALL AI-created content",
        "Only the image",
        "Only the video",
        "None — the checkbox is optional",
      ],
      optionsBn: [
        "তিনটিতেই — AI দিয়ে তৈরি সব কনটেন্টের জন্য চেকবক্স বাধ্যতামূলক",
        "শুধু ছবিতে",
        "শুধু ভিডিওতে",
        "কোনোটিতেই নয় — চেকবক্স ঐচ্ছিক",
      ],
      answer: 0,
      explanation:
        "Adobe Stock accepts AI images, vectors and videos when properly labeled. The “Created using generative AI tools” checkbox is required for all AI-created content — always, for every type.",
      explanationBn:
        "অ্যাডোবি স্টক সঠিকভাবে লেবেল করা AI ছবি, ভেক্টর ও ভিডিও গ্রহণ করে। “Created using generative AI tools” চেকবক্স AI দিয়ে তৈরি সব কনটেন্টের জন্য বাধ্যতামূলক — সবসময়, প্রতিটি ধরনের ক্ষেত্রে।",
    },
    {
      id: "L20-Q02",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You use an AI tool only to extend the background of a real photo. Is AI labeling required?",
      qBn: "আপনি একটি আসল ছবির ব্যাকগ্রাউন্ড বাড়াতে শুধু AI টুল ব্যবহার করলেন। AI লেবেলিং কি দরকার?",
      options: [
        "Yes — any AI use at all must be labeled",
        "Yes — background extension always counts as AI creation",
        "No — labeling is not required for background extension",
        "No — but only if the photo is under 45 MB",
      ],
      optionsBn: [
        "হ্যাঁ — যেকোনো AI ব্যবহারই লেবেল করতে হবে",
        "হ্যাঁ — ব্যাকগ্রাউন্ড এক্সটেনশন সবসময় AI তৈরি হিসেবে গণ্য হয়",
        "না — ব্যাকগ্রাউন্ড এক্সটেনশনের জন্য লেবেলিং দরকার হয় না",
        "না — তবে শুধু ছবি ৪৫ MB-এর কম হলে",
      ],
      answer: 2,
      explanation:
        "Labeling is not required when AI only extended the background, removed IP, or retouched distractions. It is required when AI changed, augmented or added a new primary subject.",
      explanationBn:
        "AI শুধু ব্যাকগ্রাউন্ড বাড়ালে, IP সরালে বা বিভ্রান্তিকর উপাদান রিটাচ করলে লেবেলিং দরকার হয় না। লেবেলিং দরকার যখন AI প্রধান বিষয়বস্তু পরিবর্তন, বৃদ্ধি বা যোগ করেছে।",
    },
    {
      id: "L20-Q03",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You use AI to remove a distracting trash can from a real photo. Is AI labeling required?",
      qBn: "আপনি একটি আসল ছবি থেকে বিভ্রান্তিকর একটি ডাস্টবিন সরাতে AI ব্যবহার করলেন। AI লেবেলিং কি দরকার?",
      options: [
        "Yes — removing anything with AI must be labeled",
        "Yes — the photo is now AI-generated",
        "Yes — unless the trash can was small",
        "No — retouching distractions does not require labeling",
      ],
      optionsBn: [
        "হ্যাঁ — AI দিয়ে কিছু সরালেই লেবেল করতে হবে",
        "হ্যাঁ — ছবিটি এখন AI-তৈরি",
        "হ্যাঁ — ডাস্টবিনটি ছোট না হলে",
        "না — বিভ্রান্তিকর উপাদান রিটাচ করলে লেবেলিং দরকার হয় না",
      ],
      answer: 3,
      explanation:
        "Adobe's rule draws the line at the primary subject: retouching distractions, extending the background and removing IP do not require labeling — changing, augmenting or adding a new primary subject does.",
      explanationBn:
        "অ্যাডোবির নিয়ম প্রধান বিষয়বস্তুতে সীমা টানে: বিভ্রান্তিকর উপাদান রিটাচ, ব্যাকগ্রাউন্ড এক্সটেনশন ও IP অপসারণে লেবেলিং দরকার হয় না — প্রধান বিষয়বস্তু পরিবর্তন, বৃদ্ধি বা যোগ করলে দরকার হয়।",
    },
    {
      id: "L20-Q04",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You use AI to add a new dog as the main subject of a photo. Is AI labeling required?",
      qBn: "আপনি AI দিয়ে একটি ছবির প্রধান বিষয়বস্তু হিসেবে একটি নতুন কুকুর যোগ করলেন। AI লেবেলিং কি দরকার?",
      options: [
        "No — adding animals is retouching",
        "Yes — AI added a new primary subject, so labeling is required",
        "No — only people count as primary subjects",
        "Yes — but only if the dog looks realistic",
      ],
      optionsBn: [
        "না — প্রাণী যোগ করা রিটাচিং",
        "হ্যাঁ — AI একটি নতুন প্রধান বিষয়বস্তু যোগ করেছে, তাই লেবেলিং দরকার",
        "না — শুধু মানুষই প্রধান বিষয়বস্তু হিসেবে গণ্য হয়",
        "হ্যাঁ — তবে শুধু কুকুরটি বাস্তবসম্মত দেখালে",
      ],
      answer: 1,
      explanation:
        "Labeling is required when AI changed, augmented or added a new primary subject. Adding a dog as the main subject crosses that line, even though removing a distraction would not.",
      explanationBn:
        "AI প্রধান বিষয়বস্তু পরিবর্তন, বৃদ্ধি বা যোগ করলে লেবেলিং দরকার। প্রধান বিষয়বস্তু হিসেবে কুকুর যোগ করা সেই সীমা অতিক্রম করে, যদিও বিভ্রান্তিকর কিছু সরালে তা হতো না।",
    },
    {
      id: "L20-Q05",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image looks exactly like a real photograph of a street that could exist. How should you submit it?",
      qBn: "আপনার AI ছবিটি দেখতে ঠিক একটি বাস্তব রাস্তার আসল ছবির মতো, যা থাকতে পারে। এটি কীভাবে জমা দেওয়া উচিত?",
      options: [
        "As a Photo — photorealistic AI images that could have been taken with a camera go in Photos",
        "As an Editorial image",
        "As a Vector",
        "As a Photo, but without the AI checkbox",
      ],
      optionsBn: [
        "ছবি হিসেবে — ক্যামেরায় তোলা যেত এমন ফটোরিয়ালিস্টিক AI ছবি Photos-এ যায়",
        "এডিটোরিয়াল ছবি হিসেবে",
        "ভেক্টর হিসেবে",
        "ছবি হিসেবে, তবে AI চেকবক্স ছাড়া",
      ],
      answer: 0,
      explanation:
        "Adobe's guidance: submit photo-realistic AI images that could have been taken with a camera as Photos, and all other AI images as Illustrations. The AI checkbox is still required either way.",
      explanationBn:
        "অ্যাডোবির নির্দেশিকা: ক্যামেরায় তোলা যেত এমন ফটোরিয়ালিস্টিক AI ছবি Photos হিসেবে জমা দিন, এবং অন্য সব AI ছবি Illustrations হিসেবে। AI চেকবক্স উভয় ক্ষেত্রেই দরকার।",
    },
    {
      id: "L20-Q06",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image shows a floating castle in the clouds — a fantasy concept. How should you submit it?",
      qBn: "আপনার AI ছবিতে মেঘের মধ্যে একটি ভাসমান দুর্গ দেখা যাচ্ছে — একটি কাল্পনিক ধারণা। এটি কীভাবে জমা দেওয়া উচিত?",
      options: [
        "As a Photo, because it is a JPEG",
        "As Editorial, because it is imaginary",
        "As an Illustration — artistic and fantasy concepts go in Illustrations",
        "As a Vector, because it is not real",
      ],
      optionsBn: [
        "ছবি হিসেবে, কারণ এটি JPEG",
        "এডিটোরিয়াল হিসেবে, কারণ এটি কাল্পনিক",
        "ইলাস্ট্রেশন হিসেবে — শিল্পমূলক ও কাল্পনিক ধারণা Illustrations-এ যায়",
        "ভেক্টর হিসেবে, কারণ এটি বাস্তব নয়",
      ],
      answer: 2,
      explanation:
        "Content type follows what the image shows, not the file extension. Photorealistic real-life subjects go in Photos; artistic or fantasy concepts go in Illustrations — and the AI label is required either way.",
      explanationBn:
        "কনটেন্টের ধরন ছবিতে যা দেখা যায় তা অনুযায়ী হয়, ফাইল এক্সটেনশন অনুযায়ী নয়। ফটোরিয়ালিস্টিক বাস্তব বিষয় Photos-এ যায়; শিল্পমূলক বা কাল্পনিক ধারণা Illustrations-এ যায় — এবং AI লেবেল উভয় ক্ষেত্রেই দরকার।",
    },
    {
      id: "L20-Q07",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Can you submit AI-generated content to the Illustrative Editorial collection?",
      qBn: "আপনি কি AI-তৈরি কনটেন্ট Illustrative Editorial সংগ্রহে জমা দিতে পারবেন?",
      options: [
        "Yes — AI content is welcome there",
        "Yes — if you check the fictional checkbox",
        "Yes — if the image is photorealistic",
        "No — generative AI content cannot be submitted to the Illustrative Editorial collection",
      ],
      optionsBn: [
        "হ্যাঁ — সেখানে AI কনটেন্ট স্বাগত",
        "হ্যাঁ — কাল্পনিক চেকবক্স দিলে",
        "হ্যাঁ — ছবিটি ফটোরিয়ালিস্টিক হলে",
        "না — জেনারেটিভ AI কনটেন্ট Illustrative Editorial সংগ্রহে জমা দেওয়া যায় না",
      ],
      answer: 3,
      explanation:
        "Adobe's generative AI FAQ states plainly: generative AI content cannot be submitted to the Illustrative Editorial collection.",
      explanationBn:
        "অ্যাডোবির জেনারেটিভ AI FAQ-তে স্পষ্টভাবে বলা আছে: জেনারেটিভ AI কনটেন্ট Illustrative Editorial সংগ্রহে জমা দেওয়া যায় না।",
    },
    {
      id: "L20-Q08",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "From one prompt you generate 8 near-identical variations of the same AI image. How many should you submit at most?",
      qBn: "একটি প্রম্পট থেকে আপনি একই AI ছবির ৮টি প্রায় অভিন্ন ভিন্নতা তৈরি করলেন। সর্বোচ্চ কয়টি জমা দেওয়া উচিত?",
      options: [
        "All 8 — AI variations are exempt from the similar-content rule",
        "A maximum of 3 iterations of similar assets",
        "All 8, if the keywords are different",
        "Only 1 — AI images allow no variations",
      ],
      optionsBn: [
        "৮টিই — AI ভিন্নতা অনুরূপ-কনটেন্ট নিয়মের বাইরে",
        "একই ধরনের অ্যাসেটের সর্বোচ্চ ৩টি ইটারেশন",
        "৮টিই, যদি কীওয়ার্ড ভিন্ন হয়",
        "শুধু ১টি — AI ছবিতে কোনো ভিন্নতা অনুমোদিত নয়",
      ],
      answer: 1,
      explanation:
        "Adobe's AI FAQ says to submit a maximum of three iterations of similar assets — more than that is treated as spamming. Do not submit multiple versions from the same prompt or similar iterations.",
      explanationBn:
        "অ্যাডোবির AI FAQ বলে একই ধরনের অ্যাসেটের সর্বোচ্চ তিনটি ইটারেশন জমা দিতে — এর বেশি স্প্যাম হিসেবে গণ্য হয়। একই প্রম্পট থেকে একাধিক সংস্করণ বা অনুরূপ ইটারেশন জমা দেবেন না।",
    },
    {
      id: "L20-Q09",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image is a landscape with no people, no buildings and no property in it. Should you tick the “People and Property are fictional” box?",
      qBn: "আপনার AI ছবিটি একটি ল্যান্ডস্কেপ — এতে কোনো মানুষ, ভবন বা সম্পত্তি নেই। “People and Property are fictional” বাক্সে কি টিক দেবেন?",
      options: [
        "Yes, tick it for every AI image",
        "Yes, because a landscape is fictional too",
        "Yes, but only if the landscape looks like a real place",
        "No, only tick it if the asset includes people or property",
      ],
      optionsBn: [
        "হ্যাঁ, প্রতিটি AI ছবিতে টিক দিন",
        "হ্যাঁ, কারণ ল্যান্ডস্কেপও কাল্পনিক",
        "হ্যাঁ, তবে ল্যান্ডস্কেপটি বাস্তব জায়গার মতো দেখালে",
        "না, অ্যাসেটে মানুষ বা সম্পত্তি থাকলেই শুধু টিক দিন",
      ],
      answer: 3,
      explanation:
        "The “People and Property are fictional” box should only be checked if the asset includes people or property — for a landscape or food image, do not check it.",
      explanationBn:
        "“People and Property are fictional” বাক্সে তখনই টিক দেবেন যখন অ্যাসেটে মানুষ বা সম্পত্তি থাকে — ল্যান্ডস্কেপ বা খাবারের ছবিতে টিক দেবেন না।",
    },
    {
      id: "L20-Q10",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your prompt asks for “a superhero in the style of a famous comic book character”. What is the problem?",
      qBn: "আপনার প্রম্পটে “একটি বিখ্যাত কমিক বই চরিত্রের ধাঁচে একজন সুপারহিরো” চাওয়া হয়েছে। সমস্যা কী?",
      options: [
        "Superheroes are banned entirely",
        "Comic book styles are banned",
        "Fictional characters and copyrighted works are prohibited in AI prompts",
        "There is no problem — fictional characters are allowed in prompts",
      ],
      optionsBn: [
        "সুপারহিরো সম্পূর্ণ নিষিদ্ধ",
        "কমিক বইয়ের শৈলী নিষিদ্ধ",
        "AI প্রম্পটে কাল্পনিক চরিত্র ও কপিরাইটযুক্ত কাজ নিষিদ্ধ",
        "কোনো সমস্যা নেই — প্রম্পটে কাল্পনিক চরিত্র অনুমোদিত",
      ],
      answer: 2,
      explanation:
        "Fictional characters and copyrighted works are prohibited in AI prompts, titles and keywords. AI content must not depict copyrighted characters at all.",
      explanationBn:
        "AI প্রম্পট, টাইটেল ও কীওয়ার্ডে কাল্পনিক চরিত্র ও কপিরাইটযুক্ত কাজ নিষিদ্ধ। AI কনটেন্টে কপিরাইটযুক্ত চরিত্র দেখানো মোটেই যাবে না।",
    },
    {
      id: "L20-Q11",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI prompt names a government agency as the subject. What is the problem?",
      qBn: "আপনার AI প্রম্পটে একটি সরকারি সংস্থার নাম বিষয়বস্তু হিসেবে দেওয়া হয়েছে। সমস্যা কী?",
      options: [
        "Government agencies are allowed as subjects",
        "Only the agency's logo is banned, not its name",
        "It is fine if the agency is in another country",
        "Government agencies are prohibited in AI prompts, titles and keywords",
      ],
      optionsBn: [
        "সরকারি সংস্থা বিষয়বস্তু হিসেবে অনুমোদিত",
        "শুধু সংস্থার লোগো নিষিদ্ধ, নাম নয়",
        "সংস্থাটি অন্য দেশের হলে ঠিক আছে",
        "AI প্রম্পট, টাইটেল ও কীওয়ার্ডে সরকারি সংস্থার নাম নিষিদ্ধ",
      ],
      answer: 3,
      explanation:
        "Government agencies are on Adobe's prohibited list for AI prompts, titles and keywords — alongside artist names, real people, fictional characters and copyrighted works.",
      explanationBn:
        "সরকারি সংস্থা AI প্রম্পট, টাইটেল ও কীওয়ার্ডে অ্যাডোবির নিষিদ্ধ তালিকায় আছে — শিল্পীদের নাম, বাস্তব মানুষ, কাল্পনিক চরিত্র ও কপিরাইটযুক্ত কাজের পাশাপাশি।",
    },
    {
      id: "L20-Q12",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image depicts a real celebrity. What happens?",
      qBn: "আপনার AI ছবিতে একজন বাস্তব সেলিব্রিটি দেখা যাচ্ছে। কী হবে?",
      options: [
        "It is accepted if you label it as AI",
        "It is not allowed — AI content must not depict real people",
        "It is accepted if the celebrity is not named in the title",
        "It is accepted as editorial",
      ],
      optionsBn: [
        "AI হিসেবে লেবেল করলে গৃহীত হবে",
        "এটি অনুমোদিত নয় — AI কনটেন্টে বাস্তব মানুষ দেখানো যাবে না",
        "টাইটেলে সেলিব্রিটির নাম না থাকলে গৃহীত হবে",
        "এডিটোরিয়াল হিসেবে গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "AI content must not depict real people, fictional characters, copyrighted works or third-party intellectual property. Labeling it as AI does not make a real celebrity depiction acceptable.",
      explanationBn:
        "AI কনটেন্টে বাস্তব মানুষ, কাল্পনিক চরিত্র, কপিরাইটযুক্ত কাজ বা তৃতীয় পক্ষের মেধাসম্পদ দেখানো যাবে না। AI হিসেবে লেবেল করলেই বাস্তব সেলিব্রিটির চিত্র গ্রহণযোগ্য হয় না।",
    },
    {
      id: "L20-Q13",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You want to prompt an AI tool with a photo of a model. What do you need first?",
      qBn: "আপনি একটি মডেলের ছবি দিয়ে AI টুলে প্রম্পট করতে চান। প্রথমে কী দরকার?",
      options: [
        "A signed model release for that person",
        "The model's Instagram handle",
        "The model's written text message approval",
        "Nothing — prompting with photos needs no release",
      ],
      optionsBn: [
        "সেই ব্যক্তির স্বাক্ষরিত মডেল রিলিজ",
        "মডেলের Instagram হ্যান্ডেল",
        "মডেলের লিখিত টেক্সট মেসেজ অনুমোদন",
        "কিছুই নয় — ছবি দিয়ে প্রম্পট করতে রিলিজ দরকার হয় না",
      ],
      answer: 0,
      explanation:
        "Adobe's FAQ says you may only prompt using images of people for whom you have a signed model release — and you must upload that release with your submission.",
      explanationBn:
        "অ্যাডোবির FAQ বলে যাদের স্বাক্ষরিত মডেল রিলিজ আপনার কাছে আছে, শুধু তাদের ছবি দিয়েই প্রম্পট করতে পারবেন — এবং জমার সাথে সেই রিলিজ আপলোড করতে হবে।",
    },
    {
      id: "L20-Q14",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Does an AI-generated video have to meet the same technical rules as a traditionally filmed video?",
      qBn: "AI দিয়ে তৈরি ভিডিও কি ঐতিহ্যগতভাবে চিত্রায়িত ভিডিওর মতো একই কারিগরি নিয়ম মানতে হয়?",
      options: [
        "No — AI videos are exempt from technical rules",
        "No — AI videos can be any length",
        "Yes — AI video must meet the same technical and legal requirements as traditional video",
        "No — AI videos only need the AI checkbox",
      ],
      optionsBn: [
        "না — AI ভিডিও কারিগরি নিয়মের বাইরে",
        "না — AI ভিডিও যেকোনো দৈর্ঘ্যের হতে পারে",
        "হ্যাঁ — AI ভিডিওকে ঐতিহ্যগত ভিডিওর মতো একই কারিগরি ও আইনি প্রয়োজনীয়তা পূরণ করতে হবে",
        "না — AI ভিডিওতে শুধু AI চেকবক্স দরকার",
      ],
      answer: 2,
      explanation:
        "AI video must meet the same technical and legal requirements as traditional video — formats, 5–60 second duration, native frame size — plus the AI disclosure rules.",
      explanationBn:
        "AI ভিডিওকে ঐতিহ্যগত ভিডিওর মতো একই কারিগরি ও আইনি প্রয়োজনীয়তা পূরণ করতে হবে — ফরম্যাট, ৫–৬০ সেকেন্ড দৈর্ঘ্য, নেটিভ ফ্রেম সাইজ — সাথে AI প্রকাশের নিয়ম।",
    },
    {
      id: "L20-Q15",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image looks like a real photo of a famous city square, and your title names that real place. What is wrong?",
      qBn: "আপনার AI ছবিটি একটি বিখ্যাত শহরের চত্বরের আসল ছবির মতো দেখতে, এবং আপনার টাইটেলে সেই বাস্তব স্থানের নাম দেওয়া হয়েছে। সমস্যা কী?",
      options: [
        "Nothing — AI images may be presented as real photos of real places",
        "Nothing — naming a real place helps buyers",
        "Nothing — the AI checkbox fixes it",
        "AI content must not be presented as a real photo of a real place or event",
      ],
      optionsBn: [
        "কিছুই নয় — AI ছবিকে বাস্তব স্থানের আসল ছবি হিসেবে উপস্থাপন করা যায়",
        "কিছুই নয় — বাস্তব স্থানের নাম ক্রেতাদের সাহায্য করে",
        "কিছুই নয় — AI চেকবক্স এটি ঠিক করে দেয়",
        "AI কনটেন্টকে কোনো বাস্তব স্থান বা ঘটনার আসল ছবি হিসেবে উপস্থাপন করা যাবে না",
      ],
      answer: 3,
      explanation:
        "Do not call an AI image a photo of a real place or event, and do not submit AI content as editorial. AI imagery must be honestly labeled and described for what it is.",
      explanationBn:
        "AI ছবিকে কোনো বাস্তব স্থান বা ঘটনার ছবি বলে দাবি করবেন না, এবং AI কনটেন্ট এডিটোরিয়াল হিসেবে জমা দেবেন না। AI ছবিকে সৎভাবে লেবেল ও বর্ণনা করতে হবে, এটি আসলে যা।",
    },
    {
      id: "L20-Q16",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You forget to check the “Created using generative AI tools” box on an AI image. What can happen?",
      qBn: "আপনি একটি AI ছবিতে “Created using generative AI tools” বাক্সে টিক দিতে ভুলে গেলেন। কী হতে পারে?",
      options: [
        "Nothing — Adobe detects AI automatically and adds the label",
        "The content can be rejected, removed, or your account deactivated",
        "The image is sold as a real photograph instead",
        "Adobe adds the label and charges a small fee",
      ],
      optionsBn: [
        "কিছুই নয় — অ্যাডোবি স্বয়ংক্রিয়ভাবে AI শনাক্ত করে লেবেল যোগ করে",
        "কনটেন্ট বাতিল হতে পারে, সরিয়ে ফেলা হতে পারে, বা আপনার অ্যাকাউন্ট নিষ্ক্রিয় হতে পারে",
        "ছবিটি বরং আসল ফটোগ্রাফ হিসেবে বিক্রি হয়",
        "অ্যাডোবি লেবেল যোগ করে ছোট একটি ফি নেয়",
      ],
      answer: 1,
      explanation:
        "The checkbox is required for all AI-created content. Adobe's guidelines warn that content may be removed or an account deactivated for not following them — an unlabeled AI file is a breach of the contributor agreement.",
      explanationBn:
        "AI দিয়ে তৈরি সব কনটেন্টের জন্য চেকবক্স বাধ্যতামূলক। অ্যাডোবির নির্দেশিকায় সতর্ক করা হয়েছে যে নিয়ম না মানলে কনটেন্ট সরিয়ে ফেলা হতে পারে বা অ্যাকাউন্ট নিষ্ক্রিয় হতে পারে — লেবেল ছাড়া AI ফাইল কন্ট্রিবিউটর চুক্তির লঙ্ঘন।",
    },
    {
      id: "L20-Q17",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You use an AI coding assistant to help write animation code for a video, but no generative AI model creates any of the visuals. Is the AI checkbox required?",
      qBn: "আপনি একটি ভিডিওর অ্যানিমেশন কোড লিখতে AI কোডিং সহকারী ব্যবহার করলেন, কিন্তু কোনো জেনারেটিভ AI মডেল কোনো ভিজ্যুয়াল তৈরি করেনি। AI চেকবক্স কি দরকার?",
      options: [
        "No — using AI only as a coding aid does not require the checkbox",
        "Yes — any use of AI anywhere in the workflow requires it",
        "Yes — code is also generative AI content",
        "No — but only if the video is under 60 seconds",
      ],
      optionsBn: [
        "না — শুধু কোডিং সহায়ক হিসেবে AI ব্যবহার করলে চেকবক্স দরকার হয় না",
        "হ্যাঁ — কর্মপ্রবাহের যেকোনো জায়গায় AI ব্যবহার করলেই দরকার",
        "হ্যাঁ — কোডও জেনারেটিভ AI কনটেন্ট",
        "না — তবে শুধু ভিডিও ৬০ সেকেন্ডের কম হলে",
      ],
      answer: 0,
      explanation:
        "The generative-AI checkbox is for content created by generative AI. Using an AI coding assistant only to write code does not require the checkbox, when the final video is rendered by a standard deterministic process and no generative AI model created any visual content. If any part of the visuals was generated by AI, disclosure is required.",
      explanationBn:
        "জেনারেটিভ AI চেকবক্স জেনারেটিভ AI দিয়ে তৈরি কনটেন্টের জন্য। শুধু কোড লিখতে AI কোডিং সহকারী ব্যবহার করলে চেকবক্স দরকার হয় না, যখন চূড়ান্ত ভিডিও একটি স্ট্যান্ডার্ড নির্ধারিত প্রক্রিয়ায় রেন্ডার হয় এবং কোনো জেনারেটিভ AI মডেল কোনো ভিজ্যুয়াল তৈরি করেনি। ভিজ্যুয়ালের কোনো অংশ AI দিয়ে তৈরি হলে প্রকাশ করা আবশ্যক।",
    },
    {
      id: "L20-Q18",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Before submitting AI content, what must you check about the AI generator you used?",
      qBn: "AI কনটেন্ট জমা দেওয়ার আগে আপনি যে AI জেনারেটর ব্যবহার করেছেন, সে সম্পর্কে কী যাচাই করতে হবে?",
      options: [
        "That it is free to use",
        "That you have all necessary rights to submit the content under the generator's terms",
        "That it is the most popular generator",
        "That it was made by Adobe",
      ],
      optionsBn: [
        "এটি বিনামূল্যে ব্যবহার করা যায় কি না",
        "জেনারেটরের শর্তাবলী অনুযায়ী কনটেন্টটি জমা দেওয়ার সব প্রয়োজনীয় অধিকার আপনার আছে কি না",
        "এটি সবচেয়ে জনপ্রিয় জেনারেটর কি না",
        "এটি অ্যাডোবি তৈরি করেছে কি না",
      ],
      answer: 1,
      explanation:
        "Adobe requires that you have all necessary rights to submit the content, and advises reviewing the terms of your generator. A tool's terms may restrict commercial use of what it creates.",
      explanationBn:
        "অ্যাডোবি চায় কনটেন্টটি জমা দেওয়ার সব প্রয়োজনীয় অধিকার আপনার থাকুক, এবং আপনার জেনারেটরের শর্তাবলী পর্যালোচনা করার পরামর্শ দেয়। টুলের শর্তাবলী তার তৈরি জিনিসের বাণিজ্যিক ব্যবহার সীমিত করতে পারে।",
    },
    {
      id: "L20-Q19",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image shows a person who looks like no one real, and you tag it “portrait of a famous actor”. What is wrong?",
      qBn: "আপনার AI ছবিতে এমন একজন মানুষ দেখা যাচ্ছে যিনি কোনো বাস্তব ব্যক্তির মতো নন, এবং আপনি এটিকে “portrait of a famous actor” ট্যাগ করলেন। সমস্যা কী?",
      options: [
        "Nothing — tags are just suggestions",
        "Nothing — the person is fictional",
        "Tagging it with an inaccurate descriptor is misleading and prohibited",
        "It is fine if the AI checkbox is checked",
      ],
      optionsBn: [
        "কিছুই নয় — ট্যাগ শুধু পরামর্শ",
        "কিছুই নয় — ব্যক্তিটি কাল্পনিক",
        "ভুল বর্ণনাকারী শব্দ দিয়ে ট্যাগ করা বিভ্রান্তিকর ও নিষিদ্ধ",
        "AI চেকবক্স দেওয়া থাকলে ঠিক আছে",
      ],
      answer: 2,
      explanation:
        "Adobe's FAQ warns not to tag AI content with inaccurate descriptors. If the content was not based on a real person but resembles one, select the “People and Property are fictional” checkbox instead of naming anyone.",
      explanationBn:
        "অ্যাডোবির FAQ সতর্ক করে AI কনটেন্টে ভুল বর্ণনাকারী শব্দ দিয়ে ট্যাগ না করতে। কনটেন্ট কোনো বাস্তব ব্যক্তির ওপর ভিত্তি করে তৈরি না হলেও যদি তার মতো দেখায়, তাহলে কারো নাম না দিয়ে “People and Property are fictional” চেকবক্সটি নির্বাচন করুন।",
    },
    {
      id: "L20-Q20",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image is a fantasy landscape with no people, no brands and no real places. Which rule still applies to it?",
      qBn: "আপনার AI ছবিটি একটি কাল্পনিক ল্যান্ডস্কেপ — এতে মানুষ, ব্র্যান্ড বা বাস্তব স্থান নেই। কোন নিয়মটি তবুও প্রযোজ্য?",
      options: [
        "No rules apply to fantasy landscapes",
        "The AI checkbox is still required, and it must meet the same visual and technical quality standards",
        "Only the 49-keyword limit applies",
        "Only the title rules apply",
      ],
      optionsBn: [
        "কাল্পনিক ল্যান্ডস্কেপে কোনো নিয়ম প্রযোজ্য নয়",
        "AI চেকবক্স তবুও বাধ্যতামূলক, এবং একই দৃশ্যমান ও কারিগরি মানের মানদণ্ড পূরণ করতে হবে",
        "শুধু ৪৯টি কীওয়ার্ডের সীমা প্রযোজ্য",
        "শুধু টাইটেল নিয়ম প্রযোজ্য",
      ],
      answer: 1,
      explanation:
        "Even the safest AI subject still needs the “Created using generative AI tools” checkbox, and generative AI content must meet the existing visual and technical quality standards for images, vectors or videos.",
      explanationBn:
        "সবচেয়ে নিরাপদ AI বিষয়েও “Created using generative AI tools” চেকবক্স দরকার, এবং জেনারেটিভ AI কনটেন্টকে ছবি, ভেক্টর বা ভিডিওর বিদ্যমান দৃশ্যমান ও কারিগরি মানের মানদণ্ড পূরণ করতে হবে।",
    },
    {
      id: "L20-Q21",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Which of these AI prompts is allowed?",
      qBn: "নিচের কোন AI প্রম্পটটি অনুমোদিত?",
      options: [
        "A peaceful mountain lake at sunrise",
        "A portrait of a famous politician giving a speech, in the style of a famous living painter",
        "A scene featuring a famous cartoon character",
        "A poster for a government agency campaign",
      ],
      optionsBn: [
        "সূর্যোদয়ের সময় একটি শান্ত পাহাড়ি হ্রদ",
        "ভাষণ দেওয়া একজন বিখ্যাত রাজনীতিবিদের প্রতিকৃতি, একজন বিখ্যাত জীবিত চিত্রশিল্পীর শৈলীতে",
        "একটি বিখ্যাত কার্টুন চরিত্রের দৃশ্য",
        "একটি সরকারি সংস্থার প্রচারণার পোস্টার",
      ],
      answer: 0,
      explanation:
        "A generic scene with no artist name, real person, fictional character, copyrighted work or government agency is allowed. The other three each name something from Adobe's prohibited list.",
      explanationBn:
        "শিল্পীর নাম, বাস্তব মানুষ, কাল্পনিক চরিত্র, কপিরাইটযুক্ত কাজ বা সরকারি সংস্থা ছাড়া সাধারণ দৃশ্য অনুমোদিত। বাকি তিনটিতে অ্যাডোবির নিষিদ্ধ তালিকার কিছু না কিছু নাম দেওয়া হয়েছে।",
    },
    {
      id: "L20-Q22",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You generate an AI image using the style of an artist who died 200 years ago, with no other rights applying. Is that allowed?",
      qBn: "আপনি ২০০ বছর আগে মারা যাওয়া একজন শিল্পীর শৈলী ব্যবহার করে AI ছবি তৈরি করলেন, অন্য কোনো অধিকার প্রযোজ্য নয়। এটি কি অনুমোদিত?",
      options: [
        "No — all artist styles are banned forever",
        "No — only Adobe's own styles are allowed",
        "Yes — you may use an artist's style if their work is no longer under copyright and no other rights apply",
        "Yes — but only for editorial submissions",
      ],
      optionsBn: [
        "না — সব শিল্পীর শৈলী চিরকাল নিষিদ্ধ",
        "না — শুধু অ্যাডোবির নিজস্ব শৈলী অনুমোদিত",
        "হ্যাঁ — শিল্পীর কাজ আর কপিরাইট সুরক্ষার অধীনে না থাকলে এবং অন্য কোনো অধিকার প্রযোজ্য না হলে তার শৈলী ব্যবহার করা যায়",
        "হ্যাঁ — তবে শুধু এডিটোরিয়াল জমার ক্ষেত্রে",
      ],
      answer: 2,
      explanation:
        "Adobe's FAQ allows submitting work using artist styles only if you verify their work is no longer under copyright protection and no other rights apply, such as publicity rights or cultural heritage rights.",
      explanationBn:
        "অ্যাডোবির FAQ বলে শিল্পীর শৈলী ব্যবহার করে কাজ জমা দেওয়া যায় শুধু তখনই, যখন যাচাই করে নিশ্চিত হবেন যে তার কাজ আর কপিরাইট সুরক্ষার অধীনে নেই এবং প্রচার অধিকার বা সাংস্কৃতিক ঐতিহ্য অধিকারের মতো অন্য কোনো অধিকার প্রযোজ্য নয়।",
    },
    {
      id: "L20-Q23",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI video is 90 seconds long. What is the problem?",
      qBn: "আপনার AI ভিডিও ৯০ সেকেন্ডের লম্বা। সমস্যা কী?",
      options: [
        "AI videos can be any length",
        "AI videos must be under 5 seconds",
        "AI videos have a 30-second limit",
        "AI video must meet the same rules as traditional video — 5 to 60 seconds",
      ],
      optionsBn: [
        "AI ভিডিও যেকোনো দৈর্ঘ্যের হতে পারে",
        "AI ভিডিও ৫ সেকেন্ডের কম হতে হবে",
        "AI ভিডিওর সীমা ৩০ সেকেন্ড",
        "AI ভিডিওকে ঐতিহ্যগত ভিডিওর মতো একই নিয়ম মানতে হবে — ৫ থেকে ৬০ সেকেন্ড",
      ],
      answer: 3,
      explanation:
        "AI video must meet the same technical requirements as traditional video, including the 5–60 second duration limit. A 90-second AI video must be cut down before submitting.",
      explanationBn:
        "AI ভিডিওকে ঐতিহ্যগত ভিডিওর মতো একই কারিগরি প্রয়োজনীয়তা পূরণ করতে হবে, ৫–৬০ সেকেন্ডের দৈর্ঘ্য সীমাসহ। ৯০ সেকেন্ডের AI ভিডিও জমা দেওয়ার আগে ছোট করতে হবে।",
    },
    {
      id: "L20-Q24",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Which of these must never appear in an AI image's title or keywords?",
      qBn: "নিচের কোনটি AI ছবির টাইটেল বা কীওয়ার্ডে কখনোই থাকা যাবে না?",
      options: [
        "The word “landscape”",
        "The name of a real person",
        "The word “sunset”",
        "The word “fantasy”",
      ],
      optionsBn: [
        "“landscape” শব্দটি",
        "একজন বাস্তব মানুষের নাম",
        "“sunset” শব্দটি",
        "“fantasy” শব্দটি",
      ],
      answer: 1,
      explanation:
        "Titles and keywords cannot contain artist names, people's names, government agencies, or references to third-party intellectual property — even when the image itself was AI-generated.",
      explanationBn:
        "টাইটেল ও কীওয়ার্ডে শিল্পীদের নাম, মানুষের নাম, সরকারি সংস্থা বা তৃতীয় পক্ষের মেধাসম্পদের উল্লেখ থাকতে পারবে না — ছবিটি AI দিয়ে তৈরি হলেও নয়।",
    },
    {
      id: "L20-Q25",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You use AI to change the main subject of a photo from a red car to a blue car. What must you do when submitting?",
      qBn: "আপনি AI দিয়ে একটি ছবির প্রধান বিষয়বস্তু লাল গাড়ি থেকে নীল গাড়িতে বদলে দিলেন। জমা দেওয়ার সময় কী করতে হবে?",
      options: [
        "Check the “Created using generative AI tools” box — AI changed the primary subject",
        "Do nothing — changing a color is retouching",
        "Do nothing — the car is not a person",
        "Submit it as a vector instead",
      ],
      optionsBn: [
        "“Created using generative AI tools” বাক্সে টিক দিন — AI প্রধান বিষয়বস্তু পরিবর্তন করেছে",
        "কিছুই নয় — রং বদলানো রিটাচিং",
        "কিছুই নয় — গাড়ি মানুষ নয়",
        "বরং ভেক্টর হিসেবে জমা দিন",
      ],
      answer: 0,
      explanation:
        "Labeling is required when AI changed, augmented or added a new primary subject — and that applies to any subject, not only people. Only background extension, IP removal and distraction retouching are exempt.",
      explanationBn:
        "AI প্রধান বিষয়বস্তু পরিবর্তন, বৃদ্ধি বা যোগ করলে লেবেলিং দরকার — এবং এটি যেকোনো বিষয়বস্তুর ক্ষেত্রে প্রযোজ্য, শুধু মানুষের ক্ষেত্রে নয়। শুধু ব্যাকগ্রাউন্ড এক্সটেনশন, IP অপসারণ ও বিভ্রান্তিকর উপাদান রিটাচ ছাড় পায়।",
    },
    {
      id: "L20-Q26",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI image depicts a newsworthy event that you did not document and that never happened. What is the problem?",
      qBn: "আপনার AI ছবিতে একটি সংবাদমূল্য ঘটনা দেখা যাচ্ছে, যা আপনি নথিভুক্ত করেননি এবং যা কখনো ঘটেনি। সমস্যা কী?",
      options: [
        "Nothing — AI images can show anything",
        "Nothing — it is clearly labeled as AI",
        "AI content must not depict real newsworthy events you did not document",
        "It is fine if it is submitted as a vector",
      ],
      optionsBn: [
        "কিছুই নয় — AI ছবিতে যেকোনো কিছু দেখানো যায়",
        "কিছুই নয় — এটি স্পষ্টভাবে AI হিসেবে লেবেল করা আছে",
        "AI কনটেন্টে এমন বাস্তব সংবাদমূল্য ঘটনা দেখানো যাবে না যা আপনি নথিভুক্ত করেননি",
        "ভেক্টর হিসেবে জমা দিলে ঠিক আছে",
      ],
      answer: 2,
      explanation:
        "Adobe's IP restrictions bar depictions implying real newsworthy events you did not document. AI imagery must not fake real events, even with the AI label.",
      explanationBn:
        "অ্যাডোবির মেধাসম্পদ বিধিনিষেধে এমন বাস্তব সংবাদমূল্য ঘটনার চিত্রণ নিষিদ্ধ যা আপনি নথিভুক্ত করেননি। AI লেবেল থাকলেও AI ছবিতে বাস্তব ঘটনা জাল করা যাবে না।",
    },
    {
      id: "L20-Q27",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "You submit an AI-generated vector illustration. Does the AI checkbox apply to vectors too?",
      qBn: "আপনি AI দিয়ে তৈরি একটি ভেক্টর ইলাস্ট্রেশন জমা দিলেন। AI চেকবক্স কি ভেক্টরের ক্ষেত্রেও প্রযোজ্য?",
      options: [
        "No — vectors are exempt",
        "No — only photos and videos need it",
        "No — vectors are always labeled automatically",
        "Yes — the checkbox is required for ALL AI-created content, including vectors",
      ],
      optionsBn: [
        "না — ভেক্টর ছাড় পায়",
        "না — শুধু ছবি ও ভিডিওতে দরকার",
        "না — ভেক্টর সবসময় স্বয়ংক্রিয়ভাবে লেবেল হয়",
        "হ্যাঁ — ভেক্টরসহ AI দিয়ে তৈরি সব কনটেন্টের জন্য চেকবক্স বাধ্যতামূলক",
      ],
      answer: 3,
      explanation:
        "Adobe Stock accepts AI images, vectors and videos when properly labeled. The checkbox is required for all AI-created content — no asset type is exempt.",
      explanationBn:
        "অ্যাডোবি স্টক সঠিকভাবে লেবেল করা AI ছবি, ভেক্টর ও ভিডিও গ্রহণ করে। AI দিয়ে তৈরি সব কনটেন্টের জন্য চেকবক্স বাধ্যতামূলক — কোনো অ্যাসেটের ধরন ছাড় পায় না।",
    },
    {
      id: "L20-Q28",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Your AI tool generated an image that includes a visible brand logo. What must you do?",
      qBn: "আপনার AI টুল এমন একটি ছবি তৈরি করেছে যাতে একটি দৃশ্যমান ব্র্যান্ড লোগো আছে। আপনার কী করা উচিত?",
      options: [
        "Submit it — AI-generated logos are allowed",
        "Remove the logo or do not submit it — logos and trademarks are not allowed",
        "Name the brand in the title so buyers know",
        "Submit it as editorial",
      ],
      optionsBn: [
        "জমা দিন — AI-তৈরি লোগো অনুমোদিত",
        "লোগোটি সরিয়ে ফেলুন বা জমা দেবেন না — লোগো ও ট্রেডমার্ক অনুমোদিত নয়",
        "টাইটেলে ব্র্যান্ডের নাম দিন, যাতে ক্রেতারা জানেন",
        "এডিটোরিয়াল হিসেবে জমা দিন",
      ],
      answer: 1,
      explanation:
        "The same IP rules apply to AI content: no logos, brand marks, trademarked symbols or copyrighted characters. An AI-generated logo is still a logo.",
      explanationBn:
        "AI কনটেন্টেও একই মেধাসম্পদ নিয়ম প্রযোজ্য: লোগো, ব্র্যান্ড চিহ্ন, ট্রেডমার্কযুক্ত প্রতীক বা কপিরাইটযুক্ত চরিত্র নয়। AI দিয়ে তৈরি লোগোও লোগোই।",
    },
    {
      id: "L20-Q29",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "Which workflow needs the AI checkbox?",
      qBn: "কোন কর্মপ্রবাহে AI চেকবক্স দরকার?",
      options: [
        "AI generated the whole image from a text prompt",
        "AI only extended the background of a real photo",
        "AI only removed a small distraction from a real photo",
        "AI only helped write animation code, with no AI visuals",
      ],
      optionsBn: [
        "AI টেক্সট প্রম্পট থেকে পুরো ছবিটি তৈরি করেছে",
        "AI শুধু একটি আসল ছবির ব্যাকগ্রাউন্ড বাড়িয়েছে",
        "AI শুধু একটি আসল ছবি থেকে ছোট একটি বিভ্রান্তিকর উপাদান সরিয়েছে",
        "AI শুধু অ্যানিমেশন কোড লিখতে সাহায্য করেছে, কোনো AI ভিজ্যুয়াল ছাড়া",
      ],
      answer: 0,
      explanation:
        "Only the first workflow created content with generative AI — so only it needs the checkbox. Background extension, distraction removal and AI coding help do not require labeling.",
      explanationBn:
        "শুধু প্রথম কর্মপ্রবাহেই জেনারেটিভ AI দিয়ে কনটেন্ট তৈরি হয়েছে — তাই শুধু সেটিতেই চেকবক্স দরকার। ব্যাকগ্রাউন্ড এক্সটেনশন, বিভ্রান্তিকর উপাদান অপসারণ ও AI কোডিং সহায়তায় লেবেলিং দরকার হয় না।",
    },
    {
      id: "L20-Q30",
      topic: "AI Content",
      topicBn: "AI কনটেন্ট",
      q: "What is the single most important disclosure rule for AI content on Adobe Stock?",
      qBn: "অ্যাডোবি স্টকে AI কনটেন্টের ক্ষেত্রে একক সবচেয়ে গুরুত্বপূর্ণ প্রকাশের নিয়ম কোনটি?",
      options: [
        "Mention the AI tool's name in the title",
        "Submit AI content only on weekdays",
        "Always check “Created using generative AI tools” for every AI-created asset",
        "Add the word “AI” to every keyword",
      ],
      optionsBn: [
        "টাইটেলে AI টুলের নাম উল্লেখ করুন",
        "AI কনটেন্ট শুধু সপ্তাহের কর্মদিবসে জমা দিন",
        "প্রতিটি AI-তৈরি অ্যাসেটে সবসময় “Created using generative AI tools” চেক করুন",
        "প্রতিটি কীওয়ার্ডে “AI” শব্দটি যোগ করুন",
      ],
      answer: 2,
      explanation:
        "The generative-AI checkbox is required for all AI-created content — always. It is the one disclosure rule that applies to every AI image, vector and video, with no exceptions.",
      explanationBn:
        "জেনারেটিভ AI চেকবক্স AI দিয়ে তৈরি সব কনটেন্টের জন্য বাধ্যতামূলক — সবসময়। এটিই একমাত্র প্রকাশের নিয়ম যা প্রতিটি AI ছবি, ভেক্টর ও ভিডিওতে প্রযোজ্য, কোনো ব্যতিক্রম ছাড়া।",
    },
  ],
  21: [
    {
      id: "L21-Q01",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Adobe's guidance caps variations of one motif at three. What is the reason for that cap?",
      qBn: "অ্যাডোবির নির্দেশিকা একটি মোটিফের ভিন্নতা তিনটিতে সীমাবদ্ধ করে। এই সীমার কারণ কী?",
      options: [
        "Because too many similar submissions reduce discoverability and dilute the portfolio",
        "To limit how much contributors can earn",
        "Because reviewers can only check three files per motif",
        "To save server space",
      ],
      optionsBn: [
        "কারণ অতিরিক্ত অনুরূপ জমা খুঁজে পাওয়ার সম্ভাবনা কমায় এবং পোর্টফোলিওকে পাতলা করে",
        "কন্ট্রিবিউটররা কত আয় করতে পারবেন তা সীমিত করতে",
        "কারণ রিভিউয়াররা প্রতি মোটিফে শুধু তিনটি ফাইল যাচাই করতে পারেন",
        "সার্ভারের জায়গা বাঁচাতে",
      ],
      answer: 0,
      explanation:
        "Adobe explains that too many similar submissions make it difficult for customers to discover content, reduce the visibility of your work, and dilute your portfolio — which can diminish sales. The cap protects discoverability, not server space.",
      explanationBn:
        "অ্যাডোবি ব্যাখ্যা করে যে অতিরিক্ত অনুরূপ জমা ক্রেতাদের কনটেন্ট খুঁজে পেতে কঠিন করে, আপনার কাজের দৃশ্যমানতা কমায় এবং পোর্টফোলিওকে পাতলা করে — যা বিক্রি কমাতে পারে। সীমাটি খুঁজে পাওয়ার যোগ্যতা রক্ষা করে, সার্ভারের জায়গা নয়।",
    },
    {
      id: "L21-Q02",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You submit the same photo four times: the original, a cropped version, a flipped version and a black-and-white version. What happens?",
      qBn: "আপনি একই ছবি চারবার জমা দিলেন: মূলটি, একটি ক্রপ করা সংস্করণ, একটি ফ্লিপ করা সংস্করণ ও একটি সাদা-কালো সংস্করণ। কী হবে?",
      options: [
        "All four are accepted — they are different files",
        "All four are accepted if the keywords differ",
        "All four sell better as a set",
        "They are treated as duplicates and spam — croppings, mirrored images and black-and-white duplicates are prohibited",
      ],
      optionsBn: [
        "চারটিই গৃহীত হবে — এগুলো ভিন্ন ফাইল",
        "কীওয়ার্ড ভিন্ন হলে চারটিই গৃহীত হবে",
        "সেট হিসেবে চারটিই ভালো বিক্রি হয়",
        "এগুলো ডুপ্লিকেট ও স্প্যাম হিসেবে গণ্য হবে — ক্রপ, মিরর করা ছবি ও সাদা-কালো ডুপ্লিকেট নিষিদ্ধ",
      ],
      answer: 3,
      explanation:
        "Adobe explicitly prohibits croppings, mirrored images and duplicate images or videos in black-and-white and then in color, or with color filters. These are not significant variations.",
      explanationBn:
        "অ্যাডোবি স্পষ্টভাবে ক্রপ, মিরর করা ছবি এবং সাদা-কালো ও পরে রঙিন, বা কালার ফিল্টারসহ ডুপ্লিকেট ছবি বা ভিডিও নিষিদ্ধ করে। এগুলো উল্লেখযোগ্য ভিন্নতা নয়।",
    },
    {
      id: "L21-Q03",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Two photos differ only by a slight change in camera angle. Are they different enough to submit both?",
      qBn: "দুটি ছবি শুধু ক্যামেরার কোণে সামান্য পরিবর্তনে ভিন্ন। দুটিই জমা দেওয়ার মতো যথেষ্ট ভিন্ন কি?",
      options: [
        "No — minimal changes such as slight angle or depth changes should be avoided",
        "Yes — any angle change counts as a new variation",
        "Yes — if one is cropped differently",
        "No — only one photo per shoot may ever be submitted",
      ],
      optionsBn: [
        "না — কোণ বা গভীরতার সামান্য পরিবর্তনের মতো ন্যূনতম পার্থক্য এড়ানো উচিত",
        "হ্যাঁ — যেকোনো কোণ পরিবর্তনই নতুন ভিন্নতা হিসেবে গণ্য হয়",
        "হ্যাঁ — একটিকে ভিন্নভাবে ক্রপ করলে",
        "না — প্রতি শুটে শুধু একটি ছবিই জমা দেওয়া যায়",
      ],
      answer: 0,
      explanation:
        "Adobe warns against sending images with minimal differences, such as slight angle or depth changes. Each submission should tell a unique story, show a different emotion, or offer a new composition.",
      explanationBn:
        "অ্যাডোবি সতর্ক করে কোণ বা গভীরতার সামান্য পরিবর্তনের মতো ন্যূনতম পার্থক্যের ছবি না পাঠাতে। প্রতিটি জমা একটি অনন্য গল্প বলা উচিত, ভিন্ন অনুভূতি দেখানো উচিত, বা নতুন কম্পোজিশন দেওয়া উচিত।",
    },
    {
      id: "L21-Q04",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "What makes a variation of a photo “useful and meaningful” to buyers?",
      qBn: "একটি ছবির ভিন্নতাকে ক্রেতাদের কাছে “কার্যকর ও অর্থবহ” করে তোলে কী?",
      options: [
        "A different Instagram filter",
        "A slightly different crop",
        "A change in composition, theme, objects, mood, season or intended use",
        "A different file name",
      ],
      optionsBn: [
        "একটি ভিন্ন Instagram ফিল্টার",
        "সামান্য ভিন্ন ক্রপ",
        "কম্পোজিশন, থিম, বস্তু, মেজাজ, ঋতু বা ব্যবহারের উদ্দেশ্যে পরিবর্তন",
        "একটি ভিন্ন ফাইলের নাম",
      ],
      answer: 2,
      explanation:
        "Adobe says useful variations change the composition, theme or objects — or the mood, season or intended use. Filters, crops and background-color changes do not count.",
      explanationBn:
        "অ্যাডোবি বলে কার্যকর ভিন্নতা কম্পোজিশন, থিম বা বস্তু বদলায় — অথবা মেজাজ, ঋতু বা ব্যবহারের উদ্দেশ্য। ফিল্টার, ক্রপ ও ব্যাকগ্রাউন্ডের রঙের পরিবর্তন গণ্য হয় না।",
    },
    {
      id: "L21-Q05",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You create a vector icon set and submit the same icon in 6 different colors. What is the likely result?",
      qBn: "আপনি একটি ভেক্টর আইকন সেট তৈরি করে একই আইকন ৬টি ভিন্ন রঙে জমা দিলেন। সম্ভাব্য ফলাফল কী?",
      options: [
        "All 6 are accepted — colors make them different",
        "They can be refused — repeating the same design with only slight color changes is too similar",
        "All 6 sell as a matching set",
        "They are accepted if each has different keywords",
      ],
      optionsBn: [
        "৬টিই গৃহীত হবে — রং এগুলোকে ভিন্ন করে",
        "এগুলো বাতিল হতে পারে — শুধু সামান্য রঙের পরিবর্তনসহ একই ডিজাইন পুনরাবৃত্তি অতিরিক্ত মিল",
        "মিলে যাওয়া সেট হিসেবে ৬টিই বিক্রি হয়",
        "প্রতিটির কীওয়ার্ড ভিন্ন হলে গৃহীত হবে",
      ],
      answer: 1,
      explanation:
        "Adobe's guidance for vectors says repeating the same character, icon or design with only slight color changes, layout adjustments or pattern shifts may result in refusal for being too similar.",
      explanationBn:
        "ভেক্টরের ক্ষেত্রে অ্যাডোবির নির্দেশিকা বলে শুধু সামান্য রঙের পরিবর্তন, লেআউট সমন্বয় বা প্যাটার্ন পরিবর্তনসহ একই চরিত্র, আইকন বা ডিজাইন পুনরাবৃত্তি করলে অতিরিক্ত মিলের কারণে বাতিল হতে পারে।",
    },
    {
      id: "L21-Q06",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You upload 200 photos from one photoshoot in a single day. What does Adobe recommend instead?",
      qBn: "আপনি একদিনে একটি ফটোশুটের ২০০টি ছবি আপলোড করলেন। অ্যাডোবি বরং কী সুপারিশ করে?",
      options: [
        "Upload even more, faster",
        "Upload them all but with identical keywords",
        "Upload everything — reviewers will pick the best",
        "Curate only the best prospects, and stagger uploads in smaller batches on a consistent basis",
      ],
      optionsBn: [
        "আরও বেশি, আরও দ্রুত আপলোড করুন",
        "সবগুলো আপলোড করুন তবে অভিন্ন কীওয়ার্ডসহ",
        "সবকিছু আপলোড করুন — রিভিউয়াররা সেরাটি বেছে নেবেন",
        "শুধু সেরা সম্ভাবনাগুলো বেছে নিন, এবং নিয়মিতভাবে ছোট ছোট ব্যাচে আপলোড করুন",
      ],
      answer: 3,
      explanation:
        "Adobe advises not sending every photograph from a shoot — select the best prospects — and, for high volumes, staggering uploads in smaller batches on a consistent basis.",
      explanationBn:
        "অ্যাডোবি পরামর্শ দেয় শুটের প্রতিটি ছবি না পাঠাতে — সেরা সম্ভাবনাগুলো বেছে নিতে — এবং বেশি পরিমাণ হলে নিয়মিতভাবে ছোট ছোট ব্যাচে আপলোড করতে।",
    },
    {
      id: "L21-Q07",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "What is the worst consequence of repeatedly submitting identical or near-identical content as spam?",
      qBn: "অভিন্ন বা প্রায় অভিন্ন কনটেন্ট স্প্যাম হিসেবে বারবার জমা দেওয়ার সবচেয়ে খারাপ পরিণতি কী?",
      options: [
        "Your account can be blocked or even permanently closed",
        "Your photos are moved to the back of search results for one day",
        "You lose 10 keywords on your next upload",
        "Your royalty rate drops to 10%",
      ],
      optionsBn: [
        "আপনার অ্যাকাউন্ট ব্লক হতে পারে বা এমনকি স্থায়ীভাবে বন্ধ হতে পারে",
        "আপনার ছবি একদিনের জন্য সার্চ ফলাফলের পেছনে চলে যায়",
        "পরের আপলোডে আপনার ১০টি কীওয়ার্ড হারিয়ে যায়",
        "আপনার রয়্যালটি হার ১০%-এ নেমে যায়",
      ],
      answer: 0,
      explanation:
        "Submitting multiple copies of identical content can be perceived as image spam, which can result in your account being blocked or even permanently closed.",
      explanationBn:
        "অভিন্ন কনটেন্টের একাধিক কপি জমা দেওয়া ছবির স্প্যাম হিসেবে গণ্য হতে পারে, যার ফলে আপনার অ্যাকাউন্ট ব্লক হতে পারে বা এমনকি স্থায়ীভাবে বন্ধ হতে পারে।",
    },
    {
      id: "L21-Q08",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Why does Adobe refuse content that is too similar to your other submissions?",
      qBn: "অ্যাডোবি আপনার অন্যান্য জমার সাথে অতিরিক্ত মিল থাকা কনটেন্ট কেন বাতিল করে?",
      options: [
        "To save server space",
        "To protect buyers from poor-quality files",
        "Because similar submissions make it difficult for customers to discover content, and reduce your work's visibility",
        "Because similar content earns higher royalties",
      ],
      optionsBn: [
        "সার্ভারের জায়গা বাঁচাতে",
        "ক্রেতাদের নিম্নমানের ফাইল থেকে রক্ষা করতে",
        "কারণ অনুরূপ জমা ক্রেতাদের কনটেন্ট খুঁজে পেতে কঠিন করে এবং আপনার কাজের দৃশ্যমানতা কমায়",
        "কারণ অনুরূপ কনটেন্ট বেশি রয়্যালটি আয় করে",
      ],
      answer: 2,
      explanation:
        "Adobe explains that content that is too similar, in composition or subject, makes it difficult for customers to discover content — and too many similar submissions reduce the visibility of your creative work.",
      explanationBn:
        "অ্যাডোবি ব্যাখ্যা করে যে কম্পোজিশন বা বিষয়বস্তুতে অতিরিক্ত মিল থাকা কনটেন্ট ক্রেতাদের কনটেন্ট খুঁজে পেতে কঠিন করে — এবং অতিরিক্ত অনুরূপ জমা আপনার সৃজনশীল কাজের দৃশ্যমানতা কমায়।",
    },
    {
      id: "L21-Q09",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You have more than 15,000 assets ready to submit at once. What does Adobe ask you to do first?",
      qBn: "আপনার কাছে একসাথে জমা দেওয়ার জন্য ১৫,০০০-এর বেশি অ্যাসেট প্রস্তুত। অ্যাডোবি প্রথমে কী করতে বলে?",
      options: [
        "Upload them all in one day",
        "Contact the Adobe Stock team before you start",
        "Split them across three accounts",
        "Upload only the first 15,000 and delete the rest",
      ],
      optionsBn: [
        "একদিনে সবগুলো আপলোড করুন",
        "শুরু করার আগে অ্যাডোবি স্টক টিমের সাথে যোগাযোগ করুন",
        "তিনটি অ্যাকাউন্টে ভাগ করে দিন",
        "শুধু প্রথম ১৫,০০০টি আপলোড করুন এবং বাকিগুলো মুছে ফেলুন",
      ],
      answer: 1,
      explanation:
        "Adobe's guidance says: if you have more than 15,000 assets to submit right away, please contact the Adobe Stock team before you start.",
      explanationBn:
        "অ্যাডোবির নির্দেশিকায় বলা আছে: এখনই জমা দেওয়ার জন্য ১৫,০০০-এর বেশি অ্যাসেট থাকলে, শুরু করার আগে অ্যাডোবি স্টক টিমের সাথে যোগাযোগ করুন।",
    },
    {
      id: "L21-Q10",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Which of these vector variations is most likely to be accepted?",
      qBn: "নিচের কোন ভেক্টর ভিন্নতাটি গৃহীত হওয়ার সম্ভাবনা সবচেয়ে বেশি?",
      options: [
        "The same icon with a different background color",
        "The same illustration with a different filter",
        "The same character rotated 90 degrees",
        "A new composition with different objects and a different theme",
      ],
      optionsBn: [
        "ভিন্ন ব্যাকগ্রাউন্ড রঙসহ একই আইকন",
        "ভিন্ন ফিল্টারসহ একই ইলাস্ট্রেশন",
        "৯০ ডিগ্রি ঘোরানো একই চরিত্র",
        "ভিন্ন বস্তু ও ভিন্ন থিমসহ নতুন কম্পোজিশন",
      ],
      answer: 3,
      explanation:
        "Adobe lists flipped or rotated images, different background colors and different filters as variations to avoid. A new composition with different objects and a different theme is a genuinely distinct submission.",
      explanationBn:
        "অ্যাডোবি ফ্লিপ বা ঘোরানো ছবি, ভিন্ন ব্যাকগ্রাউন্ড রঙ ও ভিন্ন ফিল্টারকে এড়ানোর মতো ভিন্নতা হিসেবে তালিকাভুক্ত করে। ভিন্ন বস্তু ও ভিন্ন থিমসহ নতুন কম্পোজিশন সত্যিই স্বতন্ত্র একটি জমা।",
    },
    {
      id: "L21-Q11",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Your portfolio is full of near-identical sunset photos. What effect does that have on sales?",
      qBn: "আপনার পোর্টফোলিও প্রায় অভিন্ন সূর্যাস্তের ছবিতে ভরা। বিক্রিতে এর প্রভাব কী?",
      options: [
        "It dilutes your portfolio, makes it less appealing to buyers, and can result in diminished sales",
        "It increases sales — buyers love choice",
        "It has no effect on sales at all",
        "It doubles your royalty rate",
      ],
      optionsBn: [
        "এটি আপনার পোর্টফোলিওকে পাতলা করে, ক্রেতাদের কাছে কম আকর্ষণীয় করে এবং বিক্রি কমাতে পারে",
        "এটি বিক্রি বাড়ায় — ক্রেতারা পছন্দ ভালোবাসেন",
        "বিক্রিতে এর কোনো প্রভাবই নেই",
        "এটি আপনার রয়্যালটি হার দ্বিগুণ করে",
      ],
      answer: 0,
      explanation:
        "Adobe warns that uploading too many similar assets dilutes your portfolio, makes it less appealing to buyers, and can result in diminished sales.",
      explanationBn:
        "অ্যাডোবি সতর্ক করে যে অতিরিক্ত অনুরূপ অ্যাসেট আপলোড করলে আপনার পোর্টফোলিও পাতলা হয়, ক্রেতাদের কাছে কম আকর্ষণীয় হয় এবং বিক্রি কমতে পারে।",
    },
    {
      id: "L21-Q12",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You submit 5 versions of the same AI image from one prompt, changing only the colors. What is the risk?",
      qBn: "আপনি একটি প্রম্পট থেকে একই AI ছবির ৫টি সংস্করণ জমা দিলেন, শুধু রং বদলে। ঝুঁকি কী?",
      options: [
        "No risk — AI images are exempt",
        "No risk — color changes count as significant variations",
        "It is treated as spamming — submit at most 3 iterations of similar AI assets",
        "It is fine as long as the titles are different",
      ],
      optionsBn: [
        "কোনো ঝুঁকি নেই — AI ছবি ছাড় পায়",
        "কোনো ঝুঁকি নেই — রঙের পরিবর্তন উল্লেখযোগ্য ভিন্নতা হিসেবে গণ্য হয়",
        "এটি স্প্যাম হিসেবে গণ্য হয় — একই ধরনের AI অ্যাসেটের সর্বোচ্চ ৩টি ইটারেশন জমা দিন",
        "টাইটেল ভিন্ন হলে ঠিক আছে",
      ],
      answer: 2,
      explanation:
        "Adobe's AI FAQ caps similar AI assets at three iterations, and its vector guidance says color-only changes do not make a meaningful variation. Five color swaps from one prompt is spamming.",
      explanationBn:
        "অ্যাডোবির AI FAQ একই ধরনের AI অ্যাসেট সর্বোচ্চ তিনটি ইটারেশনে সীমাবদ্ধ করে, এবং ভেক্টর নির্দেশিকা বলে শুধু রঙের পরিবর্তন অর্থবহ ভিন্নতা তৈরি করে না। একটি প্রম্পট থেকে পাঁচটি রঙের বদল স্প্যাম।",
    },
    {
      id: "L21-Q13",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "When is it acceptable to submit MORE than three variations of one motif?",
      qBn: "একটি মোটিফের তিনটির বেশি ভিন্নতা জমা দেওয়া কখন গ্রহণযোগ্য?",
      options: [
        "Never — three is an absolute limit",
        "When the complexity of the image's promotional message calls for an exception",
        "When the variations are AI-generated",
        "When the keywords are identical",
      ],
      optionsBn: [
        "কখনোই নয় — তিনটি একটি পরম সীমা",
        "যখন ছবির প্রচারণামূলক বার্তার জটিলতা ব্যতিক্রমের দাবি করে",
        "যখন ভিন্নতাগুলো AI দিয়ে তৈরি",
        "যখন কীওয়ার্ড অভিন্ন হয়",
      ],
      answer: 1,
      explanation:
        "Adobe's general rule is three significant versions of a single motif, “unless the complexity of the image's promotional message calls for an exception.” A genuinely complex concept may justify more.",
      explanationBn:
        "অ্যাডোবির সাধারণ নিয়ম একটি মোটিফের তিনটি উল্লেখযোগ্য সংস্করণ, “যদি না ছবির প্রচারণামূলক বার্তার জটিলতা ব্যতিক্রমের দাবি করে।” সত্যিই জটিল ধারণা বেশি সংস্করণের যৌক্তিকতা দিতে পারে।",
    },
    {
      id: "L21-Q14",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You open a second contributor account and upload the same photos there to double your sales. What happens?",
      qBn: "আপনি একটি দ্বিতীয় কন্ট্রিবিউটর অ্যাকাউন্ট খুলে সেখানে একই ছবি আপলোড করলেন, বিক্রি দ্বিগুণ করতে। কী হবে?",
      options: [
        "It is encouraged — more accounts mean more sales",
        "It is fine as long as the accounts have different names",
        "It is fine if the photos are in different categories",
        "It is not allowed — duplicate accounts used to submit similar content or inflate sales may be blocked or terminated",
      ],
      optionsBn: [
        "এতে উৎসাহ দেওয়া হয় — বেশি অ্যাকাউন্ট মানে বেশি বিক্রি",
        "অ্যাকাউন্টের নাম ভিন্ন হলে ঠিক আছে",
        "ছবি ভিন্ন ক্যাটাগরিতে থাকলে ঠিক আছে",
        "এটি অনুমোদিত নয় — অনুরূপ কনটেন্ট জমা দিতে বা বিক্রি বাড়াতে ব্যবহৃত ডুপ্লিকেট অ্যাকাউন্ট ব্লক বা বন্ধ হতে পারে",
      ],
      answer: 3,
      explanation:
        "Adobe does not permit multiple accounts to submit similar or identical content to inflate sales, or to bypass upload limits for generative AI content. Violating accounts may be blocked or terminated.",
      explanationBn:
        "অ্যাডোবি অনুরূপ বা অভিন্ন কনটেন্ট জমা দিয়ে বিক্রি বাড়াতে, বা জেনারেটিভ AI কনটেন্টের আপলোড সীমা এড়াতে একাধিক অ্যাকাউন্টের অনুমতি দেয় না। নিয়ম ভঙ্গকারী অ্যাকাউন্ট ব্লক বা বন্ধ হতে পারে।",
    },
    {
      id: "L21-Q15",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "When ARE multiple contributor accounts allowed?",
      qBn: "একাধিক কন্ট্রিবিউটর অ্যাকাউন্ট কখন অনুমোদিত?",
      options: [
        "When each account holds a different asset type — for example, one for photos and one for video or AI content",
        "When the accounts share the same photos",
        "When one account is blocked",
        "Never — multiple accounts are always banned",
      ],
      optionsBn: [
        "যখন প্রতিটি অ্যাকাউন্টে ভিন্ন ধরনের অ্যাসেট থাকে — যেমন, একটিতে ছবি, আরেকটিতে ভিডিও বা AI কনটেন্ট",
        "যখন অ্যাকাউন্টগুলো একই ছবি শেয়ার করে",
        "যখন একটি অ্যাকাউন্ট ব্লক হয়",
        "কখনোই নয় — একাধিক অ্যাকাউন্ট সবসময় নিষিদ্ধ",
      ],
      answer: 0,
      explanation:
        "Adobe allows more than one contributor account to track different asset types in separate accounts — for example, video versus images, or generative AI versus traditional photos. The accounts must not contain similar or identical content.",
      explanationBn:
        "অ্যাডোবি ভিন্ন ধরনের অ্যাসেট আলাদা অ্যাকাউন্টে ট্র্যাক করতে একাধিক কন্ট্রিবিউটর অ্যাকাউন্টের অনুমতি দেয় — যেমন, ছবির বিপরীতে ভিডিও, বা ঐতিহ্যগত ছবির বিপরীতে জেনারেটিভ AI। অ্যাকাউন্টগুলোতে অনুরূপ বা অভিন্ন কনটেন্ট থাকা যাবে না।",
    },
    {
      id: "L21-Q16",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You shoot a model in the same outfit, same pose, same light — but change the background from a park to a beach. Is that a meaningful variation?",
      qBn: "আপনি একই পোশাক, একই ভঙ্গি, একই আলোতে একজন মডেলের ছবি তুললেন — তবে ব্যাকগ্রাউন্ড পার্ক থেকে সমুদ্রসৈকতে বদলালেন। এটি কি অর্থবহ ভিন্নতা?",
      options: [
        "No — the pose is the same",
        "No — only the outfit matters",
        "Yes — a different setting and composition can make it a distinct, meaningful variation",
        "No — one shoot can only ever produce one submission",
      ],
      optionsBn: [
        "না — ভঙ্গি একই",
        "না — শুধু পোশাকই গুরুত্বপূর্ণ",
        "হ্যাঁ — ভিন্ন পরিবেশ ও কম্পোজিশন এটিকে স্বতন্ত্র, অর্থবহ ভিন্নতা করতে পারে",
        "না — একটি শুট থেকে শুধু একটিই জমা দেওয়া যায়",
      ],
      answer: 2,
      explanation:
        "Adobe's test is whether each image tells a unique story, shows a different emotion, or offers a new composition. A new setting with a new composition can qualify — a mere crop or filter change cannot.",
      explanationBn:
        "অ্যাডোবির পরীক্ষা হলো প্রতিটি ছবি অনন্য গল্প বলে কি না, ভিন্ন অনুভূতি দেখায় কি না, বা নতুন কম্পোজিশন দেয় কি না। নতুন পরিবেশসহ নতুন কম্পোজিশন যোগ্য হতে পারে — শুধু ক্রপ বা ফিল্টার পরিবর্তন নয়।",
    },
    {
      id: "L21-Q17",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Your video shoot produced 20 clips of the same scene from slightly different angles. What should you do?",
      qBn: "আপনার ভিডিও শুটে একই দৃশ্যের সামান্য ভিন্ন কোণ থেকে ২০টি ক্লিপ তৈরি হয়েছে। আপনার কী করা উচিত?",
      options: [
        "Upload all 20 — video is exempt from the similar-content rule",
        "Choose the strongest clips with different takes, angles and pacing, and submit only those",
        "Upload all 20 with identical titles",
        "Upload all 20 as a single ZIP file",
      ],
      optionsBn: [
        "২০টিই আপলোড করুন — ভিডিও অনুরূপ-কনটেন্ট নিয়মের বাইরে",
        "ভিন্ন টেক, কোণ ও গতিসহ সবচেয়ে শক্তিশালী ক্লিপগুলো বেছে নিন এবং শুধু সেগুলো জমা দিন",
        "২০টিই অভিন্ন টাইটেলসহ আপলোড করুন",
        "২০টিই একটি ZIP ফাইল হিসেবে আপলোড করুন",
      ],
      answer: 1,
      explanation:
        "Video allows exceptional creative variety — different takes, angles and pacing — but Adobe still advises choosing clips to keep submissions strong and searchable, rather than uploading every take.",
      explanationBn:
        "ভিডিওতে ব্যতিক্রমী সৃজনশীল বৈচিত্র্য সম্ভব — ভিন্ন টেক, কোণ ও গতি — তবে অ্যাডোবি তবুও পরামর্শ দেয় প্রতিটি টেক আপলোড না করে জমাগুলো শক্তিশালী ও খুঁজে পাওয়ার উপযোগী রাখতে ক্লিপ বেছে নিতে।",
    },
    {
      id: "L21-Q18",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Which of these is a sign that your submissions are being treated as spam?",
      qBn: "নিচের কোনটি আপনার জমাগুলোকে স্প্যাম হিসেবে গণ্য করার লক্ষণ?",
      options: [
        "One photo is rejected for soft focus",
        "One photo is rejected for a missing model release",
        "Your account is blocked for sending content deemed spam or unnecessary",
        "One video is rejected for being 61 seconds long",
      ],
      optionsBn: [
        "একটি ছবি নরম ফোকাসের কারণে বাতিল হয়েছে",
        "একটি ছবি মডেল রিলিজ অনুপস্থিত থাকায় বাতিল হয়েছে",
        "স্প্যাম বা অপ্রয়োজনীয় বলে গণ্য কনটেন্ট পাঠানোর কারণে আপনার অ্যাকাউন্ট ব্লক হয়েছে",
        "একটি ভিডিও ৬১ সেকেন্ডের হওয়ায় বাতিল হয়েছে",
      ],
      answer: 3,
      explanation:
        "Adobe blocks accounts for sending content deemed spam or unnecessary — typically many near-identical versions of one motif. Single rejections for focus, releases or duration are normal quality control, not spam enforcement.",
      explanationBn:
        "অ্যাডোবি স্প্যাম বা অপ্রয়োজনীয় বলে গণ্য কনটেন্ট পাঠানোর কারণে অ্যাকাউন্ট ব্লক করে — সাধারণত একটি মোটিফের অনেক প্রায়-অভিন্ন সংস্করণের ক্ষেত্রে। ফোকাস, রিলিজ বা দৈর্ঘ্যের কারণে একক বাতিল স্বাভাবিক মান নিয়ন্ত্রণ, স্প্যাম প্রয়োগ নয়।",
    },
    {
      id: "L21-Q19",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "What should you research before uploading photos of a commonly photographed subject, like sunsets or flowers?",
      qBn: "সূর্যাস্ত বা ফুলের মতো সাধারণভাবে তোলা বিষয়ের ছবি আপলোড করার আগে কী গবেষণা করা উচিত?",
      options: [
        "The market, the competition, and what is already on Adobe Stock",
        "The weather forecast",
        "The camera settings other photographers use",
        "The most popular Instagram hashtags",
      ],
      optionsBn: [
        "বাজার, প্রতিযোগিতা এবং অ্যাডোবি স্টকে ইতিমধ্যে কী আছে",
        "আবহাওয়ার পূর্বাভাস",
        "অন্য ফটোগ্রাফাররা কোন ক্যামেরা সেটিংস ব্যবহার করেন",
        "সবচেয়ে জনপ্রিয় Instagram হ্যাশট্যাগ",
      ],
      answer: 0,
      explanation:
        "Adobe advises researching the market, the competition and what is already on Adobe Stock before choosing content — common subjects like sunsets, flowers and kittens face stiff competition.",
      explanationBn:
        "অ্যাডোবি পরামর্শ দেয় কনটেন্ট বেছে নেওয়ার আগে বাজার, প্রতিযোগিতা এবং অ্যাডোবি স্টকে ইতিমধ্যে কী আছে তা গবেষণা করতে — সূর্যাস্ত, ফুল ও বিড়ালছানার মতো সাধারণ বিষয়ে তীব্র প্রতিযোগিতা থাকে।",
    },
    {
      id: "L21-Q20",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Which of these is a legitimate way to build a varied portfolio around one theme?",
      qBn: "নিচের কোনটি একটি থিমের চারপাশে বৈচিত্র্যময় পোর্টফোলিও গড়ার বৈধ উপায়?",
      options: [
        "Uploading 50 crops of the same photo",
        "Uploading the same design in 20 colors",
        "Building varied collections around a theme instead of duplicating one concept",
        "Uploading the same video in black-and-white and in color",
      ],
      optionsBn: [
        "একই ছবির ৫০টি ক্রপ আপলোড করা",
        "একই ডিজাইন ২০টি রঙে আপলোড করা",
        "একটি ধারণা বারবার না দিয়ে একটি থিমের চারপাশে বৈচিত্র্যময় সংগ্রহ তৈরি করা",
        "একই ভিডিও সাদা-কালো ও রঙিনে আপলোড করা",
      ],
      answer: 2,
      explanation:
        "Adobe's guidance is to build varied collections around a theme instead of duplicating one concept. Crops, color-only changes and black-and-white duplicates are all prohibited variations.",
      explanationBn:
        "অ্যাডোবির নির্দেশিকা হলো একটি ধারণা বারবার না দিয়ে একটি থিমের চারপাশে বৈচিত্র্যময় সংগ্রহ তৈরি করা। ক্রপ, শুধু রঙের পরিবর্তন ও সাদা-কালো ডুপ্লিকেট — সবই নিষিদ্ধ ভিন্নতা।",
    },
    {
      id: "L21-Q21",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You change only the stroke weight of the same illustration and submit it as a new asset. What is the likely result?",
      qBn: "আপনি একই ইলাস্ট্রেশনের শুধু স্ট্রোকের পুরুত্ব বদলে নতুন অ্যাসেট হিসেবে জমা দিলেন। সম্ভাব্য ফলাফল কী?",
      options: [
        "It is accepted — stroke weight changes the design",
        "It can be refused — different stroke weights on the same illustration are listed as a variation to avoid",
        "It is accepted if the colors also change",
        "It is accepted for vectors but not for photos",
      ],
      optionsBn: [
        "গৃহীত হবে — স্ট্রোকের পুরুত্ব ডিজাইন বদলে দেয়",
        "বাতিল হতে পারে — একই ইলাস্ট্রেশনে ভিন্ন স্ট্রোক পুরুত্ব এড়ানোর মতো ভিন্নতা হিসেবে তালিকাভুক্ত",
        "রংও বদলালে গৃহীত হবে",
        "ভেক্টরের ক্ষেত্রে গৃহীত হবে, ছবির ক্ষেত্রে নয়",
      ],
      answer: 1,
      explanation:
        "Adobe's vector guidance lists different stroke weights on the same illustration or graphic as a variation to avoid — it is not a meaningful change.",
      explanationBn:
        "অ্যাডোবির ভেক্টর নির্দেশিকায় একই ইলাস্ট্রেশন বা গ্রাফিকে ভিন্ন স্ট্রোক পুরুত্ব এড়ানোর মতো ভিন্নতা হিসেবে তালিকাভুক্ত — এটি অর্থবহ পরিবর্তন নয়।",
    },
    {
      id: "L21-Q22",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Your account was blocked for spam, and you ignore the rules and keep uploading duplicates. What can happen next?",
      qBn: "স্প্যামের কারণে আপনার অ্যাকাউন্ট ব্লক হয়েছে, এবং আপনি নিয়ম উপেক্ষা করে ডুপ্লিকেট আপলোড চালিয়ে গেলেন। এরপর কী হতে পারে?",
      options: [
        "Nothing — a blocked account cannot be blocked again",
        "Your royalty rate increases",
        "Your uploads are automatically approved",
        "Re-blockage or even termination of your contributor account",
      ],
      optionsBn: [
        "কিছুই নয় — ব্লক হওয়া অ্যাকাউন্ট আবার ব্লক করা যায় না",
        "আপনার রয়্যালটি হার বাড়ে",
        "আপনার আপলোড স্বয়ংক্রিয়ভাবে অনুমোদিত হয়",
        "আপনার কন্ট্রিবিউটর অ্যাকাউন্ট আবার ব্লক বা এমনকি বন্ধ হতে পারে",
      ],
      answer: 3,
      explanation:
        "Adobe warns that disregard of the similar-content rules can result in re-blockage or even termination of a contributor account.",
      explanationBn:
        "অ্যাডোবি সতর্ক করে যে অনুরূপ-কনটেন্ট নিয়ম উপেক্ষা করলে কন্ট্রিবিউটর অ্যাকাউন্ট আবার ব্লক বা এমনকি বন্ধ হতে পারে।",
    },
    {
      id: "L21-Q23",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Which submission habit most often leads to a “similar content” refusal?",
      qBn: "কোন জমা দেওয়ার অভ্যাস সবচেয়ে বেশি “অনুরূপ কনটেন্ট” বাতিলের কারণ হয়?",
      options: [
        "Submitting only your strongest, most distinctive variations",
        "Submitting many near-identical versions of the same asset",
        "Submitting varied collections around a theme",
        "Staggering uploads in small batches",
      ],
      optionsBn: [
        "শুধু আপনার সবচেয়ে শক্তিশালী, সবচেয়ে স্বতন্ত্র ভিন্নতাগুলো জমা দেওয়া",
        "একই অ্যাসেটের অনেক প্রায়-অভিন্ন সংস্করণ জমা দেওয়া",
        "একটি থিমের চারপাশে বৈচিত্র্যময় সংগ্রহ জমা দেওয়া",
        "ছোট ছোট ব্যাচে আপলোড করা",
      ],
      answer: 1,
      explanation:
        "Similar content is one of the top reasons Adobe refuses submissions. The cause is usually many near-identical versions of one asset — not careful curation, variety or staggered uploads.",
      explanationBn:
        "অনুরূপ কনটেন্ট অ্যাডোবির জমা বাতিলের শীর্ষ কারণগুলোর একটি। কারণ সাধারণত একটি অ্যাসেটের অনেক প্রায়-অভিন্ন সংস্করণ — সতর্ক বাছাই, বৈচিত্র্য বা ছোট ব্যাচে আপলোড নয়।",
    },
    {
      id: "L21-Q24",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You submit two photos of the same café: one empty at dawn, one crowded at lunch. Are they too similar?",
      qBn: "আপনি একই ক্যাফের দুটি ছবি জমা দিলেন: একটি ভোরে খালি, আরেকটি দুপুরে ভিড়ে ভরা। এগুলো কি অতিরিক্ত মিল?",
      options: [
        "Yes — same location means same content",
        "Yes — only one photo per location is allowed",
        "No — different mood, time and story make them distinct variations",
        "No — but only if the keywords are identical",
      ],
      optionsBn: [
        "হ্যাঁ — একই স্থান মানে একই কনটেন্ট",
        "হ্যাঁ — প্রতি স্থানে শুধু একটি ছবি অনুমোদিত",
        "না — ভিন্ন মেজাজ, সময় ও গল্প এগুলোকে স্বতন্ত্র ভিন্নতা করে",
        "না — তবে শুধু কীওয়ার্ড অভিন্ন হলে",
      ],
      answer: 2,
      explanation:
        "Adobe's test is whether each image tells a unique story, shows a different emotion, or offers a new composition. An empty café at dawn and a crowded one at lunch are different stories — and changing the mood or time is a recommended way to vary an asset.",
      explanationBn:
        "অ্যাডোবির পরীক্ষা হলো প্রতিটি ছবি অনন্য গল্প বলে কি না, ভিন্ন অনুভূতি দেখায় কি না, বা নতুন কম্পোজিশন দেয় কি না। ভোরে খালি ক্যাফে ও দুপুরে ভিড়ে ভরা ক্যাফে ভিন্ন গল্প — এবং মেজাজ বা সময় বদলানো অ্যাসেট বৈচিত্র্যময় করার সুপারিশকৃত উপায়।",
    },
    {
      id: "L21-Q25",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "What is the best first step when you have 40 photos from one shoot and cannot decide which to submit?",
      qBn: "একটি শুট থেকে আপনার কাছে ৪০টি ছবি আছে এবং কোনটি জমা দেবেন ঠিক করতে পারছেন না — সেরা প্রথম পদক্ষেপ কী?",
      options: [
        "Submit all 40 and let reviewers choose",
        "Carefully curate and upload only the best of the similar series",
        "Submit the first 3 alphabetically",
        "Submit all 40 with the same title",
      ],
      optionsBn: [
        "৪০টিই জমা দিন এবং রিভিউয়ারদের বেছে নিতে দিন",
        "সতর্কভাবে বাছাই করে অনুরূপ সিরিজের শুধু সেরাগুলো আপলোড করুন",
        "বর্ণানুক্রমে প্রথম ৩টি জমা দিন",
        "৪০টিই একই টাইটেলসহ জমা দিন",
      ],
      answer: 1,
      explanation:
        "Adobe says it may be hard to narrow down favorites from a shoot, but carefully curating and uploading only the best of a similar series will pay off. Adobe will not select your best work for you during moderation.",
      explanationBn:
        "অ্যাডোবি বলে শুট থেকে প্রিয় ছবি বেছে নেওয়া কঠিন হতে পারে, তবে সতর্কভাবে বাছাই করে অনুরূপ সিরিজের শুধু সেরাগুলো আপলোড করলে লাভ হবে। মডারেশনের সময় অ্যাডোবি আপনার সেরা কাজটি বেছে দেবে না।",
    },
    {
      id: "L21-Q26",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You reuse the same title and keywords for five similar photos. What does Adobe's guidance say about that?",
      qBn: "আপনি পাঁচটি একই ধরনের ছবির জন্য একই টাইটেল ও কীওয়ার্ড পুনরায় ব্যবহার করলেন। অ্যাডোবির নির্দেশিকা এ সম্পর্কে কী বলে?",
      options: [
        "It is required for similar photos",
        "It is recommended to keep metadata consistent",
        "It has no effect on review",
        "Diversify metadata — repeating the same titles and keywords can lead to refusal",
      ],
      optionsBn: [
        "একই ধরনের ছবির জন্য এটি বাধ্যতামূলক",
        "মেটাডেটা সামঞ্জস্যপূর্ণ রাখা সুপারিশ করা হয়",
        "রিভিউতে এর কোনো প্রভাব নেই",
        "মেটাডেটা বৈচিত্র্যময় করুন — একই টাইটেল ও কীওয়ার্ড পুনরাবৃত্তি করলে বাতিল হতে পারে",
      ],
      answer: 3,
      explanation:
        "Adobe's best practice for differentiated submissions is to diversify metadata: adjust it for the unique attributes of each submission, because repeating the same titles and keywords can lead to refusal.",
      explanationBn:
        "স্বতন্ত্র জমার জন্য অ্যাডোবির সেরা অনুশীলন হলো মেটাডেটা বৈচিত্র্যময় করা: প্রতিটি জমার অনন্য বৈশিষ্ট্য অনুযায়ী তা সমন্বয় করুন, কারণ একই টাইটেল ও কীওয়ার্ড পুনরাবৃত্তি করলে বাতিল হতে পারে।",
    },
    {
      id: "L21-Q27",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "Which of these is NOT a variation Adobe lists to avoid?",
      qBn: "নিচের কোনটি অ্যাডোবির এড়ানোর তালিকায় থাকা ভিন্নতা নয়?",
      options: [
        "A new composition with different objects and a different mood",
        "Flipped images",
        "Various crops of the same photo",
        "Different background colors on the same design",
      ],
      optionsBn: [
        "ভিন্ন বস্তু ও ভিন্ন মেজাজসহ নতুন কম্পোজিশন",
        "ফ্লিপ করা ছবি",
        "একই ছবির বিভিন্ন ক্রপ",
        "একই ডিজাইনে ভিন্ন ব্যাকগ্রাউন্ড রঙ",
      ],
      answer: 0,
      explanation:
        "Adobe lists flipped images, various crops, different exposures, different background colors and different filters as variations to avoid. A new composition with different objects and mood is exactly the kind of variation Adobe wants.",
      explanationBn:
        "অ্যাডোবি ফ্লিপ করা ছবি, বিভিন্ন ক্রপ, ভিন্ন এক্সপোজার, ভিন্ন ব্যাকগ্রাউন্ড রঙ ও ভিন্ন ফিল্টারকে এড়ানোর মতো ভিন্নতা হিসেবে তালিকাভুক্ত করে। ভিন্ন বস্তু ও মেজাজসহ নতুন কম্পোজিশন ঠিক সেই ধরনের ভিন্নতা যা অ্যাডোবি চায়।",
    },
    {
      id: "L21-Q28",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "You add a popular trending keyword that has nothing to do with your photo. Which rule does that break?",
      qBn: "আপনি আপনার ছবির সাথে সম্পর্কহীন একটি জনপ্রিয় ট্রেন্ডিং কীওয়ার্ড যোগ করলেন। এটি কোন নিয়ম ভঙ্গ করে?",
      options: [
        "The 49-keyword limit",
        "The title length rule",
        "The rule against stuffing unrelated trending terms into titles or keywords",
        "The model release rule",
      ],
      optionsBn: [
        "৪৯টি কীওয়ার্ডের সীমা",
        "টাইটেল দৈর্ঘ্যের নিয়ম",
        "টাইটেল বা কীওয়ার্ডে অপ্রাসঙ্গিক ট্রেন্ডিং শব্দ ঠাসার বিরুদ্ধে নিয়ম",
        "মডেল রিলিজ নিয়ম",
      ],
      answer: 2,
      explanation:
        "Adobe's spam policy says not to stuff unrelated trending terms into titles or keywords. Irrelevant keywords mislead buyers and can lead to rejection — and repeat offenders may have their accounts blocked.",
      explanationBn:
        "অ্যাডোবির স্প্যাম নীতিতে বলা আছে টাইটেল বা কীওয়ার্ডে অপ্রাসঙ্গিক ট্রেন্ডিং শব্দ ঠাসা যাবে না। অপ্রাসঙ্গিক কীওয়ার্ড ক্রেতাদের বিভ্রান্ত করে এবং বাতিলের কারণ হতে পারে — আর বারবার এমন করলে অ্যাকাউন্ট ব্লক হতে পারে।",
    },
    {
      id: "L21-Q29",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "A contributor submits 30 versions of one sunset, each with a slightly different filter. What is the most likely outcome?",
      qBn: "একজন কন্ট্রিবিউটর একটি সূর্যাস্তের ৩০টি সংস্করণ জমা দিলেন, প্রতিটিতে সামান্য ভিন্ন ফিল্টার। সবচেয়ে সম্ভাব্য ফলাফল কী?",
      options: [
        "All 30 are accepted as a sunset collection",
        "Refusal for similar content, and possible account blocking for spam",
        "All 30 are accepted because filters change the image",
        "The best 3 are accepted automatically and the rest ignored",
      ],
      optionsBn: [
        "৩০টিই সূর্যাস্ত সংগ্রহ হিসেবে গৃহীত হবে",
        "অনুরূপ কনটেন্টের কারণে বাতিল, এবং স্প্যামের জন্য অ্যাকাউন্ট ব্লকের সম্ভাবনা",
        "৩০টিই গৃহীত হবে কারণ ফিল্টার ছবি বদলে দেয়",
        "সেরা ৩টি স্বয়ংক্রিয়ভাবে গৃহীত হবে এবং বাকিগুলো উপেক্ষা করা হবে",
      ],
      answer: 1,
      explanation:
        "Different image filters are explicitly listed as a variation to avoid, and submitting many near-identical versions is spam. Similar content is a top refusal reason, and mass duplication can get an account blocked.",
      explanationBn:
        "ভিন্ন ছবির ফিল্টার স্পষ্টভাবে এড়ানোর মতো ভিন্নতা হিসেবে তালিকাভুক্ত, এবং অনেক প্রায়-অভিন্ন সংস্করণ জমা দেওয়া স্প্যাম। অনুরূপ কনটেন্ট বাতিলের শীর্ষ কারণগুলোর একটি, এবং ব্যাপক ডুপ্লিকেশনে অ্যাকাউন্ট ব্লক হতে পারে।",
    },
    {
      id: "L21-Q30",
      topic: "Similar Content",
      topicBn: "অনুরূপ কনটেন্ট",
      q: "What is Adobe's core advice for balancing quantity and quality in your portfolio?",
      qBn: "আপনার পোর্টফোলিওতে পরিমাণ ও মানের ভারসাম্য রাখতে অ্যাডোবির মূল পরামর্শ কী?",
      options: [
        "Upload as much as possible, as fast as possible",
        "Upload only one asset per month",
        "Submit varied, thoughtfully curated content and avoid submissions that are too similar",
        "Upload the same asset in every format available",
      ],
      optionsBn: [
        "যতটা সম্ভব, যত দ্রুত সম্ভব আপলোড করুন",
        "মাসে শুধু একটি অ্যাসেট আপলোড করুন",
        "বৈচিত্র্যময়, চিন্তাভাবনা করে বাছাই করা কনটেন্ট জমা দিন এবং অতিরিক্ত মিল থাকা জমা এড়িয়ে চলুন",
        "একই অ্যাসেট সব ফরম্যাটে আপলোড করুন",
      ],
      answer: 2,
      explanation:
        "Adobe encourages contributors to submit content that is varied and thoughtfully curated while avoiding submissions that are too similar — quality and discoverability matter more than raw volume.",
      explanationBn:
        "অ্যাডোবি কন্ট্রিবিউটরদের উৎসাহ দেয় বৈচিত্র্যময় ও চিন্তাভাবনা করে বাছাই করা কনটেন্ট জমা দিতে এবং অতিরিক্ত মিল থাকা জমা এড়িয়ে চলতে — কাঁচা পরিমাণের চেয়ে মান ও খুঁজে পাওয়ার যোগ্যতা বেশি গুরুত্বপূর্ণ।",
    },
  ],
  22: [
    {
      id: "L22-Q01",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A magazine plans to print 400,000 copies using your image. Which license covers that?",
      qBn: "একটি ম্যাগাজিন আপনার ছবি ব্যবহার করে ৪,০০,০০০ কপি ছাপার পরিকল্পনা করছে। কোন লাইসেন্স তা কভার করে?",
      options: [
        "Only an Editorial license",
        "No license — print use is never allowed",
        "Only an Extended License",
        "A Standard License — it covers print runs up to 500,000 copies",
      ],
      optionsBn: [
        "শুধু এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — ছাপার ব্যবহার কখনোই অনুমোদিত নয়",
        "শুধু এক্সটেন্ডেড লাইসেন্স",
        "স্ট্যান্ডার্ড লাইসেন্স — এটি ৫,০০,০০০ কপি পর্যন্ত প্রিন্ট রান কভার করে",
      ],
      answer: 3,
      explanation:
        "The Standard License covers print runs up to 500,000 copies. A 400,000-copy run fits comfortably inside that limit.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স ৫,০০,০০০ কপি পর্যন্ত প্রিন্ট রান কভার করে। ৪,০০,০০০ কপির রান সেই সীমার মধ্যে পড়ে।",
    },
    {
      id: "L22-Q02",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A publisher plans to print 600,000 copies of a book with your image on the cover. What is needed?",
      qBn: "একজন প্রকাশক আপনার ছবি প্রচ্ছদে দিয়ে একটি বইয়ের ৬,০০,০০০ কপি ছাপার পরিকল্পনা করছেন। কী দরকার?",
      options: [
        "An Enhanced or Extended License — the Standard License stops at 500,000 copies",
        "A Standard License — print runs have no limit",
        "Two Standard Licenses",
        "An Editorial license",
      ],
      optionsBn: [
        "এনহ্যান্সড বা এক্সটেন্ডেড লাইসেন্স — স্ট্যান্ডার্ড লাইসেন্স ৫,০০,০০০ কপিতে থামে",
        "স্ট্যান্ডার্ড লাইসেন্স — প্রিন্ট রানের কোনো সীমা নেই",
        "দুটি স্ট্যান্ডার্ড লাইসেন্স",
        "এডিটোরিয়াল লাইসেন্স",
      ],
      answer: 0,
      explanation:
        "The Standard License caps printed materials at 500,000 copies in total. A 600,000-copy run needs a license without that cap — Enhanced or Extended.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স ছাপানো উপকরণ মোট ৫,০০,০০০ কপিতে সীমাবদ্ধ করে। ৬,০০,০০০ কপির রানের জন্য সেই সীমা ছাড়া লাইসেন্স দরকার — এনহ্যান্সড বা এক্সটেন্ডেড।",
    },
    {
      id: "L22-Q03",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A TV commercial using your image is expected to reach 800,000 viewers. Which license is needed?",
      qBn: "আপনার ছবি ব্যবহার করা একটি টিভি বিজ্ঞাপন ৮,০০,০০০ দর্শকের কাছে পৌঁছাবে বলে আশা করা হচ্ছে। কোন লাইসেন্স দরকার?",
      options: [
        "A Standard License — broadcast has no viewer limit",
        "A Standard License — the limit is 1,000,000 viewers",
        "An Editorial license",
        "An Enhanced or Extended License — Standard caps broadcast and digital-production audiences at 500,000 viewers",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স — সম্প্রচারে দর্শকের কোনো সীমা নেই",
        "স্ট্যান্ডার্ড লাইসেন্স — সীমা ১০,০০,০০০ দর্শক",
        "এডিটোরিয়াল লাইসেন্স",
        "এনহ্যান্সড বা এক্সটেন্ডেড লাইসেন্স — স্ট্যান্ডার্ড সম্প্রচার ও ডিজিটাল প্রোডাকশনের দর্শক ৫,০০,০০০-এ সীমাবদ্ধ করে",
      ],
      answer: 3,
      explanation:
        "The Standard License also caps the audience of a performance, broadcast or digital production at 500,000 expected viewers. An 800,000-viewer broadcast needs an Enhanced or Extended License.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স পারফরম্যান্স, সম্প্রচার বা ডিজিটাল প্রোডাকশনের দর্শকও ৫,০০,০০০-এ সীমাবদ্ধ করে। ৮,০০,০০০ দর্শকের সম্প্রচারের জন্য এনহ্যান্সড বা এক্সটেন্ডেড লাইসেন্স দরকার।",
    },
    {
      id: "L22-Q04",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "The same image is used in a website banner that 2 million people see. Which license covers that?",
      qBn: "একই ছবি একটি ওয়েবসাইট ব্যানারে ব্যবহার করা হয়েছে, যা ২০ লাখ মানুষ দেখেছেন। কোন লাইসেন্স তা কভার করে?",
      options: [
        "An Extended License — 2 million views exceeds every limit",
        "A Standard License — the 500,000-viewer cap does not apply to websites, social media or mobile apps",
        "An Editorial license",
        "No license covers more than 500,000 views anywhere",
      ],
      optionsBn: [
        "এক্সটেন্ডেড লাইসেন্স — ২০ লাখ ভিউ প্রতিটি সীমা ছাড়িয়ে যায়",
        "স্ট্যান্ডার্ড লাইসেন্স — ৫,০০,০০০ দর্শকের সীমা ওয়েবসাইট, সোশ্যাল মিডিয়া বা মোবাইল অ্যাপে প্রযোজ্য নয়",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্সই কোথাও ৫,০০,০০০ ভিউয়ের বেশি কভার করে না",
      ],
      answer: 1,
      explanation:
        "The 500,000-viewer restriction does not apply to works displayed on websites, social media sites or mobile applications. A Standard License covers unlimited website and social views.",
      explanationBn:
        "৫,০০,০০০ দর্শকের বিধিনিষেধ ওয়েবসাইট, সোশ্যাল মিডিয়া সাইট বা মোবাইল অ্যাপ্লিকেশনে প্রদর্শিত কাজের ক্ষেত্রে প্রযোজ্য নয়। স্ট্যান্ডার্ড লাইসেন্স ওয়েবসাইট ও সোশ্যালের সীমাহীন ভিউ কভার করে।",
    },
    {
      id: "L22-Q05",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer wants to print your unmodified image on T-shirts and sell them. Which license is needed?",
      qBn: "একজন ক্রেতা আপনার অপরিবর্তিত ছবি টি-শার্টে ছাপিয়ে বিক্রি করতে চান। কোন লাইসেন্স দরকার?",
      options: [
        "An Editorial license",
        "A Standard License — T-shirts are promotional items",
        "A Standard License — as long as fewer than 500,000 shirts are printed",
        "An Extended License — merchandise for resale requires it",
      ],
      optionsBn: [
        "এডিটোরিয়াল লাইসেন্স",
        "স্ট্যান্ডার্ড লাইসেন্স — টি-শার্ট প্রচারণামূলক পণ্য",
        "স্ট্যান্ডার্ড লাইসেন্স — ৫,০০,০০০-এর কম শার্ট ছাপা হলে",
        "এক্সটেন্ডেড লাইসেন্স — পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজে এটি দরকার",
      ],
      answer: 3,
      explanation:
        "The Standard License forbids incorporating a work into merchandise intended for sale or distribution. Selling T-shirts printed with the image requires an Extended License.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স বিক্রি বা বিতরণের জন্য তৈরি মার্চেন্ডাইজে কাজ অন্তর্ভুক্ত করা নিষিদ্ধ করে। ছবি ছাপিয়ে টি-শার্ট বিক্রি করতে এক্সটেন্ডেড লাইসেন্স দরকার।",
    },
    {
      id: "L22-Q06",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer prints your unmodified image as a poster and sells the posters. Which license is needed?",
      qBn: "একজন ক্রেতা আপনার অপরিবর্তিত ছবি পোস্টার হিসেবে ছাপিয়ে পোস্টারগুলো বিক্রি করেন। কোন লাইসেন্স দরকার?",
      options: [
        "An Extended License — producing an unmodified work on a poster for resale is not permitted under Standard",
        "A Standard License — posters are decoration",
        "A Standard License — as long as the run is under 500,000",
        "An Editorial license",
      ],
      optionsBn: [
        "এক্সটেন্ডেড লাইসেন্স — পুনঃবিক্রয়ের জন্য পোস্টারে অপরিবর্তিত কাজ তৈরি করা স্ট্যান্ডার্ডে অনুমোদিত নয়",
        "স্ট্যান্ডার্ড লাইসেন্স — পোস্টার সাজসজ্জা",
        "স্ট্যান্ডার্ড লাইসেন্স — রান ৫,০০,০০০-এর কম হলে",
        "এডিটোরিয়াল লাইসেন্স",
      ],
      answer: 0,
      explanation:
        "Adobe's terms are explicit: producing an unmodified work on a poster intended for resale is not permitted under Standard, because the primary value of the item lies in the work itself. An Extended License is required.",
      explanationBn:
        "অ্যাডোবির শর্তাবলীতে স্পষ্ট: পুনঃবিক্রয়ের জন্য পোস্টারে অপরিবর্তিত কাজ তৈরি করা স্ট্যান্ডার্ডে অনুমোদিত নয়, কারণ পণ্যটির প্রধান মূল্য কাজটির মধ্যেই নিহিত। এক্সটেন্ডেড লাইসেন্স দরকার।",
    },
    {
      id: "L22-Q07",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer wants your image on mugs, phone cases and a print-on-demand service. Which license is needed?",
      qBn: "একজন ক্রেতা আপনার ছবি মগ, ফোন কেস ও প্রিন্ট-অন-ডিমান্ড সেবায় ব্যবহার করতে চান। কোন লাইসেন্স দরকার?",
      options: [
        "A Standard License — these are personal uses",
        "A Standard License — as long as the items are not resold",
        "An Editorial license",
        "An Extended License — goods for resale and print-on-demand services require it",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স — এগুলো ব্যক্তিগত ব্যবহার",
        "স্ট্যান্ডার্ড লাইসেন্স — পণ্যগুলো পুনঃবিক্রি না হলে",
        "এডিটোরিয়াল লাইসেন্স",
        "এক্সটেন্ডেড লাইসেন্স — পুনঃবিক্রয়ের জন্য পণ্য ও প্রিন্ট-অন-ডিমান্ড সেবায় এটি দরকার",
      ],
      answer: 3,
      explanation:
        "The Extended License covers any goods or services intended for resale or distribution — such as mugs, T-shirts, posters, greeting cards and print-on-demand services.",
      explanationBn:
        "এক্সটেন্ডেড লাইসেন্স পুনঃবিক্রয় বা বিতরণের জন্য তৈরি যেকোনো পণ্য বা সেবা কভার করে — যেমন মগ, টি-শার্ট, পোস্টার, গ্রিটিং কার্ড ও প্রিন্ট-অন-ডিমান্ড সেবা।",
    },
    {
      id: "L22-Q08",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A designer sells website templates with your image embedded in them. Which license is needed?",
      qBn: "একজন ডিজাইনার আপনার ছবি এমবেড করে ওয়েবসাইট টেমপ্লেট বিক্রি করেন। কোন লাইসেন্স দরকার?",
      options: [
        "A Standard License — templates are digital productions",
        "An Extended License — electronic templates intended for resale require it",
        "An Editorial license",
        "No license — templates are exempt",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স — টেমপ্লেট ডিজিটাল প্রোডাকশন",
        "এক্সটেন্ডেড লাইসেন্স — পুনঃবিক্রয়ের জন্য তৈরি ইলেকট্রনিক টেমপ্লেটে এটি দরকার",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — টেমপ্লেট ছাড় পায়",
      ],
      answer: 1,
      explanation:
        "The Standard License forbids using a work in any electronic template or design template application intended for resale — such as web design or presentation templates. The Extended License allows it.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স পুনঃবিক্রয়ের জন্য তৈরি কোনো ইলেকট্রনিক টেমপ্লেট বা ডিজাইন টেমপ্লেট অ্যাপ্লিকেশনে — যেমন ওয়েব ডিজাইন বা প্রেজেন্টেশন টেমপ্লেট — কাজ ব্যবহার করা নিষিদ্ধ করে। এক্সটেন্ডেড লাইসেন্স এটি অনুমোদন করে।",
    },
    {
      id: "L22-Q09",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A company wants to include the stand-alone image file in a press release sent to the media. Which license is needed?",
      qBn: "একটি কোম্পানি মিডিয়ায় পাঠানো প্রেস রিলিজে স্বতন্ত্র ছবির ফাইলটি অন্তর্ভুক্ত করতে চায়। কোন লাইসেন্স দরকার?",
      options: [
        "A Standard License — press releases are promotional",
        "A Standard License — as long as the file is small",
        "An Extended License — distributing the stand-alone file with a press release requires it",
        "An Editorial license",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স — প্রেস রিলিজ প্রচারণামূলক",
        "স্ট্যান্ডার্ড লাইসেন্স — ফাইলটি ছোট হলে",
        "এক্সটেন্ডেড লাইসেন্স — প্রেস রিলিজের সাথে স্বতন্ত্র ফাইল বিতরণে এটি দরকার",
        "এডিটোরিয়াল লাইসেন্স",
      ],
      answer: 2,
      explanation:
        "The Standard License forbids using the work with a press release that distributes the stand-alone image file to the media. The Extended License permits it, provided the image is only published in connection with the press release.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স মিডিয়ায় স্বতন্ত্র ছবির ফাইল বিতরণ করা হয় এমন প্রেস রিলিজের সাথে কাজ ব্যবহার করা নিষিদ্ধ করে। এক্সটেন্ডেড লাইসেন্স এটি অনুমোদন করে, শর্ত থাকে ছবিটি শুধু প্রেস রিলিজের সাথে প্রকাশিত হয়।",
    },
    {
      id: "L22-Q10",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A blogger uses your image in a blog post. Which license covers that?",
      qBn: "একজন ব্লগার আপনার ছবি একটি ব্লগ পোস্টে ব্যবহার করেছেন। কোন লাইসেন্স তা কভার করে?",
      options: [
        "A Standard License — blogs are digital productions",
        "An Extended License — blogs need the highest license",
        "An Editorial license",
        "No license — blogs are free to use any image",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স — ব্লগ ডিজিটাল প্রোডাকশন",
        "এক্সটেন্ডেড লাইসেন্স — ব্লগে সর্বোচ্চ লাইসেন্স দরকার",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — ব্লগে যেকোনো ছবি বিনামূল্যে ব্যবহার করা যায়",
      ],
      answer: 0,
      explanation:
        "The Standard License covers digital productions such as websites, blogs, e-books, e-magazines and mobile advertising. A blog post is a classic Standard License use.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স ওয়েবসাইট, ব্লগ, ই-বুক, ই-ম্যাগাজিন ও মোবাইল বিজ্ঞাপনের মতো ডিজিটাল প্রোডাকশন কভার করে। ব্লগ পোস্ট স্ট্যান্ডার্ড লাইসেন্সের একটি ক্লাসিক ব্যবহার।",
    },
    {
      id: "L22-Q11",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A company uses your image in an internal presentation shown only to its own employees. Which license covers that?",
      qBn: "একটি কোম্পানি আপনার ছবি শুধু নিজের কর্মীদের দেখানো একটি অভ্যন্তরীণ প্রেজেন্টেশনে ব্যবহার করেছে। কোন লাইসেন্স তা কভার করে?",
      options: [
        "No license — internal use is free",
        "An Extended License — presentations need it",
        "An Editorial license",
        "A Standard License — internal presentations are covered",
      ],
      optionsBn: [
        "কোনো লাইসেন্স নয় — অভ্যন্তরীণ ব্যবহার বিনামূল্যে",
        "এক্সটেন্ডেড লাইসেন্স — প্রেজেন্টেশনে এটি দরকার",
        "এডিটোরিয়াল লাইসেন্স",
        "স্ট্যান্ডার্ড লাইসেন্স — অভ্যন্তরীণ প্রেজেন্টেশন কভার করা হয়",
      ],
      answer: 3,
      explanation:
        "The Standard License expressly allows distributing internal presentations and marketing or promotional materials. Internal use still needs a license — it is just a Standard one.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স অভ্যন্তরীণ প্রেজেন্টেশন এবং মার্কেটিং বা প্রচারণামূলক উপকরণ বিতরণের স্পষ্ট অনুমতি দেয়। অভ্যন্তরীণ ব্যবহারেও লাইসেন্স দরকার — তবে তা স্ট্যান্ডার্ড লাইসেন্স।",
    },
    {
      id: "L22-Q12",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer uses your image in a social media advertisement. Which license covers that?",
      qBn: "একজন ক্রেতা আপনার ছবি একটি সোশ্যাল মিডিয়া বিজ্ঞাপনে ব্যবহার করেছেন। কোন লাইসেন্স তা কভার করে?",
      options: [
        "An Extended License — advertising needs it",
        "A Standard License — advertising, marketing and promotion are Standard uses",
        "An Editorial license",
        "No license — social media use is free",
      ],
      optionsBn: [
        "এক্সটেন্ডেড লাইসেন্স — বিজ্ঞাপনে এটি দরকার",
        "স্ট্যান্ডার্ড লাইসেন্স — বিজ্ঞাপন, মার্কেটিং ও প্রচারণা স্ট্যান্ডার্ড ব্যবহার",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — সোশ্যাল মিডিয়া ব্যবহার বিনামূল্যে",
      ],
      answer: 1,
      explanation:
        "The Standard License covers advertising, marketing, promotional and decoration purposes, including social media. No upgrade is needed for a social ad.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স সোশ্যাল মিডিয়াসহ বিজ্ঞাপন, মার্কেটিং, প্রচারণা ও সাজসজ্জার উদ্দেশ্য কভার করে। সোশ্যাল বিজ্ঞাপনের জন্য আপগ্রেড দরকার হয় না।",
    },
    {
      id: "L22-Q13",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "Under a Standard License, may the buyer crop the image and adjust its colors?",
      qBn: "স্ট্যান্ডার্ড লাইসেন্সের অধীনে ক্রেতা কি ছবিটি ক্রপ করতে এবং এর রং সমন্বয় করতে পারবেন?",
      options: [
        "No — the image must be used exactly as downloaded",
        "No — only Extended licenses allow modifications",
        "Yes — the Standard License allows the buyer to use, reproduce, archive, modify and display the work",
        "Yes — but only for personal use",
      ],
      optionsBn: [
        "না — ছবিটি ঠিক যেমন ডাউনলোড করা হয়েছে তেমনই ব্যবহার করতে হবে",
        "না — শুধু এক্সটেন্ডেড লাইসেন্সেই পরিবর্তন অনুমোদিত",
        "হ্যাঁ — স্ট্যান্ডার্ড লাইসেন্স ক্রেতাকে কাজটি ব্যবহার, পুনরুৎপাদন, সংরক্ষণ, পরিবর্তন ও প্রদর্শনের অনুমতি দেয়",
        "হ্যাঁ — তবে শুধু ব্যক্তিগত ব্যবহারের জন্য",
      ],
      answer: 2,
      explanation:
        "The Standard License grants the right to use, reproduce, archive, modify and display the work. Cropping and color adjustments are normal modifications — what the license forbids is resale, templates and stand-alone redistribution.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স কাজটি ব্যবহার, পুনরুৎপাদন, সংরক্ষণ, পরিবর্তন ও প্রদর্শনের অধিকার দেয়। ক্রপ ও রঙের সমন্বয় স্বাভাবিক পরিবর্তন — লাইসেন্স যা নিষিদ্ধ করে তা হলো পুনঃবিক্রয়, টেমপ্লেট ও স্বতন্ত্র পুনঃবিতরণ।",
    },
    {
      id: "L22-Q14",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer downloads your image and then resells the raw file itself as a stock photo download. Is that allowed under any license?",
      qBn: "একজন ক্রেতা আপনার ছবি ডাউনলোড করে কাঁচা ফাইলটি নিজেই স্টক ছবি ডাউনলোড হিসেবে পুনঃবিক্রি করলেন। কোনো লাইসেন্সে কি এটি অনুমোদিত?",
      options: [
        "No — no license allows selling, licensing or distributing the work as a stand-alone file",
        "Yes — under an Extended License",
        "Yes — under an Enhanced License",
        "Yes — under a Standard License if fewer than 500,000 copies are sold",
      ],
      optionsBn: [
        "না — কোনো লাইসেন্সেই কাজটি স্বতন্ত্র ফাইল হিসেবে বিক্রি, লাইসেন্স বা বিতরণের অনুমতি নেই",
        "হ্যাঁ — এক্সটেন্ডেড লাইসেন্সে",
        "হ্যাঁ — এনহ্যান্সড লাইসেন্সে",
        "হ্যাঁ — ৫,০০,০০০-এর কম কপি বিক্রি হলে স্ট্যান্ডার্ড লাইসেন্সে",
      ],
      answer: 0,
      explanation:
        "All Adobe Stock licenses forbid selling, licensing, sharing or distributing the work as a stand-alone file, or in a database that lets others extract it. The Extended License allows resale of products containing the work — never the raw file itself.",
      explanationBn:
        "সব অ্যাডোবি স্টক লাইসেন্স কাজটি স্বতন্ত্র ফাইল হিসেবে বিক্রি, লাইসেন্স, শেয়ার বা বিতরণ, বা অন্যদের তা বের করতে দেয় এমন ডাটাবেজে রাখা নিষিদ্ধ করে। এক্সটেন্ডেড লাইসেন্স কাজটি থাকা পণ্যের পুনঃবিক্রয়ের অনুমতি দেয় — কাঁচা ফাইলের নয়।",
    },
    {
      id: "L22-Q15",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer uses an “Editorial use only” image in a paid advertisement. What happens?",
      qBn: "একজন ক্রেতা “Editorial use only” ছবি একটি অর্থপ্রদানকারী বিজ্ঞাপনে ব্যবহার করলেন। কী হবে?",
      options: [
        "It is allowed — editorial images can be used in ads",
        "It is allowed if the buyer has an Extended License",
        "It is allowed if the buyer credits the photographer",
        "It is not allowed — editorial assets may not be used for commercial purposes, even with an Enhanced license",
      ],
      optionsBn: [
        "এটি অনুমোদিত — এডিটোরিয়াল ছবি বিজ্ঞাপনে ব্যবহার করা যায়",
        "ক্রেতার এক্সটেন্ডেড লাইসেন্স থাকলে অনুমোদিত",
        "ক্রেতা ফটোগ্রাফারের নাম উল্লেখ করলে অনুমোদিত",
        "এটি অনুমোদিত নয় — এনহ্যান্সড লাইসেন্স থাকলেও এডিটোরিয়াল অ্যাসেট বাণিজ্যিক উদ্দেশ্যে ব্যবহার করা যাবে না",
      ],
      answer: 3,
      explanation:
        "Editorial assets are for editorial use only and may not be used for commercial purposes such as advertisements, promotions, advertorials or merchandise — even if the buyer has an Enhanced license for them.",
      explanationBn:
        "এডিটোরিয়াল অ্যাসেট শুধু এডিটোরিয়াল ব্যবহারের জন্য এবং বিজ্ঞাপন, প্রচারণা, বিজ্ঞাপনধর্মী লেখা বা মার্চেন্ডাইজের মতো বাণিজ্যিক উদ্দেশ্যে ব্যবহার করা যাবে না — ক্রেতার এনহ্যান্সড লাইসেন্স থাকলেও নয়।",
    },
    {
      id: "L22-Q16",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "Where CAN an “Editorial use only” image be used?",
      qBn: "“Editorial use only” ছবি কোথায় ব্যবহার করা যাবে?",
      options: [
        "In a paid product advertisement",
        "On merchandise for sale",
        "In a newspaper or magazine article, news blog or similar newsworthy context",
        "In a company logo",
      ],
      optionsBn: [
        "অর্থপ্রদানকারী পণ্য বিজ্ঞাপনে",
        "বিক্রির জন্য মার্চেন্ডাইজে",
        "সংবাদপত্র বা ম্যাগাজিনের নিবন্ধ, নিউজ ব্লগ বা অনুরূপ সংবাদমূল্য প্রেক্ষাপটে",
        "কোম্পানির লোগোতে",
      ],
      answer: 1,
      explanation:
        "Editorial assets may be used in any context that is newsworthy or of cultural interest — typically newspaper or magazine articles, news blogs or similar event-based media. Advertising, promotion and merchandise are all forbidden.",
      explanationBn:
        "এডিটোরিয়াল অ্যাসেট সংবাদমূল্য বা সাংস্কৃতিক আগ্রহের যেকোনো প্রেক্ষাপটে ব্যবহার করা যায় — সাধারণত সংবাদপত্র বা ম্যাগাজিনের নিবন্ধ, নিউজ ব্লগ বা অনুরূপ ঘটনাভিত্তিক মিডিয়ায়। বিজ্ঞাপন, প্রচারণা ও মার্চেন্ডাইজ সবই নিষিদ্ধ।",
    },
    {
      id: "L22-Q17",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "What is the difference between the Standard License and the Enhanced License?",
      qBn: "স্ট্যান্ডার্ড লাইসেন্স ও এনহ্যান্সড লাইসেন্সের মধ্যে পার্থক্য কী?",
      options: [
        "Enhanced allows merchandise for resale; Standard does not",
        "Enhanced is only for videos; Standard is only for photos",
        "Enhanced gives the same rights as Standard but without the 500,000-copy/viewer limitation",
        "Enhanced transfers the copyright to the buyer",
      ],
      optionsBn: [
        "এনহ্যান্সড পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজ অনুমোদন করে; স্ট্যান্ডার্ড করে না",
        "এনহ্যান্সড শুধু ভিডিওর জন্য; স্ট্যান্ডার্ড শুধু ছবির জন্য",
        "এনহ্যান্সড স্ট্যান্ডার্ডের মতো একই অধিকার দেয় তবে ৫,০০,০০০ কপি/দর্শকের সীমা ছাড়া",
        "এনহ্যান্সড কপিরাইট ক্রেতার কাছে হস্তান্তর করে",
      ],
      answer: 2,
      explanation:
        "The Enhanced License grants the same rights as the Standard License, but without the 500,000 limitation — unlimited copies and viewers. Merchandise for resale still needs the Extended License, and no license transfers copyright.",
      explanationBn:
        "এনহ্যান্সড লাইসেন্স স্ট্যান্ডার্ড লাইসেন্সের মতো একই অধিকার দেয়, তবে ৫,০০,০০০-এর সীমা ছাড়া — সীমাহীন কপি ও দর্শক। পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজে তবুও এক্সটেন্ডেড লাইসেন্স দরকার, এবং কোনো লাইসেন্সই কপিরাইট হস্তান্তর করে না।",
    },
    {
      id: "L22-Q18",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "What does the Extended License add on top of the Enhanced License?",
      qBn: "এনহ্যান্সড লাইসেন্সের ওপরে এক্সটেন্ডেড লাইসেন্স কী যোগ করে?",
      options: [
        "It removes the 500,000-copy limit",
        "It allows unlimited website views",
        "It allows merchandise for resale, templates for resale, and press releases with the stand-alone file",
        "It makes the license exclusive to one buyer",
      ],
      optionsBn: [
        "এটি ৫,০০,০০০ কপির সীমা সরিয়ে দেয়",
        "এটি সীমাহীন ওয়েবসাইট ভিউ অনুমোদন করে",
        "এটি পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজ, পুনঃবিক্রয়ের জন্য টেমপ্লেট ও স্বতন্ত্র ফাইলসহ প্রেস রিলিজ অনুমোদন করে",
        "এটি লাইসেন্সটিকে একজন ক্রেতার জন্য একচেটিয়া করে",
      ],
      answer: 2,
      explanation:
        "The Enhanced License already removes the 500,000 limit. The Extended License adds resale rights on top: merchandise, electronic templates for resale, and press releases that distribute the stand-alone file.",
      explanationBn:
        "এনহ্যান্সড লাইসেন্স ইতিমধ্যে ৫,০০,০০০-এর সীমা সরিয়ে দেয়। এক্সটেন্ডেড লাইসেন্স তার ওপরে পুনঃবিক্রয়ের অধিকার যোগ করে: মার্চেন্ডাইজ, পুনঃবিক্রয়ের জন্য ইলেকট্রনিক টেমপ্লেট ও স্বতন্ত্র ফাইল বিতরণ করা প্রেস রিলিজ।",
    },
    {
      id: "L22-Q19",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer needs unlimited print runs but will NOT use the image on merchandise or templates. Which license is enough?",
      qBn: "একজন ক্রেতার সীমাহীন প্রিন্ট রান দরকার, কিন্তু ছবিটি মার্চেন্ডাইজ বা টেমপ্লেটে ব্যবহার করবেন না। কোন লাইসেন্স যথেষ্ট?",
      options: [
        "A Standard License",
        "An Enhanced License — it removes the 500,000 limit without adding resale rights",
        "An Editorial license",
        "No license — unlimited printing is never allowed",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স",
        "এনহ্যান্সড লাইসেন্স — এটি পুনঃবিক্রয়ের অধিকার না যোগ করে ৫,০০,০০০-এর সীমা সরিয়ে দেয়",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — সীমাহীন ছাপা কখনোই অনুমোদিত নয়",
      ],
      answer: 1,
      explanation:
        "The Enhanced License is exactly the Standard License without the 500,000 limitation. If no merchandise or template resale is involved, Enhanced is enough — Extended is only needed for resale rights.",
      explanationBn:
        "এনহ্যান্সড লাইসেন্স ঠিক স্ট্যান্ডার্ড লাইসেন্সই, ৫,০০,০০০-এর সীমা ছাড়া। মার্চেন্ডাইজ বা টেমপ্লেট পুনঃবিক্রয় জড়িত না থাকলে এনহ্যান্সডই যথেষ্ট — পুনঃবিক্রয়ের অধিকারের জন্যই শুধু এক্সটেন্ডেড দরকার।",
    },
    {
      id: "L22-Q20",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer wants to print 1,000,000 brochures AND sell T-shirts with the image. Which license is needed?",
      qBn: "একজন ক্রেতা ১০,০০,০০০টি ব্রোশিওর ছাপাতে এবং ছবিসহ টি-শার্ট বিক্রি করতে চান। কোন লাইসেন্স দরকার?",
      options: [
        "A Standard License",
        "An Enhanced License — it covers unlimited printing",
        "An Extended License — it covers unlimited printing AND merchandise for resale",
        "An Editorial license",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স",
        "এনহ্যান্সড লাইসেন্স — এটি সীমাহীন ছাপা কভার করে",
        "এক্সটেন্ডেড লাইসেন্স — এটি সীমাহীন ছাপা এবং পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজ উভয়ই কভার করে",
        "এডিটোরিয়াল লাইসেন্স",
      ],
      answer: 2,
      explanation:
        "Enhanced alone would cover the 1,000,000 brochures but not the T-shirts for sale. Only the Extended License covers both unlimited printing and merchandise for resale.",
      explanationBn:
        "শুধু এনহ্যান্সড ১০,০০,০০০ ব্রোশিওর কভার করত, কিন্তু বিক্রির জন্য টি-শার্ট নয়। শুধু এক্সটেন্ডেড লাইসেন্সই সীমাহীন ছাপা ও পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজ উভয়ই কভার করে।",
    },
    {
      id: "L22-Q21",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "Adobe Stock licenses are non-exclusive. What does that mean for a buyer?",
      qBn: "অ্যাডোবি স্টক লাইসেন্স অ-একচেটিয়া। ক্রেতার জন্য এর অর্থ কী?",
      options: [
        "The buyer owns the image outright",
        "The same image can be licensed to other buyers too — the buyer gets no exclusivity",
        "The buyer may not show the image to anyone",
        "The license expires after one use",
      ],
      optionsBn: [
        "ক্রেতা ছবিটির সম্পূর্ণ মালিক হন",
        "একই ছবি অন্য ক্রেতাদেরও লাইসেন্স দেওয়া যেতে পারে — ক্রেতা কোনো একচেটিয়া অধিকার পান না",
        "ক্রেতা ছবিটি কাউকে দেখাতে পারবেন না",
        "লাইসেন্স একবার ব্যবহারের পর মেয়াদ শেষ হয়",
      ],
      answer: 1,
      explanation:
        "A non-exclusive license is permission to use the work — not ownership, and not exclusivity. The same image remains available for other buyers to license.",
      explanationBn:
        "অ-একচেটিয়া লাইসেন্স হলো কাজটি ব্যবহারের অনুমতি — মালিকানা নয়, একচেটিয়া অধিকারও নয়। একই ছবি অন্য ক্রেতাদের লাইসেন্স নেওয়ার জন্য উপলব্ধ থাকে।",
    },
    {
      id: "L22-Q22",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer licenses your image. Does the buyer now own the copyright to it?",
      qBn: "একজন ক্রেতা আপনার ছবির লাইসেন্স নিলেন। ক্রেতা কি এখন এর কপিরাইটের মালিক?",
      options: [
        "No — a license is permission to use the work, not a transfer of copyright",
        "Yes — licensing transfers the copyright",
        "Yes — but only under an Extended License",
        "Yes — after the buyer uses it once",
      ],
      optionsBn: [
        "না — লাইসেন্স হলো কাজটি ব্যবহারের অনুমতি, কপিরাইট হস্তান্তর নয়",
        "হ্যাঁ — লাইসেন্স কপিরাইট হস্তান্তর করে",
        "হ্যাঁ — তবে শুধু এক্সটেন্ডেড লাইসেন্সে",
        "হ্যাঁ — ক্রেতা একবার ব্যবহার করার পর",
      ],
      answer: 0,
      explanation:
        "Adobe Stock grants a non-exclusive, non-transferable license to use the work — the contributor keeps the copyright. Buying a license never transfers ownership of the image.",
      explanationBn:
        "অ্যাডোবি স্টক কাজটি ব্যবহারের অ-একচেটিয়া, হস্তান্তর-অযোগ্য লাইসেন্স দেয় — কপিরাইট কন্ট্রিবিউটরের কাছেই থাকে। লাইসেন্স কেনা কখনোই ছবির মালিকানা হস্তান্তর করে না।",
    },
    {
      id: "L22-Q23",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A Standard License is described as perpetual and worldwide. What does that mean?",
      qBn: "স্ট্যান্ডার্ড লাইসেন্সকে চিরস্থায়ী ও বিশ্বব্যাপী বলা হয়। এর অর্থ কী?",
      options: [
        "It lasts one year and covers one country",
        "It lasts until the buyer first uses the image",
        "It covers only the buyer's home city",
        "The buyer may use the work forever, anywhere in the world",
      ],
      optionsBn: [
        "এটি এক বছর স্থায়ী হয় এবং একটি দেশ কভার করে",
        "ক্রেতা প্রথমবার ছবিটি ব্যবহার করা পর্যন্ত এটি স্থায়ী হয়",
        "এটি শুধু ক্রেতার নিজের শহর কভার করে",
        "ক্রেতা চিরকাল, বিশ্বের যেকোনো জায়গায় কাজটি ব্যবহার করতে পারবেন",
      ],
      answer: 3,
      explanation:
        "The Standard License is a non-exclusive, perpetual, worldwide license: it does not expire after a year, and it is not limited to one country.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স একটি অ-একচেটিয়া, চিরস্থায়ী, বিশ্বব্যাপী লাইসেন্স: এটি এক বছর পর মেয়াদ শেষ হয় না, এবং এটি একটি দেশে সীমাবদ্ধ নয়।",
    },
    {
      id: "L22-Q24",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer uses your image in an e-book sold online. Which license covers that?",
      qBn: "একজন ক্রেতা আপনার ছবি অনলাইনে বিক্রি হওয়া একটি ই-বুকে ব্যবহার করেছেন। কোন লাইসেন্স তা কভার করে?",
      options: [
        "An Extended License — e-books need it",
        "A Standard License — e-books and e-publications are covered digital productions",
        "An Editorial license",
        "No license — e-books are exempt",
      ],
      optionsBn: [
        "এক্সটেন্ডেড লাইসেন্স — ই-বুকে এটি দরকার",
        "স্ট্যান্ডার্ড লাইসেন্স — ই-বুক ও ই-প্রকাশনা কভার করা ডিজিটাল প্রোডাকশন",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — ই-বুক ছাড় পায়",
      ],
      answer: 1,
      explanation:
        "The Standard License covers digital productions such as websites, mobile advertising, mobile applications, e-cards and e-publications — including e-books and e-magazines.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স ওয়েবসাইট, মোবাইল বিজ্ঞাপন, মোবাইল অ্যাপ্লিকেশন, ই-কার্ড ও ই-প্রকাশনার মতো ডিজিটাল প্রোডাকশন কভার করে — ই-বুক ও ই-ম্যাগাজিনসহ।",
    },
    {
      id: "L22-Q25",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A company hangs a large print of your image on its office wall as decoration. Which license covers that?",
      qBn: "একটি কোম্পানি আপনার ছবির একটি বড় প্রিন্ট তাদের অফিসের দেয়ালে সাজসজ্জা হিসেবে ঝোলাল। কোন লাইসেন্স তা কভার করে?",
      options: [
        "An Extended License — wall prints need it",
        "An Editorial license",
        "A Standard License — decoration in a commercial space the buyer owns is covered",
        "No license — decoration is free",
      ],
      optionsBn: [
        "এক্সটেন্ডেড লাইসেন্স — দেয়ালের প্রিন্টে এটি দরকার",
        "এডিটোরিয়াল লাইসেন্স",
        "স্ট্যান্ডার্ড লাইসেন্স — ক্রেতার মালিকানাধীন বাণিজ্যিক স্থানে সাজসজ্জা কভার করা হয়",
        "কোনো লাইসেন্স নয় — সাজসজ্জা বিনামূল্যে",
      ],
      answer: 2,
      explanation:
        "The Standard License covers use for decoration purposes, including decorations for display in a commercial space owned by the buyer. It only becomes an Extended use if the decorated item is sold as merchandise.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স সাজসজ্জার উদ্দেশ্যে ব্যবহার কভার করে, ক্রেতার মালিকানাধীন বাণিজ্যিক স্থানে প্রদর্শনের জন্য সাজসজ্জাসহ। সাজানো পণ্যটি মার্চেন্ডাইজ হিসেবে বিক্রি হলেই তা এক্সটেন্ডেড ব্যবহার হয়।",
    },
    {
      id: "L22-Q26",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer uses your image inside a mobile app. Which license covers that?",
      qBn: "একজন ক্রেতা আপনার ছবি একটি মোবাইল অ্যাপের ভেতরে ব্যবহার করেছেন। কোন লাইসেন্স তা কভার করে?",
      options: [
        "A Standard License — mobile applications are covered digital productions",
        "An Extended License — apps need it",
        "An Editorial license",
        "No license — app use is free",
      ],
      optionsBn: [
        "স্ট্যান্ডার্ড লাইসেন্স — মোবাইল অ্যাপ্লিকেশন কভার করা ডিজিটাল প্রোডাকশন",
        "এক্সটেন্ডেড লাইসেন্স — অ্যাপে এটি দরকার",
        "এডিটোরিয়াল লাইসেন্স",
        "কোনো লাইসেন্স নয় — অ্যাপ ব্যবহার বিনামূল্যে",
      ],
      answer: 0,
      explanation:
        "The Standard License covers digital productions such as websites, mobile advertising and mobile applications. The 500,000-viewer cap also does not apply to mobile apps.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স ওয়েবসাইট, মোবাইল বিজ্ঞাপন ও মোবাইল অ্যাপ্লিকেশনের মতো ডিজিটাল প্রোডাকশন কভার করে। ৫,০০,০০০ দর্শকের সীমা মোবাইল অ্যাপেও প্রযোজ্য নয়।",
    },
    {
      id: "L22-Q27",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer adds your image to an online image database so other people can download it. Is that allowed?",
      qBn: "একজন ক্রেতা আপনার ছবি একটি অনলাইন ছবির ডাটাবেজে যোগ করলেন, যাতে অন্যরা তা ডাউনলোড করতে পারে। এটি কি অনুমোদিত?",
      options: [
        "Yes — under an Extended License",
        "Yes — under a Standard License",
        "Yes — if the database is private",
        "No — no license allows distributing the work in a database that lets others use or extract it as a stand-alone file",
      ],
      optionsBn: [
        "হ্যাঁ — এক্সটেন্ডেড লাইসেন্সে",
        "হ্যাঁ — স্ট্যান্ডার্ড লাইসেন্সে",
        "হ্যাঁ — ডাটাবেজটি ব্যক্তিগত হলে",
        "না — কোনো লাইসেন্সেই কাজটি এমন ডাটাবেজে বিতরণের অনুমতি নেই যা অন্যদের স্বতন্ত্র ফাইল হিসেবে ব্যবহার বা বের করতে দেয়",
      ],
      answer: 3,
      explanation:
        "All licenses forbid selling, licensing, sharing or distributing the work as a stand-alone file or as part of an online database that allows a third party to use, download or extract the work as a stand-alone file.",
      explanationBn:
        "সব লাইসেন্স কাজটি স্বতন্ত্র ফাইল হিসেবে বিক্রি, লাইসেন্স, শেয়ার বা বিতরণ, বা তৃতীয় পক্ষকে স্বতন্ত্র ফাইল হিসেবে ব্যবহার, ডাউনলোড বা বের করতে দেয় এমন অনলাইন ডাটাবেজের অংশ হিসেবে রাখা নিষিদ্ধ করে।",
    },
    {
      id: "L22-Q28",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A print run is exactly 500,000 copies. Which license covers it?",
      qBn: "একটি প্রিন্ট রান ঠিক ৫,০০,০০০ কপি। কোন লাইসেন্স তা কভার করে?",
      options: [
        "Only an Extended License",
        "Only an Enhanced License",
        "A Standard License — the limit is “up to 500,000”, so 500,000 exactly is covered",
        "No license — 500,000 is the forbidden number",
      ],
      optionsBn: [
        "শুধু এক্সটেন্ডেড লাইসেন্স",
        "শুধু এনহ্যান্সড লাইসেন্স",
        "স্ট্যান্ডার্ড লাইসেন্স — সীমা “৫,০০,০০০ পর্যন্ত”, তাই ঠিক ৫,০০,০০০ কভার করা হয়",
        "কোনো লাইসেন্স নয় — ৫,০০,০০০ নিষিদ্ধ সংখ্যা",
      ],
      answer: 2,
      explanation:
        "The Standard License allows reproduction on up to 500,000 printed materials. Exactly 500,000 is inside the limit — only the 500,001st copy would need an upgrade.",
      explanationBn:
        "স্ট্যান্ডার্ড লাইসেন্স ৫,০০,০০০ পর্যন্ত ছাপানো উপকরণে পুনরুৎপাদনের অনুমতি দেয়। ঠিক ৫,০০,০০০ সীমার ভেতরে — শুধু ৫,০০,০০১তম কপির জন্যই আপগ্রেড দরকার হবে।",
    },
    {
      id: "L22-Q29",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A designer licenses your image to use in an advertising campaign for their client. Is that allowed under a Standard License?",
      qBn: "একজন ডিজাইনার তাদের ক্লায়েন্টের বিজ্ঞাপন প্রচারণায় ব্যবহারের জন্য আপনার ছবির লাইসেন্স নিলেন। স্ট্যান্ডার্ড লাইসেন্সে কি এটি অনুমোদিত?",
      options: [
        "No — licenses can never be used for clients",
        "No — the client must buy the license directly",
        "Yes — a customer may use the license for the benefit of a client, if they have full legal authority to bind the client to the agreement",
        "Yes — and the designer may then resell the license to the client",
      ],
      optionsBn: [
        "না — লাইসেন্স কখনোই ক্লায়েন্টের জন্য ব্যবহার করা যায় না",
        "না — ক্লায়েন্টকে সরাসরি লাইসেন্স কিনতে হবে",
        "হ্যাঁ — ক্রেতা ক্লায়েন্টের সুবিধার জন্য লাইসেন্স ব্যবহার করতে পারেন, যদি চুক্তিতে ক্লায়েন্টকে বাঁধার পূর্ণ আইনি কর্তৃত্ব তার থাকে",
        "হ্যাঁ — এবং ডিজাইনার এরপর লাইসেন্সটি ক্লায়েন্টের কাছে পুনঃবিক্রি করতে পারেন",
      ],
      answer: 2,
      explanation:
        "Adobe's terms allow client use: a customer may use the license for the benefit of one of its clients, if the customer warrants full legal authority to bind the client to the agreement. Reselling the license itself is never allowed.",
      explanationBn:
        "অ্যাডোবির শর্তাবলী ক্লায়েন্টের ব্যবহার অনুমোদন করে: ক্রেতা তার একজন ক্লায়েন্টের সুবিধার জন্য লাইসেন্স ব্যবহার করতে পারেন, যদি ক্রেতা চুক্তিতে ক্লায়েন্টকে বাঁধার পূর্ণ আইনি কর্তৃত্বের নিশ্চয়তা দেন। লাইসেন্সটি নিজে পুনঃবিক্রি করা কখনোই অনুমোদিত নয়।",
    },
    {
      id: "L22-Q30",
      topic: "Licenses",
      topicBn: "লাইসেন্স",
      q: "A buyer has a Standard License and now wants to sell greeting cards printed with your image. What must they do?",
      qBn: "একজন ক্রেতার স্ট্যান্ডার্ড লাইসেন্স আছে এবং এখন তিনি আপনার ছবি ছাপিয়ে গ্রিটিং কার্ড বিক্রি করতে চান। তাদের কী করতে হবে?",
      options: [
        "Buy an Extended License — greeting cards for resale are merchandise, which Standard does not allow",
        "Nothing — greeting cards are covered by Standard",
        "Buy a second Standard License",
        "Mark the cards as editorial use only",
      ],
      optionsBn: [
        "এক্সটেন্ডেড লাইসেন্স কিনুন — পুনঃবিক্রয়ের জন্য গ্রিটিং কার্ড মার্চেন্ডাইজ, যা স্ট্যান্ডার্ড অনুমোদন করে না",
        "কিছুই নয় — গ্রিটিং কার্ড স্ট্যান্ডার্ডে কভার করা হয়",
        "দ্বিতীয় স্ট্যান্ডার্ড লাইসেন্স কিনুন",
        "কার্ডগুলোকে শুধু এডিটোরিয়াল ব্যবহার হিসেবে চিহ্নিত করুন",
      ],
      answer: 0,
      explanation:
        "Greeting cards printed with the image and sold are merchandise for resale — explicitly an Extended License use. A Standard License cannot be stretched to cover it, and buying a second Standard License changes nothing.",
      explanationBn:
        "ছবি ছাপিয়ে বিক্রি করা গ্রিটিং কার্ড পুনঃবিক্রয়ের জন্য মার্চেন্ডাইজ — স্পষ্টভাবে এক্সটেন্ডেড লাইসেন্সের ব্যবহার। স্ট্যান্ডার্ড লাইসেন্স বাড়িয়ে তা কভার করা যায় না, এবং দ্বিতীয় স্ট্যান্ডার্ড লাইসেন্স কেনাতেও কিছু বদলায় না।",
    },
  ],
};
