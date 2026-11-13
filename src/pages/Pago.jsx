import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch, cerrarSesion, obtenerUsuario, useUsuario, formatearRut } from '../api'
import { dinero, nombreEspecialidad, PRECIO_CITA } from '../utils/formato'
import bannerPago from '../assets/banner-pago.jpg'
import webpay from '../assets/webpay.png'
import mercadopago from '../assets/mercadopago.png'
import balanza from '../assets/resumen-balanza.jpg'

function leerSession(clave) {
  return JSON.parse(sessionStorage.getItem(clave) || 'null')
}

function Pago() {
  const navigate = useNavigate()
  const usuario = useUsuario()
  const [metodo, setMetodo] = useState('webpay')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Datos para el resumen (los guardó el paso 2: Agenda)
  const resumen = leerSession('cita')
  const iva = Math.round(PRECIO_CITA * 0.19)

  // El back responde 403 (o 401) si el token falta o venció
  function sesionVencida(res) {
    if (res.status === 401 || res.status === 403) {
      cerrarSesion()
      setError('Tu sesión expiró. Inicia sesión de nuevo para pagar.')
      return true
    }
    return false
  }

  async function pagar(e) {
    e.preventDefault()
    if (enviando) return
    setError('')

    if (!obtenerUsuario()) {
      setError('Debes iniciar sesión para pagar tu cita.')
      return
    }

    const cita = leerSession('cita')
    const paciente = leerSession('datosPaciente')
    if (!cita || !paciente) {
      setError('Faltan datos de tu reserva. Vuelve al paso 1.')
      return
    }

    const rut = formatearRut(paciente.rut) // el back exige 12.345.678-9

    setEnviando(true)
    try {
      // 1. Guarda (o actualiza) al paciente
      const resPaciente = await apiFetch('/pacientes', {
        method: 'POST',
        body: JSON.stringify({ ...paciente, rut }),
      })
      if (sesionVencida(resPaciente)) return
      if (!resPaciente.ok) {
        setError('No se pudieron guardar los datos del paciente. Revisa tu RUT.')
        return
      }

      // 2. Crea la cita
      const resCita = await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          ...cita,
          metodoPago: metodo,
          pacienteNombre: paciente.nombre,
          pacienteApellido: paciente.apellido,
          pacienteRut: rut,
          pacienteTelefono: paciente.telefono,
        }),
      })
      if (sesionVencida(resCita)) return
      if (!resCita.ok) {
        setError('No se pudo crear la cita. Intenta nuevamente.')
        return
      }

      // 3. Deja la cita creada (con su número) para la pantalla de confirmación
      const creada = await resCita.json().catch(() => ({}))
      sessionStorage.setItem('cita', JSON.stringify({ ...cita, id: creada.id, metodoPago: metodo }))
      sessionStorage.removeItem('datosPaciente') // evita pagar dos veces la misma reserva

      navigate('/reserva/confirmacion')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main>
      <section className="banner-pago">
        <img src={bannerPago} alt="Metodo de pago" />
      </section>

      <section className="pasos-agenda">
        <div className="paso">1. Datos Personales</div>
        <div className="paso">2. Doctor y Especialidad</div>
        <div className="paso paso-activo">3. Pago y Facturacion</div>
      </section>

      <section className="contenedor-pago">
        <div className="columna-metodos-pago">
          <h2 className="titulo-seccion-pago">Metodo de Pago</h2>

          <label className="tarjeta-metodo">
            <input type="radio" name="metodo_pago" value="webpay" defaultChecked onChange={() => setMetodo('webpay')} />
            <div className="circulo-check"></div>
            <div className="info-metodo">
              <strong>Webpay</strong>
              <p>Webpay es la plataforma de pago en línea de TransBank que permite a los comercios aceptar pagos con tarjetas de crédito, débito y prepago de forma segura a través de internet.</p>
            </div>
            <img src={webpay} alt="Webpay" className="logo-pasarela" />
          </label>

          <label className="tarjeta-metodo">
            <input type="radio" name="metodo_pago" value="mercadopago" onChange={() => setMetodo('mercadopago')} />
            <div className="circulo-check"></div>
            <div className="info-metodo">
              <p><strong>Mercado Pago</strong> es la billetera digital de Mercado Libre que permite a personas y empresas administrar dinero, pagar y cobrar de manera 100% online.</p>
            </div>
            <img src={mercadopago} alt="Mercado Pago" className="logo-pasarela-mp" />
          </label>

          {!usuario && (
            <p className="aviso-sesion">
              Para pagar debes <Link to="/login" state={{ volverA: '/reserva/pago' }}>iniciar sesión</Link>. Tus datos de la reserva se mantienen.
            </p>
          )}

          {error && <p className="error-texto">{error}</p>}

          <div className="fila-botones-pago">
            <Link to="/reserva/confirmacion" className="btn-pagar" onClick={pagar}>Pagar</Link>
            <Link to="/reserva/agenda" className="btn-volver-pago">Volver</Link>
          </div>
        </div>

        <aside className="columna-resumen-pago">
          <h2 className="titulo-seccion-pago">Resumen:</h2>

          <div className="item-servicio-resumen">
            <img src={balanza} alt="Pesaje" className="img-mini-resumen" />
            <div className="info-servicio-resumen">
              <strong>
                {resumen?.especialidad
                  ? `CITA DE ${nombreEspecialidad(resumen.especialidad).toUpperCase()}`
                  : 'CITA NUTRICIONAL'}
              </strong>
              <span className="nombre-doc-resumen">{resumen?.doctor ? resumen.doctor.toUpperCase() : 'DOCTOR POR DEFINIR'}</span>
              {resumen && <span>{resumen.fecha} · {resumen.hora} · {resumen.modalidad}</span>}
              <span className="precio-item-resumen">{dinero(PRECIO_CITA)}</span>
            </div>
          </div>

          <div className="divisor-resumen"></div>

          <details className="bloque-cupon">
            <summary>TIENES UN CUPÓN?</summary>
            <div className="input-cupon-box">
              <input type="text" placeholder="Ingresa cupón" />
              <button type="button">Aplicar</button>
            </div>
          </details>

          <div className="divisor-resumen"></div>

          <div className="fila-total-linea">
            <span>SUBTOTAL</span>
            <span>{dinero(PRECIO_CITA)}</span>
          </div>
          <div className="fila-total-linea">
            <span>I.V.A</span>
            <span>{dinero(iva)}</span>
          </div>

          <div className="divisor-resumen"></div>

          <div className="fila-total-final">
            <strong>TOTAL</strong>
            <strong>{dinero(PRECIO_CITA + iva)}</strong>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default Pago
