# Logistics & Fleet Delivery Tracking API

API Contract Version: v1

Frozen for frontend development in Phase 14. This is documentation versioning:
paths still start with `/api`, not a version prefix. Coordinate any later path,
request, enum, or response changes and update this document and contract tests.

## Reading this contract

- Local base URL: `http://localhost:5000/api`. Endpoint headings below contain full
  paths; do not append `/api` twice. There are 38 explicit application endpoints.
- Send `Content-Type: application/json` for bodies and `Authorization: Bearer <JWT>`
  on protected requests. No cookie authentication, refresh, logout, or user-list API exists.
- `Operations` means dispatcher OR admin. `All roles` means the four roles in
  [enums.md](enums.md). Admin has no implicit override on customer/driver-only routes.
- Every `:id` is a 24-hex-character resource ObjectId. Driver IDs refer to Driver
  profiles, not User IDs. IDs serialize as strings; dates serialize as ISO timestamps.
- Unless specified, there is no request body or supported query parameter. All body
  fields listed as optional may be omitted; do not send null in place of omission.
  Write bodies reject unknown fields. Query parameters not read by an endpoint are
  generally ignored, with explicit ownership exceptions noted below. Do not rely on them.
- Numbers/booleans in JSON must be actual numbers/booleans. Query filters are strings.
  No pagination, text search, selectable sorting, or totals beyond returned-list count.
- Success responses use `success: true`; data-bearing endpoints use `data`. Lists
  use root-level `count`. `message` is present only where stated. Health and vehicle
  deactivation intentionally have no `data`. These existing shapes were preserved.
- In response descriptions, capitalized names such as `Vehicle` refer to the object
  schemas below, not strings sent over the wire. `Type[]` means an array of objects.
  Examples are illustrative documentation only; no example accounts/data were created.
- Shared errors apply to every endpoint as appropriate: validation 400, authentication
  401, role/ownership 403, missing resource 404, business conflict 409, unexpected 500.
  Authentication and role checks precede resource/body validators on protected routes.
  A valid but missing filter ID can yield an empty list; it is not a resource lookup.

## Response objects and population

Normal model documents include `_id` and may include numeric `__v` (internal version,
not a frontend concurrency token). Vehicle/Driver/Shipment/Trip include server-managed
`createdAt` and `updatedAt`. Optional legacy fields can be absent. Never send whole
response objects back as update bodies. References on populated reads may be null
if the referenced record no longer exists.

| Object | Fields beyond common model fields |
| --- | --- |
| PublicUser | `_id`, `name`, `email`, `role`; auth `/me` additionally includes `isActive`; no timestamps/version/hash |
| Vehicle | `registrationNumber`, `type`, numeric `capacity` in kg, `status`, `currentDriverId` (Driver ID or null) |
| Driver | `userId` (User ID), `licenseNumber`, `phone`, `vehicleId` (Vehicle ID or null), boolean `isAvailable` |
| Shipment | `customerId` (User ID), `pickupAddress`, `dropAddress`, numeric `weight` kg, `distance` km, `estimatedCost`, `status`, `assignedDriverId`/`assignedVehicleId` (IDs or null), `bookedAt`, optional `deliveryProof` |
| DeliveryProof | `receiverName`, optional `deliveryNotes`, `deliveredAt`; no nested `_id` and no root shipment `deliveredAt` |
| StatusHistory | `_id`, `shipmentId`, `status`, `timestamp`, optional `location`, `note`, `updatedBy` (User ID), possible `__v`; no createdAt/updatedAt |
| Trip | `driverId`, `vehicleId`, `shipmentIds` (ID array), `date`, `status` |

Population varies by endpoint and is part of v1:

- `DriverRead`: Driver with `userId: {_id,name,email,role}` and
  `vehicleId: {_id,registrationNumber,type,status}` or null. Used by driver list,
  detail, and own profile. Create/update/link/unlink return unpopulated Driver.
- `AvailableDriver`: DriverRead, with `capacity` and `currentDriverId` additionally
  included in its vehicle object. Only matched, consistently linked candidates remain.
- `OperationsShipment`: Shipment with `customerId: {_id,name,email}` or null.
  Only the operations shipment list populates customerId; other ordinary shipment
  reads/mutations return IDs. Tracking has a separate projection shown below.
- `TripRead`: Trip with `driverId: {_id,licenseNumber,userId:{_id,name}}`,
  `vehicleId: {_id,registrationNumber,type}`, and `shipmentIds` as objects
  `{_id,pickupAddress,dropAddress,status}`. Singular missing references can be null;
  missing populated array records can be absent. All trip GETs use TripRead;
  create/status mutations return unpopulated Trip.

