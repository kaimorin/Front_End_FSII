import { test, expect } from '@playwright/test';

test.describe('Flujo de Agendamiento - Paso 3 (Pago y Confirmación)', () => {
  test('Debe seleccionar pasarela, validar montos exactos y finalizar pago', async ({ page }) => {
    // 1. Mock ANTES del goto, si no las primeras llamadas se van al back real
    // En Playwright la última ruta registrada gana, por eso el genérico va primero
    // y los específicos después. Si **/api/** queda al final, tapa a **/api/citas
    // y el back devuelve {} en vez de { id: 999 }.
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
    await page.route('**/api/pacientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1 }),
      })
    })
    await page.route('**/api/citas', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999, estado: 'Confirmado' }),
      })
    })

    // 2. Sembrar sesión ANTES del goto, con la clave que realmente lee la app: 'sesion'
    //    y con addInitScript para que quede antes de que React monte
    await page.addInitScript(() => {
      localStorage.setItem('sesion', JSON.stringify({
        accessToken: 'token-falso',
        refreshToken: 'token-falso',
        id: 1,
        nombre: 'Yvanni',
        apellido: 'Muñoz',
        correo: 'yvanni@correo.cl',
        rol: 'PACIENTE',
      }))
      sessionStorage.setItem('cita', JSON.stringify({ doctor: 'Maria de Judas', modalidad: 'Online', especialidad: 'control-peso', fecha: 'Lunes, 10 de marzo de 2025', hora: '10:00 AM' }))
      sessionStorage.setItem('datosPaciente', JSON.stringify({ nombre: 'Yvanni', apellido: 'Muñoz', rut: '12345678K', telefono: '+56 9 12345678', comuna: 'providencia', ciudad: 'Santiago', patologias: '', destinatario: 'para-mi' }))
    })

    // 3. Ahora sí navegar
    await page.goto('/#/reserva/pago');

    // 4. Validar que Webpay esté seleccionado por defecto
    const radioWebpay = page.locator('input[name="metodo_pago"][value="webpay"]');
    await expect(radioWebpay).toBeChecked();

    // 5. Cambiar el método de pago a Mercado Pago haciendo clic en su tarjeta visible (label)
    await page.locator('label').filter({ hasText: 'Mercado Pago' }).click();

    // 6. Validar el desglose de precios en el aside (Resumen)
    await expect(page.getByText('SUBTOTAL')).toBeVisible();
    await expect(page.getByText('$35,000').first()).toBeVisible();
    await expect(page.getByText('I.V.A')).toBeVisible();
    await expect(page.getByText('$6,650')).toBeVisible();

    // Usamos { exact: true } para que NO colisione con "SUBTOTAL"
    await expect(page.getByText('TOTAL', { exact: true })).toBeVisible();
    await expect(page.getByText('$41,650')).toBeVisible();

    // 7. Simular el pago clickeando el Link (Botón Pagar) - Omitimos el cupón
    await page.getByRole('link', { name: 'Pagar' }).click();

    // 8. Validar la navegación final hacia la confirmación
    await expect(page).toHaveURL(/.*#\/reserva\/confirmacion/);

    // 9. Validar que la confirmación SÍ muestra paciente y doctor
    await expect(page.getByRole('heading', { name: /¡has agendado tu cita con éxito!/i })).toBeVisible();
    await expect(page.getByText('Yvanni Muñoz')).toBeVisible();
    await expect(page.getByText('Maria de Judas')).toBeVisible();
    await expect(page.getByText('yvanni@correo.cl')).toBeVisible();
    await expect(page.getByText('Control de Peso')).toBeVisible();
    // El 999 está partido: <li><strong>N.º de reserva:</strong> 999</li>
    // getByText('999') no lo encuentra, hay que buscar el <li> completo
    await expect(page.locator('li', { hasText: 'N.º de reserva:' })).toContainText('999');
    await expect(page.getByText('Lunes, 10 de marzo de 2025')).toBeVisible();
    await expect(page.getByText('10:00 AM')).toBeVisible();

    // 10. Validar que la cita guardada ya lleva paciente + doctor para Confirmacion
    const citaGuardada = await page.evaluate(() => JSON.parse(sessionStorage.getItem('cita')));
    expect(citaGuardada).toMatchObject({
      id: 999,
      doctor: 'Maria de Judas',
      especialidad: 'control-peso',
      paciente: 'Yvanni Muñoz',
      pacienteNombre: 'Yvanni',
      pacienteApellido: 'Muñoz',
      pacienteRut: '12.345.678-K',
    });
    // datosPaciente se borra para evitar doble pago
    const datosPaciente = await page.evaluate(() => sessionStorage.getItem('datosPaciente'));
    expect(datosPaciente).toBeNull();
  });
});