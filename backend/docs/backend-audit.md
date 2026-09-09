# Phase 13 backend audit

## Continuation record (2026-09-09)

The initial working tree already contained capacity-based dispatch, explicit driver
pause semantics, shared resource writes, protected-field validators, transactional
workflow/history/proof updates, route restrictions, audit docs, and five passing
database-free test groups. Those changes were preserved. HEAD mostly contains
placeholders, so Git cannot precisely attribute existing implementation to Phase 13
versus Phases 1-12; this record distinguishes the state found from this continuation.

This continuation corrected known shipment-state jumps being rejected as 400 before
the workflow's 409 conflict check, normalized unexpected errors to SERVER_ERROR even
when a controller supplied another code, and removed the obsolete report error code.
Terminal updates now save shipment/history before checking other vehicle work, all
inside the same transaction. Dispatch explicitly excludes the proposed shipment
from active weight. Importing server.js no longer connects/listens. Added npm test,
exact disk/Git import-casing checks, resource-ID checks, and validation/privacy
regressions. Authorization documentation now describes actual implemented endpoints.

## Architecture and completed module checklist

server.js contains environment loading, middleware, route mounting, errors, and
startup only. Routes apply authentication, role policy, and validators; controllers
handle HTTP/ownership and orchestration; services own pricing, dispatch, and shipment
workflow. Mongoose models store records and declare indexes; MongoDB supplies
transactional persistence. No new product module was added.

- [x] Foundation, six models, JWT authentication, explicit RBAC
- [x] Vehicle management and bidirectional driver profile linkage
- [x] Shipment pricing/booking and initial history
- [x] Capacity-based dispatch and shipment transitions
- [x] Delivery proof and customer tracking
- [x] Trip grouping independent of shipment progression
- [x] Fleet, driver, shipment, delivery, and trip reports
- [x] Phase 13 source audit, database-free verification, and runtime checklist

## Shipment workflow

BOOKED -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DELIVERED or FAILED.
Both final states are terminal. Dispatch alone performs BOOKED -> ASSIGNED.
Each successful transition inserts one history record in the same transaction;
rejected transitions commit neither state nor history. Unknown enum values are 400;
known states that violate the workflow are 409 after identity/ownership checks.
DELIVERED requires a trimmed receiver name of 2-100 characters; delivery notes are
optional. deliveryProof.deliveredAt is server-generated. FAILED creates no proof.
No proof edit/delete endpoint exists.

## Scope and findings

Reviewed server/config, all controllers, services, middleware, routes, models,
constants, token utility, and existing documentation. No frontend, credentials,
seed data, or Postman artifacts were added. No empty JavaScript placeholders remain.

Fixed the dispatch/trip incompatibility, premature resource release, manual vehicle
status bypass, missing auth-body whitelists, bcrypt login truncation acceptance,
development error privacy, database error normalization, and ambiguous report
timestamp timezones. Removed the /api/test server mount; retained its documented
development reference source. Model filenames must be capitalized in Git as well
as on disk, matching imports on Linux.

## Operational workload policy

- One permanently linked driver/vehicle pair may carry multiple active shipments.
- Active means ASSIGNED, PICKED_UP, or IN_TRANSIT. Sum all active vehicle weights
  plus the proposed shipment; reject capacity overflow. Exact capacity is allowed.
- isAvailable is an explicit dispatcher-managed permission to accept more work.
  false pauses new dispatch; it does not prevent completing existing work.
  Neither dispatch nor completion changes that flag.
- Vehicle status is assigned while any active shipment remains, available after
  the last completion/failure. Permanent links and historical assignments remain.
- Reject active assignments spanning inconsistent driver/vehicle pairs.
- Generic vehicle CRUD cannot create assigned state or transition into/out of it.
  Shipment workflows own those transitions. Capacity/type cannot change while
  assigned. Link/unlink also checks active shipments, including stale flags.
- Available-driver results include eligible available/assigned vehicles and are
  advisory: dispatch rechecks remaining capacity transactionally.
- Trips can now group multiple simultaneously active shipments. Trips never drive
  shipment transitions or resource release.

