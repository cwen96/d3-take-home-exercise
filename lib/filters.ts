// Pure filter / sort / search helpers over the in-memory alert array.
// Kept side-effect free so they are trivial to reason about and test.

import type {Alert, Severity, Status} from './types';
import {SEVERITY_ORDER} from './types';

export interface FilterState {
  search: string;
  severity: Severity | 'all';
  status: Status | 'all';
  source: string | 'all';
  issuesOnly: boolean; // show only rows with missing/invalid fields
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  severity: 'all',
  status: 'all',
  source: 'all',
  issuesOnly: false,
};

export type SortKey =
  | 'id'
  | 'title'
  | 'severity'
  | 'status'
  | 'source'
  | 'createdAt'
  | 'assignee';
export type SortDir = 'asc' | 'desc';

export function filterAlerts(alerts: Alert[], f: FilterState): Alert[] {
  const q = f.search.trim().toLowerCase();
  return alerts.filter(a => {
    if (f.issuesOnly && a.invalidFields.length === 0) return false;
    if (f.severity !== 'all' && a.severity !== f.severity) return false;
    if (f.status !== 'all' && a.status !== f.status) return false;
    if (f.source !== 'all' && a.source !== f.source) return false;
    if (q) {
      const haystack =
        `${a.title ?? ''} ${a.id} ${a.assignee ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function sortAlerts(alerts: Alert[], key: SortKey, dir: SortDir): Alert[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...alerts].sort((a, b) => mul * compare(a, b, key));
}

function compare(a: Alert, b: Alert, key: SortKey): number {
  switch (key) {
    case 'severity': {
      const av = a.severity ? SEVERITY_ORDER[a.severity] : -1; // nulls sort lowest
      const bv = b.severity ? SEVERITY_ORDER[b.severity] : -1;
      return av - bv;
    }
    case 'createdAt': {
      const av = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bv = b.createdAt ? Date.parse(b.createdAt) : 0;
      return av - bv;
    }
    default: {
      const av = (a[key] ?? '').toString().toLowerCase();
      const bv = (b[key] ?? '').toString().toLowerCase();
      return av < bv ? -1 : av > bv ? 1 : 0;
    }
  }
}

export function uniqueSources(alerts: Alert[]): string[] {
  return [
    ...new Set(alerts.map(a => a.source).filter((s): s is string => !!s)),
  ].sort();
}
