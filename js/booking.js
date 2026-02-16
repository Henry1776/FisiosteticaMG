document.addEventListener('DOMContentLoaded', function () {
    const bookingForm = document.getElementById('booking-form');
    const serviceSelect = document.getElementById('service');
    const priceDisplay = document.getElementById('price-display');
    const totalPrice = document.getElementById('total-price');

    // Load services dynamically
    async function loadServices() {
        try {
            const response = await fetch('/api/services');
            const services = await response.json();

            if (serviceSelect) {
                // Keep the default option
                serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.name.toLowerCase().replace(/\s+/g, '_'); // Consistent ID
                    option.textContent = `${service.name} - $${Math.round(service.price)}`;
                    option.setAttribute('data-price', service.price);
                    option.setAttribute('data-real-name', service.name);
                    serviceSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    loadServices();

    // Service price update
    if (serviceSelect && priceDisplay && totalPrice) {
        serviceSelect.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');

            if (price && price !== '0' && price !== '0.00') {
                priceDisplay.classList.remove('hidden');
                totalPrice.textContent = `$${Math.round(price)}`;
            } else if (price === '0' || price === '0.00') {
                priceDisplay.classList.remove('hidden');
                totalPrice.textContent = 'Cotizar';
            } else {
                priceDisplay.classList.add('hidden');
            }
        });
    }

    // Booking form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(bookingForm);
            const data = Object.fromEntries(formData);

            // Validate date is not in the past
            const selectedDate = new Date(data.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                alert('Por favor selecciona una fecha futura.');
                return;
            }

            // Validate weekend restrictions
            const dayOfWeek = selectedDate.getDay();
            if (dayOfWeek === 0) { // Sunday
                alert('No atendemos los domingos. Por favor selecciona otro día.');
                return;
            }

            if (dayOfWeek === 6 && data.time > '14:00') { // Saturday after 2 PM
                alert('Los sábados solo atendemos hasta las 2:00 PM.');
                return;
            }

            // Send to backend
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            showLoading(submitBtn);

            fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(async response => {
                    const result = await response.json();
                    if (!response.ok) {
                        throw result;
                    }
                    return result;
                })
                .then(result => {
                    hideLoading(submitBtn);
                    if (result.bookingId) {
                        alert(`¡Reserva confirmada! Tu número de reserva es: ${result.bookingId}\n\nRecibirás un email de confirmación pronto.`);
                        bookingForm.reset();
                        if (priceDisplay) priceDisplay.classList.add('hidden');
                    } else {
                        alert('Error al procesar la reserva: ' + (result.error || 'Inténtalo de nuevo.'));
                    }
                })
                .catch(error => {
                    hideLoading(submitBtn);
                    console.error('Error:', error);

                    if (error.errors) {
                        const errorMessages = error.errors.map(err => err.msg).join('\n');
                        alert('Por favor corrige los siguientes errores:\n' + errorMessages);
                    } else {
                        alert('Error: ' + (error.error || 'Error de conexión con el servidor. Por favor intenta más tarde.'));
                    }
                });
        });
    }

    function showLoading(btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Procesando...';
    }

    function hideLoading(btn) {
        btn.disabled = false;
        btn.innerHTML = 'Confirmar Reserva';
    }
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');

    if (dateInput && timeSelect) {
        dateInput.addEventListener('change', function () {
            const selectedDate = new Date(this.value);
            const dayOfWeek = selectedDate.getDay();

            // Clear current options
            timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';

            let availableTimes = [];

            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                availableTimes = [
                    { value: '08:00', text: '8:00 AM' },
                    { value: '09:00', text: '9:00 AM' },
                    { value: '10:00', text: '10:00 AM' },
                    { value: '11:00', text: '11:00 AM' },
                    { value: '13:00', text: '1:00 PM' },
                    { value: '14:00', text: '2:00 PM' },
                    { value: '15:00', text: '3:00 PM' },
                    { value: '16:00', text: '4:00 PM' },
                    { value: '17:00', text: '5:00 PM' }
                ];
            } else if (dayOfWeek === 6) { // Saturday
                availableTimes = [
                    { value: '09:00', text: '9:00 AM' },
                    { value: '10:00', text: '10:00 AM' },
                    { value: '11:00', text: '11:00 AM' },
                    { value: '12:00', text: '12:00 PM' },
                    { value: '13:00', text: '1:00 PM' },
                    { value: '14:00', text: '2:00 PM' }
                ];
            } else { // Sunday
                timeSelect.innerHTML = '<option value="">No disponible los domingos</option>';
                return;
            }

            // Add available times to select
            availableTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time.value;
                option.textContent = time.text;
                timeSelect.appendChild(option);
            });
        });
    }
});

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return re.test(phone);
}

// Real-time form validation
document.addEventListener('input', function (e) {
    if (e.target.type === 'email') {
        if (e.target.value && !validateEmail(e.target.value)) {
            e.target.setCustomValidity('Por favor ingresa un email válido');
        } else {
            e.target.setCustomValidity('');
        }
    }

    if (e.target.type === 'tel') {
        if (e.target.value && !validatePhone(e.target.value)) {
            e.target.setCustomValidity('Por favor ingresa un teléfono válido');
        } else {
            e.target.setCustomValidity('');
        }
    }
});
