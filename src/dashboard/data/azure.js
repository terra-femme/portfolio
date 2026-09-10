/**
 * Mock Azure platform telemetry for a clinical-documentation workload,
 * reported for the 30 days ending 2026-09-10.
 *
 * ---------------------------------------------------------------------------
 * HOW THE COST MODEL WORKS -- read this before changing any number.
 *
 * Nothing in the cost section is a typed-in total. Every figure is derived as
 * `quantity x unit rate` from the two tables below. That is deliberate: the
 * first thing a knowledgeable reader does with a cost dashboard is divide one
 * number by another, and hand-typed totals fall apart the moment they do. An
 * earlier draft of this file billed 96M gpt-4o tokens at $3,180 -- roughly 7x
 * the real token price -- and it was obvious on inspection.
 *
 * Deriving instead of typing also means the numbers cannot drift apart later:
 * change an ingest volume and the service mix, the headline KPI, the daily
 * chart and the stacked trend all move together.
 *
 * RATES ARE ILLUSTRATIVE. They are rounded, list-price order-of-magnitude
 * figures for a plausible mid-2026 estate, not a live price sheet, and they
 * ignore reservations, EA discounts and regional variation. Anyone costing
 * real work should use the Azure pricing calculator. What this dashboard
 * demonstrates is the SHAPE of an AI platform bill, and that shape is robust:
 * the ranking below does not change if every rate moves by a third.
 * ---------------------------------------------------------------------------
 */

// Fixed anchor, never `new Date()`. Labels derive from this so the axis reads
// like real dates without the series drifting as the real calendar moves on.
const ANCHOR = new Date('2026-09-10T00:00:00Z');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Label for `daysAgo` days before the anchor, e.g. "Aug 22". */
export function dayLabel(daysAgo) {
  const d = new Date(ANCHOR);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
}

/** Turn a bare value array into a labelled 30-day window, oldest first. */
function daily(values) {
  const n = values.length;
  return values.map((value, i) => ({ label: dayLabel(n - 1 - i), value }));
}

export const LAST_INGEST = '2026-09-10T06:42:00Z';
export const WINDOW_DAYS = 30;
const HOURS = WINDOW_DAYS * 24; // 720

/** Illustrative list rates. See the header note. */
export const RATES = {
  logAnalyticsPerGb: 2.30,        // Analytics tier ingestion, per GB
  searchUnitPerHour: 1.32,        // AI Search, per search unit per hour
  containerVcpuSecond: 0.000024,  // Container Apps, per vCPU-second
  containerGibSecond: 0.0000030,  // Container Apps, per GiB-second
  speechPerAudioHour: 0.24,       // AI Speech, blended batch + realtime
  ptuPerMonth: 132,               // Azure OpenAI provisioned throughput unit
  gpt4oInPerM: 2.50,              // per 1M input tokens
  gpt4oOutPerM: 10.00,            // per 1M output tokens
  gpt4oMiniInPerM: 0.15,
  gpt4oMiniOutPerM: 0.60,
  embedLargePerM: 0.13,
  cosmosRuHourPer100: 0.008,      // per 100 RU/s per hour
  cosmosStorageGb: 0.25,
  blobHotPerGb: 0.0184,
  egressPerGb: 0.087,
};

/** Measured usage over the 30-day window. */
export const USAGE = {
  logIngestGbPerDay: 76,
  searchUnits: 4,                 // S2: 2 replicas x 2 partitions
  containerReplicas: 18,          // always-on across 6 services
  containerVcpu: 2,
  containerGib: 4,
  speechAudioHours: 12087,        // 148k jobs at ~4.9 min each
  ptuUnits: 15,
  gpt4oPtuTokensM: 218.0,
  gpt4oStdInM: 90,
  gpt4oStdOutM: 28,
  miniInM: 380,
  miniOutM: 95,
  embedTokensM: 128,
  cosmosRuPerSec: 24000,
  cosmosStorageGb: 1800,
  blobGb: 58000,                  // ~58 TB of retained audio
  egressGb: 10200,
  miscFlat: 1130,                 // Key Vault, Functions, Front Door base
};

const r2 = (n) => Math.round(n);

