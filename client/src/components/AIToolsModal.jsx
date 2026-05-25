import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'scripts', label: '📞 Outreach Scripts', labelEs: '📞 Scripts de Contacto' },
  { id: 'memo',    label: '📄 Deal Memo',        labelEs: '📄 Memo del Deal' },
  { id: 'score',   label: '🏘 Walk Score',        labelEs: '🏘 Walk Score' },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.1)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.3)'}`,
        color: copied ? '#4ade80' : '#60a5fa',
        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

function ScriptBlock({ label, content }) {
  if (!content) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--dr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <CopyButton text={content} />
      </div>
      <div style={{
        background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
        borderRadius: 10, padding: '14px 16px',
        fontSize: 13, color: 'var(--dr-text-3)', lineHeight: 1.75,
        whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif',
      }}>
        {content}
      </div>
    </div>
  )
}

function MemoSection({ label, content, color = 'var(--dr-text-muted)' }) {
  if (!content) return null
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--dr-text-3)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {content}
      </div>
    </div>
  )
}

function WalkScoreGauge({ score, label, color }) {
  if (score == null) return null
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--dr-border)" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${pct * 2.136} 213.6`}
            strokeDashoffset="53.4"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
          {score}
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dr-text-muted)' }}>{label}</div>
    </div>
  )
}

