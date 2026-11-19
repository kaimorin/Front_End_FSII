import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import fotoFamiliar from '../assets/familia.jpg'
import fotoPeso from '../assets/servicio-peso.jpg'
import fotoInfantil from '../assets/servicio-infantil.jpg'
import fotoDeporte from '../assets/servicio-deporte.jpg'
import fotoMaria from '../assets/pro-maria.jpg'
import fotoMaximo from '../assets/pro-maximo.jpg'
import ye from '../assets/drwest.jpg'


function Home() {
    const location = useLocation()
    useEffect(() => {
        const id = location.state?.ir
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, [location])

    function irA(e, id) {
        e.preventDefault()
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return(<main>
    <section className="hero">
      <div className="hero-info">
        <h1>Tu Salud es Primero</h1>
        <h3>Clinica Nutrivida</h3>
        <p>Planes personalizados y acompañamiento médico para que alcances tu bienestar físico y mental.</p>
        <div className="hero-botones">
          <a href="#profesionales" className="btn-verde" onClick={(e) => irA(e, 'profesionales')}>Profesionales</a>
          <a href="#nosotros" className="btn-rosa" onClick={(e) => irA(e, 'nosotros')}>Nosotros</a>
        </div>
      </div>
      <div className="hero-img">
        <img src={fotoFamiliar} alt="Familia preparando comida saludable"/>
      </div>
    </section>
   <div className="linea-division"></div>
    <section className="servicios" id="servicios">
      <div className="titulos-seccion">
        <h2>Servicios Nutricionales</h2>
        <p>Elige un servicio que se adapte a tus objetivos.</p>
      </div>

      <div className="servicios-grid">
        <article className="tarjeta-servicio">
          <div className="img-servicio">
            <img src={fotoPeso} alt="Control de peso"/>
          </div>
          <h4>Control de peso</h4>
          <p>Hábitos sostenibles para composición corporal y bienestar.</p>
          <Link to="/reserva/datos" className="btn-detalle">Detalles</Link>
        </article>

        <article className="tarjeta-servicio">
          <div className="img-servicio">
            <img src={fotoInfantil} alt="Nutrición infantil"/>
          </div>
          <h4>Nutricion infantil</h4>
          <p>Hábitos saludables para niños y niñas desde los 5 años.</p>
          <Link to="/reserva/datos" className="btn-detalle">Detalles</Link>
        </article>

        <article className="tarjeta-servicio">
          <div className="img-servicio">
            <img src={fotoDeporte} alt="Nutrición deportiva"/>
          </div>
          <h4>Nutricion Deportiva</h4>
          <p>Rendimiento, recuperación e hidratación con pauta personalizada.</p>
          <Link to="/reserva/datos" className="btn-detalle">Detalles</Link>
        </article>
      </div>
    </section>
    <div className="linea-division"></div>
    <section className="profesionales" id="profesionales">
      <div className="titulos-seccion">
        <h2>Profesionales</h2>
        <p>Un equipo de especialistas altamente capacitados y enfocados en tu bienestar.</p>
      </div>

      <div className="carrusel">
        <button type="button" className="btn-flecha" id="btn-ant">&#8249;</button>

        <div className="grid-profesionales">
          <article className="tarjeta-pro">
            <div className="avatar-pro">
              <img src={fotoMaria} alt="Maria De Judas"/>
            </div>
            <h4>Maria De Judas</h4>
            <p>Especialista en nutrición deportiva y recomposición corporal. Su enfoque se centra en crear hábitos sostenibles y planes de alimentación que mejoran el rendimiento físico sin dietas restrictivas.</p>
          </article>

          <article className="tarjeta-pro">
            <div className="avatar-pro">
              <img src={fotoMaximo} alt="Maximo Tul'Onazo"/>
            </div>
            <h4>Maximo Tul´Onazo</h4>
            <p>Experto en nutrición clínica y metabólica. Se dedica al tratamiento integral del sobrepeso, la obesidad y el control de enfermedades crónicas, como la diabetes, a través de la alimentación.</p>
          </article>

          <article className="tarjeta-pro">
            <div className="avatar-pro">
              <img src={ye} alt="Kanye Di West"/>
            </div>
            <h4>Kanye Di West</h4>
            <p>Especializado en salud digestiva y nutrición integrativa. Su trabajo busca restaurar el equilibrio de la microbiota intestinal y corregir hábitos alimentarios para mejorar la calidad de vida.</p>
          </article>
        </div>

        <button type="button" className="btn-flecha" id="btn-sig">&#8250;</button>
      </div>
    </section>

    <div className="linea-division"></div>

    <section className="nosotros" id="nosotros">
      <h2>Sobre Nosotros</h2>
      <p>Somos una clínica de nutrición enfocada en mejorar tu calidad de vida de forma real y sostenible. Te acompañamos en el proceso de adoptar hábitos saludables mediante planes de alimentación 100% personalizados, basados en ciencia y adaptados a tu día a día.</p>
    </section>
  </main>)
}
export default Home;