import { motion } from 'framer-motion'
import { useTheme } from '../ThemeContext'

export default function Header({ language, setLanguage, t }) {
  const { isDark, toggle } = useTheme()

  return (
    <header className="no-print" style={{
      background: 'var(--dr-grad-nav)',
      borderBottom: '1px solid var(--dr-border)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            📡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: 'var(--dr-text-1)' }}>
              Deal<span style={{ color: '#3b82f6' }}>Radar</span> AI
            </div>
            <div style={{ fontSize: 10, color: 'var(--dr-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('Real Estate Intelligence', 'Inteligencia Inmobiliaria')}
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--dr-surface)',
            border: '1px solid var(--dr-border)',
            borderRadius: 8,
            overflow: 'hidden',
            fontSize: 12,
            fontWeight: 600,
          }}>
            {['en', 'es'].map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '6px 14px',
                  background: language === lang ? '#2563eb' : 'transparent',
                  color: language === lang ? 'white' : 'var(--dr-text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 12,
                  transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Dark / Light mode toggle */}
          <button
            onClick={toggle}
            title={isDark ? t('Switch to light mode', 'Cambiar a modo claro') : t('Switch to dark mode', 'Cambiar a modo oscuro')}
            style={{
              width: 52, height: 28,
              borderRadius: 14,
              border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`,
              background: isDark ? '#0f172a' : '#dbeafe',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.3s, border-color 0.3s',
              flexShrink: 0,
            }}
          >
            <motion.div
              animate={{ left: isDark ? 3 : 25 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              style={{
                position: 'absolute',
                top: 3,
                width: 20, height: 20,
                borderRadius: '50%',
                background: isDark ? '#1e3a5f' : '#fde68a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
              }}
            >
              {isDark ? '🌙' : '☀️'}
            </motion.div>
          </button>

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 11,
            color: '#4ade80',
            fontWeight: 600,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            {t('LIVE', 'EN VIVO')}
          </div>
        </div>
      </div>
    </header>
  )
}
