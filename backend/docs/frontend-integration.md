# Frontend integration: API Contract v1

API Contract Version: v1. Phase 14 freezes the existing API paths and response
fields for frontend work. No URL version prefix was added. The authoritative
endpoint/request/response reference is [api-contract.md](api-contract.md);
canonical values and transition tables are in [enums.md](enums.md).

## HTTP and authentication

Local base URL: `http://localhost:5000/api`.

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

Use Content-Type for JSON bodies. Register/login return `data.token` and
`data.user` (`_id`, `name`, `email`, `role`). The frontend retains token and user
information for its authenticated session and sends Bearer on every protected
request. Storage implementation is deferred to frontend development; none was
implemented in this phase. Do not log the token or place it in URLs. Cookie
credentials are not needed for this Bearer API.

On session restoration, call GET `/auth/me` to obtain the current user and role;
that response also includes isActive. Backend authorization loads an active user
and uses the current database role, not a stale client role or decoded token claim.
Missing/invalid/expired JWTs and inactive/deleted accounts fail with UNAUTHORIZED.
On 401, clear the frontend session and return to login. On 403, show denied access;
it does not necessarily mean the token expired. On 409, show the conflict and reload
the relevant resource/queue before retrying. Handle 400 field validation separately
from missing records (404) and server failures (500). A CORS/network failure may
have no readable JSON response at all.

There is no token-refresh, logout, password-reset, account-edit, role-management,
or user-directory endpoint. Frontend logout clears its local session; it does not
revoke a token on the backend. JWT expiry defaults to 7d through JWT_EXPIRES_IN.
Never expose JWT_SECRET or MONGO_URI through frontend build environment variables.

## Role dashboards

All paths below are relative to the base URL. Operations means dispatcher/admin.
Use current `data.user.role` to select a dashboard; UI route guards complement,
but do not replace, backend authorization.

| Dashboard | Endpoints and flow |
| --- | --- |
| customer | Register/login/me; POST `/shipments/estimate`; POST `/shipments`; GET `/shipments/my`; GET `/shipments/:id`; GET `/shipments/:id/track`, `/history`, `/proof` for own shipments |
| driver | Register/login/me; GET `/drivers/me/profile`; GET `/shipments/driver/my`; PUT `/shipments/:id/status`; GET assigned `/history` and `/proof`; GET `/trips/my` |
| dispatcher | Login/me; vehicle CRUD; driver profile management/linkage/available list; GET `/shipments?status=BOOKED` or all shipments; PUT `/shipments/:id/assign`; shipment detail/history/proof; trip creation/list/detail/status; all `/admin/reports/*` endpoints |
| admin | Same implemented operational dashboard capabilities as dispatcher, including all reports; no bypass on customer-only booking/estimate/tracking or driver-only profile/status/my-trips routes |

Driver registration creates a User only. Operations must create the Driver profile
using that User ID before own-profile/workload endpoints can succeed. There is no
user-list API to populate a driver-account picker: the current profile creation
flow needs a known User ID. Dispatcher/admin accounts must already be securely
provisioned outside public registration; no provisioning API or seed data was added.
Driver profile IDs and User IDs are different resources; dispatch/trip requests use
Driver._id, while profile creation uses User._id.

## Request and response handling

- Build explicit request objects from allowed fields, never spread a fetched model
  into a body. IDs, ownership, computed price, operational status, proof timestamps,
  createdAt/updatedAt and __v are not generic editable fields.
- JSON numbers and booleans must be typed correctly. Convert form strings before
  sending weight/distance/capacity/isAvailable. Omit unused optional values; do not
  send empty strings or null for IDs, dates, booleans, or numbers.
- List data is under `data.vehicles`, `data.drivers`, `data.shipments`, or `data.trips`;
  `count` is at the root. Empty lists are arrays. No pagination is implemented.
- `message` is optional on success; do not require it to parse data. Vehicle DELETE
  is a 200 message-only deactivation response, not 204 and not a deleted document.
- Mutations usually return unpopulated references, while some reads return nested
  objects. The API contract enumerates these variants. Extract `_id` from populated
  objects for later requests, and handle nullable/missing references.
- Normal Shipment uses `status`; tracking uses `data.shipment.currentStatus`.
  Tracking history is `data.history`, and proof is `data.deliveryProof` or null.
  Ordinary delivered Shipment stores proof at `deliveryProof`, with deliveredAt
  inside that object. There is no top-level Shipment.deliveredAt.