Driver phone/license/email are available on authorized profile/operations reads.
Customer tracking exposes only driver name and vehicle registration/type, never
phone/license/email, account secrets, or raw driver records.

## Health

### GET /api/health

Access: public. Body/query: none. Success: 200.

```json
{"success":true,"message":"Logistics Fleet Tracking API is running"}
```

This indicates process availability, not database readiness.

## Authentication

### POST /api/auth/register

Access: public. Query: none. Body:

```json
{"name":"Rahul","email":"rahul@example.com","password":"StrongPass123","role":"customer"}
```

Required: name (trimmed, 2-100 characters), valid email, password (at least 8
characters, at most 72 UTF-8 bytes). Optional role defaults to customer; only customer
or driver is allowed. Email is trimmed/normalized and stored lowercase; provider
dot/subaddress stripping is disabled. A driver account does not create a Driver profile.
Do not send passwordHash, isActive, IDs, or other fields.

Success: 201.

```json
{"success":true,"message":"User registered successfully","data":{"user":{"_id":"aaaaaaaaaaaaaaaaaaaaaaaa","name":"Rahul","email":"rahul@example.com","role":"customer"},"token":"<JWT>"}}
```

Important errors: 400 VALIDATION_ERROR (including dispatcher/admin registration),
409 EMAIL_ALREADY_EXISTS, 500 SERVER_ERROR. The controller's defensive FORBIDDEN_ROLE
403 exists, but the public route validator rejects those roles first with 400.

### POST /api/auth/login

Access: public. Query: none. Body requires valid email and a nonempty password of at
most 72 UTF-8 bytes; no other fields are accepted.

```json
{"email":"rahul@example.com","password":"StrongPass123"}
```

Success: 200.

```json
{"success":true,"message":"Login successful","data":{"user":{"_id":"aaaaaaaaaaaaaaaaaaaaaaaa","name":"Rahul","email":"rahul@example.com","role":"customer"},"token":"<JWT>"}}
```

Important errors: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS for unknown email or
wrong password, 401 ACCOUNT_INACTIVE after valid credentials for an inactive account,
500 SERVER_ERROR for configuration/database failure.

### GET /api/auth/me

Access: authenticated active account, any role. Body/query: none. Success: 200.

```json
{"success":true,"data":{"user":{"_id":"aaaaaaaaaaaaaaaaaaaaaaaa","name":"Rahul","email":"rahul@example.com","role":"customer","isActive":true}}}
```

Important errors: 401 UNAUTHORIZED for missing/invalid/expired token, deleted or inactive
account; 500 SERVER_ERROR for server configuration/database errors. Current database
role controls access, not a stale JWT role claim. Token payload remains userId, role,
iat, exp; signed HS256, default expiry 7d. Tokens are opaque to frontend API logic.

## Vehicles

All five endpoints require Operations. Enums are in [enums.md](enums.md).

### POST /api/vehicles

Body requires nonempty trimmed registrationNumber, type, finite capacity > 0 kg.
Optional status defaults to available; assigned is rejected with 409.

```json
{"registrationNumber":"MH12AB1234","type":"van","capacity":500,"status":"available"}
```

Success: 201, `data: {vehicle: Vehicle}`, message `Vehicle created successfully`.
Registration is uppercased. currentDriverId starts null and cannot be client-supplied.
Errors: 400 VALIDATION_ERROR; 409 VEHICLE_ALREADY_EXISTS, INVALID_STATUS_TRANSITION.

### GET /api/vehicles

Query: optional status and type (exact canonical enum strings). Success: 200,
`{success:true,count:number,data:{vehicles:Vehicle[]}}`. Sort: createdAt descending,
then _id descending. No body. Errors: 400 VALIDATION_ERROR for invalid filters.

### GET /api/vehicles/:id

Success: 200, `{success:true,data:{vehicle:Vehicle}}`.
Errors: 400 INVALID_VEHICLE_ID; 404 VEHICLE_NOT_FOUND.

### PUT /api/vehicles/:id

Body: at least one of registrationNumber, type, capacity, status, with create-field
validation. Partial update despite PUT. currentDriverId is forbidden.

```json
{"capacity":600,"status":"maintenance"}
```

Success: 200, `data:{vehicle:Vehicle}`, message `Vehicle updated successfully`.
Generic CRUD cannot enter/leave assigned. Assigned vehicles cannot change type or
capacity. A linked vehicle cannot become inactive. See vehicle transition table.
Errors: 400 INVALID_VEHICLE_ID/VALIDATION_ERROR; 404 VEHICLE_NOT_FOUND;
409 VEHICLE_ALREADY_EXISTS, INVALID_STATUS_TRANSITION, VEHICLE_ASSIGNED,
VEHICLE_HAS_DRIVER, VEHICLE_CONFLICT (reload after a concurrent change).

