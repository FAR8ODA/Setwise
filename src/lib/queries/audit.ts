import { pool } from "@/lib/db";
import { RECENT_AUDIT_ACTIVITY_SQL, SET_AUDIT_HISTORY_SQL } from "./sql.generated";

export type AuditEntry = {
  action: "INSERT" | "UPDATE" | "DELETE";
  changedAt: string;
  oldData: unknown;
  newData: unknown;
};

export async function auditHistoryForSet(setId: number): Promise<AuditEntry[]> {
  const { rows } = await pool.query(SET_AUDIT_HISTORY_SQL, [setId]);
  return rows.map((r) => ({
    action: r.action,
    changedAt: r.changed_at,
    oldData: r.old_data,
    newData: r.new_data,
  }));
}

export type RecentAuditRow = {
  auditId: number;
  setId: number;
  setName: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  changedAt: string;
};

export async function recentAuditActivity(): Promise<RecentAuditRow[]> {
  const { rows } = await pool.query(RECENT_AUDIT_ACTIVITY_SQL);
  return rows.map((r) => ({
    auditId: r.audit_id,
    setId: r.set_id,
    setName: r.set_name,
    action: r.action,
    changedAt: r.changed_at,
  }));
}
