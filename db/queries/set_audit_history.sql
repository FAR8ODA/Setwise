-- The audit trigger from 0006_audit_log.sql writes here on every INSERT,
-- UPDATE, and DELETE against sets. Nothing in the application had to
-- remember to call this; it's just there.
-- $1 = set_id

SELECT action, changed_at, old_data, new_data
FROM set_audit_log
WHERE set_id = $1
ORDER BY changed_at DESC;
