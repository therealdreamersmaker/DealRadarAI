import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AIToolsModal from './AIToolsModal'
import OpportunityCard from './OpportunityCard'
import { isSaved, saveDeal, unsaveDeal, oppToSaveEntry } from '../utils/savedDeals'

function buildLeadSaveId(lead) {
  const addr = (lead.fullAddress || lead.distressType || 'unknown').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  return `autopilot-${addr}`
}

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

// Aligned with Dashboard DEAL_CATEGORIES and AutopilotPanel NICHE_COLORS
const DISTRESS_STYLES = {
  'Foreclosure':     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: '⚖️' },
  'Tax Delinquency': { color: '#fb923c', bg: 'rgba(249,115,22,0.12)',  icon: '💸' },
  'Property Issues': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🏚' },
  'Inherited House': { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '📋' },
  'Relocations':     { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '🚚' },
  'Fire Damage':     { color: '#f97316', bg: 'rgba(249,115,22,0.14)',  icon: '🔥' },
  'Bank Owned':      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '🏦' },
  'Too Many Liens':  { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', icon: '⛓' },
  'No/Low Equity':   { color: '#facc15', bg: 'rgba(250,204,21,0.12)',  icon: '📉' },
  // Legacy fallbacks
  'Pre-Foreclosure': { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: '⚠️' },
  'Probate':         { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '📋' },
}
function distressStyle(type) {
  return DISTRESS_STYLES[type] || { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: '🏠' }
}

const ALL_FILTER_NICHES = [
  'Foreclosure', 'Tax Delinquency', 'Property Issues', 'Inherited House',
  'Relocations', 'Fire Damage', 'Bank Owned', 'Too Many Liens', 'No/Low Equity',
]

// Inline deal score (mirrors OpportunityCard formula)
function calcScore(lead) {
  if (lead.dealScore) return Number(lead.dealScore)
  let pts = 0
  const dom = lead.dom || 0
  if (dom > 90) pts += 25; else if (dom > 60) pts += 18; else if (dom > 30) pts += 10; else if (dom > 14) pts += 5
  // For off-market leads, equity is already stored as a % field
  const eq = lead.equity || 0
  if (eq >= 35) pts += 30; else if (eq >= 25) pts += 22; else if (eq >= 15) pts += 14; else if (eq >= 5) pts += 7
  if (lead.yearBuilt) { if (lead.yearBuilt < 1960) pts += 20; else if (lead.yearBuilt < 1975) pts += 14; else if (lead.yearBuilt < 1990) pts += 8 }
  const HIGH = ['Foreclosure','Tax Delinquency','Fire Damage','Bank Owned']
  const MED  = ['Property Issues','Inherited House','Too Many Liens']
  if (HIGH.some(t => lead.distressType?.includes(t))) pts += 10; else if (MED.some(t => lead.distressType?.includes(t))) pts += 6; else pts += 3
  return Math.max(1, Math.min(10, Math.round(pts / 10)))
}
function scoreStyle(s) {
  if (s >= 9) return { color:'#22c55e', bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.35)',  label:'HOT' }
  if (s >= 7) return { color:'#fbbf24', bg:'rgba(251,191,36,0.12)', border:'rgba(251,191,36,0.35)', label:'STRONG' }
  if (s >= 5) return { color:'#60a5fa', bg:'rgba(96,165,250,0.12)', border:'rgba(96,165,250,0.35)', label:'SOLID' }
  if (s >= 3) return { color:'#f97316', bg:'rgba(249,115,22,0.12)', border:'rgba(249,115,22,0.35)', label:'AVG' }
  return              { color:'#ef4444', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.35)',  label:'PASS' }
}
// Map autopilot lead → opp format for OpportunityCard
function leadToOpp(lead) {
  return {
    type:        lead.distressType,
    address:     lead.fullAddress,
    arv:         lead.arv,
    targetOffer: lead.targetOffer,
    listPrice:   lead.arv, // for off-market: ARV is the reference value
    daysOnMarket:lead.dom || 0,
    bedBath:     (lead.beds && lead.baths) ? `${lead.beds}bd/${lead.baths}ba` : null,
    sqft:        lead.sqft,
    yearBuilt:   lead.yearBuilt,
    isListed:    false,
    dataSource:  'ai-estimate',
    dealScore:   lead.dealScore,
    note:        lead.note,
    isDemo:      lead.isDemo,
    zillowUrl:   null,
    redfinUrl:   null,
  }
}
function generateInsight(lead) {
  const b = []
  const dom = lead.dom || 0
  if (dom > 90) b.push(`🔥 ${dom} days — seller highly motivated, deep discount likely`)
  else if (dom > 45) b.push(`⏳ ${dom} days on market — motivation building, offer now`)
  else if (dom > 20) b.push(`📅 ${dom} days — mild motivation; open a conversation`)
  if (lead.yearBuilt && lead.yearBuilt < 1970) b.push(`🏚 Built ${lead.yearBuilt} — likely needs full rehab`)
  else if (lead.yearBuilt && lead.yearBuilt < 1985) b.push(`🔨 Built ${lead.yearBuilt} — cosmetic + mechanical updates probable`)
  const profit = lead.arv && lead.targetOffer ? lead.arv - lead.targetOffer : null
  if (profit && profit >= 30000) b.push(`🚀 Est. ${fmt(profit)} wholesale profit at 70% ARV`)
  else if (profit && profit >= 15000) b.push(`✅ Est. ${fmt(profit)} wholesale profit at 70% ARV`)
  if (lead.equity >= 25) b.push(`💎 ${lead.equity}% equity spread — strong position`)
  const HIGH = ['Foreclosure','Tax Delinquency','Fire Damage','Bank Owned']
  if (HIGH.some(t => lead.distressType?.includes(t))) b.push('⚠️ High-distress category — act quickly before competition')
  if (b.length === 0) b.push('📋 Verify comps and repair estimates before offering')
  return b
}

