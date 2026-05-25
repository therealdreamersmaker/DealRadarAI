const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { generateText } = require('./llmService');

const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const EXPORTS_DIR = path.join(__dirname, '../../exports');
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

let autopilotState = {
  isRunning: false,
  lastRun: null,
  nextRun: null,
  logs: [],
  leads: [],           // ← live leads stored in memory for UI display
  stats: {
    totalRuns: 0,
    totalLeadsProcessed: 0,
    totalCRMInjected: 0,
    successRate: 0,
    avgRunDuration: 0,
    lastExportUrl: null,
  },
  recentRuns: [],
};

function addLog(message, level = 'info') {
  const entry = { timestamp: new Date().toISOString(), message, level };
  autopilotState.logs.unshift(entry);
  if (autopilotState.logs.length > 200) autopilotState.logs.pop();
  console.log(`[AUTOPILOT][${level.toUpperCase()}] ${message}`);
  return entry;
}

async function rateLimitedRequest(fn, delayMs = 500) {
  await new Promise(r => setTimeout(r, delayMs));
  return fn();
}

const ALL_MOCK_ZIP_CODES = [
  { zip: '30315', city: 'Atlanta, GA',       dom: 67, priceDrop: 38, listToSale: 94.2 },
  { zip: '77051', city: 'Houston, TX',       dom: 72, priceDrop: 42, listToSale: 93.1 },
  { zip: '35208', city: 'Birmingham, AL',    dom: 58, priceDrop: 31, listToSale: 95.4 },
  { zip: '29405', city: 'Charleston, SC',    dom: 61, priceDrop: 35, listToSale: 94.8 },
  { zip: '70805', city: 'Baton Rouge, LA',   dom: 80, priceDrop: 45, listToSale: 92.3 },
  { zip: '75217', city: 'Dallas, TX',        dom: 63, priceDrop: 36, listToSale: 94.5 },
  { zip: '76104', city: 'Fort Worth, TX',    dom: 55, priceDrop: 33, listToSale: 95.1 },
  { zip: '33142', city: 'Miami, FL',         dom: 70, priceDrop: 40, listToSale: 93.5 },
  { zip: '33610', city: 'Tampa, FL',         dom: 65, priceDrop: 37, listToSale: 94.0 },
  { zip: '32209', city: 'Jacksonville, FL',  dom: 75, priceDrop: 43, listToSale: 92.8 },
  { zip: '85031', city: 'Phoenix, AZ',       dom: 60, priceDrop: 34, listToSale: 94.7 },
  { zip: '89115', city: 'Las Vegas, NV',     dom: 78, priceDrop: 44, listToSale: 93.0 },
];

async function step1_selectTopZipCodes(configuredMarkets = []) {
  addLog('Step 1: Evaluating target markets for wholesale leverage signals...');

  const isNational = configuredMarkets.length === 0 ||
    configuredMarkets.some(m => /united states/i.test(m) || m.trim() === 'US');

  let pool;
  if (isNational) {
    pool = ALL_MOCK_ZIP_CODES;
    addLog('Scanning all US markets...');
  } else {
    pool = ALL_MOCK_ZIP_CODES.filter(z =>
      configuredMarkets.some(m => {
        const city = m.split(',')[0].trim().toLowerCase();
        return z.city.toLowerCase().includes(city);
      })
    );
    if (pool.length === 0) {
      addLog(`No exact zip matches for configured markets — scanning all US`, 'warn');
      pool = ALL_MOCK_ZIP_CODES;
    } else {
      addLog(`Filtering to ${configuredMarkets.length} configured market(s): ${configuredMarkets.join(', ')}`);
    }
  }

  const qualified = pool.filter(
    z => z.dom > 50 && z.priceDrop > 30 && z.listToSale < 96
  ).slice(0, 3);

  addLog(`Found ${qualified.length} qualifying zip codes: ${qualified.map(z => z.zip).join(', ')}`);
  return qualified;
}

