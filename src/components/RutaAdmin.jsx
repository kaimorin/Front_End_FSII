import { Navigate, Outlet } from 'react-router'
import { useUsuario } from '../api'

function RutaAdmin() {
  const usuario = useUsuario()
  if (!usuario || usuario.rol !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export default RutaAdmin
