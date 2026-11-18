import { Navigate, Outlet, useLocation } from 'react-router';
import { useUsuario } from '../api';

function RutaAdmin() {
  const location = useLocation();
  const usuario = useUsuario(); 


  if (!usuario) {
    return <Navigate to="/login" state={{ volverA: location.pathname }} replace />;
  }

  
  if (usuario.rol !== 'ADMIN') {
    return <Navigate to="/404" replace />;
  }

  
  return <Outlet />;
}

export default RutaAdmin;