const DEFAULT_DISTRESS_TYPES = ['Foreclosure', 'Tax Delinquency', 'Inherited House'];

function buildAutopilotPropertyPrompt(market, zip, distressTypes) {
  return `You are a real estate data specialist with deep knowledge of US neighborhoods and distressed property markets.

Generate 10 realistic distressed property profiles for "${market}" (ZIP area ${zip}) for MVP demonstration purposes.

Return ONLY a raw JSON array of exactly 10 objects — no markdown, no code fences, no commentary:
[
  {
    "address": "realistic street address in ${market} — use real local street names and neighborhoods (e.g. '2847 Cascade Rd SW, Atlanta, GA 30311')",
    "distressType": "one of: ${distressTypes.join(' | ')}",
    "arv": number (realistic after-repair value for ${market} housing market),
    "targetOffer": number (65-70% of ARV),
    "equity": number (30-70, as a whole-number percent),
    "dom": number (45-120, days the property has been distressed/listed),
    "beds": number (2, 3, 4, or 5),
    "baths": number (1, 1.5, 2, 2.5, or 3),
    "sqft": number (900-2800),
    "yearBuilt": number (1945-2005),
    "note": "1-2 sentences describing the owner situation and why it is a strong wholesale opportunity",
    "dealScore": number (1-10: wholesale opportunity rating. 10=screaming deal, 7-9=strong, 5-6=solid, 3-4=average, 1-2=pass. Base on: equity %, distress urgency, DOM, and price vs ARV)
  }
]

Rules:
- Spread distressType across ALL provided types: ${distressTypes.join(', ')}
- Use actual neighborhood names and realistic street patterns for ${market}
- ARV must reflect real ${market} housing prices (research your training data)
- targetOffer = 65-70% of ARV (round to nearest $1,000)
- Do NOT use generic street names like "Oak Ave" or "Maple St" — use streets real to ${market}
- Return ONLY the JSON array with no surrounding text.`;
}

function buildFallbackProperties(zipInfo, distressTypes, count) {
  // Fallback when AI call fails — honest about being a fallback
  const props = [];
  for (let i = 0; i < count; i++) {
    const distress = distressTypes[i % distressTypes.length];
    const arv = 130000 + Math.floor(Math.random() * 220000);
    props.push({
      id: uuidv4(),
      address: `${1000 + Math.floor(Math.random() * 8000)} Main St`,
      city: zipInfo.city.split(',')[0],
      state: zipInfo.city.split(', ')[1],
      zip: zipInfo.zip,
      distressType: distress,
      arv,
      targetOffer: Math.round(arv * 0.68),
      equity: 30 + Math.floor(Math.random() * 35),
      dom: zipInfo.dom + Math.floor(Math.random() * 20) - 10,
      beds: [2, 3, 3, 4][i % 4],
      baths: [1, 2, 2, 3][i % 4],
      sqft: 950 + Math.floor(Math.random() * 1200),
      yearBuilt: 1952 + Math.floor(Math.random() * 53),
      note: `AI-estimated ${distress} property in ${zipInfo.city}.`,
      dataSource: 'ai-estimate',
    });
  }
  return props;
}

