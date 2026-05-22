import { motion } from 'framer-motion'

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

const TYPE_STYLES = {
  'Price Drop': { color: '#f87171', icon: '📉', bg: 'rgba(239,68,68,0.1)' },
  'Fixer-Upper': { color: '#fb923c', icon: '🔨', bg: 'rgba(249,115,22,0.1)' },
  'Pre-Foreclosure': { color: '#c084fc', icon: '⚠', bg: 'rgba(192,132,252,0.1)' },
  'Probate': { color: '#94a3b8', icon: '📋', bg: 'rgba(148,163,184,0.1)' },
  'Tax Delinquency': { color: '#fb923c', icon: '💸', bg: 'rgba(249,115,22,0.1)' },
  'default': { color: '#60a5fa', icon: '🏠', bg: 'rgba(96,165,250,0.1)' },
}

function getTypeStyle(type) {
  const key = Object.keys(TYPE_STYLES).find(k => type?.includes(k)) || 'default'
  return TYPE_STYLES[key]
}

function buildSearchUrl(base, address) {
  return `${base}${encodeURIComponent(address)}`
}

export default function OpportunityCard({ opp, index, t }) {
  const style = getTypeStyle(opp.type)
  const profit = opp.arv && opp.targetOffer ? opp.arv - opp.targetOffer : null
  const equity = opp.arv && opp.listPrice ? Math.round(((opp.arv - opp.listPrice) / opp.arv) * 100) : null

  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'linear-gradient(135deg, #0f172a, #0a1628)',
        border: '1px solid #1e3a5f',
        borderRadius: 18,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Type badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: style.bg, border: `1px solid ${style.color}44`,
        borderRadius: 20, padding: '4px 12px', marginBottom: 14,
        fontSize: 11, fontWeight: 700, color: style.color,
      }}>
        {style.icon} {opp.type}
      </div>

      {/* Address */}
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6, lineHeight: 1.4 }}>
        {opp.address}
      </div>

      {opp.bedBath && (
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          🛏 {opp.bedBath} · {opp.daysOnMarket ? `${opp.daysOnMarket} ${t('days on market', 'días en mercado')}` : ''}
        </div>
      )}

      {/* Financial grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          [t('List Price', 'Precio Lista'), fmt(opp.listPrice), '#94a3b8'],
          [t('ARV', 'Valor ARV'), fmt(opp.arv), '#60a5fa'],
          [t('Target Offer (70%)', 'Oferta Objetivo (70%)'), fmt(opp.targetOffer), '#4ade80'],
          [t('Est. Profit', 'Ganancia Est.'), profit ? fmt(profit) : '—', '#fbbf24'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: '#070b14', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</div>
          </div>
        ))}
      </div>

      {equity !== null && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 8, padding: '6px 12px', marginBottom: 14,
          fontSize: 12, color: '#4ade80', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          📈 {equity}% {t('potential equity spread', 'diferencial de equidad potencial')}
        </div>
      )}

      {/* Search buttons */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <a
          href={buildSearchUrl('https://www.zillow.com/homes/', opp.address)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 12px', borderRadius: 8,
            background: 'rgba(0,115,184,0.15)', border: '1px solid rgba(0,115,184,0.35)',
            color: '#60a5fa', textDecoration: 'none', fontSize: 12, fontWeight: 700,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,115,184,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,115,184,0.15)'}
        >
          🔵 Zillow
        </a>
        <a
          href={buildSearchUrl('https://www.redfin.com/search?location=', opp.address)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 12px', borderRadius: 8,
            background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.35)',
            color: '#fca5a5', textDecoration: 'none', fontSize: 12, fontWeight: 700,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,0,0,0.15)'}
        >
          🔴 Redfin
        </a>
      </div>

      {/* Print-only: addresses */}
      <div className="print-only" style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
        Zillow: zillow.com/homes/{opp.address.replace(/ /g, '-')} | Redfin: redfin.com/search?location={opp.address}
      </div>
    </motion.div>
  )
}
