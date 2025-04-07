// script.js



// Función para validar el RUT 
function validarRutChileno(rutCompleto) {
    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rutCompleto)) return false;
    var tmp = rutCompleto.split('-');
    var digv = tmp[1];
    var rut = tmp[0];
    if (digv == 'K') digv = 'k';
    return (dv(rut) == digv);
}

function dv(T) {
    var M = 0, S = 1;
    for (; T; T = Math.floor(T / 10))
        S = (S + T % 10 * (9 - M++ % 6)) % 11;
    return S ? S - 1 : 'k';
}


const form = document.getElementById('registrationForm');
const feedbackDiv = document.getElementById('feedback');
const submitButton = form ? form.querySelector('button[type="submit"]') : null;
const rutInput = document.getElementById('rut');
const rutError = document.getElementById('rutError');

// Verifica si los elementos existen antes de añadir listeners
if (form && feedbackDiv && submitButton && rutInput && rutError) {

    // Listener para validar RUT mientras se escribe 
    rutInput.addEventListener('input', () => {
        const rutValue = rutInput.value.trim();
        // Limpiar guiones múltiples o caracteres no permitidos mientras escribe
        rutInput.value = rutValue.replace(/[^0-9kK-]/g, '').replace(/-{2,}/g, '-');

        if (rutValue.length > 0 && !validarRutChileno(rutValue)) {
            rutError.classList.remove('hidden'); // Muestra error
            rutInput.setCustomValidity("Formato de RUT inválido."); // Para validación HTML5
        } else {
            rutError.classList.add('hidden'); // Oculta error
             rutInput.setCustomValidity(""); // Limpia validación HTML5
        }
    });


    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita el envío tradicional

        // Validar RUT antes de enviar
        if (!validarRutChileno(rutInput.value.trim())) {
            rutError.classList.remove('hidden');
            rutInput.focus(); // Pone el foco en el campo RUT
            feedbackDiv.textContent = 'Por favor, corrige el formato del RUT.';
            feedbackDiv.className = 'feedback-message show error'; // Resetea y muestra error
             // Ocultar mensaje después de unos segundos
            setTimeout(() => { feedbackDiv.classList.remove('show'); }, 5000);
            return; // Detiene el envío del formulario
        } else {
            rutError.classList.add('hidden');
        }


        // Oculta mensajes previos
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback-message'; // Resetea clases

        const formData = new FormData(form);
        // los nombres coinciden con los 'name' de los inputs
        const data = {
            nombreCompleto: formData.get('nombreCompleto'),
            rut: formData.get('rut'),
            fechaNacimiento: formData.get('fechaNacimiento'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            direccion: formData.get('direccion'),
            ciudad: formData.get('ciudad'),
            region: formData.get('region'),
            password: formData.get('password') // Se envía la contraseña en texto plano (se hashea en backend)
        };

        console.log('Valores enviados a la base de datos:', data);

        // Muestra un estado de carga
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        try {
            const apiUrl = 'http://localhost:3000/register'; // Asume mismo origen o proxy

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data), // Envía el objeto data con todos los campos
            });

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Error parsing server response:', jsonError);
                const errorText = await response.text();
                throw new Error(`Server responded with status ${response.status}: ${errorText || 'No additional details'}`);
            }

            if (response.ok) {
                feedbackDiv.textContent = result.message || '¡Registro exitoso!';
                feedbackDiv.classList.add('show', 'success');
                form.reset(); // Limpia el formulario
                 rutError.classList.add('hidden'); // Asegura ocultar error RUT en éxito
            } else {
                feedbackDiv.textContent = result.message || `Error ${response.status}: Ocurrió un problema en el servidor.`;
                feedbackDiv.classList.add('show', 'error');
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            feedbackDiv.textContent = error.message || 'Error de conexión o del servidor. Verifica la consola e inténtalo de nuevo.';
            if (!feedbackDiv.textContent.includes('Server responded with status')) {
                feedbackDiv.textContent = 'Error de conexión. Verifica tu red e inténtalo de nuevo.';
            }
            feedbackDiv.classList.add('show', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            setTimeout(() => {
                feedbackDiv.classList.remove('show');
                setTimeout(() => {
                    if (!feedbackDiv.classList.contains('show')) {
                        feedbackDiv.textContent = '';
                    }
                }, 300);
            }, 5000);
        }
    });
} else {
    console.error('Form elements not found. Script cannot initialize.');
}

