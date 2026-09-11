/**
 * Mock client lifecycle data: the health of client relationships as an
 * onboarding and client-management function actually measures it.
 *
 * Relationship health here is NOT revenue. It is whether the client's file is
 * in good standing: periodic review in date, no open screening hits, documents
 * complete, no trading restriction, and not being asked for the same paperwork
 * for the fifth time. Lines of business onboard clients continuously, and a
 * relationship can be highly profitable and still be a problem if it cannot be
 * traded because its KYC lapsed.
 *
 * Same discipline as azure.js. One fact table, and every headline, lollipop,
 * matrix cell and queue count is computed from it, so a slicer moves every
 * number together and nothing can disagree with anything else.
 *
 * All client names are invented. No real institution, case, alert or person
 * appears anywhere in this file.
 */

export const LAST_REFRESH = '2026-09-11T06:10:00Z';

/** The lines that onboard and maintain clients. */
export const LOBS = [
  { id: 'fic', label: 'FIC', full: 'Fixed income, currencies and commodities', color: 'var(--t-1)' },
  { id: 'mkt', label: 'Markets', full: 'Equities and markets', color: 'var(--t-2)' },
  { id: 'gtb', label: 'GTB', full: 'Global transaction banking', color: 'var(--t-4)' },
  { id: 'adv', label: 'Advisory', full: 'M&A, ECM and DCM', color: 'var(--t-6)' },
  { id: 'lend', label: 'Lending', full: 'Corporate lending', color: 'var(--t-5)' },
];

export const REGIONS = ['AMER', 'EMEA', 'APAC'];
export const RISK_RATINGS = ['High', 'Medium', 'Low'];

/** The queues a client file moves through. */
export const WORKSTREAMS = [
  { id: 'onboarding', label: 'Onboarding', sla: 45, unit: 'days' },
  { id: 'pr', label: 'Periodic review', sla: 30, unit: 'days' },
  { id: 'edd', label: 'Emergency review', sla: 10, unit: 'days' },
  { id: 'screening', label: 'Screening alerts', sla: 5, unit: 'days' },
];

/** Per-LOB status for a client file. */
export const STATUS = {
  live: { label: 'Live', rag: 'ok' },
  pending: { label: 'In onboarding', rag: 'warn' },
  review: { label: 'Under review', rag: 'warn' },
  restricted: { label: 'Restricted', rag: 'crit' },
  none: { label: 'Not onboarded', rag: null },
};

/**
 * The client book.
 *
 * `kycDueDays` is days until the periodic review falls due; negative is overdue.
 * `outreach` is how many separate times the client has been asked for
 * outstanding documents on the current case, which is the number that measures
 * friction the client actually feels.
 *
 * The story: Cordillera Mining is a High risk name 46 days past its periodic
 * review with an open sanctions hit, so three lines are restricted and it cannot
 * be traded. Blackwater Industrials has been in onboarding 118 days against a
 * 45 day SLA and has been asked for documents seven times, which is how a
 * relationship is lost before it ever opens.
 */
