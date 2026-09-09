const test = require("node:test");
const assert = require("node:assert/strict");

// Inspect real Mongoose schemas without connecting or creating stored records.
test("v1 fields and relationship targets survive model merges", () => {
  const fields = {
    User: "name email passwordHash role isActive createdAt updatedAt",
    Vehicle: "registrationNumber type capacity status currentDriverId createdAt updatedAt",
    Driver: "userId licenseNumber phone vehicleId isAvailable createdAt updatedAt",
    Shipment: "customerId pickupAddress dropAddress weight distance status assignedDriverId assignedVehicleId estimatedCost deliveryProof bookedAt createdAt updatedAt",
    StatusHistory: "shipmentId status timestamp location note updatedBy",
    Trip: "driverId vehicleId shipmentIds date status createdAt updatedAt",
  };
  for (const [name, names] of Object.entries(fields)) {
    const { schema } = require(`../models/${name}`);
    for (const field of names.split(" ")) assert.ok(schema.path(field), `${name}.${field}`);
  }
  for (const [name, field, ref] of [
    ["Driver", "userId", "User"], ["Driver", "vehicleId", "Vehicle"],
    ["Vehicle", "currentDriverId", "Driver"], ["Shipment", "customerId", "User"],
    ["Shipment", "assignedDriverId", "Driver"], ["Shipment", "assignedVehicleId", "Vehicle"],
    ["StatusHistory", "shipmentId", "Shipment"], ["StatusHistory", "updatedBy", "User"],
    ["Trip", "driverId", "Driver"], ["Trip", "vehicleId", "Vehicle"],
  ]) assert.equal(require(`../models/${name}`).schema.path(field).options.ref, ref);
  const trip = require("../models/Trip").schema;
  assert.equal(trip.path("shipmentIds").getEmbeddedSchemaType().options.ref, "Shipment");
  const shipment = require("../models/Shipment").schema;
  assert.equal(shipment.path("cost"), undefined);
  assert.equal(shipment.path("deliveredAt"), undefined);
  const proof = shipment.path("deliveryProof").schema;
  assert.deepEqual(Object.keys(proof.paths).sort(), ["deliveredAt", "deliveryNotes", "receiverName"]);
  const history = require("../models/StatusHistory").schema;
  assert.equal(history.path("createdAt"), undefined);
  assert.deepEqual(history.path("status").enumValues, require("../utils/constants").SHIPMENT_STATUSES);
});

test("v1 defaults, password exclusion and declared uniqueness remain intact", () => {
  const user = require("../models/User").schema;
  assert.equal(user.path("passwordHash").options.select, false);
  assert.equal(user.path("isActive").defaultValue, true);
  assert.equal(require("../models/Shipment").schema.path("status").defaultValue, "BOOKED");
  assert.equal(require("../models/Trip").schema.path("status").defaultValue, "planned");
  for (const [name, field] of [["User", "email"], ["Vehicle", "registrationNumber"],
    ["Driver", "userId"], ["Driver", "licenseNumber"]]) {
    assert.ok(require(`../models/${name}`).schema.indexes().some(([keys, options]) => keys[field] === 1 && options.unique));
  }
  const liveTripIndex = require("../models/Trip").schema.indexes().find(([keys]) => keys.shipmentIds === 1);
  assert.equal(liveTripIndex[1].unique, true);
  assert.deepEqual(liveTripIndex[1].partialFilterExpression, { status: { $in: ["planned", "active"] } });
});
