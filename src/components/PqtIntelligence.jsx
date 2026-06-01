import React, { useState, useMemo } from "react";

/**
 * PqT Intelligence — Property Quest Turkey market-data module
 *
 * Two exports:
 *   <PqtIntelligenceBar />        – the slim animated ticker (drop into any page)
 *   <PqtIntelligenceDashboard />  – the full data view linked from the ticker
 *
 * Default export renders both, stacked, so the file can be previewed alone.
 * Styled with Tailwind utility classes.
 */

/* ---------------------------------------------------------------- */
/*  Mock data (replace with API/feed in production)                 */
/* ---------------------------------------------------------------- */
const TICKER_FEED = [
  { label: "Istanbul",            value: "+11.4% YoY",   trend: "up"   },
  { label: "Antalya rental yield",value: "7.9%",         trend: "up"   },
  { label: "TRY / EUR (30d)",     value: "−2.1%",        trend: "down" },
  { label: "CBI approvals · Q1",  value: "1,283",        trend: "up"   },
  { label: "Bodrum prime €/m²",   value: "€ 4,820",      trend: "up"   },
  { label: "New-build pipeline",  value: "92 projects",  trend: "flat" },
  { label: "Mortgage (foreign)",  value: "from 6.4%",    trend: "down" },
  { label: "PqT off-market",      value: "27 live deals",trend: "up"   },
];

const CITY_INDEX = [
  { city: "Istanbul", median: 312000, yoy: 11.4, yield: 5.8, demand: 92, hot: true  },
  { city: "Antalya",  median: 189000, yoy: 14.7, yield: 7.9, demand: 88, hot: true  },
  { city: "Bodrum",   median: 695000, yoy:  6.2, yield: 6.4, demand: 71, hot: false },
  { city: "Izmir",    median: 154000, yoy:  9.1, yield: 6.1, demand: 64, hot: false },
  { city: "Fethiye",  median: 218000, yoy: 10.3, yield: 7.2, demand: 69, hot: true  },
  { city: "Alanya",   median: 137000, yoy: 12.8, yield: 8.1, demand: 81, hot: true  },
];

const PRICE_HISTORY_12M = [
  100, 101.4, 102.1, 103.6, 104.9, 105.7,
  106.8, 108.0, 109.1, 110.4, 110.9, 111.4,
];

const SIGNALS = [
  { tag: "OPPORTUNITY", title: "Alanya 2+1 dipped 4.2% vs district median",
    body: "Three sub-€140k coastal units listed below comparable stock.",   age: "2h ago"  },
  { tag: "ALERT",       title: "TRY weakening — EUR buyers gain 2.1%",
    body: "Optimal 30-day window to lock FX before notary appointment.",     age: "5h ago"  },
  { tag: "PIPELINE",    title: "New CBI-eligible launch in Beylikdüzü",
    body: "92-unit residence, pre-launch list opens to PqT clients on 14 Jun.", age: "1d ago" },
  { tag: "REGULATION",  title: "Citizenship threshold unchanged at $400k",
    body: "Parliamentary review concluded; no rate change expected in 2026.", age: "3d ago" },
];

/* ---------------------------------------------------------------- */
/*  Ticker Bar                                                      */
/* ---------------------------------------------------------------- */
export function PqtIntelligenceBar() {
  const loop = [...TICKER_FEED, ...TICKER_FEED];
  return (
    <section
      id="intelligence"
      aria-label="PqT Intelligence live market bar"
      className="relative border-y border-white/10 bg-gradient-to-r from-[#0B1320] via-[#11203a] to-[#0B1320] text-slate-100"
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

        <div className="flex-1 overflow-hidden pqt-mask">
          <div className="flex gap-10 whitespace-nowrap pqt-marquee">
            {loop.map((it, i) => (
              <span key={i} className="text-sm inline-flex items-center gap-2">
                <span className="text-slate-400">{it.label}</span>
                <span className="font-semibold text-white">{it.value}</span>
                <TrendGlyph trend={it.trend} />
                <span className="text-white/15">·</span>
              </span>
            ))}
          </div>
        </div>

        <a
          href="#intelligence-dashboard"
          className="hidden md:inline-block shrink-0 text-xs font-semibold text-amber-300 hover:text-amber-200"
        >
          Open dashboard →
        </a>
      </div>

      <style>{`
        @keyframes pqtMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .pqt-marquee { animation: pqtMarquee 40s linear infinite; }
        .pqt-marquee:hover { animation-play-state: paused; }
        .pqt-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
                  mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
      `}</style>
    </section>
  );
}

