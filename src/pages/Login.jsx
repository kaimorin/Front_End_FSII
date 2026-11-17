import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { apiFetch, guardarSesion } from '../api'
import bannerLogin from '../assets/banner-login.jpg'

// Espera mínima entre intentos de login (protección bruta fuerza en el cliente)
const DELAY_MS = 1000

function Login() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const [correo, setCorreo] = useState('')
  const [clave,  setClave]  = useState('')
  const [error,  setError]  = useState('')
  const [cargando, setCargando] = useState(false)
  const ultimoIntento = useRef(0)

  async function ingresar(e) {
    e.preventDefault()
    setError('')

    // Throttle del lado cliente
    const ahora = Date.now()
    if (ahora - ultimoIntento.current < DELAY_MS) {
      setError('Espera un momento antes de volver a intentarlo.')
      return
    }
    ultimoIntento.current = ahora

    // Validaciones básicas antes de llamar al servidor
    if (!correo.trim() || !clave) {
      setError('Completa todos los campos.')
      return
    }

    setCargando(true)
    try {
      const res = await apiFetch('/usuarios/login', {
        method: 'POST',
        body: JSON.stringify({ correo: correo.trim(), clave }),
      })

      if (res.status === 429) {
        setError('Demasiados intentos. Espera unos minutos.')
        return
      }
      if (!res.ok) {
        // Mensaje genérico para no revelar si el correo existe
        setError('Correo o contraseña incorrectos.')
        return
      }

      const datos = await res.json()
      guardarSesion(datos)
      navigate(location.state?.volverA || (datos.rol === 'ADMIN' ? '/admin' : '/'))
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main>
      <section className="banner-login">
        <img src={bannerLogin} alt="Doctor" className="img-banner-fondo" />
        <h1 className="banner-titulo-login">Inicia Sesión</h1>
      </section>

      <section className="seccion-formulario-registro">
        <div className="caja-registro caja-login-exacta">

          <div className="encabezado-caja-login">
            <span className="logo-degradado">NUTRIVIDA</span>
            <p className="subtitulo-login">Inicia sesión usando tu correo electrónico y contraseña.</p>
          </div>

          <form id="formLogin" noValidate onSubmit={ingresar}>

            <div className="campo">
              <label htmlFor="login-correo">Correo Electrónico</label>
              <div className="input-con-icono">
                <input
                  type="email"
                  id="login-correo"
                  autoComplete="email"
                  placeholder="marisoljimenez@gmail.com"
                  value={correo}
                  maxLength={254}
                  onChange={(e) => setCorreo(e.target.value)}
                />
                <span className="icono-campo">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#777" strokeWidth="1.8" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M22 6l-10 7L2 6"></path>
                  </svg>
                </span>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="login-clave">Contraseña</label>
              <div className="input-con-icono">
                <input
                  type="password"
                  id="login-clave"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={clave}
                  maxLength={100}
                  onChange={(e) => setClave(e.target.value)}
                />
                <span className="icono-campo">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#777" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
              </div>
              {error && (
                <span className="error-texto" role="alert" aria-live="polite">
                  {error}
                </span>
              )}
            </div>

            <div className="fila-switch">
              <label className="switch">
                <input type="checkbox" id="checkRecuerdame" />
                <span className="slider round"></span>
              </label>
              <span className="txt-recuerdame">Recuérdame</span>
            </div>

            <button type="submit" className="btn-ingresar-negro" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>

            <div className="pie-login-registro">
              <p>¿No tienes cuenta? Regístrate <Link to="/registro">aquí</Link></p>
            </div>
          </form>

        </div>
      </section>
    </main>
  )
}

export default Login