### DELETE /api/vehicles/:id

No body/query. Soft deactivation, not deletion. Assigned or linked vehicles are blocked.
Success: 200, `{"success":true,"message":"Vehicle deactivated successfully"}`.
Errors: 400 INVALID_VEHICLE_ID; 404 VEHICLE_NOT_FOUND;
409 VEHICLE_ASSIGNED, VEHICLE_HAS_DRIVER, VEHICLE_CONFLICT.

## Drivers

Operations manages profiles; only own-profile GET below is driver-only.

### POST /api/drivers

Access: Operations. Body requires userId (existing User with driver role),
licenseNumber (trimmed 5-40 characters, uppercased), phone (trimmed 7-25 characters).

```json
{"userId":"bbbbbbbbbbbbbbbbbbbbbbbb","licenseNumber":"MH1420261234567","phone":"9876543210"}
```

Success: 201, `data:{driver:Driver}`, message `Driver profile created successfully`.
Backend sets vehicleId null, isAvailable true. No other body fields accepted.
Errors: 400 VALIDATION_ERROR; 404 USER_NOT_FOUND;
409 USER_NOT_DRIVER, DRIVER_PROFILE_ALREADY_EXISTS, LICENSE_ALREADY_EXISTS.

### GET /api/drivers

Access: Operations. Query: optional available and vehicleAssigned, each string
`true` or `false`. available filters isAvailable; vehicleAssigned filters non-null
profile linkage, not active shipments. Success: 200,
`{success:true,count:number,data:{drivers:DriverRead[]}}`.
Sort: createdAt descending, then _id descending. Errors: 400 VALIDATION_ERROR.

### GET /api/drivers/available

Access: Operations. No query/body. Success: 200,
`{success:true,count:number,data:{drivers:AvailableDriver[]}}`.
Sorted newest first. Requires isAvailable true, active driver account, non-null
consistent vehicle link, and vehicle available or assigned. This is advisory:
it does NOT filter by remaining capacity or return activeWeight. A full vehicle may
appear. Dispatch rechecks all conflicts transactionally.

### GET /api/drivers/me/profile

Access: driver only, identity derived from authenticated User._id. No client ID.
Success: 200, `{success:true,data:{driver:DriverRead}}`.
Errors: 404 DRIVER_PROFILE_NOT_FOUND (account exists but profile is not provisioned).

### GET /api/drivers/:id

Access: Operations. Success: 200, `{success:true,data:{driver:DriverRead}}`.
Errors: 400 INVALID_DRIVER_ID; 404 DRIVER_PROFILE_NOT_FOUND.

### PUT /api/drivers/:id

Access: Operations. Body: at least one of licenseNumber, phone, isAvailable.
License/phone validation matches creation; isAvailable is a JSON boolean.

```json
{"isAvailable":false}
```

Success: 200, `data:{driver:Driver}`, message `Driver profile updated successfully`.
userId and vehicleId are forbidden. isAvailable means operational permission to
accept more workload, not zero active shipments. Pausing does not block finishing
existing work. Dispatch/completion never resets this flag.
Errors: 400 INVALID_DRIVER_ID/VALIDATION_ERROR; 404 DRIVER_PROFILE_NOT_FOUND;
409 LICENSE_ALREADY_EXISTS (duplicate-key fallback can also report profile conflict).

### PUT /api/drivers/:id/vehicle

Access: Operations. Body requires only vehicleId:

```json
{"vehicleId":"cccccccccccccccccccccccc"}
```

Success: 200, `data:{driver:Driver}`, message `Vehicle linked successfully`.
Writes both Driver.vehicleId and Vehicle.currentDriverId. Vehicle must be available;
no active shipment may use the driver or target vehicle. Existing conflicting links
must be unlinked first; reverse references are checked too. Link alone does not set
vehicle status assigned or change driver availability.
Errors: 400 INVALID_DRIVER_ID/VALIDATION_ERROR; 404 DRIVER_PROFILE_NOT_FOUND,
VEHICLE_NOT_FOUND; 409 VEHICLE_INACTIVE, VEHICLE_MAINTENANCE, VEHICLE_UNAVAILABLE,
VEHICLE_ASSIGNED, DRIVER_ALREADY_HAS_VEHICLE, VEHICLE_ALREADY_LINKED.

### DELETE /api/drivers/:id/vehicle

