/**
 * Mock institutional coverage data: client relationship health across lines of
 * business, of the kind a coverage banker reads inside a bank's own system.
 *
 * Same discipline as azure.js. Nothing here is a typed-in total. There is one
 * fact table (CLIENT_ROWS, 16 clients x 5 lines = 80 rows) and every headline,
 * every lollipop, every RAG cell and every slicer aggregate is computed from
 * it. That is also what makes cross-filtering honest: when a slicer narrows the
 * rows, the numbers move because they were always a function of the rows.
 *
 * All client names are invented. No real institution, mandate or revenue figure
 * appears anywhere in this file.
 */

export const LAST_REFRESH = '2026-09-10T05:58:00Z';

/** The five lines the franchise books revenue against. */
export const LINES = [
  { id: 'fic', label: 'FIC', full: 'Fixed income, currencies & commodities', color: 'var(--t-1)' },
  { id: 'eq', label: 'Equities', full: 'Cash equities & derivatives', color: 'var(--t-2)' },
  { id: 'gtb', label: 'GTB', full: 'Global transaction banking', color: 'var(--t-4)' },
  { id: 'adv', label: 'Advisory', full: 'M&A, ECM and DCM', color: 'var(--t-6)' },
  { id: 'lend', label: 'Lending', full: 'Corporate lending & structured credit', color: 'var(--t-5)' },
];

export const REGIONS = ['AMER', 'EMEA', 'APAC'];
export const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];

/**
 * Top 16 clients by revenue. `rev` is YTD revenue in $m per line, `wallet` is
 * estimated share of that client's spend per line, in the LINES order above.
 *
 * The story in here: GTB is the healthy franchise, Advisory is thin almost
 * everywhere, and three names (Blackwater, Cordillera, Silverbirch) are large
 * revenue with weak wallet, which is exactly the profile that looks fine on a
 * revenue report and is actually a relationship at risk.
 */
const CLIENT_ROWS = [
  { name: 'Meridian Capital Partners', region: 'AMER', tier: 'Tier 1', since: 2011, rev: [24.8, 18.2, 11.4, 7.6, 9.1], wallet: [34, 29, 41, 18, 26] },
  { name: 'Kestrel Asset Management', region: 'EMEA', tier: 'Tier 1', since: 2009, rev: [21.3, 22.7, 8.9, 5.2, 6.4], wallet: [31, 36, 33, 14, 21] },
  { name: 'Orion Sovereign Fund', region: 'APAC', tier: 'Tier 1', since: 2014, rev: [19.6, 12.4, 14.8, 3.1, 11.2], wallet: [28, 22, 44, 9, 30] },
  { name: 'Northgate Pension Trust', region: 'EMEA', tier: 'Tier 1', since: 2008, rev: [16.2, 15.9, 6.7, 2.4, 5.8], wallet: [26, 31, 27, 8, 19] },
  { name: 'Blackwater Industrials', region: 'AMER', tier: 'Tier 1', since: 2016, rev: [18.9, 6.2, 12.1, 9.8, 14.6], wallet: [12, 7, 16, 11, 14] },
  { name: 'Helvetia Reinsurance', region: 'EMEA', tier: 'Tier 2', since: 2012, rev: [12.4, 9.8, 7.2, 2.9, 4.1], wallet: [24, 27, 35, 12, 18] },
  { name: 'Pacific Rim Logistics', region: 'APAC', tier: 'Tier 2', since: 2018, rev: [8.7, 4.2, 13.6, 3.8, 6.9], wallet: [19, 14, 42, 13, 22] },
  { name: 'Cordillera Mining', region: 'AMER', tier: 'Tier 2', since: 2015, rev: [14.1, 3.8, 5.4, 6.2, 10.8], wallet: [11, 6, 13, 9, 12] },
  { name: 'Tiber Insurance Group', region: 'EMEA', tier: 'Tier 2', since: 2013, rev: [9.6, 11.2, 6.8, 1.9, 3.7], wallet: [22, 29, 31, 7, 16] },
  { name: 'Solent Energy Group', region: 'EMEA', tier: 'Tier 2', since: 2017, rev: [11.8, 5.1, 8.4, 5.6, 8.2], wallet: [18, 12, 26, 16, 21] },
  { name: 'Hanseatic Shipping', region: 'EMEA', tier: 'Tier 3', since: 2019, rev: [6.2, 2.1, 9.8, 1.4, 4.6], wallet: [16, 9, 38, 6, 19] },
  { name: 'Cobalt Pharma Group', region: 'AMER', tier: 'Tier 2', since: 2020, rev: [5.8, 7.9, 4.2, 8.1, 3.4], wallet: [14, 21, 19, 24, 11] },
  { name: 'Vantage Point Holdings', region: 'AMER', tier: 'Tier 3', since: 2021, rev: [4.9, 6.4, 3.1, 2.2, 2.8], wallet: [17, 23, 17, 10, 13] },
  { name: 'Ardent Infrastructure', region: 'APAC', tier: 'Tier 3', since: 2019, rev: [7.1, 2.8, 6.2, 4.4, 7.8], wallet: [15, 8, 24, 14, 23] },
  { name: 'Silverbirch Retail', region: 'AMER', tier: 'Tier 3', since: 2022, rev: [5.4, 3.2, 4.8, 1.6, 6.1], wallet: [9, 7, 12, 5, 10] },
  { name: 'Aurelian Global Advisors', region: 'APAC', tier: 'Tier 3', since: 2020, rev: [3.8, 5.6, 2.9, 3.2, 2.1], wallet: [13, 19, 15, 18, 9] },
];

