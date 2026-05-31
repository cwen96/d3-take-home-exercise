// Mock persistence layer.
//
// `AlertRepository` is the seam between the app and storage. Today it is an
// in-memory Map; for production you swap in a Postgres/SQL-backed
// implementation of the SAME interface and the API routes do not change.
// See /backend for the SQL schema + update query that the real
// `updateStatus` would run.

import type {Alert, Status} from './types';

export interface AlertRepository {
  getAll(): Alert[];
  updateStatus(id: string, status: Status): Alert | undefined;
  replaceAll(alerts: Alert[]): void;
}

class InMemoryAlertRepository implements AlertRepository {
  private alerts = new Map<string, Alert>();

  getAll(): Alert[] {
    return [...this.alerts.values()];
  }

  updateStatus(id: string, status: Status): Alert | undefined {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    // Setting a valid status also clears a prior "status" data-quality flag.
    const updated: Alert = {
      ...existing,
      status,
      invalidFields: existing.invalidFields.filter(f => f !== 'status'),
    };
    this.alerts.set(id, updated);
    return updated;
  }

  replaceAll(alerts: Alert[]): void {
    this.alerts.clear();
    for (const a of alerts) this.alerts.set(a.id, a);
  }
}

// Persist a single instance across hot-reloads / route invocations in dev.
// (Next.js re-evaluates modules on HMR; a module-level singleton would reset.)
const globalForDb = globalThis as unknown as {__alertRepo?: AlertRepository};

export const alertRepo: AlertRepository =
  globalForDb.__alertRepo ?? new InMemoryAlertRepository();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__alertRepo = alertRepo;
}
