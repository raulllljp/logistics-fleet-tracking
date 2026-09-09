import { useEffect, useState, useSyncExternalStore } from 'react'
import { createAuthSession } from './authSession'
import { AuthContext } from './contextValue.js'
export function AuthProvider({ children }) {
  const [session] = useState(() => createAuthSession())
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot)
  useEffect(() => session.start(), [session])
  return <AuthContext.Provider value={{ ...state, login: session.login, register: session.register,
    logout: session.logout, refreshCurrentUser: session.refreshCurrentUser }}>{children}</AuthContext.Provider>
}
