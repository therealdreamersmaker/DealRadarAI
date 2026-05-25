/**
 * SavedDeals.jsx — Deal Bank
 * Browse, search, and manage all saved properties from any tool.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSavedDeals, unsaveDeal, updateDealNotes } from '../utils/savedDeals'
import OpportunityCard from './OpportunityCard'

const fmt  = n => n != null ? `$${Number(n).toLocaleString()}` : '—'

// ── Score / verdict helpers (mirrors other components) ────────────────────────
function scoreStyle(s) {
  if (!s) return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: '—' }
  if (s >= 9) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  label: 'HOT DEAL' }
  if (s >= 7) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', label: 'STRONG'   }
  if (s >= 5) return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', label: 'SOLID'    }
  if (s >= 3) return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', label: 'AVERAGE'  }
  return              { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)',  label: 'PASS'     }
}
const VERDICT_CFG = {
  GO:        { color: '#22c55e', icon: '🟢' },
  WATCHLIST: { color: '#fbbf24', icon: '🟡' },
  PASS:      { color: '#f87171', icon: '🔴' },
}
const SOURCE_CFG = {
  finder:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: '🔍', label: 'Deal Finder'   },
  analyzer:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: '🔬', label: 'Deal Analyzer' },
  autopilot: { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  icon: '⚡', label: 'Autopilot'     },
}

// ── Analyzer result card (for saved analyzer results) ─────────────────────────
function AnalyzerSavedCard({ entry, onRemove, API, t }) {
  const r   = entry.data
  const ss  = scoreStyle(r.dealScore)
  const vc  = VERDICT_CFG[r.verdict] || {}
  const [notes, setNotes] = useState(entry.notes || '')
  const [editNotes, setEditNotes] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function saveNotes() {
    updateDealNotes(entry.id, notes)
    setEditNotes(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: 'var(--dr-surface)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 16, overflow: 'hidden' }}
    >
      {/* Card header */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Source + date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>🔬 Deal Analyzer</span>
              {r.verdict && <span style={{ fontSize: 10, fontWeight: 700, color: vc.color }}>{vc.icon} {r.verdict}</span>}
              <span style={{ fontSize: 10, color: 'var(--dr-text-faintest)', marginLeft: 'auto' }}>{new Date(entry.savedAt).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dr-text-1)', lineHeight: 1.4 }}>{r.address}</div>
            {r.propertyType && <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', marginTop: 2 }}>{r.propertyType}{r.beds ? ` · ${r.beds}bd/${r.baths}ba` : ''}{r.sqft ? ` · ${Number(r.sqft).toLocaleString()} sqft` : ''}</div>}
          </div>
          {/* Deal score */}
          {r.dealScore && (
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, flexShrink: 0 }}>
              ⭐ {r.dealScore}/10 {ss.label}
            </span>
          )}
        </div>

        {/* Key numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
          {[['ARV', fmt(r.arv), '#60a5fa'], ['Target Offer', fmt(r.targetOffer), '#f97316'], ['Est. Profit', r.arv && r.targetOffer ? fmt(r.arv - r.targetOffer) : '—', '#22c55e']].map(([l, v, c]) => (
            <div key={l} style={{ background: 'var(--dr-surface-deep)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: 'var(--dr-text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: c, fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {editNotes ? (
          <div style={{ marginBottom: 10 }}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Add your notes…"
              style={{ width: '100%', background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border-blue)', borderRadius: 8, color: 'var(--dr-text-2)', fontSize: 12, padding: '8px 10px', fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button onClick={saveNotes} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: '#2563eb', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Save</button>
              <button onClick={() => { setNotes(entry.notes || ''); setEditNotes(false) }} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'var(--dr-border)', border: 'none', color: 'var(--dr-text-faint)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        ) : notes ? (
          <div onClick={() => setEditNotes(true)} style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '7px 10px', marginBottom: 10, fontSize: 11, color: '#fde68a', cursor: 'pointer', lineHeight: 1.5 }}>
            📝 {notes}
          </div>
        ) : null}

        {/* Action row */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: expanded ? 'rgba(59,130,246,0.15)' : 'var(--dr-surface-deep)', border: `1px solid ${expanded ? '#3b82f6' : 'var(--dr-border)'}`, color: expanded ? '#60a5fa' : 'var(--dr-text-faint)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {expanded ? '▲ Collapse' : '▼ Full Analysis'}
          </button>
          <button onClick={() => setEditNotes(true)}
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faint)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            📝 Notes
          </button>
          {r.sourceUrl && (
            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', textDecoration: 'none', fontFamily: 'inherit', fontWeight: 600 }}>
              🔗 Source
            </a>
          )}
          <button onClick={() => onRemove(entry.id)}
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginLeft: 'auto' }}>
            🗑 Remove
          </button>
        </div>
      </div>

      {/* Expanded analysis summary */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--dr-border)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {r.insights?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>✦ Deal Insights</div>
              {r.insights.map((ins, i) => <div key={i} style={{ fontSize: 11, color: '#86efac', lineHeight: 1.5, marginBottom: 3 }}>{ins}</div>)}
            </div>
          )}
          {r.redFlags?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>⚠️ Red Flags</div>
              {r.redFlags.map((rf, i) => <div key={i} style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.5, marginBottom: 3 }}>{rf}</div>)}
            </div>
          )}
          {r.exitStrategies?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>🚀 Exit Strategies</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.exitStrategies.map(es => (
                  <div key={es.strategy} style={{ background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 8, padding: '8px 12px', fontSize: 11, minWidth: 120 }}>
                    <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: 3 }}>{es.strategy}</div>
                    <div style={{ color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {es.projectedProfit ? fmt(es.projectedProfit) : es.projectedMonthlyRent ? `${fmt(es.projectedMonthlyRent)}/mo` : '—'}
                    </div>
                    <div style={{ color: 'var(--dr-text-faint)', marginTop: 2 }}>{es.timeline}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.recommendation && (
            <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--dr-text-3)', lineHeight: 1.6 }}>
              💡 {r.recommendation}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Finder/Autopilot saved card ───────────────────────────────────────────────
function OppSavedCard({ entry, onRemove, API, t }) {
  const sc = SOURCE_CFG[entry.source] || SOURCE_CFG.finder
  const ss = scoreStyle(entry.dealScore)
  const [notes, setNotes] = useState(entry.notes || '')
  const [editNotes, setEditNotes] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function saveNotes() { updateDealNotes(entry.id, notes); setEditNotes(false) }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44` }}>{sc.icon} {sc.label}</span>
              {entry.type && <span style={{ fontSize: 10, color: 'var(--dr-text-faint)' }}>{entry.type}</span>}
              <span style={{ fontSize: 10, color: 'var(--dr-text-faintest)', marginLeft: 'auto' }}>{new Date(entry.savedAt).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dr-text-1)', lineHeight: 1.4 }}>{entry.label}</div>
          </div>
          {entry.dealScore && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, flexShrink: 0 }}>⭐ {entry.dealScore}/10</span>
          )}
        </div>

        {notes && !editNotes && (
          <div onClick={() => setEditNotes(true)} style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 7, padding: '6px 10px', marginBottom: 8, fontSize: 11, color: '#fde68a', cursor: 'pointer', lineHeight: 1.5 }}>
            📝 {notes}
          </div>
        )}
        {editNotes && (
          <div style={{ marginBottom: 8 }}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add your notes…"
              style={{ width: '100%', background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border-blue)', borderRadius: 7, color: 'var(--dr-text-2)', fontSize: 12, padding: '7px 10px', fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
              <button onClick={saveNotes} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#2563eb', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Save</button>
              <button onClick={() => { setNotes(entry.notes || ''); setEditNotes(false) }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'var(--dr-border)', border: 'none', color: 'var(--dr-text-faint)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 11, padding: '4px 11px', borderRadius: 7, background: expanded ? 'rgba(59,130,246,0.12)' : 'var(--dr-surface-deep)', border: `1px solid ${expanded ? '#3b82f6' : 'var(--dr-border)'}`, color: expanded ? '#60a5fa' : 'var(--dr-text-faint)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {expanded ? '▲ Collapse' : '▼ View Card'}
          </button>
          <button onClick={() => setEditNotes(true)}
            style={{ fontSize: 11, padding: '4px 11px', borderRadius: 7, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', color: 'var(--dr-text-faint)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            📝 Notes
          </button>
          <button onClick={() => onRemove(entry.id)}
            style={{ fontSize: 11, padding: '4px 11px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginLeft: 'auto' }}>
            🗑 Remove
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--dr-border)', padding: '14px 16px' }}>
          <OpportunityCard opp={entry.data} index={0} t={t} API={API} />
        </div>
      )}
    </motion.div>
  )
}

// ── Main SavedDeals page ──────────────────────────────────────────────────────
export default function SavedDeals({ API, t }) {
  const [deals,      setDeals]   = useState(getSavedDeals)
  const [search,     setSearch]  = useState('')
  const [srcFilter,  setSrc]     = useState('all')
  const [sort,       setSort]    = useState('newest')

  // Stay in sync when other tabs save/remove
  useEffect(() => {
    const handler = () => setDeals(getSavedDeals())
    window.addEventListener('dr-saved-changed', handler)
    return () => window.removeEventListener('dr-saved-changed', handler)
  }, [])

  function handleRemove(id) {
    unsaveDeal(id)
    setDeals(getSavedDeals())
  }

  // Filter + sort
  const filtered = deals
    .filter(d => {
      if (srcFilter !== 'all' && d.source !== srcFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (d.label || '').toLowerCase().includes(q) ||
             (d.type  || '').toLowerCase().includes(q) ||
             (d.notes || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sort === 'newest')  return new Date(b.savedAt) - new Date(a.savedAt)
      if (sort === 'oldest')  return new Date(a.savedAt) - new Date(b.savedAt)
      if (sort === 'score')   return (b.dealScore || 0) - (a.dealScore || 0)
      return 0
    })

  const counts = { all: deals.length, finder: 0, analyzer: 0, autopilot: 0 }
  deals.forEach(d => { if (counts[d.source] !== undefined) counts[d.source]++ })

  if (deals.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>💾</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dr-text-2)', marginBottom: 10 }}>
          {t('Your Deal Bank is Empty', 'Tu Banco de Tratos está Vacío')}
        </div>
        <p style={{ fontSize: 14, color: 'var(--dr-text-faint)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
          {t('Click the 💾 Save button on any property card in Deal Finder, Deal Analyzer, or Autopilot Hunter to add it here.', 'Haz clic en el botón 💾 Guardar en cualquier tarjeta de propiedad para agregarla aquí.')}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search by address, type, or notes…', 'Buscar por dirección, tipo o notas…')}
            style={{ width: '100%', padding: '9px 10px 9px 34px', background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 9, color: 'var(--dr-text-2)', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e  => e.target.style.borderColor = 'var(--dr-border)'} />
        </div>

        {/* Source filter */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[['all','All'], ['finder','🔍 Finder'], ['analyzer','🔬 Analyzer'], ['autopilot','⚡ Autopilot']].map(([key, label]) => (
            <button key={key} onClick={() => setSrc(key)}
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, transition: 'all 0.15s',
                background: srcFilter === key ? '#2563eb' : 'var(--dr-surface-deep)',
                border:     srcFilter === key ? '1px solid #2563eb' : '1px solid var(--dr-border)',
                color:      srcFilter === key ? 'white' : 'var(--dr-text-faint)' }}>
              {label} {counts[key] != null ? `(${counts[key]})` : ''}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ padding: '7px 10px', background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 9, color: 'var(--dr-text-2)', fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score">Highest score</option>
        </select>

        <span style={{ fontSize: 12, color: 'var(--dr-text-faint)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} / {deals.length} {t('saved', 'guardados')}
        </span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--dr-text-faintest)', fontSize: 13 }}>
          {t('No saved deals match your search.', 'Ningún trato guardado coincide.')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          <AnimatePresence>
            {filtered.map(entry =>
              entry.source === 'analyzer'
                ? <AnalyzerSavedCard key={entry.id} entry={entry} onRemove={handleRemove} API={API} t={t} />
                : <OppSavedCard      key={entry.id} entry={entry} onRemove={handleRemove} API={API} t={t} />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