- History is chronological and location is optional text. Render text as text,
  not HTML. Driver/vehicle display values can be null before assignment or if a
  reference is missing. No coordinates, map links, or live-position feed are supplied.
- Driver shipment detail and trip detail GETs are not driver-authorized. Use the
  driver's own list responses; history/proof and shipment status have their own routes.
- API timestamps are ISO strings; format them for the user's locale. Report date-only
  bounds refer to UTC days, not the local calendar day. Use explicit timezone-bearing
  bounds for a local-day report. Trip list has no date filter; trip report does.
- Error responses provide success false, message, errorCode, and optionally errors
  with field/message. Whole-body validation may use an empty field. Do not branch on
  message text. Public privileged-role registration and missing receiverName normally
  return VALIDATION_ERROR 400, despite deeper defensive controller/service error codes.

## Dispatch, workflow, and trips

First create a vehicle and Driver profile, then PUT `/drivers/:id/vehicle` to link
the pair. This is profile linkage, not dispatch. Use the operations shipment queue
and `/drivers/available` to choose candidates. The available-driver list is advisory,
includes assigned vehicles, and does not supply/reserve remaining capacity.

One linked pair can carry multiple ASSIGNED/PICKED_UP/IN_TRANSIT shipments. Dispatch
checks total active vehicle weight plus the new shipment against capacity; handle
VEHICLE_CAPACITY_EXCEEDED 409 by choosing another pair or waiting for capacity.
Do not mark drivers unavailable solely because they have one shipment.
`isAvailable=false` is an explicit pause, preserved after completion. The legacy
report key busyDrivers counts paused/unavailable flags, not active workloads.

Only drivers advance their own shipment from ASSIGNED to PICKED_UP, then IN_TRANSIT,
then DELIVERED or FAILED. Submit receiverName and optional deliveryNotes in the
DELIVERED status request. There is no separate proof upload/submission endpoint.
The server generates deliveredAt and history timestamps. Terminal statuses cannot
be edited or retried as new transitions. A first completion keeps the vehicle assigned
when other work remains; the last completion releases it while preserving profile links.

Trip grouping selects active shipments already assigned to the same pair. A shipment
cannot belong to two planned/active trips. Trip lifecycle is independent: cancellation
does not cancel shipments, and completion requires all its shipments terminal.
No route optimization or shipment progression is triggered by trip status changes.

## Environment and CORS

Run backend commands from `backend` so dotenv resolves the intended local file.
`.env.example` contains placeholders only; real `.env` was not modified and secrets
were not displayed. Configure real values separately when runtime setup is authorized.

| Variable | Meaning and default |
| --- | --- |
| PORT | HTTP port, default 5000 |
| MONGO_URI | Transaction-capable MongoDB connection URI; example is a placeholder. Empty/unset skips connection under the existing fallback |
| JWT_SECRET | Required private signing/verification secret for authenticated runtime; example is not a usable deployment secret |
| JWT_EXPIRES_IN | Token lifetime, default 7d; use a duration string such as 7d |
| CLIENT_URL | One browser origin, e.g. http://localhost:5173; include scheme/port, no path or trailing slash |
| NODE_ENV | development in example; exact production value disables default cross-origin access when CLIENT_URL is absent |

CORS now uses CLIENT_URL. If omitted outside production, the browser origin defaults
to `http://localhost:5173`; change CLIENT_URL for port 3000, 5174, 127.0.0.1, or another
frontend origin. localhost and 127.0.0.1 are different origins. In production with
no CLIENT_URL, CORS headers are disabled; set the deployed frontend's exact origin.
No production wildcard is enabled by default. Do not configure CLIENT_URL as `*`
for deployment; it is intended to hold a single trusted origin.

The cors middleware returns the configured Access-Control-Allow-Origin; a browser
at a different origin cannot read the response. It handles preflight OPTIONS with
204 when enabled, supports GET/HEAD/PUT/PATCH/POST/DELETE at the transport level,
and reflects requested headers so Authorization and Content-Type can be sent.
No Access-Control-Allow-Credentials is enabled. Transport methods do not imply
business endpoints (for example, there are no PATCH application routes).

