import { WPPost, WPProduct, PromptTemplate, AIForm, AILog, EmbeddingIndex } from './types';

export const INITIAL_POSTS: WPPost[] = [
  {
    id: "post-1",
    title: "10 tipp a fenntartható otthoni iroda kialakításához",
    excerpt: "Hogyan csökkentheted az ökológiai lábnyomodat otthoni munkavégzés közben? Íme a legjobb tippek a fenntartható irodáért.",
    content: `<h2>1. Válassz energiatakarékos világítást</h2><p>Az otthoni iroda berendezésekor az egyik legfontosabb szempont a megfelelő fényforrás kiválasztása. A hagyományos izzók helyett használj modern LED-es fényforrásokat, amelyek akár 80%-kal kevesebb áramot fogyasztanak.</p><h2>2. Használj természetes anyagokat</h2><p>A bútorok kiválasztásánál törekedj az FSC minősítésű fa, bambusz vagy újrahasznosított műanyagok használatára. Ez nemcsak stílusos, de környezetkímélő is.</p><h2>3. Csökkentsd a készenléti energiát</h2><p>Az elosztók kikapcsolásával megelőzheted, hogy a monitorok és töltők kikapcsolt állapotban is áramot fogyasszanak.</p>`,
    date: "2026-06-28",
    status: "publish",
    author: "Kovács Péter",
    category: "Életmód",
    keywords: ["otthoni iroda", "fenntarthatóság", "zöld tippek"],
    images: ["https://picsum.photos/seed/office/800/600"]
  },
  {
    id: "post-2",
    title: "A mesterséges intelligencia szerepe a modern e-kereskedelemben",
    excerpt: "Hogyan alakítják át a nagy nyelvi modellek a webáruházak mindennapjait? Termékleírásoktól a chatbotokig.",
    content: `<h2>Bevezetés</h2><p>A webáruházak világa gyorsan változik, és a versenyben maradáshoz elengedhetetlen a legújabb technológiák alkalmazása. Az AI nemcsak segít a tartalomgyártásban, de személyre szabja a vásárlói élményt is.</p><h2>Személyre szabott ajánlók</h2><p>A beágyazások (embeddings) és vektoros keresők segítségével a vásárlóknak pontosan azokat a termékeket mutathatjuk meg, amelyekre valóban szükségük van.</p>`,
    date: "2026-06-30",
    status: "draft",
    author: "Szabó Anna",
    category: "Technológia",
    keywords: ["e-kereskedelem", "mesterséges intelligencia", "webshop"],
    images: ["https://picsum.photos/seed/tech/800/600"]
  }
];

export const INITIAL_PRODUCTS: WPProduct[] = [
  {
    id: "prod-1",
    title: "Minimalista Bambusz Asztali Rendező",
    description: "Környezetbarát bambuszból készült, stílusos asztali rendszerező mobiltelefon-tartóval, tolltartó rekeszekkel és rejtett kábeltárolóval a tiszta munkakörnyezetért.",
    shortDescription: "Fenntartható bambusz asztali rendező a tökéletes rendért.",
    price: "8900",
    image: "https://picsum.photos/seed/bamboo/400/400",
    status: "publish",
    keywords: ["bambusz", "iroda", "rendező", "minimalista"]
  },
  {
    id: "prod-2",
    title: "Ergonomikus Memóriahabos Ülőpárna",
    description: "Prémium minőségű memóriahabból készült, anatómiailag formázott ülőpárna, amely javítja a testtartást és csökkenti a derékfájást hosszan tartó ülőmunka esetén.",
    shortDescription: "Ergonomikus párna a fájdalommentes otthoni irodáért.",
    price: "12500",
    image: "https://picsum.photos/seed/pillow/400/400",
    status: "draft",
    keywords: ["ergonómia", "ülőpárna", "memóriahab", "egészség"]
  }
];

