import { motion } from 'framer-motion'
import { useTheme } from '../ThemeContext'

const NAV_MAIN = [
  { id: 'dashboard',  icon: '📊', label: 'Dashboard',        labelEs: 'Panel Principal' },
  { id: 'finder',     icon: '🔍', label: 'Deal Finder',       labelEs: 'Buscador de Tratos' },
  { id: 'analyzer',   icon: '🔬', label: 'Deal Analyzer',     labelEs: 'Analizador de Tratos' },
  { id: 'autopilot',  icon: '⚡', label: 'Autopilot Hunter',  labelEs: 'Cazador Autopiloto' },
  { id: 'saved',      icon: '💾', label: 'Deal Bank',         labelEs: 'Banco de Tratos' },
  { id: 'csv',        icon: '📂', label: 'CSV Import',        labelEs: 'Importar CSV' },
]
const NAV_BOTTOM = [
  { id: 'settings',   icon: '⚙',  label: 'Settings',         labelEs: 'Configuración' },
  { id: 'profile',    icon: '👤', label: 'Profile',           labelEs: 'Perfil' },
]

export default function Sidebar({ active, setActive, language, setLanguage, t }) {
  const { isDark, toggle } = useTheme()

  const NavItem = ({ item }) => {
    const isActive = active === item.id
    return (
      <motion.button
        onClick={() => setActive(item.id)}
        whileHover={{ x: 3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10, border: 'none',
          background: isActive
            ? 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.12))'
            : 'transparent',
          borderLeft: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`,
          color: isActive ? '#93c5fd' : 'var(--dr-text-faint)',
          fontSize: 13, fontWeight: isActive ? 700 : 500,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          textAlign: 'left', width: '100%', transition: 'color 0.15s, background 0.15s',
        }}
      >
        <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
        <span>{t(item.label, item.labelEs)}</span>
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}
          />
        )}
      </motion.button>
    )
  }

  return (
    <aside style={{
      width: 220, minWidth: 220,
      height: '100vh', position: 'sticky', top: 0,
      background: 'var(--dr-surface)',
      borderRight: '1px solid var(--dr-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--dr-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>📡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.4px', color: 'var(--dr-text-1)', lineHeight: 1.2 }}>
              Deal<span style={{ color: '#3b82f6' }}>Radar</span> AI
            </div>
            <div style={{ fontSize: 9, color: 'var(--dr-text-faintest)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('Real Estate Intelligence', 'Inteligencia Inmobiliaria')}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 9, color: 'var(--dr-text-faintest)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 14px 8px' }}>
          {t('Main Menu', 'Menú Principal')}
        </div>
        {NAV_MAIN.map(item => <NavItem key={item.id} item={item} />)}

        <div style={{ fontSize: 9, color: 'var(--dr-text-faintest)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 14px 8px' }}>
          {t('Account', 'Cuenta')}
        </div>
        {NAV_BOTTOM.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: '12px 8px 16px', borderTop: '1px solid var(--dr-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Language */}
        <div style={{
          display: 'flex', background: 'var(--dr-surface-deep)',
          border: '1px solid var(--dr-border)', borderRadius: 8,
          overflow: 'hidden', fontSize: 11,
        }}>
          {['en', 'es'].map(lang => (
            <button key={lang} onClick={() => setLanguage(lang)} style={{
              flex: 1, padding: '7px 0',
              background: language === lang ? '#2563eb' : 'transparent',
              color: language === lang ? 'white' : 'var(--dr-text-faint)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11,
              transition: 'all 0.2s', letterSpacing: '0.05em',
            }}>
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: 'var(--dr-surface-deep)',
          border: '1px solid var(--dr-border)', borderRadius: 8,
          color: 'var(--dr-text-faint)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          transition: 'color 0.2s',
        }}>
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span>{isDark ? t('Dark Mode', 'Modo Oscuro') : t('Light Mode', 'Modo Claro')}</span>
        </button>

        {/* Live pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: 'rgba(34,197,94,0.07)',
          border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8,
          fontSize: 9.5, color: '#4ade80', fontWeight: 600, letterSpacing: '0.04em',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          {t('LIVE · RentCast + Gemini AI', 'EN VIVO · RentCast + Gemini IA')}
        </div>
      </div>
    </aside>
  )
}