CORS is a browser response-reading policy, not authentication or a request firewall.
Postman/curl and requests without Origin continue reaching routes with normal JWT/RBAC
requirements. Wrong-origin requests can still execute server-side, but the browser
cannot read their responses. Same-origin access is unaffected by disabling CORS.

## Scripts and verification

- `npm run dev`: nodemon server.js.
- `npm start`: node server.js.
- `npm test`: existing audit tests plus API contract tests; no MongoDB required.
- On Windows where npm.ps1 is blocked, use `npm.cmd test`, `npm.cmd start`, or
  `npm.cmd run dev`; no execution-policy change is needed.

The app can be imported without opening a listener or connecting to MongoDB. Direct
startup retains the existing empty-URI fallback and health 200. A failed configured
connection is logged and startup still continues; health is not database readiness.
The Mongo placeholder in .env.example is not an empty URI and is not expected to connect.

Contract tests compare all 38 endpoint headings with mounted routes, validate exports,
documented enum/workflow values, request examples, and browser CORS behavior. Existing
tests retain imports/syntax, exact Git/model casing, validation/privacy, pricing 350
for 12 kg/20 km, workflows, HTTP health, no-token 401, malformed JSON 400, and unknown
route 404 checks. No fake users or database replacements are required.

## Known limitations and remaining runtime acceptance

Real MongoDB/Atlas or another transaction-capable replica set is still required to
verify ownership queries, duplicate-key enforcement, aggregates, rollback, session
behavior, competing dispatch/release/link operations, and live-trip unique indexes.
Build/verify indexes before accepting traffic. Follow the full manual checklist in
[backend-audit.md](backend-audit.md); no runtime DB success is claimed by static tests.

Existing stored driver flags may mean an old busy flag or a deliberate pause; review
them manually before adopting v1 semantics. Legacy delivered records without proof
can return DELIVERY_PROOF_NOT_FOUND. Trip eligibility uses snapshot-time reads;
shipment progression is independent and not locked by trip creation. Reports/history
can reflect adjacent committed snapshots; lists are unpaginated.

Addresses, route/location notes, and distance are entered text/numbers, not GPS or
computed road routes. There are no external maps, WebSockets, notifications, uploads,
or routing optimization. Tracking is request/response. The fixed 48-hour on-time SLA
is an academic fallback, and prices have no encoded currency. Maintenance vehicles
remain in the operational utilization denominator. These are existing product rules,
not new Phase 14 features.

API Contract v1 is the frontend implementation reference, not a claim of deployment
readiness. Phase 15, frontend implementation, MongoDB configuration, seed data, and
the final Postman collection remain outside this phase.

## Phase 14 completion and resumed-work record

On resuming after the connection interruption, the workspace already contained
config/cors.js, its server.js wiring, CLIENT_URL/NODE_ENV additions to .env.example,
and the package test command covering tests/*.test.js. These valid changes were
preserved. Phase 13 implementations and staged model case-only renames were also
preserved. No API-contract documents or contract test file had been saved yet.

The continuation completed api-contract.md, enums.md, this integration guide, and
tests/api-contract.test.js. No controller, model, route, business workflow, token
format, response envelope, pricing formula, or report formula changed in Phase 14.
CORS is the only runtime behavior change: one configurable browser origin replaces
the prior unconditional wildcard. Existing start/dev commands and dependencies remain.

Final database-free verification on 2026-09-09: `npm.cmd test` passed 12/12 groups
(the existing 7 audit groups plus 5 contract groups). All 38 explicit application
endpoints match documentation: health 1, auth 3, vehicles 5, drivers 8, shipments 11,
trips 5, reports 5. Request JSON examples, query-validator examples, exact enums and
workflow tables, module/export checks, browser CORS/preflight, and prior HTTP/privacy/
pricing checks passed. Both working-tree and staged Git whitespace checks passed.
An initially over-restrictive test path regex was corrected to accept existing
hyphenated report paths; no application route change was needed.

Security source review confirmed public auth responses are explicitly projected,
passwordHash is selected only for password comparison, protected user loading omits
it, population uses selected fields, customer tracking uses display-only objects,
and error responses hide internals. No new exposure was found. Live DB data behavior
remains subject to the acceptance checks above. No credentials, accounts, seed data,
frontend files, or Postman collection were created, and no Git commit was made.
