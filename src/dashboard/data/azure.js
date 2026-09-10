/**
 * Mock Azure platform telemetry.
 *
 * Every series here is STATIC and hand-tuned -- no randomness, no Date.now().
 * That is deliberate: the dashboard must render identically on every visit so a
 * screenshot taken for an application still matches what a reviewer sees later.
 *
 * The data tells ONE coherent story. On 2026-08-31 (index 19 of the 30-day
 * window) an Azure OpenAI capacity event triggered a client retry storm. That
 * single incident is visible in four independent places:
 *   - dailySpend       spikes to $1,180 (retries are billed)
 *   - latencyDaily     p95 jumps 832ms -> 2,140ms
 *   - errorRateHeatmap goes hot across that row
 *   - incidents        carries the INC-2291 record
 * Mock data that contradicts itself is the fastest way to look fake, so the
 * spike was propagated by hand through all four.
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

// ---------------------------------------------------------------- headline
export const azureKpis = [
  { id: 'spend', label: 'Month-to-date spend', value: 22640, prefix: '$', decimals: 0, delta: 5.9, deltaLabel: 'vs. last month', goodWhen: 'down' },
  { id: 'tokens', label: 'Tokens processed', value: 241.3, suffix: 'M', decimals: 1, delta: 5.4, deltaLabel: 'vs. last month', goodWhen: 'up' },
  { id: 'latency', label: 'p95 latency', value: 812, suffix: 'ms', decimals: 0, delta: -6.8, deltaLabel: 'vs. 30-day avg', goodWhen: 'down' },
  { id: 'uptime', label: 'Availability', value: 99.94, suffix: '%', decimals: 2, delta: 0.04, deltaLabel: 'vs. 99.90% SLO', goodWhen: 'up' },
];

// ------------------------------------------------------------------- spend
// Baseline creeps up with adoption; index 19 is the INC-2291 retry storm.
export const dailySpend = daily([
  620, 645, 590, 612, 668, 701, 655, 638, 672, 690,
  715, 702, 688, 664, 731, 748, 726, 705, 812, 1180,
  1042, 894, 823, 795, 768, 781, 806, 834, 858, 872,
]);

export const monthlySpend = [
  { label: 'Oct', value: 14200 }, { label: 'Nov', value: 14980 },
  { label: 'Dec', value: 13650 }, { label: 'Jan', value: 15720 },
  { label: 'Feb', value: 16340 }, { label: 'Mar', value: 17100 },
  { label: 'Apr', value: 16880 }, { label: 'May', value: 18240 },
  { label: 'Jun', value: 19100 }, { label: 'Jul', value: 20450 },
  { label: 'Aug', value: 21380 }, { label: 'Sep', value: 22640 },
];

// Shares sum to exactly the 22,640 month-to-date figure above.
export const serviceMix = [
  { label: 'Azure OpenAI', value: 8420, color: 'var(--c-1)' },
  { label: 'AI Speech', value: 4310, color: 'var(--c-2)' },
  { label: 'AI Search', value: 2980, color: 'var(--c-3)' },
  { label: 'Container Apps', value: 2240, color: 'var(--c-4)' },
  { label: 'Cosmos DB', value: 1870, color: 'var(--c-5)' },
  { label: 'Blob Storage', value: 1120, color: 'var(--c-6)' },
  { label: 'Functions', value: 890, color: 'var(--c-7)' },
  { label: 'Key Vault etc.', value: 810, color: 'var(--c-8)' },
];

// Stacked area: the two biggest services plus everything else, 12 months.
export const spendStack = {
  keys: ['Azure OpenAI', 'AI Speech', 'Other services'],
  colors: ['var(--c-1)', 'var(--c-2)', 'var(--c-4)'],
  rows: [
    { label: 'Oct', values: [4820, 2610, 6770] },
    { label: 'Nov', values: [5140, 2740, 7100] },
    { label: 'Dec', values: [4660, 2480, 6510] },
    { label: 'Jan', values: [5580, 2920, 7220] },
    { label: 'Feb', values: [5910, 3060, 7370] },
    { label: 'Mar', values: [6240, 3210, 7650] },
    { label: 'Apr', values: [6080, 3180, 7620] },
    { label: 'May', values: [6710, 3440, 8090] },
    { label: 'Jun', values: [7020, 3620, 8460] },
    { label: 'Jul', values: [7580, 3880, 8990] },
    { label: 'Aug', values: [7940, 4090, 9350] },
    { label: 'Sep', values: [8420, 4310, 9910] },
  ],
};

export const topCostDrivers = [
  { rank: 1, resource: 'aoai-prod-eastus', service: 'Azure OpenAI', region: 'East US', cost: 5240, change: 8.2, budget: 0.71 },
  { rank: 2, resource: 'search-clinical-idx', service: 'AI Search', region: 'Sweden Central', cost: 2980, change: -2.4, budget: 0.62 },
  { rank: 3, resource: 'speech-batch-scribe', service: 'AI Speech', region: 'East US', cost: 2960, change: 4.1, budget: 0.54 },
  { rank: 4, resource: 'aoai-prod-weu', service: 'Azure OpenAI', region: 'West Europe', cost: 3180, change: 12.6, budget: 0.88 },
  { rank: 5, resource: 'cosmos-transcripts', service: 'Cosmos DB', region: 'East US', cost: 1870, change: 3.3, budget: 0.48 },
  { rank: 6, resource: 'ca-orchestrator', service: 'Container Apps', region: 'East US', cost: 1640, change: 1.9, budget: 0.43 },
  { rank: 7, resource: 'speech-realtime-gw', service: 'AI Speech', region: 'UK South', cost: 1350, change: 21.8, budget: 0.94 },
  { rank: 8, resource: 'ca-eval-workers', service: 'Container Apps', region: 'Australia East', cost: 600, change: -8.7, budget: 0.22 },
];

// ------------------------------------------------------------------ models
export const modelUsage = [
  { model: 'gpt-4o', calls: 1284000, tokens: 96.4, cost: 4820, p95: 780, share: 0.40 },
  { model: 'gpt-4o-mini', calls: 3910000, tokens: 108.2, cost: 1290, p95: 340, share: 0.45 },
  { model: 'text-embedding-3-large', calls: 2470000, tokens: 28.7, cost: 610, p95: 95, share: 0.12 },
  { model: 'whisper-large-v3', calls: 148000, tokens: 8.0, cost: 1700, p95: 1240, share: 0.03 },
];

export const quotas = [
  { name: 'gpt-4o / East US', used: 142000, limit: 180000, unit: 'TPM' },
  { name: 'gpt-4o / West Europe', used: 88000, limit: 120000, unit: 'TPM' },
  { name: 'gpt-4o-mini / East US', used: 310000, limit: 600000, unit: 'TPM' },
  { name: 'AI Speech concurrency', used: 84, limit: 100, unit: 'streams' },
  { name: 'AI Search index size', used: 38.4, limit: 50, unit: 'GB' },
];

// ----------------------------------------------------------------- regions
export const regions = [
  { label: 'East US', value: 42, requests: '18.2M' },
  { label: 'West Europe', value: 23, requests: '9.9M' },
  { label: 'Sweden Central', value: 14, requests: '6.1M' },
  { label: 'UK South', value: 12, requests: '5.2M' },
  { label: 'Australia East', value: 9, requests: '3.9M' },
];

// ------------------------------------------------------------- reliability
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
  { id: 'INC-2291', date: 'Aug 31', severity: 'Sev 2', service: 'Azure OpenAI', summary: 'Capacity throttling triggered a client retry storm', duration: '3h 12m', status: 'Resolved' },
  { id: 'INC-2287', date: 'Aug 24', severity: 'Sev 3', service: 'AI Search', summary: 'Index rebuild degraded query latency', duration: '1h 04m', status: 'Resolved' },
  { id: 'INC-2280', date: 'Aug 14', severity: 'Sev 3', service: 'Container Apps', summary: 'Revision rollout failed its readiness probe', duration: '0h 38m', status: 'Resolved' },
  { id: 'INC-2274', date: 'Aug 06', severity: 'Sev 4', service: 'AI Speech', summary: 'Elevated WebSocket disconnects, single region', duration: '2h 21m', status: 'Resolved' },
];

export const sloGauges = [
  { label: 'Availability', value: 99.94, target: 99.9, unit: '%', floor: 99.5 },
  { label: 'p95 under 1s', value: 96.2, target: 95, unit: '%', floor: 80 },
  { label: 'Error budget left', value: 68, target: 25, unit: '%', floor: 0 },
];
