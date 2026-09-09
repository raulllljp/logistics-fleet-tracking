# Phase 15.5 - Backend Contract Repair

Completed 2026-09-09. API Contract v1 remains unchanged; Phase 16 was not started.

## Conflict decisions

Eight source files contained unresolved merge conflicts. Each older implementation
was compared with v1 and the Phase 13/14 architecture. The existing HEAD versions
of these specific files match that architecture and were restored after review:

| File | Preserved contract behavior |
| --- | --- |
| config/db.js | Missing MONGO_URI skips connection; existing failed-connection fallback retained |
| controllers/authController.js | Public user projection, data.user/data.token envelope, restricted registration, active-account checks, shared JWT utility and getMe |
| middleware/authMiddleware.js | HS256 verification, current active database user and role, safe 401 responses |
| routes/authRoutes.js | Body validators and authenticated GET /me |
| controllers/vehicleController.js | Registration/filter fields, nested response data, protected update fields, workflow guards, soft deactivation |
| routes/vehicleRoutes.js | Dispatcher/admin authorization and request/ID validation |
| models/StatusHistory.js | Canonical shipment states, location/updatedBy and compound history index |
| server.js | Configured CORS, health route, six router mounts, centralized errors and import-safe startup |

Server repair also removed merge leftovers outside conflict blocks: duplicate route
mounts, eager database connection, alternate root health route and incompatible
duplicate /auth/me handler. The temporary test router remains unmounted.

## Model repairs

The five other models were restored from their reviewed contract-compatible HEAD
versions, retaining their established relationships and indexes:

- User: isActive, private passwordHash selection, email validation and timestamps.
- Vehicle: unique registrationNumber, canonical types and inactive status,
  strictly positive finite capacity and relationship/status indexes.
- Driver: unique userId/licenseNumber, phone and availability/link indexes.
- Shipment: weight, distance, assignedVehicleId, estimatedCost, optional embedded
  proof, bookedAt, and indexes. Removed obsolete cost. Restored uppercase shipment
  statuses, including PICKED_UP and IN_TRANSIT.
- Trip: vehicleId, canonical status/default, date default, nonempty/distinct
  shipment IDs and the unique live-trip membership index.

StatusHistory now uses the same uppercase enum as Shipment. Controller/service
field references, projections, aggregations and validators agree with these schemas.
Trip and vehicle status values retain their documented lowercase forms.

## Git and environment

Git initially tracked both uppercase and lowercase paths for five models, while
Windows exposed lowercase physical names. Removed only the duplicate lowercase
index entries, preserving the already tracked uppercase entries. Renamed physical
files through temporary names. Disk and Git now contain exactly Driver.js,
Shipment.js, StatusHistory.js, Trip.js, User.js and Vehicle.js; all imports match.

Replaced a pre-existing credential-like MONGO_URI example with the original generic
placeholder, including in the index. Real .env files were not modified. If that
value was a real credential, rotate it separately; replacing an example does not
revoke credentials or remove prior exposure.

Previously staged conflicting files were updated to their repaired content. Since
the repaired runtime files match HEAD, their diffs disappear; that is intentional.
No commit was created. Frontend files, including the existing README change, were
left untouched. No packages, credentials, accounts, seed data, database substitutes
or JWT bypasses were added.

## Verification

- Backend npm.cmd test: 14/14 groups passed, including two new schema regressions
  in tests/model-contract.test.js.
- All source modules pass syntax/import checks without a database.
- No conflict markers remain in backend JavaScript.
- Actual child-process startup with empty MONGO_URI succeeds. The test supplies
  an ephemeral JWT test secret and never connects to MongoDB.
- GET /api/health returns 200; unknown/test routes return JSON 404; protected
  endpoints without tokens return 401; malformed JSON returns 400.
- All 38 application endpoints match the frozen contract, including health.
- Unchanged frontend foundation tests pass 6/6 groups, covering all 37 non-health
  wrappers, enum agreement, interceptors and session behavior.
- Existing CORS/preflight, validator, workflow, privacy and casing checks pass.

The backend is structurally ready for Phase 16 development. Live authentication,
CRUD, ownership, aggregation, transactions, rollback, concurrency and actual index
enforcement still require a transaction-capable MongoDB deployment and the manual
acceptance checklist in backend-audit.md. Health is process availability, not
database readiness. No stored-data migration or live database success is claimed.