Access: Operations. No body/query. Success: 200, `data:{driver:Driver}`,
message `Vehicle unlinked successfully`. Clears both profile references, does not
delete resources or historical assignments. Active work prevents unlinking.
Errors: 400 INVALID_DRIVER_ID; 404 DRIVER_PROFILE_NOT_FOUND, VEHICLE_NOT_FOUND;
409 DRIVER_HAS_NO_VEHICLE, VEHICLE_ASSIGNED, VEHICLE_UNAVAILABLE for inconsistent links.

## Shipments and pricing

### POST /api/shipments/estimate

Access: customer only. Body requires finite numeric weight > 0 kg and distance >= 0 km:

```json
{"weight":12,"distance":20}
```

Success: 200.

```json
{"success":true,"data":{"weight":12,"distance":20,"estimatedCost":350}}
```

Formula: 50 base fee + 10 * distance + weight surcharge. Surcharge is 0 for
weight <= 5, 50 for 5 < weight <= 10, 100 for 10 < weight <= 20, otherwise 200.
Round to two decimal places. A non-finite or excessively large computed price
(above Number.MAX_SAFE_INTEGER / 100 before rounding) is rejected. No distance/maps
service is called. Currency is not encoded by the API; do not infer a currency code.
Errors: 400 VALIDATION_ERROR or INVALID_PRICING_INPUT. Formula unchanged in Phase 14.

### POST /api/shipments

Access: customer only. Body requires exactly these fields:

```json
{"pickupAddress":"Warehouse A, Pune","dropAddress":"Office B, Pune","weight":8,"distance":18}
```

Addresses: trimmed strings of 5-500 characters. Weight/distance use estimate rules.
Success: 201, `data:{shipment:Shipment}`, message `Shipment booked successfully`.
Initial status BOOKED; estimatedCost for this example is 280. The backend derives
customerId from JWT identity and creates one initial history record in the transaction.
Do NOT send customerId, status, assignedDriverId, assignedVehicleId, estimatedCost,
bookedAt, deliveryProof, deliveredAt, createdAt, updatedAt, _id, or other fields.
Errors: 400 VALIDATION_ERROR/INVALID_PRICING_INPUT; unexpected database errors 500.

### GET /api/shipments/my

Access: customer only; own customerId derived from authentication. Query: optional
status (any shipment enum). Supplying customerId is rejected, not used as an override.
Success: 200, `{success:true,count:number,data:{shipments:Shipment[]}}`.
Sort: createdAt descending, then _id descending. Errors: 400 VALIDATION_ERROR.

### GET /api/shipments/driver/my

Access: driver only; assignment filter derived from authenticated Driver._id.
Query: optional status, limited to ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED.
Without status, returns all own assigned records including terminal ones.
Success: 200, `{success:true,count:number,data:{shipments:Shipment[]}}`, newest first.
Errors: 400 VALIDATION_ERROR; 404 DRIVER_PROFILE_NOT_FOUND. Client driver IDs do not
override the authenticated assignment filter.

### GET /api/shipments

Access: Operations. Query: optional status (any shipment enum) and customerId (User ID).
Example pending queue: `?status=BOOKED`.
Success: 200, `{success:true,count:number,data:{shipments:OperationsShipment[]}}`,
newest first. Errors: 400 VALIDATION_ERROR.

### PUT /api/shipments/:id/assign

Access: Operations. Body requires only Driver profile ID and Vehicle ID:

```json
{"driverId":"dddddddddddddddddddddddd","vehicleId":"cccccccccccccccccccccccc"}
```

Success: 200, `data:{shipment:Shipment}`, message `Shipment assigned successfully`.
Shipment becomes ASSIGNED; one history entry is added. Driver and vehicle must already
be consistently linked; driver must permit workload and have an active driver account.
Vehicle may be available OR assigned. Multiple active shipments are allowed on that
same pair. Sum weight of OTHER ASSIGNED/PICKED_UP/IN_TRANSIT shipments on the vehicle
plus the proposed weight; total must be <= capacity. Exact capacity succeeds.
Dispatch sets Vehicle.status assigned and preserves profile linkage/isAvailable.

Errors: 400 INVALID_SHIPMENT_ID/VALIDATION_ERROR; 404 SHIPMENT_NOT_FOUND,
DRIVER_PROFILE_NOT_FOUND, VEHICLE_NOT_FOUND. Business conflicts (409):