async function step2_extractDistressedProperties(zipCodes, selectedNiches = []) {
  addLog('Step 2: Generating AI-estimated distressed property profiles...');
  const distressTypes = selectedNiches.length > 0 ? selectedNiches : DEFAULT_DISTRESS_TYPES;
  addLog(`Distress categories in scope: ${distressTypes.join(', ')}`);
  const properties = [];

  for (const zipInfo of zipCodes) {
    const market = zipInfo.city;
    addLog(`Calling AI to generate 10 property profiles for ${market} (${zipInfo.zip})...`);

    try {
      const prompt = buildAutopilotPropertyPrompt(market, zipInfo.zip, distressTypes);
      const raw     = await generateText(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const start   = cleaned.indexOf('[');
      const end     = cleaned.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('No JSON array in AI response');
      const parsed = JSON.parse(cleaned.slice(start, end + 1));

      for (const p of parsed) {
        properties.push({
          id:          uuidv4(),
          address:     p.address     || `${Math.floor(Math.random() * 8000) + 1000} Main St`,
          city:        market.split(',')[0],
          state:       market.split(', ')[1] || '',
          zip:         zipInfo.zip,
          distressType: p.distressType || distressTypes[0],
          arv:         Number(p.arv)         || 180000,
          targetOffer: Number(p.targetOffer) || 126000,
          equity:      Number(p.equity)      || 35,
          dom:         Number(p.dom)         || zipInfo.dom,
          beds:        Number(p.beds)        || 3,
          baths:       Number(p.baths)       || 2,
          sqft:        Number(p.sqft)        || 1400,
          yearBuilt:   Number(p.yearBuilt)   || 1975,
          note:        p.note || '',
          dealScore:   Number(p.dealScore)  || 6,
          dataSource:  'ai-estimate',
        });
      }
      addLog(`✓ Generated ${parsed.length} AI property profiles for ${market}`);
    } catch (err) {
      addLog(`AI generation failed for ${market}: ${err.message} — using numeric fallback`, 'warn');
      properties.push(...buildFallbackProperties(zipInfo, distressTypes, 10));
    }

    await rateLimitedRequest(() => {}, 500);
  }

  addLog(`Total: ${properties.length} AI-estimated properties across ${zipCodes.length} market(s)`);
  return properties.slice(0, 100);
}

// State → area code lookup for more realistic demo phone numbers
const STATE_AREA_CODES = {
  GA: ['404','678','770','912'], TX: ['214','713','469','832','281','512','210'],
  AL: ['205','251','334'],       SC: ['803','864','843'],   LA: ['504','225','318'],
  FL: ['305','786','954','407','813','904','850'], AZ: ['602','480','623','928'],
  NV: ['702','725'],             CA: ['213','323','310','818','619','858','916'],
  IL: ['312','773','847','630'], NY: ['212','718','646','347','917'],
  NC: ['704','980','919','336'], OH: ['216','614','513'],   MI: ['313','734','248'],
  TN: ['615','901','423'],       VA: ['703','571','804'],   MD: ['410','443','301'],
};

function getAreaCode(state) {
  const codes = STATE_AREA_CODES[state] || ['555'];
  return codes[Math.floor(Math.random() * codes.length)];
}

async function step3_skipTrace(properties) {
  addLog('Step 3: Attaching demo contact data (⚠ DEMO — not real owner contacts)...');
  addLog('To unlock real owner contacts, connect a skip-trace API (BatchSkipTracing, REISkip, etc.)', 'warn');
  const enriched = [];
  let discarded = 0;
  let idx = 0;

  const firstNames = ['James','Michael','Robert','David','William','Maria','Linda','Patricia','Barbara',
                      'Susan','Charles','Joseph','Thomas','Jessica','Sarah','Kevin','Angela','Marcus',
                      'Diane','Richard','Dorothy','Kenneth','Michelle','Anthony','Sandra'];
  const lastNames  = ['Johnson','Williams','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson',
                      'Thomas','Jackson','White','Harris','Martin','Garcia','Martinez','Robinson',
                      'Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young'];

  while (enriched.length < 100 && idx < properties.length) {
    const prop = properties[idx++];
    await rateLimitedRequest(() => {}, 80);

    // Simulate realistic hit/miss rates (demo)
    if (Math.random() < 0.12) {
      discarded++;
      addLog(`[DEMO] No contact match for ${prop.address} — skipping`, 'warn');
      continue;
    }

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName  = lastNames[Math.floor(Math.random() * lastNames.length)];
    const areaCode  = getAreaCode(prop.state);
    const phoneNum  = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const domains   = ['gmail.com','yahoo.com','outlook.com','icloud.com','hotmail.com'];
    const isMLS     = Math.random() > 0.55;
    const agentFirst = ['Sarah','John','Emily','Chris','Amanda','Marcus','Diane','Rachel','Brian'];
    const agentLast  = ['Parker','Smith','Chen','Williams','Jones','Rivera','Scott','Nguyen','Torres'];

    enriched.push({
      ...prop,
      ownerFirstName: firstName,
      ownerLastName:  lastName,
      phone:     `+1 (${areaCode}) ${phoneNum}`,
      email:     `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`,
      agentName: isMLS
        ? `${agentFirst[Math.floor(Math.random() * agentFirst.length)]} ${agentLast[Math.floor(Math.random() * agentLast.length)]}`
        : 'Off-Market',
      fullAddress: `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip}`,
      isDemo: true,   // ← flags this row as demo contact data in the UI
    });
  }

  addLog(`[DEMO] Contact attachment complete: ${enriched.length} records, ${discarded} no-match`);
  return enriched;
}

async function step4_exportCSV(records) {
  addLog('Step 4: Compiling enriched records to CSV export...');
  const filename = `autopilot-leads-${new Date().toISOString().slice(0, 10)}-${Date.now()}.csv`;
  const filepath  = path.join(EXPORTS_DIR, filename);

  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: [
      { id: 'fullAddress',  title: 'Property Address'     },
      { id: 'distressType', title: 'Distress Category'    },
      { id: 'beds',         title: 'Beds'                  },
      { id: 'baths',        title: 'Baths'                 },
      { id: 'sqft',         title: 'Sqft'                  },
      { id: 'yearBuilt',    title: 'Year Built'            },
      { id: 'arv',          title: 'Estimated ARV'         },
      { id: 'targetOffer',  title: 'Target Offer'          },
      { id: 'equity',       title: 'Equity %'              },
      { id: 'dom',          title: 'DOM'                   },
      { id: 'ownerName',    title: 'Owner Name (DEMO)'     },
      { id: 'phone',        title: 'Phone (DEMO)'          },
      { id: 'email',        title: 'Email (DEMO)'          },
      { id: 'agentName',    title: 'Agent / Status'        },
      { id: 'note',         title: 'AI Deal Note'          },
      { id: 'dataSource',   title: 'Data Source'           },
    ],
  });

  const rows = records.map(r => ({
    ...r,
    ownerName:   `${r.ownerFirstName} ${r.ownerLastName}`,
    arv:         `$${Number(r.arv).toLocaleString()}`,
    targetOffer: `$${Number(r.targetOffer).toLocaleString()}`,
    equity:      `${r.equity}%`,
  }));

  await csvWriter.writeRecords(rows);
  addLog(`CSV exported: ${filename} (${records.length} rows)`);
  return { filepath, filename, downloadUrl: `/api/autopilot/download/${filename}` };
}

