const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");
const { validationResult } = require("express-validator");
const root = path.resolve(__dirname, "..");
const contract = fs.readFileSync(path.join(root, "docs/api-contract.md"), "utf8");
const enumsDoc = fs.readFileSync(path.join(root, "docs/enums.md"), "utf8");
const constants = require("../utils/constants");
const sections = new Map([...contract.matchAll(/^### ((?:GET|POST|PUT|DELETE) \/api\/[^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)]
  .map(match => [match[1], match[2]]));

test("documented inventory exactly matches actual mounted application routes and exports", () => {
  const app = require("../server");
  const source = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const actual = [];
  const mounted = [];
  for (const [, prefix, variable] of source.matchAll(/app\.use\("(\/api\/[^\"]+)", (\w+)\)/g)) {
    const importMatch = source.match(new RegExp(`const ${variable} = require\\("([^\"]+)"\\)`));
    assert.ok(importMatch, variable);
    const router = require(path.resolve(root, importMatch[1]));
    assert.ok(app.router.stack.some(layer => layer.handle === router), `${prefix} is not mounted`);
    mounted.push(router);
    const earlier = [];
    for (const layer of router.stack) {
      assert.equal(typeof layer.handle, "function");
      if (!layer.route) continue;
      const route = layer.route;
      assert.match(route.path, /^\/(?:[A-Za-z0-9_:-]+(?:\/[A-Za-z0-9_:-]+)*)?$/);
      for (const handler of route.stack) assert.equal(typeof handler.handle, "function");
      for (const method of Object.keys(route.methods)) {
        const key = `${method.toUpperCase()} ${prefix}${route.path === "/" ? "" : route.path}`;
        assert.ok(!actual.includes(key), `Duplicate route: ${key}`);
        // Earlier terminal routes with the same method must not shadow literals.
        for (const previous of earlier.filter(item => item.method === method)) {
          const pattern = new RegExp(`^${previous.path.replace(/:[^/]+/g, "[^/]+")}$`, "i");
          if (!route.path.includes(":")) assert.ok(!pattern.test(route.path), `Shadowed route: ${key}`);
        }
        earlier.push({ method, path: route.path });
        actual.push(key);
      }
    }
    const routeSource = fs.readFileSync(path.resolve(root, importMatch[1] + ".js"), "utf8");
    for (const [, names, reference] of routeSource.matchAll(/const \{([^}]+)\} = require\("([^\"]+)"\)/g)) {
      const exports = require(path.resolve(root, "routes", reference));
      for (const name of names.split(",").map(value => value.trim())) {
        assert.ok(Object.hasOwn(exports, name), `${reference} missing ${name}`);
      }
    }
    for (const [, role] of routeSource.matchAll(/USER_ROLES\.([A-Z_]+)/g)) {
      assert.ok(Object.hasOwn(constants.USER_ROLES, role), `Unknown role ${role}`);
    }
  }
  for (const layer of app.router.stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) actual.push(`${method.toUpperCase()} ${layer.route.path}`);
    } else if (layer.handle.stack) {
      assert.ok(mounted.includes(layer.handle), "Undocumented mounted router");
    }
  }
  const documented = [...contract.matchAll(/^### ((?:GET|POST|PUT|DELETE) \/api\/[^\n]+)$/gm)].map(match => match[1]);
  assert.equal(new Set(documented).size, documented.length, "Repeated documentation endpoint");
  assert.equal(actual.length, 38);
  assert.deepEqual(documented.sort(), actual.sort());
  assert.equal(sections.size, 38);
});

test("documented enums and workflow tables agree with constants, schemas, and transition helpers", () => {
  const documented = JSON.parse(enumsDoc.match(/```json\n([\s\S]*?)\n```/)[1]);
  for (const [name, values] of Object.entries(documented)) assert.deepEqual(values, constants[name], name);
  for (const [model, field, key] of [["User", "role", "USER_ROLES"], ["Shipment", "status", "SHIPMENT_STATUSES"],
    ["Vehicle", "status", "VEHICLE_STATUSES"], ["Vehicle", "type", "VEHICLE_TYPES"], ["Trip", "status", "TRIP_STATUSES"]]) {
    assert.deepEqual(require(`../models/${model}`).schema.path(field).enumValues, Object.values(documented[key]));
  }
  const { isValidTransition } = require("../services/shipmentWorkflowService");
  const { isValidTripTransition } = require("../controllers/tripController");
  for (const [heading, statuses, transition] of [["Shipment", constants.SHIPMENT_STATUSES, isValidTransition],
    ["Trip", constants.TRIP_STATUSES, isValidTripTransition]]) {
    const table = enumsDoc.split(`## ${heading} transitions\n`)[1].split("\n## ")[0];
    for (const from of statuses) {
      const row = table.match(new RegExp(`\\| ${from} \\| ([^|]+)\\|`));
      assert.ok(row, from);
      const next = row[1].replace(/\([^)]*\)/g, "").trim().split(/,\s*/);
      for (const to of statuses) assert.equal(transition(from, to), next.includes(to), `${from} -> ${to}`);
    }
  }
});