function TrendGlyph({ trend }) {
  if (trend === "up")   return <span className="text-emerald-400 text-xs">▲</span>;
  if (trend === "down") return <span className="text-rose-400 text-xs">▼</span>;
  return <span className="text-slate-500 text-xs">▬</span>;
}

/* ---------------------------------------------------------------- */
/*  Dashboard                                                       */
/* ---------------------------------------------------------------- */
export function PqtIntelligenceDashboard() {
  const [sortKey, setSortKey] = useState("yoy");
  const [budget, setBudget]   = useState(250000);
  const [horizon, setHorizon] = useState(5);

  const sortedCities = useMemo(
    () => [...CITY_INDEX].sort((a, b) => b[sortKey] - a[sortKey]),
    [sortKey]
  );

  const projection = useMemo(() => {
    // very rough: weighted avg of city YoY, dampened over horizon
    const avgYoy = CITY_INDEX.reduce((s, c) => s + c.yoy, 0) / CITY_INDEX.length / 100;
    const damp   = 0.85; // growth slows
    let value = budget;
    const series = [budget];
    for (let y = 1; y <= horizon; y++) {
      value = value * (1 + avgYoy * Math.pow(damp, y - 1));
      series.push(value);
    }
    return { final: value, series };
  }, [budget, horizon]);

  return (
    <section
      id="intelligence-dashboard"
      className="bg-[#0B1320] text-slate-100 py-20"
    >
      <div className="max-w-7xl mx-auto px-4">
        <Header />

        <div className="mt-12 grid lg:grid-cols-3 gap-5">
          <KpiCard label="Tracked listings"     value="42,180" delta="+3.1% wk" trend="up"   />
          <KpiCard label="Median € / m² · TR"   value="€ 1,940" delta="+1.4% mo" trend="up"   />
          <KpiCard label="Foreign-buyer share"  value="6.8%"    delta="−0.2% mo" trend="down" />
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          <PriceIndexCard />
          <CityIndexCard
            cities={sortedCities}
            sortKey={sortKey}
            onSort={setSortKey}
          />
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-5">
          <SignalsFeed />
          <RoiCalculator
            budget={budget}
            horizon={horizon}
            onBudget={setBudget}
            onHorizon={setHorizon}
            projection={projection}
          />
        </div>

        <DisclosureFooter />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/*  Sub-components                                                  */
/* ---------------------------------------------------------------- */
function Header() {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div>
        <span className="inline-block text-xs uppercase tracking-[0.2em] text-amber-300 mb-3">
          PqT Intelligence
        </span>
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
          The market, <span className="text-amber-400">decoded for owners.</span>
        </h2>
        <p className="mt-4 text-slate-300 max-w-2xl">
          A live read on Turkish real estate — price indices, yields, regulatory
          shifts and PqT&apos;s own off-market deal flow. Updated daily by our
          analyst desk in Istanbul.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Last sync · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, trend }) {
  const color =
    trend === "up"   ? "text-emerald-400"
  : trend === "down" ? "text-rose-400"
                     : "text-slate-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className={`mt-1 text-xs ${color}`}>
        <TrendGlyph trend={trend} /> {delta}
      </p>
    </div>
  );
}

