import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveDeal, isSaved, unsaveDeal } from '../utils/savedDeals'

const STATUS_CFG = {
  'GOLDEN DEAL':               { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: '🏆', short: 'GOLDEN' },
  'DEAL SPREAD ACCEPTED':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '✅', short: 'ACCEPTED' },
  'UNPROFITABLE - OVERPRICED': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '❌', short: 'OVERPRICED' },
}

const TIER_CFG = {
  1: { label: 'T1 Cosmetic', color: '#22c55e' },
  2: { label: 'T2 Avg Fixer', color: '#f59e0b' },
  3: { label: 'T3 Gut Job',  color: '#ef4444' },
}

function fmt(n) {
  if (!n && n !== 0) return '—';
  return '$' + Math.round(n).toLocaleString();
}

function buildSaveId(lead) {
  return `csv-${lead.fullAddress.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60)}`;
}

function oppToSaveEntry(lead) {
  return {
    id:        buildSaveId(lead),
    source:    'csv',
    savedAt:   new Date().toISOString(),
    address:   lead.fullAddress,
    type:      lead.distressType,
    arv:       lead.arv,
    mao:       lead.mao,
    dealStatus: lead.dealStatus,
    dealScore:  lead.dealScore,
    conditionLabel: lead.conditionLabel,
    data:      lead,
    notes:     '',
  };
}

// ── Instructions panel ─────────────────────────────────────────────────────────
function Instructions({ open, setOpen }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)',
          borderRadius: 10, padding: '10px 16px', color: '#93c5fd',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          width: '100%', textAlign: 'left', transition: 'all 0.2s',
        }}
      >
        <span>📋</span>
        <span>How to export from BatchLeads ($119/mo Growth Plan)</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
              borderTop: 'none', borderRadius: '0 0 10px 10px',
              padding: '20px 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}>
              {[
                {
                  num: '1', icon: '🔍', title: 'Pull your list in BatchLeads',
                  text: 'Log in to BatchLeads → Search properties in your target market. Filter by distress type (tax delinquency, pre-foreclosure, high equity, etc.). Select 100–1,000 high-intent properties.',
                },
                {
                  num: '2', icon: '📤', title: 'Export with contact info',
                  text: 'Click "Export" → choose CSV format. The Growth Plan ($119/mo) includes skip-traced phone numbers and emails at no extra charge — roughly $0.04 per enriched lead.',
                },
                {
                  num: '3', icon: '⚡', title: 'Drop it here',
                  text: 'Drag your BatchLeads CSV into the upload zone below. DealRadar AI will run the full 5-Phase underwriting protocol on every property instantly and rank your best deals.',
                },
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
                    }}>{step.num}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dr-text-1)' }}>
                      {step.icon} {step.title}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--dr-text-faint)', lineHeight: 1.6, margin: 0, paddingLeft: 34 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────
