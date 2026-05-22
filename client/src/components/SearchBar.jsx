import { useState } from 'react'
import { motion } from 'framer-motion'

export default function SearchBar({ onSearch, loading, t }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '28px 0 20px' }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 680, margin: '0 auto' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={t('Search city, state, zip, or neighborhood…', 'Buscar ciudad, estado, código postal…')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              background: '#0f172a',
              border: '1px solid #1e3a5f',
              borderRadius: 12,
              color: '#e2e8f0',
              fontSize: 15,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#1e3a5f'}
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading || !value.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '14px 28px',
            background: loading ? '#1e3a5f' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 120,
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <>
              <Spinner />
              {t('Scanning…', 'Escaneando…')}
            </>
          ) : (
            t('Analyze', 'Analizar')
          )}
        </motion.button>
      </form>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', marginTop: 12, color: '#3b82f6', fontSize: 13 }}
        >
          {t('AI is scanning live market data and distressed properties…', 'La IA está escaneando datos de mercado en vivo y propiedades en dificultad…')}
        </motion.div>
      )}
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