// ---- derived per-service cost ---------------------------------------------
const COST = {
  logAnalytics: USAGE.logIngestGbPerDay * WINDOW_DAYS * RATES.logAnalyticsPerGb,
  aiSearch: USAGE.searchUnits * HOURS * RATES.searchUnitPerHour,
  containerApps:
    USAGE.containerReplicas * USAGE.containerVcpu * HOURS * 3600 * RATES.containerVcpuSecond +
    USAGE.containerReplicas * USAGE.containerGib * HOURS * 3600 * RATES.containerGibSecond,
  aiSpeech: USAGE.speechAudioHours * RATES.speechPerAudioHour,
  openAiPtu: USAGE.ptuUnits * RATES.ptuPerMonth,
  openAiStd: USAGE.gpt4oStdInM * RATES.gpt4oInPerM + USAGE.gpt4oStdOutM * RATES.gpt4oOutPerM,
  openAiMini: USAGE.miniInM * RATES.gpt4oMiniInPerM + USAGE.miniOutM * RATES.gpt4oMiniOutPerM,
  openAiEmbed: USAGE.embedTokensM * RATES.embedLargePerM,
  cosmos:
    (USAGE.cosmosRuPerSec / 100) * HOURS * RATES.cosmosRuHourPer100 +
    USAGE.cosmosStorageGb * RATES.cosmosStorageGb,
  blob: USAGE.blobGb * RATES.blobHotPerGb,
  egress: USAGE.egressGb * RATES.egressPerGb,
  misc: USAGE.miscFlat,
};

const COST_OPENAI = COST.openAiPtu + COST.openAiStd + COST.openAiMini + COST.openAiEmbed;

/**
 * The finding this whole report exists to show.
 *
 * The intuitive assumption is that an "AI platform" bill is mostly model
 * inference. It is not, and it is not close: inference is about 12% of spend
 * while observability alone is about 24%.
 *
 * The expensive things are the ones billed whether or not anyone uses them --
 * per-GB log ingestion, provisioned search units, always-on container replicas,
 * reserved Cosmos throughput. Token billing is genuinely usage-based and
 * genuinely cheap by comparison.
 */
export const serviceMix = [
  { label: 'Log Analytics + App Insights', value: r2(COST.logAnalytics), color: 'var(--c-crit)' },
  { label: 'AI Search (provisioned)', value: r2(COST.aiSearch), color: 'var(--c-3)' },
  { label: 'AI Speech (batch + realtime)', value: r2(COST.aiSpeech), color: 'var(--c-2)' },
  { label: 'Container Apps', value: r2(COST.containerApps), color: 'var(--c-4)' },
  { label: 'Azure OpenAI', value: r2(COST_OPENAI), color: 'var(--c-1)' },
  { label: 'Cosmos DB', value: r2(COST.cosmos), color: 'var(--c-5)' },
  { label: 'Blob + ADLS (audio archive)', value: r2(COST.blob), color: 'var(--c-6)' },
  { label: 'Front Door + egress', value: r2(COST.egress), color: 'var(--c-7)' },
  { label: 'Key Vault, Functions, misc.', value: r2(COST.misc), color: 'var(--c-8)' },
];

/** Headline spend for the window. Derived, never typed. */
export const SPEND_30D = serviceMix.reduce((sum, s) => sum + s.value, 0);

// ------------------------------------------------------------------- spend
// A relative day-shape, rescaled so the daily chart sums to EXACTLY the
// headline figure. Index 19 is the INC-2291 retry storm.
const SPEND_SHAPE = [
  620, 645, 590, 612, 668, 701, 655, 638, 672, 690,
  715, 702, 688, 664, 731, 748, 726, 705, 812, 1180,
  1042, 894, 823, 795, 768, 781, 806, 834, 858, 872,
];

const shapeTotal = SPEND_SHAPE.reduce((a, b) => a + b, 0);
const scaled = SPEND_SHAPE.map((v) => Math.round((v * SPEND_30D) / shapeTotal));
// Rounding leaves a few dollars unaccounted for; push the remainder onto the
// last day so the chart and the KPI agree exactly rather than "about".
scaled[scaled.length - 1] += SPEND_30D - scaled.reduce((a, b) => a + b, 0);

export const dailySpend = daily(scaled);

