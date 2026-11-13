import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { salir, useUsuario } from '../api'
import { scrollSuave } from '../utils/scrollSuave.js'

function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const usuario = useUsuario()

  function irA(id) {
    setMenuAbierto(false)
    if (location.pathname === '/') {
      scrollSuave(id)
    } else {
      navigate('/', { state: { ir: id } })
    }
  }

  function cerrarSesion(e) {
    e.preventDefault()
    salir()
    setMenuAbierto(false)
    navigate('/')
  }

  return (
    <header className="header">
      <Link to="/" className="logo">
        NUTRIVIDA
      </Link>

      <button
        className="menu-movil"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        ☰
      </button>

      <nav className={menuAbierto ? 'nav nav-abierto' : 'nav'}>
        <ul>
          <li>
            <a href="#servicios" onClick={(e) => {
              e.preventDefault()
              irA('servicios')
            }}>
              Servicios
            </a>
          </li>

          <li className="separador">|</li>

          <li>
            <a href="#profesionales" onClick={(e) => {
              e.preventDefault()
              irA('profesionales')
            }}>
              Profesionales
            </a>
          </li>

          <li className="separador">|</li>

          <li>
            {/* Con sesión iniciada va al perfil; sin sesión, a registrarse */}
            <Link to={usuario ? '/perfil' : '/registro'} onClick={() => setMenuAbierto(false)}>
              Mi Salud
            </Link>
          </li>

          {usuario?.rol === 'ADMIN' && (
            <>
              <li className="separador">|</li>
              <li>
                <Link to="/admin" onClick={() => setMenuAbierto(false)}>Panel admin</Link>
              </li>
            </>
          )}

          <li className="separador">|</li>

          <li>
            {usuario ? (
              <a href="#salir" onClick={cerrarSesion}>Cerrar sesión</a>
            ) : (
              <Link to="/login" onClick={() => setMenuAbierto(false)}>Iniciar sesión</Link>
            )}
          </li>
        </ul>
      </nav>

      <Link
        to="/reserva/datos"
        className="btn-agenda"
        onClick={() => setMenuAbierto(false)}
      >
        Agenda ahora
      </Link>
    </header>
  )
}

export default Header