| Code | Meaning |
| --- | --- |
| SHIPMENT_NOT_BOOKABLE | Current status is not BOOKED |
| SHIPMENT_ALREADY_ASSIGNED | BOOKED record already has assignment references |
| DRIVER_UNAVAILABLE | Driver paused, account missing, or account has wrong role |
| DRIVER_ACCOUNT_INACTIVE | Driver account inactive |
| VEHICLE_MAINTENANCE | Vehicle under maintenance |
| VEHICLE_INACTIVE | Vehicle inactive |
| VEHICLE_UNAVAILABLE | Vehicle has another unsupported state |
| DRIVER_VEHICLE_MISMATCH | Inconsistent profile links or active work spans a different pair |
| VEHICLE_CAPACITY_EXCEEDED | Individual or combined weight does not fit |

Reload relevant records after 409; do not assume the advisory available-driver list
reserves capacity. Multi-document writes and capacity serialization use a transaction.

### PUT /api/shipments/:id/status

Access: driver only, and shipment.assignedDriverId must match authenticated Driver._id.
Required status, optional trimmed location (max 200), note (max 1000).

```json
{"status":"PICKED_UP","location":"Warehouse gate","note":"Package collected"}
```

For DELIVERED, receiverName is additionally required (trimmed 2-100 characters),
deliveryNotes optional (trimmed max 1000):

```json
{"status":"DELIVERED","location":"Reception","note":"Delivery completed","receiverName":"Rahul","deliveryNotes":"Received at front desk"}
```

Success: 200, `data:{shipment:Shipment}`, message `Shipment status updated successfully`.
Valid driver progression: ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DELIVERED or FAILED.
Both final states are terminal. Known illegal jumps, repeats, or attempts to set
BOOKED/ASSIGNED through this endpoint conflict. Unknown enum values are validation errors.
DELIVERED sets deliveryProof.deliveredAt on the server, using the same timestamp as
history. Proof fields are forbidden for other statuses. FAILED creates no proof.
No timestamp field is accepted from the client, and proof has no edit/delete endpoint.
Each successful transition creates exactly one history entry in its transaction.
Terminal updates keep the vehicle assigned if other active work remains; otherwise
available. Profile links and explicit driver pause survive release.
Errors: 400 INVALID_SHIPMENT_ID/VALIDATION_ERROR; 404 DRIVER_PROFILE_NOT_FOUND,
SHIPMENT_NOT_FOUND; 403 SHIPMENT_NOT_ASSIGNED_TO_DRIVER;
409 INVALID_STATUS_TRANSITION, ASSIGNED_VEHICLE_NOT_FOUND. A defensive service-level
400 DELIVERY_RECEIVER_REQUIRED exists, but route validation normally reports missing
or invalid receiverName as VALIDATION_ERROR before invoking that service.

### GET /api/shipments/:id/history

Access: all roles; customer must own shipment, driver must be assigned, Operations
can read any shipment. No body/query. Success: 200,
`{success:true,data:{shipmentId:string,currentStatus:ShipmentStatus,history:StatusHistory[]}}`.
History sorted timestamp ascending, _id ascending; count/message absent. This full
history includes record/actor IDs, unlike tracking's display history projection.
Errors: 400 INVALID_SHIPMENT_ID; 404 SHIPMENT_NOT_FOUND, DRIVER_PROFILE_NOT_FOUND;
403 FORBIDDEN (customer), SHIPMENT_NOT_ASSIGNED_TO_DRIVER (driver).

### GET /api/shipments/:id/track

Access: customer only, own shipment. No body/query. Success: 200. Exact projection:

```json
{
  "success": true,
  "data": {
    "shipment": {
      "_id": "eeeeeeeeeeeeeeeeeeeeeeee",
      "pickupAddress": "Warehouse A, Pune",
      "dropAddress": "Office B, Pune",
      "weight": 12,
      "distance": 20,
      "estimatedCost": 350,
      "currentStatus": "IN_TRANSIT",
      "bookedAt": "2026-09-09T04:00:00.000Z",
      "driver": { "name": "Delivery Driver" },
      "vehicle": { "registrationNumber": "MH12AB1234", "type": "van" }
    },
    "history": [
      { "status": "BOOKED", "timestamp": "2026-09-09T04:00:00.000Z", "note": "Shipment booked" },
      { "status": "ASSIGNED", "timestamp": "2026-09-09T04:10:00.000Z", "note": "Shipment assigned to driver and vehicle" },
      { "status": "PICKED_UP", "timestamp": "2026-09-09T05:00:00.000Z", "location": "Warehouse gate" },
      { "status": "IN_TRANSIT", "timestamp": "2026-09-09T05:15:00.000Z", "location": "Leaving warehouse" }
    ],
    "deliveryProof": null
  }
}
```

