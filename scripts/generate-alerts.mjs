// Generates ~200 realistic mock security alerts into /data/alerts.json.
// Run: node scripts/generate-alerts.mjs
// Deterministic-ish variety; output is sorted newest-first.

import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const COUNT = 200;
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const severities = ['critical', 'high', 'medium', 'low'];
const severityWeights = [0.12, 0.28, 0.4, 0.2];

const statuses = ['new', 'in_progress', 'resolved', 'dismissed'];
const statusWeights = [0.5, 0.2, 0.2, 0.1];

const sources = [
  'AWS GuardDuty',
  'CrowdStrike Falcon',
  'Microsoft Defender',
  'Okta',
  'Palo Alto Networks',
  'Splunk',
  'Suricata IDS',
  'SentinelOne',
  'Proofpoint',
  'Cloudflare WAF',
];

// Some alerts are intentionally unassigned (null).
const assignees = [
  'a.patel',
  'j.nguyen',
  'm.garcia',
  's.okoro',
  't.kim',
  'r.cohen',
  'l.dubois',
  null,
  null,
  null,
];

const hosts = [
  'WIN-DC01',
  'WEB-PROD-12',
  'HR-LAPTOP-77',
  'FIN-SRV-03',
  'K8S-NODE-9',
  'VPN-GW-1',
  'DB-PROD-2',
  'MAIL-01',
];

const users = ['jdoe', 'asmith', 'bwong', 'csilva', 'dmuller', 'ekhan'];

const titleTemplates = [
  h => `Suspicious PowerShell execution on ${h}`,
  (h, u) => `Impossible travel detected for ${u}`,
  (h, u) => `Multiple failed login attempts for ${u}`,
  h => `Malware detected on ${h}`,
  h => `Brute-force attack against SSH on ${h}`,
  h => `Outbound traffic to known C2 from ${h}`,
  (h, u) => `Privilege escalation attempt by ${u}`,
  h => `Unusual data egress from ${h}`,
  (h, u) => `Phishing email reported by ${u}`,
  h => `New admin account created on ${h}`,
  h => `Ransomware behavior detected on ${h}`,
  h => `Port scan detected from ${h}`,
  (h, u) => `MFA fatigue attack targeting ${u}`,
  h => `Endpoint protection disabled on ${h}`,
  (h, u) => `Anomalous API token usage by ${u}`,
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

const alerts = [];
for (let i = 0; i < COUNT; i++) {
  const host = rand(hosts);
  const user = rand(users);
  const template = rand(titleTemplates);
  // Weight createdAt toward the recent past; spread over ~30 days.
  const ageMs = Math.floor(Math.random() ** 1.6 * 30 * DAY);
  alerts.push({
    id: `ALERT-${pad(i + 1, 4)}`,
    title: template(host, user),
    severity: weighted(severities, severityWeights),
    status: weighted(statuses, statusWeights),
    source: rand(sources),
    createdAt: new Date(now - ageMs).toISOString(),
    assignee: rand(assignees),
  });
}

alerts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

mkdirSync(join(root, 'data'), {recursive: true});
writeFileSync(
  join(root, 'data', 'alerts.json'),
  JSON.stringify(alerts, null, 2) + '\n'
);
console.log(`Wrote ${alerts.length} alerts to data/alerts.json`);

// Also emit a copy with intentional data-quality problems to demo lenient
// ingest (warning banner, red cells, "Issues only" filter).
function corrupt(list) {
  const c = list.map(a => ({...a}));
  const set = (i, fn) => {
    if (c[i]) fn(c[i]);
  };
  set(5, a => (a.severity = null)); // null severity
  set(12, a => delete a.title); // missing title
  set(20, a => (a.status = 'unknown')); // invalid status enum
  set(28, a => (a.createdAt = null)); // null timestamp
  set(33, a => (a.createdAt = 'not-a-date')); // unparseable timestamp
  set(41, a => delete a.source); // missing source
  set(55, a => (a.assignee = 7)); // wrong-type assignee
  set(60, a => (a.severity = 'urgent')); // invalid severity enum
  set(77, a => delete a.id); // missing id (synthesised on ingest)
  if (c[88] && c[0]) c[88].id = c[0].id; // duplicate id
  set(91, a => (a.status = null)); // null status
  set(104, a => delete a.createdAt); // missing timestamp
  return c;
}

const messy = corrupt(alerts);
writeFileSync(
  join(root, 'data', 'alerts-with-issues.json'),
  JSON.stringify(messy, null, 2) + '\n'
);
console.log(
  `Wrote ${messy.length} alerts to data/alerts-with-issues.json (with ~12 intentional issues)`
);
