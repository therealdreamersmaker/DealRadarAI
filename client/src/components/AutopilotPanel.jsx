import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import LeadsTable from './LeadsTable'
import { useTheme } from '../ThemeContext'

const POLL_INTERVAL = 3000

const ALL_NICHES = ['Pre-Foreclosure', 'Tax Delinquency', 'Probate', 'Absentee Owner', 'Fixer-Upper', 'Price Drop', 'Extended DOM']

const DEFAULT_SETTINGS = {
  runTime:  '06:00',
  markets:  ['Atlanta, GA', 'Houston, TX', 'Dallas, TX'],
  niches:   ['Pre-Foreclosure', 'Tax Delinquency', 'Probate', 'Absentee Owner'],
}

function loadSettings() {
  try {
    const s = localStorage.getItem('dr-autopilot-settings')
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export default function AutopilotPanel({ t, API }) {
  const { chart } = useTheme()
  const [state,        setState]        = useState(null)
  const [triggering,   setTriggering]   = useState(false)
  const [error,        setError]        = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings,     setSettings]     = useState(loadSettings)
  const [marketInput,  setMarketInput]  = useState('')

  function saveSettings(next) {
    setSettings(next)
    try { localStorage.setItem('dr-autopilot-settings', JSON.stringify(next)) } catch {}
  }

  function handleTimeChange(e) {
    saveSettings({ ...settings, runTime: e.target.value })
  }

  function addMarket() {
    const v = marketInput.trim()
    if (v && !settings.markets.includes(v)) {
      saveSettings({ ...settings, markets: [...settings.markets, v] })
    }
    setMarketInput('')
  }

  function removeMarket(m) {
    saveSettings({ ...settings, markets: settings.markets.filter(x => x !== m) })
  }

  function toggleNiche(n) {
    const next = settings.niches.includes(n)
      ? settings.niches.filter(x => x !== n)
      : [...settings.niches, n]
    saveSettings({ ...settings, niches: next })
  }

  const fetchState = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/autopilot/state`)
      const data = await res.json()
      setState(data)
    } catch (err) {
      console.error('Autopilot state fetch failed', err)
    }
  }, [API])

  useEffect(() => {
    fetchState()
    const interval = setInterval(fetchState, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchState])

  async function triggerRun() {
    setTriggering(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/autopilot/run`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to start') }
      fetchState()
    } catch (err) {
      setError(err.message)
    } finally {
      setTriggering(false)
    }
  }

  const s          = state?.stats || {}
  const logs       = state?.logs || []
  const recentRuns = state?.recentRuns || []
  const isRunning  = state?.isRunning

  const pieData = [
    { name: t('Injected', 'Inyectados'), value: s.totalCRMInjected || 0, color: '#3b82f6' },
    { name: t('Discarded', 'Descartados'), value: Math.max(0, (s.totalLeadsProcessed || 0) - (s.totalCRMInjected || 0)), color: '#1e3a5f' },
  ]
  const runChartData = recentRuns.slice(0, 5).reverse().map((r, i) => ({
    run: `#${recentRuns.length - i}`, injected: r.stats?.injected || 0, failed: r.stats?.failed || 0, duration: r.duration || 0,
  }))

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--dr-grad-autopilot)',
        border: '1px solid var(--dr-border-blue)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', borderRadius: 12, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--dr-text-1)', letterSpacing: '-0.5px' }}>
                {t('Autopilot Deal Hunter', 'Cazador de Tratos Autopiloto')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--dr-text-faint)' }}>
                {t(`Daily cron job @ ${settings.runTime} • ${settings.niches.length} niches • ${settings.markets.length} markets`, `Tarea diaria a las ${settings.runTime} • ${settings.niches.length} nichos • ${settings.markets.length} mercados`)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: '8px 16px', fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s infinite' }} />
              {t('RUNNING', 'EJECUTANDO')}
            </div>
          )}
          {state?.nextRun && (
            <div style={{ fontSize: 11, color: 'var(--dr-text-faint)' }}>
              {t('Next:', 'Próximo:')} {new Date(state.nextRun).toLocaleString()}
            </div>
          )}
          <button
            onClick={() => setShowSettings(s => !s)}
            style={{
              padding: '10px 18px',
              background: showSettings ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.35)', borderRadius: 12,
              color: '#a78bfa', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ⚙ {t('Settings', 'Configuración')}
          </button>
          <motion.button
            onClick={triggerRun}
            disabled={isRunning || triggering}
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
            style={{
              padding: '12px 24px',
              background: isRunning ? 'var(--dr-border-blue)' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
              border: 'none', borderRadius: 12,
              color: isRunning ? 'var(--dr-text-faint)' : 'white',
              fontWeight: 700, fontSize: 14,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {isRunning || triggering ? (<><Spinner /> {t('Running…', 'Ejecutando…')}</>) : (<> ▶ {t('Run Now', 'Ejecutar Ahora')}</>)}
          </motion.button>
        </div>
      </div>

      {/* ── Settings Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 20 }}
          >
            <div style={{
              background: 'var(--dr-surface)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', letterSpacing: '0.08em', marginBottom: 20 }}>
                ⚙ {t('AUTOPILOT SETTINGS', 'CONFIGURACIÓN DEL AUTOPILOTO')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px 32px', alignItems: 'start' }}>

                {/* Run time */}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dr-text-muted)', paddingTop: 8 }}>
                  🕐 {t('Run Time', 'Hora de Ejecución')}
                </div>
                <div>
                  <input
                    type="time"
                    value={settings.runTime}
                    onChange={handleTimeChange}
                    style={{
                      background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
                      borderRadius: 8, padding: '8px 12px', color: 'var(--dr-text-1)',
                      fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--dr-text-faintest)', marginTop: 4 }}>
                    {t('Time the daily cron job fires (server local time)', 'Hora en que se ejecuta el trabajo diario (hora del servidor)')}
                  </div>
                </div>

                {/* Target markets */}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dr-text-muted)', paddingTop: 8 }}>
                  🗺 {t('Target Markets', 'Mercados Objetivo')}
                </div>
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {settings.markets.map(m => (
                      <span key={m} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#60a5fa', fontWeight: 600,
                      }}>
                        {m}
                        <button onClick={() => removeMarket(m)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 0 0 2px', fontFamily: 'inherit' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={marketInput}
                      onChange={e => setMarketInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addMarket()}
                      placeholder={t('e.g. Tampa, FL or 77001', 'ej. Tampa, FL o 77001')}
                      style={{
                        flex: 1, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
                        borderRadius: 8, padding: '8px 12px', color: 'var(--dr-text-1)',
                        fontSize: 12, fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <button
                      onClick={addMarket}
                      style={{
                        padding: '8px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 8, color: '#60a5fa', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      + {t('Add', 'Agregar')}
                    </button>
                  </div>
                </div>

                {/* Niches */}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dr-text-muted)', paddingTop: 8 }}>
                  🎯 {t('Niches', 'Nichos')}
                </div>
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ALL_NICHES.map(n => {
                      const on = settings.niches.includes(n)
                      return (
                        <button
                          key={n}
                          onClick={() => toggleNiche(n)}
                          style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                            background: on ? 'rgba(124,58,237,0.2)' : 'var(--dr-surface-deep)',
                            border: on ? '1px solid rgba(124,58,237,0.5)' : '1px solid var(--dr-border)',
                            color: on ? '#c4b5fd' : 'var(--dr-text-faint)',
                          }}
                        >
                          {on ? '✓ ' : ''}{n}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--dr-text-faintest)', marginTop: 8 }}>
                    {t('Select the distress categories the autopilot should focus on', 'Selecciona las categorías de angustia en las que el autopiloto debe enfocarse')}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, fontSize: 11, color: '#a78bfa' }}>
                ✅ {t('Settings are saved automatically to your browser — no sign-in required', 'La configuración se guarda automáticamente en tu navegador — no se necesita inicio de sesión')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#fca5a5', marginBottom: 16, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          [t('Total Runs', 'Ejecuciones Totales'), s.totalRuns || 0, '#3b82f6', '🔄'],
          [t('Leads Processed', 'Leads Procesados'), s.totalLeadsProcessed || 0, '#8b5cf6', '📋'],
          [t('CRM Injected', 'Inyectados CRM'), s.totalCRMInjected || 0, '#22c55e', '✅'],
          [t('Success Rate', 'Tasa de Éxito'), `${s.successRate || 0}%`, '#f59e0b', '📈'],
          [t('Avg Duration', 'Duración Promedio'), `${s.avgRunDuration || 0}s`, '#06b6d4', '⏱'],
        ].map(([label, val, color, icon]) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--dr-surface)', border: `1px solid ${color}33`, borderRadius: 14, padding: '18px 20px' }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 10, color: 'var(--dr-text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Recent Run Performance', 'Rendimiento de Ejecuciones Recientes')}
          </div>
          {runChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={runChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="run" tick={{ fill: chart.tick, fontSize: 10 }} />
                <YAxis tick={{ fill: chart.tick, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: chart.bg, border: `1px solid ${chart.border}`, borderRadius: 8 }} />
                <Bar dataKey="injected" fill="#3b82f6" radius={[4,4,0,0]} name={t('Injected', 'Inyectados')} />
                <Bar dataKey="failed"   fill="#ef4444" radius={[4,4,0,0]} name={t('Failed', 'Fallidos')} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart t={t} />}
        </div>

        <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Lead Distribution', 'Distribución de Leads')}
          </div>
          {s.totalLeadsProcessed > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: chart.bg, border: `1px solid ${chart.border}`, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart t={t} />}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--dr-text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          {t('5-Step Workflow', 'Flujo de Trabajo de 5 Pasos')}
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {WORKFLOW_STEPS.map((step, i) => {
            const latestRun = recentRuns[0]
            const stepDone  = latestRun?.steps?.find(s => s.step === i + 1)
            const status    = isRunning
              ? (stepDone ? 'done' : i === 0 ? 'active' : 'pending')
              : (stepDone ? 'done' : 'idle')
            return (
              <div key={step.title} style={{ flex: '0 0 180px', textAlign: 'center', position: 'relative' }}>
                {i < 4 && (
                  <div style={{ position: 'absolute', top: 22, left: '60%', width: '80%', height: 2, background: status === 'done' ? '#3b82f6' : 'var(--dr-border)', transition: 'background 0.3s' }} />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
                  background: status === 'done' ? '#2563eb' : status === 'active' ? 'rgba(59,130,246,0.2)' : 'var(--dr-surface-deep)',
                  border: `2px solid ${status === 'done' ? '#3b82f6' : status === 'active' ? '#3b82f6' : 'var(--dr-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.3s',
                  animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: status === 'done' ? '#60a5fa' : 'var(--dr-text-faint)', marginBottom: 4 }}>
                  {t(step.title, step.titleEs)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', lineHeight: 1.4, padding: '0 8px' }}>
                  {t(step.desc, step.descEs)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Download + Recent Runs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Latest Export', 'Última Exportación')}
          </div>
          {s.lastExportUrl ? (
            <div>
              <div style={{ fontSize: 13, color: 'var(--dr-text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                📁 {t('Enriched leads CSV is ready for download.', 'El CSV de leads enriquecidos está listo para descargar.')}
              </div>
              <a href={`${API}${s.lastExportUrl}`} download style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: '#4ade80', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                ⬇ {t('Download CSV', 'Descargar CSV')}
              </a>
            </div>
          ) : (
            <div style={{ color: 'var(--dr-text-faintest)', fontSize: 13 }}>
              {t('Run the autopilot to generate your first export.', 'Ejecuta el autopiloto para generar tu primera exportación.')}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Recent Runs', 'Ejecuciones Recientes')}
          </div>
          {recentRuns.length === 0 ? (
            <div style={{ color: 'var(--dr-text-faintest)', fontSize: 13 }}>{t('No runs yet.', 'Sin ejecuciones aún.')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentRuns.slice(0, 4).map(run => (
                <div key={run.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--dr-surface-deep)', borderRadius: 8, fontSize: 12 }}>
                  <div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, marginRight: 8,
                      background: run.status === 'completed' ? 'rgba(34,197,94,0.1)' : run.status === 'running' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                      color: run.status === 'completed' ? '#4ade80' : run.status === 'running' ? '#60a5fa' : '#f87171',
                    }}>
                      {run.status.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--dr-text-muted)' }}>{new Date(run.startTime).toLocaleString()}</span>
                  </div>
                  <span style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>
                    {run.stats?.injected || 0} {t('leads', 'leads')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div style={{ background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          {t('Processing Logs', 'Registros de Procesamiento')}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, maxHeight: 260, overflowY: 'auto' }}>
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--dr-text-faintest)' }}>{t('// Waiting for autopilot to run…', '// Esperando que el autopiloto se ejecute…')}</div>
            ) : (
              logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    color: log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fbbf24' : '#4ade80',
                    padding: '3px 0',
                    borderBottom: '1px solid var(--dr-border)',
                  }}
                >
                  <span style={{ color: 'var(--dr-text-faintest)' }}>{new Date(log.timestamp).toLocaleTimeString()} </span>
                  <span style={{ color: 'var(--dr-text-faint)' }}>[{log.level.toUpperCase()}] </span>
                  {log.message}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Leads Viewer ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '24px', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {t('Generated Leads', 'Leads Generados')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--dr-text-faint)' }}>
              {s.totalLeadsProcessed > 0
                ? t(`${s.totalLeadsProcessed} total leads across all runs`, `${s.totalLeadsProcessed} leads totales en todas las ejecuciones`)
                : t('Run the autopilot to populate this table.', 'Ejecuta el autopiloto para llenar esta tabla.')}
            </div>
          </div>

          {/* Export buttons — always visible; CSV greys out until data exists */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {s.lastExportUrl ? (
              <a
                href={`${API}${s.lastExportUrl}`}
                download
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: '#4ade80', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
              >
                ⬇ {t('Download CSV', 'Descargar CSV')}
              </a>
            ) : (
              <div
                title={t('Run the autopilot first to generate a CSV export', 'Ejecuta el autopiloto primero para generar un CSV')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 10, color: 'var(--dr-text-faintest)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', userSelect: 'none' }}
              >
                ⬇ {t('Download CSV', 'Descargar CSV')}
              </div>
            )}
            <button
              onClick={() => window.print()}
              title={t('Print leads table as PDF', 'Imprimir tabla de leads como PDF')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#60a5fa', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              🖨 {t('Print PDF', 'Imprimir PDF')}
            </button>
          </div>
        </div>
        <LeadsTable API={API} t={t} totalLeadsInState={s.totalLeadsProcessed} />
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function EmptyChart({ t }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dr-text-faintest)', fontSize: 12 }}>
      {t('Run autopilot to see chart data', 'Ejecuta el autopiloto para ver datos')}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}

const WORKFLOW_STEPS = [
  { icon: '🌐', title: 'Market Selection',  titleEs: 'Selección de Mercado',    desc: 'Target markets scanned by DOM, price drops & sale ratio', descEs: 'Mercados objetivo escaneados por DOM, rebajas y ratio' },
  { icon: '🏠', title: 'Lead Extraction',   titleEs: 'Extracción de Leads',     desc: 'Distressed properties pulled per selected niche',          descEs: 'Propiedades en dificultad extraídas por nicho seleccionado' },
  { icon: '🤖', title: 'AI Scoring',        titleEs: 'Puntuación IA',           desc: 'Each lead scored for motivation, equity & profit',         descEs: 'Cada lead puntuado por motivación, equidad y ganancia' },
  { icon: '📊', title: 'CSV Export',        titleEs: 'Exportar CSV',            desc: 'Structured spreadsheet with all enriched fields',          descEs: 'Hoja de cálculo estructurada con todos los campos' },
  { icon: '📬', title: 'Ready for Outreach',titleEs: 'Listo para Contacto',     desc: 'Leads ready for direct mail, SMS or cold calling',        descEs: 'Leads listos para correo directo, SMS o llamadas' },
]
