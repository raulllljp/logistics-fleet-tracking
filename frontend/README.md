# P08 - React frontend foundation (Phase 15)

Phase 15 supplies routing, session management, API wrappers, shared components,
and responsive layouts. Phase 16 adds working login and registration forms. Domain
pages remain placeholders; no records or metrics are fabricated.

## Local setup

Run from `frontend/`:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Skip the copy if `.env.local` already exists. The example sets
`VITE_API_BASE_URL=http://localhost:5000/api`. Vite uses port 5173 with strict-port
behavior. Backend `CLIENT_URL` must match the browser origin. Never put backend
secrets in Vite variables. Other shells can use `npm` instead of `npm.cmd`.

Existing packages: React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4 with
`@tailwindcss/vite`, and Oxlint. This is JavaScript; versions are locked in
`package-lock.json`. This continuation added no dependencies or configuration.

## API and authentication

`src/api/client.js` owns one Axios instance, using the environment base URL or
localhost fallback and a 15-second timeout. Requests attach the stored Bearer token;
public login/register requests omit it. Current-session 401 responses clear storage
and notify the auth provider. Late 401s for an older token cannot clear a newer
session. Public credential errors remain local; 403 and other errors are rejected
for callers to handle.

The six API modules cover all 37 documented non-health endpoints and preserve the
full JSON envelope, including root count/message. Callers construct valid bodies
and filters using [Contract v1](../backend/docs/api-contract.md).

`storage.js` centralizes `logistics_token` and `logistics_user`. Stored users contain
only public fields, never passwords or hashes. `AuthProvider` and `useAuth` expose
user, token, isAuthenticated, isLoading, error, login, register, logout, and
refreshCurrentUser. Startup validates a token through `/auth/me`; cached roles do
not grant access. Invalid/inactive sessions clear. Temporary service failures show
a retry state. Logout is local; no backend logout endpoint is invented. Session
revisions and cancellation prevent stale responses from restoring old identities.
Storage events revalidate sessions across tabs.

See [frontend integration](../backend/docs/frontend-integration.md) for backend
configuration and request/response limitations.

## Routing and UI

| Access | Routes |
| --- | --- |
| Public | `/login`, `/register` |
| Customer | `/customer/dashboard`, `/customer/book`, `/customer/shipments`, `/customer/shipments/:id` |
| Driver | `/driver/dashboard`, `/driver/shipments`, `/driver/trips` |
| Dispatcher/admin | `/operations/dashboard`, `/operations/shipments`, `/operations/drivers`, `/operations/vehicles`, `/operations/trips`, `/operations/reports` |
| Shared | `/unauthorized`, catch-all 404 |

Root and authenticated public-page visits use getDashboardPath: customer and driver
go to their respective dashboards; dispatcher/admin go to operations. ProtectedRoute
waits for initialization, offers session retry, or redirects to login. RoleRoute
sends mismatches to unauthorized. Backend authorization remains authoritative.

PublicLayout and DashboardLayout provide branding, role-based sidebar navigation,
a topbar, logout, and the main outlet. Mobile navigation toggles and closes on
selection or Escape. Styles use graphite, warm neutrals, and emerald, with visible
focus and reduced-motion support.

Reusable foundations: LoadingScreen, ErrorState, EmptyState, PagePlaceholder,
StatusBadge, Button, and Field. Constants match the case-sensitive role, shipment,
trip, vehicle-status, and vehicle-type values in [enums](../backend/docs/enums.md).
Formatters provide INR currency, local date/time through Intl, and status/type labels.

## Continuation and verification

On resumption, all runtime foundation files, route placeholders, environment and
Vite configuration, dependencies, and both test files already existed. They were
preserved. This continuation audited them against v1, ran verification, and replaced
the starter README with project setup, architecture, and integration notes. No
runtime rewrite was necessary.

Verified on 2026-09-09:

- `npm.cmd run build`: passed, 118 modules transformed, no build warnings.
- `npm.cmd test`: all seven groups passed.
- `npm.cmd run lint`: passed without warnings.

Tests cover all wrapper methods/paths and envelopes, interceptors, storage,
session restoration/races, constants/formatters, and server-rendered guards and
placeholders. These checks do not establish browser interaction or live database
behavior. Production hosting must serve index.html for client-side routes; no
hosting deployment was performed.

## Pre-existing backend integration blockers

The backend contains unresolved merge markers in server.js, auth and vehicle
controllers/routes, auth middleware, database config, and StatusHistory.js.
`node --check backend/server.js` fails on a conflict marker, blocking live API
verification independently of the frontend build.

Existing model changes also diverge from v1: Shipment uses lowercase/hyphenated
statuses and omits weight/distance/vehicle/proof fields; Trip omits vehicle/status;
Driver omits license/phone; Vehicle omits registration and inactive status; User
omits isActive. Git also contains model paths differing only by case. These need
separate backend reconciliation against the frozen contract.

No backend files, staged changes, or v1 documents were modified in this continuation.
Phase 15 stops here; Phase 16 has not been started.


