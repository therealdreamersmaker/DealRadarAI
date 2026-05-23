import { motion } from 'framer-motion'

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

// ── Deal insight engine ───────────────────────────────────────────────────────
function generateInsight(opp) {
  const bullets = []
  const actions = []

  // Days on market
  if (opp.daysOnMarket > 90) {
    bullets.push(`🔥 ${opp.daysOnMarket} days on market — seller is highly motivated, deep discount likely`)
    actions.push('Send a lowball offer today before another wholesaler does')
  } else if (opp.daysOnMarket > 45) {
    bullets.push(`⏳ ${opp.daysOnMarket} days on market — above-average DOM signals price reduction incoming`)
    actions.push('Negotiate 10–15% below current ask')
  } else if (opp.daysOnMarket > 20) {
    bullets.push(`📅 ${opp.daysOnMarket} days on market — mild motivation, worth opening a conversation`)
  }

  // Year built
  if (opp.yearBuilt && opp.yearBuilt < 1970) {
    bullets.push(`🏚 Built ${opp.yearBuilt} — likely needs full rehab (roof, plumbing, electrical, foundation)`)
    actions.push('Get contractor walk-through before submitting offer')
  } else if (opp.yearBuilt && opp.yearBuilt < 1985) {
    bullets.push(`🔨 Built ${opp.yearBuilt} — cosmetic + mechanical updates probable; budget accordingly`)
  }

  // Price per sqft
  const ppsf = opp.sqft && opp.listPrice ? Math.round(opp.listPrice / opp.sqft) : null
  if (ppsf !== null && ppsf < 60) {
    bullets.push(`💰 Only $${ppsf}/sqft — well below market; exceptional value-add opportunity`)
  } else if (ppsf !== null && ppsf < 100) {
    bullets.push(`📊 $${ppsf}/sqft — below-market pricing creates meaningful profit room`)
  }

  // Estimated profit
  const profit = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
  if (profit && profit >= 30000) {
    bullets.push(`🚀 Est. $${Number(profit).toLocaleString()} wholesale profit at 70% ARV offer`)
    actions.push('Assign contract to a cash buyer in your buyers list')
  } else if (profit && profit >= 15000) {
    bullets.push(`✅ Est. $${Number(profit).toLocaleString()} wholesale profit at 70% ARV offer`)
  }

  // Equity spread
  const equity = opp.arv && opp.listPrice
    ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
  if (equity && equity >= 25) {
    bullets.push(`💎 ${equity}% spread between list price and ARV — strong equity play`)
  }

  // Deal-type specific
  if (opp.type === 'Price Drop') {
    bullets.push('📉 Price has already been cut — seller motivation is confirmed')
    actions.push('Make an offer before price drops further or another buyer steps in')
  } else if (opp.type === 'Fixer-Upper') {
    actions.push('Pull comps for renovated properties within 0.5 miles to validate ARV')
  } else if (opp.type === 'Extended DOM') {
    actions.push('Call listing agent — ask if seller would consider creative financing')
  }

  // Sensible defaults
  if (bullets.length === 0) {
    bullets.push('📋 Standard listing — verify comps and run a full repair estimate before offering')
  }
  if (actions.length === 0) {
    actions.push('Drive by the property and request disclosure documents from the agent')
  }

  return { bullets, actions }
}

const TYPE_STYLES = {
  'Price Drop':      { color: '#f87171', icon: '📉', bg: 'rgba(239,68,68,0.1)'    },
  'Fixer-Upper':     { color: '#fb923c', icon: '🔨', bg: 'rgba(249,115,22,0.1)'   },
  'High Equity':     { color: '#34d399', icon: '💎', bg: 'rgba(52,211,153,0.1)'   },
  'Pre-Foreclosure': { color: '#c084fc', icon: '⚠️', bg: 'rgba(192,132,252,0.1)'  },
  'Probate':         { color: '#94a3b8', icon: '📋', bg: 'rgba(148,163,184,0.1)'  },
  'Tax Delinquency': { color: '#fb923c', icon: '💸', bg: 'rgba(249,115,22,0.1)'   },
  'Absentee Owner':  { color: '#facc15', icon: '🔑', bg: 'rgba(250,204,21,0.1)'   },
  'default':         { color: '#60a5fa', icon: '🏠', bg: 'rgba(96,165,250,0.1)'   },
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
  return `https://www.redfin.com/search#location=${encodeURIComponent(address)}&start=0&count=5`
}

