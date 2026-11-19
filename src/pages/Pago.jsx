import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch, cerrarSesion, obtenerUsuario, useUsuario, formatearRut } from '../api'
import { calcularTotales, dinero, nombreEspecialidad, PRECIO_CITA } from '../utils/formato'
import bannerPago from '../assets/banner-pago.jpg'
import webpay from '../assets/webpay.png'
import mercadopago from '../assets/mercadopago.png'
import balanza from '../assets/resumen-balanza.jpg'

function leerSession(clave) {
  try {
    return JSON.parse(sessionStorage.getItem(clave) || 'null')
  } catch {
    return null
  }
}

async function mensajeDelServidor(res, mensajeAlternativo) {
  const respuesta = await res.json().catch(() => ({}))
  if (respuesta.campos) return Object.values(respuesta.campos).join(' ')
  if (respuesta.error) return respuesta.error
  if (respuesta.detalle) return respuesta.detalle
  return mensajeAlternativo
}

function Pago() {
  const navigate = useNavigate()
  const usuario = useUsuario()
  const [metodo, setMetodo] = useState('webpay')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const resumen = leerSession('cita')
  const precioBase = Number(resumen?.precioBase) > 0 ? Number(resumen.precioBase) : PRECIO_CITA
  const totales = calcularTotales(precioBase)

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
    if (!cita.especialistaId || !cita.fechaISO) {
      setError('La reserva no tiene un especialista o fecha válidos. Vuelve al paso 2 y selecciónalos nuevamente.')
      return
    }

    const rut = formatearRut(paciente.rut)
    setEnviando(true)

    try {
      // 1. Guarda o actualiza la ficha del paciente.
      const resPaciente = await apiFetch('/pacientes', {
        method: 'POST',
        body: JSON.stringify({ ...paciente, rut }),
      })
      if (sesionVencida(resPaciente)) return
      if (!resPaciente.ok) {
        setError(await mensajeDelServidor(resPaciente, 'No se pudieron guardar los datos del paciente. Revisa tu RUT.'))
        return
      }

      // 2. El backend obtiene el precio, nombre y especialidad desde especialistaId.
      // No se envían importes calculados por el navegador como fuente de verdad.
      const resCita = await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          especialistaId: cita.especialistaId,
          modalidad: cita.modalidad,
          fecha: cita.fecha,
          fechaISO: cita.fechaISO,
          hora: cita.hora,
          metodoPago: metodo,
          pacienteNombre: paciente.nombre,
          pacienteApellido: paciente.apellido,
          pacienteRut: rut,
          pacienteTelefono: paciente.telefono,
        }),
      })
      if (sesionVencida(resCita)) return
      if (!resCita.ok) {
        setError(await mensajeDelServidor(resCita, 'No se pudo crear la cita. Intenta nuevamente.'))
        return
      }

      const creada = await resCita.json()
      sessionStorage.setItem('cita', JSON.stringify({
        ...cita,
        id: creada.id,
        especialistaId: creada.especialistaId,
        doctor: creada.doctor || cita.doctor,
        especialidad: creada.especialidad || cita.especialidad,
        modalidad: creada.modalidad || cita.modalidad,
        fecha: creada.fecha || cita.fecha,
        fechaISO: creada.fechaISO || cita.fechaISO,
        hora: creada.hora || cita.hora,
        metodoPago: creada.metodoPago || metodo,
        precioBase: Number(creada.precioBase ?? totales.precioBase),
        iva: Number(creada.iva ?? totales.iva),
        total: Number(creada.total ?? totales.total),
        paciente: `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim(),
        pacienteNombre: paciente.nombre,
        pacienteApellido: paciente.apellido,
        pacienteRut: rut,
        pacienteTelefono: paciente.telefono,
        pacienteCorreo: paciente.correo || usuario?.correo || '',
      }))
      sessionStorage.removeItem('datosPaciente')
      navigate('/reserva/confirmacion')
    } catch {
      setError('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.')
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
            <input type="radio" name="metodo_pago" value="webpay" checked={metodo === 'webpay'} onChange={() => setMetodo('webpay')} />
            <div className="circulo-check"></div>
            <div className="info-metodo">
              <strong>Webpay</strong>
              <p>Webpay es la plataforma de pago en línea de TransBank que permite a los comercios aceptar pagos con tarjetas de crédito, débito y prepago de forma segura a través de internet.</p>
            </div>
            <img src={webpay} alt="Webpay" className="logo-pasarela" />
          </label>

          <label className="tarjeta-metodo">
            <input type="radio" name="metodo_pago" value="mercadopago" checked={metodo === 'mercadopago'} onChange={() => setMetodo('mercadopago')} />
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

          {error && <div className="alerta-error" role="alert">{error}</div>}

          <div className="fila-botones-pago">
            <Link
              to="/reserva/confirmacion"
              className={`btn-pagar ${enviando ? 'btn-pagar-cargando' : ''}`}
              onClick={pagar}
              aria-disabled={enviando}
            >
              {enviando ? 'Procesando...' : 'Pagar'}
            </Link>
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
              <span className="precio-item-resumen">{dinero(totales.precioBase)}</span>
            </div>
          </div>

          <div className="divisor-resumen"></div>

          <div className="fila-total-linea">
            <span>SUBTOTAL</span>
            <span>{dinero(totales.subtotal)}</span>
          </div>
          <div className="fila-total-linea">
            <span>I.V.A (19%)</span>
            <span>{dinero(totales.iva)}</span>
          </div>

          <div className="divisor-resumen"></div>

          <div className="fila-total-final">
            <strong>TOTAL</strong>
            <strong>{dinero(totales.total)}</strong>
          </div>
          <p className="nota-total-pago">El monto definitivo se calcula y valida al guardar la reserva.</p>
        </aside>
      </section>
    </main>
  )
}

export default Pago
