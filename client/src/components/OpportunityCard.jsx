import { useState } from 'react'
import { motion } from 'framer-motion'
import AIToolsModal from './AIToolsModal'
import { isSaved, saveDeal, unsaveDeal, oppToSaveEntry } from '../utils/savedDeals'

// Build a stable, deterministic id for an opp (no timestamp) for save-state tracking
function buildOppSaveId(opp, source) {
  const addr = (opp.address || opp.type || 'unknown').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  return `${source}-${addr}`
}

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

// ── Formula-based deal score (1–10) ──────────────────────────────────────────
function calculateDealScore(opp) {
  let pts = 0

  // DOM (0–25)
  const dom = opp.daysOnMarket || 0
  if (dom > 90) pts += 25
  else if (dom > 60) pts += 18
  else if (dom > 30) pts += 10
  else if (dom > 14) pts += 5

  // Equity spread (0–30)
  const equity = opp.arv && opp.listPrice
    ? ((opp.arv - opp.listPrice) / opp.arv) * 100 : 0
  if (equity >= 35) pts += 30
  else if (equity >= 25) pts += 22
  else if (equity >= 15) pts += 14
  else if (equity >= 5)  pts += 7

  // Year built / rehab potential (0–20)
  if (opp.yearBuilt) {
    if (opp.yearBuilt < 1960) pts += 20
    else if (opp.yearBuilt < 1975) pts += 14
    else if (opp.yearBuilt < 1990) pts += 8
  }

  // Price per sqft (0–15)
  const ppsf = opp.sqft && opp.listPrice ? opp.listPrice / opp.sqft : null
  if (ppsf !== null) {
    if (ppsf < 55)  pts += 15
    else if (ppsf < 80)  pts += 10
    else if (ppsf < 110) pts += 5
  }

  // Distress type urgency (0–10)
  const HIGH = ['Foreclosure','Tax Delinquency','Fire Damage','Bank Owned','Price Drop']
  const MED  = ['Property Issues','Inherited House','Too Many Liens','Fixer-Upper']
  if (HIGH.some(t => opp.type?.includes(t))) pts += 10
  else if (MED.some(t => opp.type?.includes(t))) pts += 6
  else pts += 3

  return Math.max(1, Math.min(10, Math.round(pts / 10)))
}

function scoreStyle(score) {
  if (score >= 9) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   label: 'HOT DEAL' }
  if (score >= 7) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  label: 'STRONG'   }
  if (score >= 5) return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  label: 'SOLID'    }
  if (score >= 3) return { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.35)',  label: 'AVERAGE'  }
  return              { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   label: 'PASS'     }
}

// ── Deal insight engine ───────────────────────────────────────────────────────
function generateInsight(opp) {
  const bullets = []

  if (opp.daysOnMarket > 90)       bullets.push(`🔥 ${opp.daysOnMarket} days on market — seller is highly motivated, deep discount likely`)
  else if (opp.daysOnMarket > 45)  bullets.push(`⏳ ${opp.daysOnMarket} days on market — above-average DOM signals price reduction incoming`)
  else if (opp.daysOnMarket > 20)  bullets.push(`📅 ${opp.daysOnMarket} days on market — mild motivation, worth opening a conversation`)

  if (opp.yearBuilt && opp.yearBuilt < 1970)       bullets.push(`🏚 Built ${opp.yearBuilt} — likely needs full rehab (roof, plumbing, electrical, foundation)`)
  else if (opp.yearBuilt && opp.yearBuilt < 1985)  bullets.push(`🔨 Built ${opp.yearBuilt} — cosmetic + mechanical updates probable; budget accordingly`)

  const ppsf = opp.sqft && opp.listPrice ? Math.round(opp.listPrice / opp.sqft) : null
  if (ppsf !== null && ppsf < 60)       bullets.push(`💰 Only $${ppsf}/sqft — well below market; exceptional value-add opportunity`)
  else if (ppsf !== null && ppsf < 100) bullets.push(`📊 $${ppsf}/sqft — below-market pricing creates meaningful profit room`)

  const profit = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
  if (profit && profit >= 30000)       bullets.push(`🚀 Est. $${Number(profit).toLocaleString()} wholesale profit at 70% ARV offer`)
  else if (profit && profit >= 15000)  bullets.push(`✅ Est. $${Number(profit).toLocaleString()} wholesale profit at 70% ARV offer`)

  const equity = opp.arv && opp.listPrice
    ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
  if (equity && equity >= 25) bullets.push(`💎 ${equity}% spread between list price and ARV — strong equity play`)

  if (opp.type === 'Price Drop') bullets.push('📉 Price has already been cut — seller motivation is confirmed')

  if (bullets.length === 0) bullets.push('📋 Standard listing — verify comps and run a full repair estimate before offering')

  return { bullets }
}

