import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import userEvent from '@testing-library/user-event'
import Pago from './Pago.jsx'
import { apiFetch, guardarSesion, cerrarSesion } from '../api'

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: vi.fn(),
}))

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}))

const cita = {
  especialistaId: 7,
  doctor: 'Maria de Judas',
  modalidad: 'Online',
  especialidad: 'Nutrición Clínica',
  fecha: 'Martes, 1 de diciembre de 2026',
  fechaISO: '2026-12-01',
  hora: '11:00 AM',
  precioBase: 42000,
}
const paciente = {
  nombre: 'Ana',
  apellido: 'Pérez',
  rut: '12345678K',
  telefono: '+56 9 12345678',
  comuna: 'providencia',
  ciudad: 'Santiago',
  patologias: '',
  destinatario: 'para-mi',
}

function renderizar() {
  render(<MemoryRouter><Pago /></MemoryRouter>)
}

function sesionPaciente() {
  guardarSesion({
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
    id: 5,
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@correo.cl',
    rol: 'PACIENTE',
  })
}

describe('Pago', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    cerrarSesion()
    localStorage.clear()
    sessionStorage.clear()
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  it('renderiza correctamente los pasos de la reserva', () => {
    renderizar()
    expect(screen.getByText('1. Datos Personales')).toBeInTheDocument()
    expect(screen.getByText('2. Doctor y Especialidad')).toBeInTheDocument()
    expect(screen.getByText('3. Pago y Facturacion')).toHaveClass('paso-activo')
  })

  it('permite seleccionar Webpay o Mercado Pago', async () => {
    renderizar()
    const radioWebpay = screen.getByRole('radio', { name: /webpay/i })
    const radioMercadoPago = screen.getByRole('radio', { name: /mercado pago/i })

    expect(radioWebpay).toBeChecked()
    expect(radioMercadoPago).not.toBeChecked()
    await userEvent.click(radioMercadoPago)
    expect(radioMercadoPago).toBeChecked()
  })

  it('calcula subtotal, IVA y total con el precio del especialista', () => {
    sessionStorage.setItem('cita', JSON.stringify(cita))
    renderizar()

    expect(screen.getByText('CITA DE NUTRICIÓN CLÍNICA')).toBeInTheDocument()
    expect(screen.getByText('MARIA DE JUDAS')).toBeInTheDocument()
    expect(screen.getByText('SUBTOTAL')).toBeInTheDocument()
    expect(screen.getByText('I.V.A (19%)')).toBeInTheDocument()
    expect(screen.getByText('$7,980')).toBeInTheDocument()
    expect(screen.getAllByText('$42,000').length).toBeGreaterThan(0)
    expect(screen.getByText('$49,980')).toBeInTheDocument()
    expect(screen.queryByText('TIENES UN CUPÓN?')).not.toBeInTheDocument()
  })

  it('contiene los botones de navegación', () => {
    renderizar()
    expect(screen.getByRole('link', { name: /pagar/i })).toHaveAttribute('href', '/reserva/confirmacion')
    expect(screen.getByRole('link', { name: /volver/i })).toHaveAttribute('href', '/reserva/agenda')
  })

  it('sin sesión muestra el aviso y no llama al backend', async () => {
    renderizar()
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login')
    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))
    expect(screen.getByText('Debes iniciar sesión para pagar tu cita.')).toBeInTheDocument()
    expect(apiFetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('con sesión guarda paciente y crea la reserva con el ID del especialista', async () => {
    sesionPaciente()
    sessionStorage.setItem('cita', JSON.stringify(cita))
    sessionStorage.setItem('datosPaciente', JSON.stringify(paciente))

    apiFetch
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 33,
          especialistaId: 7,
          doctor: 'Maria de Judas',
          especialidad: 'Nutrición Clínica',
          precioBase: 42000,
          iva: 7980,
          total: 49980,
          fechaISO: cita.fechaISO,
        }),
      })

    renderizar()
    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/reserva/confirmacion'))

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/pacientes', expect.objectContaining({ method: 'POST' }))
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/citas', expect.objectContaining({ method: 'POST' }))

    const enviado = JSON.parse(apiFetch.mock.calls[1][1].body)
    expect(enviado.especialistaId).toBe(7)
    expect(enviado.fechaISO).toBe(cita.fechaISO)
    expect(enviado.precioBase).toBeUndefined()
    expect(enviado.total).toBeUndefined()
    expect(JSON.parse(apiFetch.mock.calls[0][1].body).rut).toBe('12.345.678-K')

    const citaGuardada = JSON.parse(sessionStorage.getItem('cita'))
    expect(citaGuardada.id).toBe(33)
    expect(citaGuardada.especialistaId).toBe(7)
    expect(citaGuardada.doctor).toBe('Maria de Judas')
    expect(citaGuardada.precioBase).toBe(42000)
    expect(citaGuardada.iva).toBe(7980)
    expect(citaGuardada.total).toBe(49980)
    expect(citaGuardada.paciente).toBe('Ana Pérez')
    expect(citaGuardada.pacienteRut).toBe('12.345.678-K')
    expect(citaGuardada.pacienteCorreo).toBe('ana@correo.cl')
    expect(citaGuardada.metodoPago).toBe('webpay')
    expect(sessionStorage.getItem('datosPaciente')).toBeNull()
  })

  it('muestra el mensaje que devuelve el backend si rechaza la reserva', async () => {
    sesionPaciente()
    sessionStorage.setItem('cita', JSON.stringify(cita))
    sessionStorage.setItem('datosPaciente', JSON.stringify(paciente))
    apiFetch
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'No atendemos los domingos.' }) })

    renderizar()
    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))

    expect(await screen.findByText('No atendemos los domingos.')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
