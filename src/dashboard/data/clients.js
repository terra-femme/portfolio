/**
 * Mock client-relationship-health data.
 *
 * Same rules as azure.js: static, deterministic, internally consistent. All
 * organisation names are invented; nothing here is real customer data.
 *
 * The narrative thread is Northwind Health Group. It is the single largest
 * account by ARR and it is quietly failing, which you can trace across the
 * whole report without being told:
 *   - accounts        health 38, trending -14, renewal inside 60 days
 *   - churnDrivers    its three problems are the top three drivers
 *   - npsTrend        the dip at Jul/Aug is that account's survey landing
 *   - renewalPipeline Q4 carries the $412k "at risk" band
 * A health dashboard where nothing is wrong is not a health dashboard, so the
 * data was built around one account you should worry about and one you should
 * upsell (Contoso Diagnostics).
 */

export const LAST_SYNC = '2026-09-10T05:15:00Z';

// ---------------------------------------------------------------- headline
export const clientKpis = [
  { id: 'arr', label: 'Total ARR', value: 4.82, prefix: '$', suffix: 'M', decimals: 2, delta: 11.4, deltaLabel: 'vs. last year', goodWhen: 'up' },
  { id: 'nrr', label: 'Net revenue retention', value: 108, suffix: '%', decimals: 0, delta: 3.2, deltaLabel: 'vs. last quarter', goodWhen: 'up' },
  { id: 'risk', label: 'ARR at risk', value: 412, prefix: '$', suffix: 'k', decimals: 0, delta: 18.6, deltaLabel: 'vs. last quarter', goodWhen: 'down' },
  { id: 'health', label: 'Avg. health score', value: 71.4, decimals: 1, delta: -2.8, deltaLabel: 'vs. last quarter', goodWhen: 'up' },
];

/**
 * `spark` is 8 quarters of product usage, normalised 0-100. It is the leading
 * indicator: accounts whose sparkline turns down lose health a quarter later.
 */
export const accounts = [
  { name: 'Northwind Health Group', segment: 'Enterprise', arr: 412000, health: 38, trend: -14, renewal: '2026-11-04', owner: 'K. Rivera', nps: 3, lastTouch: 34, tickets: 11, spark: [72, 75, 78, 74, 68, 59, 48, 38] },
  { name: 'Contoso Diagnostics', segment: 'Enterprise', arr: 688000, health: 92, trend: 6, renewal: '2027-03-19', owner: 'K. Rivera', nps: 9, lastTouch: 3, tickets: 1, spark: [64, 68, 71, 76, 80, 84, 88, 92] },
  { name: 'Fabrikam Medical', segment: 'Enterprise', arr: 540000, health: 81, trend: 2, renewal: '2027-01-22', owner: 'D. Osei', nps: 8, lastTouch: 6, tickets: 2, spark: [70, 72, 71, 74, 76, 78, 79, 81] },
  { name: 'Tailwind Radiology', segment: 'Mid-Market', arr: 296000, health: 74, trend: -3, renewal: '2026-12-11', owner: 'D. Osei', nps: 7, lastTouch: 12, tickets: 4, spark: [78, 79, 77, 78, 76, 75, 77, 74] },
  { name: 'Adventure Works Clinic', segment: 'Mid-Market', arr: 264000, health: 86, trend: 4, renewal: '2027-02-08', owner: 'M. Haddad', nps: 9, lastTouch: 5, tickets: 1, spark: [69, 71, 74, 77, 79, 82, 84, 86] },
  { name: 'Woodgrove Behavioral', segment: 'Mid-Market', arr: 248000, health: 63, trend: -7, renewal: '2026-10-27', owner: 'M. Haddad', nps: 5, lastTouch: 21, tickets: 6, spark: [76, 77, 75, 72, 71, 68, 66, 63] },
  { name: 'Lamna Rehabilitation', segment: 'Mid-Market', arr: 232000, health: 78, trend: 1, renewal: '2027-04-30', owner: 'K. Rivera', nps: 8, lastTouch: 9, tickets: 2, spark: [72, 73, 74, 76, 75, 77, 77, 78] },
  { name: 'Proseware Labs', segment: 'Mid-Market', arr: 210000, health: 69, trend: -2, renewal: '2027-01-15', owner: 'D. Osei', nps: 6, lastTouch: 16, tickets: 3, spark: [74, 73, 72, 71, 70, 71, 70, 69] },
  { name: 'Relecloud Telehealth', segment: 'Mid-Market', arr: 198000, health: 88, trend: 5, renewal: '2027-05-06', owner: 'M. Haddad', nps: 9, lastTouch: 4, tickets: 0, spark: [70, 72, 76, 79, 81, 84, 86, 88] },
  { name: 'Wide World Imaging', segment: 'SMB', arr: 142000, health: 72, trend: 0, renewal: '2026-12-02', owner: 'D. Osei', nps: 7, lastTouch: 14, tickets: 2, spark: [71, 72, 73, 72, 71, 72, 72, 72] },
  { name: 'Litware Pathology', segment: 'SMB', arr: 128000, health: 58, trend: -9, renewal: '2026-11-18', owner: 'M. Haddad', nps: 4, lastTouch: 27, tickets: 5, spark: [74, 73, 71, 68, 66, 63, 61, 58] },
  { name: 'Trey Research Health', segment: 'SMB', arr: 116000, health: 84, trend: 3, renewal: '2027-03-01', owner: 'K. Rivera', nps: 8, lastTouch: 7, tickets: 1, spark: [72, 74, 76, 78, 80, 81, 83, 84] },
  { name: 'Alpine Ski Sports Med', segment: 'SMB', arr: 94000, health: 76, trend: 2, renewal: '2027-02-14', owner: 'D. Osei', nps: 8, lastTouch: 11, tickets: 1, spark: [70, 71, 72, 73, 74, 75, 75, 76] },
  { name: 'Fourth Coffee Occ. Health', segment: 'SMB', arr: 78000, health: 67, trend: -4, renewal: '2026-10-09', owner: 'M. Haddad', nps: 6, lastTouch: 19, tickets: 3, spark: [73, 73, 72, 71, 70, 69, 68, 67] },
];

