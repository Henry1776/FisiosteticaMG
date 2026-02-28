document.addEventListener('DOMContentLoaded', function () {
    const bookingForm = document.getElementById('booking-form');
    const serviceSelect = document.getElementById('service');
    const priceDisplay = document.getElementById('price-display');
    const totalPrice = document.getElementById('total-price');

    // Load services dynamically
    async function loadServices() {
        try {
            let services;
            try {
                // Try dynamic API first
                const response = await fetch('/api/services');
                if (!response.ok) throw new Error('API not available');
                services = await response.json();
            } catch (apiError) {
                console.warn('Backend API not available, trying static fallback:', apiError);
                // Fallback to static JSON
                const fallbackResponse = await fetch('data/services.json');
                if (!fallbackResponse.ok) throw new Error('Fallback data not found');
                services = await fallbackResponse.json();
            }

            if (serviceSelect && services) {
                // Keep the default option
                serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.name.toLowerCase().replace(/\s+/g, '_'); // Consistent ID
                    option.textContent = `${service.name} - ₡${Math.round(service.price)}`;
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
                totalPrice.textContent = `₡${Math.round(price)}`;
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
            const selectedDate = new Date(data.date + 'T' + data.time);
            const now = new Date();
            const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            if (selectedDate < now) {
                alert('La fecha y hora seleccionada ya ha pasado.');
                return;
            }

            if (selectedDate < minTime) {
                alert('Las citas deben reservarse con al menos 2 horas de anticipación.');
                return;
            }

            // Validate weekend restrictions
            const dayOfWeek = selectedDate.getDay();
            if (dayOfWeek === 0) { // Sunday
                alert('No atendemos los domingos. Por favor selecciona otro día.');
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
        dateInput.addEventListener('change', async function () {
            const date = this.value;
            if (!date) return;

            // Clear current options and show loading
            timeSelect.innerHTML = '<option value="">Cargando horarios...</option>';

            try {
                let data;
                try {
                    const response = await fetch(`/api/bookings/available/${date}`);
                    data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Error al cargar horarios');
                } catch (apiError) {
                    console.warn('Backend API not available for slots, providing default schedule:', apiError);
                    // Default slots 8:00 AM - 6:00 PM (every hour)
                    data = {
                        availableSlots: [
                            "08:00", "09:00", "10:00", "11:00", "12:00",
                            "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
                        ],
                        message: "Usando horario predeterminado (Servidor offline)"
                    };
                }

                timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';

                if (data.availableSlots && data.availableSlots.length > 0) {
                    data.availableSlots.forEach(time => {
                        const [hour, minute] = time.split(':');
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        const displayText = `${displayHour}:${minute} ${ampm}`;

                        const option = document.createElement('option');
                        option.value = time;
                        option.textContent = displayText;
                        timeSelect.appendChild(option);
                    });
                } else {
                    timeSelect.innerHTML = `<option value="">${data.message || 'No hay horarios disponibles'}</option>`;
                }
            } catch (error) {
                console.error('Error:', error);
                timeSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
            }
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
