import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { client } from '../src/api/client.js'
import * as storage from '../src/utils/storage.js'
import { createAuthSession } from '../src/context/authSession.js'
import * as constants from '../src/utils/constants.js'
import { formatCurrency, formatDateTime, formatStatus, formatVehicleType } from '../src/utils/formatters.js'

const values = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
} })
const cases = [
  {
    "module": "authApi",
    "fn": "register",
    "method": "post",
    "url": "/auth/register",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "authApi",
    "fn": "login",
    "method": "post",
    "url": "/auth/login",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "authApi",
    "fn": "getMe",
    "method": "get",
    "url": "/auth/me",
    "args": [
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "estimateShipment",
    "method": "post",
    "url": "/shipments/estimate",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "createShipment",
    "method": "post",
    "url": "/shipments",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "getMyShipments",
    "method": "get",
    "url": "/shipments/my",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "getDriverShipments",
    "method": "get",
    "url": "/shipments/driver/my",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "getAllShipments",
    "method": "get",
    "url": "/shipments",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "assignShipment",
    "method": "put",
    "url": "/shipments/:id/assign",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "updateShipmentStatus",
    "method": "put",
    "url": "/shipments/:id/status",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "getShipmentHistory",
    "method": "get",
    "url": "/shipments/:id/history",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "trackShipment",
    "method": "get",
    "url": "/shipments/:id/track",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "getDeliveryProof",
    "method": "get",
    "url": "/shipments/:id/proof",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "shipmentApi",
    "fn": "getShipmentById",
    "method": "get",
    "url": "/shipments/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "vehicleApi",
    "fn": "createVehicle",
    "method": "post",
    "url": "/vehicles",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "vehicleApi",
    "fn": "getVehicles",
    "method": "get",
    "url": "/vehicles",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "vehicleApi",
    "fn": "getVehicle",
    "method": "get",
    "url": "/vehicles/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "vehicleApi",
    "fn": "updateVehicle",
    "method": "put",
    "url": "/vehicles/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "vehicleApi",
    "fn": "deactivateVehicle",
    "method": "delete",
    "url": "/vehicles/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa"
    ]
  },
  {
    "module": "driverApi",
    "fn": "createDriver",
    "method": "post",
    "url": "/drivers",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "driverApi",
    "fn": "getDrivers",
    "method": "get",
    "url": "/drivers",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "driverApi",
    "fn": "getAvailableDrivers",
    "method": "get",
    "url": "/drivers/available",
    "args": [
      null
    ]
  },
  {
    "module": "driverApi",
    "fn": "getMyDriverProfile",
    "method": "get",
    "url": "/drivers/me/profile",
    "args": [
      null
    ]
  },
  {
    "module": "driverApi",
    "fn": "getDriver",
    "method": "get",
    "url": "/drivers/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "driverApi",
    "fn": "updateDriver",
    "method": "put",
    "url": "/drivers/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "driverApi",
    "fn": "assignVehicle",
    "method": "put",
    "url": "/drivers/:id/vehicle",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "driverApi",
    "fn": "unassignVehicle",
    "method": "delete",
    "url": "/drivers/:id/vehicle",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa"
    ]
  },
  {
    "module": "tripApi",
    "fn": "createTrip",
    "method": "post",
    "url": "/trips",
    "args": [
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "tripApi",
    "fn": "getTrips",
    "method": "get",
    "url": "/trips",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "tripApi",
    "fn": "getMyTrips",
    "method": "get",
    "url": "/trips/my",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "tripApi",
    "fn": "getTrip",
    "method": "get",
    "url": "/trips/:id",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      null
    ]
  },
  {
    "module": "tripApi",
    "fn": "updateTripStatus",
    "method": "put",
    "url": "/trips/:id/status",
    "args": [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      {
        "status": "active"
      }
    ]
  },
  {
    "module": "reportApi",
    "fn": "getFleetUtilization",
    "method": "get",
    "url": "/admin/reports/fleet-utilization",
    "args": [
      null
    ]
  },
  {
    "module": "reportApi",
    "fn": "getDriverWorkload",
    "method": "get",
    "url": "/admin/reports/driver-workload",
    "args": [
      null
    ]
  },
  {
    "module": "reportApi",
    "fn": "getShipmentSummary",
    "method": "get",
    "url": "/admin/reports/shipments",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "reportApi",
    "fn": "getDeliveryPerformance",
    "method": "get",
    "url": "/admin/reports/delivery-performance",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  },
  {
    "module": "reportApi",
    "fn": "getTripSummary",
    "method": "get",
    "url": "/admin/reports/trips",
    "args": [
      {
        "status": "planned"
      },
      null
    ]
  }
]
// Isolated response fixtures only: these tests never create accounts or contact MongoDB.
const account = { _id: 'a'.repeat(24), name: 'Unit test', email: 'unit@example.invalid', role: 'customer', isActive: true }
const response = { success: true, data: { user: account } }