Use data.shipment.currentStatus (not status), data.history, and data.deliveryProof.
Driver/vehicle display objects are null when unavailable/unassigned. History only
has status, timestamp, optional location/note; sorted oldest first, no IDs or updatedBy.
Proof is null unless DELIVERED with stored proof; then it is the DeliveryProof object.
Errors: 400 INVALID_SHIPMENT_ID; 404 SHIPMENT_NOT_FOUND; 403 FORBIDDEN.

### GET /api/shipments/:id/proof

Access: all roles, same ownership policy as history. No body/query. Success: 200,
`{success:true,data:{shipmentId:string,deliveryProof:DeliveryProof}}`.
Errors: 400 INVALID_SHIPMENT_ID; 404 SHIPMENT_NOT_FOUND, DELIVERY_PROOF_NOT_FOUND;
403 FORBIDDEN (customer), SHIPMENT_NOT_ASSIGNED_TO_DRIVER (driver, including missing
driver profile); 409 DELIVERY_NOT_COMPLETED (any non-DELIVERED state, including FAILED).
Legacy DELIVERED records missing proof return 404, not a fabricated proof.

### GET /api/shipments/:id

Access: customer (own shipment only) or Operations (any). Driver is not allowed;
driver frontend uses its assigned list, history/proof, and status endpoints.
Success: 200, `{success:true,data:{shipment:Shipment}}` with unpopulated IDs.
Errors: 400 INVALID_SHIPMENT_ID; 404 SHIPMENT_NOT_FOUND; 403 FORBIDDEN.

## Trips

### POST /api/trips

Access: Operations. Body requires driverId, vehicleId, and nonempty shipmentIds array
of unique ObjectIds (case-insensitive duplicate detection). Optional date is an ISO
date string, defaults to server time; send an explicit timezone for timestamps.

```json
{"driverId":"dddddddddddddddddddddddd","vehicleId":"cccccccccccccccccccccccc","shipmentIds":["eeeeeeeeeeeeeeeeeeeeeeee","ffffffffffffffffffffffff"],"date":"2026-09-09T08:00:00.000Z"}
```

Success: 201, `data:{trip:Trip}`, message `Trip created successfully`. Backend sets
status planned and timestamps; do not send them. All shipments must exist, be active
(ASSIGNED/PICKED_UP/IN_TRANSIT), and assigned to this same consistently linked pair.
None may already belong to another planned/active trip. Trips group records only;
they do not change shipment status or optimize a route.
Errors: 400 VALIDATION_ERROR; 404 DRIVER_PROFILE_NOT_FOUND, VEHICLE_NOT_FOUND,
SHIPMENT_NOT_FOUND; 409 DRIVER_VEHICLE_MISMATCH, SHIPMENT_ASSIGNMENT_MISMATCH,
SHIPMENT_NOT_ELIGIBLE_FOR_TRIP, SHIPMENT_ALREADY_IN_TRIP.

### GET /api/trips

Access: Operations. Query: optional status (trip enum), driverId (Driver ID), vehicleId.
No date filter on this list; date ranges are supported by the trip report.
Success: 200, `{success:true,count:number,data:{trips:TripRead[]}}`.
Sort: date descending, then _id descending. Errors: 400 VALIDATION_ERROR.

### GET /api/trips/my

Access: driver only, identity derived from authenticated account. Query: optional
status (trip enum). Supplying driverId is rejected. Success: 200,
`{success:true,count:number,data:{trips:TripRead[]}}`, sorted as operations list.
Errors: 400 VALIDATION_ERROR; 404 DRIVER_PROFILE_NOT_FOUND.

### GET /api/trips/:id

Access: Operations. Success: 200, `{success:true,data:{trip:TripRead}}`.
Errors: 400 INVALID_TRIP_ID; 404 TRIP_NOT_FOUND. Drivers use their own trip list.

### PUT /api/trips/:id/status

Access: Operations. Body requires only status:

```json
{"status":"active"}
```

Success: 200, `data:{trip:Trip}`, message `Trip status updated successfully`.
planned -> active/cancelled; active -> completed/cancelled; completed/cancelled terminal.
Completion requires all trip shipments DELIVERED or FAILED. Cancellation does not
cancel shipments or release their resources. Neither creation nor activation drives
shipment progression. Errors: 400 INVALID_TRIP_ID/VALIDATION_ERROR;
404 TRIP_NOT_FOUND, SHIPMENT_NOT_FOUND; 409 INVALID_TRIP_STATUS_TRANSITION,
TRIP_HAS_ACTIVE_SHIPMENTS; duplicate membership fallback SHIPMENT_ALREADY_IN_TRIP.