// Trailing 12 months, grouped so the growth story is visible: observability
// nearly triples while the platform band barely moves. The final month is
// derived from the real service costs above, so the trend lands exactly on the
// headline figure instead of near it.
const STACK_HISTORY = [
  ['Oct', 1900, 6100, 6200], ['Nov', 2080, 6420, 6480], ['Dec', 1860, 5840, 5950],
  ['Jan', 2240, 6740, 6740], ['Feb', 2480, 6980, 6880], ['Mar', 2760, 7240, 7100],
  ['Apr', 2690, 7120, 7070], ['May', 3180, 7660, 7400], ['Jun', 3540, 7940, 7620],
  ['Jul', 4080, 8340, 8030], ['Aug', 4620, 8700, 8060],
];

export const spendStack = {
  keys: ['Observability', 'AI services', 'Platform & data'],
  colors: ['var(--c-crit)', 'var(--c-1)', 'var(--c-4)'],
  rows: [
    ...STACK_HISTORY.map(([label, a, b, c]) => ({ label, values: [a, b, c] })),
    {
      label: 'Sep',
      values: [
        r2(COST.logAnalytics),
        r2(COST.aiSearch + COST.aiSpeech + COST_OPENAI),
        r2(COST.containerApps + COST.cosmos + COST.blob + COST.egress + COST.misc),
      ],
    },
  ],
};

/** Monthly totals derived from the stack, so the two can never disagree. */
export const monthlySpend = spendStack.rows.map((row) => ({
  label: row.label,
  value: row.values.reduce((a, b) => a + b, 0),
}));

export const topCostDrivers = [
  { rank: 1, resource: 'law-clinical-prod', service: 'Log Analytics', region: 'East US', cost: r2(COST.logAnalytics), change: 34.2, budget: 0.96 },
  { rank: 2, resource: 'search-clinical-idx', service: 'AI Search', region: 'Sweden Central', cost: r2(COST.aiSearch), change: -2.4, budget: 0.62 },
  { rank: 3, resource: 'speech-batch-scribe', service: 'AI Speech', region: 'East US', cost: r2(COST.aiSpeech), change: 4.1, budget: 0.54 },
  { rank: 4, resource: 'ca-orchestrator', service: 'Container Apps', region: 'East US', cost: r2(COST.containerApps), change: 1.9, budget: 0.43 },
  { rank: 5, resource: 'aoai-prod-eastus', service: 'Azure OpenAI', region: 'East US', cost: r2(COST_OPENAI), change: 8.2, budget: 0.71 },
  { rank: 6, resource: 'cosmos-transcripts', service: 'Cosmos DB', region: 'East US', cost: r2(COST.cosmos), change: 3.3, budget: 0.48 },
  { rank: 7, resource: 'stclinicalaudio', service: 'Blob + ADLS', region: 'East US', cost: r2(COST.blob), change: 6.7, budget: 0.38 },
  { rank: 8, resource: 'afd-clinical-edge', service: 'Front Door', region: 'Global', cost: r2(COST.egress), change: 21.8, budget: 0.94 },
];

// ------------------------------------------------------------------ models
// `billing` is the column that makes this table make sense. gpt-4o runs on
// PROVISIONED THROUGHPUT: you reserve capacity by the hour and the price does
// not move with token count, so its effective per-token rate is a function of
// how well the reservation is utilised. Everything else is standard per-token
// billing. Without that column the PTU row looks like a pricing error.
const MODEL_ROWS = [
  { model: 'gpt-4o', billing: 'PTU x15', calls: 1284000, tokens: USAGE.gpt4oPtuTokensM, cost: COST.openAiPtu, p95: 780 },
  { model: 'gpt-4o (overflow)', billing: 'Standard', calls: 340000, tokens: USAGE.gpt4oStdInM + USAGE.gpt4oStdOutM, cost: COST.openAiStd, p95: 940 },
  { model: 'gpt-4o-mini', billing: 'Standard', calls: 5200000, tokens: USAGE.miniInM + USAGE.miniOutM, cost: COST.openAiMini, p95: 340 },
  { model: 'text-embedding-3-large', billing: 'Standard', calls: 3100000, tokens: USAGE.embedTokensM, cost: COST.openAiEmbed, p95: 95 },
];

const totalCalls = MODEL_ROWS.reduce((sum, m) => sum + m.calls, 0);

