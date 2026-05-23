import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import Dashboard from './components/Dashboard'
import Copilot from './components/Copilot'
import AutopilotPanel from './components/AutopilotPanel'
import LandingHero from './components/LandingHero'
import SettingsPage from './components/SettingsPage'
import ProfilePage from './components/ProfilePage'

const API = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [language,     setLanguage]     = useState('en')
  const [activePage,   setActivePage]   = useState('finder')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [dashboardData,setDashboardData]= useState(null)
  const [location,     setLocation]     = useState('')
  const [scanLoading,  setScanLoading]  = useState(false)
  const [finderTab,    setFinderTab]    = useState('results') // 'results' | 'copilot'

  const t = (en, es) => language === 'es' ? es : en

  async function handleSearch(loc) {
    setLocation(loc)
    setLoading(true)
    setError(null)
    setDashboardData(null)
    setActivePage('finder')
    setFinderTab('results')
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: loc, language }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error ${res.status}`)
      }
      const data = await res.json()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleScanMore() {
    if (!dashboardData) return
    setScanLoading(true)
    try {
      const existing = dashboardData.opportunities.map(o => o.address).filter(Boolean)
      const res = await fetch(`${API}/api/scan-more`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, existingAddresses: existing, language }),
      })
      if (!res.ok) throw new Error('Scan failed')
      const newOps = await res.json()
      setDashboardData(prev => ({
        ...prev,
        opportunities: [...prev.opportunities, ...newOps],
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--dr-page)' }}>
      <Sidebar
        active={activePage}
        setActive={setActivePage}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">

          {/* ── Deal Finder ─────────────────────────────────────── */}
          {activePage === 'finder' && (
            <motion.div
              key="finder"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, padding: '28px 32px 48px' }}
            >
              <PageTitle
                icon="🔍"
                title={t('Deal Finder', 'Buscador de Tratos')}
                sub={t('Search any US market for wholesale opportunities', 'Busca oportunidades de mayoreo en cualquier mercado de EE.UU.')}
              />

              <SearchBar onSearch={handleSearch} loading={loading} language={language} t={t} />

              {error && <ErrorBanner msg={error} />}

              {!dashboardData && !loading && !error && <LandingHero t={t} />}

              {(dashboardData || loading) && (
                <>
                  {/* Sub-tabs */}
                  <div className="no-print" style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                    {[
                      { id: 'results', label: t('Market Results', 'Resultados') },
                      { id: 'copilot', label: t('AI Copilot', 'Copiloto IA') },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setFinderTab(tab.id)} style={{
                        padding: '7px 18px', borderRadius: 7, border: 'none',
                        background: finderTab === tab.id ? '#2563eb' : 'transparent',
                        color: finderTab === tab.id ? 'white' : 'var(--dr-text-faint)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', transition: 'all 0.18s',
                      }}>{tab.label}</button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {finderTab === 'results' && (
                      <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Dashboard
                          data={dashboardData}
                          loading={loading}
                          onScanMore={handleScanMore}
                          scanLoading={scanLoading}
                          language={language}
                          t={t}
                        />
                      </motion.div>
                    )}
                    {finderTab === 'copilot' && (
                      <motion.div key="copilot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Copilot dashboardData={dashboardData} language={language} t={t} API={API} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}

          {/* ── Dashboard overview ─────────────────────────────── */}
          {activePage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, padding: '28px 32px 48px' }}
            >
              <PageTitle
                icon="📊"
                title={t('Dashboard', 'Panel Principal')}
                sub={t('Market overview and recent activity', 'Resumen del mercado y actividad reciente')}
              />
              {dashboardData ? (
                <Dashboard
                  data={dashboardData}
                  loading={false}
                  onScanMore={handleScanMore}
                  scanLoading={scanLoading}
                  language={language}
                  t={t}
                />
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', paddingTop: 80, gap: 16, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 56 }}>📊</div>
                  <div style={{ fontWeight: 700, color: 'var(--dr-text-2)', fontSize: 18 }}>
                    {t('No market data yet', 'Aún no hay datos de mercado')}
                  </div>
                  <div style={{ color: 'var(--dr-text-faint)', fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
                    {t('Use Deal Finder to search a market and your results will appear here.', 'Usa el Buscador de Tratos para buscar un mercado y tus resultados aparecerán aquí.')}
                  </div>
                  <button
                    onClick={() => setActivePage('finder')}
                    style={{ marginTop: 8, padding: '11px 24px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    🔍 {t('Go to Deal Finder', 'Ir al Buscador de Tratos')}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Autopilot Hunter ───────────────────────────────── */}
          {activePage === 'autopilot' && (
            <motion.div
              key="autopilot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, padding: '28px 32px 48px' }}
            >
              <PageTitle
                icon="⚡"
                title={t('Autopilot Hunter', 'Cazador Autopiloto')}
                sub={t('Automated daily lead discovery and processing', 'Descubrimiento y procesamiento automático diario de leads')}
              />
              <AutopilotPanel language={language} t={t} API={API} />
            </motion.div>
          )}

          {/* ── Settings ───────────────────────────────────────── */}
          {activePage === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, padding: '28px 32px 48px' }}
            >
              <SettingsPage t={t} />
            </motion.div>
          )}

          {/* ── Profile ────────────────────────────────────────── */}
          {activePage === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, padding: '28px 32px 48px' }}
            >
              <ProfilePage t={t} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:.7}50%{opacity:1} }`}</style>
    </div>
  )
}

function PageTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dr-text-1)', letterSpacing: '-0.5px' }}>{title}</h1>
      </div>
      <p style={{ fontSize: 13, color: 'var(--dr-text-faint)', marginLeft: 30 }}>{sub}</p>
    </div>
  )
}

function ErrorBanner({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: 12, padding: '14px 20px', color: '#fca5a5',
        marginBottom: 24, fontSize: 14,
      }}
    >
      ⚠ {msg}
    </motion.div>
  )
}
