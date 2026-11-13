import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pacientes from './Pacientes.jsx'
import { apiFetch, apiGet } from '../api'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
  apiFetch: vi.fn(),
}))

const pacientes = [
  { id: 1, nombre: 'Lucas', apellido: 'Gómez', rut: '12.345.678-9', telefono: '+56 9 1111 1111' },
  { id: 2, nombre: 'Elena', apellido: 'Rostova', rut: '13.456.789-0', telefono: '+56 9 2222 2222' },
]
const citas = [{ id: 10, pacienteRut: '12.345.678-9', especialidad: 'control-peso' }]

describe('Pacientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockImplementation(async (ruta) => (ruta === '/pacientes' ? pacientes : citas))
  })

  it('renderiza la cabecera y el buscador', async () => {
    render(<Pacientes />)

    expect(screen.getByRole('heading', { name: /^pacientes$/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Listado de pacientes registrados')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar paciente o RUT...')).toBeInTheDocument()
    await screen.findByText('Lucas Gómez')
  })

  it('lista los pacientes del back con su último servicio', async () => {
    render(<Pacientes />)

    expect(await screen.findByText('Lucas Gómez')).toBeInTheDocument()
    expect(screen.getByText('12.345.678-9')).toBeInTheDocument()
    expect(screen.getByText('+56 9 1111 1111')).toBeInTheDocument()
    expect(screen.getByText('Control de Peso')).toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument() // Elena no tiene citas
    expect(apiGet).toHaveBeenCalledWith('/pacientes')
  })

  it('filtra por nombre o RUT al escribir en el buscador', async () => {
    render(<Pacientes />)
    await screen.findByText('Lucas Gómez')

    await userEvent.type(screen.getByPlaceholderText('Buscar paciente o RUT...'), '13.456')

    expect(screen.queryByText('Lucas Gómez')).not.toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
  })

  it('elimina un paciente después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apiFetch.mockResolvedValue({ ok: true })
    render(<Pacientes />)
    await screen.findByText('Lucas Gómez')

    await userEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0])

    expect(apiFetch).toHaveBeenCalledWith('/pacientes/1', { method: 'DELETE' })
    expect(screen.queryByText('Lucas Gómez')).not.toBeInTheDocument()
  })
})