function PriceIndexCard() {
  const data = PRICE_HISTORY_12M;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const W    = 320;
  const H    = 120;
  const pad  = 8;
  const step = (W - pad * 2) / (data.length - 1);
  const y    = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * step} ${y(v)}`).join(" ");
  const area = `${path} L ${pad + (data.length - 1) * step} ${H - pad} L ${pad} ${H - pad} Z`;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-1">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">National price index · 12 mo</h3>
        <span className="text-xs text-emerald-400 font-semibold">+11.4%</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full h-32">
        <defs>
          <linearGradient id="pqtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"    />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#pqtGrad)" />
        <path d={path} fill="none" stroke="#fbbf24" strokeWidth="2" />
      </svg>
      <p className="text-xs text-slate-400 mt-2">
        Base = 100 (Jun 2025). Composite of 6 metropolitan markets.
      </p>
    </article>
  );
}

function CityIndexCard({ cities, sortKey, onSort }) {
  const cols = [
    { k: "median", label: "Median",  format: (v) => `€ ${(v / 1000).toFixed(0)}k` },
    { k: "yoy",    label: "YoY",     format: (v) => `+${v.toFixed(1)}%` },
    { k: "yield",  label: "Yield",   format: (v) => `${v.toFixed(1)}%` },
    { k: "demand", label: "Demand",  format: (v) => `${v}` },
  ];
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">City index</h3>
        <span className="text-xs text-slate-400">Sort:&nbsp;
          {cols.map((c) => (
            <button
              key={c.k}
              onClick={() => onSort(c.k)}
              className={`mx-1 ${sortKey === c.k ? "text-amber-300" : "hover:text-white"}`}
            >
              {c.label}
            </button>
          ))}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-400">
            <tr className="border-b border-white/10">
              <th className="text-left font-normal py-2">City</th>
              {cols.map((c) => (
                <th key={c.k} className="text-right font-normal py-2">{c.label}</th>
              ))}
              <th className="text-right font-normal py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.city} className="border-b border-white/5 last:border-0">
                <td className="py-3 font-medium">
                  {c.city}{" "}
                  {c.hot && (
                    <span className="ml-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300">
                      hot
                    </span>
                  )}
                </td>
                {cols.map((col) => (
                  <td key={col.k} className="py-3 text-right tabular-nums">
                    {col.format(c[col.k])}
                  </td>
                ))}
                <td className="py-3 text-right">
                  <DemandBar value={c.demand} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function DemandBar({ value }) {
  return (
    <div className="inline-flex w-20 h-1.5 bg-white/10 rounded overflow-hidden align-middle">
      <div
        className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SignalsFeed() {
  const tone = {
    OPPORTUNITY: "bg-emerald-500/15 text-emerald-300",
    ALERT:       "bg-amber-500/15  text-amber-300",
    PIPELINE:    "bg-sky-500/15    text-sky-300",
    REGULATION:  "bg-violet-500/15 text-violet-300",
  };
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Signals</h3>
        <a href="#all-signals" className="text-xs text-amber-300 hover:text-amber-200">
          View all →
        </a>
      </div>
      <ul className="space-y-4">
        {SIGNALS.map((s) => (
          <li key={s.title} className="flex gap-3">
            <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-1 rounded ${tone[s.tag]} h-fit`}>
              {s.tag}
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm leading-snug">{s.title}</p>
              <p className="text-xs text-slate-400 mt-1">{s.body}</p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-500">{s.age}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RoiCalculator({ budget, horizon, onBudget, onHorizon, projection }) {
  const W = 320, H = 100, pad = 6;
  const data = projection.series;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const step = (W - pad * 2) / (data.length - 1);
  const y    = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * step} ${y(v)}`).join(" ");

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Projection calculator</h3>
        <span className="text-xs text-slate-400">Indicative · model assumptions</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <label className="text-xs text-slate-400 block">
          Budget (€)
          <input
            type="number"
            min={50000}
            step={10000}
            value={budget}
            onChange={(e) => onBudget(Number(e.target.value))}
            className="mt-1 w-full bg-[#0B1320] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 outline-none"
          />
        </label>
        <label className="text-xs text-slate-400 block">
          Horizon — {horizon} year{horizon === 1 ? "" : "s"}
          <input
            type="range"
            min={1}
            max={10}
            value={horizon}
            onChange={(e) => onHorizon(Number(e.target.value))}
            className="mt-3 w-full accent-amber-400"
          />
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
        <path d={path} fill="none" stroke="#34d399" strokeWidth="2" />
      </svg>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">Projected value</p>
          <p className="text-2xl font-bold text-emerald-300">
            € {Math.round(projection.final).toLocaleString("en-US")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Gain</p>
          <p className="text-sm font-semibold text-emerald-300">
            +€ {Math.round(projection.final - budget).toLocaleString("en-US")}
          </p>
        </div>
      </div>
    </article>
  );
}

function DisclosureFooter() {
  return (
    <p className="mt-10 text-[11px] text-slate-500 max-w-3xl leading-relaxed">
      PqT Intelligence is provided for informational purposes only and does not
      constitute investment advice. Figures are aggregated from public listings,
      land-registry transfers and PqT&apos;s internal pipeline; past performance
      is not indicative of future results.
    </p>
  );
}

/* ---------------------------------------------------------------- */
/*  Default — full preview                                          */
/* ---------------------------------------------------------------- */
export default function PqtIntelligence() {
  return (
    <div className="min-h-screen bg-[#0B1320] text-slate-100 font-sans antialiased">
      <PqtIntelligenceBar />
      <PqtIntelligenceDashboard />
    </div>
  );
}
