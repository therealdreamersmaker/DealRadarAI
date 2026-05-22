import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import Dashboard from './components/Dashboard'
import Copilot from './components/Copilot'
import AutopilotPanel from './components/AutopilotPanel'
import LandingHero from './components/LandingHero'
import { AnimatePresence, motion } from 'framer-motion'

// In production, Express serves both API and frontend on the same origin,
// so relative URLs work. In dev, Vite proxies /api → localhost:3001.
const API = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [language, setLanguage] = useState('en')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [location, setLocation] = useState('')
  const [scanLoading, setScanLoading] = useState(false)

  const t = (en, es) => language === 'es' ? es : en

  async function handleSearch(loc) {
    setLocation(loc)
    setLoading(true)
    setError(null)
    setDashboardData(null)
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
      setActiveTab('dashboard')
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
      const existing = dashboardData.opportunities.map(o => o.address)
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

  const tabs = [
    { id: 'dashboard', label: t('Market Analysis', 'Análisis de Mercado') },
    { id: 'copilot', label: t('AI Copilot', 'Copiloto IA') },
    { id: 'autopilot', label: t('Autopilot Hunter', 'Cazador Autopiloto') },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#070b14' }}>
      <Header language={language} setLanguage={setLanguage} t={t} />

      <main style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '0 20px 40px' }}>
        <SearchBar onSearch={handleSearch} loading={loading} language={language} t={t} />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 12,
              padding: '14px 20px',
              color: '#fca5a5',
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            ⚠ {error}
          </motion.div>
        )}

        {!dashboardData && !loading && !error && <LandingHero t={t} />}

        {(dashboardData || loading) && (
          <>
            <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                    color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
              {activeTab === 'copilot' && (
                <motion.div key="copilot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Copilot dashboardData={dashboardData} language={language} t={t} API={API} />
                </motion.div>
              )}
              {activeTab === 'autopilot' && (
                <motion.div key="autopilot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <AutopilotPanel language={language} t={t} API={API} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {!dashboardData && !loading && (
          <div className="no-print" style={{ marginTop: 40 }}>
            <AutopilotPanel language={language} t={t} API={API} />
          </div>
        )}
      </main>
    </div>
  )
}
