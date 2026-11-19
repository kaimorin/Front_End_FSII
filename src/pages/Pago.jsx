import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch, formatearRut, useUsuario } from '../api'
import { calcularTotales, dinero, nombreEspecialidad } from '../utils/formato'
import bannerPago from '../assets/banner-pago.jpg'
import imgResumen from '../assets/resumen-balanza.jpg'
import logoWebpay from '../assets/webpay.png'
import logoMercadoPago from '../assets/mercadopago.png'

function leerJSON(clave) {
  try {
    return JSON.parse(sessionStorage.getItem(clave) || 'null') || {}
  } catch {
    return {}
  }
}

// 8 dígitos (o 7) + dígito verificador. El dígito verificador lo valida el back.
const regexRutLimpio = /^[0-9]{7,8}[0-9K]$/

function Pago() {
  const navigate = useNavigate()
  const usuario = useUsuario()
  const [metodo, setMetodo] = useState('webpay')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Los dejan guardados Agenda.jsx (cita) y Datos.jsx (datosPaciente)
  const [cita] = useState(() => leerJSON('cita'))
  const [datos] = useState(() => leerJSON('datosPaciente'))

  const totales = calcularTotales(cita.precioBase)
  const titulo = `CITA DE ${nombreEspecialidad(cita.especialidad).toUpperCase()}`

  async function pagar(e) {
    e.preventDefault()
    if (cargando) return
    setError('')

    if (!usuario) {
      setError('Debes iniciar sesión para pagar tu cita.')
      return
    }

    const especialistaId = Number(cita.especialistaId)
    if (!especialistaId || !cita.fechaISO || !cita.hora || !cita.modalidad) {
      setError('Tu reserva está incompleta. Vuelve a la agenda y elige de nuevo.')
      return
    }

    const rutLimpio = String(datos.rut || '').replace(/[^0-9kK]/g, '').toUpperCase()
    if (!datos.nombre || !datos.apellido || !datos.telefono || !regexRutLimpio.test(rutLimpio)) {
      setError('Faltan datos del paciente o el RUT no es válido. Vuelve al paso 1.')
      return
    }
    const rut = formatearRut(rutLimpio) // el back exige 12.345.678-9

    setCargando(true)
    try {
      // 1. Guarda (o actualiza) la ficha del paciente
      const resPaciente = await apiFetch('/pacientes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datos.nombre,
          apellido: datos.apellido,
          rut,
          telefono: datos.telefono,
          comuna: datos.comuna,
          ciudad: datos.ciudad,
          patologias: datos.patologias,
        }),
      })
      // 409 = el paciente ya existe (por ejemplo, al reintentar el pago): se sigue igual
      if (!resPaciente.ok && resPaciente.status !== 409) {
        const d = await resPaciente.json().catch(() => ({}))
        setError(d.error || d.detalle || d.message || 'No se pudo guardar el paciente. Intenta nuevamente.')
        return
      }

      // 2. Crea la cita. Doctor, especialidad y precio no se envían: el back los obtiene del especialista.
      const resCita = await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          especialistaId,
          modalidad: cita.modalidad,
          fecha: cita.fecha,
          fechaISO: cita.fechaISO,
          hora: cita.hora,
          metodoPago: metodo,
          pacienteNombre: datos.nombre,
          pacienteApellido: datos.apellido,
          pacienteRut: rut,
          pacienteTelefono: datos.telefono,
        }),
      })
      if (!resCita.ok) {
        const d = await resCita.json().catch(() => ({}))
        setError(d.error || d.detalle || d.message || 'No se pudo crear la cita. Intenta nuevamente.')
        return
      }

      // 3. Deja la cita completa para Confirmacion.jsx y limpia los datos del paciente
      const creada = await resCita.json().catch(() => ({}))
      sessionStorage.setItem('cita', JSON.stringify({
        ...cita,
        ...creada,
        paciente: `${datos.nombre} ${datos.apellido}`.trim(),
        pacienteNombre: datos.nombre,
        pacienteApellido: datos.apellido,
        pacienteRut: rut,
        pacienteTelefono: datos.telefono,
        pacienteCorreo: usuario.correo,
        metodoPago: metodo,
      }))
      sessionStorage.removeItem('datosPaciente')
      navigate('/reserva/confirmacion')
    } catch {
      setError('No se pudo conectar con el servidor. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main>
      <section className="banner-pago">
        <img src={bannerPago} alt="Pago y facturación" />
      </section>

      <section className="pasos-agenda">
        <div className="paso">1. Datos Personales</div>
        <div className="paso">2. Doctor y Especialidad</div>
        <div className="paso paso-activo">3. Pago y Facturacion</div>
      </section>

      <section className="contenedor-pago">
        <div className="columna-metodos-pago">
          <h2 className="titulo-seccion-pago">Elige tu método de pago</h2>

          {!usuario && (
            <p className="aviso-sesion">
              Necesitas una cuenta para reservar. <Link to="/login" state={{ volverA: '/reserva/pago' }}>Iniciar sesión</Link>
            </p>
          )}

          {error && <div className="alerta-error" role="alert">{error}</div>}

          <label className="tarjeta-metodo">
            <input
              type="radio"
              name="metodo_pago"
              value="webpay"
              checked={metodo === 'webpay'}
              onChange={() => setMetodo('webpay')}
            />
            <div className="circulo-check"></div>
            <div className="info-metodo">
              <strong>Webpay</strong>
              <p>Paga con tarjeta de débito o crédito de forma segura.</p>
            </div>
            <img className="logo-pasarela" src={logoWebpay} alt="" />
          </label>

          <label className="tarjeta-metodo">
            <input
              type="radio"
              name="metodo_pago"
              value="mercadopago"
              checked={metodo === 'mercadopago'}
              onChange={() => setMetodo('mercadopago')}
            />
            <div className="circulo-check"></div>
            <div className="info-metodo">
              <strong>Mercado Pago</strong>
              <p>Usa tu saldo o las tarjetas guardadas en tu cuenta.</p>
            </div>
            <img className="logo-pasarela-mp" src={logoMercadoPago} alt="" />
          </label>

          <div className="fila-botones-pago">
            <Link
              to="/reserva/confirmacion"
              className={cargando ? 'btn-pagar btn-pagar-cargando' : 'btn-pagar'}
              onClick={pagar}
            >
              Pagar
            </Link>
            <Link to="/reserva/agenda" className="btn-volver-pago">Volver</Link>
          </div>
        </div>

        <aside className="columna-resumen-pago">
          <div className="item-servicio-resumen">
            <img className="img-mini-resumen" src={imgResumen} alt="" />
            <div className="info-servicio-resumen">
              <strong>{titulo}</strong>
              <span className="nombre-doc-resumen">{(cita.doctor || '').toUpperCase()}</span>
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
            <span>TOTAL</span>
            <span>{dinero(totales.total)}</span>
          </div>
          <p className="nota-total-pago">El monto definitivo lo confirma el sistema al registrar la reserva.</p>
        </aside>
      </section>
    </main>
  )
}

export default Pago
