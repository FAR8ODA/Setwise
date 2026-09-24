import { test } from "node:test";
import assert from "node:assert/strict";
import { pool } from "./db-helper.ts";

test("identical key", async () => {
  const { rows } = await pool.query("SELECT camelot_relation('8A','8A') AS r");
  assert.equal(rows[0].r, "identical");
});

test("adjacent key, one step up the wheel", async () => {
  const { rows } = await pool.query("SELECT camelot_relation('8A','9A') AS r");
  assert.equal(rows[0].r, "adjacent");
});

test("the wheel wraps from 12 back to 1", async () => {
  const { rows } = await pool.query("SELECT camelot_relation('12A','1A') AS r");
  assert.equal(rows[0].r, "adjacent");
});

test("relative major/minor, same number", async () => {
  const { rows } = await pool.query("SELECT camelot_relation('8A','8B') AS r");
  assert.equal(rows[0].r, "relative");
});

test("energy boost is a two-step jump on the same ring", async () => {
  const { rows } = await pool.query("SELECT camelot_relation('8A','10A') AS r");
  assert.equal(rows[0].r, "energy_boost");
});

test("distant keys clash", async () => {
  const { rows } = await pool.query("SELECT camelot_relation('8A','3A') AS r");
  assert.equal(rows[0].r, "clash");
});

test("bpm within tolerance is compatible", async () => {
  const { rows } = await pool.query("SELECT bpm_compatible(124, 126) AS ok");
  assert.equal(rows[0].ok, true);
});

test("bpm far apart is not compatible", async () => {
  const { rows } = await pool.query("SELECT bpm_compatible(124, 172) AS ok");
  assert.equal(rows[0].ok, false);
});

test("double-time bpm is compatible", async () => {
  const { rows } = await pool.query("SELECT bpm_compatible(87, 174) AS ok");
  assert.equal(rows[0].ok, true);
});

test.after(() => pool.end());
