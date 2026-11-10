import { test, expect } from '@playwright/test';

test.describe('Flujo de Agendamiento - Paso 1 (Datos Personales)', () => {
  
  test('Debe llenar el formulario, guardar en SessionStorage y avanzar al Paso 2', async ({ page }) => {
    // 1. Navegar a la vista con la ruta absoluta y el HashRouter
    await page.goto('/#/reserva/datos');
    
    // 2. Llenar inputs de texto basados en sus placeholders exactos
    await page.getByPlaceholder('Nombre*').fill('Yvanni');
    await page.getByPlaceholder('Apellido*').fill('Muñoz');
    await page.getByPlaceholder('RUT').fill('12.345.678-9');
    
    // Para el teléfono, como tiene un defaultValue "+56 9", podemos concatenar el resto
    // o ubicarlo por su atributo name si el placeholder no está disponible.
    const inputTelefono = page.locator('input[name="telefono"]');
    await inputTelefono.fill('+56 9 12345678'); 

    // 3. Interactuar con el select y ciudad
    await page.locator('select[name="comuna"]').selectOption('providencia');
    await page.getByPlaceholder('Ciudad*').fill('Santiago');
    
    // Patologías es opcional, lo llenamos para probar la persistencia
    await page.getByPlaceholder('Patologias').fill('Ninguna');

    // 4. Validar que "Para mí" está seleccionado por defecto (value="para-mi")
    const radioParaMi = page.locator('input[name="destinatario"][value="para-mi"]');
    await expect(radioParaMi).toBeChecked();

    // 5. Enviar el formulario
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // 6. Validar que la navegación se ejecutó correctamente usando regex para el hash
    await expect(page).toHaveURL(/.*#\/reserva\/agenda/);

    // 7. Validar que SessionStorage contiene la data correcta extraída por FormData
    const datosPaciente = await page.evaluate(() => sessionStorage.getItem('datosPaciente'));
    expect(datosPaciente).toBeTruthy();
    
    const parsedData = JSON.parse(datosPaciente);
    expect(parsedData).toMatchObject({
      nombre: 'Yvanni',
      apellido: 'Muñoz',
      rut: '12.345.678-9',
      comuna: 'providencia',
      ciudad: 'Santiago',
      destinatario: 'para-mi'
    });
  });
});