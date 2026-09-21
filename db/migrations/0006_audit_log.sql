-- An append-only history of every change to a set, kept without any
-- application code having to remember to write it. The trigger fires on
-- every INSERT, UPDATE, and DELETE and stores the whole row as JSONB.

CREATE TABLE set_audit_log (
    audit_id    bigserial PRIMARY KEY,
    set_id      integer NOT NULL,
    action      text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_at  timestamptz NOT NULL DEFAULT now(),
    old_data    jsonb,
    new_data    jsonb
);

CREATE INDEX idx_set_audit_log_set ON set_audit_log (set_id, changed_at DESC);

CREATE OR REPLACE FUNCTION audit_sets_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO set_audit_log (set_id, action, old_data)
        VALUES (OLD.set_id, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO set_audit_log (set_id, action, old_data, new_data)
        VALUES (NEW.set_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSE
        INSERT INTO set_audit_log (set_id, action, new_data)
        VALUES (NEW.set_id, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_audit_sets
AFTER INSERT OR UPDATE OR DELETE ON sets
FOR EACH ROW
EXECUTE FUNCTION audit_sets_change();