export const PROMPT_BASE: PromptTemplate[] = [
  {
    id: "p1",
    category: "seo",
    title: "SEO-optimalizált blogbejegyzés vázlat",
    description: "Létrehoz egy részletes, kulcsszavakra épülő cikkszerkezetet H2-H4 címsorokkal és meta-leírás javaslattal.",
    prompt: "Készíts egy SEO-optimalizált cikkvázlatot a következő témában: '[TÉMA]'. Használd a következő kulcsszavakat: [KULCSSZAVAK]. Tartalmazzon meta leírást és keresési szándék elemzést is."
  },
  {
    id: "p2",
    category: "copywriting",
    title: "PAS (Problem-Agitate-Solve) Értékesítési Szöveg",
    description: "Klasszikus marketingszöveg-írási formula, amely rávilágít a problémára, felerősíti azt, majd bemutatja a megoldást.",
    prompt: "Írj egy meggyőző PAS formulára épülő értékesítési szöveget a következő termékhez: '[TERMÉK_NEVE]'. A célcsoportunk: [CÉLCSOPORT]. Legyen érzelmileg megérintő és tartalmazzon világos Call to Action-t."
  },
  {
    id: "p3",
    category: "creative",
    title: "Történetmesélős (Storytelling) bevezető",
    description: "Érzelmes vagy izgalmas mikrotörténet, amely azonnal megragadja az olvasó figyelmét és bevezeti a cikket.",
    prompt: "Írj egy lenyűgöző, történetmesélést alkalmazó bevezető bekezdést egy cikkhez, aminek a címe: '[CÍM]'. Használj érzékletes leírásokat és kelts kíváncsiságot."
  },
  {
    id: "p4",
    category: "translation",
    title: "Lokalizált fordítás kulturális kontextussal",
    description: "Lefordítja a szöveget bármely nyelvre, miközben igazodik a helyi idiómákhoz és kifejezésekhez.",
    prompt: "Fordítsd le a következő szöveget [NYELV] nyelvre. Figyelj rá, hogy ne szó szerinti fordítás legyen, hanem a célnyelv kulturális sajátosságaihoz és idiómáihoz igazodó, természetes szöveg:\n\n'[SZÖVEG]'"
  },
  {
    id: "p5",
    category: "ecommerce",
    title: "Amazon-stílusú Termékleírás előnyökkel",
    description: "Átalakítja az unalmas technikai adatokat meggyőző vásárlói előnyökké és tulajdonság-listává.",
    prompt: "Írj egy lenyűgöző, funkciókra és közvetlen előnyökre fókuszáló WooCommerce termékleírást a következő termékhez: '[TERMÉK_NEVE]'. Technikai specifikációk: [ADATOK]. Legyen könnyen olvasható, használj bullet-pointokat."
  }
];

export const INITIAL_FORMS: AIForm[] = [
  {
    id: "form-1",
    name: "Személyre szabott Edzésterv Generátor",
    shortcode: "[ai_form id=\"workout-gen\"]",
    fields: [
      { name: "age", label: "Életkor", type: "text" },
      { name: "goal", label: "Fő célod", type: "select", options: ["Fogyás", "Izomtömeg növelés", "Állóképesség javítása", "Egészségmegőrzés"] },
      { name: "days", label: "Heti edzésnapok száma", type: "select", options: ["1-2 nap", "3-4 nap", "5+ nap"] },
      { name: "experience", label: "Tapasztalati szint", type: "select", options: ["Kezdő", "Középhaladó", "Haladó"] }
    ],
    systemPrompt: "Te egy prémium személyi edző vagy. Készíts egy nagyon motiváló, személyre szabott edzéstervet és étrendi tippet a válaszok alapján.",
    responseStyle: "Biztató, professzionális és strukturált"
  },
  {
    id: "form-2",
    name: "Utazási Útiterv Készítő",
    shortcode: "[ai_form id=\"travel-itinerary\"]",
    fields: [
      { name: "destination", label: "Úticél", type: "text" },
      { name: "duration", label: "Napok száma", type: "text" },
      { name: "budget", label: "Költségvetés", type: "select", options: ["Hátizsákos / Olcsó", "Középkategóriás", "Luxus"] },
      { name: "style", label: "Utazási stílus", type: "select", options: ["Kulturális városnézés", "Aktív kaland és túrázás", "Pihenés és tengerpart", "Gasztronómiai fókuszú"] }
    ],
    systemPrompt: "Te egy tapasztalt helyi idegenvezető és utazási tanácsadó vagy. Készíts egy részletes, napokra bontott utazási tervet rejtett kincsekkel és gasztro tippekkel.",
    responseStyle: "Inspiráló, részletes és praktikus"
  }
];

