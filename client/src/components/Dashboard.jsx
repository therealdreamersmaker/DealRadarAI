import { motion } from 'framer-motion'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'
import OpportunityCard from './OpportunityCard'
import MacroComparison from './MacroComparison'

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—'
const pct = n => n != null ? `${Number(n).toFixed(1)}%` : '—'

function StatCard({ label, value, sub, color = '#3b82f6', icon }) {
  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'linear-gradient(135deg, #0f172a, #0d1f3c)',
        border: `1px solid ${color}33`,
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 24, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  )
}

function VerdictBadge({ verdict }) {
  const cfg = {
    'STRONG BUY': { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.5)', color: '#4ade80', icon: '🟢' },
    'WATCHLIST': { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.5)', color: '#facc15', icon: '🟡' },
    'AVOID': { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', color: '#f87171', icon: '🔴' },
  }
  const c = cfg[verdict] || cfg['WATCHLIST']
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14, letterSpacing: '0.05em',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {c.icon} {verdict}
    </span>
  )
}

const TIER_COLORS = ['#ef4444', '#f59e0b', '#22c55e']
const TIER_LABELS = ['Aggressive', 'Moderate', 'Highest Acceptable']

export default function Dashboard({ data, loading, onScanMore, scanLoading, t }) {
  if (loading) return <LoadingSkeleton />
  if (!data) return null

  const { city, state, verdict, rationale, wholesalingPlan, metrics, dealTiers = [], opportunities = [], trends = [], macroComparison } = data
  const listedOpps    = opportunities.filter(o => o.isListed === true)
  const offMarketOpps = opportunities.filter(o => o.isListed !== true)

  const trendData = trends.map(tr => ({
    ...tr,
    medianPrice: Number(tr.medianPrice),
    daysOnMarket: Number(tr.daysOnMarket),
  }))

  return (
    <div>
      {/* Header */}
      <div className="print-card" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0d1f3c)', border: '1px solid #1e3a5f', borderRadius: 20, padding: '28px 32px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              {t('Market Intelligence Report', 'Informe de Inteligencia de Mercado')}
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-1.5px', marginBottom: 12 }}>
              {city}{state ? `, ${state}` : ''}
            </h1>
            <VerdictBadge verdict={verdict} />
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '10px 18px', background: '#0f172a', border: '1px solid #1e3a5f',
                borderRadius: 10, color: '#94a3b8', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              🖨 {t('Print PDF', 'Imprimir PDF')}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('Analysis', 'Análisis')}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>{rationale}</p>
          </div>
          <div style={{ background: 'rgba(124,58,237,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(124,58,237,0.15)' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('Wholesaling Plan', 'Plan de Mayoreo')}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>{wholesalingPlan}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label={t('Median Sale Price', 'Precio Mediano')} value={fmt(metrics?.medianSalePrice)} icon="💰" color="#3b82f6" />
        <StatCard label={t('Days on Market', 'Días en Mercado')} value={metrics?.medianDaysOnMarket ?? '—'} sub={t('median days', 'días promedio')} icon="📅" color="#8b5cf6" />
        <StatCard label={t('Sale-to-List Ratio', 'Ratio Venta/Lista')} value={pct(metrics?.saleToListRatio)} icon="📊" color="#06b6d4" />
        <StatCard label={t('Inventory', 'Inventario')} value={metrics?.inventoryDirection ?? '—'} icon="📦" color="#10b981" />
      </div>

      {/* Trend Charts */}
      {trendData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <ChartCard title={t('6-Month Price Trend', 'Tendencia de Precios 6 Meses')} color="#3b82f6">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8 }}
                  formatter={v => [fmt(v), t('Median Price', 'Precio Mediano')]}
                />
                <Area type="monotone" dataKey="medianPrice" stroke="#3b82f6" fill="url(#priceGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t('6-Month Days on Market', 'Días en Mercado 6 Meses')} color="#8b5cf6">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="domGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8 }}
                  formatter={v => [v, t('Days on Market', 'Días en Mercado')]}
                />
                <Area type="monotone" dataKey="daysOnMarket" stroke="#8b5cf6" fill="url(#domGrad)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Deal Tiers */}
      {dealTiers.length > 0 && (
        <div className="print-card" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '24px', marginBottom: 20 }}>
          <SectionTitle>{t('Wholesale Deal Tiers', 'Niveles de Oferta al Por Mayor')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {dealTiers.map((tier, i) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: '#070b14',
                  border: `1px solid ${TIER_COLORS[i]}44`,
                  borderRadius: 14,
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TIER_COLORS[i] }}>{tier.tier}</span>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 20,
                    background: `${TIER_COLORS[i]}22`, color: TIER_COLORS[i], fontWeight: 600,
                  }}>
                    {TIER_LABELS[i]}
                  </span>
                </div>
                {[
                  [t('Target Offer', 'Oferta Objetivo'), fmt(tier.targetOffer), TIER_COLORS[i]],
                  [t('Low Anchor', 'Ancla Baja'), fmt(tier.lowAnchor), '#64748b'],
                  [t('Max Cap', 'Tope Máximo'), fmt(tier.maxCap), '#64748b'],
                  [t('Expected Profit', 'Ganancia Esperada'), fmt(tier.expectedProfit), '#22c55e'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Opportunities header + Scan More ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <SectionTitle>
          {t('Actionable Opportunities', 'Oportunidades de Acción')}
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 400, marginLeft: 8 }}>({opportunities.length})</span>
        </SectionTitle>
        <button
          onClick={onScanMore}
          disabled={scanLoading}
          className="no-print"
          style={{
            padding: '10px 20px',
            background: scanLoading ? '#1e3a5f' : 'linear-gradient(135deg, #0f4c8a, #1d3a8a)',
            border: '1px solid #2563eb44', borderRadius: 10,
            color: '#93c5fd', fontSize: 13, fontWeight: 600,
            cursor: scanLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {scanLoading ? '⏳' : '🔄'} {t('Scan More', 'Escanear Más')}
        </button>
      </div>

      {/* ── Listed (MLS) block ────────────────────────────────────────── */}
      {listedOpps.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#4ade80',
            }}>
              ● {t('Listed On-Market', 'Listadas en Mercado')}
            </div>
            <span style={{ fontSize: 12, color: '#334155' }}>
              {listedOpps.length} {t('properties active on MLS — Zillow & Redfin links available', 'propiedades activas en MLS — enlaces a Zillow y Redfin disponibles')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {listedOpps.map((opp, i) => (
              <OpportunityCard key={`listed-${opp.address}-${i}`} opp={opp} index={i} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Off-Market block ──────────────────────────────────────────── */}
      {offMarketOpps.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)',
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fbbf24',
            }}>
              ◆ {t('Off-Market Leads', 'Leads Fuera de Mercado')}
            </div>
            <span style={{ fontSize: 12, color: '#334155' }}>
              {offMarketOpps.length} {t('distressed properties — direct owner contact required', 'propiedades en dificultad — requieren contacto directo con propietario')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {offMarketOpps.map((opp, i) => (
              <OpportunityCard key={`offmkt-${opp.address}-${i}`} opp={opp} index={listedOpps.length + i} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Macro Market Comparison ───────────────────────────────────── */}
      <MacroComparison macro={macroComparison} localMetrics={metrics} t={t} />

    </div>
  )
}

function ChartCard({ title, color, children }) {
  return (
    <div className="print-card" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '20px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>{children}</h2>
}

function LoadingSkeleton() {
  const pulse = { animation: 'pulse 1.5s ease-in-out infinite', background: 'linear-gradient(90deg, #0f172a 25%, #1e293b 50%, #0f172a 75%)' }
  return (
    <div>
      <div style={{ ...pulse, height: 160, borderRadius: 20, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ ...pulse, height: 90, borderRadius: 16 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[...Array(2)].map((_, i) => <div key={i} style={{ ...pulse, height: 220, borderRadius: 16 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ ...pulse, height: 200, borderRadius: 16 }} />)}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
