import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
const apiPost = (path, body) =>
  fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })

const DOCTORES_MAP = {
  'Maria de Judas': 1,
  "Maximo Tul 'Onazzo": 2,
  "Tomas O'valle": 3,
  "Shaqueal O'neal": 4,
}

function fechaTextoAISO(fechaTexto) {
  if (!fechaTexto) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) return fechaTexto
  const meses = { enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06', julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12' }
  const m = String(fechaTexto).toLowerCase().match(/(\d{1,2}) de (\w+) de (\d{4})/)
  if (!m) return ''
  return `${m[3]}-${meses[m[2]]}-${String(m[1]).padStart(2, '0')}`
}

function validarRutChileno(rut) {
  const limpio = String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 8) return false
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  let suma = 0
  let mult = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const resto = 11 - (suma % 11)
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return dv === dvEsperado
}

export default function Pago() {
  const navigate = useNavigate()
  const [metodo, setMetodo] = useState('webpay')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const cita = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('cita') || '{}') } catch { return {} }
  }, [])

  const datosPaciente = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('datosPaciente') || '{}') } catch { return {} }
  }, [])

  const precioBase = Number(cita.precioBase) || 35000
  const iva = Math.round(precioBase * 0.19)
  const total = precioBase + iva

  const handlePagar = async () => {
    setError('')

    // 1. Reconstruir campos que podían faltar en citas viejas
    const especialistaId = Number(cita.especialistaId) || DOCTORES_MAP[cita.doctor] || 0
    const fechaISO = cita.fechaISO || fechaTextoAISO(cita.fecha)

    if (!especialistaId || !fechaISO) {
      setError('La reserva no tiene un especialista o fecha válidos. Vuelve a Agenda y elige de nuevo.')
      return
    }

    if (!cita.hora || !cita.modalidad) {
      setError('La reserva está incompleta. Vuelve a Agenda.')
      return
    }

    // 2. Validar RUT - 12.345.678-0 es inválido, el válido es 12.345.678-5
    if (!validarRutChileno(datosPaciente.rut)) {
      setError('El RUT es inválido. Revisa el dígito verificador.')
      return
    }

    if (!datosPaciente.nombre || !datosPaciente.apellido || !datosPaciente.telefono) {
      setError('Faltan datos del paciente. Vuelve a la pantalla de Datos.')
      return
    }

    setCargando(true)
    try {
      // 3. Crear paciente
      const resPaciente = await apiPost('/pacientes', {
        nombre: datosPaciente.nombre,
        apellido: datosPaciente.apellido,
        rut: datosPaciente.rut,
        telefono: datosPaciente.telefono,
      })

      if (!resPaciente.ok) {
        const d = await resPaciente.json().catch(() => ({}))
        setError(d.error || d.message || 'No se pudo guardar el paciente. Intenta nuevamente.')
        return
      }

      // 4. Crear cita con TODOS los campos que pide Swagger
      const resCita = await apiPost('/citas', {
        especialistaId,
        doctor: cita.doctor,
        especialidad: cita.especialidad,
        modalidad: cita.modalidad,
        fecha: cita.fecha,
        fechaISO,
        hora: cita.hora,
        metodoPago: metodo,
        pacienteNombre: datosPaciente.nombre,
        pacienteApellido: datosPaciente.apellido,
        pacienteRut: datosPaciente.rut,
        pacienteTelefono: datosPaciente.telefono,
      })

      if (!resCita.ok) {
        const d = await resCita.json().catch(() => ({}))
        setError(d.error || d.message || d.detalle || 'No se pudo crear la cita. Intenta nuevamente.')
        return
      }

      const citaCreada = await resCita.json().catch(() => ({}))
      sessionStorage.setItem('citaCreada', JSON.stringify(citaCreada))
      navigate('/confirmacion')
    } catch (e) {
      setError('No se pudo conectar con el servidor. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div>
        <h1>Pago</h1>
        <p>Elige tu método de pago.</p>

        {error && <p style={{ color: 'red', background: '#ffecec', padding: 10, borderRadius: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setMetodo('webpay')} style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', background: metodo === 'webpay' ? '#0a7a42' : '#fff', color: metodo === 'webpay' ? '#fff' : '#000', cursor: 'pointer' }}>Webpay</button>
          <button onClick={() => setMetodo('mercado-pago')} style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', background: metodo === 'mercado-pago' ? '#0a7a42' : '#fff', color: metodo === 'mercado-pago' ? '#fff' : '#000', cursor: 'pointer' }}>Mercado Pago</button>
          <button onClick={() => setMetodo('transferencia')} style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', background: metodo === 'transferencia' ? '#0a7a42' : '#fff', color: metodo === 'transferencia' ? '#fff' : '#000', cursor: 'pointer' }}>Transferencia</button>
        </div>

        <button onClick={handlePagar} disabled={cargando} style={{ padding: '14px 24px', background: '#0a7a42', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
          {cargando ? 'Procesando...' : 'Pagar'}
        </button>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, height: 'fit-content' }}>
        <h3>Resumen</h3>
        <p><strong>Especialista:</strong> {cita.doctor || '-'}</p>
        <p><strong>Especialidad:</strong> {cita.especialidad || '-'}</p>
        <p><strong>Modalidad:</strong> {cita.modalidad || '-'}</p>
        <p><strong>Fecha:</strong> {cita.fecha || '-'}</p>
        <p><strong>Hora:</strong> {cita.hora || '-'}</p>
        <hr />
        <p>SUBTOTAL: ${precioBase.toLocaleString('es-CL')}</p>
        <p>I.V.A: ${iva.toLocaleString('es-CL')}</p>
        <p><strong>TOTAL: ${total.toLocaleString('es-CL')}</strong></p>
      </div>
    </div>
  )
}