# API Contract v1: canonical enums

API Contract Version: v1. Values are case-sensitive. Labels shown in a UI may
be friendly, but requests must use these strings from `utils/constants.js`.

```json
{
  "USER_ROLES": { "CUSTOMER": "customer", "DRIVER": "driver", "DISPATCHER": "dispatcher", "ADMIN": "admin" },
  "SHIPMENT_STATUSES": ["BOOKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"],
  "VEHICLE_STATUSES": ["available", "assigned", "maintenance", "inactive"],
  "VEHICLE_TYPES": ["bike", "van", "mini_truck", "truck"],
  "TRIP_STATUSES": ["planned", "active", "completed", "cancelled"]
}
```

## Shipment transitions

| Current | Allowed next |
| --- | --- |
| BOOKED | ASSIGNED (dispatch only) |
| ASSIGNED | PICKED_UP |
| PICKED_UP | IN_TRANSIT |
| IN_TRANSIT | DELIVERED, FAILED |
| DELIVERED | None |
| FAILED | None |

The driver status endpoint only performs the last four target states. Active workload
means ASSIGNED, PICKED_UP, IN_TRANSIT. Unknown status strings return validation 400;
known but invalid transitions return 409 after authentication/ownership checks.

## Trip transitions

| Current | Allowed next |
| --- | --- |
| planned | active, cancelled |
| active | completed, cancelled |
| completed | None |
| cancelled | None |

Completion also requires every shipment to be DELIVERED or FAILED. Trip status
never advances shipment status or releases fleet resources.

## Vehicle transitions through management endpoints

Creation defaults to available; maintenance/inactive may be supplied, assigned may
not. Updates allow available -> maintenance/inactive, maintenance -> available/inactive,
and inactive -> available. Repeating the current state is allowed, subject to other
guards. Generic updates cannot enter/leave assigned; dispatch and terminal shipment
updates control it. Linked vehicles cannot be deactivated. DELETE is guarded soft
deactivation and sets inactive; it does not delete the record.
