import { useEffect, useRef, useState } from "react";
import {
  Scissors,
  MapPin,
  Phone,
  Crown,
  Clock,
  Star,
  MessageCircle,
  Ruler,
  Award,
  Users,
  Sparkles,
  ChevronDown,
  Quote,
  ArrowRight,
  CheckCircle2,
  Shield,
} from "lucide-react";

const PHONE = "+919837528577";
const WHATSAPP_URL = `https://wa.me/${PHONE.replace("+", "")}?text=Hello%20Eagle%20Tailors%2C%20I%27d%20like%20to%20enquire%20about%20bespoke%20tailoring`;
const PHONE_DISPLAY = "+91 98375 28577";
const ADDRESS = "Sadar Bazar, Meerut Cantt";
const MAP_QUERY = encodeURIComponent("Eagle Tailors Sadar Bazar Meerut Cantt");

const FOUNDING_YEAR = 1968;
const YEARS_IN_TRADE = new Date().getFullYear() - FOUNDING_YEAR;

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten",
] as const;

// "58" → "nearly six decades", "60" → "six decades", "62" → "over six decades"
function decadesPhrase(years: number): string {
  const decade = Math.floor(years / 10);
  const remainder = years % 10;
  if (remainder === 0) return `${NUMBER_WORDS[decade]} decades`;
  if (remainder <= 4) return `over ${NUMBER_WORDS[decade]} decades`;
  return `nearly ${NUMBER_WORDS[decade + 1]} decades`;
}

// Compact badge label — rounds to nearest decade word, capitalized
function decadeBadge(years: number): string {
  const word = NUMBER_WORDS[Math.round(years / 10)];
  return `${word[0].toUpperCase()}${word.slice(1)} decades`;
}

type GarmentCard = {
  name: string;
  hindi: string;
  image: string;
  blurb: string;
};

const GARMENTS: GarmentCard[] = [
  {
    name: "Two-Piece Suit",
    hindi: "टू-पीस सूट",
    image: "/showcase/2piece%20suit.jpg",
    blurb: "Wool · perfectly tailored",
  },
  {
    name: "Three-Piece Suit",
    hindi: "थ्री-पीस सूट",
    image: "/showcase/3piecesuit.jpg",
    blurb: "Structured · brass buttons",
  },
  {
    name: "Safari Suit",
    hindi: "सफारी सूट",
    image: "/showcase/safari-suit.webp",
    blurb: "Cotton · classic heritage cut",
  },
  {
    name: "Formal Shirt",
    hindi: "शर्ट",
    image: "/showcase/shirt.jpg",
    blurb: "Cotton · French cuffs",
  },
  {
    name: "Formal Trousers",
    hindi: "पैंट",
    image: "/showcase/trouser.webp",
    blurb: "Precision cut · perfect drape",
  },
  {
    name: "Blazer",
    hindi: "ब्लेज़र",
    image: "/showcase/blazer.webp",
    blurb: "Structured · hand-finished",
  },
];

const PROCESS_STEPS = [
  { n: "01", title: "Consultation", hindi: "परामर्श", icon: <Users className="w-5 h-5" />, body: "Understand the occasion, style and silhouette." },
  { n: "02", title: "Measurement", hindi: "नाप", icon: <Ruler className="w-5 h-5" />, body: "32 precise measurements taken by master tailor." },
  { n: "03", title: "Fabric Selection", hindi: "कपड़ा", icon: <Sparkles className="w-5 h-5" />, body: "Curated wool, silk, linen and khadi swatches." },
  { n: "04", title: "Pattern & Cut", hindi: "कटाई", icon: <Scissors className="w-5 h-5" />, body: "Hand-drafted pattern, single-piece cut." },
  { n: "05", title: "Stitch & Finish", hindi: "सिलाई", icon: <Crown className="w-5 h-5" />, body: "Hand-finished seams, hand-sewn buttons." },
  { n: "06", title: "Trial & Delivery", hindi: "डिलीवरी", icon: <CheckCircle2 className="w-5 h-5" />, body: "Final fit-trial, on-time handover." },
];

const TESTIMONIALS = [
  {
    quote: "Got my wedding suit made here. Fit was perfect on the first trial — and three years later it still looks brand new. My father trusted Eagle, and so do I.",
    name: "Aman Sharma",
    role: "Regular client · 2023",
  },
  {
    quote: "I’ve had every formal suit of mine stitched at Eagle since 2008. They remember my measurements, my preferences, even my fabric tastes. That’s rare.",
    name: "Col. R. K. Verma",
    role: "Regular client · 16 years",
  },
  {
    quote: "Took my dad’s 30-year-old safari suit for alteration. They restored it like it was new. The craftsmanship in this shop is something you don’t see anymore.",
    name: "Rohit Bansal",
    role: "Heritage restoration",
  },
];

