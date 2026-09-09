import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { nextActions, statusPayload, validateStatus } from '../src/utils/driverWorkflow.js'
import { client } from '../src/api/client.js'
import { updateShipmentStatus } from '../src/api/shipmentApi.js'

test('driver transitions, receiver validation and status payloads follow v1', async()=>{
 for(const [status,next] of Object.entries({ASSIGNED:['PICKED_UP'],PICKED_UP:['IN_TRANSIT'],IN_TRANSIT:['DELIVERED','FAILED'],DELIVERED:[],FAILED:[],BOOKED:[]})) assert.deepEqual(nextActions(status),next)
 const values={receiverName:' Receiver ',location:' Gate ',note:' Note ',deliveryNotes:' Received ',deliveredAt:'forbidden',customerId:'forbidden'}
 assert.ok(validateStatus('DELIVERED',{...values,receiverName:''}).receiverName)
 assert.deepEqual(validateStatus('FAILED',{...values,receiverName:''}),{})
 assert.ok(validateStatus('PICKED_UP',{...values,location:'x'.repeat(201)}).location)
 assert.deepEqual(statusPayload('FAILED',values),{status:'FAILED',location:'Gate',note:'Note'})
 const payload=statusPayload('DELIVERED',values)
 assert.deepEqual(payload,{status:'DELIVERED',location:'Gate',note:'Note',receiverName:'Receiver',deliveryNotes:'Received'})
 const adapter=client.defaults.adapter
 try {client.defaults.adapter=async config=>{assert.equal(config.method,'put');assert.equal(config.url,'/shipments/abc/status');assert.deepEqual(JSON.parse(config.data),payload);return {status:200,headers:{},config,data:{success:true}}};await updateShipmentStatus('abc',payload)} finally {client.defaults.adapter=adapter}
})
test('driver cards, terminal confirmations and read-only trips render',async()=>{
 const vite=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'})
 try {
  const { actionSuccessMessages } = await vite.ssrLoadModule('/src/utils/driverWorkflow.js')
  assert.equal(actionSuccessMessages.PICKED_UP, 'Shipment marked as picked up.')
  assert.equal(actionSuccessMessages.IN_TRANSIT, 'Shipment is now in transit.')
  assert.equal(actionSuccessMessages.DELIVERED, 'Delivery completed.')
  assert.equal(actionSuccessMessages.FAILED, 'Shipment marked as failed.')
  const {DriverShipmentCard,DriverShipmentList,StatusUpdateForm,TripCard}=await vite.ssrLoadModule('/src/components/driver/DriverComponents.jsx')
  const render=(component,props)=>renderToString(createElement(component,props))
  // Isolated rendering fixtures only; no database or app records are created.
  const shipment={_id:'a'.repeat(24),pickupAddress:'Pickup location',dropAddress:'Drop location',weight:2,status:'ASSIGNED'}
  for(const [status,expected,absent] of [['ASSIGNED','Mark picked up','Start transit'],['PICKED_UP','Start transit','Mark delivered'],['IN_TRANSIT','Mark delivered','Mark picked up'],['DELIVERED','Delivery completed','Mark failed'],['FAILED','Delivery failed','Mark delivered']]) {
  const html=render(DriverShipmentCard,{shipment:{...shipment,status}});assert.ok(html.includes(expected));assert.ok(!html.includes(absent))
  if(status==='IN_TRANSIT') assert.match(html,/Mark failed/)
  assert.match(html, /weight-prominent/)
  }
  assert.match(render(DriverShipmentList,{shipments:[]}),/No assigned shipments/)
  const delivery=render(StatusUpdateForm,{shipment:{...shipment,status:'IN_TRANSIT'},target:'DELIVERED'})
  assert.match(delivery,/name="receiverName"/);assert.match(delivery,/required/);assert.match(delivery,/Confirm delivery/)
  assert.match(delivery, /Drop location/);assert.match(delivery, /Delivery confirmation notes/)
  const failed=render(StatusUpdateForm,{shipment:{...shipment,status:'IN_TRANSIT'},target:'FAILED'})
  assert.match(failed,/cannot be undone/);assert.match(failed,/Confirm failed delivery/);assert.match(failed,/Cancel/)
  assert.match(failed, /Drop location/);assert.match(failed, /Failure reason/)
  const trip=render(TripCard,{trip:{_id:'b'.repeat(24),date:'2026-09-09T10:00:00Z',status:'planned',vehicleId:null,shipmentIds:[]}})
  assert.match(trip,/Planned/);assert.match(trip,/Vehicle unavailable/);assert.doesNotMatch(trip,/<button|<form/)
  } finally {await vite.close()}
})