export const modelUsage = MODEL_ROWS.map((m) => ({
  ...m,
  cost: r2(m.cost),
  share: m.calls / totalCalls,      // derived, so it always sums to 1
  ratePerM: m.cost / m.tokens,      // the column actually worth comparing
}));

/** Total tokens across every model, for the headline KPI. */
export const TOKENS_30D = MODEL_ROWS.reduce((sum, m) => sum + m.tokens, 0);

export const quotas = [
  { name: 'Log Analytics daily ingest', used: USAGE.logIngestGbPerDay, limit: 85, unit: 'GB/day' },
  { name: 'gpt-4o PTU / East US', used: 12.4, limit: USAGE.ptuUnits, unit: 'PTU' },
  { name: 'gpt-4o standard / West Europe', used: 88000, limit: 120000, unit: 'TPM' },
  { name: 'gpt-4o-mini / East US', used: 310000, limit: 600000, unit: 'TPM' },
  { name: 'AI Speech concurrency', used: 84, limit: 100, unit: 'streams' },
  { name: 'AI Search index size', used: 38.4, limit: 50, unit: 'GB' },
];

// ---------------------------------------------------------------- headline
export const azureKpis = [
  { id: 'spend', label: 'Spend, last 30 days', value: SPEND_30D, prefix: '$', decimals: 0, delta: 4.2, deltaLabel: 'vs. prior 30 days', goodWhen: 'down' },
  { id: 'tokens', label: 'Tokens processed', value: TOKENS_30D, suffix: 'M', decimals: 1, delta: 12.6, deltaLabel: 'vs. prior 30 days', goodWhen: 'up' },
  { id: 'latency', label: 'p95 latency', value: 812, suffix: 'ms', decimals: 0, delta: -6.8, deltaLabel: 'vs. 30-day avg', goodWhen: 'down' },
  { id: 'uptime', label: 'Availability', value: 99.94, suffix: '%', decimals: 2, delta: 0.04, deltaLabel: 'vs. 99.90% SLO', goodWhen: 'up' },
];

// ----------------------------------------------------------------- regions
// Real Azure region locations, so the map is geographically honest even though
// the telemetry on it is synthetic. `lat`/`lon` are the datacenter metro, not
// the country -- which is exactly why this is a bubble map and not a
// choropleth: shading all of Sweden for one datacenter in Gavle would overstate
// the footprint by several orders of magnitude.
export const regions = [
  { id: 'eastus', label: 'East US', value: 42, requestsM: 18.2, lat: 37.4, lon: -78.5, p95: 762 },
  { id: 'westeurope', label: 'West Europe', value: 23, requestsM: 9.9, lat: 52.4, lon: 4.9, p95: 848 },
  { id: 'swedencentral', label: 'Sweden Central', value: 14, requestsM: 6.1, lat: 60.7, lon: 17.1, p95: 806 },
  { id: 'uksouth', label: 'UK South', value: 12, requestsM: 5.2, lat: 51.5, lon: -0.1, p95: 894 },
  { id: 'australiaeast', label: 'Australia East', value: 9, requestsM: 3.9, lat: -33.9, lon: 151.2, p95: 1240 },
];

export const REQUESTS_30D_M = regions.reduce((sum, r) => sum + r.requestsM, 0);

// Inter-region traffic. East US is the primary, which is the concentration risk
// the overview page calls out: four of five flows originate there.
export const trafficFlows = [
  { from: 'eastus', to: 'westeurope', volume: 42 },
  { from: 'eastus', to: 'uksouth', volume: 26 },
  { from: 'eastus', to: 'australiaeast', volume: 14 },
  { from: 'westeurope', to: 'swedencentral', volume: 31 },
  { from: 'eastus', to: 'swedencentral', volume: 11 },
];

