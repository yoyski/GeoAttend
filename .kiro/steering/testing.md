---
inclusion: fileMatch
fileMatchPattern: "**/*.test.*"
---

# Testing guidelines

**Current state:** Minimal testing. Only server utils have tests (haversine, hash, csv) using Node's built-in `--test` runner.

## What needs tests (not yet implemented)
- Every business rule in `location-and-checkin-rules.md`: out-of-radius, weak GPS, wrong passcode, email not listed, closed session, duplicate check-in, late flag, locked edits.
- Visibility aggregation with documents just inside and just outside a radius (e.g. 99m vs 101m).
- Authorization: a user must get 404 on another creator's session.
- Client check-in flow states (permission, outside, inside, success, duplicate, error) with mocked API responses.

## Testing approach (when implemented)
- **Server:** Use Vitest or keep Node's `--test` runner. Add Supertest for integration tests. Use `mongodb-memory-server` for a real Mongo instance in tests. No shared state between tests.
- **Client:** Vitest + React Testing Library. Mock API responses. No snapshot tests for large layouts; assert on roles and text.
- Run tests in CI before merging.

## Running tests
`npm test` (server, runs utils tests only). Client tests not yet configured.