export const INITIAL_LOGS: AILog[] = [
  {
    id: "log-1",
    action: "Cikk generálása: '10 tipp a fenntartható otthoni irodához'",
    model: "gemini-3.5-flash",
    promptLength: 420,
    responseLength: 1250,
    tokensUsed: 1670,
    cost: 0.00025,
    timestamp: "2026-07-01 10:15:30"
  },
  {
    id: "log-2",
    action: "Képgenerálás: 'Minimalista bambusz asztali rendező'",
    model: "gemini-3.1-flash-lite-image",
    promptLength: 120,
    responseLength: 0,
    tokensUsed: 0,
    cost: 0.0015,
    timestamp: "2026-07-01 11:22:15"
  },
  {
    id: "log-3",
    action: "Termék optimalizálás: 'Bambusz Asztali Rendező'",
    model: "gemini-3.5-flash",
    promptLength: 350,
    responseLength: 720,
    tokensUsed: 1070,
    cost: 0.00016,
    timestamp: "2026-07-01 14:02:44"
  }
];

export const INITIAL_EMBEDDINGS: EmbeddingIndex[] = [
  {
    id: "emb-1",
    name: "Összes Blogbejegyzés index",
    sourceType: "posts",
    recordCount: 2,
    status: "indexed",
    lastIndexed: "2026-07-01 15:30:00"
  },
  {
    id: "emb-2",
    name: "WooCommerce Termékek index",
    sourceType: "products",
    recordCount: 2,
    status: "unindexed",
    lastIndexed: "Nincs indexelve"
  }
];

export const MOCK_LANGUAGES = [
  "Magyar", "Angol", "Spanyol", "Francia", "Német", "Olasz", "Portugál", "Orosz", "Japán", "Koreai",
  "Kínai", "Holland", "Indonéz", "Török", "Lengyel", "Ukrán", "Arab", "Román", "Görög", "Cseh",
  "Bulgár", "Svéd", "Dán", "Finn", "Norvég", "Szlovák", "Horvát", "Szerb", "Szlovén"
];

export const MOCK_STYLES = [
  { id: "informative", label: "Informatív (Informative)" },
  { id: "descriptive", label: "Leíró (Descriptive)" },
  { id: "creative", label: "Kreatív (Creative)" },
  { id: "narrative", label: "Narratív (Narrative)" },
  { id: "persuasive", label: "Meggyőző (Persuasive)" },
  { id: "explanatory", label: "Magyarázó (Explanatory)" },
  { id: "reflective", label: "Reflexív (Reflective)" },
  { id: "argumentative", label: "Érvelő (Argumentative)" },
  { id: "analytical", label: "Elemző (Analytical)" },
  { id: "critical", label: "Kritikus (Critical)" },
  { id: "evaluative", label: "Értékelő (Evaluative)" },
  { id: "journalistic", label: "Újságírói (Journalistic)" },
  { id: "technical", label: "Technikai (Technical)" },
  { id: "simple", label: "Egyszerű (Simple)" }
];

export const MOCK_TONES = [
  { id: "formal", label: "Formális (Formal)" },
  { id: "neutral", label: "Semleges (Neutral)" },
  { id: "assertive", label: "Határozott (Assertive)" },
  { id: "cheerful", label: "Vidám (Cheerful)" },
  { id: "humorous", label: "Humoros (Humorous)" },
  { id: "informal", label: "Informális (Informal)" },
  { id: "inspiring", label: "Inspiráló (Inspiring)" },
  { id: "sarcastic", label: "Szarkasztikus (Sarcastic)" },
  { id: "professional", label: "Professzionális (Professional)" },
  { id: "skeptical", label: "Szkeptikus (Skeptical)" }
];

export const ART_STYLES = [
  { id: "photorealistic", label: "Fotórealisztikus (Photorealistic)" },
  { id: "watercolor", label: "Akvarell (Watercolor)" },
  { id: "flat_design", label: "Lapos dizájn (Flat Design)" },
  { id: "isometric", label: "Izometrikus 3D (Isometric 3D)" },
  { id: "pixel_art", label: "Pixel Art" },
  { id: "3d_render", label: "3D Render" },
  { id: "minimalist_illustration", label: "Minimalista illusztráció" },
  { id: "vector", label: "Vektoros grafika" },
  { id: "concept_art", label: "Koncepció művészet" },
  { id: "oil_painting", label: "Olajfestmény" }
];
