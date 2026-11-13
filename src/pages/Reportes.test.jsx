import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Reportes from './Reportes.jsx'
import { apiGet } from '../api'
import { fechaLarga } from '../utils/formato'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
}))

const hoy = fechaLarga(new Date())
const citas = [
  { id: 1, pacienteNombre: 'Lucas', pacienteApellido: 'Gómez', especialidad: 'control-peso', metodoPago: 'webpay', fecha: hoy, hora: '11:00 AM', estado: 'Confirmado', precioBase: 35000 },
  { id: 2, pacienteNombre: 'Elena', pacienteApellido: 'Rostova', especialidad: 'salud-digestiva', metodoPago: 'mercadopago', fecha: hoy, hora: '12:00 PM', estado: 'Pendiente', precioBase: 35000 },
  { id: 3, pacienteNombre: 'Camila', pacienteApellido: 'Rojas', especialidad: 'control-peso', metodoPago: 'webpay', fecha: hoy, hora: '10:30 AM', estado: 'Atendido', precioBase: 35000 },
  { id: 4, pacienteNombre: 'Pedro', pacienteApellido: 'Soto', especialidad: 'nutricion-deportiva', metodoPago: 'webpay', fecha: hoy, hora: '01:00 PM', estado: 'Cancelado', precioBase: 35000 },
]

describe('Reportes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue(citas)
  })

  it('renderiza la cabecera con el título y la descripción', async () => {
    render(<Reportes />)

    expect(screen.getByRole('heading', { name: /reportes y pagos/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Resumen de ingresos y pagos')).toBeInTheDocument()
    await screen.findByText('Lucas Gómez')
  })

  it('calcula las métricas con las citas del back', async () => {
    render(<Reportes />)
    await screen.findByText('Lucas Gómez')

    expect(screen.getByText('$83,300')).toBeInTheDocument() // Lucas y Camila, con IVA
    expect(screen.getByText('2')).toBeInTheDocument() // pagos realizados
    expect(screen.getByText('1')).toBeInTheDocument() // pendiente: Elena
  })

  it('muestra cada pago con su estado y clase de color', async () => {
    render(<Reportes />)
    await screen.findByText('Lucas Gómez')

    expect(screen.getByText('Salud Digestiva')).toBeInTheDocument()
    expect(screen.getAllByText('$41,650').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pagado')[0]).toHaveClass('badge', 'badge-finalizado')
    expect(screen.getByText('Pendiente')).toHaveClass('badge', 'badge-pendiente')
    expect(screen.getByText('Cancelado')).toHaveClass('badge', 'badge-cancelado')
  })
})
