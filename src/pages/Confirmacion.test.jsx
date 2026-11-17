import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Confirmacion from './Confirmacion.jsx'

describe('Confirmacion', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
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
    // Sin sesión ni cita, el paciente cae al fallback
    expect(screen.getByText('Paciente')).toBeInTheDocument()

    // Sin cita no se muestran la especialidad ni el número de reserva
    expect(screen.queryByText(/especialidad:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/reserva:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/correo:/i)).not.toBeInTheDocument()
  })

  it('muestra los detalles de la cita guardada, con el nombre de la especialidad y el número de reserva', () => {
    sessionStorage.setItem('cita', JSON.stringify({
      id: 12,
      doctor: 'Maximo Tul Onazzo',
      especialidad: 'nutricion-deportiva', // así la guarda Agenda
      modalidad: 'Online',
      fecha: 'Lunes, 10 de marzo de 2025',
      hora: '3:30 PM',
      paciente: 'Yvanni Munoz',
      pacienteCorreo: 'yva@gmail.com',
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
    // NUEVO: paciente y correo que ahora guarda Pago.jsx
    expect(screen.getByText('Yvanni Munoz')).toBeInTheDocument()
    expect(screen.getByText('yva@gmail.com')).toBeInTheDocument()
  })

  it('muestra el paciente desde la sesión cuando la cita no trae paciente', () => {
    sessionStorage.setItem('cita', JSON.stringify({
      id: 12,
      doctor: 'Maximo Tul Onazzo',
      especialidad: 'nutricion-deportiva',
      modalidad: 'Online',
      fecha: 'Lunes, 10 de marzo de 2025',
      hora: '3:30 PM',
    }))
    localStorage.setItem('sesion', JSON.stringify({
      nombre: 'Yvanni',
      apellido: 'Munoz',
      correo: 'yva@gmail.com',
    }))

    render(
      <MemoryRouter>
        <Confirmacion />
      </MemoryRouter>
    )

    expect(screen.getByText('Yvanni Munoz')).toBeInTheDocument()
    expect(screen.getByText('yva@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Maximo Tul Onazzo')).toBeInTheDocument()
  })

  it('acepta doctor guardado como especialistaNombre', () => {
    sessionStorage.setItem('cita', JSON.stringify({
      id: 13,
      especialistaNombre: 'Maria de Judas',
      especialidad: 'control-peso',
      fecha: 'Lunes, 10 de marzo de 2025',
      hora: '11:00 AM',
      pacienteNombre: 'Ana',
      pacienteApellido: 'Pérez',
    }))

    render(
      <MemoryRouter>
        <Confirmacion />
      </MemoryRouter>
    )

    expect(screen.getByText('Maria de Judas')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
  })
})