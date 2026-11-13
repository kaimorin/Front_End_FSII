import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import Perfil from './Perfil.jsx'
import { apiGet } from '../api'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
}))

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/login" element={<div>Vista Login</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('usuario', JSON.stringify({ id: 5, nombre: 'Ana', apellido: 'Pérez', correo: 'ana@correo.cl', rol: 'PACIENTE' }))
    apiGet.mockImplementation(async (ruta) => {
      if (ruta === '/usuarios/5') {
        return { id: 5, nombre: 'Ana', apellido: 'Pérez', correo: 'ana@correo.cl', rut: '12.345.678-9', telefono: '+56 9 12345678' }
      }
      if (ruta.startsWith('/pacientes/rut/')) return { comuna: 'providencia', ciudad: 'Santiago' }
      if (ruta.startsWith('/citas/paciente/')) {
        return [{ id: 7, especialidad: 'control-peso', estado: 'Pendiente', modalidad: 'Online', precioBase: 35000, fecha: 'Lunes, 10 de marzo de 2025', hora: '11:00 AM' }]
      }
      return null
    })
  })

  it('redirige al login si no hay sesión iniciada', () => {
    localStorage.clear()
    renderizar()

    expect(screen.getByText('Vista Login')).toBeInTheDocument()
  })

  it('renderiza el sidebar de la cuenta', async () => {
    renderizar()

    expect(screen.getByRole('link', { name: /mi cuenta/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mis solicitudes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cerrar sesion/i })).toBeInTheDocument()
    await screen.findByText('RUT: 12.345.678-9')
  })

  it('muestra los datos reales del usuario que inició sesión', async () => {
    renderizar()

    expect(screen.getByRole('heading', { name: 'Bienvenido Ana', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('RUT: 12.345.678-9')).toBeInTheDocument()
    expect(screen.getByText('ana@correo.cl')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('Tel: +56 9 12345678')).toBeInTheDocument()
    expect(screen.getByText('Santiago, Providencia')).toBeInTheDocument()
    expect(apiGet).toHaveBeenCalledWith('/usuarios/5')
    expect(apiGet).toHaveBeenCalledWith('/citas/paciente/12.345.678-9')
  })

  it('lista las citas del paciente y permite buscar por ID', async () => {
    renderizar()

    expect(await screen.findByText('Control de Peso')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('$41,650')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Buscar por :ID'), '99')
    expect(screen.getByText('Aún no tienes citas agendadas.')).toBeInTheDocument()
  })

  it('cierra la sesión y vuelve al login', async () => {
    renderizar()
    await screen.findByText('RUT: 12.345.678-9')

    await userEvent.click(screen.getByRole('link', { name: /cerrar sesion/i }))

    expect(localStorage.getItem('usuario')).toBeNull()
    expect(screen.getByText('Vista Login')).toBeInTheDocument()
  })
})
