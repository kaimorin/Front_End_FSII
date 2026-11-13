import { Link, NavLink } from 'react-router'
import { salir } from '../api'

function AdminLeader() {
  const clase = ({ isActive }) => (isActive ? 'item-admin activo' : 'item-admin')

  return (
    <aside className="sidebar-admin">
      <div className="logo-admin">
        <Link to="/">NUTRIVIDA</Link>
      </div>

      <nav className="nav-admin">
        <NavLink to="/admin" end className={clase}>Dashboard</NavLink>
        <NavLink to="/admin/citas" className={clase}>Citas y Horarios</NavLink>
        <NavLink to="/admin/pacientes" className={clase}>Pacientes</NavLink>
        <NavLink to="/admin/especialistas" className={clase}>Especialistas</NavLink>
        <NavLink to="/admin/reportes" className={clase}>Reportes y Pagos</NavLink>
      </nav>

      <div className="admin-logout">
        <Link to="/login" className="link-logout" onClick={() => salir()}>Cerrar Sesión</Link>
      </div>
    </aside>
  )
}

export default AdminLeader
