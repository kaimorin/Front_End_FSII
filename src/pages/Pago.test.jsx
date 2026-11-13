import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import userEvent from '@testing-library/user-event'
import Pago from './Pago.jsx'
import { apiFetch } from '../api'

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: vi.fn(),
}))

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}))

const cita = {
  doctor: 'Maria de Judas',
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

describe('Pago', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    localStorage.clear()
    sessionStorage.clear()
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
    localStorage.setItem('usuario', JSON.stringify({ id: 5, rol: 'PACIENTE' }))
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
    expect(JSON.parse(sessionStorage.getItem('cita')).id).toBe(33)
    expect(sessionStorage.getItem('datosPaciente')).toBeNull()
  })

  it('muestra un error si el back rechaza la cita', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 5, rol: 'PACIENTE' }))
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
