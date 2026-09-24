import { test } from "node:test";
import assert from "node:assert/strict";
import { pool, withRollback } from "./db-helper.ts";

test("insert, update, and delete on sets are all captured with old/new JSONB", async () => {
  await withRollback(async (client) => {
    const created = await client.query(
      "INSERT INTO sets (dj_name, set_name) VALUES ('Fixture DJ', 'Original Name') RETURNING set_id",
    );
    const setId = created.rows[0].set_id;

    await client.query("UPDATE sets SET set_name = 'Renamed' WHERE set_id = $1", [setId]);
    await client.query("DELETE FROM sets WHERE set_id = $1", [setId]);

    const { rows } = await client.query(
      "SELECT action, old_data, new_data FROM set_audit_log WHERE set_id = $1 ORDER BY audit_id",
      [setId],
    );

    assert.equal(rows.length, 3);
    assert.equal(rows[0].action, "INSERT");
    assert.equal(rows[0].new_data.set_name, "Original Name");
    assert.equal(rows[1].action, "UPDATE");
    assert.equal(rows[1].old_data.set_name, "Original Name");
    assert.equal(rows[1].new_data.set_name, "Renamed");
    assert.equal(rows[2].action, "DELETE");
    assert.equal(rows[2].old_data.set_name, "Renamed");
  });
});

test.after(() => pool.end());
