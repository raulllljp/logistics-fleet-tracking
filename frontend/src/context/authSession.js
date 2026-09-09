import * as authApi from '../api/authApi.js'
import { getErrorMessage } from '../api/client.js'
import { basicUser, getToken, setToken, setStoredUser, clearAuthStorage, subscribeAuthChanges } from '../utils/storage.js'

// A small session controller keeps request races testable without rendering React.
export const createAuthSession = (api = authApi) => {
  let state = { user: null, token: getToken(), isAuthenticated: false, isLoading: Boolean(getToken()), error: null }
  let revision = 0
  let controller
  const listeners = new Set()
  const publish = (next) => { state = { ...state, ...next }; listeners.forEach((listener) => listener()) }
  const invalidate = () => { revision += 1; controller?.abort(); return revision }
  const empty = { user: null, token: null, isAuthenticated: false, isLoading: false, error: null }
  const logout = () => { invalidate(); clearAuthStorage(); publish(empty) }
  const refreshCurrentUser = async () => {
    const current = invalidate()
    const token = getToken()
    if (!token) { publish(empty); return }
    controller = new AbortController()
    publish({ user: null, token, isAuthenticated: false, isLoading: true, error: null })
    try {
      const response = await api.getMe({ signal: controller.signal })
      if (revision !== current || getToken() !== token) return
      const user = basicUser(response.data.user)
      if (user.isActive === false) { logout(); return }
      setStoredUser(user)
      publish({ user, token, isAuthenticated: true, isLoading: false })
    } catch (error) {
      if (revision !== current) return
      if (error.response?.status === 401) { logout(); return }
      // A temporary network/500 error is not proof that the token is invalid.
      publish({ user: null, isAuthenticated: false, isLoading: false, error: getErrorMessage(error) })
    }
  }
  const authenticate = async (action, payload) => {
    const current = invalidate()
    publish({ isLoading: true, error: null })
    try {
      const response = await api[action](payload)
      if (revision !== current) return null
      const user = basicUser(response.data.user)
      setToken(response.data.token)
      try { setStoredUser(user) } catch (error) { clearAuthStorage(); throw error }
      publish({ user, token: response.data.token, isAuthenticated: true, isLoading: false })
      return user
    } catch (error) {
      if (revision === current) publish({ isLoading: false, error: getErrorMessage(error) })
      throw error
    }
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    start: () => {
      const unsubscribe = subscribeAuthChanges(refreshCurrentUser)
      void refreshCurrentUser()
      return () => { unsubscribe(); invalidate() }
    },
    refreshCurrentUser, logout,
    login: (payload) => authenticate('login', payload),
    register: (payload) => authenticate('register', payload),
  }
}
