import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

test('route rendering enforces authentication/roles and all placeholders render without business data', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/routes/AppRouter.jsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/context/contextValue.js')
    const context = (role, extra = {}) => ({
      user: role ? { name: 'Unit test', role } : null, token: role ? 'unit-token' : null,
      isAuthenticated: Boolean(role), isLoading: false, error: null,
      logout() {}, refreshCurrentUser() {}, ...extra,
    })
    const render = (path, state) => renderToString(createElement(AuthContext.Provider, { value: state },
      createElement(MemoryRouter, { initialEntries: [path] }, createElement(AppRoutes))))
    for (const [path, role, title] of [["/customer/dashboard","customer","Hello,"],["/customer/book","customer","Book a shipment"],["/customer/shipments","customer","My shipments"],["/customer/shipments/aaaaaaaaaaaaaaaaaaaaaaaa","customer","Shipment details"],["/driver/dashboard","driver","Driver dashboard"],["/driver/shipments","driver","Assigned shipments"],["/driver/trips","driver","My trips"],["/operations/dashboard","dispatcher","Operations overview"],["/operations/shipments","dispatcher","Shipments"],["/operations/drivers","dispatcher","Drivers"],["/operations/vehicles","dispatcher","Vehicles"],["/operations/trips","dispatcher","Trips"],["/operations/reports","dispatcher","Reports"]]) {
      const html = render(path, context(role))
      assert.ok(html.includes(title), path)
      assert.ok(html.includes(path === '/customer/book' ? 'Estimate price' : 'Fetching your delivery updates'), path)
      assert.ok(!render(path, context(null)).includes(title), 'Unauthenticated content exposed: ' + path)
      assert.ok(!render(path, context(role === 'customer' ? 'driver' : 'customer')).includes('Your workspace is taking shape'), 'Wrong role content exposed: ' + path)
    }
    assert.ok(render('/operations/reports', context('admin')).includes('Fleet utilization'))
    for (const path of ['/driver/dashboard', '/driver/shipments', '/driver/trips']) {
      for (const role of ['customer', 'admin', 'dispatcher']) {
        assert.ok(!render(path, context(role)).includes('Fetching your delivery updates'), `${role} entered ${path}`)
      }
    }
    assert.ok(render('/login', context(null)).includes('Welcome back.'))
    assert.ok(render('/register', context(null)).includes('Start your journey.'))
    const login = render('/login', context(null))
    assert.match(login, /<form/)
    assert.match(login, /name="email"/)
    assert.match(login, /type="password"/)
    assert.match(login, /Show password/)
    const registration = render('/register', context(null))
    assert.match(registration, /value="customer"/)
    assert.match(registration, /value="driver"/)
    assert.doesNotMatch(registration, /value="(?:admin|dispatcher)"/)
    for (const role of ['customer', 'driver', 'dispatcher', 'admin']) {
      for (const path of ['/login', '/register']) assert.ok(!render(path, context(role)).includes('<form'))
    }
    assert.ok(!render('/login', context(null, { isLoading: true })).includes('<form'))
    const { AuthFeedback } = await vite.ssrLoadModule('/src/components/common/AuthForm.jsx')
    const errorHtml = renderToString(createElement(AuthFeedback, { message: 'Invalid email or password.' }))
    assert.match(errorHtml, /role="alert"/)
    assert.match(errorHtml, /Invalid email or password/)
    assert.ok(render('/unmatched', context(null)).includes('404 / NOT FOUND'))
    assert.ok(render('/unauthorized', context('driver')).includes('ACCESS RESTRICTED'))
    assert.ok(render('/customer/dashboard', context(null, { isLoading: true })).includes('Checking your session'))
    assert.ok(render('/customer/dashboard', context(null, { token: 'unit-token', error: 'Offline' })).includes('Try again'))
  } finally { await vite.close() }
})
