import { Navigate, Outlet } from 'react-router'
import { useUsuario } from '../api'

/**
 * Protege las rutas de administrador.
 * - Sin sesión → redirige a /login
 * - Sesión de PACIENTE → redirige a / (no revela que existe el panel)
 */
function RutaAdmin() {
  const usuario = useUsuario()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (usuario.rol !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RutaAdmin