const TYPE_STYLES = {
  'Foreclosure':     { color: '#f87171', icon: '⚖️',  bg: 'rgba(239,68,68,0.1)'    },
  'Tax Delinquency': { color: '#fb923c', icon: '💸',  bg: 'rgba(249,115,22,0.1)'   },
  'Property Issues': { color: '#a78bfa', icon: '🏚',  bg: 'rgba(167,139,250,0.1)'  },
  'Inherited House': { color: '#94a3b8', icon: '📋',  bg: 'rgba(148,163,184,0.1)'  },
  'Relocations':     { color: '#34d399', icon: '🚚',  bg: 'rgba(52,211,153,0.1)'   },
  'Fire Damage':     { color: '#f97316', icon: '🔥',  bg: 'rgba(249,115,22,0.1)'   },
  'Bank Owned':      { color: '#60a5fa', icon: '🏦',  bg: 'rgba(96,165,250,0.1)'   },
  'Too Many Liens':  { color: '#c084fc', icon: '⛓',  bg: 'rgba(192,132,252,0.1)'  },
  'No/Low Equity':   { color: '#facc15', icon: '📉',  bg: 'rgba(250,204,21,0.1)'   },
  'Price Drop':      { color: '#f87171', icon: '📉',  bg: 'rgba(239,68,68,0.1)'    },
  'Fixer-Upper':     { color: '#fb923c', icon: '🔨',  bg: 'rgba(249,115,22,0.1)'   },
  'Extended DOM':    { color: '#60a5fa', icon: '⏳',  bg: 'rgba(96,165,250,0.1)'   },
  'Pre-Foreclosure': { color: '#f87171', icon: '⚠️',  bg: 'rgba(239,68,68,0.1)'    },
  'Probate':         { color: '#94a3b8', icon: '📋',  bg: 'rgba(148,163,184,0.1)'  },
  'default':         { color: '#60a5fa', icon: '🏠',  bg: 'rgba(96,165,250,0.1)'   },
}
function getTypeStyle(type) {
  const key = Object.keys(TYPE_STYLES).find(k => type?.includes(k)) || 'default'
  return TYPE_STYLES[key]
}

function buildZillowUrl(address) {
  const slug = address.replace(/,/g, '').replace(/\s+/g, '-')
  return `https://www.zillow.com/homes/${encodeURIComponent(slug)}_rb/`
}
function buildRedfinUrl(address) {
  return `https://www.redfin.com/search?location=${encodeURIComponent(address)}`
}

function ContactRow({ label, value, href }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ color: 'var(--dr-text-faint)', flexShrink: 0, minWidth: 60 }}>{label}</span>
      {href
        ? <a href={href} style={{ color: '#93c5fd', fontWeight: 600, textDecoration: 'none', textAlign: 'right', wordBreak: 'break-all' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >{value}</a>
        : <span style={{ color: 'var(--dr-text-2)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
      }
    </div>
  )
}

// ── AI Lead Target card (off-market category stub, no address) ────────────────
function AILeadTargetCard({ opp, index, t }) {
  const style = getTypeStyle(opp.type)
  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ background: 'var(--dr-grad-card-alt)', border: '1px solid var(--dr-border)', borderRadius: 18, padding: '20px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.25)', color: '#fbbf24', letterSpacing: '0.06em' }}>◆ OFF-MARKET</span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: style.bg, border: `1px solid ${style.color}44`, borderRadius: 20, padding: '4px 12px', marginBottom: 12, fontSize: 11, fontWeight: 700, color: style.color }}>
        {style.icon} {opp.type}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>{t('AI-Identified Lead Category', 'Categoría de Lead Identificada por IA')}</div>
          <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', lineHeight: 1.5 }}>{t('No specific address — use skip-tracing to find properties in this category', 'Sin dirección específica — usa skip-tracing para encontrar propiedades en esta categoría')}</div>
        </div>
      </div>
      {opp.note && (
        <div style={{ background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: 'var(--dr-text-3)', lineHeight: 1.6 }}>
          💡 {opp.note}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
        🔍 {t('Use BatchSkipTracing.com or PropStream to find specific owners', 'Usa BatchSkipTracing.com o PropStream para encontrar propietarios específicos')}
      </div>
      {opp.countySearchUrl && (
        <div style={{ marginBottom: 10 }}>
          <a href={opp.countySearchUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8, padding: '9px 12px', color: '#c4b5fd', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
          >🏛 {opp.countySearchLabel || t('Search County Records', 'Buscar Registros del Condado')}</a>
          {opp.countySearchTip && (
            <div style={{ marginTop: 5, fontSize: 10, color: 'var(--dr-text-faintest)', lineHeight: 1.5, paddingLeft: 4 }}>💡 {opp.countySearchTip}</div>
          )}
        </div>
      )}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}>🔵 {t('Not on Zillow', 'No en Zillow')}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}>🔴 {t('Not on Redfin', 'No en Redfin')}</div>
      </div>
    </motion.div>
  )
}

