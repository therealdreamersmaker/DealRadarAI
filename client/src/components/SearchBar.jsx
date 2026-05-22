import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSuggestions } from '../data/locations'

export default function SearchBar({ onSearch, loading, t }) {
  const [value,       setValue]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDrop,    setShowDrop]    = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef  = useRef(null)
  const dropRef   = useRef(null)

  useEffect(() => {
    const list = getSuggestions(value)
    setSuggestions(list)
    setShowDrop(list.length > 0 && value.length >= 2)
    setHighlighted(-1)
  }, [value])

  useEffect(() => {
    function handleClick(e) {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(loc) {
    setValue(loc)
    setShowDrop(false)
    onSearch(loc)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim()) { setShowDrop(false); onSearch(value.trim()) }
  }

  function handleKeyDown(e) {
    if (!showDrop) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)) }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); handleSelect(suggestions[highlighted]) }
    else if (e.key === 'Escape') { setShowDrop(false) }
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <span>
        {text.slice(0, idx)}
        <span style={{ color: '#60a5fa', fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </span>
    )
  }

  function getIcon(loc) {
    if (/\d{5}/.test(loc)) return '📮'
    if (loc.includes(',') && !loc.includes(' ')) return '🏙'
    if (['neighborhood', 'ward', 'side', 'hill', 'heights', 'park', 'town'].some(w => loc.toLowerCase().includes(w))) return '🏘'
    return '📍'
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '28px 0 20px' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          {/* Input row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>
                🔍
              </span>
              <input
                ref={inputRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                placeholder={t('Search city, state, zip, or neighborhood…', 'Buscar ciudad, estado, código postal…')}
                disabled={loading}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: 'var(--dr-surface)',
                  border: '1px solid var(--dr-border-blue)',
                  borderRadius: showDrop ? '12px 12px 0 0' : 12,
                  color: 'var(--dr-text-2)',
                  fontSize: 15,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s, background 0.25s',
                }}
                onFocusCapture={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = showDrop ? '#3b82f6' : 'var(--dr-border-blue)'}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading || !value.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '14px 28px',
                background: loading ? 'var(--dr-border-blue)' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none', borderRadius: 12,
                color: 'white', fontWeight: 700, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 8,
                minWidth: 130, justifyContent: 'center',
              }}
            >
              {loading ? (<><Spinner /> {t('Scanning…', 'Escaneando…')}</>) : <>{t('Find Deals', 'Buscar Tratos')}</>}
            </motion.button>
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDrop && (
              <motion.div
                ref={dropRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 130 + 10,
                  background: 'var(--dr-dropdown-bg)',
                  border: '1px solid #3b82f6',
                  borderTop: 'none', borderRadius: '0 0 12px 12px',
                  zIndex: 1000, overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
              >
                {suggestions.map((loc, i) => (
                  <motion.div
                    key={loc}
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseLeave={() => setHighlighted(-1)}
                    onMouseDown={() => handleSelect(loc)}
                    style={{
                      padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                      background: highlighted === i ? 'rgba(59,130,246,0.12)' : 'transparent',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--dr-border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{getIcon(loc)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--dr-text-3)', lineHeight: 1.3 }}>
                        {highlightMatch(loc, value)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', marginTop: 2 }}>
                        {/\d{5}/.test(loc)
                          ? t('ZIP Code · Click to analyze', 'Código ZIP · Clic para analizar')
                          : t('Market · Click to analyze', 'Mercado · Clic para analizar')}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--dr-border-blue)', flexShrink: 0 }}>
                      {highlighted === i ? '↵' : ''}
                    </span>
                  </motion.div>
                ))}
                <div style={{
                  padding: '7px 16px', fontSize: 10,
                  color: 'var(--dr-text-faintest)',
                  background: 'var(--dr-surface-deep)',
                  display: 'flex', gap: 16,
                }}>
                  <span>↑↓ {t('navigate', 'navegar')}</span>
                  <span>↵ {t('select', 'seleccionar')}</span>
                  <span>Esc {t('close', 'cerrar')}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginTop: 12, color: '#3b82f6', fontSize: 13 }}>
          {t('AI is analyzing market data and finding distressed properties…', 'La IA está analizando datos del mercado y encontrando propiedades…')}
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
