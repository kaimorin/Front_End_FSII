import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import userEvent from '@testing-library/user-event'
import Agenda from './Agenda.jsx'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: vi.fn() }
})

describe('Agenda', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    sessionStorage.clear()
    global.fetch = vi.fn().mockRejectedValue(new Error('API no disponible en la prueba'))
  })

  it('renderiza la barra de pasos y las tarjetas de especialistas', () => {
    render(<MemoryRouter><Agenda /></MemoryRouter>)

    const pasoActivo = screen.getByText('2. Doctor y Especialidad')
    expect(pasoActivo).toBeInTheDocument()
    expect(pasoActivo).toHaveClass('paso-activo')

    expect(screen.getByText('Maria de Judas')).toBeInTheDocument()
    expect(screen.getByText("Maximo Tul 'Onazzo")).toBeInTheDocument()
    expect(screen.getByText("Mario Di 'West")).toBeInTheDocument()
    expect(screen.getByText("Shaqueal O'neal")).toBeInTheDocument()
    expect(screen.getAllByText(/Valor base:/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /volver/i })).toHaveAttribute('href', '/reserva/datos')
  })

  it('permite cambiar la modalidad y el especialista', async () => {
    render(<MemoryRouter><Agenda /></MemoryRouter>)

    const radioPresencial = screen.getByRole('radio', { name: /presencial/i })
    const radioOnline = screen.getByRole('radio', { name: /online/i })
    expect(radioPresencial).toBeChecked()

    await userEvent.click(radioOnline)
    expect(radioOnline).toBeChecked()

    const radioMaximo = screen.getByRole('radio', { name: /maximo tul 'onazzo/i })
    await userEvent.click(radioMaximo)
    expect(radioMaximo).toBeChecked()
    // Maximo solo ofrece atención presencial, por eso la modalidad se ajusta.
    expect(screen.getByRole('radio', { name: /presencial/i })).toBeChecked()
    expect(screen.queryByRole('radio', { name: /online/i })).not.toBeInTheDocument()
  })

  it('permite interactuar con el calendario y el selector de hora', async () => {
    render(<MemoryRouter><Agenda /></MemoryRouter>)

    await userEvent.click(screen.getByRole('button', { name: /mes siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: /mes anterior/i }))
    await userEvent.click(screen.getByRole('button', { name: /hoy/i }))

    const opcionPm = screen.getByText('PM')
    await userEvent.click(opcionPm)
    expect(opcionPm).toHaveClass('activa')
  })

  it('guarda el ID del especialista y la fecha ISO antes de continuar', async () => {
    render(<MemoryRouter><Agenda /></MemoryRouter>)

    // ARREGLADO: /^Siguiente$/ para que no calce con "Mes siguiente"
    await userEvent.click(screen.getByRole('button', { name: /^Siguiente$/ }))

    const citaGuardada = JSON.parse(sessionStorage.getItem('cita'))
    expect(citaGuardada).not.toBeNull()
    expect(citaGuardada.especialistaId).toBe(1)
    expect(citaGuardada.doctor).toBe('Maria de Judas')
    expect(citaGuardada.fechaISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(citaGuardada.precioBase).toBe(35000)
    expect(mockNavigate).toHaveBeenCalledWith('/reserva/pago')
  })

  it('muestra la alerta estilizada si se elige una fecha pasada', async () => {
    render(<MemoryRouter><Agenda /></MemoryRouter>)

    const fechaAnterior = new Date()
    fechaAnterior.setDate(1)
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1)
    const mesAnterior = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaAnterior)
    await userEvent.click(screen.getByRole('button', { name: /mes anterior/i }))
    // ARREGLADO: ^...$ para que no calce con 11, 21 y 31 del mismo mes
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^1 de ${mesAnterior}$`, 'i') }))

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveClass('alerta-error')
    expect(alerta).toHaveTextContent(/fecha que elegiste ya pasó/i)
  })
})