async function step5_injectGHL(records) {
  addLog('Step 5: Injecting contacts into GoHighLevel CRM...');
  let injected = 0;
  let failed    = 0;
  const GHL_API_KEY     = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!GHL_API_KEY || GHL_API_KEY === 'your_gohighlevel_api_key_here') {
    addLog('GHL API key not configured — simulating CRM injection (demo mode)', 'warn');
    for (let i = 0; i < records.length; i++) {
      await rateLimitedRequest(() => {}, 50);
      if (Math.random() > 0.05) injected++;
      else failed++;
    }
    addLog(`[DEMO] CRM injection complete: ${injected} injected, ${failed} failed`);
    return { injected, failed };
  }

  for (const record of records) {
    try {
      await rateLimitedRequest(async () => {
        await axios.post(
          'https://services.leadconnectorhq.com/contacts/',
          {
            firstName: record.ownerFirstName,
            lastName:  record.ownerLastName,
            phone:     record.phone,
            email:     record.email,
            address1:  record.address,
            city:      record.city,
            state:     record.state,
            postalCode: record.zip,
            tags: ['Autopilot_Lead_Ready'],
            customFields: [
              { key: 'property_address',  field_value: record.fullAddress              },
              { key: 'estimated_arv',     field_value: String(record.arv)              },
              { key: 'target_offer',      field_value: String(record.targetOffer)      },
              { key: 'distress_type',     field_value: record.distressType             },
              { key: 'listing_agent',     field_value: record.agentName                },
            ],
            locationId: GHL_LOCATION_ID,
          },
          { headers: { Authorization: `Bearer ${GHL_API_KEY}`, 'Content-Type': 'application/json' } }
        );
      }, 600);
      injected++;
    } catch (err) {
      failed++;
      addLog(`GHL injection failed for ${record.fullAddress}: ${err.message}`, 'error');
    }
  }

  addLog(`CRM injection complete: ${injected} injected, ${failed} failed`);
  return { injected, failed };
}

