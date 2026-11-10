import { test, expect } from '@playwright/test';

test.describe('Flujo de Agendamiento - Paso 3 (Pago y Confirmación)', () => {
  
  test('Debe seleccionar pasarela, validar montos exactos y finalizar pago', async ({ page }) => {
    // 1. Navegar a la vista de pago
    await page.goto('/#/reserva/pago');

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