const TRUST_BADGES = [
  { label: `Est. ${FOUNDING_YEAR}`, sub: decadeBadge(YEARS_IN_TRADE) },
  { label: "50,000+", sub: "Garments stitched" },
  { label: "Bespoke", sub: "Hand-tailored" },
  { label: "Family Run", sub: "Father to son" },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}



export default function LandingPage() {
  useReveal();
  const heroRef = useRef<HTMLDivElement>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length),
      6500
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-stone-900 antialiased selection:bg-amber-300/60">
      {/* ──────────────  NAV  ────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#top" className="flex items-center gap-3 flex-shrink-0">
              <img
                src="/eagle-tailors-logo.png"
                alt="Eagle Tailors"
                className="flex-shrink-0 object-contain h-16 w-auto"
              />
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#craft" className="tracking-wide text-stone-700 hover:text-amber-600 transition-colors">
                Our Craft
              </a>
              <a href="#process" className="tracking-wide text-stone-700 hover:text-amber-600 transition-colors">
                Process
              </a>
              <a href="#story" className="tracking-wide text-stone-700 hover:text-amber-600 transition-colors">
                Heritage
              </a>
              <a href="#visit" className="tracking-wide text-stone-700 hover:text-amber-600 transition-colors">
                Visit
              </a>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <a
                href={`tel:${PHONE}`}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-all hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ──────────────  HERO  ────────────── */}
      <section
        id="top"
        ref={heroRef}
        className="relative min-h-[100svh] flex items-center overflow-hidden"
      >
        {/* Backdrop */}
        <div className="absolute inset-0">
          <img
            src="/hero-shop.jpg"
            alt="Eagle Tailors atelier"
            className="w-full h-full object-cover object-center ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/65 to-stone-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/40 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-20 md:pt-32 md:pb-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 border border-amber-400/40 rounded-full mb-7 backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="text-[11px] font-semibold text-amber-200 tracking-[0.18em] uppercase">
                Est. {FOUNDING_YEAR} · Sadar Bazar, Meerut
              </span>
            </div>

            <h1 className="font-bold text-white leading-[1.02] tracking-tight">
              <span className="block text-5xl md:text-7xl lg:text-[5.5rem]">Crafted by Hand,</span>
              <span className="block text-5xl md:text-7xl lg:text-[5.5rem] shimmer-text">
                Worn for Generations.
              </span>
            </h1>

            <p className="mt-7 text-lg md:text-xl text-stone-200 max-w-xl leading-relaxed">
              Bespoke tailoring for the modern gentleman — suits, safari suits,
              shirts and trousers measured, cut and stitched in our
              Meerut atelier since <span className="text-amber-300 font-semibold">{FOUNDING_YEAR}</span>.
            </p>
            <p className="mt-2 text-base text-stone-400 italic">
              आधुनिक पुरुष के लिए हस्तनिर्मित बेस्पोक टेलरिंग
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-7 py-4 bg-amber-400 text-stone-950 font-bold rounded-full hover:bg-amber-300 transition-all hover:scale-105 shadow-lg shadow-amber-500/30"
              >
                <MessageCircle className="w-5 h-5" />
                Book a Fitting
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={`tel:${PHONE}`}
                className="flex items-center gap-2 px-7 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-full border border-white/30 hover:bg-white hover:text-stone-900 transition-all"
              >
                <Phone className="w-5 h-5" />
                {PHONE_DISPLAY}
              </a>
            </div>

            {/* Hero footer mini-stats */}
            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                { n: "40+", l: "Years" },
                { n: "50K+", l: "Garments" },
                { n: "100%", l: "Bespoke" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl md:text-4xl font-bold text-amber-300 tracking-tight">{s.n}</div>
                  <div className="text-[11px] tracking-[0.16em] uppercase text-stone-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <a
          href="#trust"
          className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-white/60 hover:text-amber-300 transition-colors float-y"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </a>
      </section>

      {/* ──────────────  TRUST MARQUEE  ────────────── */}
      <section id="trust" className="bg-stone-950 text-white border-y border-amber-500/20 py-5 overflow-hidden">
        <div className="flex marquee whitespace-nowrap">
          {[...TRUST_BADGES, ...TRUST_BADGES, ...TRUST_BADGES].map((b, i) => (
            <div key={i} className="flex items-center gap-3 mx-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold tracking-[0.18em] uppercase text-amber-200">
                {b.label}
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-400 tracking-wider">{b.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────  CRAFT / GARMENTS  ────────────── */}
      <section id="craft" className="py-20 md:py-28 bg-[#F5F0E8] relative overflow-hidden">
        {/* decorative big text */}
        <div aria-hidden className="absolute -top-6 right-0 text-[12rem] md:text-[16rem] font-black text-stone-900/[0.04] leading-none select-none pointer-events-none">
          CRAFT
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="reveal max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-amber-500" />
              <span className="text-[11px] tracking-[0.26em] uppercase font-semibold text-amber-700">
                Our Specialisations
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
              Six cuts. <span className="italic text-amber-700">One standard.</span>
            </h2>
            <p className="mt-4 text-stone-600 text-lg leading-relaxed">
              Suits, safari suits, blazers, shirts and trousers — every piece
              hand-cut and hand-stitched by tailors who have done this for two generations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {GARMENTS.map((g, i) => (
              <article
                key={g.name}
                className="reveal group relative overflow-hidden rounded-sm bg-white border border-stone-200 hover:border-amber-500 transition-colors"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="aspect-[3/4] overflow-hidden bg-stone-100">
                  <img
                    src={g.image}
                    alt={g.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/10 to-transparent" />
                </div>

                <div className="absolute top-4 left-4 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-[0.18em] uppercase text-stone-900">
                  0{i + 1}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight">{g.name}</h3>
                  <p className="text-sm text-amber-300 mt-0.5">{g.hindi}</p>
                  <p className="text-xs text-stone-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {g.blurb}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────  HERITAGE / STORY  ────────────── */}
      <section id="story" className="py-20 md:py-28 bg-stone-950 text-white relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-30 pointer-events-none">
          <img src="/showcase/craft-detail-scissors.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-stone-950/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-14 items-center">
          <div className="reveal">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-amber-400" />
              <span className="text-[11px] tracking-[0.26em] uppercase font-semibold text-amber-400">
                The Eagle Story
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              A needle, a thread,<br />
              and <span className="italic text-amber-400">{decadesPhrase(YEARS_IN_TRADE)}</span> of trust.
            </h2>
            <p className="mt-6 text-stone-300 text-lg leading-relaxed">
              Eagle Tailors opened its doors in <span className="text-amber-300 font-semibold">{FOUNDING_YEAR}</span> on a
              quiet lane of Sadar Bazar, Meerut Cantt. Three generations of fathers,
              officers and gentlemen have walked in for their first suit, their safari set,
              their office shirts — perfectly measured and stitched every time.
            </p>
            <p className="mt-4 text-stone-400 leading-relaxed">
              We do not run sales. We do not chase volume. We measure once, cut once,
              and stand behind every stitch — because the same hands have been doing it for {decadesPhrase(YEARS_IN_TRADE)}.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { icon: <Award className="w-6 h-6" />, n: `${YEARS_IN_TRADE}+`, l: "Years of trade" },
                { icon: <Users className="w-6 h-6" />, n: "50K+", l: "Garments stitched" },
                { icon: <Shield className="w-6 h-6" />, n: "100%", l: "Hand-finished" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-amber-400 pl-4">
                  <div className="text-amber-400 mb-2">{s.icon}</div>
                  <div className="text-3xl font-bold tracking-tight">{s.n}</div>
                  <div className="text-[11px] tracking-[0.16em] uppercase text-stone-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal relative">
            <div className="relative">
              <img
                src="/hero-craft.jpg"
                alt="Eagle Tailors craft"
                className="w-full h-[520px] object-cover rounded-sm"
              />
              <div className="absolute -bottom-5 -left-5 bg-amber-400 text-stone-950 px-5 py-4 rounded-sm shadow-xl">
                <div className="text-3xl font-bold tracking-tight">{FOUNDING_YEAR}</div>
                <div className="text-[10px] tracking-[0.22em] uppercase font-semibold">since</div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-amber-400 rounded-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────  PROCESS  ────────────── */}
      <section id="process" className="py-20 md:py-28 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-amber-500" />
              <span className="text-[11px] tracking-[0.26em] uppercase font-semibold text-amber-700">
                The Process
              </span>
              <div className="h-px w-10 bg-amber-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
              Six steps from <span className="italic text-amber-700">measure</span> to <span className="italic text-amber-700">delivery</span>
            </h2>
            <p className="mt-4 text-stone-600 text-lg">
              No shortcuts. Every stage done in-house, by the same master.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROCESS_STEPS.map((s, i) => (
              <div
                key={s.n}
                className="reveal group relative bg-white p-7 border border-stone-200 hover:border-stone-900 transition-all hover:shadow-[8px_8px_0_0_rgba(28,25,23,1)] hover:-translate-x-1 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-700">
                    {s.icon}
                  </div>
                  <span className="text-4xl font-black text-stone-200 group-hover:text-amber-400 transition-colors">
                    {s.n}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900">{s.title}</h3>
                <p className="text-xs text-amber-700 font-semibold tracking-wider mt-0.5">{s.hindi}</p>
                <p className="mt-3 text-sm text-stone-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────  TESTIMONIALS  ────────────── */}
      <section className="py-20 md:py-28 bg-white border-y border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-12">
            <Quote className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <span className="text-[11px] tracking-[0.26em] uppercase font-semibold text-amber-700">
              Words from our regulars
            </span>
          </div>

          <div className="reveal relative min-h-[260px] md:min-h-[200px]">
            {TESTIMONIALS.map((t, idx) => (
              <blockquote
                key={t.name}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  idx === testimonialIdx
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                }`}
              >
                <p className="text-2xl md:text-3xl text-stone-800 leading-relaxed font-light text-center italic">
                  “{t.quote}”
                </p>
                <footer className="mt-6 text-center">
                  <div className="font-bold text-stone-900">{t.name}</div>
                  <div className="text-xs tracking-[0.16em] uppercase text-stone-500 mt-1">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === testimonialIdx ? "bg-amber-500 w-10" : "bg-stone-300 w-3 hover:bg-stone-400"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────  VISIT  ────────────── */}
      <section id="visit" className="py-20 md:py-28 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal grid md:grid-cols-2 gap-10 items-stretch">
            {/* details */}
            <div className="bg-stone-950 text-white p-10 md:p-12 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-10 bg-amber-400" />
                  <span className="text-[11px] tracking-[0.26em] uppercase font-semibold text-amber-400">
                    Visit the Atelier
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Walk in. Be measured. Wear it well.
                </h2>
                <p className="mt-4 text-stone-300 leading-relaxed">
                  We work by appointment so each gentleman gets undivided attention.
                  Drop a WhatsApp before you visit and the chai is on us.
                </p>
              </div>

              <div className="mt-10 space-y-5 text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold">{ADDRESS}</div>
                    <div className="text-stone-400 text-xs mt-0.5">Uttar Pradesh, India</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold">10:00 AM – 8:00 PM</div>
                    <div className="text-stone-400 text-xs mt-0.5">Tuesday to Sunday · Mondays closed</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <a href={`tel:${PHONE}`} className="font-semibold hover:text-amber-300 transition-colors">
                      {PHONE_DISPLAY}
                    </a>
                    <div className="text-stone-400 text-xs mt-0.5">Call or WhatsApp · 7 days</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-all hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-amber-400 text-stone-950 font-semibold rounded-full hover:bg-amber-300 transition-all hover:scale-105"
                >
                  <MapPin className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
            </div>

            {/* map */}
            <div className="relative rounded-sm overflow-hidden border border-stone-300 min-h-[420px] md:min-h-0">
              <iframe
                title="Eagle Tailors location"
                src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 420 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────  FOOTER  ────────────── */}
      <footer className="bg-stone-950 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-amber-400 rounded-sm flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h4 className="font-bold tracking-[0.12em]">EAGLE TAILORS</h4>
                  <p className="text-[10px] text-amber-400/80 tracking-[0.2em]">ईगल टेलर्स · {FOUNDING_YEAR}</p>
                </div>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed">
                Premium men’s bespoke tailoring since {FOUNDING_YEAR}. A family atelier in
                Sadar Bazar, Meerut Cantt — suits, safari suits, shirts and
                trousers measured, cut and stitched to perfection.
              </p>
            </div>

            <div>
              <h5 className="font-bold mb-4 text-amber-400 tracking-[0.18em] text-xs uppercase">Contact</h5>
              <div className="space-y-3 text-sm text-stone-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{ADDRESS}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <a href={`tel:${PHONE}`} className="hover:text-white transition-colors">
                    {PHONE_DISPLAY}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 transition-colors"
                  >
                    WhatsApp · {PHONE_DISPLAY}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Tue–Sun · 10 AM – 8 PM · Monday off</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-bold mb-4 text-amber-400 tracking-[0.18em] text-xs uppercase">Services</h5>
              <ul className="space-y-2 text-sm text-stone-400">
                <li className="hover:text-white transition-colors">· Two &amp; Three-Piece Suits</li>
                <li className="hover:text-white transition-colors">· Safari Suits</li>
                <li className="hover:text-white transition-colors">· Blazers &amp; Coats</li>
                <li className="hover:text-white transition-colors">· Formal Shirts</li>
                <li className="hover:text-white transition-colors">· Trousers &amp; Pants</li>
                <li className="hover:text-white transition-colors">· Alterations &amp; Restoration</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-stone-500">
              © 2026 Eagle Tailors. All rights reserved.
            </p>
            <p className="text-xs text-stone-500 italic">
              Hand-cut · Hand-stitched · Hand-delivered.
            </p>
          </div>
        </div>
      </footer>

      {/* ──────────────  STICKY WHATSAPP FAB  ────────────── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Eagle Tailors"
        className="fixed bottom-5 right-5 z-40 group"
      >
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
        <span className="relative flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-2xl shadow-green-900/40 hover:bg-green-700 transition-all hover:scale-110 border-2 border-white">
          <MessageCircle className="w-6 h-6" />
        </span>
      </a>
    </div>
  );
}