// ── AI Lead Target card (off-market category, no specific address) ────────────
function AILeadTargetCard({ opp, index, t }) {
  const style = getTypeStyle(opp.type)
  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'var(--dr-grad-card-alt)',
        border: '1px solid var(--dr-border)',
        borderRadius: 18, padding: '20px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Badge */}
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
          background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.25)',
          color: '#fbbf24', letterSpacing: '0.06em',
        }}>◆ OFF-MARKET</span>
      </div>

      {/* Type badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: style.bg, border: `1px solid ${style.color}44`,
        borderRadius: 20, padding: '4px 12px', marginBottom: 12,
        fontSize: 11, fontWeight: 700, color: style.color,
      }}>
        {style.icon} {opp.type}
      </div>

      {/* AI label — honest about what this is */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 14,
      }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>
            {t('AI-Identified Lead Category', 'Categoría de Lead Identificada por IA')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', lineHeight: 1.5 }}>
            {t('No specific address — use skip-tracing to find properties in this category', 'Sin dirección específica — usa skip-tracing para encontrar propiedades en esta categoría')}
          </div>
        </div>
      </div>

      {opp.note && (
        <div style={{
          background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
          borderRadius: 8, padding: '10px 12px', marginBottom: 14,
          fontSize: 11, color: 'var(--dr-text-3)', lineHeight: 1.6,
        }}>
          💡 {opp.note}
        </div>
      )}

      {/* Skip-trace CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 8, padding: '9px 12px', marginBottom: 10,
        fontSize: 11, color: '#fbbf24', fontWeight: 600,
      }}>
        🔍 {t('Use BatchSkipTracing.com or PropStream to find specific owners', 'Usa BatchSkipTracing.com o PropStream para encontrar propietarios específicos')}
      </div>

      {/* County records search link */}
      {opp.countySearchUrl && (
        <div style={{ marginBottom: 10 }}>
          <a
            href={opp.countySearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 8, padding: '9px 12px',
              color: '#c4b5fd', textDecoration: 'none', fontSize: 11, fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
          >
            🏛 {opp.countySearchLabel || t('Search County Records', 'Buscar Registros del Condado')}
          </a>
          {opp.countySearchTip && (
            <div style={{ marginTop: 5, fontSize: 10, color: 'var(--dr-text-faintest)', lineHeight: 1.5, paddingLeft: 4 }}>
              💡 {opp.countySearchTip}
            </div>
          )}
        </div>
      )}

      {/* Greyed-out search buttons — not listed, so not searchable */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div
          title={t('No address — property is off-market and not listed on Zillow', 'Sin dirección — propiedad fuera de mercado, no está en Zillow')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}
        >
          🔵 {t('Not on Zillow', 'No en Zillow')}
        </div>
        <div
          title={t('No address — property is off-market and not listed on Redfin', 'Sin dirección — propiedad fuera de mercado, no está en Redfin')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}
        >
          🔴 {t('Not on Redfin', 'No en Redfin')}
        </div>
      </div>
    </motion.div>
  )
}

// ── Real listing card (RentCast / MLS) ────────────────────────────────────────
export default function OpportunityCard({ opp, index, t }) {
  if (opp.dataSource === 'ai-target' || opp.address == null) {
    return <AILeadTargetCard opp={opp} index={index} t={t} />
  }

  const style   = getTypeStyle(opp.type)
  const profit  = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
  const equity  = opp.arv && opp.listPrice   ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
  const listed  = opp.isListed === true
  const isLive  = opp.dataSource === 'live'
  const zillowHref = opp.zillowUrl || (opp.address ? buildZillowUrl(opp.address) : null)
  const redfinHref = opp.redfinUrl || (opp.address ? buildRedfinUrl(opp.address) : null)

  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'var(--dr-grad-card-alt)',
        border: `1px solid ${listed ? 'var(--dr-border-blue)' : 'var(--dr-border)'}`,
        borderRadius: 18, padding: '20px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Badges */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {listed ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', letterSpacing: '0.06em' }}>● MLS LISTED</span>
        ) : (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.25)', color: '#fbbf24', letterSpacing: '0.06em' }}>◆ OFF-MARKET</span>
        )}
        {isLive && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', letterSpacing: '0.05em' }}>✓ LIVE DATA</span>
        )}
      </div>

      {/* Type */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: style.bg, border: `1px solid ${style.color}44`, borderRadius: 20, padding: '4px 12px', marginBottom: 12, fontSize: 11, fontWeight: 700, color: style.color }}>
        {style.icon} {opp.type}
      </div>

      {/* Address */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dr-text-1)', marginBottom: 4, lineHeight: 1.4, paddingRight: 80 }}>
        {opp.address}
      </div>

      {/* Sub-details */}
      <div style={{ fontSize: 11, color: '#c8d3e6', marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {opp.bedBath && <span>🛏 {opp.bedBath}</span>}
        {opp.sqft    && <span>📐 {Number(opp.sqft).toLocaleString()} sqft</span>}
        {opp.yearBuilt && <span>🏗 {opp.yearBuilt}</span>}
        {opp.daysOnMarket > 0 && <span>📅 {opp.daysOnMarket} {t('days', 'días')}</span>}
        {opp.mlsNumber && <span style={{ color: 'var(--dr-text-faintest)' }}>{opp.mlsNumber}</span>}
      </div>

      {/* Financial grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          [t('List Price', 'Precio Lista'),        fmt(opp.listPrice),   '#f97316'],
          [t('ARV', 'Valor ARV'),                  fmt(opp.arv),         '#60a5fa'],
          [t('Target Offer (70%)', 'Oferta (70%)'), fmt(opp.targetOffer), '#f97316'],
          [t('Est. Profit', 'Ganancia Est.'),       profit ? fmt(profit) : '—', '#22c55e'],
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

      {/* Deal insight panel */}
      {(() => {
        const { bullets } = generateInsight(opp)
        return (
          <div style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.22)',
            borderRadius: 10, padding: '11px 13px', marginBottom: 14,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#4ade80',
              letterSpacing: '0.08em', marginBottom: 7,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
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

      {/* Search buttons */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {listed ? (
          <>
            <a href={zillowHref} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'rgba(0,115,184,0.15)', border: '1px solid rgba(0,115,184,0.4)', color: '#60a5fa', textDecoration: 'none', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,115,184,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,115,184,0.15)'}>
              🔵 {t('View on Zillow', 'Ver en Zillow')}
            </a>
            <a href={redfinHref} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.4)', color: '#fca5a5', textDecoration: 'none', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,0,0,0.15)'}>
              🔴 {t('View on Redfin', 'Ver en Redfin')}
            </a>
          </>
        ) : (
          <>
            <div title={t('Off-market — not on Zillow', 'Fuera de mercado — no en Zillow')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}>
              🔵 {t('Not on Zillow', 'No en Zillow')}
            </div>
            <div title={t('Off-market — not on Redfin', 'Fuera de mercado — no en Redfin')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}>
              🔴 {t('Not on Redfin', 'No en Redfin')}
            </div>
          </>
        )}
      </div>

      {!listed && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--dr-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 {t('Off-market lead — contact owner directly', 'Lead fuera de mercado — contactar propietario directamente')}
        </div>
      )}
    </motion.div>
  )
}
