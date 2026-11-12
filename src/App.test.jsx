import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App.jsx'

// Mock de las páginas y layouts para probar el enrutamiento de forma aislada
vi.mock('./pages/Home.jsx', () => ({ default: () => <div>Vista Home</div> }))
vi.mock('./pages/Login.jsx', () => ({ default: () => <div>Vista Login</div> }))
vi.mock('./pages/Registro.jsx', () => ({ default: () => <div>Vista Registro</div> }))
vi.mock('./pages/Perfil.jsx', () => ({ default: () => <div>Vista Perfil</div> }))
vi.mock('./pages/NotFound.jsx', () => ({ default: () => <div>Vista 404 Not Found</div> }))

vi.mock('./pages/Agenda.jsx', () => ({ default: () => <div>Vista Agenda Reserva</div> }))
vi.mock('./pages/Datos.jsx', () => ({ default: () => <div>Vista Datos Reserva</div> }))
vi.mock('./pages/Pago.jsx', () => ({ default: () => <div>Vista Pago Reserva</div> }))
vi.mock('./pages/Confirmacion.jsx', () => ({ default: () => <div>Vista Confirmacion Reserva</div> }))

vi.mock('./pages/Dashboard.jsx', () => ({ default: () => <div>Vista Dashboard Admin</div> }))
vi.mock('./pages/CitasHorario.jsx', () => ({ default: () => <div>Vista Citas Admin</div> }))
vi.mock('./pages/Pacientes.jsx', () => ({ default: () => <div>Vista Pacientes Admin</div> }))
vi.mock('./pages/Especialistas.jsx', () => ({ default: () => <div>Vista Especialistas Admin</div> }))
vi.mock('./pages/Reportes.jsx', () => ({ default: () => <div>Vista Reportes Admin</div> }))

describe('App Routing', () => {
    beforeEach(() => {
    localStorage.setItem('usuario', JSON.stringify({ rol: 'ADMIN' }))
  })
  // 1. Sitio Público
  it('renderiza la página Home en la ruta raíz "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Home')).toBeInTheDocument()
  })

  it('renderiza la página Login en la ruta "/login"', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Login')).toBeInTheDocument()
  })

  it('renderiza la página Registro en la ruta "/registro"', () => {
    render(
      <MemoryRouter initialEntries={['/registro']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Registro')).toBeInTheDocument()
  })

  it('renderiza la página NotFound cuando la ruta no existe', () => {
    render(
      <MemoryRouter initialEntries={['/ruta-inexistente']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista 404 Not Found')).toBeInTheDocument()
  })

  // 2. Módulo de Reserva (Prueba de redirección)
  it('redirige de "/reserva" a "/reserva/agenda"', () => {
    render(
      <MemoryRouter initialEntries={['/reserva']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Agenda Reserva')).toBeInTheDocument()
  })

  it('renderiza la página Pago en "/reserva/pago"', () => {
    render(
      <MemoryRouter initialEntries={['/reserva/pago']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Pago Reserva')).toBeInTheDocument()
  })

  // 3. Módulo de Administración
  it('renderiza el Dashboard en la ruta raíz de admin "/admin"', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Dashboard Admin')).toBeInTheDocument()
  })

  it('renderiza la vista Pacientes en "/admin/pacientes"', () => {
    render(
      <MemoryRouter initialEntries={['/admin/pacientes']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Vista Pacientes Admin')).toBeInTheDocument()
  })
})