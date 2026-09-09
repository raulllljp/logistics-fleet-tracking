# Authorization policy

Authentication verifies the JWT and loads an active User from MongoDB into
`req.user`. Authorization checks that user's current database role, rather than
trusting a role supplied in the request body or relying on an old JWT role.

Use `authMiddleware` before `authorizeRoles(...allowedRoles)` on protected routes.
Missing identity returns 401 / `UNAUTHORIZED`; a disallowed role returns
403 / `FORBIDDEN`. An empty role allowlist denies access. Admin has no implicit
override: include admin explicitly on routes that should allow it.

## Current endpoint policy

| Role | Intended permissions | Restrictions |
| --- | --- | --- |
| Customer | Register/login, view own account; book, estimate, view, and track own shipments, history, and proof | No fleet, driver-profile, dispatch, trip, or fleet-report management |
| Driver | Register/login, view own account/profile, assigned shipments, own trips, and assigned shipment history/proof; update assigned shipment status and submit delivery proof | No vehicle management, dispatch, admin fleet reports, or updates to another driver's shipments |
| Dispatcher | Manage operational fleet data, vehicles, driver profiles, shipment assignments, trips, and operational reports | No unrestricted system administration |
| Admin | All dispatcher operational capabilities and reports | No override on customer-only tracking/booking or driver-only status/profile/trip-list endpoints; no generic account-management endpoint exists |

These policies are implemented by the current module routes and ownership checks.
Role checks alone do not enforce resource ownership.
Public registration remains limited to customer and driver. No users are seeded.

## Temporary verification routes

| GET route | Allowed roles |
| --- | --- |
| `/api/test/customer` | customer |
| `/api/test/driver` | driver |
| `/api/test/operations` | dispatcher, admin |
| `/api/test/admin` | admin |

These development reference routes are no longer mounted by server.js as of
Phase 13. Requests to /api/test now receive the normal JSON 404 response.

For the mounted application routes, with MongoDB and real accounts configured, verify each allowed role receives
200 and every other role receives 403. Missing, invalid, or expired JWTs receive
401 when JWT verification is configured. Use securely provisioned dispatcher/admin
accounts for those checks; public registration must continue rejecting those roles.