const CLIENTS = [
  { name: 'Meridian Capital Partners', region: 'AMER', risk: 'Low', kycDueDays: 212, docs: 0, outreach: 0, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'live', gtb: 'live', adv: 'live', lend: 'live' } },
  { name: 'Kestrel Asset Management', region: 'EMEA', risk: 'Low', kycDueDays: 168, docs: 0, outreach: 1, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'live', gtb: 'live', adv: 'none', lend: 'live' } },
  { name: 'Orion Sovereign Fund', region: 'APAC', risk: 'High', kycDueDays: 34, docs: 1, outreach: 2, onboardingDays: null, alerts: [{ type: 'PEP', severity: 'Medium', ageDays: 4 }], lobs: { fic: 'live', mkt: 'live', gtb: 'live', adv: 'pending', lend: 'live' } },
  { name: 'Northgate Pension Trust', region: 'EMEA', risk: 'Low', kycDueDays: 96, docs: 0, outreach: 0, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'live', gtb: 'live', adv: 'none', lend: 'live' } },
  { name: 'Blackwater Industrials', region: 'AMER', risk: 'High', kycDueDays: 58, docs: 9, outreach: 7, onboardingDays: 118, alerts: [{ type: 'Adverse media', severity: 'Medium', ageDays: 22 }], lobs: { fic: 'pending', mkt: 'pending', gtb: 'pending', adv: 'none', lend: 'pending' } },
  { name: 'Helvetia Reinsurance', region: 'EMEA', risk: 'Medium', kycDueDays: 121, docs: 0, outreach: 1, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'live', gtb: 'live', adv: 'none', lend: 'live' } },
  { name: 'Pacific Rim Logistics', region: 'APAC', risk: 'Medium', kycDueDays: 27, docs: 2, outreach: 2, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'none', gtb: 'live', adv: 'pending', lend: 'live' } },
  { name: 'Cordillera Mining', region: 'AMER', risk: 'High', kycDueDays: -46, docs: 6, outreach: 5, onboardingDays: null, alerts: [{ type: 'Sanctions', severity: 'High', ageDays: 17 }, { type: 'Adverse media', severity: 'Medium', ageDays: 31 }], lobs: { fic: 'restricted', mkt: 'restricted', gtb: 'review', adv: 'none', lend: 'restricted' } },
  { name: 'Tiber Insurance Group', region: 'EMEA', risk: 'Low', kycDueDays: 143, docs: 0, outreach: 0, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'live', gtb: 'live', adv: 'none', lend: 'none' } },
  { name: 'Solent Energy Group', region: 'EMEA', risk: 'Medium', kycDueDays: -12, docs: 3, outreach: 3, onboardingDays: null, alerts: [{ type: 'Adverse media', severity: 'Medium', ageDays: 9 }], lobs: { fic: 'live', mkt: 'live', gtb: 'review', adv: 'pending', lend: 'live' } },
  { name: 'Hanseatic Shipping', region: 'EMEA', risk: 'High', kycDueDays: 19, docs: 4, outreach: 4, onboardingDays: null, alerts: [{ type: 'Sanctions', severity: 'Medium', ageDays: 6 }], lobs: { fic: 'live', mkt: 'none', gtb: 'review', adv: 'none', lend: 'live' } },
  { name: 'Cobalt Pharma Group', region: 'AMER', risk: 'Medium', kycDueDays: 88, docs: 1, outreach: 1, onboardingDays: 31, alerts: [], lobs: { fic: 'pending', mkt: 'live', gtb: 'live', adv: 'live', lend: 'none' } },
  { name: 'Vantage Point Holdings', region: 'AMER', risk: 'Low', kycDueDays: 64, docs: 0, outreach: 0, onboardingDays: null, alerts: [], lobs: { fic: 'live', mkt: 'live', gtb: 'none', adv: 'none', lend: 'live' } },
  { name: 'Ardent Infrastructure', region: 'APAC', risk: 'Medium', kycDueDays: 8, docs: 3, outreach: 3, onboardingDays: null, alerts: [{ type: 'PEP', severity: 'Medium', ageDays: 12 }], lobs: { fic: 'live', mkt: 'none', gtb: 'live', adv: 'pending', lend: 'review' } },
  { name: 'Silverbirch Retail', region: 'AMER', risk: 'High', kycDueDays: -73, docs: 8, outreach: 6, onboardingDays: null, alerts: [{ type: 'Ownership change', severity: 'High', ageDays: 28 }], lobs: { fic: 'restricted', mkt: 'restricted', gtb: 'restricted', adv: 'none', lend: 'review' } },
  { name: 'Aurelian Global Advisors', region: 'APAC', risk: 'Low', kycDueDays: 174, docs: 0, outreach: 1, onboardingDays: 22, alerts: [], lobs: { fic: 'pending', mkt: 'live', gtb: 'pending', adv: 'live', lend: 'none' } },
];

/**
 * Relationship health, 0 to 100. Starts at a clean file and deducts for each
 * thing wrong with it, because that is how the work is actually reasoned about:
 * nobody scores a file up, they list what is outstanding.
 *
 *   overdue periodic review   up to -35   the one that stops trading
 *   open High alert              -18 each sanctions, ownership change
 *   open Medium alert             -8 each PEP, adverse media
 *   documents outstanding     up to -20   2.5 per item
 *   any restricted line          -15      the relationship is already impaired
 *   repeat outreach           up to -12   3 per ask beyond the second
 *
 * Overdue review is weighted hardest because it is the only item on the list
 * that is entirely the bank's own failure and the only one that can halt
 * business on its own.
 */