// Buckets, not a histogram of the 14 rows above -- this represents the full
// book of business (68 accounts), of which `accounts` is the top slice.
export const healthDistribution = [
  { label: 'Critical (0-39)', value: 3, color: 'var(--c-crit)' },
  { label: 'At risk (40-59)', value: 7, color: 'var(--c-warn)' },
  { label: 'Stable (60-79)', value: 31, color: 'var(--c-3)' },
  { label: 'Healthy (80-100)', value: 27, color: 'var(--c-1)' },
];

export const segmentMix = [
  { label: 'Enterprise', value: 1640000, color: 'var(--c-1)' },
  { label: 'Mid-Market', value: 1448000, color: 'var(--c-2)' },
  { label: 'SMB', value: 558000, color: 'var(--c-3)' },
  { label: 'Public sector', value: 1174000, color: 'var(--c-4)' },
];

// 12 months of NPS. The Jul/Aug dip is the Northwind survey landing.
export const npsTrend = [
  { label: 'Oct', value: 41 }, { label: 'Nov', value: 43 },
  { label: 'Dec', value: 44 }, { label: 'Jan', value: 46 },
  { label: 'Feb', value: 48 }, { label: 'Mar', value: 47 },
  { label: 'Apr', value: 50 }, { label: 'May', value: 52 },
  { label: 'Jun', value: 51 }, { label: 'Jul', value: 44 },
  { label: 'Aug', value: 39 }, { label: 'Sep', value: 45 },
];

export const renewalPipeline = {
  keys: ['Committed', 'In negotiation', 'At risk'],
  colors: ['var(--c-1)', 'var(--c-3)', 'var(--c-crit)'],
  rows: [
    { label: 'Q4 26', values: [486000, 214000, 412000] },
    { label: 'Q1 27', values: [742000, 168000, 128000] },
    { label: 'Q2 27', values: [518000, 246000, 62000] },
    { label: 'Q3 27', values: [604000, 132000, 0] },
  ],
};

export const churnDrivers = [
  { label: 'Support backlog over 5 tickets', value: 34, color: 'var(--c-crit)' },
  { label: 'No exec touch in 30+ days', value: 28, color: 'var(--c-warn)' },
  { label: 'Usage down 2 quarters running', value: 22, color: 'var(--c-3)' },
  { label: 'Champion left the org', value: 11, color: 'var(--c-4)' },
  { label: 'Budget cycle shifted', value: 5, color: 'var(--c-5)' },
];

// Touchpoints per week: 6 activity types x 12 weeks. Reads as a coverage map --
// the sparse right-hand columns on "Exec sync" are the leading indicator that
// the top accounts are being under-served.
export const engagementHeatmap = {
  days: ['Exec sync', 'QBR', 'Support call', 'Training', 'Product demo', 'Email thread'],
  cols: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
  rows: [
    [4, 3, 5, 2, 4, 3, 2, 1, 2, 1, 0, 1],
    [1, 0, 2, 6, 1, 0, 3, 5, 0, 1, 2, 4],
    [8, 11, 9, 12, 10, 14, 13, 16, 15, 18, 14, 12],
    [2, 4, 3, 5, 6, 4, 3, 2, 4, 3, 5, 4],
    [3, 2, 4, 3, 5, 6, 4, 3, 6, 7, 5, 4],
    [22, 26, 24, 31, 28, 27, 25, 33, 29, 34, 30, 28],
  ],
};

export const csatBySegment = [
  { label: 'Enterprise', value: 4.6, max: 5 },
  { label: 'Mid-Market', value: 4.3, max: 5 },
  { label: 'SMB', value: 4.1, max: 5 },
  { label: 'Public sector', value: 4.4, max: 5 },
];

export const playbooks = [
  { account: 'Northwind Health Group', play: 'Executive recovery plan', owner: 'K. Rivera', due: 'Sep 18', status: 'In progress' },
  { account: 'Litware Pathology', play: 'Support backlog burn-down', owner: 'M. Haddad', due: 'Sep 22', status: 'In progress' },
  { account: 'Woodgrove Behavioral', play: 'Re-onboarding workshop', owner: 'M. Haddad', due: 'Oct 02', status: 'Scheduled' },
  { account: 'Contoso Diagnostics', play: 'Expansion / upsell motion', owner: 'K. Rivera', due: 'Sep 30', status: 'Scheduled' },
  { account: 'Fourth Coffee Occ. Health', play: 'Renewal outreach', owner: 'M. Haddad', due: 'Sep 15', status: 'Overdue' },
];
