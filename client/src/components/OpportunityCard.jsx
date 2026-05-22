import { motion } from 'framer-motion'

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

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

// Build the most direct search URL for a listed property
function buildZillowUrl(address) {
  // Format: zillow.com/homes/FULL-ADDRESS_rb/
  const slug = address.replace(/,/g, '').replace(/\s+/g, '-')
  return `https://www.zillow.com/homes/${encodeURIComponent(slug)}_rb/`
}
function buildRedfinUrl(address) {
  return `https://www.redfin.com/search#location=${encodeURIComponent(address)}&start=0&count=5`
}

export default function OpportunityCard({ opp, index, t }) {
  const style   = getTypeStyle(opp.type)
  const profit  = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
  const equity  = opp.arv && opp.listPrice   ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null
  const listed  = opp.isListed === true

  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'linear-gradient(135deg, #0f172a, #0a1628)',
        border: `1px solid ${listed ? '#1e3a5f' : '#2d1f4e'}`,
        borderRadius: 18,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Listed / Off-Market badge top-right */}
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        {listed ? (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            color: '#4ade80', letterSpacing: '0.06em',
          }}>● MLS LISTED</span>
        ) : (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.25)',
            color: '#fbbf24', letterSpacing: '0.06em',
          }}>◆ OFF-MARKET</span>
        )}
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

      {/* Address */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4, lineHeight: 1.4, paddingRight: 80 }}>
        {opp.address}
      </div>

      {/* Sub-details */}
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {opp.bedBath && <span>🛏 {opp.bedBath}</span>}
        {opp.sqft    && <span>📐 {Number(opp.sqft).toLocaleString()} sqft</span>}
        {opp.daysOnMarket && <span>📅 {opp.daysOnMarket} {t('days', 'días')}</span>}
        {opp.mlsNumber && <span style={{ color: '#334155' }}>{opp.mlsNumber}</span>}
      </div>

      {/* Financial grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          [t('List Price', 'Precio Lista'),       fmt(opp.listPrice),   '#94a3b8'],
          [t('ARV',         'Valor ARV'),          fmt(opp.arv),         '#60a5fa'],
          [t('Target Offer (70%)', 'Oferta (70%)'), fmt(opp.targetOffer), '#4ade80'],
          [t('Est. Profit', 'Ganancia Est.'),      profit ? fmt(profit) : '—', '#fbbf24'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: '#070b14', borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</div>
          </div>
        ))}
      </div>

      {equity !== null && (
        <div style={{
          background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)',
          borderRadius: 8, padding: '6px 12px', marginBottom: 14,
          fontSize: 11, color: '#4ade80', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          📈 {equity}% {t('potential equity spread', 'diferencial de equidad potencial')}
        </div>
      )}

      {/* Search buttons */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {listed ? (
          <>
            <a
              href={buildZillowUrl(opp.address)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(0,115,184,0.15)', border: '1px solid rgba(0,115,184,0.4)',
                color: '#60a5fa', textDecoration: 'none', fontSize: 12, fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,115,184,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,115,184,0.15)'}
            >
              🔵 {t('View on Zillow', 'Ver en Zillow')}
            </a>
            <a
              href={buildRedfinUrl(opp.address)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.4)',
                color: '#fca5a5', textDecoration: 'none', fontSize: 12, fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,0,0,0.15)'}
            >
              🔴 {t('View on Redfin', 'Ver en Redfin')}
            </a>
          </>
        ) : (
          <>
            {/* Greyed-out disabled buttons for off-market */}
            <div
              title={t('Property is off-market — not listed on Zillow', 'Propiedad fuera de mercado — no listada en Zillow')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(30,41,59,0.4)', border: '1px solid #1e293b',
                color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'not-allowed',
                userSelect: 'none',
              }}
            >
              🔵 {t('Not on Zillow', 'No en Zillow')}
            </div>
            <div
              title={t('Property is off-market — not listed on Redfin', 'Propiedad fuera de mercado — no listada en Redfin')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(30,41,59,0.4)', border: '1px solid #1e293b',
                color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'not-allowed',
                userSelect: 'none',
              }}
            >
              🔴 {t('Not on Redfin', 'No en Redfin')}
            </div>
          </>
        )}
      </div>

      {/* Off-market notice */}
      {!listed && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 {t('Off-market lead — contact owner directly', 'Lead fuera de mercado — contactar propietario directamente')}
        </div>
      )}
    </motion.div>
  )
}
