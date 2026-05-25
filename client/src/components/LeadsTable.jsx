import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function LeadsTable({ API, t, totalLeadsInState }) {
  const [leads,    setLeads]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState(null)

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

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--dr-text-faint)', whiteSpace: 'nowrap' }}>
          {loading ? '⏳' : `${total} ${t('leads', 'leads')}`}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--dr-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--dr-surface-deep)', borderBottom: '1px solid var(--dr-border)' }}>
              {['#', t('Address','Dirección'), t('Type','Tipo'), t('Beds/Ba/Sqft','Camas/Ba/Sqft'),
                t('Owner (DEMO)','Propietario (DEMO)'), t('Phone (DEMO)','Tel (DEMO)'),
                t('ARV','ARV'), t('Target Offer','Oferta'), t('Equity','Equidad'), t('DOM','DOM')
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
                      <td style={{ padding: '10px 12px', color: 'var(--dr-text-3)', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        {lead.beds ?? '—'}bd / {lead.baths ?? '—'}ba
                        {lead.sqft ? <span style={{ color: 'var(--dr-text-faintest)', marginLeft: 4 }}>{Number(lead.sqft).toLocaleString()}sf</span> : null}
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
                        <td colSpan={10} style={{ padding: '0 12px 16px 12px' }}>
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
                                  ['Est. ARV', fmt(lead.arv), '#60a5fa'],
                                  ['Target Offer', fmt(lead.targetOffer), '#4ade80'],
                                  ['Est. Profit', fmt(lead.arv && lead.targetOffer ? lead.arv - lead.targetOffer : null), '#f59e0b'],
                                  ['Equity', `${lead.equity}%`, '#a78bfa'],
                                ].map(([l, v, c]) => (
                                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span style={{ color: 'var(--dr-text-faint)' }}>{l}</span>
                                    <span style={{ color: c, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                                  </div>
                                ))}
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

                            {/* AI Note */}
                            {lead.note && (
                              <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '12px 14px', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>🤖 AI Deal Note</div>
                                <p style={{ fontSize: 12, color: 'var(--dr-text-3)', lineHeight: 1.6, margin: 0 }}>{lead.note}</p>
                              </div>
                            )}
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

      {/* Pagination */}
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
    </div>
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
