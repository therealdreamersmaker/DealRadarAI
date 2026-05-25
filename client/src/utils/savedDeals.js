/**
 * savedDeals.js — localStorage utility for Deal Bank + Analyzer history
 */

const SAVED_KEY   = 'dr-saved-deals'
const HISTORY_KEY = 'dr-analyzer-history'
const MAX_SAVED   = 300
const MAX_HISTORY = 100

// ── Helpers ──────────────────────────────────────────────────────────────────

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Saved Deals ──────────────────────────────────────────────────────────────

export function getSavedDeals() {
  return read(SAVED_KEY)
}

export function isSaved(id) {
  return read(SAVED_KEY).some(d => d.id === id)
}

export function saveDeal(entry) {
  // entry: { id, savedAt, source, label, address, type, dealScore, data }
  const list = read(SAVED_KEY).filter(d => d.id !== entry.id)
  list.unshift(entry)
  if (list.length > MAX_SAVED) list.splice(MAX_SAVED)
  write(SAVED_KEY, list)
  window.dispatchEvent(new Event('dr-saved-changed'))
  return list
}

export function unsaveDeal(id) {
  const list = read(SAVED_KEY).filter(d => d.id !== id)
  write(SAVED_KEY, list)
  window.dispatchEvent(new Event('dr-saved-changed'))
  return list
}

export function updateDealNotes(id, notes) {
  const list = read(SAVED_KEY).map(d => d.id === id ? { ...d, notes } : d)
  write(SAVED_KEY, list)
  window.dispatchEvent(new Event('dr-saved-changed'))
}

// ── Analyzer History ─────────────────────────────────────────────────────────

export function getHistory() {
  return read(HISTORY_KEY)
}

export function addToHistory(entry) {
  // entry: { id, searchedAt, input, address, result }
  const list = read(HISTORY_KEY).filter(h => h.id !== entry.id)
  list.unshift(entry)
  if (list.length > MAX_HISTORY) list.splice(MAX_HISTORY)
  write(HISTORY_KEY, list)
}

export function clearHistory() {
  write(HISTORY_KEY, [])
}

// ── Build a saveable entry from an opp/lead/analysis ────────────────────────

export function oppToSaveEntry(opp, source = 'finder') {
  const id = `${source}-${(opp.address || opp.type || 'unknown').replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`
  return {
    id,
    savedAt:    new Date().toISOString(),
    source,                              // 'finder' | 'analyzer' | 'autopilot'
    label:      opp.address || opp.type || 'Unknown Property',
    address:    opp.address || null,
    type:       opp.type || opp.distressType || null,
    dealScore:  opp.dealScore || null,
    verdict:    opp.verdict || null,
    notes:      '',
    data:       opp,
  }
}

export function analysisToSaveEntry(result) {
  const id = `analyzer-${(result.address || 'unknown').replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`
  return {
    id,
    savedAt:   new Date().toISOString(),
    source:    'analyzer',
    label:     result.address || 'Analyzed Property',
    address:   result.address || null,
    type:      result.distressType || result.propertyType || null,
    dealScore: result.dealScore || null,
    verdict:   result.verdict || null,
    notes:     '',
    data:      result,
  }
}