function DropZone({ onFile, loading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  const handlePick = e => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#3b82f6' : 'var(--dr-border)'}`,
        borderRadius: 16, padding: '48px 32px', textAlign: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        background: dragging ? 'rgba(37,99,235,0.06)' : 'var(--dr-surface)',
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handlePick} />
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(37,99,235,0.2)', borderTop: '3px solid #3b82f6',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontWeight: 700, color: 'var(--dr-text-1)', fontSize: 15 }}>Running 5-Phase Underwriting Protocol...</div>
          <div style={{ color: 'var(--dr-text-faint)', fontSize: 13 }}>Calculating MAO, condition tiers, and deal scores for every property</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📂</div>
          <div style={{ fontWeight: 700, color: 'var(--dr-text-1)', fontSize: 16, marginBottom: 6 }}>
            Drop your BatchLeads CSV here
          </div>
          <div style={{ color: 'var(--dr-text-faint)', fontSize: 13, marginBottom: 20 }}>
            or click to browse — supports .csv, .xlsx, .xls up to 5 MB
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white', padding: '10px 24px', borderRadius: 10,
            fontWeight: 700, fontSize: 13,
          }}>
            📁 Choose File
          </div>
          <div style={{ marginTop: 16, fontSize: 11.5, color: 'var(--dr-text-faintest)' }}>
            Supports BatchLeads, PropStream, ATTOM, and any CSV with a "Property Address" column
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────
function SummaryBar({ leads }) {
  const golden   = leads.filter(l => l.dealStatus === 'GOLDEN DEAL').length;
  const accepted = leads.filter(l => l.dealStatus === 'DEAL SPREAD ACCEPTED').length;
  const avgMao   = leads.reduce((s, l) => s + (l.mao || 0), 0) / leads.length;
  const top      = [...leads].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0)).slice(0, 3);

  const stat = (label, value, color) => (
    <div style={{ textAlign: 'center', padding: '12px 20px', borderRight: '1px solid var(--dr-border)' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--dr-text-1)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
      borderRadius: 14, overflow: 'hidden', marginBottom: 24, flexWrap: 'wrap',
    }}>
      {stat('Total Properties', leads.length)}
      {stat('Golden Deals', golden, '#22c55e')}
      {stat('Accepted Spreads', accepted, '#f59e0b')}
      {stat('Avg MAO', fmt(avgMao), '#93c5fd')}
      <div style={{ flex: 1, padding: '10px 16px', minWidth: 200 }}>
        <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Top 3 Deals by Score
        </div>
        {top.map(l => (
          <div key={l.id} style={{ fontSize: 12, color: 'var(--dr-text-2)', lineHeight: 1.7, display: 'flex', gap: 8 }}>
            <span style={{ color: STATUS_CFG[l.dealStatus]?.color }}>{STATUS_CFG[l.dealStatus]?.icon}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.fullAddress}</span>
            <span style={{ fontWeight: 700, color: '#93c5fd', flexShrink: 0 }}>{fmt(l.mao)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Lead row ──────────────────────────────────────────────────────────────────
function LeadRow({ lead, onSaveToggle, savedIds }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CFG[lead.dealStatus] || STATUS_CFG['UNPROFITABLE - OVERPRICED'];
  const tier   = TIER_CFG[lead.conditionTier] || TIER_CFG[1];
  const saveId = buildSaveId(lead);
  const saved  = savedIds.has(saveId);

  return (
    <>
      <tr
        style={{ cursor: 'pointer', borderBottom: '1px solid var(--dr-border)', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onClick={() => setExpanded(x => !x)}
      >
        <td style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dr-text-1)' }}>{lead.fullAddress}</div>
          <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', marginTop: 2 }}>
            {lead.distressType} · {lead.beds}bd/{lead.baths}ba · {lead.sqft ? lead.sqft.toLocaleString() + ' sqft' : '—'} · Built {lead.yearBuilt}
          </div>
        </td>
        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--dr-text-faint)' }}>
          <div style={{ fontWeight: 600, color: 'var(--dr-text-2)' }}>{lead.ownerName || '—'}</div>
          {lead.ownerPhone
            ? <div>{lead.ownerPhone}</div>
            : <div style={{ color: 'rgba(239,68,68,0.6)', fontSize: 11 }}>No phone</div>}
          {lead.ownerEmail
            ? <div style={{ fontSize: 11 }}>{lead.ownerEmail}</div>
            : null}
        </td>
        <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: 'var(--dr-text-1)' }}>
          {fmt(lead.arv)}
        </td>
        <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: '#93c5fd' }}>
          {fmt(lead.mao)}
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
            background: tier.color + '20', color: tier.color,
          }}>{tier.label}</span>
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: status.bg, color: status.color,
          }}>{status.icon} {status.short}</span>
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 800,
            background: lead.dealScore >= 70 ? 'rgba(34,197,94,0.15)' : lead.dealScore >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
            color: lead.dealScore >= 70 ? '#22c55e' : lead.dealScore >= 50 ? '#f59e0b' : '#ef4444',
          }}>{lead.dealScore}</div>
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSaveToggle(lead, saveId, saved)}
            style={{
              background: saved ? 'rgba(37,99,235,0.15)' : 'var(--dr-surface-deep)',
              border: `1px solid ${saved ? '#3b82f6' : 'var(--dr-border)'}`,
              color: saved ? '#93c5fd' : 'var(--dr-text-faint)',
              borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            {saved ? '✓ Saved' : '+ Save'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--dr-border)',
              padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12,
            }}>
              {[
                ['ARV',           fmt(lead.arv)],
                ['MAO (Target)',  fmt(lead.mao)],
                ['List Price',    lead.listPrice ? fmt(lead.listPrice) : '—'],
                ['Repair Cost',   fmt(lead.repairCostTotal)],
                ['Repair Disc.',  (lead.repairDiscount * 100) + '%'],
                ['Equity',        (lead.equityPct || 0) + '%'],
                ['Days on Mkt',   lead.dom ? lead.dom + ' days' : '—'],
                ['Condition',     lead.conditionLabel],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dr-text-1)' }}>{v}</div>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 10, color: 'var(--dr-text-faintest)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>MAO Formula</div>
                <div style={{ fontSize: 11.5, color: 'var(--dr-text-faint)', lineHeight: 1.6 }}>
                  ({fmt(lead.arv)} × {lead.marketModifier}) − {fmt(lead.repairCostTotal)} − {fmt(lead.wholesaleFee)}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CSVImport({ API, t }) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [leads, setLeads]       = useState([]);
  const [fileName, setFileName] = useState('');
  const [filter, setFilter]     = useState('all');   // all | golden | accepted | overpriced
  const [sortBy, setSortBy]     = useState('score'); // score | mao | arv
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const all = JSON.parse(localStorage.getItem('dr-saved-deals') || '[]');
      return new Set(all.map(d => d.id));
    } catch { return new Set(); }
  });

  async function handleFile(file) {
    setError(null);
    setLeads([]);
    setFileName(file.name);
    setLoading(true);
    try {
      // Read as ArrayBuffer → base64 so both CSV text and Excel binary files
      // are sent as valid JSON without encoding corruption or body-parse crashes.
      const buffer = await file.arrayBuffer();
      const bytes  = new Uint8Array(buffer);
      let binary = '';
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
      }
      const base64 = btoa(binary);

      const res = await fetch(`${API}/api/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveToggle(lead, saveId, alreadySaved) {
    if (alreadySaved) {
      unsaveDeal(saveId);
      setSavedIds(s => { const n = new Set(s); n.delete(saveId); return n; });
    } else {
      saveDeal(oppToSaveEntry(lead));
      setSavedIds(s => new Set([...s, saveId]));
    }
    window.dispatchEvent(new Event('dr-saved-changed'));
  }

  function handleSaveAll(golden = false) {
    const targets = golden ? leads.filter(l => l.dealStatus === 'GOLDEN DEAL') : leads;
    targets.forEach(lead => {
      const sid = buildSaveId(lead);
      if (!savedIds.has(sid)) {
        saveDeal(oppToSaveEntry(lead));
        setSavedIds(s => new Set([...s, sid]));
      }
    });
    window.dispatchEvent(new Event('dr-saved-changed'));
  }

  const filtered = leads
    .filter(l => {
      if (filter === 'golden')   return l.dealStatus === 'GOLDEN DEAL';
      if (filter === 'accepted') return l.dealStatus === 'DEAL SPREAD ACCEPTED';
      if (filter === 'over')     return l.dealStatus === 'UNPROFITABLE - OVERPRICED';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'mao')   return (b.mao  || 0) - (a.mao  || 0);
      if (sortBy === 'arv')   return (b.arv  || 0) - (a.arv  || 0);
      return (b.dealScore || 0) - (a.dealScore || 0);
    });

  return (
    <div style={{ width: '100%' }}>
      <Instructions open={showInstructions} setOpen={setShowInstructions} />

      {/* Upload zone — hide once leads are loaded */}
      {!leads.length && (
        <DropZone onFile={handleFile} loading={loading} />
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 12, padding: '14px 20px', color: '#fca5a5',
          marginTop: 16, fontSize: 14,
        }}>
          ⚠ {error}
        </div>
      )}

      <AnimatePresence>
        {leads.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* File info + re-upload button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#4ade80', fontWeight: 600,
              }}>
                ✓ {leads.length} properties imported from {fileName}
              </div>
              <button
                onClick={() => { setLeads([]); setFileName(''); setError(null); }}
                style={{
                  background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
                  borderRadius: 8, padding: '7px 14px', color: 'var(--dr-text-faint)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ↑ Upload New File
              </button>
            </div>

            <SummaryBar leads={leads} />

            {/* Actions + filters row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSaveAll(true)}
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  border: 'none', borderRadius: 9, padding: '9px 18px', color: 'white',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                🏆 Save Golden Deals ({leads.filter(l => l.dealStatus === 'GOLDEN DEAL').length})
              </button>
              <button
                onClick={() => handleSaveAll(false)}
                style={{
                  background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)',
                  borderRadius: 9, padding: '9px 18px', color: '#93c5fd',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                💾 Save All ({leads.length})
              </button>

              <div style={{ flex: 1 }} />

              {/* Filter chips */}
              {[
                { id: 'all',      label: `All (${leads.length})` },
                { id: 'golden',   label: `🏆 Golden (${leads.filter(l => l.dealStatus === 'GOLDEN DEAL').length})` },
                { id: 'accepted', label: `✅ Accepted (${leads.filter(l => l.dealStatus === 'DEAL SPREAD ACCEPTED').length})` },
                { id: 'over',     label: `❌ Overpriced (${leads.filter(l => l.dealStatus === 'UNPROFITABLE - OVERPRICED').length})` },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  background: filter === f.id ? 'rgba(37,99,235,0.18)' : 'var(--dr-surface)',
                  border: `1px solid ${filter === f.id ? 'rgba(37,99,235,0.5)' : 'var(--dr-border)'}`,
                  borderRadius: 8, padding: '6px 12px', color: filter === f.id ? '#93c5fd' : 'var(--dr-text-faint)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}>{f.label}</button>
              ))}

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
                  borderRadius: 8, padding: '6px 10px', color: 'var(--dr-text-faint)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <option value="score">Sort: Deal Score</option>
                <option value="mao">Sort: MAO (High→Low)</option>
                <option value="arv">Sort: ARV (High→Low)</option>
              </select>
            </div>

            {/* Table */}
            <div style={{
              background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--dr-surface-deep)', borderBottom: '1px solid var(--dr-border)' }}>
                    {['Property / Distress Type', 'Owner / Contact', 'ARV', 'MAO', 'Condition', 'Status', 'Score', 'Action'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: h === 'ARV' || h === 'MAO' ? 'right' : h === 'Action' || h === 'Status' || h === 'Score' || h === 'Condition' ? 'center' : 'left',
                        fontSize: 10.5, fontWeight: 700, color: 'var(--dr-text-faintest)',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onSaveToggle={handleSaveToggle}
                      savedIds={savedIds}
                    />
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dr-text-faint)', fontSize: 14 }}>
                  No properties match this filter.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