## Reports

All five report endpoints require Operations despite the `/admin` path segment.
No body. Success 200, `{success:true,data:{...metric keys below...}}`, without
message/count wrappers. Database failure is an error, not an empty report.
Percentages/averages round to two decimals; denominator zero yields 0.

Date-filtered reports accept optional from/to strings: valid ISO date-only or timestamp
with explicit timezone (Z or +/-HH:MM). Bounds inclusive; date-only to includes the
whole UTC day through 23:59:59.999Z. from must not exceed the effective to bound.
Example: `?from=2026-09-01&to=2026-09-30`. Invalid filters return 400 VALIDATION_ERROR.
Fleet/driver reports do not apply date filters. Unexpected failures return SERVER_ERROR.

### GET /api/admin/reports/fleet-utilization

Query: none. Success data example (empty database):

```json
{"totalVehicles":0,"operationalVehicles":0,"availableVehicles":0,"assignedVehicles":0,"maintenanceVehicles":0,"inactiveVehicles":0,"utilizedVehicles":0,"utilizationPercentage":0}
```

Total counts all vehicles. operationalVehicles = totalVehicles - inactiveVehicles;
maintenance stays in this project's operational denominator. utilizedVehicles equals
assignedVehicles. utilizationPercentage = assigned / operational * 100.

### GET /api/admin/reports/driver-workload

Query: none. Success data example:

```json
{"totalDrivers":0,"availableDrivers":0,"busyDrivers":0,"driversWithVehicle":0,"driversWithoutVehicle":0}
```

availableDrivers counts isAvailable true; busyDrivers is the existing field name for
isAvailable false (paused/unavailable), NOT drivers with active shipments.
driversWithVehicle counts non-null profile vehicle links; without = total - with.
This report does not filter inactive accounts or validate vehicle availability.

### GET /api/admin/reports/shipments

Query: from/to on bookedAt. Success data example:

```json
{"totalShipments":0,"byStatus":{"BOOKED":0,"ASSIGNED":0,"PICKED_UP":0,"IN_TRANSIT":0,"DELIVERED":0,"FAILED":0},"pendingShipments":0,"activeShipments":0,"terminalShipments":0}
```

pending = BOOKED; active = ASSIGNED + PICKED_UP + IN_TRANSIT;
terminal = DELIVERED + FAILED. Every canonical status remains present at zero.

### GET /api/admin/reports/delivery-performance

Query: from/to on bookedAt, NOT completion date. Only DELIVERED/FAILED attempts counted.
Success data example:

```json
{"totalCompletedAttempts":0,"deliveredShipments":0,"failedShipments":0,"onTimeDelivered":0,"validDurationCount":0,"averageDeliveryDurationHours":0,"deliverySuccessPercentage":0,"onTimeDeliveryPercentage":0,"deliverySlaHours":48}
```

totalCompletedAttempts = delivered + failed. deliverySuccessPercentage = delivered /
totalCompletedAttempts * 100. Duration = (deliveryProof.deliveredAt - bookedAt) in
hours, only for delivered records with valid nonnegative date differences.
onTimeDelivered counts valid durations <= 48 hours (fixed academic SLA).
onTimeDeliveryPercentage = onTimeDelivered / all delivered * 100.
Average uses validDurationCount only. Missing/invalid timestamps stay in delivered
denominator but are neither on-time nor included in the average; zero valid durations
gives average 0. No promised-delivery timestamp is modeled.

### GET /api/admin/reports/trips

Query: from/to on Trip.date. Success data example:

```json
{"totalTrips":0,"plannedTrips":0,"activeTrips":0,"completedTrips":0,"cancelledTrips":0,"averageShipmentsPerTrip":0}
```

Average = sum of shipmentIds array lengths across matching trips / totalTrips.
Counts include all trip statuses. It is not a count of distinct shipments across trips.

## Error contract and module catalog

Standard response:

```json
{"success":false,"message":"Total active shipment weight exceeds vehicle capacity","errorCode":"VEHICLE_CAPACITY_EXCEEDED"}
```

Validation response (400):

```json
{"success":false,"message":"Validation failed","errorCode":"VALIDATION_ERROR","errors":[{"field":"weight","message":"Weight must be a number greater than zero"}]}
```

`errors` is optional; items contain field and message, never submitted values.
Whole-body errors can use an empty field name. Mongoose validation/cast fallback
uses VALIDATION_ERROR without the array. Match errorCode plus HTTP status, not exact
message wording. All endpoints can fail unexpectedly with 500 SERVER_ERROR and a
generic message; no response stacks, raw MongoDB errors, hashes, or secrets.

