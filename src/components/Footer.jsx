import { Link } from 'react-router'
import imgWs from '../assets/ws.png';
import ig from '../assets/ig.png'
import fb from '../assets/fb.png'

function Footer() {
    return (<footer className="footer-rosado">
    <div className="footer-rosado-contenido">
      <div className="footer-izq">
        <h3 className="titulo-cambio">Estas Listo para el Cambio?</h3>
        <p>Estamos preparados para empezar!!!</p>
        <Link to="/reserva/datos" className="btn-agenda-oscuro">Agenda Ahora</Link>
      </div>

      <div className="footer-der">
        <div className="redes-con-texto">
            <div className="redes-iconos">
  <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer" className="icono-rd">
    <img src={imgWs} alt="WhatsApp"/>
  </a>
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="icono-rd">
    <img src={fb} alt="Facebook"/>
  </a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="icono-rd">
    <img src={ig} alt="Instagram"/>
  </a>
</div>

  <span className="txt-contactanos">Contactanos...</span>
</div>
      </div>
    </div>

    <div className="footer-rosado-legal">
      <small>Todos los derechos reservados.</small>
      <small>Todos los dias de Lunes a Sabado de 10:30 am hasta las 5:30 pm</small>
    </div>
  </footer>
)}

export default Footer;