import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

const DISTRESS_STYLES = {
  'Pre-Foreclosure':  { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', icon: '⚠️' },
  'Probate':          { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '📋' },
  'Tax Delinquency':  { color: '#fb923c', bg: 'rgba(249,115,22,0.12)',  icon: '💸' },
}
function distressStyle(type) {
  return DISTRESS_STYLES[type] || { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: '🏠' }
}

export default function LeadsTable({ API, t, totalLeadsInState }) {
  const [leads,      setLeads]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [pages,      setPages]      = useState(1)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')
  const [loading,    setLoading]    = useState(false)
  const [expanded,   setExpanded]   = useState(null)

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

  // Refresh whenever the parent tells us a new run completed
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
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#334155', fontSize: 13 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        {t('No leads yet — click "Run Now" to generate your first batch.', 'Sin leads aún — haz clic en "Ejecutar Ahora" para generar el primer lote.')}
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={handleSearch}
            placeholder={t('Search address, owner, type…', 'Buscar dirección, propietario…')}
            style={{
              width: '100%', padding: '8px 10px 8px 32px',
              background: '#070b14', border: '1px solid #1e293b',
              borderRadius: 8, color: '#e2e8f0', fontSize: 12,
              fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
            onFocus={e  => e.target.style.borderColor = '#3b82f6'}
            onBlur={e   => e.target.style.borderColor = '#1e293b'}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'Pre-Foreclosure', 'Probate', 'Tax Delinquency'].map(f => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                border: filter === f ? '1px solid #3b82f6' : '1px solid #1e293b',
                background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: filter === f ? '#60a5fa' : '#475569',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? t('All Types', 'Todos') : f}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
          {loading ? '⏳' : `${total} ${t('leads', 'leads')}`}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0a1020', borderBottom: '1px solid #1e293b' }}>
              {[
                t('#', '#'),
                t('Address', 'Dirección'),
                t('Type', 'Tipo'),
                t('Owner', 'Propietario'),
                t('Phone', 'Teléfono'),
                t('Email', 'Email'),
                t('Agent', 'Agente'),
                t('ARV', 'ARV'),
                t('Target Offer', 'Oferta Objetivo'),
                t('Equity', 'Equidad'),
              ].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  color: '#475569', fontWeight: 700,
                  fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.07em', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {leads.map((lead, i) => {
                const ds      = distressStyle(lead.distressType)
                const rowNum  = (page - 1) * PAGE_SIZE + i + 1
                const isExp   = expanded === lead.id
                const profit  = lead.arv - lead.targetOffer

                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => setExpanded(isExp ? null : lead.id)}
                    style={{
                      borderBottom: '1px solid #0f1a2e',
                      background: isExp ? '#0d1f3c' : i % 2 === 0 ? '#070b14' : '#0a0f1e',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => !isExp && (e.currentTarget.style.background = '#0f172a')}
                    onMouseLeave={e => !isExp && (e.currentTarget.style.background = i % 2 === 0 ? '#070b14' : '#0a0f1e')}
                  >
                    {/* # */}
                    <td style={{ padding: '10px 14px', color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>{rowNum}</td>

                    {/* Address */}
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lead.fullAddress}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 9px', borderRadius: 20,
                        background: ds.bg, color: ds.color,
                        fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap',
                      }}>
                        {ds.icon} {lead.distressType}
                      </span>
                    </td>

                    {/* Owner */}
                    <td style={{ padding: '10px 14px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                      {lead.ownerFirstName} {lead.ownerLastName}
                    </td>

                    {/* Phone */}
                    <td style={{ padding: '10px 14px', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                      {lead.phone}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '10px 14px', color: '#94a3b8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.email}
                    </td>

                    {/* Agent */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        color: lead.agentName === 'Off-Market' ? '#4ade80' : '#94a3b8',
                        fontWeight: lead.agentName === 'Off-Market' ? 700 : 400,
                      }}>
                        {lead.agentName}
                      </span>
                    </td>

                    {/* ARV */}
                    <td style={{ padding: '10px 14px', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {fmt(lead.arv)}
                    </td>

                    {/* Target Offer */}
                    <td style={{ padding: '10px 14px', color: '#4ade80', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {fmt(lead.targetOffer)}
                    </td>

                    {/* Equity */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 48, height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden',
                        }}>
                          <div style={{ width: `${Math.min(lead.equity, 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{lead.equity}%</span>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {leads.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#334155', fontSize: 13 }}>
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
            return (
              <PagBtn key={p} onClick={() => fetchLeads(p)} active={p === page}>{p}</PagBtn>
            )
          })}
          <PagBtn onClick={() => fetchLeads(page + 1)} disabled={page >= pages}>›</PagBtn>
          <span style={{ fontSize: 11, color: '#334155', marginLeft: 8 }}>
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
        border: active ? '1px solid #3b82f6' : '1px solid #1e293b',
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? '#60a5fa' : disabled ? '#1e293b' : '#64748b',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
