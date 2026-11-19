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
  doctor: 'Maria de Judass',
  modalidad: 'Online',
  especialidad: 'control-peso',
  fecha: 'Lunes, 10 de marzo de 2025',
  hora: '11:00 AM',
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
  render(
    <MemoryRouter>
      <Pago />
    </MemoryRouter>
  )
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

  it('renderiza la barra de pasos de la agenda correctamente', () => {
    renderizar()

    expect(screen.getByText('1. Datos Personales')).toBeInTheDocument()
    expect(screen.getByText('2. Doctor y Especialidad')).toBeInTheDocument()

    const pasoActivo = screen.getByText('3. Pago y Facturacion')
    expect(pasoActivo).toBeInTheDocument()
    expect(pasoActivo).toHaveClass('paso-activo')
  })

  it('permite interactuar y seleccionar los métodos de pago Webpay o Mercado Pago', async () => {
    renderizar()

    const radioWebpay = screen.getByRole('radio', { name: /webpay/i })
    const radioMercadoPago = screen.getByRole('radio', { name: /mercado pago/i })

    expect(radioWebpay).toBeChecked()
    expect(radioMercadoPago).not.toBeChecked()

    await userEvent.click(radioMercadoPago)

    expect(radioWebpay).not.toBeChecked()
    expect(radioMercadoPago).toBeChecked()
  })

  it('muestra en el resumen la cita elegida en el paso 2 y los totales', () => {
    sessionStorage.setItem('cita', JSON.stringify(cita))
    renderizar()

    expect(screen.getByText('CITA DE CONTROL DE PESO')).toBeInTheDocument()
    expect(screen.getByText('MARIA DE JUDAS')).toBeInTheDocument()

    expect(screen.getByText('SUBTOTAL')).toBeInTheDocument()
    expect(screen.getByText('I.V.A')).toBeInTheDocument()
    expect(screen.getByText('$6,650')).toBeInTheDocument()
    expect(screen.getAllByText('$35,000').length).toBeGreaterThan(0)
    expect(screen.getByText('$41,650')).toBeInTheDocument()
  })

  it('permite desplegar el cupón de descuento y escribir en él', async () => {
    renderizar()

    expect(screen.getByText('TIENES UN CUPÓN?')).toBeInTheDocument()

    const inputCupon = screen.getByPlaceholderText('Ingresa cupón')
    const botonAplicar = screen.getByRole('button', { name: /aplicar/i })

    await userEvent.type(inputCupon, 'NUTRIVIDA2026')
    expect(inputCupon).toHaveValue('NUTRIVIDA2026')

    await userEvent.click(botonAplicar)
  })

  it('contiene los botones de navegación con sus rutas correctas', () => {
    renderizar()

    const botonPagar = screen.getByRole('link', { name: /pagar/i })
    const botonVolver = screen.getByRole('link', { name: /volver/i })

    expect(botonPagar).toHaveAttribute('href', '/reserva/confirmacion')
    expect(botonVolver).toHaveAttribute('href', '/reserva/agenda')
  })

  it('sin sesión ofrece iniciar sesión y no llama al back al pagar', async () => {
    renderizar()

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login')

    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))

    expect(screen.getByText('Debes iniciar sesión para pagar tu cita.')).toBeInTheDocument()
    expect(apiFetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('con sesión guarda al paciente, crea la cita y va a la confirmación', async () => {
    sesionPaciente()
    sessionStorage.setItem('cita', JSON.stringify(cita))
    sessionStorage.setItem('datosPaciente', JSON.stringify(paciente))
    apiFetch
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: 33 }) })
    renderizar()

    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/reserva/confirmacion'))

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/pacientes', expect.objectContaining({ method: 'POST' }))
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/citas', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(apiFetch.mock.calls[0][1].body).rut).toBe('12.345.678-K')

    // La cita queda guardada con su número y los datos del paciente se borran
    const citaGuardada = JSON.parse(sessionStorage.getItem('cita'))
    expect(citaGuardada.id).toBe(33)
    expect(sessionStorage.getItem('datosPaciente')).toBeNull()

    // NUEVO: Pago.jsx ahora guarda paciente + doctor para Confirmacion.jsx
    expect(citaGuardada.doctor).toBe('Maria de Judas')
    expect(citaGuardada.especialidad).toBe('control-peso')
    expect(citaGuardada.paciente).toBe('Ana Pérez')
    expect(citaGuardada.pacienteNombre).toBe('Ana')
    expect(citaGuardada.pacienteApellido).toBe('Pérez')
    expect(citaGuardada.pacienteRut).toBe('12.345.678-K')
    expect(citaGuardada.pacienteTelefono).toBe('+56 9 12345678')
    // paciente.correo no venía en datosPaciente, cae al correo de la sesión
    expect(citaGuardada.pacienteCorreo).toBe('ana@correo.cl')
    expect(citaGuardada.metodoPago).toBe('webpay')
  })

  it('normaliza el doctor cuando Agenda lo guarda como especialistaNombre', async () => {
    sesionPaciente()
    sessionStorage.setItem('cita', JSON.stringify({
      especialistaNombre: 'Maria de Judas',
      especialidad: 'control-peso',
      fecha: 'Lunes, 10 de marzo de 2025',
      hora: '11:00 AM',
      modalidad: 'Online',
    }))
    sessionStorage.setItem('datosPaciente', JSON.stringify(paciente))
    apiFetch
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: 34 }) })
    renderizar()

    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/reserva/confirmacion'))

    const citaGuardada = JSON.parse(sessionStorage.getItem('cita'))
    expect(citaGuardada.doctor).toBe('Maria de Judas')
    expect(citaGuardada.paciente).toBe('Ana Pérez')
  })

  it('muestra un error si el back rechaza la cita', async () => {
    sesionPaciente()
    sessionStorage.setItem('cita', JSON.stringify(cita))
    sessionStorage.setItem('datosPaciente', JSON.stringify(paciente))
    apiFetch
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) })
    renderizar()

    await userEvent.click(screen.getByRole('link', { name: /pagar/i }))

    expect(await screen.findByText('No se pudo crear la cita. Intenta nuevamente.')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})