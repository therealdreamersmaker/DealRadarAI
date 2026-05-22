/**
 * listingsService.js
 *
 * Fetches REAL active MLS listings from the RentCast API.
 * Falls back to a clearly-labelled "AI Lead Target" set when no key is configured.
 *
 * RentCast free tier: 50 requests / month — get your key at https://rentcast.io
 * Add  RENTCAST_API_KEY=...  to Railway environment variables to enable live data.
 */

const axios = require('axios');

const RENTCAST_BASE = 'https://api.rentcast.io/v1';

function hasRentcast() {
  const k = process.env.RENTCAST_API_KEY || '';
  return k.length > 10 && k !== 'your_rentcast_api_key_here';
}

// ── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Build a Zillow address-search URL.
 * Format: zillow.com/homes/STREET-CITY-STATE-ZIP_rb/
 * Zillow redirects to the listing detail page when the address matches exactly.
 */
function buildZillowUrl(address) {
  const slug = address
    .replace(/,/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `https://www.zillow.com/homes/${encodeURIComponent(slug)}_rb/`;
}

/**
 * Build a Redfin address-search URL.
 * Redfin's search resolves a full address to the listing page.
 */
function buildRedfinUrl(address) {
  return `https://www.redfin.com/search#location=${encodeURIComponent(address)}&start=0&count=5`;
}

// ── RentCast fetcher ─────────────────────────────────────────────────────────

/**
 * Parse city + state from a location string like "Atlanta, GA" or "Atlanta, GA 30315"
 */
function parseLocation(location) {
  const parts = location.split(',').map(s => s.trim());
  const city  = parts[0] || '';
  const rest  = (parts[1] || '').trim();
  // rest might be "GA" or "GA 30315"
  const [state, zip] = rest.split(/\s+/);
  return { city, state: (state || '').replace(/[^A-Z]/gi, ''), zip: zip || '' };
}

async function fetchRentcastListings(location) {
  const { city, state, zip } = parseLocation(location);
  if (!city || !state) throw new Error('Could not parse city/state from location');

  const params = {
    status:       'Active',
    propertyType: 'Single Family',
    limit:        20,
  };

  if (zip && /^\d{5}$/.test(zip)) {
    params.zipCode = zip;
  } else {
    params.city  = city;
    params.state = state;
  }

  const response = await axios.get(`${RENTCAST_BASE}/listings/sale`, {
    headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY },
    params,
    timeout: 15000,
  });

  return response.data || [];
}

/**
 * Score a listing for wholesale potential:
 * – higher daysOnMarket  → more motivated seller
 * – lower price/sqft     → more value-add room
 * – older yearBuilt      → more likely to need work
 */
function wholesaleScore(listing) {
  let score = 0;
  if (listing.daysOnMarket > 45)  score += 3;
  if (listing.daysOnMarket > 90)  score += 2;
  if (listing.yearBuilt && listing.yearBuilt < 1990) score += 2;
  if (listing.yearBuilt && listing.yearBuilt < 1970) score += 2;
  const pricePerSqft = listing.squareFootage ? listing.price / listing.squareFootage : 999;
  if (pricePerSqft < 100) score += 3;
  if (pricePerSqft < 60)  score += 3;
  return score;
}

function mapListingToOpportunity(listing) {
  const address = listing.formattedAddress || `${listing.addressLine1}, ${listing.city}, ${listing.state} ${listing.zipCode}`;
  const listPrice = listing.price || 0;
  // ARV = list price (it IS on market — this is the market-clearing price)
  // For fixer-uppers with condition signals, add some upside
  const conditionBonus = listing.yearBuilt && listing.yearBuilt < 1985 ? 1.08 : 1.03;
  const arv          = Math.round(listPrice * conditionBonus);
  const targetOffer  = Math.round(arv * 0.70);

  let type = 'Active Listing';
  if (listing.daysOnMarket > 90)                             type = 'Price Drop';
  else if (listing.yearBuilt && listing.yearBuilt < 1980)    type = 'Fixer-Upper';
  else if (listing.daysOnMarket > 45)                        type = 'Extended DOM';

  const bedBath = [
    listing.bedrooms    ? `${listing.bedrooms}bd`   : null,
    listing.bathrooms   ? `${listing.bathrooms}ba`  : null,
  ].filter(Boolean).join('/') || '—';

  return {
    type,
    address,
    arv,
    targetOffer,
    listPrice,
    daysOnMarket: listing.daysOnMarket || 0,
    bedBath,
    sqft:       listing.squareFootage || null,
    yearBuilt:  listing.yearBuilt || null,
    isListed:   true,
    mlsNumber:  listing.id ? `ID: ${listing.id.toString().slice(0, 10)}` : null,
    dataSource: 'live',
    zillowUrl:  buildZillowUrl(address),
    redfinUrl:  buildRedfinUrl(address),
  };
}

