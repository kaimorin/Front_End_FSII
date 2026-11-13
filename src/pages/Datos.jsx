import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiGet, useUsuario } from '../api'
import banner from '../assets/banner-paso1.jpg'

const VACIO = {
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '+56 9',
    comuna: '',
    ciudad: '',
    patologias: '',
    destinatario: 'para-mi',
}

function Datos() {
    const navigate = useNavigate()
    const usuario = useUsuario()

    // Si ya llenó este paso antes (y volvió desde Agenda), recupera lo que escribió
    const [datos, setDatos] = useState(
        () => JSON.parse(sessionStorage.getItem('datosPaciente') || 'null') || VACIO
    )
    // Datos de la cuenta del usuario (para el botón "Para mí")
    const [miPerfil, setMiPerfil] = useState(null)

    // Si hay sesión, pide al back los datos del usuario y su ficha de paciente
    useEffect(() => {
        if (!usuario) return
        async function cargar() {
            try {
                const u = await apiGet(`/usuarios/${usuario.id}`)
                if (!u) return
                const p = u.rut ? await apiGet(`/pacientes/rut/${encodeURIComponent(u.rut)}`) : null
                const perfil = {
                    nombre: u.nombre || '',
                    apellido: u.apellido || '',
                    rut: u.rut || '',
                    telefono: u.telefono || '+56 9',
                    comuna: p?.comuna || '',
                    ciudad: p?.ciudad || '',
                    patologias: p?.patologias || '',
                    destinatario: 'para-mi',
                }
                setMiPerfil(perfil)
                // Solo autocompleta si aún no escribió nada en esta reserva
                if (!sessionStorage.getItem('datosPaciente')) setDatos(perfil)
            } catch {
                // sin conexión: el formulario queda vacío
            }
        }
        cargar()
    }, [usuario?.id])

    function cambiar(e) {
        setDatos({ ...datos, [e.target.name]: e.target.value })
    }

    function cambiarDestinatario(e) {
        const valor = e.target.value
        if (miPerfil && valor === 'familiar') setDatos({ ...VACIO, destinatario: 'familiar' })
        else if (miPerfil && valor === 'para-mi') setDatos({ ...miPerfil })
        else setDatos({ ...datos, destinatario: valor })
    }

    function siguiente(e) {
        e.preventDefault()
        sessionStorage.setItem('datosPaciente', JSON.stringify(datos))
        navigate('/reserva/agenda')
    }

    return(
    <main>

        <section className="banner-paso1">
            <img src={banner} alt="Datos Personales"/>
        </section>


        <section className="pasos-agenda">
            <div className="paso paso-activo">1. Datos Personales</div>
            <div className="paso">2. Doctor y Especialidad</div>
            <div className="paso">3. Pago y facturacion</div>
        </section>


        <section className="contenedor-formulario-paso1">
            <h2 className="titulo-datos-paciente">Datos del Paciente:</h2>

            {!usuario && (
                <p className="aviso-sesion">
                    ¿Ya tienes cuenta? <Link to="/login" state={{ volverA: '/reserva/datos' }}>Inicia sesión</Link> para autocompletar tus datos y poder pagar tu cita.
                </p>
            )}
            {miPerfil && datos.destinatario === 'para-mi' && (
                <p className="aviso-sesion">Cargamos tus datos de la cuenta. Puedes corregirlos si lo necesitas.</p>
            )}

            <form onSubmit={siguiente} className="form-paso1" id="formPaso1">
                <div className="fila-inputs-paso1">
                    <input type="text" name="nombre" placeholder="Nombre*" required className="input-paso1" value={datos.nombre} onChange={cambiar} />
                    <input type="text" name="apellido" placeholder="Apellido*" required className="input-paso1" value={datos.apellido} onChange={cambiar} />
                </div>

                <div className="fila-inputs-paso1">
                    <input type="text" name="rut" placeholder="RUT" required className="input-paso1" value={datos.rut} onChange={cambiar} />
                    <input type="tel" name="telefono" className="input-paso1" value={datos.telefono} onChange={cambiar} />
                </div>

                <div className="fila-inputs-paso1">
                    <div className="select-wrapper-paso1">
                        <select name="comuna" value={datos.comuna} onChange={cambiar} className="input-paso1 select-paso1" required>
                            <option value="" disabled>Comuna*</option>
                            <option value="santiago">Santiago</option>
                            <option value="providencia">Providencia</option>
                            <option value="las-condes">Las Condes</option>
                            <option value="otra">Otra</option>
                        </select>
                    </div>
                    <input type="text" name="ciudad" placeholder="Ciudad*" required className="input-paso1" value={datos.ciudad} onChange={cambiar} />
                </div>

                <div className="fila-inputs-paso1 fila-completa">
                    <input type="text" name="patologias" placeholder="Patologias" className="input-paso1" value={datos.patologias} onChange={cambiar} />
                </div>

                <div className="divisor-formulario-paso1"></div>

                <div className="fila-opciones-destinatario">
                    <label className="tarjeta-opcion-paso1">
                        <input type="radio" name="destinatario" value="para-mi" checked={datos.destinatario === 'para-mi'} onChange={cambiarDestinatario} />
                        <div className="circulo-check"></div>
                        <span>Para mí</span>
                    </label>

                    <label className="tarjeta-opcion-paso1">
                        <input type="radio" name="destinatario" value="familiar" checked={datos.destinatario === 'familiar'} onChange={cambiarDestinatario} />
                        <div className="circulo-check"></div>
                        <span>Para conocido o familiar</span>
                    </label>
                </div>

                <div className="divisor-formulario-paso1"></div>

                <div className="fila-botones-accion-paso1">
                    <button type="submit" className="btn-siguiente-paso1">Siguiente</button>
                    <Link to="/" className="btn-volver-paso1">Volver</Link>
                </div>
            </form>
        </section>
   </main>)
}
export default Datos;