## Phase 16 authentication experience

Login and registration now use the existing AuthContext and v1 endpoints. Registration
accepts customer/driver only and automatically uses the returned session. PublicOnly
redirects successful sessions and already-authenticated visitors using the backend
user role. Dashboard content remains unchanged.

Forms provide linked labels, autocomplete, show/hide password controls, field errors,
alert feedback, keyboard submission, disabled fieldsets and duplicate-submit guards.
Registration validates a 2-100 character name, email, eight-character password minimum
and 72 UTF-8 byte maximum. Login requires a nonempty password with the same byte cap,
as specified in v1. No password is trimmed or stored outside the existing request flow.
Server validation remains authoritative. Known auth codes use friendly messages;
unknown server errors never expose raw error text.

Submission keeps the form mounted; session restoration still uses the full loading
screen and authoritative /auth/me request. Logout clears the session and protected
routing returns to login. The unauthorized screen offers the current role dashboard.
Fleetline branding remains, with a subtle route motif, two-column desktop layout and
single-column mobile layout.

Verification: production build and Oxlint passed; all nine frontend test groups passed.
Coverage includes form rendering, public roles, validation boundaries, safe errors,
role helpers, authenticated form guards, session restoration/logout and protected routes.
No new testing framework or dependency was added. Tests use isolated fixtures only;
no accounts or database records were created. Browser interaction and live MongoDB
authentication have not been verified in this phase.

The backend blockers described in the historical Phase 15 section were repaired in
Phase 15.5 (see ../backend/docs/phase-15.5-repair.md). Phase 16 changes no backend
files or API contract. No new contract mismatch was found. Phase 17 was not started.


## Phase 17 customer experience

The four customer routes now load actual API data. Dashboard greets the authenticated
user, shows up to three active shipments (including BOOKED), and the five newest
shipments in backend order. My Shipments uses the canonical status query filter.
Booking validates 5-500 character addresses, positive weight and nonnegative distance,
sends only the four allowed fields, and redirects with success feedback. Explicit
estimation sends numeric weight/distance; editing either clears the old estimate.
No price calculation is duplicated in the frontend and no payment is collected.

Detail uses only /shipments/:id/track for the full customer projection, chronological
history, safe driver name/vehicle display, and delivered proof. Refresh status makes
a new request. No polling, map or sockets were added. Abort handling prevents stale
filter/id responses from overwriting the current request. Missing assignments and
legacy missing proof have explicit states; failed deliveries never invent success.

New shared components are in ShipmentComponents.jsx: ShipmentCard, ShipmentList,
RouteVisual, ShipmentTimeline, DeliveryProofCard and ShipmentLoading. The simple
useCustomerShipments hook manages reads/retries; customerShipments.js centralizes
payload projection, validation, filters and safe error messages. Customer styles use
responsive cards, a vertical semantic timeline, labeled fields and textual statuses.

Verification: 11 frontend test groups, production build and lint passed. Tests cover
customer access guards, payloads, validation, mocked estimate/filter requests, empty
lists, chronological/failed timelines and escaped read-only proof. Fixtures exist
only in tests. Live MongoDB flows and browser visual/interaction testing remain
unverified. No backend/API contract mismatch was found; backend and driver/operations
pages were not changed. No dependencies were added. Phase 18 was not started.

## Phase 18 driver experience

Driver dashboard now loads the own profile, assigned shipments and own trips
independently. Profile displays self-view name/license, availability and linked
vehicle. Active shipments prioritize IN_TRANSIT, PICKED_UP, then ASSIGNED; this
is action priority, not route optimization. Current/planned trips retain API order.

Assigned shipments supports canonical server status filters and manual refresh.
Expandable cards use the own-list record, authorized history endpoint and embedded
proof for delivered records. No customer /track or operations-only detail endpoint
is used. Trip cards expand the populated shipment list and remain read-only.

Inline forms expose only valid next workflow actions. Delivery requires a 2-100
character receiver name; terminal forms explicitly confirm completion/failure and
explain finality. Optional location/notes follow v1 limits. Payloads whitelist only
status and allowed text fields, never client timestamps or assignment fields.
Duplicate submissions are blocked; success reloads current data; 409 and assignment
conflicts close stale forms and reload with feedback. 401 handling remains global.

New files: components/driver/DriverComponents.jsx, hooks/useDriverData.js,
utils/driverWorkflow.js and tests/driver.test.js. Modified the three driver pages,
CSS and route tests. Shared route visual, status badge, timeline, proof, loading,
error and empty components are reused. Mobile forms stay in document flow with
labeled inputs, autofocus, cancel focus return, large targets and announced errors.

Verification: production build, lint and 13 frontend test groups passed. Tests cover
workflow edges, terminal states, receiver validation, protected payload exclusion,
confirmation rendering, trip/empty rendering and role guards. Live MongoDB updates
and browser interaction/visual checks remain unverified. No fake application data,
new dependencies, backend changes or API mismatch. Phase 19 was not started.
