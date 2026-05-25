/**
 * FinderSettings.jsx
 * Collapsible settings panel for Deal Finder — lets users toggle which
 * deal categories appear in results. Persisted to localStorage.
 */

import { useState, useEffect } from 'react'

// ── Category definitions (mirrors Dashboard DEAL_CATEGORIES) ─────────────────
export const FINDER_CATEGORIES = [
  // ── MLS Listed ──
  { key: 'listed',        label: 'Top MLS Opportunities',   icon: '🏆', color: '#4ade80', group: 'listed' },
  { key: 'Price Drop',    label: 'Price Drop',              icon: '🏷', color: '#f87171', group: 'listed' },
  { key: 'Fixer-Upper',   label: 'Fixer-Upper',             icon: '🔨', color: '#fb923c', group: 'listed' },
  { key: 'Extended DOM',  label: 'Extended Days on Market', icon: '⏳', color: '#60a5fa', group: 'listed' },
  // ── Off-Market ──
  { key: 'Foreclosure',     label: 'Foreclosure',     icon: '⚖️', color: '#f87171', group: 'offmarket' },
  { key: 'Tax Delinquency', label: 'Tax Delinquency', icon: '💸', color: '#fb923c', group: 'offmarket' },
  { key: 'Property Issues', label: 'Property Issues', icon: '🏚', color: '#a78bfa', group: 'offmarket' },
  { key: 'Inherited House', label: 'Inherited House', icon: '📋', color: '#94a3b8', group: 'offmarket' },
  { key: 'Relocations',     label: 'Relocations',     icon: '🚚', color: '#34d399', group: 'offmarket' },
  { key: 'Fire Damage',     label: 'Fire Damage',     icon: '🔥', color: '#f97316', group: 'offmarket' },
  { key: 'Bank Owned',      label: 'Bank Owned',      icon: '🏦', color: '#60a5fa', group: 'offmarket' },
  { key: 'Too Many Liens',  label: 'Too Many Liens',  icon: '⛓',  color: '#c084fc', group: 'offmarket' },
  { key: 'No/Low Equity',   label: 'No/Low Equity',   icon: '📉', color: '#facc15', group: 'offmarket' },
]

const STORAGE_KEY = 'dr-finder-settings'
const ALL_KEYS    = FINDER_CATEGORIES.map(c => c.key)

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.enabledCategories)) return parsed
    }
  } catch {}
  return { enabledCategories: ALL_KEYS }
}

export function useFinderSettings() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  function toggleCategory(key) {
    setSettings(prev => {
      const enabled = prev.enabledCategories
      return {
        ...prev,
        enabledCategories: enabled.includes(key)
          ? enabled.filter(k => k !== key)
          : [...enabled, key],
      }
    })
  }

  function enableAll()  { setSettings(prev => ({ ...prev, enabledCategories: ALL_KEYS })) }
  function disableAll() { setSettings(prev => ({ ...prev, enabledCategories: [] })) }

  return { settings, toggleCategory, enableAll, disableAll }
}

// ── Filter helper ─────────────────────────────────────────────────────────────

/**
 * Filter opportunities array based on enabledCategories.
 * isListed items map to 'listed', 'Price Drop', 'Fixer-Upper', or 'Extended DOM'.
 * Off-market items map to their `type` field.
 */
export function filterOpportunities(opportunities, enabledCategories) {
  if (!opportunities) return []
  return opportunities.filter(opp => {
    let key
    if (opp.isListed === true) {
      key = (opp.type === 'Price Drop' || opp.type === 'Fixer-Upper' || opp.type === 'Extended DOM')
        ? opp.type
        : 'listed'
    } else {
      key = opp.type || 'listed'
    }
    return enabledCategories.includes(key)
  })
}

// ── Panel UI ─────────────────────────────────────────────────────────────────

export default function FinderSettings({ settings, toggleCategory, enableAll, disableAll, t }) {
  const [open, setOpen] = useState(false)

  const enabledCount = settings.enabledCategories.length
  const totalCount   = ALL_KEYS.length

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px',
          background: open ? 'rgba(37,99,235,0.15)' : 'var(--dr-surface)',
          border: `1px solid ${open ? 'rgba(37,99,235,0.5)' : 'var(--dr-border)'}`,
          borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          color: open ? '#93c5fd' : 'var(--dr-text-muted)',
          fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
        }}
      >
        <span>⚙️</span>
        <span>{t('Filter Settings', 'Filtros')}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px',
          background: enabledCount === totalCount ? 'rgba(34,197,94,0.15)' : 'rgba(250,204,21,0.15)',
          color:      enabledCount === totalCount ? '#4ade80'              : '#facc15',
          border:     `1px solid ${enabledCount === totalCount ? 'rgba(34,197,94,0.3)' : 'rgba(250,204,21,0.3)'}`,
          borderRadius: 20,
        }}>
          {enabledCount}/{totalCount} {t('active', 'activos')}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Collapsible panel */}
      {open && (
        <div style={{
          marginTop: 8,
          background: 'var(--dr-surface)',
          border: '1px solid var(--dr-border)',
          borderRadius: 14, padding: '20px 24px',
          animation: 'fadeIn 0.18s ease',
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dr-text-2)' }}>
              {t('Show / Hide Deal Categories', 'Mostrar / Ocultar Categorías')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={enableAll}
                style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 7, color: '#4ade80', fontFamily: 'Inter, sans-serif' }}
              >{t('All On', 'Todos')}</button>
              <button
                onClick={disableAll}
                style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 7, color: '#f87171', fontFamily: 'Inter, sans-serif' }}
              >{t('All Off', 'Ninguno')}</button>
            </div>
          </div>

          {/* MLS Listed group */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dr-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              🏠 {t('MLS Listed', 'Listados MLS')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FINDER_CATEGORIES.filter(c => c.group === 'listed').map(cat => (
                <CategoryPill
                  key={cat.key} cat={cat}
                  enabled={settings.enabledCategories.includes(cat.key)}
                  onToggle={() => toggleCategory(cat.key)}
                />
              ))}
            </div>
          </div>

          {/* Off-Market group */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dr-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              🔍 {t('Off-Market Niches', 'Nichos Fuera de Mercado')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FINDER_CATEGORIES.filter(c => c.group === 'offmarket').map(cat => (
                <CategoryPill
                  key={cat.key} cat={cat}
                  enabled={settings.enabledCategories.includes(cat.key)}
                  onToggle={() => toggleCategory(cat.key)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--dr-text-faint)', borderTop: '1px solid var(--dr-border)', paddingTop: 12 }}>
            💡 {t('Settings are saved automatically and persist between searches.', 'Los ajustes se guardan automáticamente y persisten entre búsquedas.')}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}

function CategoryPill({ cat, enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 13px', borderRadius: 20, cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        transition: 'all 0.15s',
        background: enabled ? `${cat.color}22` : 'var(--dr-surface-deep)',
        border:     `1px solid ${enabled ? cat.color + '66' : 'var(--dr-border)'}`,
        color:      enabled ? cat.color : 'var(--dr-text-faint)',
        opacity:    enabled ? 1 : 0.55,
      }}
    >
      <span>{cat.icon}</span>
      <span>{cat.label}</span>
      {enabled && <span style={{ fontSize: 10, opacity: 0.8 }}>✓</span>}
    </button>
  )
}
