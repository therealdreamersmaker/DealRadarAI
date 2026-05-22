import { motion } from 'framer-motion'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts'
import { useTheme } from '../ThemeContext'

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
        background: 'var(--dr-grad-card-alt)',
        border: `1px solid ${cfg.color}33`,
        borderRadius: 18, padding: '22px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dr-text-1)', marginBottom: 3 }}>{cfg.label}</div>
        <div style={{ fontSize: 11, color: 'var(--dr-text-faint)' }}>{data.label || cfg.desc}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MetricRow label={t('Median Sale Price', 'Precio Mediano')} value={fmt(data.medianSalePrice)} color={cfg.color}
          sub={priceDiff !== null && cfg.key !== 'national' ? `${priceDiff >= 0 ? '+' : ''}${priceDiff}% vs national` : null} />
        <MetricRow label={t('YoY Price Change', 'Cambio Anual %')}
          value={`${arrow(data.yoyPriceChange)} ${Math.abs(data.yoyPriceChange ?? 0).toFixed(1)}%`}
          color={arrowColor(data.yoyPriceChange)} />
        <MetricRow label={t('Median Days on Mkt', 'Días en Mercado')} value={data.medianDaysOnMarket ?? '—'} color="var(--dr-text-muted)" />
        <MetricRow label={t('Sale-to-List', 'Venta/Lista')} value={pct(data.saleToListRatio)} color="#60a5fa" />
      </div>
      {localMetrics?.medianSalePrice && data.medianSalePrice && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', marginBottom: 5 }}>
            {t('Price vs. local market', 'Precio vs. mercado local')}
          </div>
          <div style={{ background: 'var(--dr-surface-deep)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min((data.medianSalePrice / localMetrics.medianSalePrice) * 100, 100)}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              borderRadius: 4, transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function MetricRow({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dr-border)', paddingBottom: 10 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  )
}

export default function MacroComparison({ macro, localMetrics, t }) {
  const { chart } = useTheme()
  if (!macro) return null

  const radarData = [
    { metric: t('Price', 'Precio'),  national: 100, state: macro.state?.medianSalePrice ? Math.round((macro.state.medianSalePrice / macro.national.medianSalePrice) * 100) : 100, city: macro.city?.medianSalePrice ? Math.round((macro.city.medianSalePrice / macro.national.medianSalePrice) * 100) : 100, zip: macro.zip?.medianSalePrice ? Math.round((macro.zip.medianSalePrice / macro.national.medianSalePrice) * 100) : 100 },
    { metric: t('DOM', 'DOM'),       national: 100, state: macro.state?.medianDaysOnMarket ? Math.round((macro.national.medianDaysOnMarket / macro.state.medianDaysOnMarket) * 100) : 100, city: macro.city?.medianDaysOnMarket ? Math.round((macro.national.medianDaysOnMarket / macro.city.medianDaysOnMarket) * 100) : 100, zip: macro.zip?.medianDaysOnMarket ? Math.round((macro.national.medianDaysOnMarket / macro.zip.medianDaysOnMarket) * 100) : 100 },
    { metric: t('Sale/List', 'V/L'), national: 100, state: macro.state?.saleToListRatio ? Math.round((macro.state.saleToListRatio / macro.national.saleToListRatio) * 100) : 100, city: macro.city?.saleToListRatio ? Math.round((macro.city.saleToListRatio / macro.national.saleToListRatio) * 100) : 100, zip: macro.zip?.saleToListRatio ? Math.round((macro.zip.saleToListRatio / macro.national.saleToListRatio) * 100) : 100 },
    { metric: t('YoY', 'YoY'),       national: 100, state: 100 + (macro.state?.yoyPriceChange ?? 0) - (macro.national?.yoyPriceChange ?? 0), city: 100 + (macro.city?.yoyPriceChange ?? 0) - (macro.national?.yoyPriceChange ?? 0), zip: 100 + (macro.zip?.yoyPriceChange ?? 0) - (macro.national?.yoyPriceChange ?? 0) },
  ]

  return (
    <div className="print-card" style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 20, padding: '28px', marginBottom: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--dr-text-1)', marginBottom: 6 }}>
          📊 {t('Macro Market Comparison', 'Comparación Macro del Mercado')}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--dr-text-faint)', lineHeight: 1.6 }}>
          {t(
            'How this market stacks up against national, state, city, and local zip-level benchmarks.',
            'Cómo se compara este mercado con los promedios nacionales, estatales, de ciudad y código postal.',
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {LEVEL_CONFIG.map((cfg, i) => (
          <CompCard key={cfg.key} cfg={cfg} data={macro[cfg.key]} localMetrics={localMetrics} index={i} t={t} />
        ))}
      </div>

      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dr-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          {t('Relative Performance Radar (100 = National Baseline)', 'Rendimiento Relativo (100 = Base Nacional)')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={chart.grid} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: chart.tick, fontSize: 11 }} />
            <Radar name={t('National', 'Nacional')} dataKey="national" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeDasharray="4 4" />
            <Radar name={t('State', 'Estado')}    dataKey="state"    stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.12} />
            <Radar name={t('City', 'Ciudad')}     dataKey="city"     stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.12} />
            <Radar name={t('Zip', 'Zip')}         dataKey="zip"      stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
            <Tooltip contentStyle={{ background: chart.bg, border: `1px solid ${chart.border}`, borderRadius: 8, fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
          {[['#3b82f6', t('National', 'Nacional')], ['#8b5cf6', t('State', 'Estado')], ['#06b6d4', t('City', 'Ciudad')], ['#10b981', t('Zip', 'Zip')]].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--dr-text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
