import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import userEvent from '@testing-library/user-event'
import Datos from './Datos.jsx'
import { apiGet } from '../api'

// Mock de react-router para capturar la función navigate
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
}))

describe('Datos', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    sessionStorage.clear()
    localStorage.clear()
  })

  it('renderiza la barra de pasos y todos los campos del formulario', () => {
    render(
      <MemoryRouter>
        <Datos />
      </MemoryRouter>
    )

    // Validar pasos
    const pasoActivo = screen.getByText('1. Datos Personales')
    expect(pasoActivo).toBeInTheDocument()
    expect(pasoActivo).toHaveClass('paso-activo')
    expect(screen.getByText('2. Doctor y Especialidad')).toBeInTheDocument()

    // Validar inputs por sus placeholders
    expect(screen.getByPlaceholderText('Nombre*')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Apellido*')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('RUT')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ciudad*')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Patologias')).toBeInTheDocument()

    // Validar select y radios
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /para mí/i })).toBeChecked()

    // Validar botones de acción
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver/i })).toHaveAttribute('href', '/')
  })

  it('sin sesión invita a iniciar sesión y no pide datos al back', () => {
    render(
      <MemoryRouter>
        <Datos />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /inicia sesión/i })).toHaveAttribute('href', '/login')
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('guarda los datos del formulario en sessionStorage y navega al siguiente paso al enviar', async () => {
    render(
      <MemoryRouter>
        <Datos />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByPlaceholderText('Nombre*'), 'Diego')
    await userEvent.type(screen.getByPlaceholderText('Apellido*'), 'Anabalón')
    await userEvent.type(screen.getByPlaceholderText('RUT'), '18475920-3')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'providencia')
    await userEvent.type(screen.getByPlaceholderText('Ciudad*'), 'Santiago')

    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    const datosGuardados = JSON.parse(sessionStorage.getItem('datosPaciente'))
    expect(datosGuardados).toEqual({
      nombre: 'Diego',
      apellido: 'Anabalón',
      rut: '18475920-3',
      telefono: '+56 9',
      comuna: 'providencia',
      ciudad: 'Santiago',
      patologias: '',
      destinatario: 'para-mi',
    })

    expect(mockNavigate).toHaveBeenCalledWith('/reserva/agenda')
  })

  it('con sesión iniciada autocompleta los datos del usuario y de su ficha de paciente', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 5, nombre: 'Ana', rol: 'PACIENTE' }))
    apiGet.mockImplementation(async (ruta) => {
      if (ruta === '/usuarios/5') {
        return { nombre: 'Ana', apellido: 'Pérez', rut: '12.345.678-9', telefono: '+56 9 12345678' }
      }
      return { comuna: 'providencia', ciudad: 'Santiago', patologias: 'Ninguna' }
    })

    render(
      <MemoryRouter>
        <Datos />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByPlaceholderText('Nombre*')).toHaveValue('Ana'))
    expect(screen.getByPlaceholderText('Apellido*')).toHaveValue('Pérez')
    expect(screen.getByPlaceholderText('RUT')).toHaveValue('12.345.678-9')
    expect(screen.getByPlaceholderText('Ciudad*')).toHaveValue('Santiago')
    expect(screen.getByPlaceholderText('Patologias')).toHaveValue('Ninguna')
    expect(screen.getByRole('combobox')).toHaveValue('providencia')
    expect(apiGet).toHaveBeenCalledWith('/pacientes/rut/12.345.678-9')
  })

  it('al elegir "Para conocido o familiar" vacía el formulario y al volver a "Para mí" recupera los datos', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 5, nombre: 'Ana', rol: 'PACIENTE' }))
    apiGet.mockImplementation(async (ruta) => {
      if (ruta === '/usuarios/5') {
        return { nombre: 'Ana', apellido: 'Pérez', rut: '12.345.678-9', telefono: '+56 9 12345678' }
      }
      return null
    })

    render(
      <MemoryRouter>
        <Datos />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByPlaceholderText('Nombre*')).toHaveValue('Ana'))

    await userEvent.click(screen.getByRole('radio', { name: /conocido o familiar/i }))
    expect(screen.getByPlaceholderText('Nombre*')).toHaveValue('')

    await userEvent.click(screen.getByRole('radio', { name: /para mí/i }))
    expect(screen.getByPlaceholderText('Nombre*')).toHaveValue('Ana')
  })

  it('si el usuario vuelve desde la agenda recupera lo que ya había escrito', () => {
    sessionStorage.setItem('datosPaciente', JSON.stringify({
      nombre: 'Diego', apellido: 'Anabalón', rut: '18475920-3', telefono: '+56 9',
      comuna: 'santiago', ciudad: 'Santiago', patologias: '', destinatario: 'para-mi',
    }))

    render(
      <MemoryRouter>
        <Datos />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText('Nombre*')).toHaveValue('Diego')
    expect(screen.getByRole('combobox')).toHaveValue('santiago')
  })
})
