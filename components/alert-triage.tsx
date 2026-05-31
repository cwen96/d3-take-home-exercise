'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {X} from 'lucide-react';
import {UploadDropzone} from './upload-dropzone';
import {ThemeToggle} from './theme-toggle';
import {AlertToolbar} from './alert-toolbar';
import {AlertTable} from './alert-table';
import {AlertDetail} from './alert-detail';
import {ErrorToast} from './error-toast';
import {fetchAlerts, ingestAlerts, patchAlertStatus} from '@/lib/api';
import {
  parseAlerts,
  STATUS_LABELS,
  type Alert,
  type AlertField,
  type Status,
} from '@/lib/types';
import {
  DEFAULT_FILTERS,
  filterAlerts,
  sortAlerts,
  uniqueSources,
  type FilterState,
  type SortDir,
  type SortKey,
} from '@/lib/filters';

export function AlertTriage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUpload, setBusyUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [issuesDismissed, setIssuesDismissed] = useState(false);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('severity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load whatever is already in the mock DB (empty on a fresh server).
  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch(() => {
        /* fresh store; stays empty until an upload */
      })
      .finally(() => setLoading(false));
  }, []);

  const sources = useMemo(() => uniqueSources(alerts), [alerts]);
  const issuesCount = useMemo(
    () => alerts.filter(a => a.invalidFields.length > 0).length,
    [alerts]
  );
  const visible = useMemo(
    () => sortAlerts(filterAlerts(alerts, filters), sortKey, sortDir),
    [alerts, filters, sortKey, sortDir]
  );
  const selected = useMemo(
    () => alerts.find(a => a.id === selectedId) ?? null,
    [alerts, selectedId]
  );

  // Mutate an alert's status and keep its "status" data-quality flag in sync.
  const applyStatus = useCallback((id: string, status: Status | null) => {
    setAlerts(list =>
      list.map(a => {
        if (a.id !== id) return a;
        const invalidFields =
          status === null
            ? Array.from(new Set([...a.invalidFields, 'status' as AlertField]))
            : a.invalidFields.filter(f => f !== 'status');
        return {...a, status, invalidFields};
      })
    );
  }, []);

  async function handleFile(file: File) {
    setUploadError(null);
    setBusyUpload(true);
    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      // Only structural problems are fatal; per-field issues load anyway.
      const result = parseAlerts(json);
      if (!result.ok) throw new Error(result.error);

      await ingestAlerts(json); // server re-parses leniently as source of truth
      const fresh = await fetchAlerts();
      setAlerts(fresh);
      setSelectedId(null);
      setFilters(DEFAULT_FILTERS);
      setIssuesDismissed(false);
      setUpdateError(null);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusyUpload(false);
    }
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Severity and age read most naturally high-to-low first.
      setSortDir(key === 'severity' || key === 'createdAt' ? 'desc' : 'asc');
    }
  }

  // Optimistic status change: apply immediately so triage feels instant, then
  // confirm with the server. On failure, roll back AND surface a visible error
  // so the analyst never believes a change stuck when it didn't.
  async function handleChangeStatus(id: string, next: Status) {
    const current = alerts.find(a => a.id === id);
    if (!current || current.status === next) return;
    const prev = current.status;

    applyStatus(id, next);
    setUpdateError(null); // clear any prior failure on a fresh attempt
    try {
      await patchAlertStatus(id, next);
    } catch {
      applyStatus(id, prev);
      setUpdateError(
        `Couldn't save ${id} as “${STATUS_LABELS[next]}”. ` +
          `Change reverted — please try again.`
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b px-6 py-3">
        <ThemeToggle />
        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold">Alert Triage</h1>
          <p className="text-xs text-muted-foreground">
            {alerts.length > 0
              ? `${alerts.length} alerts loaded`
              : 'Upload a JSON file to begin'}
          </p>
        </div>
        {/* Spacer balances the toggle so the title is truly centered. */}
        <div className="size-8 shrink-0" aria-hidden />
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            <UploadDropzone onFile={handleFile} busy={busyUpload} />
            {uploadError && (
              <p className="mt-3 text-center text-sm text-destructive">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <AlertToolbar
            filters={filters}
            onChange={patch => setFilters(f => ({...f, ...patch}))}
            sources={sources}
            shown={visible.length}
            total={alerts.length}
            issuesCount={issuesCount}
            onFile={handleFile}
            busy={busyUpload}
          />
          {uploadError && (
            <div className="border-b bg-destructive/5 px-6 py-2 text-sm text-destructive">
              {uploadError}
            </div>
          )}
          {!issuesDismissed && issuesCount > 0 && (
            <div className="flex items-center justify-between gap-3 border-b bg-amber-50 px-6 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <span>
                {`${issuesCount} of ${alerts.length} alerts have missing or ` +
                  `invalid fields, highlighted in red. ` +
                  `Use “Issues only” to review.`}
              </span>
              <button
                type="button"
                onClick={() => setIssuesDismissed(true)}
                aria-label="Dismiss"
                className="shrink-0 text-amber-700/70 hover:text-amber-900 dark:text-amber-300/70 dark:hover:text-amber-200"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">
              <AlertTable
                alerts={visible}
                selectedId={selectedId}
                onSelect={a => setSelectedId(a.id)}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
            </div>
            <aside className="w-[360px] shrink-0 overflow-auto border-l">
              <AlertDetail
                alert={selected}
                onChangeStatus={handleChangeStatus}
              />
            </aside>
          </div>
        </>
      )}

      {updateError && (
        <ErrorToast
          message={updateError}
          onDismiss={() => setUpdateError(null)}
        />
      )}
    </div>
  );
}
