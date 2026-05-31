-- Updates an alert's status and appends to alert history table.
--
-- Parameters:
--   :alert_id    target alert
--   :new_status  requested status
--   :changed_by  analyst id

BEGIN;

INSERT INTO alert_status_history (alert_id, from_status, to_status, changed_by)
SELECT id, status, :new_status, :changed_by
FROM alerts
WHERE id = :alert_id;

UPDATE alerts
SET status            = :new_status,
    status_updated_at = now()
WHERE id = :alert_id;

COMMIT;
