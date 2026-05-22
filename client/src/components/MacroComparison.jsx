import { motion } from 'framer-motion'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts'

const fmt   = n => n != null ? `$${Number(n).toLocaleString()}` : '—'
const pct   = n => n != null ? `${Number(n).toFixed(1)}%` : '—'
const arrow = n => n == null ? '' : n >= 0 ? '▲' : '▼'
const arrowColor = n => n == null ? '#64748b' : n >= 0 ? '#4ade80' : '#f87171'

const LEVEL_CONFIG = [
  { key: 'national', label: '🌎 National',  color: '#3b82f6', desc: 'US Baseline'          },
  { key: 'state',    label: '🗺 State',     color: '#8b5cf6', desc: 'State Average'         },
  { key: 'city',     label: '🏙 City',      color: '#06b6d4', desc: 'City Market'           },
  { key: 'zip',      label: '📮 Zip / Sub-Market', color: '#10b981', desc: 'Hyper-Local'    },
]

function CompCard({ cfg, data, localMetrics, index, t }) {
  if (!data) return null

  const priceDiff = localMetrics?.medianSalePrice && data.medianSalePrice
    ? Math.round(((localMetrics.medianSalePrice - data.medianSalePrice) / data.medianSalePrice) * 100)
    : null

  return (
    <motion.div
      className="print-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: 'linear-gradient(135deg, #0f172a, #0a1628)',
        border: `1px solid ${cfg.color}33`,
        borderRadius: 18,
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
      }} />

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', marginBottom: 3 }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 11, color: '#475569' }}>
          {data.label || cfg.desc}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Median price */}
        <MetricRow
          label={t('Median Sale Price', 'Precio Mediano')}
          value={fmt(data.medianSalePrice)}
          color={cfg.color}
          sub={priceDiff !== null && cfg.key !== 'national'
            ? `${priceDiff >= 0 ? '+' : ''}${priceDiff}% vs national`
            : null}
        />

        {/* YoY change */}
        <MetricRow
          label={t('YoY Price Change', 'Cambio Anual %')}
          value={`${arrow(data.yoyPriceChange)} ${Math.abs(data.yoyPriceChange ?? 0).toFixed(1)}%`}
          color={arrowColor(data.yoyPriceChange)}
        />

        {/* Days on market */}
        <MetricRow
          label={t('Median Days on Mkt', 'Días en Mercado')}
          value={data.medianDaysOnMarket ?? '—'}
          color="#94a3b8"
        />

        {/* Sale-to-list */}
        <MetricRow
          label={t('Sale-to-List', 'Venta/Lista')}
          value={pct(data.saleToListRatio)}
          color="#60a5fa"
        />
      </div>

      {/* Mini price bar vs national baseline */}
      {localMetrics?.medianSalePrice && data.medianSalePrice && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: '#334155', marginBottom: 5 }}>
            {t('Price vs. local market', 'Precio vs. mercado local')}
          </div>
          <div style={{ background: '#0a1020', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min((data.medianSalePrice / localMetrics.medianSalePrice) * 100, 100)}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              borderRadius: 4,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function MetricRow({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0f1a2e', paddingBottom: 10 }}>
      <div>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  )
}

export default function MacroComparison({ macro, localMetrics, t }) {
  if (!macro) return null

  // Radar chart data
  const radarData = [
    { metric: t('Price', 'Precio'),   national: 100, state: macro.state?.medianSalePrice ? Math.round((macro.state.medianSalePrice / macro.national.medianSalePrice) * 100) : 100, city: macro.city?.medianSalePrice ? Math.round((macro.city.medianSalePrice / macro.national.medianSalePrice) * 100) : 100, zip: macro.zip?.medianSalePrice ? Math.round((macro.zip.medianSalePrice / macro.national.medianSalePrice) * 100) : 100 },
    { metric: t('DOM', 'DOM'),        national: 100, state: macro.state?.medianDaysOnMarket ? Math.round((macro.national.medianDaysOnMarket / macro.state.medianDaysOnMarket) * 100) : 100, city: macro.city?.medianDaysOnMarket ? Math.round((macro.national.medianDaysOnMarket / macro.city.medianDaysOnMarket) * 100) : 100, zip: macro.zip?.medianDaysOnMarket ? Math.round((macro.national.medianDaysOnMarket / macro.zip.medianDaysOnMarket) * 100) : 100 },
    { metric: t('Sale/List', 'V/L'),  national: 100, state: macro.state?.saleToListRatio ? Math.round((macro.state.saleToListRatio / macro.national.saleToListRatio) * 100) : 100, city: macro.city?.saleToListRatio ? Math.round((macro.city.saleToListRatio / macro.national.saleToListRatio) * 100) : 100, zip: macro.zip?.saleToListRatio ? Math.round((macro.zip.saleToListRatio / macro.national.saleToListRatio) * 100) : 100 },
    { metric: t('YoY', 'YoY'),        national: 100, state: 100 + (macro.state?.yoyPriceChange ?? 0) - (macro.national?.yoyPriceChange ?? 0), city: 100 + (macro.city?.yoyPriceChange ?? 0) - (macro.national?.yoyPriceChange ?? 0), zip: 100 + (macro.zip?.yoyPriceChange ?? 0) - (macro.national?.yoyPriceChange ?? 0) },
  ]

  return (
    <div className="print-card" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '28px', marginBottom: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          📊 {t('Macro Market Comparison', 'Comparación Macro del Mercado')}
        </h2>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
          {t(
            'How this market stacks up against national, state, city, and local zip-level benchmarks.',
            'Cómo se compara este mercado con los promedios nacionales, estatales, de ciudad y código postal.',
          )}
        </p>
      </div>

      {/* 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {LEVEL_CONFIG.map((cfg, i) => (
          <CompCard
            key={cfg.key}
            cfg={cfg}
            data={macro[cfg.key]}
            localMetrics={localMetrics}
            index={i}
            t={t}
          />
        ))}
      </div>

      {/* Radar chart */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          {t('Relative Performance Radar (100 = National Baseline)', 'Rendimiento Relativo (100 = Base Nacional)')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 11 }} />
            <Radar name={t('National', 'Nacional')} dataKey="national" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeDasharray="4 4" />
            <Radar name={t('State', 'Estado')}    dataKey="state"    stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.12} />
            <Radar name={t('City', 'Ciudad')}     dataKey="city"     stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.12} />
            <Radar name={t('Zip', 'Zip')}         dataKey="zip"      stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
          {[['#3b82f6', t('National', 'Nacional')], ['#8b5cf6', t('State', 'Estado')], ['#06b6d4', t('City', 'Ciudad')], ['#10b981', t('Zip', 'Zip')]].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
