import { AuthProvider } from './context/AuthContext.jsx'
import AppRouter from './routes/AppRouter'

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>
}
