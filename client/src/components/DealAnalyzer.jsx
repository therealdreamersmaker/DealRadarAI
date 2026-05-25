/**
 * DealAnalyzer.jsx
 * Analyze any property by Zillow/Redfin URL or address.
 * Returns full AI wholesale analysis: ARV, offer, comps, exit strategies, etc.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt  = n => n != null ? `$${Number(n).toLocaleString()}` : '—'
const fmtN = n => n != null ? Number(n).toLocaleString() : '—'

// ── Score / verdict helpers ───────────────────────────────────────────────────
function scoreStyle(s) {
  if (s >= 9) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  label: s >= 9 ? 'HOT DEAL' : 'STRONG' }
  if (s >= 7) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', label: 'STRONG'  }
  if (s >= 5) return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', label: 'SOLID'   }
  if (s >= 3) return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', label: 'AVERAGE' }
  return            { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',  label: 'PASS'    }
}
const VERDICT_CFG = {
  'GO':        { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.45)',  icon: '🟢' },
  'WATCHLIST': { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.45)', icon: '🟡' },
  'PASS':      { color: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.45)',  icon: '🔴' },
}
const NBHD_LABEL = { A: 'Prime', B: 'Good', C: 'Average', D: 'Distressed' }
const NBHD_COLOR = { A: '#22c55e', B: '#60a5fa', C: '#fbbf24', D: '#f87171' }

// ── PricePerSqft comparison bar ───────────────────────────────────────────────
function PpsfBar({ label, value, max, highlight }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
      <span style={{ width: 80, color: 'var(--dr-text-faint)', flexShrink: 0, fontSize: 11 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--dr-border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: highlight ? '#3b82f6' : 'rgba(96,165,250,0.4)', borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ width: 56, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: highlight ? 800 : 600, color: highlight ? '#60a5fa' : 'var(--dr-text-muted)', fontSize: 12 }}>${fmtN(value)}</span>
    </div>
  )
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function Card({ title, icon, children, color = 'var(--dr-border-blue)', style = {} }) {
  return (
    <div style={{ background: 'var(--dr-surface)', border: `1px solid ${color}`, borderRadius: 16, padding: '18px 20px', ...style }}>
      {title && (
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dr-text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon} {title}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DealAnalyzer({ API, t, language }) {
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [result,   setResult]   = useState(null)

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API}/api/analyze-property`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ input: input.trim(), language }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Server error ${res.status}`)
      }
      setResult(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const ss = result ? scoreStyle(result.dealScore || 5) : null
  const vc = result ? (VERDICT_CFG[result.verdict] || VERDICT_CFG['WATCHLIST']) : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Input form ───────────────────────────────────────────────── */}
      <form onSubmit={handleAnalyze} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔬</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t(
                'Paste a Zillow / Redfin URL  —or—  type any US address (e.g. 123 Main St, Atlanta, GA 30301)',
                'Pega un link de Zillow/Redfin  —o—  escribe una dirección (ej: 123 Calle, Miami, FL 33101)'
              )}
              disabled={loading}
              style={{
                width: '100%', padding: '15px 16px 15px 50px',
                background: 'var(--dr-surface)', border: '1px solid var(--dr-border-blue)',
                borderRadius: 13, color: 'var(--dr-text-2)', fontSize: 14,
                fontFamily: 'Inter, sans-serif', outline: 'none',
              }}
              onFocus={e  => e.target.style.borderColor = '#3b82f6'}
              onBlur={e   => e.target.style.borderColor = 'var(--dr-border-blue)'}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '14px 28px', background: loading ? 'var(--dr-border-blue)' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
              border: 'none', borderRadius: 13, color: 'white', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap', minWidth: 140, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {loading ? <><Spinner /> {t('Analyzing…', 'Analizando…')}</> : `🔬 ${t('Analyze Deal', 'Analizar Trato')}`}
          </button>
        </div>

        {/* Example chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--dr-text-faintest)', marginTop: 2 }}>{t('Try:', 'Prueba:')}</span>
          {[
            'https://www.zillow.com/homedetails/123-Oak-St-Atlanta-GA-30310/12345_zpid/',
            '456 Pine Ave, Detroit, MI 48201',
            'https://www.redfin.com/TX/Houston/789-Elm-St-77051/home/123456',
          ].map(ex => (
            <button
              key={ex}
              type="button"
              onClick={() => setInput(ex)}
              style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 20,
                background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
                color: 'var(--dr-text-faint)', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#60a5fa' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dr-border)'; e.currentTarget.style.color = 'var(--dr-text-faint)' }}
            >
              {ex.length > 55 ? ex.slice(0, 52) + '…' : ex}
            </button>
          ))}
        </div>
      </form>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '14px 20px', color: '#fca5a5', marginBottom: 20, fontSize: 14 }}>
          ⚠ {error}
        </motion.div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dr-text-faint)', fontSize: 14, lineHeight: 2 }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🔬</div>
          <div style={{ fontWeight: 700, color: 'var(--dr-text-2)', fontSize: 16, marginBottom: 8 }}>{t('AI is analyzing the property…', 'La IA está analizando la propiedad…')}</div>
          <div style={{ color: 'var(--dr-text-faint)', fontSize: 13 }}>{t('Running comps · Estimating ARV · Scoring deal potential', 'Comparando ventas · Estimando ARV · Evaluando potencial')}</div>
        </motion.div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!result && !loading && !error && <EmptyHero t={t} />}

      {/* ── Results ───────────────────────────────────────────────────── */}
      <AnimatePresence>
      {result && (
        <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div style={{ background: 'var(--dr-grad-header-card)', border: '1px solid var(--dr-border-blue)', borderRadius: 20, padding: '24px 28px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--dr-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {result.platform ? `📍 Sourced from ${result.platform}` : '📍 Property Analysis'}
                  {result.dataSource === 'ai-analysis' && <span style={{ marginLeft: 8, fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd' }}>🤖 AI ANALYSIS</span>}
                </div>
                <h2 style={{ fontSize: 'clamp(16px,3vw,26px)', fontWeight: 900, color: 'var(--dr-text-1)', letterSpacing: '-0.5px', marginBottom: 12, lineHeight: 1.3 }}>
                  {result.address}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {/* Verdict */}
                  <span style={{ background: vc.bg, border: `1px solid ${vc.border}`, color: vc.color, padding: '6px 14px', borderRadius: 20, fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {vc.icon} {result.verdict}
                  </span>
                  {/* Deal Score */}
                  <span style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, padding: '6px 14px', borderRadius: 20, fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    ⭐ {result.dealScore}/10 — {result.dealScoreLabel}
                  </span>
                  {/* Neighborhood */}
                  {result.neighborhood && (
                    <span style={{ background: `${NBHD_COLOR[result.neighborhood]}18`, border: `1px solid ${NBHD_COLOR[result.neighborhood]}44`, color: NBHD_COLOR[result.neighborhood], padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                      🏘 {result.neighborhood}-Class · {NBHD_LABEL[result.neighborhood]}
                    </span>
                  )}
                  {/* Market Trend */}
                  {result.marketTrend && (
                    <span style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                      📈 {result.marketTrend}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {result.recommendation && (
              <div style={{ marginTop: 16, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--dr-text-3)', lineHeight: 1.7 }}>
                💡 {result.recommendation}
              </div>
            )}
          </div>

          {/* ── Main grid ───────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>

            {/* Property details */}
            <Card title="Property Details" icon="🏠" color="rgba(59,130,246,0.25)">
              {[
                ['Type',       result.propertyType],
                ['Beds',       result.beds ? `${result.beds} bedrooms` : '—'],
                ['Baths',      result.baths ? `${result.baths} bathrooms` : '—'],
                ['Sqft',       result.sqft ? `${fmtN(result.sqft)} sqft` : '—'],
                ['Year Built', result.yearBuilt ?? '—'],
                ['Est. DOM',   result.estimatedDom ? `${result.estimatedDom} days` : '—'],
                ['Distress',   result.distressType || '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--dr-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--dr-text-faint)' }}>{l}</span>
                  <span style={{ color: 'var(--dr-text-2)', fontWeight: 600 }}>{String(v)}</span>
                </div>
              ))}
            </Card>

            {/* Financials */}
            <Card title="Financial Analysis" icon="💰" color="rgba(34,197,94,0.25)">
              {[
                ['As-Is Value',       fmt(result.estimatedValue), '#94a3b8'],
                ['ARV (After Repair)', fmt(result.arv),           '#60a5fa'],
                ['Target Offer (70%)', fmt(result.targetOffer),   '#f97316'],
                ['Est. Profit',        result.arv && result.targetOffer ? fmt(result.arv - result.targetOffer) : '—', '#22c55e'],
                ['Equity Spread',      result.equitySpread != null ? `${result.equitySpread}%` : '—', '#a78bfa'],
              ].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--dr-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--dr-text-faint)' }}>{l}</span>
                  <span style={{ color: c, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                </div>
              ))}
            </Card>

            {/* $/sqft comparison */}
            {result.ppsftComparison && (
              <Card title="Price Per Sqft Comparison" icon="📐" color="rgba(124,58,237,0.25)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(() => {
                    const p = result.ppsftComparison
                    const max = Math.max(p.subject, p.zipAvg, p.cityAvg, p.stateAvg) * 1.15
                    return (
                      <>
                        <PpsfBar label="This Property" value={p.subject}   max={max} highlight />
                        <PpsfBar label={`ZIP ${p.zipLabel}`} value={p.zipAvg}   max={max} />
                        <PpsfBar label={p.cityLabel}          value={p.cityAvg}  max={max} />
                        <PpsfBar label={p.stateLabel}         value={p.stateAvg} max={max} />
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--dr-text-faint)', lineHeight: 1.5 }}>
                          {p.subject < p.zipAvg
                            ? `✅ This property is ${Math.round((1 - p.subject/p.zipAvg)*100)}% below ZIP average — good value`
                            : `⚠ This property is ${Math.round((p.subject/p.zipAvg - 1)*100)}% above ZIP average`}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </Card>
            )}
          </div>

          {/* ── Repair estimates ─────────────────────────────────── */}
          {result.repairEstimate && (
            <Card title="Repair Cost Estimates" icon="🔨" color="rgba(249,115,22,0.25)" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  ['💅 Light Rehab',  result.repairEstimate.light,  result.repairEstimate.lightDesc,  '#22c55e'],
                  ['🔧 Medium Rehab', result.repairEstimate.medium, result.repairEstimate.mediumDesc, '#fbbf24'],
                  ['🏗 Heavy Rehab',  result.repairEstimate.heavy,  result.repairEstimate.heavyDesc,  '#f87171'],
                ].map(([label, cost, desc, color]) => (
                  <div key={label} style={{ background: 'var(--dr-surface-deep)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${color}33` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color, marginBottom: 6 }}>{fmt(cost)}</div>
                    {desc && <div style={{ fontSize: 10, color: 'var(--dr-text-faint)', lineHeight: 1.5 }}>{desc}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Exit strategies ──────────────────────────────────── */}
          {result.exitStrategies?.length > 0 && (
            <Card title="Exit Strategy Analysis" icon="🚀" color="rgba(96,165,250,0.25)" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {result.exitStrategies.map((es, i) => {
                  const colors = ['#22c55e', '#3b82f6', '#a78bfa']
                  const c = colors[i] || '#60a5fa'
                  const diffColor = { Low: '#22c55e', Medium: '#fbbf24', High: '#f87171' }[es.difficulty] || '#94a3b8'
                  return (
                    <div key={es.strategy} style={{ background: 'var(--dr-surface-deep)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${c}33` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: c }}>{es.strategy}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: `${diffColor}18`, border: `1px solid ${diffColor}44`, color: diffColor }}>{es.difficulty}</span>
                      </div>
                      {es.strategy === 'Buy & Hold' ? (
                        <>
                          <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', marginBottom: 2 }}>Monthly Rent</div>
                          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: c, marginBottom: 6 }}>{fmt(es.projectedMonthlyRent)}/mo</div>
                          <div style={{ fontSize: 11, color: 'var(--dr-text-faint)' }}>Cap Rate: <span style={{ color: c, fontWeight: 700 }}>{es.capRate}%</span> · Cash Flow: <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(es.monthlyCashFlow)}/mo</span></div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', marginBottom: 2 }}>Projected Profit</div>
                          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: c, marginBottom: 6 }}>{fmt(es.projectedProfit)}</div>
                          <div style={{ fontSize: 11, color: 'var(--dr-text-faint)' }}>Timeline: <span style={{ color: 'var(--dr-text-2)' }}>{es.timeline}</span></div>
                          {es.rehabBudget && <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', marginTop: 2 }}>Rehab: <span style={{ color: '#f97316', fontWeight: 700 }}>{fmt(es.rehabBudget)}</span></div>}
                        </>
                      )}
                      {es.notes && <div style={{ marginTop: 8, fontSize: 10, color: 'var(--dr-text-faintest)', lineHeight: 1.5, borderTop: '1px solid var(--dr-border)', paddingTop: 6 }}>{es.notes}</div>}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* ── Comparable Sales ─────────────────────────────────── */}
          {result.comps?.length > 0 && (
            <Card title="Comparable Sales (AI Estimated)" icon="🏡" color="rgba(52,211,153,0.25)" style={{ marginBottom: 16 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--dr-surface-deep)' }}>
                      {['Address', 'Sold', 'Date', 'Beds/Bath', 'Sqft', '$/sqft', 'Condition', 'Distance'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--dr-text-faint)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.comps.map((comp, i) => {
                      const condColor = { Updated: '#22c55e', Average: '#fbbf24', 'Needs Work': '#f87171' }[comp.condition] || '#94a3b8'
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--dr-border)', background: i % 2 === 0 ? 'var(--dr-surface-deep)' : 'transparent' }}>
                          <td style={{ padding: '9px 12px', color: 'var(--dr-text-2)', fontWeight: 600 }}>{comp.address}</td>
                          <td style={{ padding: '9px 12px', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmt(comp.soldPrice)}</td>
                          <td style={{ padding: '9px 12px', color: 'var(--dr-text-faint)', whiteSpace: 'nowrap' }}>{comp.soldDate}</td>
                          <td style={{ padding: '9px 12px', color: 'var(--dr-text-muted)', whiteSpace: 'nowrap' }}>{comp.beds}bd/{comp.baths}ba</td>
                          <td style={{ padding: '9px 12px', color: 'var(--dr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtN(comp.sqft)}</td>
                          <td style={{ padding: '9px 12px', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>${fmtN(comp.pricePerSqft)}</td>
                          <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${condColor}18`, color: condColor }}>{comp.condition}</span></td>
                          <td style={{ padding: '9px 12px', color: 'var(--dr-text-faint)', fontSize: 11 }}>{comp.distanceDesc}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Insights + Red Flags + Negotiation ───────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
            {/* Deal insights */}
            {result.insights?.length > 0 && (
              <Card title="Deal Insights" icon="✦" color="rgba(34,197,94,0.25)">
                {result.insights.map((ins, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#86efac', lineHeight: 1.6, padding: '5px 0', borderBottom: i < result.insights.length - 1 ? '1px solid var(--dr-border)' : 'none' }}>{ins}</div>
                ))}
              </Card>
            )}

            {/* Red flags */}
            {result.redFlags?.length > 0 && (
              <Card title="Red Flags / Risks" icon="⚠️" color="rgba(239,68,68,0.25)">
                {result.redFlags.map((rf, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.6, padding: '5px 0', borderBottom: i < result.redFlags.length - 1 ? '1px solid var(--dr-border)' : 'none' }}>{rf}</div>
                ))}
              </Card>
            )}

            {/* Negotiation tips */}
            {result.negotiationTips?.length > 0 && (
              <Card title="Negotiation Tips" icon="🤝" color="rgba(251,191,36,0.25)">
                {result.negotiationTips.map((tip, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#fde68a', lineHeight: 1.6, padding: '5px 0', borderBottom: i < result.negotiationTips.length - 1 ? '1px solid var(--dr-border)' : 'none' }}>{tip}</div>
                ))}
              </Card>
            )}
          </div>

          {/* ── Market Context ───────────────────────────────────── */}
          {result.marketContext && (
            <Card title="Market Context" icon="🗺" color="rgba(96,165,250,0.2)" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--dr-text-3)', lineHeight: 1.75, margin: 0 }}>{result.marketContext}</p>
            </Card>
          )}

          {/* Source link */}
          {result.sourceUrl && (
            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                🔗 {t('View original listing on', 'Ver listado original en')} {result.platform} →
              </a>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 10, padding: '10px 16px', fontSize: 11, color: 'var(--dr-text-faint)', lineHeight: 1.6, marginTop: 8 }}>
            🤖 <strong style={{ color: '#c4b5fd' }}>AI Analysis Disclaimer:</strong> All figures (ARV, comps, repair costs, rents) are AI-estimated based on general market knowledge and may not reflect current conditions. Always verify with a local agent, appraiser, or inspector before making an offer.
          </div>

        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

// ── Empty hero ────────────────────────────────────────────────────────────────
function EmptyHero({ t }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔬</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dr-text-2)', marginBottom: 10 }}>
        {t('Analyze Any Property in Seconds', 'Analiza Cualquier Propiedad en Segundos')}
      </h2>
      <p style={{ color: 'var(--dr-text-faint)', fontSize: 14, maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.7 }}>
        {t(
          'Paste a Zillow or Redfin listing URL, or type any US address. Our AI will analyze ARV, suggest an offer price, run comps, and tell you exactly how to approach the deal.',
          'Pega un link de Zillow o Redfin, o escribe cualquier dirección. Nuestra IA analizará ARV, sugerirá precio de oferta, comparará ventas y te dirá cómo abordar el trato.'
        )}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, maxWidth: 720, margin: '0 auto' }}>
        {[
          ['🏠', 'ARV Estimate', 'AI-computed after-repair value based on local comps'],
          ['💰', 'Target Offer', '70% ARV rule with profit projection'],
          ['📊', 'Comparable Sales', '3–4 recent nearby sales for validation'],
          ['🔨', 'Repair Costs', 'Light / Medium / Heavy rehab budgets'],
          ['🚀', 'Exit Strategies', 'Wholesale · Fix & Flip · Buy & Hold analysis'],
          ['📐', '$/sqft Comparison', 'vs ZIP, city, and state averages'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 12, padding: '16px 14px', textAlign: 'left' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dr-text-2)', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}
