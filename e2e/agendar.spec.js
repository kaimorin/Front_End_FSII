import { test, expect } from '@playwright/test';

test.describe('Flujo de Agendamiento - Paso 2 (Doctor y Especialidad)', () => {
  
  test('Debe seleccionar doctor, modalidad, especialidad, fecha/hora y avanzar al Paso 3', async ({ page }) => {
    // 1. Navegar a la vista con la ruta absoluta y el HashRouter
    await page.goto('/#/reserva/agenda');

    // 2. Seleccionar Doctor (haciendo clic en el label que contiene el texto visible)
    await page.locator('label').filter({ hasText: "Maximo Tul 'Onazzo" }).click();

    // 3. Seleccionar Modalidad (haciendo clic en el label que dice Online)
    await page.locator('label').filter({ hasText: 'Online' }).click();

    // 4. Seleccionar Especialidad mediante su ID
    await page.locator('#selectEspecialidad').selectOption('salud-digestiva');

    // 5. Interacción con el Widget de Calendario personalizado (seleccionamos el día 9 como en la imagen)
    const diaSeleccionar = page.locator('.cal-matriz-numeros span:not(.dia-apagado)', { hasText: '9' }).first();
    await diaSeleccionar.click();
    
    // Validamos que se le haya aplicado la clase de selección
    await expect(diaSeleccionar).toHaveClass(/dia-marcado/);

    // 6. Interacción con el Widget de Hora (Ruedas)
    const ruedaHora = page.locator('.hora-selector-rueda .col-rueda').nth(0);
    // Usamos { exact: true } para evitar colisiones con otros números
    await ruedaHora.getByText('11', { exact: true }).click();

    const ruedaMinutos = page.locator('.hora-selector-rueda .col-rueda').nth(1);
    // Seleccionamos '00' como se ve en la interfaz
    await ruedaMinutos.getByText('00', { exact: true }).click();

    const ruedaAmPm = page.locator('.col-meridiano');
    // Seleccionamos AM
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
      doctor: 'Maximo Tul Onazzo',
      modalidad: 'Online',
      especialidad: 'salud-digestiva'
    });
  });
});