export default function LeadsTable({ API, t, totalLeadsInState }) {
  const [leads,        setLeads]        = useState([])
  const [total,        setTotal]        = useState(0)
  const [pages,        setPages]        = useState(1)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('all')
  const [loading,      setLoading]      = useState(false)
  const [expanded,     setExpanded]     = useState(null)
  const [aiToolsLead,  setAiToolsLead]  = useState(null)
  const [viewMode,     setViewMode]     = useState('table') // 'table' | 'cards'

  const PAGE_SIZE = 25

  const fetchLeads = useCallback(async (p = 1, q = search, f = filter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, size: PAGE_SIZE, search: q, filter: f })
      const res  = await fetch(`${API}/api/autopilot/leads?${params}`)
      const data = await res.json()
      setLeads(data.data  || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
      setPage(p)
    } catch (err) {
      console.error('Failed to fetch leads', err)
    } finally {
      setLoading(false)
    }
  }, [API, search, filter])

  useEffect(() => {
    if (totalLeadsInState > 0) fetchLeads(1, '', 'all')
  }, [totalLeadsInState]) // eslint-disable-line

  function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    fetchLeads(1, val, filter)
  }

  function handleFilter(f) {
    setFilter(f)
    fetchLeads(1, search, f)
  }

  if (totalLeadsInState === 0 && leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--dr-text-faintest)', fontSize: 13 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        {t('No leads yet — click "Run Now" to generate your first batch.', 'Sin leads aún — haz clic en "Ejecutar Ahora" para generar el primer lote.')}
      </div>
    )
  }

  return (
    <div>
      {/* ── DEMO data warning banner ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 12,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
        <div>
          <span style={{ fontWeight: 800, color: '#fbbf24', marginRight: 6 }}>DEMO DATA</span>
          <span style={{ color: 'var(--dr-text-muted)' }}>
            Property profiles are AI-estimated and realistic-looking but not verified. Owner names, phone numbers, and emails are
            <strong style={{ color: '#fbbf24' }}> fictional placeholders</strong> — do not contact them.
            Connect a skip-trace API (BatchSkipTracing, REISkip, etc.) to replace with real owner contacts.
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={handleSearch}
            placeholder={t('Search address, owner, type…', 'Buscar dirección, propietario…')}
            style={{
              width: '100%', padding: '8px 10px 8px 32px',
              background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
              borderRadius: 8, color: 'var(--dr-text-2)', fontSize: 12,
              fontFamily: 'Inter, sans-serif', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e  => e.target.style.borderColor = '#3b82f6'}
            onBlur={e   => e.target.style.borderColor = 'var(--dr-border)'}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleFilter('all')}
            style={{
              padding: '4px 11px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              border: filter === 'all' ? '1px solid #3b82f6' : '1px solid var(--dr-border)',
              background: filter === 'all' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: filter === 'all' ? '#60a5fa' : 'var(--dr-text-faint)',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            {t('All', 'Todos')}
          </button>
          {ALL_FILTER_NICHES.map(f => {
            const ds = distressStyle(f)
            const active = filter === f
            return (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                style={{
                  padding: '4px 11px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  border: active ? `1px solid ${ds.color}88` : '1px solid var(--dr-border)',
                  background: active ? ds.bg : 'transparent',
                  color: active ? ds.color : 'var(--dr-text-faint)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                }}
              >
                {ds.icon} {f}
              </button>
            )
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--dr-text-faint)', whiteSpace: 'nowrap' }}>
            {loading ? '⏳' : `${total} ${t('leads', 'leads')}`}
          </span>
          {/* View mode toggle */}
          <div style={{ display: 'flex', background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 8, overflow: 'hidden' }}>
            {[['table','☰ Table'],['cards','⊞ Cards']].map(([mode, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '5px 12px', border: 'none', cursor: 'pointer',
                background: viewMode === mode ? '#2563eb' : 'transparent',
                color: viewMode === mode ? 'white' : 'var(--dr-text-faint)',
                fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card View ──────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 20 }}>
          {leads.map((lead, i) => (
            <OpportunityCard key={lead.id} opp={leadToOpp(lead)} index={i} t={t} API={API} />
          ))}
          {leads.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--dr-text-faintest)', fontSize: 13 }}>
              {t('No results match your search.', 'Ningún resultado coincide.')}
            </div>
          )}
        </div>
      )}

      {/* ── Table View ─────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
      <>{/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--dr-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--dr-surface-deep)', borderBottom: '1px solid var(--dr-border)' }}>
              {['#', t('Address','Dirección'), t('Type','Tipo'), t('Score','Puntuación'), t('Status','Estado'), t('Beds/Ba/Sqft','Camas/Ba/Sqft'),
                t('Owner (DEMO)','Propietario (DEMO)'), t('Phone (DEMO)','Tel (DEMO)'),
                t('ARV','ARV'), t('MAO / Offer','MAO / Oferta'), t('Equity','Equidad'), t('DOM','DOM')
              ].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--dr-text-faint)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {leads.map((lead, i) => {
                const ds     = distressStyle(lead.distressType)
                const rowNum = (page - 1) * PAGE_SIZE + i + 1
                const isExp  = expanded === lead.id

                return (
                  <>
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.012 }}
                      onClick={() => setExpanded(isExp ? null : lead.id)}
                      style={{
                        borderBottom: isExp ? 'none' : '1px solid var(--dr-border)',
                        background: isExp ? 'rgba(59,130,246,0.06)' : i % 2 === 0 ? 'var(--dr-surface-deep)' : 'var(--dr-surface)',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => !isExp && (e.currentTarget.style.background = 'var(--dr-surface-alt)')}
                      onMouseLeave={e => !isExp && (e.currentTarget.style.background = i % 2 === 0 ? 'var(--dr-surface-deep)' : 'var(--dr-surface)')}
                    >
                      <td style={{ padding: '10px 12px', color: 'var(--dr-text-faintest)', fontFamily: 'JetBrains Mono, monospace' }}>{rowNum}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--dr-text-2)', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.fullAddress}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: ds.bg, color: ds.color, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap' }}>
                          {ds.icon} {lead.distressType}
                        </span>
                      </td>
                      {/* Deal score badge */}
                      <td style={{ padding: '10px 12px' }}>
                        {(() => { const s = calcScore(lead); const ss = scoreStyle(s); return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 20, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, fontWeight: 800, fontSize: 10, whiteSpace: 'nowrap' }}>
                            ⭐ {s}/10 <span style={{ fontSize: 9, opacity: 0.8 }}>{ss.label}</span>
                          </span>
                        )})()}
                      </td>
                      {/* Deal Status chip */}
                      <td style={{ padding: '10px 12px' }}>
                        {lead.dealStatus ? (() => {
                          const DS_MAP = {
                            'GOLDEN DEAL':               { icon: '🏆', abbr: 'GOLDEN',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
                            'DEAL SPREAD ACCEPTED':      { icon: '✅', abbr: 'ACCEPTED', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
                            'UNPROFITABLE - OVERPRICED': { icon: '❌', abbr: 'OVERPRICED',color: '#f87171', bg: 'rgba(248,113,113,0.12)',border: 'rgba(248,113,113,0.3)' },
                          }
                          const cfg = DS_MAP[lead.dealStatus] || { icon: '—', abbr: lead.dealStatus, color: '#6b7280', bg: 'transparent', border: '#6b7280' }
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontWeight: 700, fontSize: 9, whiteSpace: 'nowrap' }}>
                              {cfg.icon} {cfg.abbr}
                            </span>
                          )
                        })() : <span style={{ color: 'var(--dr-text-faintest)', fontSize: 10 }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--dr-text-3)', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        {lead.beds ?? '—'}bd / {lead.baths ?? '—'}ba
                        {lead.sqft ? <span style={{ color: 'var(--dr-text-faintest)', marginLeft: 4 }}>{Number(lead.sqft).toLocaleString()}sf</span> : null}
                        {(lead.sqft && lead.targetOffer) ? <span style={{ color: '#a78bfa', marginLeft: 4 }}>${Math.round(lead.targetOffer / lead.sqft)}/sf</span> : null}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--dr-text-muted)' }}>{lead.ownerFirstName} {lead.ownerLastName}</span>
                        <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 5, fontWeight: 700, verticalAlign: 'middle' }}>DEMO</span>
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--dr-text-faintest)', fontFamily: 'JetBrains Mono, monospace' }}>{lead.phone}</span>
                        <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 4, fontWeight: 700 }}>DEMO</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', fontWeight: 700 }}>{fmt(lead.arv)}</td>
                      <td style={{ padding: '10px 12px', color: '#4ade80', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', fontWeight: 700 }}>{fmt(lead.targetOffer)}</td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 44, height: 4, background: 'var(--dr-border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(lead.equity, 100)}%`, height: '100%', background: lead.equity >= 50 ? '#22c55e' : lead.equity >= 35 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                          </div>
                          <span style={{ color: 'var(--dr-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{lead.equity}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: lead.dom > 90 ? '#f87171' : lead.dom > 60 ? '#fbbf24' : 'var(--dr-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        {lead.dom ?? '—'}d
                      </td>
                    </motion.tr>

                    {/* Expanded row */}
                    {isExp && (
                      <tr key={`${lead.id}-exp`} style={{ borderBottom: '1px solid var(--dr-border)', background: 'rgba(59,130,246,0.04)' }}>
                        <td colSpan={12} style={{ padding: '0 12px 16px 12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, paddingTop: 12 }}>

                            {/* Property details */}
                            <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 10, padding: '12px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>🏠 Property</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                  ['Year Built', lead.yearBuilt ?? '—'],
                                  ['Sqft', lead.sqft ? `${Number(lead.sqft).toLocaleString()} sf` : '—'],
                                  ['Beds / Baths', `${lead.beds ?? '—'} bd / ${lead.baths ?? '—'} ba`],
                                  ['Days on Market', lead.dom ? `${lead.dom} days` : '—'],
                                ].map(([l, v]) => (
                                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span style={{ color: 'var(--dr-text-faint)' }}>{l}</span>
                                    <span style={{ color: 'var(--dr-text-2)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Financials */}
                            <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 10, padding: '12px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>💰 Financials</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                  ['Est. ARV',       fmt(lead.arv),                                                    '#60a5fa'],
                                  ['MAO',            fmt(lead.mao || lead.targetOffer),                                '#4ade80'],
                                  ['Est. Profit',    fmt(lead.arv && lead.targetOffer ? lead.arv - lead.targetOffer : null), '#f59e0b'],
                                  ['Equity',         `${lead.equity}%`,                                                '#a78bfa'],
                                ].map(([l, v, c]) => (
                                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span style={{ color: 'var(--dr-text-faint)' }}>{l}</span>
                                    <span style={{ color: c, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                                  </div>
                                ))}
                                {/* Condition tier */}
                                {lead.conditionTier && (() => {
                                  const TIER_CFG = {
                                    1: { label: 'T1 · Cosmetic Clean', color: '#22c55e' },
                                    2: { label: 'T2 · Average Fixer',  color: '#fbbf24' },
                                    3: { label: 'T3 · Total Gut Job',  color: '#f87171' },
                                  }
                                  const tc = TIER_CFG[lead.conditionTier]
                                  return tc ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 2 }}>
                                      <span style={{ color: 'var(--dr-text-faint)' }}>Condition</span>
                                      <span style={{ color: tc.color, fontWeight: 700 }}>{lead.conditionLabel || tc.label}</span>
                                    </div>
                                  ) : null
                                })()}
                              </div>
                            </div>

                            {/* Contact — DEMO */}
                            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                👤 Contact <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 4, padding: '1px 5px', fontSize: 9 }}>⚠ DEMO</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                  ['Owner', `${lead.ownerFirstName} ${lead.ownerLastName}`],
                                  ['Phone', lead.phone],
                                  ['Email', lead.email],
                                  ['Agent', lead.agentName],
                                ].map(([l, v]) => (
                                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
                                    <span style={{ color: 'var(--dr-text-faint)', flexShrink: 0 }}>{l}</span>
                                    <span style={{ color: 'var(--dr-text-muted)', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: 8, fontSize: 10, color: '#92400e', background: 'rgba(245,158,11,0.1)', borderRadius: 6, padding: '4px 8px' }}>
                                🔗 Connect a skip-trace API to unlock real contacts
                              </div>
                            </div>

                            {/* Deal Insight (same as OpportunityCard) */}
                            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 10, padding: '11px 13px', gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', letterSpacing: '0.08em', marginBottom: 7 }}>✦ DEAL INSIGHT</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {generateInsight(lead).map((b, i) => (
                                  <div key={i} style={{ fontSize: 11, color: '#86efac', lineHeight: 1.55 }}>{b}</div>
                                ))}
                              </div>
                            </div>

                            {/* AI Note */}
                            {lead.note && (
                              <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '12px 14px', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>🤖 AI Deal Note</div>
                                <p style={{ fontSize: 12, color: 'var(--dr-text-3)', lineHeight: 1.6, margin: 0 }}>{lead.note}</p>
                              </div>
                            )}

                            {/* AI Tools + Save buttons */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                              <button
                                onClick={() => setAiToolsLead(lead)}
                                style={{
                                  flex: 1, padding: '10px 16px', borderRadius: 10,
                                  background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.12))',
                                  border: '1px solid rgba(124,58,237,0.3)',
                                  color: '#a78bfa', fontSize: 12, fontWeight: 700,
                                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                              >
                                🤖 {t('Open AI Tools — Outreach Scripts & Deal Memo', 'Abrir Herramientas IA — Scripts y Memo')}
                              </button>
                              <SaveLeadBtn lead={lead} t={t} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {leads.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--dr-text-faintest)', fontSize: 13 }}>
            {t('No results match your search.', 'Ningún resultado coincide.')}
          </div>
        )}
      </div>
      </> /* end table view */
      )}

      {/* Pagination (both views) */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <PagBtn onClick={() => fetchLeads(page - 1)} disabled={page <= 1}>‹</PagBtn>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i
            if (p < 1 || p > pages) return null
            return <PagBtn key={p} onClick={() => fetchLeads(p)} active={p === page}>{p}</PagBtn>
          })}
          <PagBtn onClick={() => fetchLeads(page + 1)} disabled={page >= pages}>›</PagBtn>
          <span style={{ fontSize: 11, color: 'var(--dr-text-faintest)', marginLeft: 8 }}>
            {t(`Page ${page} of ${pages}`, `Página ${page} de ${pages}`)}
          </span>
        </div>
      )}

      {/* AI Tools Modal (for autopilot leads) */}
      {aiToolsLead && (
        <AIToolsModal
          property={aiToolsLead}
          API={API}
          language="en"
          t={t}
          onClose={() => setAiToolsLead(null)}
        />
      )}
    </div>
  )
}

// ── Save-to-Deal-Bank button for a single lead ────────────────────────────────
function SaveLeadBtn({ lead, t }) {
  const saveId = buildLeadSaveId(lead)
  const [savedState, setSavedState] = useState(() => isSaved(saveId))

  function handleSave() {
    const opp = leadToOpp(lead)
    if (savedState) {
      unsaveDeal(saveId)
      setSavedState(false)
    } else {
      const entry = { ...oppToSaveEntry(opp, 'autopilot'), id: saveId }
      saveDeal(entry)
      setSavedState(true)
    }
  }

  return (
    <button
      onClick={handleSave}
      title={savedState ? t('Remove from Deal Bank', 'Quitar del Banco') : t('Save to Deal Bank', 'Guardar en Banco')}
      style={{
        padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
        background: savedState ? 'rgba(34,197,94,0.12)' : 'var(--dr-surface-deep)',
        border: savedState ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--dr-border)',
        color: savedState ? '#4ade80' : 'var(--dr-text-muted)',
        fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
    >
      {savedState ? '✅' : '💾'} {savedState ? t('Saved', 'Guardado') : t('Save Deal', 'Guardar')}
    </button>
  )
}

function PagBtn({ onClick, disabled, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 6,
        border: active ? '1px solid #3b82f6' : '1px solid var(--dr-border)',
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? '#60a5fa' : disabled ? 'var(--dr-border)' : 'var(--dr-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
}