async function runAutopilot({ niches = [], markets = [] } = {}) {
  if (autopilotState.isRunning) {
    addLog('Autopilot already running — skipping trigger', 'warn');
    return;
  }

  const startTime = Date.now();
  autopilotState.isRunning = true;
  autopilotState.stats.totalRuns++;
  addLog('=== AUTOPILOT DEAL HUNTER STARTED ===');
  if (niches.length > 0)   addLog(`Configured niches: ${niches.join(', ')}`);
  if (markets.length > 0)  addLog(`Configured markets: ${markets.join(', ')}`);

  const runRecord = {
    id: uuidv4(),
    startTime: new Date().toISOString(),
    status: 'running',
    steps: [],
    stats: {},
  };

  try {
    const zipCodes = await step1_selectTopZipCodes(markets);
    runRecord.steps.push({ step: 1, status: 'done', result: zipCodes });

    const properties = await step2_extractDistressedProperties(zipCodes, niches);
    runRecord.steps.push({ step: 2, status: 'done', count: properties.length });

    const enriched = await step3_skipTrace(properties);
    runRecord.steps.push({ step: 3, status: 'done', count: enriched.length });

    // ← Store leads in state so the UI can display them
    autopilotState.leads = enriched;

    const exportResult = await step4_exportCSV(enriched);
    runRecord.steps.push({ step: 4, status: 'done', file: exportResult.filename });
    autopilotState.stats.lastExportUrl = exportResult.downloadUrl;

    const ghlResult = await step5_injectGHL(enriched);
    runRecord.steps.push({ step: 5, status: 'done', ...ghlResult });

    const duration = Math.round((Date.now() - startTime) / 1000);
    autopilotState.stats.totalLeadsProcessed += enriched.length;
    autopilotState.stats.totalCRMInjected    += ghlResult.injected;
    autopilotState.stats.successRate = Math.round(
      (autopilotState.stats.totalCRMInjected / autopilotState.stats.totalLeadsProcessed) * 100
    );
    autopilotState.stats.avgRunDuration = duration;

    runRecord.status   = 'completed';
    runRecord.duration = duration;
    runRecord.stats    = ghlResult;
    runRecord.endTime  = new Date().toISOString();

    addLog(`=== AUTOPILOT COMPLETE in ${duration}s — ${ghlResult.injected} leads injected ===`);
  } catch (err) {
    runRecord.status = 'failed';
    runRecord.error  = err.message;
    addLog(`AUTOPILOT FAILED: ${err.message}`, 'error');
  } finally {
    autopilotState.isRunning = false;
    autopilotState.lastRun   = new Date().toISOString();
    autopilotState.recentRuns.unshift(runRecord);
    if (autopilotState.recentRuns.length > 10) autopilotState.recentRuns.pop();
  }
}

function getState() {
  return autopilotState;
}

function getLeads() {
  return autopilotState.leads;
}

module.exports = { runAutopilot, getState, getLeads, EXPORTS_DIR };
