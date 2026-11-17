import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import Login from './Login.jsx'

describe('Login', () => {
  it('renderiza el formulario de inicio de sesión correctamente', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Ingresar$/i })).toBeInTheDocument()
  })

  it('permite escribir credenciales en los campos', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    const inputCorreo = screen.getByLabelText(/Correo Electrónico/i)
    const inputContraseña = screen.getByLabelText(/Contraseña/i)

    await userEvent.type(inputCorreo, 'marisol@gmail.com')
    await userEvent.type(inputContraseña, 'password123')

    expect(inputCorreo).toHaveValue('marisol@gmail.com')
    expect(inputContraseña).toHaveValue('password123')
  })

  it('muestra el enlace para registrarse si no tiene cuenta', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    // Tu Login real no tiene botón de Google, tiene este link a registro
    expect(screen.getByRole('link', { name: /aquí/i })).toHaveAttribute('href', '/registro')
  })
})