// ── Real / AI-estimate listing card ──────────────────────────────────────────
export default function OpportunityCard({ opp, index, t, API = '', source = 'finder' }) {
  const [showAITools, setShowAITools] = useState(false)
  const saveId = buildOppSaveId(opp, source)
  const [savedState, setSavedState] = useState(() => isSaved(saveId))

  function handleSave() {
    if (savedState) {
      unsaveDeal(saveId)
      setSavedState(false)
    } else {
      const entry = { ...oppToSaveEntry(opp, source), id: saveId }
      saveDeal(entry)
      setSavedState(true)
    }
  }

  if ((opp.dataSource === 'ai-target' || opp.address == null) && opp.dataSource !== 'ai-estimate') {
    return <AILeadTargetCard opp={opp} index={index} t={t} />
  }

  const style      = getTypeStyle(opp.type)
  const profit     = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
  const equity     = opp.arv && opp.listPrice   ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
  const listed     = opp.isListed === true
  const isLive     = opp.dataSource === 'live'
  const dealScore  = opp.dealScore || calculateDealScore(opp)
  const ss         = scoreStyle(dealScore)
  const zillowHref = opp.zillowUrl || (opp.address ? buildZillowUrl(opp.address) : null)
  const redfinHref = opp.redfinUrl || (opp.address ? buildRedfinUrl(opp.address) : null)

  return (
    <>
      <motion.div
        className="print-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        style={{ background: 'var(--dr-grad-card-alt)', border: `1px solid ${listed ? 'var(--dr-border-blue)' : 'var(--dr-border)'}`, borderRadius: 18, padding: '20px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Top-right badges */}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {listed
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', letterSpacing: '0.06em' }}>● MLS LISTED</span>
            : <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.25)', color: '#fbbf24', letterSpacing: '0.06em' }}>◆ OFF-MARKET</span>
          }
          {isLive && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', letterSpacing: '0.05em' }}>✓ LIVE DATA</span>
          )}
          {opp.dataSource === 'ai-estimate' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd', letterSpacing: '0.05em' }}>🤖 AI ESTIMATE</span>
          )}
        </div>

        {/* Type badge + deal score on same row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: style.bg, border: `1px solid ${style.color}44`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: style.color }}>
            {style.icon} {opp.type}
          </div>
          {/* Deal Score badge */}
          <div
            title={`AI Deal Score: ${dealScore}/10 — ${ss.label}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: ss.color, cursor: 'default' }}
          >
            ⭐ {dealScore}/10
            <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.85 }}>{ss.label}</span>
          </div>
        </div>

        {/* Address */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dr-text-1)', marginBottom: 4, lineHeight: 1.4, paddingRight: 80 }}>
          {opp.address}
        </div>

        {/* Sub-details */}
        {(() => {
          const ppsf = opp.sqft && opp.listPrice ? Math.round(opp.listPrice / opp.sqft) : null
          return (
            <div style={{ fontSize: 11, color: '#c8d3e6', marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {opp.bedBath    && <span>🛏 {opp.bedBath}</span>}
              {opp.sqft       && <span>📐 {Number(opp.sqft).toLocaleString()} sqft</span>}
              {opp.yearBuilt  && <span>🏗 {opp.yearBuilt}</span>}
              {opp.daysOnMarket > 0 && <span>📅 {opp.daysOnMarket} {t('days', 'días')}</span>}
              {ppsf !== null  && <span style={{ color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>📐 ${ppsf.toLocaleString()}/sqft</span>}
            </div>
          )
        })()}

        {/* Financial grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            [t('List Price', 'Precio Lista'),         fmt(opp.listPrice),   '#f97316'],
            [t('ARV', 'Valor ARV'),                   fmt(opp.arv),         '#60a5fa'],
            [t('Target Offer (70%)', 'Oferta (70%)'), fmt(opp.targetOffer), '#f97316'],
            [t('Est. Profit', 'Ganancia Est.'),        profit ? fmt(profit) : '—', '#22c55e'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: 'var(--dr-surface-deep)', borderRadius: 8, padding: '9px 11px' }}>
              <div style={{ fontSize: 10, color: 'var(--dr-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</div>
            </div>
          ))}
        </div>

        {equity !== null && (
          <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontSize: 11, color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            📈 {equity}% {t('potential equity spread', 'diferencial de equidad potencial')}
          </div>
        )}

        {/* Deal insight */}
        {(() => {
          const { bullets } = generateInsight(opp)
          return (
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 10, padding: '11px 13px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', letterSpacing: '0.08em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                ✦ {t('DEAL INSIGHT', 'ANÁLISIS DEL DEAL')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#86efac', lineHeight: 1.55 }}>{b}</div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Action buttons */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {listed ? (
            <>
              <a href={zillowHref} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'rgba(0,115,184,0.15)', border: '1px solid rgba(0,115,184,0.4)', color: '#60a5fa', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,115,184,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,115,184,0.15)'}>
                🔵 {t('View on Zillow', 'Ver en Zillow')}
              </a>
              <a href={redfinHref} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.4)', color: '#fca5a5', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,0,0,0.15)'}>
                🔴 {t('View on Redfin', 'Ver en Redfin')}
              </a>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}>🔵 {t('Not on Zillow', 'No en Zillow')}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}>🔴 {t('Not on Redfin', 'No en Redfin')}</div>
            </>
          )}
        </div>

        {/* Bottom action row: AI Tools + Save */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 0 }}>
          <button
            onClick={() => setShowAITools(true)}
            style={{
              padding: '9px 12px', borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.12))',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(37,99,235,0.22))'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.12))'}
          >
            🤖 {t('AI Tools — Scripts & Deal Memo', 'Herramientas IA — Scripts y Memo')}
          </button>
          {/* 💾 Save to Deal Bank */}
          <button
            onClick={handleSave}
            title={savedState ? t('Remove from Deal Bank', 'Quitar del Banco') : t('Save to Deal Bank', 'Guardar en Banco')}
            style={{
              padding: '9px 13px', borderRadius: 8, cursor: 'pointer',
              background: savedState ? 'rgba(34,197,94,0.12)' : 'var(--dr-surface-deep)',
              border: savedState ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--dr-border)',
              color: savedState ? '#4ade80' : 'var(--dr-text-faint)',
              fontSize: 14, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
            onMouseEnter={e => !savedState && (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)')}
            onMouseLeave={e => !savedState && (e.currentTarget.style.borderColor = 'var(--dr-border)')}
          >
            {savedState ? '✅' : '💾'}
          </button>
        </div>

        {/* Listing agent contact (MLS live data) */}
        {listed && isLive && (opp.agentName || opp.agentPhone || opp.officeName) && (
          <div style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: 10, padding: '11px 13px', marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#60a5fa', letterSpacing: '0.08em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
              📞 {t('LISTING AGENT', 'AGENTE DE LISTADO')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {opp.agentName  && <ContactRow label="Agent"     value={opp.agentName} />}
              {opp.agentPhone && <ContactRow label="Phone"     value={opp.agentPhone} href={`tel:${opp.agentPhone}`} />}
              {opp.agentEmail && <ContactRow label="Email"     value={opp.agentEmail} href={`mailto:${opp.agentEmail}`} />}
              {opp.officeName && <ContactRow label="Brokerage" value={opp.officeName} />}
            </div>
          </div>
        )}

        {/* No contact for AI-estimated listed or off-market */}
        {listed && !isLive && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--dr-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🤖 {t('AI-estimated listing — add RENTCAST_API_KEY for real agent contacts', 'Listado estimado — agrega RENTCAST_API_KEY para contactos reales')}
          </div>
        )}
        {!listed && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--dr-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔒 {t('Off-market lead — contact owner directly', 'Lead fuera de mercado — contactar propietario directamente')}
          </div>
        )}
      </motion.div>

      {/* AI Tools Modal */}
      {showAITools && (
        <AIToolsModal
          property={opp}
          API={API}
          language="en"
          t={t}
          onClose={() => setShowAITools(false)}
        />
      )}
    </>
  )
}
