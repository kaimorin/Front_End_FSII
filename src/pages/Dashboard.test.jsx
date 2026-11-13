import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Dashboard from './Dashboard.jsx'
import { apiGet } from '../api'
import { fechaLarga } from '../utils/formato'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
}))

const hoy = fechaLarga(new Date())
const citas = [
  { id: 1, pacienteNombre: 'Lucas', pacienteApellido: 'Gómez', pacienteRut: '12.345.678-9', doctor: 'Maria de Judas', especialidad: 'control-peso', fecha: hoy, hora: '11:00 AM', estado: 'Confirmado', precioBase: 35000 },
  { id: 2, pacienteNombre: 'Elena', pacienteApellido: 'Rostova', pacienteRut: '13.456.789-0', doctor: 'Mario Di West', especialidad: 'salud-digestiva', fecha: hoy, hora: '12:00 PM', estado: 'Pendiente', precioBase: 35000 },
  { id: 3, pacienteNombre: 'Camila', pacienteApellido: 'Rojas', pacienteRut: '14.567.890-1', doctor: 'Maria de Judas', especialidad: 'control-peso', fecha: 'Lunes, 1 de enero de 2001', hora: '10:30 AM', estado: 'Cancelado', precioBase: 35000 },
]
const pacientes = [{ id: 1 }, { id: 2 }, { id: 3 }]

function renderizar() {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('usuario', JSON.stringify({ rol: 'ADMIN', nombre: 'Ana' }))
    apiGet.mockImplementation(async (ruta) => (ruta === '/citas' ? citas : pacientes))
  })

  it('muestra el saludo con el nombre del usuario y el buscador', async () => {
    renderizar()

    expect(screen.getByRole('heading', { name: /panel general/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Bienvenido de vuelta, Ana')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar paciente, RUT o ID...')).toBeInTheDocument()
    await screen.findByText('Lucas Gómez')
  })

  it('calcula las métricas con las citas y pacientes del back', async () => {
    renderizar()
    await screen.findByText('Lucas Gómez')

    expect(screen.getByText('Citas de Hoy')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // Lucas y Elena son de hoy; Camila está cancelada
    expect(screen.getByText('3')).toBeInTheDocument() // pacientes registrados
    expect(screen.getByText('$41,650')).toBeInTheDocument() // solo Lucas está confirmado
    expect(screen.getByText('1')).toBeInTheDocument() // Elena está pendiente
  })

  it('lista las próximas citas sin mostrar las canceladas y permite buscar', async () => {
    renderizar()

    expect(await screen.findByText('Lucas Gómez')).toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
    expect(screen.queryByText('Camila Rojas')).not.toBeInTheDocument()
    expect(screen.getByText('Control de Peso')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Buscar paciente, RUT o ID...'), 'Elena')
    expect(screen.queryByText('Lucas Gómez')).not.toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
  })

  it('muestra un mensaje si el back no responde con los datos', async () => {
    apiGet.mockResolvedValue(null)
    renderizar()

    expect(await screen.findByText('No se pudieron cargar los datos del panel.')).toBeInTheDocument()
  })
})
