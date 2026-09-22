-- The most recent entries the audit trigger has written, across every set,
-- newest first. Demonstrates that the log fills itself in: nothing in the
-- application code ever inserts into set_audit_log directly.

SELECT
    l.audit_id,
    l.set_id,
    coalesce(l.new_data->>'set_name', l.old_data->>'set_name') AS set_name,
    l.action,
    l.changed_at
FROM set_audit_log l
ORDER BY l.changed_at DESC, l.audit_id DESC
LIMIT 8;
