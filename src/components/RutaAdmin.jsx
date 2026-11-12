import { Navigate, Outlet } from 'react-router'
import { obtenerUsuario } from '../api'

function RutaAdmin() {
  const usuario = obtenerUsuario()
  if (!usuario || usuario.rol !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export default RutaAdmin