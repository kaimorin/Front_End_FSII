import { test, expect } from '@playwright/test';

test.describe('Flujo de Agendamiento - Paso 3 (Pago y Confirmación)', () => {
  
  test('Debe seleccionar pasarela, validar montos exactos y finalizar pago', async ({ page }) => {
    // 1. Navegar a la vista de pago
    await page.goto('/#/reserva/pago');
        // Simula sesión, reserva guardada y respuestas del back
    await page.evaluate(() => {
      localStorage.setItem('token', 'token-falso')
      localStorage.setItem('usuario', JSON.stringify({ rol: 'PACIENTE' }))
      sessionStorage.setItem('cita', JSON.stringify({ doctor: 'Maria de Judas', modalidad: 'Online', especialidad: 'control-peso', fecha: 'Lunes, 10 de marzo de 2025', hora: '10:00 AM' }))
      sessionStorage.setItem('datosPaciente', JSON.stringify({ nombre: 'Yvanni', apellido: 'Muñoz', rut: '12345678K', telefono: '+56 9 12345678', comuna: 'providencia', ciudad: 'Santiago', patologias: '', destinatario: 'para-mi' }))
    })
    await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))

    // 2. Validar que Webpay esté seleccionado por defecto
    const radioWebpay = page.locator('input[name="metodo_pago"][value="webpay"]');
    await expect(radioWebpay).toBeChecked();

    // 3. Cambiar el método de pago a Mercado Pago haciendo clic en su tarjeta visible (label)
    await page.locator('label').filter({ hasText: 'Mercado Pago' }).click();

    // 4. Validar el desglose de precios en el aside (Resumen)
    await expect(page.getByText('SUBTOTAL')).toBeVisible();
    await expect(page.getByText('$35,000').first()).toBeVisible();
    await expect(page.getByText('I.V.A')).toBeVisible();
    await expect(page.getByText('$6,650')).toBeVisible();
    
    // Usamos { exact: true } para que NO colisione con "SUBTOTAL"
    await expect(page.getByText('TOTAL', { exact: true })).toBeVisible();
    await expect(page.getByText('$41,650')).toBeVisible();

    // 5. Simular el pago clickeando el Link (Botón Pagar) - Omitimos el cupón
    await page.getByRole('link', { name: 'Pagar' }).click();

    // 6. Validar la navegación final hacia la confirmación
    await expect(page).toHaveURL(/.*#\/reserva\/confirmacion/);
  });
});