// ── Off-market AI stubs (clearly labelled) ───────────────────────────────────

/**
 * Build Google search URLs pointing to county/government records for each distress type.
 * These are real, free public-record search links the user can click to find specific owners.
 */
function buildCountySearchInfo(type, city, state) {
  const q = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const loc = `${city} ${state}`;

  const MAP = {
    'Pre-Foreclosure': {
      url:   q(`${loc} foreclosure lis pendens county clerk records`),
      label: `${city} Pre-Foreclosure / Lis Pendens Records`,
      tip:   'Check county clerk & recorder for lis pendens filings — these are homeowners 30–90 days behind on payments.',
    },
    'Probate': {
      url:   q(`${loc} probate court property estate records`),
      label: `${city} Probate Court Estate Records`,
      tip:   'Probate courts list properties where heirs may need to sell quickly. Look for recently opened estates.',
    },
    'Tax Delinquency': {
      url:   q(`${loc} delinquent property tax list county treasurer`),
      label: `${city} Tax Delinquent Property List`,
      tip:   'County treasurer websites publish tax delinquency lists — owners 2+ years behind are often highly motivated.',
    },
    'Absentee Owner': {
      url:   q(`${loc} absentee owner out-of-state landlord county assessor`),
      label: `${city} County Assessor — Absentee Owners`,
      tip:   'County assessor databases let you filter by mailing address ≠ property address to find absentee landlords.',
    },
  };

  return MAP[type] || {
    url:   q(`${loc} distressed property records county`),
    label: `${city} County Property Records`,
    tip:   'Search county records for distressed properties in this area.',
  };
}

function buildOffMarketStubs(location, count = 3) {
  // These are placeholder records — the UI labels them clearly as AI Lead Targets
  const types = ['Pre-Foreclosure', 'Probate', 'Tax Delinquency', 'Absentee Owner'];
  const { city, state } = parseLocation(location);

  return Array.from({ length: count }, (_, i) => {
    const type   = types[i % types.length];
    const county = buildCountySearchInfo(type, city || location, state || '');
    return {
      type,
      address:     null,          // no fake address
      arv:         null,
      targetOffer: null,
      listPrice:   null,
      daysOnMarket: null,
      bedBath:     null,
      sqft:        null,
      isListed:    false,
      mlsNumber:   null,
      dataSource:  'ai-target',
      zillowUrl:   null,
      redfinUrl:   null,
      countySearchUrl:   county.url,
      countySearchLabel: county.label,
      countySearchTip:   county.tip,
      note: `AI-identified off-market lead type for ${location}. Use skip-tracing to find specific properties of this distress category.`,
    };
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns { listed: [...], offMarket: [...] }
 *
 * listed    → real MLS listings from RentCast (when key available) OR AI estimates
 * offMarket → AI-identified lead targets (clearly labelled, no fake addresses)
 */
async function getOpportunities(location) {
  let listed = [];

  if (hasRentcast()) {
    try {
      console.log(`[Listings] Fetching real listings from RentCast for: ${location}`);
      const raw = await fetchRentcastListings(location);

      // Sort by wholesale score, take top 6
      listed = raw
        .filter(l => l.price > 0)
        .sort((a, b) => wholesaleScore(b) - wholesaleScore(a))
        .slice(0, 6)
        .map(mapListingToOpportunity);

      console.log(`[Listings] Got ${listed.length} real listings from RentCast`);
    } catch (err) {
      console.error('[Listings] RentCast error:', err.message);
      listed = []; // fall through to empty
    }
  } else {
    console.log('[Listings] No RENTCAST_API_KEY — listed section will show setup prompt');
  }

  const offMarket = buildOffMarketStubs(location, 3);
  return { listed, offMarket };
}

module.exports = { getOpportunities, buildZillowUrl, buildRedfinUrl, hasRentcast };
