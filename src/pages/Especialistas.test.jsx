import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Especialistas from './Especialistas.jsx'
import { apiFetch, apiGet } from '../api'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
  apiFetch: vi.fn(),
}))

const lista = [
  { id: 1, nombre: 'Maria de Judas', especialidad: 'Nutrición Clínica', modalidad: 'Presencial y Online', descripcion: 'Experta', activo: true },
  { id: 2, nombre: 'Mario Di West', especialidad: 'Control de Peso', modalidad: 'Online', descripcion: 'Centrado', activo: false },
]

describe('Especialistas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue(lista)
  })

  it('renderiza la cabecera del panel', async () => {
    render(<Especialistas />)

    expect(screen.getByRole('heading', { name: /^especialistas$/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Equipo de profesionales')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ nuevo especialista/i })).toBeInTheDocument()
    await screen.findByText('Maria de Judas')
  })

  it('lista los especialistas del back con su estado', async () => {
    render(<Especialistas />)

    expect(await screen.findByText('Maria de Judas')).toBeInTheDocument()
    expect(screen.getByText('Nutrición Clínica')).toBeInTheDocument()
    expect(screen.getByText('Presencial y Online')).toBeInTheDocument()
    expect(screen.getByText('Mario Di West')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
    expect(apiGet).toHaveBeenCalledWith('/especialistas')
  })

  it('crea un especialista nuevo con POST', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 3, nombre: 'Dra. Nueva', especialidad: 'Nutrición Clínica', modalidad: 'Presencial', activo: true }),
    })
    render(<Especialistas />)
    await screen.findByText('Maria de Judas')

    await userEvent.click(screen.getByRole('button', { name: /\+ nuevo especialista/i }))
    await userEvent.type(screen.getByPlaceholderText('Nombre*'), 'Dra. Nueva')
    await userEvent.click(screen.getByRole('button', { name: /guardar especialista/i }))

    expect(apiFetch).toHaveBeenCalledWith('/especialistas', expect.objectContaining({ method: 'POST' }))
    expect(await screen.findByText('Dra. Nueva')).toBeInTheDocument()
  })

  it('activa o desactiva un especialista con PUT', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ ...lista[0], activo: false }) })
    render(<Especialistas />)
    await screen.findByText('Maria de Judas')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    expect(apiFetch).toHaveBeenCalledWith('/especialistas/1', expect.objectContaining({ method: 'PUT' }))
    expect(await screen.findAllByRole('button', { name: 'Activar' })).toHaveLength(2)
  })

  it('elimina un especialista después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apiFetch.mockResolvedValue({ ok: true })
    render(<Especialistas />)
    await screen.findByText('Maria de Judas')

    await userEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0])

    expect(apiFetch).toHaveBeenCalledWith('/especialistas/1', { method: 'DELETE' })
    expect(screen.queryByText('Maria de Judas')).not.toBeInTheDocument()
  })
})
