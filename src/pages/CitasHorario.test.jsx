import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import CitasHorario from './CitasHorario.jsx'
import { apiFetch, apiGet } from '../api'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
  apiFetch: vi.fn(),
}))

const citas = [
  { id: 1, pacienteNombre: 'Lucas', pacienteApellido: 'Gómez', doctor: 'Maria de Judas', especialidad: 'control-peso', fecha: 'Lunes, 10 de marzo de 2025', hora: '09:30 AM', estado: 'Confirmado' },
  { id: 2, pacienteNombre: 'Elena', pacienteApellido: 'Rostova', doctor: 'Mario Di West', especialidad: 'salud-digestiva', fecha: 'Martes, 11 de marzo de 2025', hora: '10:30 AM', estado: 'Pendiente' },
]

function renderizar() {
  render(
    <MemoryRouter>
      <CitasHorario />
    </MemoryRouter>
  )
}

describe('CitasHorario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue(citas)
  })

  it('renderiza la cabecera y el botón de nueva cita', async () => {
    renderizar()

    expect(screen.getByRole('heading', { name: /^citas y horarios$/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Agenda de todas las citas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ nueva cita/i })).toBeInTheDocument()
    await screen.findByText('Lucas Gómez')
  })

  it('lista las citas reales del back', async () => {
    renderizar()

    expect(await screen.findByText('Lucas Gómez')).toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
    expect(screen.getByText('Mario Di West')).toBeInTheDocument()
    expect(screen.getByText('Salud Digestiva')).toBeInTheDocument()
    expect(screen.getByText('Lunes, 10 de marzo de 2025 - 09:30 AM')).toBeInTheDocument()
    expect(apiGet).toHaveBeenCalledWith('/citas')
  })

  it('cambia el estado de una cita con PATCH', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ ...citas[1], estado: 'Confirmado' }) })
    renderizar()
    await screen.findByText('Elena Rostova')

    const selector = screen.getByLabelText('Cambiar estado de la cita 2')
    await userEvent.selectOptions(selector, 'Confirmado')

    expect(apiFetch).toHaveBeenCalledWith('/citas/2/estado', {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Confirmado' }),
    })
    await waitFor(() => expect(selector).toHaveValue('Confirmado'))
  })

  it('muestra un error si no se pueden cargar las citas', async () => {
    apiGet.mockResolvedValue(null)
    renderizar()

    expect(await screen.findByText('No se pudieron cargar las citas.')).toBeInTheDocument()
  })
})
