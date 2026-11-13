import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import userEvent from '@testing-library/user-event'
import Header from './Header.jsx'

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: vi.fn(),
}))

describe('Header según la sesión', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    localStorage.clear()
    sessionStorage.clear()
  })

  function renderizar() {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
  }

  it('sin sesión muestra "Iniciar sesión" y Mi Salud lleva al registro', () => {
    renderizar()

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Mi Salud' })).toHaveAttribute('href', '/registro')
    expect(screen.queryByRole('link', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('con sesión de paciente muestra "Cerrar sesión" y Mi Salud lleva al perfil', () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1, rol: 'PACIENTE' }))
    renderizar()

    expect(screen.getByRole('link', { name: 'Mi Salud' })).toHaveAttribute('href', '/perfil')
    expect(screen.getByRole('link', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Panel admin' })).not.toBeInTheDocument()
  })

  it('con sesión de administrador muestra el enlace al panel admin', () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1, rol: 'ADMIN' }))
    renderizar()

    expect(screen.getByRole('link', { name: 'Panel admin' })).toHaveAttribute('href', '/admin')
  })

  it('al cerrar sesión borra la sesión y los datos de la reserva, y vuelve al inicio', async () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('usuario', JSON.stringify({ id: 1, rol: 'PACIENTE' }))
    sessionStorage.setItem('datosPaciente', '{}')
    renderizar()

    await userEvent.click(screen.getByRole('link', { name: 'Cerrar sesión' }))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
    expect(sessionStorage.getItem('datosPaciente')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/')
    // el Header se actualiza solo
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