export default function AIToolsModal({ property, API, language = 'en', t = (a) => a, onClose }) {
  const [tab,        setTab]        = useState('scripts')
  const [scripts,    setScripts]    = useState(null)
  const [memo,       setMemo]       = useState(null)
  const [walkScore,  setWalkScore]  = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const addr = property.fullAddress || property.address || 'this property'

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function loadScripts() {
    if (scripts) return
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API}/api/ai-tools/scripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, language }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setScripts(await res.json())
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function loadMemo() {
    if (memo) return
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API}/api/ai-tools/memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, language }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setMemo(await res.json())
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function loadWalkScore() {
    if (walkScore !== null) return
    const address = property.fullAddress || property.address
    if (!address) { setWalkScore({ available: false, reason: 'No address' }); return }
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API}/api/walkscore?address=${encodeURIComponent(address)}`)
      setWalkScore(await res.json())
    } catch (err) { setWalkScore({ available: false, error: err.message }) }
    finally { setLoading(false) }
  }

  function handleTabClick(id) {
    setTab(id); setError(null)
    if (id === 'scripts') loadScripts()
    if (id === 'memo')    loadMemo()
    if (id === 'score')   loadWalkScore()
  }

  // Auto-load first tab
  useEffect(() => { loadScripts() }, []) // eslint-disable-line

  function handlePrintMemo() {
    if (!memo) return
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Deal Memo — ${addr}</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;max-width:760px;margin:40px auto;color:#111;line-height:1.7}
    h1{font-size:20px;margin-bottom:4px}h2{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:24px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
    p{margin:0 0 12px}</style></head><body>
    <h1>${memo.headline || 'Deal Memo'}</h1>
    <p style="color:#666;font-size:12px">📍 ${addr} &nbsp;|&nbsp; Generated by DealRadar AI</p>
    <h2>Executive Summary</h2><p>${memo.summary || ''}</p>
    <h2>Deal Analysis</h2><p>${memo.dealAnalysis || ''}</p>
    <h2>Exit Strategies</h2><p>${(memo.exitStrategies || '').replace(/\n/g,'<br>')}</p>
    <h2>Risk Factors</h2><p>${(memo.riskFactors || '').replace(/\n/g,'<br>')}</p>
    <h2>Next Steps</h2><p>${(memo.nextSteps || '').replace(/\n/g,'<br>')}</p>
    </body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
            borderRadius: 20, width: '100%', maxWidth: 680,
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  🤖 AI Tools
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dr-text-1)', lineHeight: 1.3 }}>
                  {addr}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 8, padding: '6px 10px', color: 'var(--dr-text-faint)', cursor: 'pointer', fontSize: 16, lineHeight: 1, fontFamily: 'inherit', flexShrink: 0, marginLeft: 12 }}
              >✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 10, padding: 3 }}>
              {TABS.map(tb => (
                <button
                  key={tb.id}
                  onClick={() => handleTabClick(tb.id)}
                  style={{
                    flex: 1, padding: '7px 8px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700,
                    background: tab === tb.id ? '#7c3aed' : 'transparent',
                    color: tab === tb.id ? 'white' : 'var(--dr-text-faint)',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {language === 'es' ? tb.labelEs : tb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
                ⚠ {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 16 }}>
                <div style={{ width: 36, height: 36, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ color: 'var(--dr-text-faint)', fontSize: 13 }}>
                  {tab === 'scripts' ? '✍️ Writing personalized outreach scripts…' :
                   tab === 'memo'    ? '📊 Generating investor deal memo…' :
                                      '🏘 Fetching Walk Score data…'}
                </div>
              </div>
            )}

            {/* ── SCRIPTS TAB ───────────────────────────────── */}
            {tab === 'scripts' && !loading && scripts && (
              <div>
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#a78bfa' }}>
                  💡 Replace <strong>[YOUR NAME]</strong> with your name before sending. Scripts are personalized to the <strong>{property.distressType || property.type}</strong> situation.
                </div>
                <ScriptBlock label="📞 Cold Call Script" content={scripts.coldCall} />
                <ScriptBlock label="💬 SMS Text" content={scripts.sms} />
                <ScriptBlock label="✉️ Direct Mail Letter" content={scripts.directMail} />
              </div>
            )}

            {/* ── MEMO TAB ─────────────────────────────────── */}
            {tab === 'memo' && !loading && memo && (
              <div>
                {/* Headline */}
                {memo.headline && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.12))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 16, fontWeight: 800, color: 'var(--dr-text-1)', lineHeight: 1.3 }}>
                    {memo.headline}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button
                    onClick={handlePrintMemo}
                    style={{ padding: '6px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, color: '#60a5fa', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                  >🖨 Print / Save PDF</button>
                </div>
                <MemoSection label="📋 Executive Summary"  content={memo.summary}        color="#a78bfa" />
                <MemoSection label="💰 Deal Analysis"      content={memo.dealAnalysis}   color="#60a5fa" />
                <MemoSection label="🚀 Exit Strategies"    content={memo.exitStrategies} color="#22c55e" />
                <MemoSection label="⚠ Risk Factors"        content={memo.riskFactors}    color="#f87171" />
                <MemoSection label="✅ Next Steps"          content={memo.nextSteps}      color="#fbbf24" />
              </div>
            )}

            {/* ── WALK SCORE TAB ───────────────────────────── */}
            {tab === 'score' && !loading && (
              <div>
                {walkScore?.available === false ? (
                  <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🏘</div>
                    <div style={{ fontWeight: 700, color: 'var(--dr-text-2)', marginBottom: 8 }}>
                      Walk Score Not Configured
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--dr-text-faint)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 20px' }}>
                      {walkScore.reason || 'Add a free Walk Score API key to see walkability, transit, and bike scores for any address.'}
                    </div>
                    <a
                      href="https://www.walkscore.com/professional/api.php"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 10, color: '#60a5fa', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                    >
                      🔗 Get Free API Key at WalkScore.com
                    </a>
                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--dr-text-faintest)' }}>
                      Then set <code style={{ background: 'var(--dr-surface-deep)', padding: '2px 5px', borderRadius: 4 }}>WALKSCORE_API_KEY</code> in your Railway environment variables.
                    </div>
                  </div>
                ) : walkScore?.available && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--dr-text-faint)', marginBottom: 20, textAlign: 'center' }}>
                      📍 {addr}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 24 }}>
                      <WalkScoreGauge score={walkScore.walkScore}    label={`🚶 Walk${walkScore.walkDescription ? '\n' + walkScore.walkDescription : ''}`}    color="#22c55e" />
                      <WalkScoreGauge score={walkScore.transitScore} label={`🚌 Transit${walkScore.transitDesc ? '\n' + walkScore.transitDesc : ''}`} color="#3b82f6" />
                      <WalkScoreGauge score={walkScore.bikeScore}    label={`🚲 Bike${walkScore.bikeDesc ? '\n' + walkScore.bikeDesc : ''}`}    color="#f59e0b" />
                    </div>
                    <div style={{ background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--dr-text-muted)', textAlign: 'center' }}>
                      Scores from 0–100. Higher = more walkable/accessible. Powered by WalkScore.com
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  )
}
