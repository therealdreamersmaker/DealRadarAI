import { motion } from 'framer-motion'

export default function LandingHero({ t }) {
  const features = [
    { icon: '🔍', title: t('Live Market Scan', 'Escaneo de Mercado'), desc: t('Real-time web search grounding', 'Búsqueda web en tiempo real') },
    { icon: '🏠', title: t('Distressed Properties', 'Propiedades en Dificultad'), desc: t('Real addresses, real deals', 'Direcciones reales, tratos reales') },
    { icon: '🤖', title: t('AI Copilot', 'Copiloto IA'), desc: t('Context-aware deal advisor', 'Asesor de tratos contextual') },
    { icon: '⚡', title: t('Autopilot Hunter', 'Cazador Automático'), desc: t('Daily CRM lead injection', 'Inyección diaria de leads') },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ textAlign: 'center', padding: '60px 20px 40px' }}
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{ fontSize: 64, marginBottom: 24 }}
      >
        📡
      </motion.div>
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 52px)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #3b82f6, #7c3aed, #06b6d4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-2px',
        marginBottom: 16,
        lineHeight: 1.1,
      }}>
        {t('Your AI Wholesaling Intelligence Engine', 'Tu Motor de Inteligencia de Mayoreo IA')}
      </h1>
      <p style={{ color: 'var(--dr-text-muted)', fontSize: 16, maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.7 }}>
        {t(
          'Search any US market. Get real distressed properties, live market metrics, wholesale deal tiers, and an AI copilot — all powered by live web search.',
          'Busca cualquier mercado en EE.UU. Obtén propiedades reales, métricas de mercado en vivo, niveles de oferta al por mayor, y un copiloto IA.',
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 860, margin: '0 auto' }}>
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.3 }}
            style={{
              background: 'var(--dr-grad-card)',
              border: '1px solid var(--dr-border-blue)',
              borderRadius: 16,
              padding: '24px 20px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: 'var(--dr-text-1)', marginBottom: 6, fontSize: 14 }}>{f.title}</div>
            <div style={{ color: 'var(--dr-text-muted)', fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
