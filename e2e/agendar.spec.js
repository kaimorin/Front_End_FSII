import { test, expect } from '@playwright/test';

test.describe('Flujo de Agendamiento - Paso 2 (Doctor y Especialidad)', () => {

  test('Debe seleccionar doctor, modalidad, especialidad, fecha/hora y avanzar al Paso 3', async ({ page }) => {
    // 1. Navegar a la vista con la ruta absoluta y el HashRouter
    await page.goto('/#/reserva/agenda');

    // 2. Seleccionar Doctor: Maria SÍ tiene Online (Maximo es solo Presencial)
    await page.locator('label').filter({ hasText: 'Maria de Judas' }).click();

    // 3. Seleccionar Modalidad Online
    await page.locator('label').filter({ hasText: 'Online' }).click();

    // 4. NO hay #selectEspecialidad en Agenda.jsx.
    // La especialidad viene del doctor: Maria = Nutrición Clínica.
    // Se valida abajo en sessionStorage.

    // 5. Calendario: vamos al mes siguiente para asegurar que el día sea futuro
    // y no caiga en una fecha pasada (el día 9 de este mes ya pasó).
    await page.getByRole('button', { name: 'Mes siguiente' }).click();

    // El calendario usa <button class="cal-dia">, no <span>.
    // Elegimos el primer día hábil (no apagado, no domingo) del mes siguiente.
    const diaSeleccionar = page.locator('.cal-dia:not(.dia-apagado):not(.dia-domingo)').first();
    await diaSeleccionar.click();

    // Validamos que se le haya aplicado la clase de selección
    await expect(diaSeleccionar).toHaveClass(/dia-marcado/);

    // 6. Interacción con el Widget de Hora (Ruedas)
    const ruedaHora = page.locator('.hora-selector-rueda .col-rueda').nth(0);
    await ruedaHora.getByText('11', { exact: true }).click();

    const ruedaMinutos = page.locator('.hora-selector-rueda .col-rueda').nth(1);
    await ruedaMinutos.getByText('00', { exact: true }).click();

    const ruedaAmPm = page.locator('.col-meridiano');
    await ruedaAmPm.locator('span', { hasText: 'AM' }).click();

    // 7. Enviar el formulario
    await page.locator('#btnSiguientePaso').click();

    // 8. Validar navegación al Paso 3 usando regex para el hash
    await expect(page).toHaveURL(/.*#\/reserva\/pago/);

    // 9. Validar persistencia en SessionStorage
    const cita = await page.evaluate(() => sessionStorage.getItem('cita'));
    expect(cita).toBeTruthy();

    const parsedCita = JSON.parse(cita);
    expect(parsedCita).toMatchObject({
      doctor: 'Maria de Judas',
      modalidad: 'Online',
      especialidad: 'Nutrición Clínica',
    });
    // La app guarda especialistaId y fechaISO, que Pago.jsx exige después
    expect(parsedCita.especialistaId).toBe(1);
    expect(parsedCita.fechaISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});