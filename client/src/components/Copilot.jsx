import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../ThemeContext'

export default function Copilot({ dashboardData, language, t, API }) {
  const { isDark } = useTheme()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const systemContext = dashboardData ? JSON.stringify(dashboardData, null, 2) : ''

  const starters = [
    t("What's the best deal tier for this market?", '¿Cuál es el mejor nivel de oferta para este mercado?'),
    t('Which opportunity has the highest profit potential?', '¿Qué oportunidad tiene el mayor potencial de ganancia?'),
    t("How should I approach the seller for the top distressed property?", '¿Cómo debo abordar al vendedor de la principal propiedad en dificultad?'),
    t('What exit strategies work best for this market verdict?', '¿Qué estrategias de salida funcionan mejor para este veredicto de mercado?'),
  ]

  async function sendMessage(text) {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    const history = messages.slice(-10)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history, context: systemContext, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, isError: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 500 }}>
      {/* Header */}
      <div style={{
        background: 'var(--dr-grad-card)',
        border: '1px solid var(--dr-border-blue)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44,
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--dr-text-2)', fontSize: 15 }}>DealRadar Copilot</div>
          <div style={{ fontSize: 12, color: 'var(--dr-text-faint)' }}>
            {dashboardData
              ? t(`Analyzing ${dashboardData.city}, ${dashboardData.state} — ${dashboardData.opportunities?.length || 0} opportunities loaded`, `Analizando ${dashboardData.city}, ${dashboardData.state} — ${dashboardData.opportunities?.length || 0} oportunidades cargadas`)
              : t('Search a market first to enable full context', 'Busca un mercado primero para habilitar el contexto completo')}
          </div>
        </div>
        <div style={{
          marginLeft: 'auto', fontSize: 10, padding: '4px 10px',
          background: dashboardData ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
          border: `1px solid ${dashboardData ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'}`,
          borderRadius: 20, color: dashboardData ? '#4ade80' : '#64748b', fontWeight: 700,
        }}>
          {dashboardData ? t('CONTEXT LOADED', 'CONTEXTO CARGADO') : t('NO CONTEXT', 'SIN CONTEXTO')}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        background: 'var(--dr-surface-deep)',
        border: '1px solid var(--dr-border)',
        borderTop: 'none',
        padding: '20px',
        overflowY: 'auto',
      }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', color: 'var(--dr-text-faintest)', marginBottom: 28, paddingTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 14, color: 'var(--dr-text-faint)' }}>
                {t('Ask anything about the market, properties, or deal strategy.', 'Pregunta cualquier cosa sobre el mercado, propiedades o estrategia de trato.')}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {starters.map((s, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.01, borderColor: '#3b82f6' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 12,
                    padding: '12px 16px', color: 'var(--dr-text-muted)', fontSize: 13, textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 30, height: 30, minWidth: 30,
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  borderRadius: '50%', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 10, marginTop: 2,
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  : msg.isError ? 'rgba(239,68,68,0.1)' : 'var(--dr-surface)',
                border: msg.role === 'assistant' ? `1px solid ${msg.isError ? 'rgba(239,68,68,0.3)' : 'var(--dr-border)'}` : 'none',
                color: msg.isError ? '#fca5a5' : msg.role === 'user' ? 'white' : 'var(--dr-text-2)',
                fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--dr-text-faint)', fontSize: 13 }}>
            <div style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: '50%', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🤖</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, background: '#3b82f6', borderRadius: '50%',
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        background: 'var(--dr-surface)',
        border: '1px solid var(--dr-border)',
        borderTop: 'none',
        borderRadius: '0 0 20px 20px',
        padding: '16px',
        display: 'flex', gap: 10,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder={t('Ask about market conditions, deal strategy, negotiation…', 'Pregunta sobre condiciones de mercado, estrategia, negociación…')}
          disabled={loading}
          style={{
            flex: 1, padding: '12px 16px',
            background: 'var(--dr-surface-deep)', border: '1px solid var(--dr-border)',
            borderRadius: 12, color: 'var(--dr-text-2)', fontSize: 14,
            fontFamily: 'Inter, sans-serif', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = 'var(--dr-border)'}
        />
        <motion.button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none', borderRadius: 12,
            color: 'white', fontSize: 18,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          ↑
        </motion.button>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