test("documented JSON examples parse and write examples pass the actual route validators", async () => {
  for (const [, json] of contract.matchAll(/```json\n([\s\S]*?)\n```/g)) JSON.parse(json);
  for (const [endpoint, moduleName, exportName] of [
    ["POST /api/auth/register", "auth", "registerValidators"],
    ["POST /api/auth/login", "auth", "loginValidators"],
    ["POST /api/vehicles", "vehicle", "createVehicleValidators"],
    ["PUT /api/vehicles/:id", "vehicle", "updateVehicleValidators"],
    ["POST /api/drivers", "driver", "createDriverValidators"],
    ["PUT /api/drivers/:id", "driver", "updateDriverValidators"],
    ["PUT /api/drivers/:id/vehicle", "driver", "assignVehicleValidators"],
    ["POST /api/shipments/estimate", "shipment", "estimateValidators"],
    ["POST /api/shipments", "shipment", "createShipmentValidators"],
    ["PUT /api/shipments/:id/assign", "shipment", "assignmentValidators"],
    ["POST /api/trips", "trip", "createTripValidators"],
    ["PUT /api/trips/:id/status", "trip", "updateTripStatusValidators"],
  ]) {
    const json = sections.get(endpoint).match(/```json\n([\s\S]*?)\n```/)[1];
    const req = { body: JSON.parse(json) };
    for (const validator of require(`../middleware/${moduleName}Validators`)[exportName]) await validator.run(req);
    assert.deepEqual(validationResult(req).array(), [], endpoint);
  }
  for (const [, json] of sections.get("PUT /api/shipments/:id/status").matchAll(/```json\n([\s\S]*?)\n```/g)) {
    const req = { body: JSON.parse(json) };
    for (const validator of require("../middleware/shipmentValidators").statusUpdateValidators) await validator.run(req);
    assert.deepEqual(validationResult(req).array(), []);
  }
  const { calculateShipmentCost } = require("../services/pricingService");
  assert.equal(calculateShipmentCost(12, 20), 350);
  assert.equal(calculateShipmentCost(8, 18), 280);
});

test("documented query examples pass validators and ownership filters cannot override identity", async () => {
  for (const [moduleName, exportName, query, valid] of [
    ["vehicle", "vehicleFilterValidators", { status: "available", type: "van" }, true],
    ["driver", "driverFilterValidators", { available: "true", vehicleAssigned: "false" }, true],
    ["shipment", "allShipmentValidators", { status: "BOOKED", customerId: "a".repeat(24) }, true],
    ["shipment", "myShipmentValidators", { customerId: "a".repeat(24) }, false],
    ["shipment", "driverShipmentValidators", { status: "BOOKED" }, false],
    ["trip", "tripFilterValidators", { status: "planned", driverId: "d".repeat(24), vehicleId: "c".repeat(24) }, true],
    ["trip", "myTripValidators", { driverId: "d".repeat(24) }, false],
    ["report", "reportValidators", { from: "2026-09-01", to: "2026-09-30" }, true],
  ]) {
    const req = { query };
    for (const validator of require(`../middleware/${moduleName}Validators`)[exportName]) await validator.run(req);
    assert.equal(validationResult(req).isEmpty(), valid, exportName);
  }
});

test("real app CORS supports configured origin/preflight and avoids a production wildcard", async () => {
  const previous = { CLIENT_URL: process.env.CLIENT_URL, NODE_ENV: process.env.NODE_ENV };
  try {
    for (const [mode, client, expected] of [
      ["development", "", "http://localhost:5173"],
      ["development", "http://localhost:3000", "http://localhost:3000"],
      ["production", "https://fleet.example.com", "https://fleet.example.com"],
      ["production", "", null],
    ]) {
      process.env.CLIENT_URL = client;
      process.env.NODE_ENV = mode;
      delete require.cache[require.resolve("../server")];
      const app = require("../server");
      const server = app.listen(0, "127.0.0.1");
      await once(server, "listening");
      try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const origin = expected || "https://fleet.example.com";
        const health = await fetch(base + "/api/health", { headers: { Origin: origin } });
        assert.equal(health.status, 200);
        assert.equal(health.headers.get("access-control-allow-origin"), expected);
        assert.equal(health.headers.get("access-control-allow-credentials"), null);
        const other = await fetch(base + "/api/health", { headers: { Origin: "https://unrelated.example.com" } });
        assert.notEqual(other.headers.get("access-control-allow-origin"), "https://unrelated.example.com");
        assert.notEqual(other.headers.get("access-control-allow-origin"), "*");
        const direct = await fetch(base + "/api/auth/me");
        assert.equal(direct.status, 401, "Non-browser access still reaches authentication");
        if (expected) {
          const preflight = await fetch(base + "/api/shipments/estimate", { method: "OPTIONS", headers: {
            Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type",
          } });
          assert.equal(preflight.status, 204);
          assert.equal(preflight.headers.get("access-control-allow-origin"), expected);
          assert.match(preflight.headers.get("access-control-allow-headers"), /authorization/i);
          assert.match(preflight.headers.get("access-control-allow-headers"), /content-type/i);
        }
      } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    delete require.cache[require.resolve("../server")];
  }
});
