# Tests

Integration tests, run with `npm test`. They hit a real PostgreSQL instance
at `DATABASE_URL` rather than mocking anything: migrations must already be
applied (`npm run db:migrate`), and a few tests additionally expect seed
data to be loaded (`npm run db:seed`) since they check invariants over the
real compatibility graph.

Tests that write data (`exclusion-constraint`, `relational-division`,
`audit-trigger`) create their own fixtures inside a transaction and always
roll it back, so they never touch or depend on the seeded catalog and leave
no trace behind.
