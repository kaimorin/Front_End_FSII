import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Confirmacion from './Confirmacion.jsx'

describe('Confirmacion', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renderiza el mensaje de éxito, recomendaciones y botón de volver', () => {
    render(
      <MemoryRouter>
        <Confirmacion />
      </MemoryRouter>
    )

    expect(screen.getByText('NUTRIVIDA')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /¡has agendado tu cita con éxito!/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /recomendaciones para tu visita:/i, level: 3 })).toBeInTheDocument()

    expect(screen.getByText(/llegar con unos 10 minutos de anticipación/i)).toBeInTheDocument()
    expect(screen.getByText(/si cuentas con exámenes de sangre recientes/i)).toBeInTheDocument()

    const botonInicio = screen.getByRole('link', { name: /volver al inicio/i })
    expect(botonInicio).toBeInTheDocument()
    expect(botonInicio).toHaveAttribute('href', '/')
  })

  it('muestra textos por defecto cuando no hay ninguna cita en sessionStorage', () => {
    render(
      <MemoryRouter>
        <Confirmacion />
      </MemoryRouter>
    )

    expect(screen.getByText('Por confirmar')).toBeInTheDocument()
    expect(screen.getByText('Fecha por confirmar')).toBeInTheDocument()
    expect(screen.getByText('Hora por confirmar')).toBeInTheDocument()

    // Sin cita no se muestran la especialidad ni el número de reserva
    expect(screen.queryByText(/especialidad:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/reserva:/i)).not.toBeInTheDocument()
  })

  it('muestra los detalles de la cita guardada, con el nombre de la especialidad y el número de reserva', () => {
    sessionStorage.setItem('cita', JSON.stringify({
      id: 12,
      doctor: 'Maximo Tul Onazzo',
      especialidad: 'nutricion-deportiva', // así la guarda Agenda
      modalidad: 'Online',
      fecha: 'Lunes, 10 de marzo de 2025',
      hora: '3:30 PM',
    }))

    render(
      <MemoryRouter>
        <Confirmacion />
      </MemoryRouter>
    )

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Maximo Tul Onazzo')).toBeInTheDocument()
    expect(screen.getByText('Nutrición Deportiva')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Lunes, 10 de marzo de 2025')).toBeInTheDocument()
    expect(screen.getByText('3:30 PM')).toBeInTheDocument()
  })
})