export function healthOf(c) {
  let score = 100;

  if (c.kycDueDays < 0) score -= Math.min(35, 10 + Math.abs(c.kycDueDays) * 0.4);
  else if (c.kycDueDays < 30) score -= 6;

  score -= c.alerts.filter((a) => a.severity === 'High').length * 18;
  score -= c.alerts.filter((a) => a.severity === 'Medium').length * 8;
  score -= Math.min(20, c.docs * 2.5);
  if (Object.values(c.lobs).includes('restricted')) score -= 15;
  score -= Math.min(12, Math.max(0, c.outreach - 2) * 3);

  return Math.max(0, Math.round(score));
}

export function ragOf(health) {
  if (health >= 75) return 'ok';
  if (health >= 50) return 'warn';
  return 'crit';
}

export const RAG_LABEL = { ok: 'Good standing', warn: 'Needs attention', crit: 'Impaired' };

/** Every client enriched with its derived health and flags. */
export const BOOK = CLIENTS.map((c) => {
  const health = healthOf(c);
  const liveLobs = Object.entries(c.lobs).filter(([, s]) => s === 'live').map(([id]) => id);
  const restrictedLobs = Object.entries(c.lobs).filter(([, s]) => s === 'restricted').map(([id]) => id);
  const pendingLobs = Object.entries(c.lobs).filter(([, s]) => s === 'pending').map(([id]) => id);
  return {
    ...c,
    health,
    rag: ragOf(health),
    overdue: c.kycDueDays < 0,
    dueSoon: c.kycDueDays >= 0 && c.kycDueDays < 30,
    highAlerts: c.alerts.filter((a) => a.severity === 'High').length,
    openAlerts: c.alerts.length,
    liveLobs,
    restrictedLobs,
    pendingLobs,
    clearToTrade: restrictedLobs.length === 0 && c.kycDueDays >= 0,
    slaBreach: c.onboardingDays != null && c.onboardingDays > 45,
  };
}).sort((a, b) => a.health - b.health);   // worst first: this is a work queue

/** The flat fact table: one row per client per line of business. */
export const FACTS = BOOK.flatMap((c) =>
  LOBS.filter((l) => c.lobs[l.id] !== 'none').map((l) => ({
    client: c.name,
    region: c.region,
    risk: c.risk,
    lob: l.id,
    lobLabel: l.label,
    status: c.lobs[l.id],
    health: c.health,
    rag: c.rag,
    overdue: c.overdue,
    openAlerts: c.openAlerts,
    highAlerts: c.highAlerts,
    docs: c.docs,
    outreach: c.outreach,
    onboardingDays: c.onboardingDays,
    kycDueDays: c.kycDueDays,
  }))
);

export function applySlicers(facts, { region, lob, risk }) {
  return facts.filter((f) =>
    (region === 'All' || f.region === region)
    && (lob === 'All' || f.lob === lob)
    && (risk === 'All' || f.risk === risk));
}

/** Clients surviving the slicers, deduplicated back to one row each. */
export function clientsIn(facts) {
  const names = new Set(facts.map((f) => f.client));
  return BOOK.filter((c) => names.has(c.name));
}

/**
 * Relationship health per line of business.
 *
 * A line's health is the mean health of the client files it carries, which is
 * the honest aggregate: a line is exactly as healthy as the relationships it
 * has to maintain. `blocked` counts files that cannot transact on that line.
 */
export function byLob(facts) {
  return LOBS.map((lob) => {
    const rows = facts.filter((f) => f.lob === lob.id);
    if (!rows.length) {
      return { ...lob, health: 0, rag: 'crit', clients: 0, live: 0, pending: 0, blocked: 0, overdue: 0, alerts: 0 };
    }
    const health = Math.round(rows.reduce((s, r) => s + r.health, 0) / rows.length);
    return {
      ...lob,
      health,
      rag: ragOf(health),
      clients: rows.length,
      live: rows.filter((r) => r.status === 'live').length,
      pending: rows.filter((r) => r.status === 'pending').length,
      blocked: rows.filter((r) => r.status === 'restricted' || r.status === 'review').length,
      overdue: rows.filter((r) => r.overdue).length,
      alerts: rows.reduce((s, r) => s + r.openAlerts, 0),
    };
  });
}

