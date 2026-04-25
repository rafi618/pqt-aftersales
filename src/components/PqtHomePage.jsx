import React, { useState, useEffect } from "react";

/**
 * Property Quest Turkey — Redesigned Home Page
 * - Tailwind CSS utility classes
 * - Aftersales pulled forward as a featured section
 * - PqT Intelligence rendered as a full-width animated bar
 */
export default function PqtHomePage() {
  return (
    <div className="min-h-screen bg-[#0B1320] text-slate-100 font-sans antialiased">
      <TopAnnouncementBar />
      <Navbar />
      <Hero />
      <PqtIntelligenceBar />
      <AftersalesFeature />
      <ServicesGrid />
      <PropertyShowcase />
      <ProcessTimeline />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Top announcement                                                */
/* ---------------------------------------------------------------- */
function TopAnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <span className="hidden md:inline">
          🇹🇷 Licensed real-estate consultancy · Istanbul · Antalya · Bodrum
        </span>
        <span className="md:hidden">PqT · Licensed in Turkey</span>
        <a href="#contact" className="underline underline-offset-2 hover:no-underline">
          Book a free consultation →
        </a>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Navigation                                                      */
/* ---------------------------------------------------------------- */
function Navbar() {
  const links = [
    { label: "Properties", href: "#properties" },
    { label: "Aftersales", href: "#aftersales" },
    { label: "PqT Intelligence", href: "#intelligence" },
    { label: "Citizenship", href: "#citizenship" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[#0B1320]/80 border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 grid place-items-center font-bold text-[#0B1320]">
            P
          </div>
          <span className="font-semibold tracking-wide">
            Property<span className="text-amber-400">Quest</span>Turkey
          </span>
        </a>
        <ul className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className="rounded-full bg-amber-400 text-[#0B1320] px-4 py-2 text-sm font-semibold hover:bg-amber-300 transition"
        >
          Get a callback
        </a>
      </nav>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/*  Hero                                                            */
/* ---------------------------------------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18),_transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-amber-300 mb-4">
            Buy · Live · Invest in Turkey
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Your trusted partner from <span className="text-amber-400">first viewing</span> to
            <span className="text-amber-400"> long after the keys</span>.
          </h1>
          <p className="mt-6 text-slate-300 max-w-xl">
            Curated coastal homes, city investments, and citizenship-eligible
            projects — backed by an aftersales team that stays with you for
            years, not weeks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#properties"
              className="rounded-full bg-amber-400 text-[#0B1320] px-6 py-3 font-semibold hover:bg-amber-300"
            >
              Browse properties
            </a>
            <a
              href="#aftersales"
              className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:bg-white/5"
            >
              Explore Aftersales →
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            <Stat k="1.4k+" v="Owners served" />
            <Stat k="38" v="Nationalities" />
            <Stat k="14 yr" v="On the ground" />
          </dl>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-[url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200')] bg-cover bg-center" />
          <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-slate-300">Live deal</p>
            <p className="font-semibold">Bodrum sea-view villa</p>
            <p className="text-amber-300 text-sm">€ 695,000 · CBI eligible</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <dt className="text-2xl font-bold text-amber-300">{k}</dt>
      <dd className="text-xs text-slate-400 mt-1">{v}</dd>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  PqT Intelligence — full-width animated ticker bar               */
/* ---------------------------------------------------------------- */
function PqtIntelligenceBar() {
  const items = [
    { label: "Istanbul ↑", value: "+11.4% YoY" },
    { label: "Antalya rental yield", value: "7.9%" },
    { label: "TRY/EUR (30d)", value: "−2.1%" },
    { label: "CBI approvals (Q1)", value: "1,283" },
    { label: "Bodrum prime €/m²", value: "€ 4,820" },
    { label: "New-build pipeline", value: "92 projects" },
    { label: "Mortgage rate (foreign)", value: "from 6.4%" },
    { label: "PqT off-market deals", value: "27 live" },
  ];
  // Duplicate for seamless marquee loop
  const loop = [...items, ...items];
  return (
    <section
      id="intelligence"
      aria-label="PqT Intelligence live market bar"
      className="relative border-y border-white/10 bg-gradient-to-r from-[#0B1320] via-[#11203a] to-[#0B1320]"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-amber-300 font-semibold">
            PqT Intelligence · Live
          </span>
        </div>
        <div className="flex-1 overflow-hidden mask-fade">
          <div className="flex gap-10 whitespace-nowrap animate-marquee">
            {loop.map((it, i) => (
              <span key={i} className="text-sm text-slate-200 inline-flex items-center gap-2">
                <span className="text-slate-400">{it.label}</span>
                <span className="font-semibold text-white">{it.value}</span>
                <span className="text-white/20">·</span>
              </span>
            ))}
          </div>
        </div>
        <a
          href="#intelligence-deep"
          className="hidden md:inline-block shrink-0 text-xs font-semibold text-amber-300 hover:text-amber-200"
        >
          Open dashboard →
        </a>
      </div>

      {/* marquee + fade keyframes (scoped inline so the file is drop-in) */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .mask-fade {
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
                  mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
      `}</style>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  AFTERSALES — featured section (brought forward, dedicated)      */
/* ---------------------------------------------------------------- */
function AftersalesFeature() {
  const services = [
    { icon: "🔑", title: "Title-deed (TAPU) handover", body: "We accompany you to the Land Registry and verify every clause." },
    { icon: "🏗️", title: "Snagging & defect lists", body: "Independent inspection at handover — we negotiate fixes with the developer." },
    { icon: "🛋️", title: "Furnishing & turnkey setup", body: "Curated packages from boutique to luxury, installed before you arrive." },
    { icon: "💧", title: "Utilities & subscriptions", body: "Electricity, water, gas, internet, DASK insurance — opened in your name." },
    { icon: "📈", title: "Rental management", body: "Short-let or long-let with transparent monthly statements." },
    { icon: "🧾", title: "Tax & residency", body: "Annual property tax, residence permit renewals, citizenship follow-up." },
  ];

  return (
    <section
      id="aftersales"
      className="relative py-24 bg-gradient-to-b from-[#0B1320] to-[#0d1830]"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-amber-300 mb-3">
              ★ The reason owners stay with us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Aftersales — the part most agencies <span className="line-through text-slate-500">forget</span>{" "}
              <span className="text-amber-400">we built our name on.</span>
            </h2>
            <p className="mt-5 text-slate-300 max-w-2xl">
              Buying abroad shouldn&apos;t end at the signature. Our dedicated
              aftersales department handles every practical detail of owning
              property in Turkey — so your home works for you whether you
              live in it, rent it, or visit twice a year.
            </p>
          </div>
          <a
            href="#contact"
            className="self-start rounded-full bg-amber-400 text-[#0B1320] px-6 py-3 font-semibold hover:bg-amber-300"
          >
            Talk to the aftersales team
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <article
              key={s.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] hover:border-amber-300/40 transition"
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.body}</p>
              <span className="mt-4 inline-block text-xs text-amber-300 opacity-0 group-hover:opacity-100 transition">
                Learn more →
              </span>
            </article>
          ))}
        </div>

        {/* SLA strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden border border-white/10">
          {[
            ["< 4h", "First response"],
            ["EN · TR · RU · AR", "Spoken in-house"],
            ["365d", "Yearly check-up"],
            ["0 €", "Aftersales onboarding"],
          ].map(([k, v]) => (
            <div key={v} className="p-5 bg-white/[0.03] text-center">
              <p className="text-2xl font-bold text-amber-300">{k}</p>
              <p className="text-xs text-slate-400 mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Services grid                                                   */
/* ---------------------------------------------------------------- */
function ServicesGrid() {
  const items = [
    { t: "Property search", d: "Off-market and pre-launch access in 9 cities." },
    { t: "Citizenship by investment", d: "Full CBI file management from $400k." },
    { t: "Legal & escrow", d: "Independent lawyers, secure FX transfer." },
    { t: "Mortgage facilitation", d: "Foreigner-friendly bank introductions." },
  ];
  return (
    <section id="properties" className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold mb-10">Everything else we do</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {items.map((i) => (
            <div key={i.t} className="rounded-xl bg-white/[0.03] border border-white/10 p-5">
              <h3 className="font-semibold">{i.t}</h3>
              <p className="text-sm text-slate-400 mt-2">{i.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Property showcase                                               */
/* ---------------------------------------------------------------- */
function PropertyShowcase() {
  const props = [
    { city: "Istanbul", price: "€ 312,000", tag: "CBI", img: "1600585154340-be6161a56a0c" },
    { city: "Antalya", price: "€ 189,000", tag: "Beachfront", img: "1502672260266-1c1ef2d93688" },
    { city: "Bodrum",  price: "€ 695,000", tag: "Villa",     img: "1505691938895-1758d7feb511" },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold">Featured properties</h2>
          <a href="#all" className="text-sm text-amber-300 hover:text-amber-200">See all listings →</a>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {props.map((p) => (
            <article key={p.city} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-${p.img}?w=900)` }}
              />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.city}</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/15 text-amber-300">
                    {p.tag}
                  </span>
                </div>
                <p className="text-amber-300 mt-1">{p.price}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Process timeline                                                */
/* ---------------------------------------------------------------- */
function ProcessTimeline() {
  const steps = [
    ["01", "Discovery call", "We learn your goals, budget and timeline."],
    ["02", "Curated shortlist", "3–7 vetted options, no spam."],
    ["03", "Visit & due diligence", "Tour with us, lawyer reviews TAPU."],
    ["04", "Purchase", "Notary, FX, registration — we&apos;re there."],
    ["05", "Aftersales", "The relationship starts here, not ends."],
  ];
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold mb-12">How it works</h2>
        <ol className="grid md:grid-cols-5 gap-4">
          {steps.map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border border-white/10 p-5 bg-white/[0.02]">
              <span className="text-amber-300 font-bold">{n}</span>
              <h3 className="font-semibold mt-2">{t}</h3>
              <p className="text-xs text-slate-400 mt-2" dangerouslySetInnerHTML={{ __html: d }} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Testimonials                                                    */
/* ---------------------------------------------------------------- */
function Testimonials() {
  const quotes = [
    { n: "Sarah & James, UK", q: "Two years after closing they still answer within hours. That's why we sent our friends." },
    { n: "Ahmed, UAE", q: "The aftersales team handled my residency renewal while I was abroad. Worth every lira." },
    { n: "Olga, Russia", q: "PqT Intelligence flagged a price drop I'd never have spotted. Saved me €40k." },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold mb-10">What owners say</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((q) => (
            <figure key={q.n} className="rounded-2xl border border-white/10 p-6 bg-white/[0.03]">
              <blockquote className="text-slate-200 leading-relaxed">“{q.q}”</blockquote>
              <figcaption className="mt-4 text-xs text-slate-400">— {q.n}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  CTA                                                             */
/* ---------------------------------------------------------------- */
function CTASection() {
  return (
    <section
      id="contact"
      className="py-24 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-[#0B1320]"
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold">Ready when you are.</h2>
        <p className="mt-4 text-[#0B1320]/80">
          Tell us where you want to live or invest — we&apos;ll send a tailored
          shortlist and a free PqT Intelligence market snapshot within 24 hours.
        </p>
        <a
          href="mailto:hello@propertyquestturkey.com"
          className="inline-block mt-8 rounded-full bg-[#0B1320] text-white px-8 py-4 font-semibold hover:bg-black"
        >
          Book a free consultation
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Footer                                                          */
/* ---------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="bg-[#070d18] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <p className="text-white font-semibold">Property Quest Turkey</p>
          <p className="mt-3 text-xs leading-relaxed">
            Licensed real-estate consultancy headquartered in Istanbul, with
            offices in Antalya and Bodrum.
          </p>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Explore</p>
          <ul className="space-y-2 text-xs">
            <li><a href="#properties" className="hover:text-white">Properties</a></li>
            <li><a href="#aftersales" className="hover:text-white">Aftersales</a></li>
            <li><a href="#intelligence" className="hover:text-white">PqT Intelligence</a></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Contact</p>
          <ul className="space-y-2 text-xs">
            <li>hello@propertyquestturkey.com</li>
            <li>+90 (212) 000-0000</li>
            <li>Levent, Istanbul</li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Legal</p>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-white">Privacy</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">License #00000</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs">
        © {new Date().getFullYear()} Property Quest Turkey · All rights reserved
      </div>
    </footer>
  );
}
