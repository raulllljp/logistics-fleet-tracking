const TOKEN_KEY = 'logistics_token'
const USER_KEY = 'logistics_user'
const AUTH_EVENT = 'logistics:auth-cleared'
const read = (key) => { try { return globalThis.localStorage?.getItem(key) || null } catch { return null } }
const remove = (key) => { try { globalThis.localStorage?.removeItem(key) } catch { /* Storage may be disabled. */ } }
export const getToken = () => read(TOKEN_KEY)
export const setToken = (token) => {
  if (typeof token !== 'string' || !token) throw new Error('A valid session token is required.')
  if (!globalThis.localStorage) throw new Error('Browser storage is unavailable.')
  globalThis.localStorage.setItem(TOKEN_KEY, token)
}
export const removeToken = () => remove(TOKEN_KEY)
export const basicUser = (user) => {
  if (!user || typeof user._id !== 'string' || typeof user.name !== 'string' ||
      typeof user.email !== 'string' || !['customer', 'driver', 'dispatcher', 'admin'].includes(user.role)) {
    throw new Error('The server returned an invalid account response.')
  }
  return { _id: user._id, name: user.name, email: user.email, role: user.role, ...(typeof user.isActive === 'boolean' ? { isActive: user.isActive } : {}) }
}
export const getStoredUser = () => {
  try { const value = read(USER_KEY); return value ? basicUser(JSON.parse(value)) : null }
  catch { remove(USER_KEY); return null }
}
export const setStoredUser = (user) => globalThis.localStorage.setItem(USER_KEY, JSON.stringify(basicUser(user)))
export const clearAuthStorage = () => {
  removeToken()
  remove(USER_KEY)
  globalThis.window?.dispatchEvent(new Event(AUTH_EVENT))
}
export const subscribeAuthChanges = (callback) => {
  const storageChanged = (event) => { if (event.key === TOKEN_KEY || event.key === null) callback() }
  globalThis.window?.addEventListener(AUTH_EVENT, callback)
  globalThis.window?.addEventListener('storage', storageChanged)
  return () => {
    globalThis.window?.removeEventListener(AUTH_EVENT, callback)
    globalThis.window?.removeEventListener('storage', storageChanged)
  }
}
