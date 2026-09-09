const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const { validationResult } = require("express-validator");
const root = path.resolve(__dirname, "..");

test("all backend modules import and pass syntax checks without a database", () => {
  for (const folder of ["config", "controllers", "middleware", "models", "routes", "services", "utils"]) {
    for (const file of fs.readdirSync(path.join(root, folder)).filter(file => file.endsWith(".js"))) {
      const absolute = path.join(root, folder, file);
      assert.equal(spawnSync(process.execPath, ["--check", absolute]).status, 0, absolute);
      require(absolute);
    }
  }
  assert.equal(require("mongoose").connection.readyState, 0);
  assert.equal(spawnSync(process.execPath, ["--check", path.join(root, "server.js")]).status, 0);
  assert.equal(typeof require("../server"), "function");
  assert.equal(require("mongoose").connection.readyState, 0);
});

test("model filenames and relative imports match exact disk and Git index casing", () => {
  const expected = ["Driver.js", "Shipment.js", "StatusHistory.js", "Trip.js", "User.js", "Vehicle.js"];
  assert.deepEqual(fs.readdirSync(path.join(root, "models")).sort(), expected);
  const indexed = spawnSync("git", ["ls-files", "--", "models"], { cwd: root, encoding: "utf8" });
  assert.equal(indexed.status, 0, indexed.stderr);
  assert.deepEqual(indexed.stdout.trim().split(/\r?\n/).map(file => path.posix.basename(file)).sort(), expected);
  for (const folder of ["controllers", "middleware", "models", "routes", "services", "utils"]) {
    for (const file of fs.readdirSync(path.join(root, folder)).filter(file => file.endsWith(".js"))) {
      const source = fs.readFileSync(path.join(root, folder, file), "utf8");
      for (const [, reference] of source.matchAll(/require\(["'](\.[^"']+)["']\)/g)) {
        const target = path.resolve(root, folder, reference + (path.extname(reference) ? "" : ".js"));
        assert.ok(fs.readdirSync(path.dirname(target)).includes(path.basename(target)), `${file}: ${reference}`);
      }
    }
  }
});

test("malformed resource IDs return 400 before any database access", () => {
  for (const resource of ["driver", "vehicle", "shipment", "trip"]) {
    const name = resource[0].toUpperCase() + resource.slice(1);
    const validate = require(`../middleware/${resource}Validators`)[`validate${name}Id`];
    for (const id of ["bad", "123456789012", "z".repeat(24)]) {
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
      validate({ params: { id } }, res, () => assert.fail("Malformed ID passed validation"));
      assert.equal(res.code, 400);
    }
    let passed = false;
    validate({ params: { id: "abcdefabcdefabcdefabcdef" } }, {}, () => { passed = true; });
    assert.equal(passed, true);
  }
});

test("pricing, all workflow transitions, report formulas, and combined capacity", () => {
  const { calculateShipmentCost } = require("../services/pricingService");
  for (const [weight, expected] of [[5, 50], [5.01, 100], [10, 100], [10.01, 150], [20, 150], [20.01, 250]]) {
    assert.equal(calculateShipmentCost(weight, 0), expected);
  }
  assert.equal(calculateShipmentCost(12, 20), 350);
  for (const value of [0, -1, NaN, Infinity, "12"]) assert.throws(() => calculateShipmentCost(value, 20));
  const { isValidTransition } = require("../services/shipmentWorkflowService");
  const statuses = require("../utils/constants").SHIPMENT_STATUSES;
  const edges = new Set(["BOOKED:ASSIGNED", "ASSIGNED:PICKED_UP", "PICKED_UP:IN_TRANSIT", "IN_TRANSIT:DELIVERED", "IN_TRANSIT:FAILED"]);
  for (const from of statuses) for (const to of statuses) assert.equal(isValidTransition(from, to), edges.has(`${from}:${to}`));
  const { isValidTripTransition } = require("../controllers/tripController");
  const tripEdges = new Set(["planned:active", "planned:cancelled", "active:completed", "active:cancelled"]);
  for (const from of ["planned", "active", "completed", "cancelled"]) {
    for (const to of ["planned", "active", "completed", "cancelled"]) assert.equal(isValidTripTransition(from, to), tripEdges.has(`${from}:${to}`));
  }
  const { percentage } = require("../controllers/reportController");
  assert.equal(percentage(7, 18), 38.89);
  assert.equal(percentage(92, 100), 92);
  assert.equal(percentage(80, 92), 86.96);
  assert.equal(percentage(0, 0), 0);
  const { fitsVehicleCapacity } = require("../services/dispatchService");
  assert.equal(fitsVehicleCapacity(200, 250, 500), true);
  assert.equal(fitsVehicleCapacity(450, 50, 500), true);
  assert.equal(fitsVehicleCapacity(450, 60, 500), false);
  assert.equal(fitsVehicleCapacity(Infinity, 1, 500), false);
});

