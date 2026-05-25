import { motion } from 'framer-motion'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'
import OpportunityCard from './OpportunityCard'
import MacroComparison from './MacroComparison'
import { useTheme } from '../ThemeContext'
import { downloadCsv } from '../utils/exportCsv'

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'
const pct = n => n != null ? `${Number(n).toFixed(1)}%` : '—'

// ── Category definitions ──────────────────────────────────────────────────────
const DEAL_CATEGORIES = [
  {
    key: 'listed', label: 'Top MLS Opportunities', labelEs: 'Mejores Oportunidades MLS',
    icon: '🏆', color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)',
    desc: (n, t) => t(`${n} live MLS listings — real Zillow & Redfin links`, `${n} listados MLS en vivo — links reales a Zillow y Redfin`),
  },
  {
    key: 'Foreclosure', label: 'Foreclosure', labelEs: 'Ejecuciones Hipotecarias',
    icon: '⚖️', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
    desc: (n, t) => t('Homeowners 30–120 days behind — skip-trace before auction', 'Propietarios con 30–120 días de atraso — skip-trace antes de la subasta'),
  },
  {
    key: 'Tax Delinquency', label: 'Tax Delinquencies', labelEs: 'Deudas de Impuestos',
    icon: '💸', color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',
    desc: (n, t) => t('2+ years behind on property taxes — highest motivation to sell', 'Más de 2 años sin pagar impuestos — mayor motivación para vender'),
  },
  {
    key: 'Property Issues', label: 'Property Issues', labelEs: 'Problemas de Propiedad',
    icon: '🏚', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)',
    desc: (n, t) => t('Code violations, structural issues — owners want out at a discount', 'Violaciones de código, problemas estructurales — propietarios quieren salir con descuento'),
  },
  {
    key: 'Inherited House', label: 'Inherited Houses', labelEs: 'Casas Heredadas',
    icon: '📋', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)',
    desc: (n, t) => t('Heirs needing to liquidate inherited estates — search probate records', 'Herederos que necesitan liquidar propiedades — busca en registros de sucesión'),
  },
  {
    key: 'Relocations', label: 'Relocations', labelEs: 'Reubicaciones',
    icon: '🚚', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)',
    desc: (n, t) => t('Job-transfer sellers need to close fast — strong negotiating position', 'Vendedores por reubicación necesitan cerrar rápido — posición de negociación fuerte'),
  },
  {
    key: 'Fire Damage', label: 'Fire Damage / Distressed', labelEs: 'Daño por Incendio / Angustia',
    icon: '🔥', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',
    desc: (n, t) => t('Fire-damaged or severely distressed — deep discounts, high rehab upside', 'Daño por incendio o muy deterioradas — grandes descuentos, alto potencial de renovación'),
  },
  {
    key: 'Bank Owned', label: 'Bank Owned Houses', labelEs: 'Casas de Banco (REO)',
    icon: '🏦', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)',
    desc: (n, t) => t('REO properties — banks sell below market to recover loan losses', 'Propiedades REO — bancos venden por debajo del mercado para recuperar pérdidas'),
  },
  {
    key: 'Too Many Liens', label: 'Too Many Liens', labelEs: 'Demasiados Gravámenes',
    icon: '⛓', color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.25)',
    desc: (n, t) => t('Mechanic/HOA/judgment liens trapping owners — creative deal structures work', 'Gravámenes de trabajo/HOA/sentencias — estructuras creativas de trato funcionan'),
  },
  {
    key: 'No/Low Equity', label: 'No / Low Equity', labelEs: 'Sin / Poca Equidad',
    icon: '📉', color: '#facc15', bg: 'rgba(250,204,21,0.08)', border: 'rgba(250,204,21,0.25)',
    desc: (n, t) => t('Underwater or low-equity owners facing hardship — short sale or sub2 plays', 'Propietarios sin o poca equidad en apuros — compra sujeta o venta corta'),
  },
  {
    key: 'Price Drop', label: 'Price Drop Properties', labelEs: 'Propiedades con Rebaja',
    icon: '🏷', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
    desc: (n, t) => t('MLS listings with confirmed price cuts — motivation is proven', 'Listados MLS con rebajas confirmadas — motivación del vendedor probada'),
  },
  {
    key: 'Fixer-Upper', label: 'Fixer-Upper Properties', labelEs: 'Propiedades para Renovar',
    icon: '🔨', color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',
    desc: (n, t) => t('Older properties needing rehab — maximum value-add upside', 'Propiedades que necesitan renovación — máximo potencial de valor'),
  },
  {
    key: 'Extended DOM', label: 'Extended Days on Market', labelEs: 'Días Extendidos en Mercado',
    icon: '⏳', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)',
    desc: (n, t) => t('45+ days listed — seller fatigue opens door to creative offers', 'Más de 45 días en mercado — el cansancio del vendedor abre la puerta'),
  },
]

