import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

// roles = array de roles permitidos, ej: ['ADMIN', 'SUPER_ADMIN']
export default function ProtectedRoute({ children, roles }) {
  const user = useAuthStore((s) => s.user)

  // No está logueado → al login
  if (!user) return <Navigate to="/login" replace />

  // No tiene el rol permitido → al login
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />

  return children
}