/** Year-on-year wallet-share movement in percentage points, per line. */
const TREND = {
  'Meridian Capital Partners': [2, 1, 3, -1, 1],
  'Kestrel Asset Management': [1, 3, 2, 0, 1],
  'Orion Sovereign Fund': [-1, 2, 4, -2, 2],
  'Northgate Pension Trust': [1, 2, 1, -1, 0],
  'Blackwater Industrials': [-4, -3, -2, -5, -3],
  'Helvetia Reinsurance': [2, 1, 3, 0, 1],
  'Pacific Rim Logistics': [1, 0, 5, 1, 2],
  'Cordillera Mining': [-3, -2, -4, -3, -2],
  'Tiber Insurance Group': [0, 2, 2, -1, 1],
  'Solent Energy Group': [1, -1, 2, 2, 1],
  'Hanseatic Shipping': [0, -1, 4, -1, 1],
  'Cobalt Pharma Group': [2, 3, 1, 4, 0],
  'Vantage Point Holdings': [1, 2, 0, 1, 1],
  'Ardent Infrastructure': [-1, -2, 2, 1, 3],
  'Silverbirch Retail': [-2, -3, -3, -2, -4],
  'Aurelian Global Advisors': [1, 2, 1, 2, 0],
};

/**
 * The flat fact table. One row per client per line, which is the shape a BI
 * tool would actually pull, and the shape that makes every aggregate below a
 * one-line reduce rather than another hand-typed number.
 */
export const FACTS = CLIENT_ROWS.flatMap((c) =>
  LINES.map((line, i) => ({
    client: c.name,
    region: c.region,
    tier: c.tier,
    since: c.since,
    line: line.id,
    lineLabel: line.label,
    revenue: c.rev[i],
    wallet: c.wallet[i],
    trend: TREND[c.name][i],
  }))
);

/**
 * Relationship health, 0 to 100, from three things a coverage team actually
 * argues about: how much of the client's wallet we hold, which way it moved,
 * and whether the relationship spans lines or sits in one product.
 *
 * Weighted 55/25/20. Wallet share dominates because it is the only one of the
 * three that is a level rather than a delta, but trend carries real weight so a
 * large, shrinking relationship cannot hide behind its size. That is the whole
 * point: revenue alone would rank Blackwater fifth-best, and it is the single
 * worst relationship in the book.
 */
export function healthOf(wallet, trend, breadth) {
  const walletScore = Math.min(100, (wallet / 40) * 100);
  const trendScore = Math.max(0, Math.min(100, 50 + trend * 12));
  const breadthScore = Math.min(100, (breadth / LINES.length) * 100);
  return Math.round(walletScore * 0.55 + trendScore * 0.25 + breadthScore * 0.2);
}

export function ragOf(health) {
  if (health >= 62) return 'ok';
  if (health >= 42) return 'warn';
  return 'crit';
}

export const RAG_LABEL = { ok: 'Healthy', warn: 'Watch', crit: 'At risk' };

/** Rows left after the slicers. Everything on the report reads from this. */
export function applySlicers(facts, { region, line, tier }) {
  return facts.filter((f) =>
    (region === 'All' || f.region === region)
    && (line === 'All' || f.line === line)
    && (tier === 'All' || f.tier === tier));
}

/** Per line of business: revenue, weighted wallet share, trend and health. */
export function byLine(facts) {
  return LINES.map((line) => {
    const rows = facts.filter((f) => f.line === line.id);
    const revenue = rows.reduce((s, r) => s + r.revenue, 0);
    if (!rows.length) return { ...line, revenue: 0, wallet: 0, trend: 0, health: 0, rag: 'crit', clients: 0 };
    // Revenue-weighted, not a plain mean: a 40% wallet share on a $200k client
    // should not offset a 9% share on a $19m one.
    const wallet = rows.reduce((s, r) => s + r.wallet * r.revenue, 0) / revenue;
    const trend = rows.reduce((s, r) => s + r.trend * r.revenue, 0) / revenue;
    const breadth = new Set(rows.map((r) => r.client)).size / CLIENT_ROWS.length * LINES.length;
    const health = healthOf(wallet, trend, breadth);
    return {
      ...line,
      revenue,
      wallet: Number(wallet.toFixed(1)),
      trend: Number(trend.toFixed(1)),
      health,
      rag: ragOf(health),
      clients: new Set(rows.map((r) => r.client)).size,
    };
  });
}

