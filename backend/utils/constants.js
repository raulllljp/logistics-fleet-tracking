const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  DRIVER: "driver",
  DISPATCHER: "dispatcher",
  ADMIN: "admin",
});
const VEHICLE_TYPES = ["bike", "van", "mini_truck", "truck"];
const VEHICLE_STATUSES = ["available", "assigned", "maintenance", "inactive"];
const SHIPMENT_STATUSES = ["BOOKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"];
const TRIP_STATUSES = ["planned", "active", "completed", "cancelled"];

const DEFAULT_DELIVERY_SLA_HOURS = 48;
const ACTIVE_SHIPMENT_STATUSES = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

module.exports = { USER_ROLES, VEHICLE_TYPES, VEHICLE_STATUSES, SHIPMENT_STATUSES, TRIP_STATUSES, DEFAULT_DELIVERY_SLA_HOURS, ACTIVE_SHIPMENT_STATUSES };