test("validators reject protected fields, malformed IDs, invalid dates and missing proof", async () => {
  const auth = require("../middleware/authValidators");
  const vehicles = require("../middleware/vehicleValidators");
  const drivers = require("../middleware/driverValidators");
  const shipments = require("../middleware/shipmentValidators");
  const trips = require("../middleware/tripValidators");
  const reports = require("../middleware/reportValidators");
  const id = "abcdefabcdefabcdefabcdef";
  const cases = [
    [auth.registerValidators, { name: "Example", email: "test@example.com", password: "StrongPass123" }, true],
    ...["admin", "dispatcher"].map(role => [auth.registerValidators, { name: "Example", email: "test@example.com", password: "StrongPass123", role }, false]),
    [auth.registerValidators, { name: "Example", email: "test@example.com", password: "StrongPass123", isActive: true }, false],
    [auth.loginValidators, { email: "test@example.com", password: "x".repeat(73) }, false],
    [vehicles.updateVehicleValidators, { capacity: 0 }, false],
    [vehicles.updateVehicleValidators, { currentDriverId: null }, false],
    [drivers.updateDriverValidators, { vehicleId: id }, false],
    [drivers.updateDriverValidators, { userId: id }, false],
    [drivers.updateDriverValidators, { isAvailable: false }, true],
    [shipments.assignmentValidators, { driverId: "bad", vehicleId: id }, false],
    [shipments.assignmentValidators, { driverId: id, vehicleId: id, status: "ASSIGNED" }, false],
    [shipments.statusUpdateValidators, { status: "DELIVERED" }, false],
    [shipments.statusUpdateValidators, { status: "DELIVERED", receiverName: " Receiver " }, true],
    [shipments.statusUpdateValidators, { status: "FAILED", receiverName: "Receiver" }, false],
    [shipments.statusUpdateValidators, { status: "BOOKED" }, true],
    [shipments.statusUpdateValidators, { status: "ASSIGNED" }, true],
    [shipments.statusUpdateValidators, { status: "UNKNOWN" }, false],
    [shipments.statusUpdateValidators, { status: "DELIVERED", receiverName: "Receiver", deliveredAt: "2026-01-01" }, false],
    [shipments.statusUpdateValidators, undefined, false],
    [trips.createTripValidators, { driverId: id, vehicleId: id, shipmentIds: [id, id.toUpperCase()] }, false],
  ];
  for (const field of ["customerId", "status", "assignedDriverId", "assignedVehicleId", "estimatedCost", "bookedAt", "deliveredAt", "deliveryProof"]) {
    cases.push([shipments.createShipmentValidators, { pickupAddress: "Pickup address", dropAddress: "Drop address", weight: 1, distance: 1, [field]: "forbidden" }, false]);
  }
  for (const field of ["status", "createdAt", "updatedAt"]) {
    cases.push([trips.createTripValidators, { driverId: id, vehicleId: id, shipmentIds: [id], [field]: "forbidden" }, false]);
  }
  for (const [rules, body, valid] of cases) {
    const req = { body };
    for (const rule of rules) await rule.run(req);
    assert.equal(validationResult(req).isEmpty(), valid, JSON.stringify(body));
  }
  for (const [query, valid] of [[{}, true], [{ from: "2026-09-01", to: "2026-09-30" }, true],
    [{ from: "2026-10-01", to: "2026-09-30" }, false], [{ from: "2026-02-30" }, false],
    [{ from: "2026-09-01T12:00:00" }, false], [{ from: { $ne: null } }, false]]) {
    const req = { query };
    for (const rule of reports.reportValidators) await rule.run(req);
    assert.equal(validationResult(req).isEmpty(), valid);
  }
  assert.equal(reports.dateBound("2026-09-30", true).toISOString(), "2026-09-30T23:59:59.999Z");
});