/** Per client: total revenue, weighted wallet, breadth of lines, health. */
export function byClient(facts) {
  const names = [...new Set(facts.map((f) => f.client))];
  return names.map((name) => {
    const rows = facts.filter((f) => f.client === name);
    const revenue = rows.reduce((s, r) => s + r.revenue, 0);
    const wallet = rows.reduce((s, r) => s + r.wallet * r.revenue, 0) / (revenue || 1);
    const trend = rows.reduce((s, r) => s + r.trend * r.revenue, 0) / (revenue || 1);
    // A line counts toward breadth only above 15% wallet. Booking a token trade
    // in five products is not a five-product relationship.
    const breadth = rows.filter((r) => r.wallet >= 15).length;
    const health = healthOf(wallet, trend, breadth);
    const meta = CLIENT_ROWS.find((c) => c.name === name);
    return {
      name,
      region: meta.region,
      tier: meta.tier,
      since: meta.since,
      revenue: Number(revenue.toFixed(1)),
      wallet: Number(wallet.toFixed(1)),
      trend: Number(trend.toFixed(1)),
      breadth,
      health,
      rag: ragOf(health),
      cells: LINES.map((l) => rows.find((r) => r.line === l.id) || null),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

/** Headline tiles, all derived from whatever the slicers left behind. */
export function headline(facts) {
  const revenue = facts.reduce((s, r) => s + r.revenue, 0);
  const clients = byClient(facts);
  const wallet = facts.reduce((s, r) => s + r.wallet * r.revenue, 0) / (revenue || 1);
  const atRisk = clients.filter((c) => c.rag === 'crit');
  const atRiskRevenue = atRisk.reduce((s, c) => s + c.revenue, 0);
  const avgBreadth = clients.reduce((s, c) => s + c.breadth, 0) / (clients.length || 1);
  return {
    revenue,
    clients: clients.length,
    wallet: Number(wallet.toFixed(1)),
    atRisk: atRisk.length,
    atRiskRevenue: Number(atRiskRevenue.toFixed(1)),
    avgBreadth: Number(avgBreadth.toFixed(2)),
  };
}

/** Franchise scale behind the named accounts, for context on the tiles. */
export const FRANCHISE = {
  coveredClients: 4812,
  tradesYtd: 68.4,        // millions
  revenueYtd: 2.41,       // billions
  namedShare: 0.19,       // the 16 named names are 19% of franchise revenue
};

// 12 months of revenue by line, $m. Oldest first. Advisory is visibly flat
// while GTB compounds, which is the trend the lollipops report as health.
export const REVENUE_TREND = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  series: {
    fic: [14.1, 14.8, 13.2, 15.4, 16.1, 16.8, 16.2, 17.4, 18.1, 18.9, 19.4, 20.2],
    eq: [11.2, 11.8, 10.4, 12.1, 12.6, 13.1, 12.7, 13.4, 13.8, 14.1, 14.4, 14.9],
    gtb: [8.4, 8.9, 8.2, 9.6, 10.2, 10.9, 11.2, 12.1, 12.8, 13.6, 14.2, 15.1],
    adv: [5.8, 6.1, 4.9, 6.2, 6.4, 6.1, 5.8, 6.3, 6.0, 6.4, 6.1, 6.3],
    lend: [7.2, 7.6, 7.1, 8.0, 8.3, 8.6, 8.4, 8.9, 9.2, 9.5, 9.8, 10.1],
  },
};

/** Live mandates, for the pipeline timeline. Weeks are 0 to 26 from today. */
export const MANDATES = [
  { client: 'Cobalt Pharma Group', line: 'adv', name: 'Cross-border acquisition', start: 0, end: 14, value: 480, stage: 'Diligence' },
  { client: 'Solent Energy Group', line: 'lend', name: 'Term loan refinancing', start: 2, end: 9, value: 350, stage: 'Documentation' },
  { client: 'Orion Sovereign Fund', line: 'gtb', name: 'Regional cash mandate', start: 0, end: 22, value: 210, stage: 'Onboarding' },
  { client: 'Blackwater Industrials', line: 'adv', name: 'Divestment advisory', start: 5, end: 20, value: 620, stage: 'Pitch' },
  { client: 'Meridian Capital Partners', line: 'fic', name: 'Rates hedging programme', start: 1, end: 7, value: 140, stage: 'Execution' },
  { client: 'Pacific Rim Logistics', line: 'gtb', name: 'Supply chain finance', start: 4, end: 18, value: 290, stage: 'Structuring' },
  { client: 'Kestrel Asset Management', line: 'eq', name: 'Equity derivatives overlay', start: 3, end: 11, value: 180, stage: 'Execution' },
  { client: 'Cordillera Mining', line: 'lend', name: 'Reserve-based facility', start: 8, end: 24, value: 410, stage: 'Pitch' },
];
