// Domain model for security alerts + lenient runtime validation.
//
// Ingest is forgiving: a file with missing/invalid fields still loads. Each
// alert records which fields were unparseable in `invalidFields` so the UI can
// warn, highlight them red, and let the analyst filter to just the bad rows.
// The validator is shared by the upload flow (client) and the ingest API
// (server), so both compute identical results.

export const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const STATUSES = [
  'new',
  'in_progress',
  'resolved',
  'dismissed',
] as const;
export type Status = (typeof STATUSES)[number];

export type AlertField =
  | 'id'
  | 'title'
  | 'severity'
  | 'status'
  | 'source'
  | 'createdAt'
  | 'assignee';

export interface Alert {
  id: string; // always present (a fallback is synthesised if missing)
  title: string | null;
  severity: Severity | null;
  status: Status | null;
  source: string | null;
  createdAt: string | null; // ISO 8601
  assignee: string | null; // null = legitimately unassigned (not an issue)
  // When `assignee` was present but the wrong type, the original value as text,
  // so the UI can show what was actually received instead of a misleading blank.
  // null whenever `assignee` is valid or legitimately absent.
  assigneeRaw: string | null;
  // Fields that were missing/invalid on ingest — drives red highlight + filtering.
  invalidFields: AlertField[];
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

// Higher = more severe. Used for sorting.
export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export function isSeverity(v: unknown): v is Severity {
  return typeof v === 'string' && (SEVERITIES as readonly string[]).includes(v);
}

export function isStatus(v: unknown): v is Status {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

export type ParseResult =
  | {ok: true; alerts: Alert[]}
  | {ok: false; error: string};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Leniently coerce parsed JSON into Alert[]. Only structural problems
 * (not an array, empty) are fatal; per-field problems are recorded on each
 * alert and summarised, never thrown.
 */
export function parseAlerts(input: unknown): ParseResult {
  if (!Array.isArray(input)) {
    return {ok: false, error: 'Expected a JSON array of alerts.'};
  }
  if (input.length === 0) {
    return {ok: false, error: 'File contains no alerts.'};
  }

  const alerts: Alert[] = [];
  const usedIds = new Set<string>();

  input.forEach((raw, i) => {
    const r =
      typeof raw === 'object' && raw !== null
        ? (raw as Record<string, unknown>)
        : {};
    const invalid: AlertField[] = [];

    // id is the primary key. Synthesise a unique fallback when missing or
    // duplicated, and flag it so the analyst can see it was generated.
    let id: string;
    if (isNonEmptyString(r.id) && !usedIds.has(r.id)) {
      id = r.id;
    } else {
      id = isNonEmptyString(r.id) ? `${r.id}-dup-${i + 1}` : `row-${i + 1}`;
      invalid.push('id');
    }
    usedIds.add(id);

    const title = isNonEmptyString(r.title) ? r.title : null;
    if (title === null) invalid.push('title');

    const severity = isSeverity(r.severity) ? r.severity : null;
    if (severity === null) invalid.push('severity');

    const status = isStatus(r.status) ? r.status : null;
    if (status === null) invalid.push('status');

    const source = isNonEmptyString(r.source) ? r.source : null;
    if (source === null) invalid.push('source');

    const createdAt =
      typeof r.createdAt === 'string' && !Number.isNaN(Date.parse(r.createdAt))
        ? r.createdAt
        : null;
    if (createdAt === null) invalid.push('createdAt');

    // assignee: null/missing is a legitimate "unassigned" state, not an issue.
    // Only a present-but-wrong-type value counts as invalid. Unlike every other
    // field, null is valid here, so we keep the original bad value in
    // `assigneeRaw` — otherwise an invalid assignee would render identically to a
    // legitimate "Unassigned" and its red flag would look unexplained.
    let assignee: string | null = null;
    let assigneeRaw: string | null = null;
    if (typeof r.assignee === 'string') {
      assignee = r.assignee;
    } else if (r.assignee != null) {
      assigneeRaw = JSON.stringify(r.assignee);
      invalid.push('assignee');
    }

    alerts.push({
      id,
      title,
      severity,
      status,
      source,
      createdAt,
      assignee,
      assigneeRaw,
      invalidFields: invalid,
    });
  });

  return {ok: true, alerts};
}
