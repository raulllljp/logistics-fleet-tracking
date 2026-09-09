import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { bookingPayload, pricingPayload, validateBooking, shipmentFilter, shipmentError } from '../src/utils/customerShipments.js'
import { client } from '../src/api/client.js'
import { estimateShipment, createShipment, getMyShipments } from '../src/api/shipmentApi.js'

test('booking validation and API requests use typed allowed fields and canonical filters', async () => {
  const values = { pickupAddress: ' Pickup address ', dropAddress: ' Destination address ', weight: '8', distance: '0', customerId: 'forbidden', status: 'DELIVERED', estimatedCost: 1 }
  assert.deepEqual(validateBooking(values), {})
  assert.ok(validateBooking({ ...values, weight: '0' }).weight)
  assert.ok(validateBooking({ ...values, distance: '' }).distance)
  assert.ok(validateBooking({ ...values, distance: '-1' }).distance)
  assert.ok(validateBooking({ ...values, pickupAddress: ' ' }).pickupAddress)
  assert.deepEqual(validateBooking({ ...values, pickupAddress: '' }, true), {})
  const payload = bookingPayload(values)
  assert.deepEqual(payload, { pickupAddress: 'Pickup address', dropAddress: 'Destination address', weight: 8, distance: 0 })
  const previous = client.defaults.adapter
  const seen = []
  try {
    client.defaults.adapter = async config => {
      seen.push({ url: config.url, body: config.data ? JSON.parse(config.data) : undefined, params: config.params })
      return { config, status: 200, headers: {}, data: { success: true, data: { estimatedCost: 123 } } }
    }
    assert.equal((await estimateShipment(pricingPayload(values))).data.estimatedCost, 123)
    await createShipment(payload)
    await getMyShipments(shipmentFilter('IN_TRANSIT'))
    assert.deepEqual(seen[0].body, { weight: 8, distance: 0 })
    assert.deepEqual(seen[1].body, payload)
    assert.deepEqual(seen[2].params, { status: 'IN_TRANSIT' })
    assert.equal(shipmentFilter(''), undefined)
  } finally { client.defaults.adapter = previous }
  assert.match(shipmentError({ response: { data: { errorCode: 'FORBIDDEN' } } }), /does not have access/)
  assert.ok(!shipmentError({ message: 'private database error' }).includes('private'))
})

test('customer components render empty lists, actual chronological events, failure and read-only proof', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { ShipmentList, ShipmentTimeline, DeliveryProofCard } = await vite.ssrLoadModule('/src/components/common/ShipmentComponents.jsx')
    const render = (component, props) => renderToString(createElement(MemoryRouter, null, createElement(component, props)))
    assert.match(render(ShipmentList, { shipments: [] }), /No shipments yet/)
    assert.match(render(ShipmentList, { shipments: [], filtered: true }), /No shipments with this status/)
    // Isolated display fixtures only; never included in application data or saved.
    const history = [{ status: 'FAILED', timestamp: '2026-09-09T12:00:00Z', note: 'Recipient unavailable' }, { status: 'BOOKED', timestamp: '2026-09-09T10:00:00Z' }]
    const failed = render(ShipmentTimeline, { history, status: 'FAILED' })
    assert.match(failed, /Delivery failed/)
    assert.ok(failed.indexOf('Booked') < failed.indexOf('Recipient unavailable'))
    assert.doesNotMatch(failed, /Delivered/)
    const booked = render(ShipmentTimeline, { history: [history[1]], status: 'BOOKED' })
    assert.doesNotMatch(booked, /Assigned|Delivered/)
    const proof = render(DeliveryProofCard, { proof: { receiverName: 'Test receiver', deliveredAt: '2026-09-09T12:00:00Z', deliveryNotes: '<script>text only</script>' } })
    assert.match(proof, /Test receiver/)
    assert.match(proof, /&lt;script&gt;/)
    assert.doesNotMatch(proof, /<input|<button/)
    assert.match(render(DeliveryProofCard, { proof: null }), /not available/)
  } finally { await vite.close() }
})