test("JWT payload and missing-secret behavior; centralized error privacy", () => {
  const generateToken = require("../utils/generateToken");
  const jwt = require("jsonwebtoken");
  const previous = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => generateToken("abcdefabcdefabcdefabcdef"), /JWT_SECRET is not configured/);
    process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
    const payload = jwt.verify(generateToken("abcdefabcdefabcdefabcdef", "customer"), process.env.JWT_SECRET);
    assert.deepEqual(Object.keys(payload).sort(), ["exp", "iat", "role", "userId"]);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
  const { errorHandler } = require("../middleware/errorHandler");
  for (const [error, expectedStatus, expectedCode] of [
    [new Error("private database detail"), 500, "SERVER_ERROR"],
    [Object.assign(new Error("private report failure"), { errorCode: "REPORT_GENERATION_FAILED", expose: false }), 500, "SERVER_ERROR"],
    [Object.assign(new Error("private cast value"), { name: "CastError" }), 400, "VALIDATION_ERROR"],
    [Object.assign(new Error("private validation value"), { name: "ValidationError" }), 400, "VALIDATION_ERROR"],
    [Object.assign(new Error("private duplicate"), { code: 11000 }), 409, "DUPLICATE_RESOURCE"],
    [Object.assign(new Error("Capacity exceeded"), { statusCode: 409, errorCode: "VEHICLE_CAPACITY_EXCEEDED" }), 409, "VEHICLE_CAPACITY_EXCEEDED"],
  ]) {
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    errorHandler(error, {}, res, () => assert.fail());
    assert.equal(res.code, expectedStatus);
    assert.equal(res.body.errorCode, expectedCode);
    assert.ok(!JSON.stringify(res.body).includes("private"));
    assert.ok(!res.body.stack);
  }
});

test("actual server boot, all protected route mounts, JSON errors and removed test router", async () => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root, env: { ...process.env, PORT: "0", MONGO_URI: "", JWT_SECRET: crypto.randomBytes(48).toString("hex") },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", data => { output += data; });
  child.stderr.on("data", data => { output += data; });
  try {
    let port;
    for (let attempt = 0; attempt < 100; attempt++) {
      port = /Server running on port (\d+)/.exec(output)?.[1];
      if (port || child.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.ok(port, output);
    assert.match(output, /MongoDB is not configured yet/);
    const base = `http://localhost:${port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).success, true);
    for (const [group, file] of [["auth", "authRoutes"], ["vehicles", "vehicleRoutes"], ["drivers", "driverRoutes"],
      ["shipments", "shipmentRoutes"], ["trips", "tripRoutes"], ["admin/reports", "reportRoutes"]]) {
      const router = require(`../routes/${file}`);
      const paths = router.stack.filter(layer => layer.route).map(layer => layer.route.path);
      for (const literal of paths.filter(route => !route.includes(":"))) {
        if (paths.includes("/:id")) assert.ok(paths.indexOf(literal) < paths.indexOf("/:id"));
      }
      for (const layer of router.stack.filter(layer => layer.route)) {
        if (group === "auth" && layer.route.path !== "/me") continue;
        for (const method of Object.keys(layer.route.methods)) {
          const endpoint = `/api/${group}${layer.route.path === "/" ? "" : layer.route.path.replace(":id", "abcdefabcdefabcdefabcdef")}`;
          const response = await fetch(base + endpoint, { method: method.toUpperCase() });
          assert.equal(response.status, 401, endpoint);
          assert.equal((await response.json()).errorCode, "UNAUTHORIZED");
        }
      }
    }
    for (const endpoint of ["/api/test/customer", "/api/does-not-exist"]) {
      const response = await fetch(base + endpoint);
      assert.equal(response.status, 404);
      assert.equal((await response.json()).errorCode, "ROUTE_NOT_FOUND");
    }
    const badJson = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{broken" });
    assert.equal(badJson.status, 400);
    assert.equal((await badJson.json()).errorCode, "INVALID_JSON");
    const invalidJwt = await fetch(base + "/api/auth/me", { headers: { Authorization: "Bearer invalid" } });
    assert.equal(invalidJwt.status, 401);
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise(resolve => child.once("exit", resolve));
      child.kill();
      await exited;
    }
  }
});