// ------------------------------------------------------------- reliability
// The window contains ONE incident, INC-2291 on Aug 31, and it is visible in
// four independent series: the spend spike above, the latency spike here, the
// hot band in the heatmap, and the incident record itself. Mock data that
// contradicts itself is the fastest way to look fake.
const LATENCY_ROWS = [
  [212, 742, 1180], [219, 758, 1210], [206, 721, 1140], [214, 736, 1165],
  [228, 770, 1225], [241, 802, 1290], [232, 781, 1248], [224, 764, 1202],
  [236, 795, 1272], [244, 818, 1305], [251, 836, 1348], [246, 824, 1322],
  [239, 806, 1284], [231, 788, 1246], [258, 862, 1390], [264, 884, 1428],
  [256, 858, 1382], [248, 832, 1336], [312, 1140, 1980], [598, 2140, 3820],
  [472, 1620, 2740], [341, 1080, 1720], [274, 902, 1452], [262, 874, 1408],
  [249, 838, 1348], [253, 846, 1362], [261, 868, 1396], [268, 890, 1436],
  [274, 906, 1462], [252, 812, 1318],
];

export const latencyDaily = {
  keys: ['p50', 'p95', 'p99'],
  colors: ['var(--c-2)', 'var(--c-1)', 'var(--c-warn)'],
  rows: LATENCY_ROWS.map((values, i) => ({
    label: dayLabel(LATENCY_ROWS.length - 1 - i),
    values,
  })),
};

export const errorTaxonomy = [
  { label: '429 Rate limited', value: 1284, color: 'var(--c-warn)' },
  { label: '500 Upstream', value: 412, color: 'var(--c-crit)' },
  { label: '408 Timeout', value: 263, color: 'var(--c-3)' },
  { label: '400 Bad request', value: 156, color: 'var(--c-4)' },
  { label: '401 Unauthorized', value: 88, color: 'var(--c-5)' },
  { label: 'Content filtered', value: 74, color: 'var(--c-6)' },
];

// Errors per 10k requests: 7 days (rows, oldest first) x 24 hours (columns).
// Row index 4 is the incident day -- it reads as a hot band across the
// business-hours columns, which is what a real retry storm looks like.
export const errorRateHeatmap = {
  days: ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  rows: [
    [2, 1, 1, 1, 2, 3, 5, 8, 12, 14, 13, 11, 10, 12, 15, 14, 11, 8, 6, 4, 3, 2, 2, 1],
    [1, 1, 2, 1, 2, 4, 6, 9, 13, 16, 15, 12, 11, 13, 16, 15, 12, 9, 6, 5, 3, 2, 1, 1],
    [1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 4, 4, 3, 4, 4, 4, 3, 2, 2, 1, 1, 1, 1, 1],
    [2, 2, 1, 2, 3, 5, 8, 14, 22, 38, 46, 41, 34, 29, 26, 22, 18, 13, 9, 6, 4, 3, 2, 2],
    [2, 1, 2, 1, 2, 4, 7, 10, 15, 18, 17, 14, 12, 14, 17, 16, 12, 9, 7, 5, 3, 2, 2, 1],
    [1, 2, 1, 1, 2, 3, 6, 9, 12, 15, 14, 12, 10, 12, 14, 13, 10, 8, 5, 4, 3, 2, 1, 1],
  ],
};

export const incidents = [
  { id: 'INC-2301', date: 'Sep 09', severity: 'Sev 4', service: 'Cosmos DB', summary: 'RU throttling on the transcript write path', duration: 'ongoing', status: 'Monitoring' },
  { id: 'INC-2291', date: 'Aug 31', severity: 'Sev 2', service: 'Azure OpenAI', summary: 'PTU capacity throttling triggered a client retry storm', duration: '3h 12m', status: 'Resolved' },
  { id: 'INC-2287', date: 'Aug 24', severity: 'Sev 3', service: 'AI Search', summary: 'Index rebuild degraded query latency', duration: '1h 04m', status: 'Resolved' },
  { id: 'INC-2280', date: 'Aug 14', severity: 'Sev 3', service: 'Container Apps', summary: 'Revision rollout failed its readiness probe', duration: '0h 38m', status: 'Resolved' },
  { id: 'INC-2274', date: 'Aug 06', severity: 'Sev 4', service: 'AI Speech', summary: 'Elevated WebSocket disconnects, single region', duration: '2h 21m', status: 'Resolved' },
];

export const sloGauges = [
  { label: 'Availability', value: 99.94, target: 99.9, unit: '%', floor: 99.5 },
  { label: 'p95 under 1s', value: 96.2, target: 95, unit: '%', floor: 80 },
  { label: 'Error budget left', value: 68, target: 25, unit: '%', floor: 0 },
];
