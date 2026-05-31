// Typed client-side wrappers around the mock API routes.

import type {Alert, Status} from './types';

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as {error?: string} | null;
  return data?.error ?? `Request failed (${res.status}).`;
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch('/api/alerts', {cache: 'no-store'});
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as {alerts: Alert[]};
  // Defensive: guarantee invalidFields is always an array for the UI.
  return data.alerts.map(a => ({...a, invalidFields: a.invalidFields ?? []}));
}

// Send the raw parsed JSON; the server is the authoritative (lenient) parser.
// The client refetches afterward, so the response body isn't consumed here.
export async function ingestAlerts(data: unknown): Promise<void> {
  const res = await fetch('/api/alerts', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function patchAlertStatus(id: string,status: Status): Promise<Alert> {
  const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({status}),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as {alert: Alert};
  return data.alert;
}