test('all 37 API wrappers match frozen contract routes and preserve the response envelope', async () => {
  values.clear()
  const routes = []
  const adapter = client.defaults.adapter
  try {
    for (const item of cases) {
      const envelope = { success: true, count: 0, data: {} }
      client.defaults.adapter = async (config) => {
        assert.equal(config.method, item.method)
        assert.equal(config.url, item.url.replace(':id', 'a'.repeat(24)))
        if (item.args.some(value => value?.status === 'planned')) assert.deepEqual(config.params, { status: 'planned' })
        if (item.args.some(value => value?.status === 'active')) assert.deepEqual(JSON.parse(config.data), { status: 'active' })
        return { status: 200, data: envelope, config, headers: {} }
      }
      const api = await import('../src/api/' + item.module + '.js')
      assert.equal(await api[item.fn](...item.args.map(arg => arg === null ? undefined : arg)), envelope)
      routes.push(item.method.toUpperCase() + ' /api' + item.url)
    }
    const doc = fs.readFileSync(new URL('../../backend/docs/api-contract.md', import.meta.url), 'utf8')
    const expected = [...doc.matchAll(/^### ((?:GET|POST|PUT|DELETE) \/api\/[^\r\n]+)/gm)].map(match => match[1]).filter(route => route !== 'GET /api/health')
    assert.deepEqual(routes.sort(), expected.sort())
  } finally { client.defaults.adapter = adapter }
})

test('interceptors attach tokens, clear current 401s, preserve 403 and newer sessions', async () => {
  const adapter = client.defaults.adapter
  const reject = (config, status) => Promise.reject({ config, response: { status, data: { errorCode: 'TEST_ONLY' } } })
  try {
    storage.setToken('unit-token')
    client.defaults.adapter = (config) => {
      assert.equal(config.headers.get('Authorization'), 'Bearer unit-token')
      return reject(config, 403)
    }
    await assert.rejects(client.get('/auth/me'))
    assert.equal(storage.getToken(), 'unit-token')
    client.defaults.adapter = (config) => reject(config, 401)
    await assert.rejects(client.get('/auth/me'))
    assert.equal(storage.getToken(), null)

    storage.setToken('old-unit-token')
    client.defaults.adapter = (config) => { storage.setToken('new-unit-token'); return reject(config, 401) }
    await assert.rejects(client.get('/auth/me'))
    assert.equal(storage.getToken(), 'new-unit-token')

    client.defaults.adapter = (config) => {
      assert.equal(config.headers.get('Authorization'), undefined)
      return reject(config, 401)
    }
    await assert.rejects(client.post('/auth/login', {}, { skipAuth: true }))
    assert.equal(storage.getToken(), 'new-unit-token')
  } finally { client.defaults.adapter = adapter; storage.clearAuthStorage() }
})

test('storage strips sensitive fields and tolerates malformed cached user data', () => {
  values.clear()
  storage.setStoredUser({ ...account, password: 'discard', passwordHash: 'discard', token: 'discard' })
  assert.deepEqual(storage.getStoredUser(), account)
  values.set('logistics_user', '{broken')
  assert.equal(storage.getStoredUser(), null)
  storage.clearAuthStorage()
  assert.equal(storage.getToken(), null)
})

test('startup trusts /me rather than cached role; temporary failure is retryable; 401 clears auth', async () => {
  values.clear()
  let calls = 0
  const noToken = createAuthSession({ getMe: async () => { calls += 1 } })
  await noToken.refreshCurrentUser()
  assert.equal(calls, 0)
  assert.equal(noToken.getSnapshot().isLoading, false)
  storage.setToken('unit-token')
  storage.setStoredUser({ ...account, role: 'admin' })
  const session = createAuthSession({ getMe: async () => response })
  assert.equal(session.getSnapshot().isAuthenticated, false)
  await session.refreshCurrentUser()
  assert.equal(session.getSnapshot().user.role, 'customer')
  assert.equal(session.getSnapshot().isAuthenticated, true)
  const unavailable = createAuthSession({ getMe: async () => { throw new Error('Offline') } })
  await unavailable.refreshCurrentUser()
  assert.equal(storage.getToken(), 'unit-token')
  assert.equal(unavailable.getSnapshot().isAuthenticated, false)
  assert.equal(unavailable.getSnapshot().error, 'Offline')
  const expired = createAuthSession({ getMe: async () => { throw { response: { status: 401 } } } })
  await expired.refreshCurrentUser()
  assert.equal(storage.getToken(), null)
  assert.equal(expired.getSnapshot().user, null)
})

test('logout and a newer login prevent stale /me from restoring an old identity', async () => {
  storage.setToken('old-unit-token')
  let complete
  const session = createAuthSession({
    getMe: () => new Promise(resolve => { complete = resolve }),
    login: async () => ({ success: true, data: { token: 'new-unit-token', user: account } }),
  })
  const pending = session.refreshCurrentUser()
  session.logout()
  complete(response)
  await pending
  assert.equal(session.getSnapshot().isAuthenticated, false)
  storage.setToken('old-unit-token')
  const pendingAgain = session.refreshCurrentUser()
  await session.login({})
  complete({ success: true, data: { user: { ...account, role: 'admin' } } })
  await pendingAgain
  assert.equal(session.getSnapshot().user.role, 'customer')
  assert.equal(session.getSnapshot().token, 'new-unit-token')
  session.logout()
})

test('frontend canonical enums match backend and formatting is centralized', () => {
  const backend = createRequire(import.meta.url)('../../backend/utils/constants.js')
  for (const key of ['USER_ROLES', 'SHIPMENT_STATUSES', 'VEHICLE_STATUSES', 'VEHICLE_TYPES', 'TRIP_STATUSES']) assert.deepEqual(constants[key], backend[key])
  assert.equal(constants.getDashboardPath('dispatcher'), '/operations/dashboard')
  assert.equal(constants.getDashboardPath('admin'), '/operations/dashboard')
  assert.equal(constants.getDashboardPath('driver'), '/driver/dashboard')
  assert.equal(constants.getDashboardPath('customer'), '/customer/dashboard')
  assert.equal(constants.getDashboardPath('unknown'), '/unauthorized')
  assert.match(formatCurrency(350), /350\.00/)
  assert.equal(formatCurrency(null), '—')
  assert.equal(formatDateTime('invalid'), '—')
  assert.equal(formatStatus('PICKED_UP'), 'Picked up')
  assert.equal(formatVehicleType('mini_truck'), 'Mini truck')
})