Example: a 500 kg vehicle can accept 200 kg and 250 kg shipments. Another 60 kg
shipment is rejected. Completing the 200 kg shipment keeps the vehicle assigned;
finishing the remaining work makes it available. An explicit driver pause survives.

## Transactions and concurrency

Mongoose connection.transaction manages session cleanup, commit, abort, and retries
for linking, booking/history, dispatch, status/proof, and trip operations. All
workflow reads/writes use the callback session; writes are sequential.

Dispatch increments Driver/Vehicle __v and terminal completion increments Vehicle
__v even when status is unchanged. These real shared writes prevent independent
capacity checks or terminal releases from both committing stale vehicle snapshots.
They do not add a trip reference to Shipment. Snapshot validation and the Trip
partial unique multikey index protect live trip membership; index creation must
succeed before accepting traffic. No database race tests have been claimed here.

## Route and access inventory

All groups except health and register/login authenticate before authorization.
Literal routes precede generic IDs; segment-specific paths are not shadowed.

| Group | Access |
| --- | --- |
| /api/health | Public health 200 |
| /api/auth | Public customer/driver registration and login; authenticated /me |
| /api/vehicles | Dispatcher/admin CRUD |
| /api/drivers | Driver /me/profile; dispatcher/admin management and /available |
| /api/shipments | Customer booking/estimate/my/track; driver driver/my and status; operations list/assign; shared history/proof with ownership |
| /api/trips | Driver /my; dispatcher/admin management |
| /api/admin/reports | Dispatcher/admin |
| /api/test | Not mounted; JSON 404 |

Customer identity always comes from req.user; driver identity is resolved through
Driver.userId. Customer ownership and driver assignment are checked before sensitive
history/proof reads or updates. Admin has no override on customer/driver-only routes.
Protected fields are rejected or explicitly excluded from writes. IDs and enum/query
values are validated. Password hashes are excluded from responses; tracking exposes
driver name and vehicle registration/type only.

## Errors, models, and reports

200 reads/updates, 201 creation, 400 malformed input, 401 authentication, 403 role
or ownership, 404 missing resource, 409 conflicts, 500 unexpected errors. Central
handler hides unexpected messages in all environments, maps database validation/
cast errors to safe 400 and duplicate keys to safe 409, and preserves explicit
business error codes. Invalid JSON and unknown routes remain JSON responses.

Reviewed existing unique and relation/status indexes. History's compound index
supports shipment-only lookup without a redundant index. Trip's partial unique
shipmentIds index prevents shared membership in planned/active trips. No extra
indexes added during this audit; deployment must verify all declared indexes.
Reports retain zero-safe formulas, booking-date filters, UTC date-only end bounds,
and the documented 48-hour academic SLA. Full report timestamps require a timezone.

## Repeatable checks

From backend run `npm test` (or `node --test tests/backend-audit.test.js`). Tests use real validation,
JWT utilities, pure formulas, imports, and HTTP requests without fake users/storage.
They boot an isolated server without MongoDB, verify route mounts/no-token behavior,
health, JSON errors, transition maps, and protected-field validation. They do not
prove database ownership, transaction behavior, aggregation execution, or index enforcement.

Continuation verification result: all 7 test groups passed on 2026-09-09 using
`npm.cmd test` on Windows (PowerShell blocks npm.ps1 under its existing execution
policy). No policy setting was changed. Both working-tree and staged diff whitespace
checks passed. Checks cover module imports/syntax, exact model/import casing,
malformed resource IDs, pricing (12 kg + 20 km = 350), every shipment/trip transition
pair, percentage/capacity boundaries, protected fields, JWT/error privacy, health
200, unknown/test routes JSON 404, malformed JSON 400, and protected routes 401
without tokens. No fake users, database substitutes, or seed records were created.

## File-casing portability and index inventory

At continuation start, Git already staged these five case-only renames:
driver.js -> Driver.js, shipment.js -> Shipment.js, trip.js -> Trip.js,
user.js -> User.js, vehicle.js -> Vehicle.js. StatusHistory.js was already correct.
The Git index and actual directory now both contain exactly Driver.js, Shipment.js,
StatusHistory.js, Trip.js, User.js, Vehicle.js. All model imports match. No further
rename was necessary; existing staged renames were preserved without a commit.
The regression suite checks disk filenames, Git index names, and relative imports.

