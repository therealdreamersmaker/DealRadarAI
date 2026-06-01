const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Case-insensitive column lookup with multiple alias names
function col(row, ...names) {
  const keys = Object.keys(row);
  for (const name of names) {
    const found = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (found !== undefined && row[found] !== '' && row[found] !== null && row[found] !== undefined) {
      return String(row[found]).trim();
    }
  }
  return null;
}

function num(val, fallback = null) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = parseFloat(String(val).replace(/[$,%\s]/g, ''));
  return isNaN(n) ? fallback : n;
}

function computePhase3And4(arv, yearBuilt) {
  let conditionTier, repairDiscount, conditionLabel, conditionRating;
  if (yearBuilt < 1960) {
    conditionTier = 3; repairDiscount = 0.50; conditionLabel = 'Total Gut Job'; conditionRating = 2;
  } else if (yearBuilt < 1985) {
    conditionTier = 2; repairDiscount = 0.40; conditionLabel = 'Average Fixer'; conditionRating = 5;
  } else {
    conditionTier = 1; repairDiscount = 0.30; conditionLabel = 'Cosmetic Clean'; conditionRating = 7;
  }
  const repairCostTotal = Math.round(arv * repairDiscount);
  const marketModifier  = 0.70;
  const wholesaleFee    = 12000;
  const mao             = Math.round((arv * marketModifier) - repairCostTotal - wholesaleFee);
  return { conditionTier, repairDiscount, conditionLabel, conditionRating, repairCostTotal, marketModifier, wholesaleFee, mao };
}

function computeDealStatus(listPrice, mao) {
  if (!listPrice || !mao) return 'UNPROFITABLE - OVERPRICED';
  if (listPrice <= mao)        return 'GOLDEN DEAL';
  if (listPrice <= mao * 1.05) return 'DEAL SPREAD ACCEPTED';
  return 'UNPROFITABLE - OVERPRICED';
}

function computeDealScore(lead, mao) {
  let score = 50;
  if ((lead.equityPct || 0) >= 40) score += 20;
  else if ((lead.equityPct || 0) >= 30) score += 10;
  if (lead.dealStatus === 'GOLDEN DEAL')          score += 20;
  else if (lead.dealStatus === 'DEAL SPREAD ACCEPTED') score += 8;
  else score -= 10;
  if ((lead.dom || 0) >= 90) score += 10;
  else if ((lead.dom || 0) >= 60) score += 5;
  if (lead.conditionTier === 3) score += 8;
  else if (lead.conditionTier === 2) score += 4;
  return Math.min(100, Math.max(1, Math.round(score)));
}

function mapRow(raw) {
  const addressStreet = col(raw,
    'Property Address', 'Address', 'Street Address', 'Situs Address', 'Site Address') || '';
  const city  = col(raw, 'City', 'Property City', 'Situs City') || '';
  const state = col(raw, 'State', 'Property State', 'Situs State') || '';
  const zip   = col(raw, 'Zip', 'Zip Code', 'Property Zip', 'Situs Zip', 'ZIP') || '';
  const fullAddress = [addressStreet, city, state, zip].filter(Boolean).join(', ');
  if (!addressStreet) return null;

  const arv       = num(col(raw, 'Estimated Value', 'AVM', 'Est Value', 'Estimated ARV', 'Zestimate', 'Assessed Value')) || 150000;
  const yearBuilt = num(col(raw, 'Year Built', 'YearBuilt', 'Year Blt')) || 1975;
  const sqft      = num(col(raw, 'Square Feet', 'Sqft', 'Sq Ft', 'Living Area', 'GLA', 'Heated Sqft')) || 1200;
  const beds      = num(col(raw, 'Bedrooms', 'Beds', 'Bed', 'BR')) || 3;
  const baths     = num(col(raw, 'Bathrooms', 'Baths', 'Bath', 'BA')) || 2;
  const listPrice = num(col(raw, 'List Price', 'Listing Price', 'Asking Price'));
  const dom       = num(col(raw, 'Days on Market', 'DOM', 'Days Listed')) || 0;
  const equityPct = num(col(raw,
    'Equity %', 'Estimated Equity %', 'Equity Percent', 'Equity Pct', 'Est Equity %')) || 0;

  const firstName  = col(raw, 'Owner 1 First Name', 'Owner First Name', 'First Name', 'Owner First') || '';
  const lastName   = col(raw, 'Owner 1 Last Name',  'Owner Last Name',  'Last Name',  'Owner Last')  || '';
  const ownerName  = [firstName, lastName].filter(Boolean).join(' ') || null;
  const ownerPhone = col(raw, 'Phone 1', 'Phone Number', 'Owner Phone', 'Phone', 'Mobile Phone') || null;
  const ownerEmail = col(raw, 'Email 1', 'Email', 'Owner Email', 'Email Address') || null;

  const distressType = col(raw, 'Lead Type', 'Distress Type', 'Tag', 'Category', 'List Type') || 'Absentee Owner';

  const phase = computePhase3And4(arv, yearBuilt);
  const dealStatus = computeDealStatus(listPrice || arv * 0.75, phase.mao);

  const lead = {
    id:          uuidv4(),
    fullAddress,
    address:     addressStreet,
    city, state, zip,
    ownerName,
    ownerPhone,
    ownerEmail,
    isDemo:      !ownerPhone && !ownerEmail,
    distressType,
    arv,
    yearBuilt,
    sqft,
    beds,
    baths,
    bedBath:     `${beds}bd/${baths}ba`,
    listPrice,
    dom,
    equityPct,
    ...phase,
    targetOffer: phase.mao,
    dealStatus,
    dataSource:  'csv-import',
  };

  lead.dealScore = computeDealScore(lead, phase.mao);
  return lead;
}

function importCSV(csvContent) {
  // csvContent is always base64-encoded (handles CSV text and Excel binary equally)
  const workbook = XLSX.read(csvContent, { type: 'base64' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No worksheet found in file');
  const sheet = workbook.Sheets[sheetName];
  const rows  = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) throw new Error('No data rows found — make sure the file has a header row');
  const leads = rows.map(mapRow).filter(Boolean);
  if (!leads.length) throw new Error('No valid property addresses found. Check that your CSV includes a "Property Address" column.');
  return leads;
}

module.exports = { importCSV };