// ── Export helpers ────────────────────────────────────────────────────────────
function printSection(opps, title) {
  const fmtP = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

  // Inline deal-score logic (mirrors OpportunityCard — no JSX here)
  function getDealScore(opp) {
    if (opp.dealScore) return Number(opp.dealScore)
    let pts = 0
    const dom = opp.daysOnMarket || 0
    if (dom > 90) pts += 25; else if (dom > 60) pts += 18; else if (dom > 30) pts += 10; else if (dom > 14) pts += 5
    const eq = opp.arv && opp.listPrice ? ((opp.arv - opp.listPrice) / opp.arv) * 100 : 0
    if (eq >= 35) pts += 30; else if (eq >= 25) pts += 22; else if (eq >= 15) pts += 14; else if (eq >= 5) pts += 7
    if (opp.yearBuilt) { if (opp.yearBuilt < 1960) pts += 20; else if (opp.yearBuilt < 1975) pts += 14; else if (opp.yearBuilt < 1990) pts += 8 }
    const ppsf = opp.sqft && opp.listPrice ? opp.listPrice / opp.sqft : null
    if (ppsf !== null) { if (ppsf < 55) pts += 15; else if (ppsf < 80) pts += 10; else if (ppsf < 110) pts += 5 }
    const HIGH = ['Foreclosure','Tax Delinquency','Fire Damage','Bank Owned','Price Drop']
    const MED  = ['Property Issues','Inherited House','Too Many Liens','Fixer-Upper']
    if (HIGH.some(t => opp.type?.includes(t))) pts += 10; else if (MED.some(t => opp.type?.includes(t))) pts += 6; else pts += 3
    return Math.max(1, Math.min(10, Math.round(pts / 10)))
  }
  function getScoreStyle(s) {
    if (s >= 9) return { label:'HOT DEAL', color:'#15803d', bg:'#dcfce7', border:'#86efac' }
    if (s >= 7) return { label:'STRONG',   color:'#b45309', bg:'#fef3c7', border:'#fcd34d' }
    if (s >= 5) return { label:'SOLID',    color:'#1d4ed8', bg:'#dbeafe', border:'#93c5fd' }
    if (s >= 3) return { label:'AVERAGE',  color:'#c2410c', bg:'#ffedd5', border:'#fdba74' }
    return              { label:'PASS',    color:'#b91c1c', bg:'#fee2e2', border:'#fca5a5' }
  }
  function getTypeColor(type) {
    const M = {'Foreclosure':'#dc2626','Tax Delinquency':'#ea580c','Property Issues':'#7c3aed','Inherited House':'#475569','Relocations':'#059669','Fire Damage':'#ea580c','Bank Owned':'#2563eb','Too Many Liens':'#7c3aed','No/Low Equity':'#ca8a04','Price Drop':'#dc2626','Fixer-Upper':'#ea580c','Extended DOM':'#2563eb'}
    return M[type] || '#2563eb'
  }
  function getInsight(opp) {
    const b = []
    const dom = opp.daysOnMarket || 0
    if (dom > 90) b.push(`🔥 ${dom} days on market — seller is highly motivated, deep discount likely`)
    else if (dom > 45) b.push(`⏳ ${dom} days on market — above-average DOM, price reduction incoming`)
    else if (dom > 20) b.push(`📅 ${dom} days on market — mild motivation, worth opening a conversation`)
    if (opp.yearBuilt && opp.yearBuilt < 1970) b.push(`🏚 Built ${opp.yearBuilt} — likely needs full rehab (roof, plumbing, electrical)`)
    else if (opp.yearBuilt && opp.yearBuilt < 1985) b.push(`🔨 Built ${opp.yearBuilt} — cosmetic + mechanical updates probable`)
    const ppsf = opp.sqft && opp.listPrice ? Math.round(opp.listPrice / opp.sqft) : null
    if (ppsf !== null && ppsf < 60) b.push(`💰 Only $${ppsf}/sqft — well below market; exceptional value-add opportunity`)
    else if (ppsf !== null && ppsf < 100) b.push(`📊 $${ppsf}/sqft — below-market pricing creates meaningful profit room`)
    const profit = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
    if (profit && profit >= 30000) b.push(`🚀 Est. $${Number(profit).toLocaleString()} wholesale profit at 70% ARV offer`)
    else if (profit && profit >= 15000) b.push(`✅ Est. $${Number(profit).toLocaleString()} wholesale profit at 70% ARV offer`)
    const eq = opp.arv && opp.listPrice ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
    if (eq && eq >= 25) b.push(`💎 ${eq}% spread between list price and ARV — strong equity play`)
    if (opp.type === 'Price Drop') b.push('📉 Price has already been cut — seller motivation is confirmed')
    if (b.length === 0) b.push('📋 Verify comps and run a full repair estimate before offering')
    return b
  }

  const cards = opps.map(opp => {
    const score   = getDealScore(opp)
    const ss      = getScoreStyle(score)
    const tc      = getTypeColor(opp.type)
    const profit  = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
    const equity  = opp.arv && opp.listPrice ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
    const isLstd  = opp.isListed === true
    const bullets = getInsight(opp)

    const agentHtml = (opp.agentName || opp.agentPhone || opp.agentEmail || opp.officeName) ? `
      <div class="sbox blue-box">
        <div class="slabel" style="color:#1d4ed8">📞 LISTING AGENT</div>
        ${opp.agentName  ? `<div class="row2"><span>Agent</span><span>${opp.agentName}</span></div>` : ''}
        ${opp.agentPhone ? `<div class="row2"><span>Phone</span><a href="tel:${opp.agentPhone}" style="color:#2563eb">${opp.agentPhone}</a></div>` : ''}
        ${opp.agentEmail ? `<div class="row2"><span>Email</span><a href="mailto:${opp.agentEmail}" style="color:#2563eb">${opp.agentEmail}</a></div>` : ''}
        ${opp.officeName ? `<div class="row2"><span>Brokerage</span><span>${opp.officeName}</span></div>` : ''}
      </div>` : ''

    const countyHtml = (!isLstd && opp.countySearchUrl) ? `
      <div class="sbox purple-box">
        <div class="slabel" style="color:#6d28d9">🏛 RESEARCH LINK</div>
        <p style="font-size:11px;color:#374151;margin:3px 0">${opp.countySearchLabel || 'County Records'}</p>
        ${opp.countySearchTip ? `<p style="font-size:10px;color:#6b7280;margin:2px 0">💡 ${opp.countySearchTip}</p>` : ''}
        <a href="${opp.countySearchUrl}" style="font-size:11px;color:#7c3aed;font-weight:700">🔗 Open County Records →</a>
      </div>` : ''

    const noteHtml = opp.note ? `
      <div class="sbox purple-box">
        <div class="slabel" style="color:#6d28d9">🤖 AI DEAL NOTE</div>
        <p style="font-size:11px;color:#374151;line-height:1.5;margin:3px 0">${opp.note}</p>
      </div>` : ''

    const zillowHtml = opp.zillowUrl ? `
      <a href="${opp.zillowUrl}" class="zillow-btn">🔵 View on Zillow →</a>` : ''

    return `
    <div class="card">
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
        <span class="bdg" style="background:${tc}18;color:${tc};border:1px solid ${tc}44">${opp.type || 'Listing'}</span>
        <span class="bdg" style="background:${ss.bg};color:${ss.color};border:1px solid ${ss.border}">⭐ ${score}/10 ${ss.label}</span>
        <span class="bdg" style="background:${isLstd?'#dcfce7':'#fef9c3'};color:${isLstd?'#166534':'#854d0e'};border:1px solid ${isLstd?'#86efac':'#fde68a'}">${isLstd?'● MLS LISTED':'◆ OFF-MARKET'}</span>
        ${opp.dataSource==='live'        ? '<span class="bdg" style="background:#d1fae5;color:#065f46;border:1px solid #6ee7b7">✓ LIVE DATA</span>' : ''}
        ${opp.dataSource==='ai-estimate' ? '<span class="bdg" style="background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd">🤖 AI ESTIMATE</span>' : ''}
      </div>
      <div class="addr">${opp.address || 'Off-Market Lead — No specific address'}</div>
      <div class="details">
        ${opp.bedBath      ? `<span>🛏 ${opp.bedBath}</span>` : ''}
        ${opp.sqft         ? `<span>📐 ${Number(opp.sqft).toLocaleString()} sqft</span>` : ''}
        ${opp.yearBuilt    ? `<span>🏗 ${opp.yearBuilt}</span>` : ''}
        ${opp.daysOnMarket ? `<span>📅 ${opp.daysOnMarket} days on market</span>` : ''}
        ${opp.mlsNumber    ? `<span>📋 ${opp.mlsNumber}</span>` : ''}
      </div>
      <div class="fins">
        <div class="fin"><div class="fin-l">List Price</div><div class="fin-v" style="color:#ea580c">${fmtP(opp.listPrice)}</div></div>
        <div class="fin"><div class="fin-l">ARV</div><div class="fin-v" style="color:#2563eb">${fmtP(opp.arv)}</div></div>
        <div class="fin"><div class="fin-l">Target Offer (70%)</div><div class="fin-v" style="color:#ea580c">${fmtP(opp.targetOffer)}</div></div>
        <div class="fin"><div class="fin-l">Est. Profit</div><div class="fin-v" style="color:#15803d">${profit ? fmtP(profit) : '—'}</div></div>
      </div>
      ${equity !== null ? `<div class="eq-chip">📈 ${equity}% potential equity spread</div>` : ''}
      <div class="ins-box">
        <div class="ins-title">✦ DEAL INSIGHT</div>
        ${bullets.map(b => `<div class="ins-b">${b}</div>`).join('')}
      </div>
      ${agentHtml}${countyHtml}${noteHtml}${zillowHtml}
    </div>`
  }).join('')

  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><meta charset="utf-8">
  <style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b}
    h1{font-size:22px;font-weight:800;margin-bottom:2px;color:#0f172a}
    .sub{font-size:12px;color:#64748b;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
    .card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:18px;page-break-inside:avoid}
    .bdg{display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.04em}
    .addr{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:5px;line-height:1.4}
    .details{font-size:11px;color:#64748b;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px}
    .fins{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
    .fin{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px}
    .fin-l{font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px}
    .fin-v{font-size:13px;font-weight:700;font-family:'Courier New',monospace}
    .eq-chip{background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:5px 10px;margin-bottom:10px;font-size:11px;color:#15803d;font-weight:600}
    .ins-box{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 12px;margin-bottom:10px}
    .ins-title{font-size:10px;font-weight:800;color:#15803d;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
    .ins-b{font-size:11px;color:#166534;line-height:1.5;margin:2px 0}
    .sbox{border-radius:8px;padding:10px 12px;margin-bottom:10px}
    .blue-box{background:#eff6ff;border:1px solid #bfdbfe}
    .purple-box{background:#faf5ff;border:1px solid #ddd6fe}
    .slabel{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
    .row2{display:flex;justify-content:space-between;font-size:11px;padding:2px 0;color:#374151}
    .zillow-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;color:#2563eb;text-decoration:none;font-size:11px;font-weight:700;margin-top:6px}
    @media print{body{background:white;padding:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.grid{gap:12px}}
  </style></head><body>
  <h1>${title}</h1>
  <div class="sub">DealRadar AI · ${new Date().toLocaleDateString()} · ${opps.length} result${opps.length === 1 ? '' : 's'}</div>
  <div class="grid">${cards}</div>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`)
  win.document.close()
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#3b82f6', icon }) {
  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ background: 'var(--dr-grad-card)', border: `1px solid ${color}33`, borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 24, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--dr-text-faint)', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  )
}

function VerdictBadge({ verdict }) {
  const cfg = {
    'STRONG BUY': { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.5)', color: '#4ade80', icon: '🟢' },
    'WATCHLIST':  { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.5)',  color: '#facc15', icon: '🟡' },
    'AVOID':      { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)',  color: '#f87171', icon: '🔴' },
  }
  const c = cfg[verdict] || cfg['WATCHLIST']
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {c.icon} {verdict}
    </span>
  )
}

const TIER_COLORS = ['#ef4444', '#f59e0b', '#22c55e']
const TIER_LABELS = ['Aggressive', 'Moderate', 'Highest Acceptable']

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ data, loading, onScanMore, scanLoading, language, t, API = '' }) {
  const { chart } = useTheme()
  if (loading) return <LoadingSkeleton />
  if (!data) return null

  const { city, state, verdict, rationale, wholesalingPlan, metrics, dealTiers = [], opportunities = [], trends = [], macroComparison } = data

  // Group by category
  const grouped = {}
  opportunities.forEach(opp => {
    let key
    if (opp.isListed === true) {
      key = (opp.type === 'Price Drop' || opp.type === 'Fixer-Upper' || opp.type === 'Extended DOM') ? opp.type : 'listed'
    } else {
      key = opp.type || 'listed'
    }
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(opp)
  })

  const sectionsToRender = DEAL_CATEGORIES.filter(cat => (grouped[cat.key] || []).length > 0)

  const trendData = trends.map(tr => ({
    ...tr, medianPrice: Number(tr.medianPrice), daysOnMarket: Number(tr.daysOnMarket),
  }))

  const slugify = s => s.toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div>
      {/* Header card */}
      <div className="print-card" style={{ background: 'var(--dr-grad-header-card)', border: '1px solid var(--dr-border-blue)', borderRadius: 20, padding: '28px 32px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              {t('Market Intelligence Report', 'Informe de Inteligencia de Mercado')}
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, color: 'var(--dr-text-1)', letterSpacing: '-1.5px', marginBottom: 12 }}>
              {city}{state ? `, ${state}` : ''}
            </h1>
            <VerdictBadge verdict={verdict} />
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadCsv(opportunities, `dealradar-${slugify(city || 'leads')}-all.csv`)}
              style={{ padding: '9px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9, color: '#4ade80', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ⬇ {t('Export All CSV', 'Exportar Todo CSV')}
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '9px 16px', background: 'var(--dr-surface)', border: '1px solid var(--dr-border-blue)', borderRadius: 9, color: 'var(--dr-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🖨 {t('Print All PDF', 'Imprimir Todo PDF')}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t('Analysis', 'Análisis')}</div>
            <p style={{ color: 'var(--dr-text-3)', fontSize: 14, lineHeight: 1.7 }}>{rationale}</p>
          </div>
          <div style={{ background: 'rgba(124,58,237,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(124,58,237,0.15)' }}>
            <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t('Wholesaling Plan', 'Plan de Mayoreo')}</div>
            <p style={{ color: 'var(--dr-text-3)', fontSize: 14, lineHeight: 1.7 }}>{wholesalingPlan}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label={t('Median Sale Price', 'Precio Mediano')} value={fmt(metrics?.medianSalePrice)} icon="💰" color="#3b82f6" />
        <StatCard label={t('Days on Market', 'Días en Mercado')} value={metrics?.medianDaysOnMarket ?? '—'} sub={t('median days', 'días promedio')} icon="📅" color="#8b5cf6" />
        <StatCard label={t('Sale-to-List Ratio', 'Ratio Venta/Lista')} value={pct(metrics?.saleToListRatio)} icon="📊" color="#06b6d4" />
        <StatCard label={t('Inventory', 'Inventario')} value={metrics?.inventoryDirection ?? '—'} icon="📦" color="#10b981" />
      </div>

      {/* $/sqft market comparison */}
      {data.ppsftComparison && (() => {
        const p = data.ppsftComparison
        const max = Math.max(p.zipAvg, p.cityAvg, p.stateAvg, p.national) * 1.15
        const bar = (label, val, highlight) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <span style={{ width: 110, color: 'var(--dr-text-faint)', flexShrink: 0, fontSize: 11 }}>{label}</span>
            <div style={{ flex: 1, height: 7, background: 'var(--dr-border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min((val/max)*100,100)}%`, height: '100%', background: highlight ? '#3b82f6' : 'rgba(96,165,250,0.35)', borderRadius: 4 }} />
            </div>
            <span style={{ width: 60, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: highlight ? 800 : 600, color: highlight ? '#60a5fa' : 'var(--dr-text-muted)', fontSize: 12 }}>${Number(val).toLocaleString()}</span>
          </div>
        )
        return (
          <div className="print-card" style={{ background: 'var(--dr-surface)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--dr-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              📐 {t('Price Per Sqft — Market Comparison', 'Precio Por Pie² — Comparación de Mercado')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bar(p.zipLabel   || 'ZIP Average', p.zipAvg,   true)}
              {bar(p.cityLabel  || 'City Avg',    p.cityAvg,  false)}
              {bar(p.stateLabel || 'State Avg',   p.stateAvg, false)}
              {bar('National',                    p.national, false)}
            </div>
          </div>
        )
      })()}

      {/* Trend Charts */}
      {trendData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <ChartCard title={t('6-Month Price Trend', 'Tendencia de Precios 6 Meses')} color="#3b82f6">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs><linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid}/>
                <XAxis dataKey="month" tick={{ fill: chart.tick, fontSize: 10 }}/>
                <YAxis tick={{ fill: chart.tick, fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{ background: chart.bg, border: `1px solid ${chart.border}`, borderRadius: 8 }} formatter={v => [fmt(v), t('Median Price','Precio Mediano')]}/>
                <Area type="monotone" dataKey="medianPrice" stroke="#3b82f6" fill="url(#priceGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={t('6-Month Days on Market', 'Días en Mercado 6 Meses')} color="#8b5cf6">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs><linearGradient id="domGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid}/>
                <XAxis dataKey="month" tick={{ fill: chart.tick, fontSize: 10 }}/>
                <YAxis tick={{ fill: chart.tick, fontSize: 10 }}/>
                <Tooltip contentStyle={{ background: chart.bg, border: `1px solid ${chart.border}`, borderRadius: 8 }} formatter={v => [v, t('Days on Market','Días en Mercado')]}/>
                <Area type="monotone" dataKey="daysOnMarket" stroke="#8b5cf6" fill="url(#domGrad)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Deal Tiers */}
      {dealTiers.length > 0 && (
        <div className="print-card" style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 20, padding: '24px', marginBottom: 20 }}>
          <SectionTitle>{t('Wholesale Deal Tiers', 'Niveles de Oferta al Por Mayor')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {dealTiers.map((tier, i) => (
              <motion.div key={tier.tier} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                style={{ background: 'var(--dr-surface-deep)', border: `1px solid ${TIER_COLORS[i]}44`, borderRadius: 14, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TIER_COLORS[i] }}>{tier.tier}</span>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${TIER_COLORS[i]}22`, color: TIER_COLORS[i], fontWeight: 600 }}>{TIER_LABELS[i]}</span>
                </div>
                {[[t('Target Offer','Oferta Objetivo'), fmt(tier.targetOffer), TIER_COLORS[i]],
                  [t('Low Anchor','Ancla Baja'), fmt(tier.lowAnchor), 'var(--dr-text-muted)'],
                  [t('Max Cap','Tope Máximo'), fmt(tier.maxCap), 'var(--dr-text-muted)'],
                  [t('Expected Profit','Ganancia Esperada'), fmt(tier.expectedProfit), '#22c55e'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--dr-border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--dr-text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Scan More header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <SectionTitle>
          {t('Actionable Opportunities', 'Oportunidades de Acción')}
          <span style={{ fontSize: 13, color: 'var(--dr-text-faint)', fontWeight: 400, marginLeft: 8 }}>({opportunities.length})</span>
        </SectionTitle>
        <button onClick={onScanMore} disabled={scanLoading} className="no-print"
          style={{ padding: '10px 20px', background: scanLoading ? 'var(--dr-border-blue)' : 'linear-gradient(135deg, #0f4c8a, #1d3a8a)', border: '1px solid #2563eb44', borderRadius: 10, color: '#93c5fd', fontSize: 13, fontWeight: 600, cursor: scanLoading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
          {scanLoading ? '⏳' : '🔄'} {t('Scan More Leads', 'Escanear Más Leads')}
        </button>
      </div>

      {/* Categorized sections */}
      {sectionsToRender.map((cat, catIdx) => {
        const opps = grouped[cat.key] || []
        const catSlug = slugify(cat.label)
        return (
          <motion.div key={cat.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.05 }} style={{ marginBottom: 36 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${cat.border}`, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: cat.bg, border: `1px solid ${cat.border}`, borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 800, color: cat.color, letterSpacing: '0.04em' }}>
                {cat.icon} {t(cat.label, cat.labelEs)}
              </div>
              <span style={{ fontSize: 12, color: 'var(--dr-text-faint)', flex: 1 }}>{cat.desc(opps.length, t)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, border: `1px solid ${cat.border}`, borderRadius: 12, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                {opps.length} {opps.length === 1 ? t('result','resultado') : t('results','resultados')}
              </span>
              {/* Per-category export buttons */}
              <div className="no-print" style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => downloadCsv(opps, `dealradar-${catSlug}.csv`)}
                  title={t(`Export ${cat.label} as CSV`, `Exportar ${cat.label} como CSV`)}
                  style={{ padding: '5px 11px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 7, color: '#4ade80', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >⬇ CSV</button>
                <button
                  onClick={() => printSection(opps, `${cat.label} — DealRadar AI`)}
                  title={t(`Print ${cat.label} as PDF`, `Imprimir ${cat.label} como PDF`)}
                  style={{ padding: '5px 11px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 7, color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >🖨 PDF</button>
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {opps.map((opp, i) => (
                <OpportunityCard key={`${cat.key}-${opp.address || opp.type}-${i}`} opp={opp} index={i} t={t} API={API} />
              ))}
            </div>
          </motion.div>
        )
      })}

      {opportunities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--dr-text-faintest)', fontSize: 14 }}>
          {t('No opportunities found yet. Click Scan More to search additional lead types.', 'No se encontraron oportunidades. Haz clic en Escanear Más para buscar tipos adicionales.')}
        </div>
      )}

      <MacroComparison macro={macroComparison} localMetrics={metrics} t={t} />
    </div>
  )
}

function ChartCard({ title, color, children }) {
  return (
    <div className="print-card" style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '20px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dr-text-1)', marginBottom: 16 }}>{children}</h2>
}

function LoadingSkeleton() {
  const pulse = { animation: 'pulse 1.5s ease-in-out infinite', background: 'linear-gradient(90deg, var(--dr-surface) 25%, var(--dr-surface-mid) 50%, var(--dr-surface) 75%)' }
  return (
    <div>
      <div style={{ ...pulse, height: 160, borderRadius: 20, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ ...pulse, height: 90, borderRadius: 16 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ ...pulse, height: 200, borderRadius: 16 }} />)}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  )
}