/** Headline tiles, all derived from the filtered rows. */
export function headline(facts) {
  const clients = clientsIn(facts);
  const inOnboarding = clients.filter((c) => c.onboardingDays != null);
  const cycle = inOnboarding.length
    ? Math.round(inOnboarding.reduce((s, c) => s + c.onboardingDays, 0) / inOnboarding.length)
    : 0;
  return {
    clients: clients.length,
    inOnboarding: inOnboarding.length,
    cycleDays: cycle,
    slaBreaches: clients.filter((c) => c.slaBreach).length,
    overdue: clients.filter((c) => c.overdue).length,
    dueSoon: clients.filter((c) => c.dueSoon).length,
    openAlerts: clients.reduce((s, c) => s + c.openAlerts, 0),
    highAlerts: clients.reduce((s, c) => s + c.highAlerts, 0),
    clearToTrade: clients.filter((c) => c.clearToTrade).length,
    impaired: clients.filter((c) => c.rag === 'crit').length,
    docsOutstanding: clients.reduce((s, c) => s + c.docs, 0),
    repeatOutreach: clients.filter((c) => c.outreach >= 3).length,
  };
}

/** Scale behind the named book, so the tiles carry the right order of size. */
export const FRANCHISE = {
  activeClients: 4812,
  casesYtd: 9140,
  alertsScreenedYtd: 1.24,   // millions
  namedShare: 0.19,
};

/**
 * Onboarding funnel, current cases across the whole franchise. Ordered by
 * stage, so the drop between stages is the thing worth reading.
 */
export const FUNNEL = [
  { stage: 'Request raised', cases: 412, medianDays: 2 },
  { stage: 'KYC pack issued', cases: 366, medianDays: 9 },
  { stage: 'Documents received', cases: 281, medianDays: 24 },
  { stage: 'Screening cleared', cases: 244, medianDays: 31 },
  { stage: 'Credit and legal', cases: 198, medianDays: 39 },
  { stage: 'Activated', cases: 174, medianDays: 47 },
];

/** Open work by queue, with ageing against SLA. */
export const QUEUES = [
  { id: 'onboarding', open: 412, breached: 61, oldestDays: 118, medianDays: 27, trend: 4.2 },
  { id: 'pr', open: 289, breached: 38, oldestDays: 73, medianDays: 16, trend: -2.8 },
  { id: 'edd', open: 47, breached: 9, oldestDays: 31, medianDays: 6, trend: 11.4 },
  { id: 'screening', open: 168, breached: 22, oldestDays: 31, medianDays: 3, trend: -6.1 },
];

/** Screening alert mix, currently open across the franchise. */
export const ALERT_MIX = [
  { label: 'Adverse media', value: 74, color: 'var(--t-2)' },
  { label: 'PEP', value: 41, color: 'var(--t-6)' },
  { label: 'Sanctions', value: 23, color: 'var(--c-crit)' },
  { label: 'Ownership change', value: 19, color: 'var(--t-1)' },
  { label: 'Jurisdiction', value: 11, color: 'var(--t-4)' },
];

/**
 * 12 months of case volume by queue. Emergency reviews climbing while periodic
 * reviews fall is the pattern that matters: unplanned work displacing planned
 * work is what pushes files past their due date in the first place.
 */
export const CASE_TREND = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  series: {
    onboarding: [324, 341, 298, 356, 372, 389, 378, 396, 402, 408, 411, 412],
    pr: [412, 398, 366, 381, 374, 358, 344, 331, 318, 302, 294, 289],
    edd: [18, 21, 19, 24, 27, 29, 31, 34, 38, 41, 44, 47],
    screening: [244, 231, 218, 226, 219, 208, 196, 188, 181, 174, 170, 168],
  },
};