| Model | Declared indexes (besides MongoDB _id) |
| --- | --- |
| User | unique email |
| Vehicle | unique registrationNumber; status; currentDriverId |
| Driver | unique userId; unique licenseNumber; vehicleId; isAvailable |
| Shipment | customerId; status; assignedDriverId; assignedVehicleId |
| StatusHistory | shipmentId + timestamp (also serves shipmentId prefix queries) |
| Trip | driverId; vehicleId; date; unique shipmentIds filtered to planned/active |

No redundant shipmentId-only history index is needed. Trip status uses the existing
live-membership partial index; additional report indexes should follow measured query
plans. Actual index deployment/enforcement remains a MongoDB acceptance check.

Transaction lifecycle was checked against installed Mongoose connection.transaction
and MongoDB driver withTransaction source: startSession, startTransaction, commit,
abort on failure, retries, and endSession are managed by these helpers. No manual
session lifecycle or transactions on simple reads were introduced.

## Manual MongoDB acceptance checklist

Use a transaction-capable MongoDB Atlas/replica-set deployment. Verify partial-index
support and build indexes before tests; resolve existing conflicting records manually.
Provision dispatcher/admin accounts securely outside public registration.

- [ ] Auth: register customer/driver; reject admin/dispatcher and protected fields;
  duplicate email 409; login/wrong password; inactive account; expired JWT; /me.
- [ ] Vehicles: create, duplicate registration, edit, invalid transitions, active
  capacity/type rejection, assigned-state CRUD rejection, deactivation conflicts.
- [ ] Drivers: create profile, reject non-driver, duplicate profile/license, link/
  unlink, competing links, stale-flag active-link rejection, own-profile enforcement.
- [ ] Shipments: estimate/book with initial history, reject forged ownership/cost,
  cross-customer reads, dispatch capacity and inactive/mismatched resources.
- [ ] Multi-shipment: dispatch two shipments to one pair; exact-capacity acceptance,
  overflow rejection; pause/resume driver; reject workloads on another pair.
- [ ] Workflow: valid progression, invalid jumps, driver A versus B, timestamped
  single history entries, delivery receiver required, immutable proof, failed/no proof.
- [ ] Release: first completion keeps vehicle assigned; last completion releases;
  driver pause survives both; missing assigned vehicle gives controlled error.
- [ ] Tracking: own BOOKED/active/DELIVERED/FAILED timelines; chronological ordering;
  unrelated customer/driver denied proof/history; no private driver data exposed.
- [ ] Trips: multi-shipment grouping, duplicate array/membership rejection including
  concurrent creates, planned/active lifecycle, all-terminal completion, no side effects.
- [ ] Reports: populated counts, empty collections, date/timezone boundaries, SLA
  and duration examples, missing proof timestamps, customer/driver rejection.
- [ ] Concurrency: two dispatches competing for remaining capacity; two terminal
  updates; dispatch versus terminal release; repeated same-shipment transitions;
  vehicle edits/link changes versus dispatch; injected history-write failure rollback.
- [ ] Rollback: inject failure between driver/vehicle link and unlink writes,
  booking/history writes, dispatch/history/resource writes, and terminal proof/history/
  vehicle writes. Verify all related records remain unchanged and retries create no
  duplicate history; check session cleanup after success and failure.
- [ ] Errors: valid nonexistent IDs return 404; malformed IDs 400; missing/invalid
  authentication 401; wrong role/ownership 403; business conflicts 409; duplicate
  email/registration/profile/license races 409 without MongoDB details.

## Remaining limitations

MongoDB has not been configured/tested here; unavailable DB is an error, not empty
data. Health measures process availability, not DB readiness. Existing Phase 1
startup permits missing/failed DB configuration. List endpoints are unpaginated;
reports/history are separate reads and may reflect adjacent committed snapshots.
Trip creation validates eligibility at transaction snapshot time without locking
shipment documents; shipment progression remains independent. No arbitrary status
repair or migration API is added. Existing pre-audit driver flags/vehicle states
need manual review: false may represent the old busy flag or a deliberate pause;
the audit does not guess or rewrite stored data. Old delivered shipments without
proof remain readable and return DELIVERY_PROOF_NOT_FOUND on proof access.