| Group | HTTP | Codes and meaning |
| --- | --- | --- |
| Shared | 400 | VALIDATION_ERROR; INVALID_JSON for malformed JSON |
| Shared | 401 | UNAUTHORIZED for authentication failure |
| Shared | 403 | FORBIDDEN for role/customer ownership rejection |
| Shared | 404 | ROUTE_NOT_FOUND for unknown/unmounted path |
| Shared | 409 | DUPLICATE_RESOURCE generic duplicate-key fallback |
| Shared | 4xx | REQUEST_ERROR fallback for other operational/parser errors (e.g. oversized body 413) |
| Shared | 500 | SERVER_ERROR unexpected error, including reports/configuration/database |
| Auth | 401 | INVALID_CREDENTIALS; ACCOUNT_INACTIVE on login |
| Auth | 409 | EMAIL_ALREADY_EXISTS |
| Auth defensive guard | 403 | FORBIDDEN_ROLE (public route normally returns validation 400 first) |
| Vehicle | 400 / 404 | INVALID_VEHICLE_ID / VEHICLE_NOT_FOUND |
| Vehicle | 409 | VEHICLE_ALREADY_EXISTS (registration); VEHICLE_ASSIGNED; VEHICLE_HAS_DRIVER; VEHICLE_CONFLICT; INVALID_STATUS_TRANSITION |
| Driver | 400 / 404 | INVALID_DRIVER_ID / DRIVER_PROFILE_NOT_FOUND, USER_NOT_FOUND |
| Driver | 409 | USER_NOT_DRIVER; DRIVER_PROFILE_ALREADY_EXISTS; LICENSE_ALREADY_EXISTS; DRIVER_ALREADY_HAS_VEHICLE; DRIVER_HAS_NO_VEHICLE; VEHICLE_ALREADY_LINKED |
| Link/dispatch | 409 | VEHICLE_INACTIVE; VEHICLE_MAINTENANCE; VEHICLE_UNAVAILABLE; VEHICLE_ASSIGNED |
| Dispatch | 409 | SHIPMENT_NOT_BOOKABLE; SHIPMENT_ALREADY_ASSIGNED; DRIVER_UNAVAILABLE; DRIVER_ACCOUNT_INACTIVE; DRIVER_VEHICLE_MISMATCH; VEHICLE_CAPACITY_EXCEEDED |
| Shipment | 400 / 404 | INVALID_SHIPMENT_ID, INVALID_PRICING_INPUT / SHIPMENT_NOT_FOUND |
| Shipment ownership | 403 | SHIPMENT_NOT_ASSIGNED_TO_DRIVER |
| Shipment workflow | 409 | INVALID_STATUS_TRANSITION; ASSIGNED_VEHICLE_NOT_FOUND |
| Proof | 409 / 404 | DELIVERY_NOT_COMPLETED / DELIVERY_PROOF_NOT_FOUND |
| Proof defensive guard | 400 | DELIVERY_RECEIVER_REQUIRED (route normally returns validation 400 first) |
| Trip | 400 / 404 | INVALID_TRIP_ID / TRIP_NOT_FOUND |
| Trip | 409 | SHIPMENT_ASSIGNMENT_MISMATCH; SHIPMENT_NOT_ELIGIBLE_FOR_TRIP; SHIPMENT_ALREADY_IN_TRIP; INVALID_TRIP_STATUS_TRANSITION; TRIP_HAS_ACTIVE_SHIPMENTS |

Missing related driver/vehicle/shipment errors retain their resource code across
modules. No REPORT_GENERATION_FAILED code is emitted. No endpoint was renamed and
no response shape changed during Phase 14. Differences such as populated references,
status/currentStatus, optional messages, and absent delete data are documented above.

## Integration, scope, and verification

See [frontend-integration.md](frontend-integration.md) for environment, CORS, auth,
dashboard endpoint mapping, and runtime limitations. See [backend-audit.md](backend-audit.md)
for the manual transaction-capable MongoDB acceptance checklist.

`npm test` runs database-free module/syntax, route-document inventory, enum/workflow,
validator, privacy, CORS, and HTTP smoke checks. Tests verify explicit endpoint
headings against mounted route modules; implicit Express HEAD/OPTIONS handling is
transport behavior, not additional business endpoints. Literal routes precede generic
IDs; method/segment-specific paths are not shadowed. `/api/test` is unmounted.
Source/contract checks do not prove live aggregation, ownership queries, transactions,
concurrency, or index enforcement. API Contract v1 freezes the documented interface;
production readiness still requires those runtime tests.
