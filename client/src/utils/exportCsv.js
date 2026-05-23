/**
 * Client-side CSV export utility for opportunity leads.
 */
const HEADERS = [
  'Category', 'Address', 'List Price', 'ARV', 'Target Offer (70%)',
  'Est. Profit', 'Bed/Bath', 'Sqft', 'Year Built', 'Days on Market',
  'Listed', 'Data Source', 'Notes',
]

function oppToRow(o) {
  const profit = o.arv && o.targetOffer ? o.arv - o.targetOffer : ''
  return [
    o.type || '', o.address || 'Off-Market Lead',
    o.listPrice || '', o.arv || '', o.targetOffer || '', profit,
    o.bedBath || '', o.sqft || '', o.yearBuilt || '',
    o.daysOnMarket || '', o.isListed ? 'Yes' : 'No',
    o.dataSource || '', o.note || '',
  ]
}

function toCsv(rows) {
  return [HEADERS, ...rows]
    .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function downloadCsv(opps, filename = 'dealradar-leads.csv') {
  const csv  = toCsv(opps.map(oppToRow))
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}
