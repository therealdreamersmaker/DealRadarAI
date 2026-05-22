import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import LeadsTable from './LeadsTable'

const POLL_INTERVAL = 3000

export default function AutopilotPanel({ t, API }) {
  const [state, setState] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState(null)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/autopilot/state`)
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
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to start')
      }
      fetchState()
    } catch (err) {
      setError(err.message)
    } finally {
      setTriggering(false)
    }
  }

  const s = state?.stats || {}
  const logs = state?.logs || []
  const recentRuns = state?.recentRuns || []
  const isRunning = state?.isRunning

  const pieData = [
    { name: t('Injected', 'Inyectados'), value: s.totalCRMInjected || 0, color: '#3b82f6' },
    { name: t('Discarded', 'Descartados'), value: Math.max(0, (s.totalLeadsProcessed || 0) - (s.totalCRMInjected || 0)), color: '#1e3a5f' },
  ]

  const runChartData = recentRuns.slice(0, 5).reverse().map((r, i) => ({
    run: `#${recentRuns.length - i}`,
    injected: r.stats?.injected || 0,
    failed: r.stats?.failed || 0,
    duration: r.duration || 0,
  }))

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0f1e, #0d1a2e)',
        border: '1px solid #1e3a5f',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              borderRadius: 12, fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
                {t('Autopilot Deal Hunter', 'Cazador de Tratos Autopiloto')}
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                {t('Daily cron job @ 6:00 AM • GoHighLevel CRM integration', 'Tarea diaria a las 6:00 AM • Integración GoHighLevel CRM')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isRunning && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 20, padding: '8px 16px', fontSize: 12, color: '#60a5fa', fontWeight: 600,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s infinite' }} />
              {t('RUNNING', 'EJECUTANDO')}
            </div>
          )}
          {state?.nextRun && (
            <div style={{ fontSize: 11, color: '#475569' }}>
              {t('Next:', 'Próximo:')} {new Date(state.nextRun).toLocaleString()}
            </div>
          )}
          <motion.button
            onClick={triggerRun}
            disabled={isRunning || triggering}
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
            style={{
              padding: '12px 24px',
              background: isRunning ? '#1e3a5f' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
              border: 'none', borderRadius: 12,
              color: isRunning ? '#475569' : 'white',
              fontWeight: 700, fontSize: 14,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {isRunning || triggering ? (
              <><Spinner /> {t('Running…', 'Ejecutando…')}</>
            ) : (
              <> ▶ {t('Run Now', 'Ejecutar Ahora')}</>
            )}
          </motion.button>
        </div>
      </div>

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
            style={{
              background: '#0f172a',
              border: `1px solid ${color}33`,
              borderRadius: 14,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Bar chart of recent runs */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Recent Run Performance', 'Rendimiento de Ejecuciones Recientes')}
          </div>
          {runChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={runChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="run" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8 }} />
                <Bar dataKey="injected" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('Injected', 'Inyectados')} />
                <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name={t('Failed', 'Fallidos')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart t={t} />
          )}
        </div>

        {/* Pie chart */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Lead Distribution', 'Distribución de Leads')}
          </div>
          {s.totalLeadsProcessed > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart t={t} />
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          {t('5-Step Workflow', 'Flujo de Trabajo de 5 Pasos')}
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {WORKFLOW_STEPS.map((step, i) => {
            const latestRun = recentRuns[0]
            const stepDone = latestRun?.steps?.find(s => s.step === i + 1)
            const status = isRunning
              ? (stepDone ? 'done' : i === 0 ? 'active' : 'pending')
              : (stepDone ? 'done' : 'idle')

            return (
              <div key={step.title} style={{ flex: '0 0 180px', textAlign: 'center', position: 'relative' }}>
                {i < 4 && (
                  <div style={{
                    position: 'absolute', top: 22, left: '60%', width: '80%', height: 2,
                    background: status === 'done' ? '#3b82f6' : '#1e293b',
                    transition: 'background 0.3s',
                  }} />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
                  background: status === 'done' ? '#2563eb' : status === 'active' ? 'rgba(59,130,246,0.2)' : '#070b14',
                  border: `2px solid ${status === 'done' ? '#3b82f6' : status === 'active' ? '#3b82f6' : '#1e293b'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.3s',
                  animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: status === 'done' ? '#60a5fa' : '#475569', marginBottom: 4 }}>
                  {t(step.title, step.titleEs)}
                </div>
                <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.4, padding: '0 8px' }}>
                  {t(step.desc, step.descEs)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Download + Recent Runs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Export */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Latest Export', 'Última Exportación')}
          </div>
          {s.lastExportUrl ? (
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, lineHeight: 1.5 }}>
                📁 {t('Enriched leads CSV is ready for download.', 'El CSV de leads enriquecidos está listo para descargar.')}
              </div>
              <a
                href={`${API}${s.lastExportUrl}`}
                download
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10,
                  color: '#4ade80', textDecoration: 'none', fontSize: 13, fontWeight: 700,
                }}
              >
                ⬇ {t('Download CSV', 'Descargar CSV')}
              </a>
            </div>
          ) : (
            <div style={{ color: '#334155', fontSize: 13 }}>
              {t('Run the autopilot to generate your first export.', 'Ejecuta el autopiloto para generar tu primera exportación.')}
            </div>
          )}
        </div>

        {/* Recent runs */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            {t('Recent Runs', 'Ejecuciones Recientes')}
          </div>
          {recentRuns.length === 0 ? (
            <div style={{ color: '#334155', fontSize: 13 }}>{t('No runs yet.', 'Sin ejecuciones aún.')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentRuns.slice(0, 4).map(run => (
                <div key={run.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: '#070b14', borderRadius: 8, fontSize: 12,
                }}>
                  <div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, marginRight: 8,
                      background: run.status === 'completed' ? 'rgba(34,197,94,0.1)' : run.status === 'running' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                      color: run.status === 'completed' ? '#4ade80' : run.status === 'running' ? '#60a5fa' : '#f87171',
                    }}>
                      {run.status.toUpperCase()}
                    </span>
                    <span style={{ color: '#64748b' }}>{new Date(run.startTime).toLocaleString()}</span>
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
      <div style={{ background: '#040810', border: '1px solid #1e293b', borderRadius: 16, padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          {t('Processing Logs', 'Registros de Procesamiento')}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, maxHeight: 260, overflowY: 'auto' }}>
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <div style={{ color: '#1e293b' }}>{t('// Waiting for autopilot to run…', '// Esperando que el autopiloto se ejecute…')}</div>
            ) : (
              logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    color: log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fbbf24' : '#4ade80',
                    padding: '3px 0',
                    borderBottom: '1px solid #0a1020',
                  }}
                >
                  <span style={{ color: '#334155' }}>{new Date(log.timestamp).toLocaleTimeString()} </span>
                  <span style={{ color: '#475569' }}>[{log.level.toUpperCase()}] </span>
                  {log.message}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Leads Viewer ───────────────────────────────────────────────── */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '24px', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {t('Generated Leads', 'Leads Generados')}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {s.totalLeadsProcessed > 0
                ? t(`${s.totalLeadsProcessed} total leads across all runs`, `${s.totalLeadsProcessed} leads totales en todas las ejecuciones`)
                : t('Run the autopilot to populate this table.', 'Ejecuta el autopiloto para llenar esta tabla.')}
            </div>
          </div>
          {s.lastExportUrl && (
            <a
              href={`${API}${s.lastExportUrl}`}
              download
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10,
                color: '#4ade80', textDecoration: 'none', fontSize: 12, fontWeight: 700,
              }}
            >
              ⬇ {t('Download CSV', 'Descargar CSV')}
            </a>
          )}
        </div>
        <LeadsTable API={API} t={t} totalLeadsInState={s.totalLeadsProcessed} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}


function EmptyChart({ t }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 12 }}>
      {t('Run autopilot to see chart data', 'Ejecuta el autopiloto para ver datos')}
    </div>
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

const WORKFLOW_STEPS = [
  { icon: '🌐', title: 'Market Selection', titleEs: 'Selección de Mercado', desc: 'Top 3 zip codes by DOM, price drops & ratio', descEs: 'Los 3 mejores códigos postales' },
  { icon: '🏠', title: 'List Extraction', titleEs: 'Extracción de Lista', desc: '100 distressed properties per day', descEs: '100 propiedades por día' },
  { icon: '📞', title: 'Skip Tracing', titleEs: 'Rastreo de Contactos', desc: 'Owner contact enrichment & validation', descEs: 'Enriquecimiento de contactos' },
  { icon: '📊', title: 'CSV Export', titleEs: 'Exportar CSV', desc: 'Structured spreadsheet with all fields', descEs: 'Hoja de cálculo estructurada' },
  { icon: '🚀', title: 'CRM Injection', titleEs: 'Inyección CRM', desc: 'GoHighLevel with Autopilot_Lead_Ready tag', descEs: 'GoHighLevel con etiqueta Autopilot' },
]
