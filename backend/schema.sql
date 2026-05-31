-- SQL schema backing the alert triage view.
-- Two tables: the alerts themselves, and an append-only audit trail of every
-- status change. This is the real-world equivalent of the in-memory
-- `AlertRepository` in lib/db.ts.

CREATE TABLE alerts (
    id                TEXT        PRIMARY KEY,
    title             TEXT        NOT NULL,
    severity          TEXT        NOT NULL
                          -- this is dependent on what the actual severity is, but assuming it's one of the 4 here
                          CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status            TEXT        NOT NULL
                          -- again, dependent on what the actual status flow is, but assuming it's one of the 4 here
                          CHECK (status IN ('new', 'in_progress', 'resolved', 'dismissed')),
    source            TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL,
    assignee          TEXT,                              -- nullable: unassigned

    -- bookkeeping
    status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes to support the list view's filter + sort without table scans.
CREATE INDEX idx_alerts_status     ON alerts (status);
CREATE INDEX idx_alerts_severity   ON alerts (severity);
CREATE INDEX idx_alerts_source     ON alerts (source);
CREATE INDEX idx_alerts_created_at ON alerts (created_at DESC);

-- Immutable, append-only history. One row per status change: who changed what,
-- when, and from/to. Drives accountability and "why is this resolved?" lookups.
CREATE TABLE alert_status_history (
    txid        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    alert_id    TEXT        NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    from_status TEXT,                                    -- null for the initial state
    to_status   TEXT        NOT NULL,
    changed_by  TEXT        NOT NULL,                    -- authenticated analyst, not client-supplied
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_alert ON alert_status_history (alert_id, changed_at DESC);
