// dependencies
import { Navigate, Route, Routes } from 'react-router'
// layouts
import Layout from './components/Layout.jsx'
import LayoutReserva from './components/LayoutReserva.jsx'
import LayoutAdmin from './components/LayoutAdmin.jsx'
// pages públicas
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import Perfil from './pages/Perfil.jsx'
import NotFound from './pages/NotFound.jsx'
// pages reserva
import Agenda from './pages/Agenda.jsx'
import Datos from './pages/Datos.jsx'
import Pago from './pages/Pago.jsx'
import Confirmacion from './pages/Confirmacion.jsx'
// pages admin
import Dashboard from './pages/Dashboard.jsx'
import CitasHorario from './pages/CitasHorario.jsx'
import Pacientes from './pages/Pacientes.jsx'
import Especialistas from './pages/Especialistas.jsx'
import Reportes from './pages/Reportes.jsx'
import './App.css'
import RutaAdmin from './components/RutaAdmin.jsx'

export default function App() {
  return (
    <Routes>
      {/* sitio público */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* reserva de citas */}
      <Route path="reserva" element={<LayoutReserva />}>
        <Route index element={<Navigate to="/reserva/agenda" replace />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="datos" element={<Datos />} />
        <Route path="pago" element={<Pago />} />
        <Route path="confirmacion" element={<Confirmacion />} />
        
      </Route>

      {/* panel admin (solo ADMIN) */}
      <Route element={<RutaAdmin />}>
        <Route path="admin" element={<LayoutAdmin />}>
          <Route index element={<Dashboard />} />
          <Route path="citas" element={<CitasHorario />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="especialistas" element={<Especialistas />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Route>
    </Routes>
  )
}