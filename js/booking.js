document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const serviceSelect = document.getElementById('service');
    const priceDisplay = document.getElementById('price-display');
    const totalPrice = document.getElementById('total-price');

    // Service price update
    if (serviceSelect && priceDisplay && totalPrice) {
        serviceSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            
            if (price && price !== '0') {
                priceDisplay.classList.remove('hidden');
                totalPrice.textContent = `$${price}`;
            } else if (price === '0') {
                priceDisplay.classList.remove('hidden');
                totalPrice.textContent = 'Cotizar';
            } else {
                priceDisplay.classList.add('hidden');
            }
        });
    }

    // Booking form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
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
            
            // Show loading
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            showLoading(submitBtn);
            
            // Simulate API call
            setTimeout(() => {
                // Generate booking ID
                const bookingId = 'BK' + Date.now().toString().slice(-6);
                
                // Show success message
                alert(`¡Reserva confirmada! Tu número de reserva es: ${bookingId}\n\nRecibirás un email de confirmación pronto.`);
                
                // Reset form
                bookingForm.reset();
                priceDisplay.classList.add('hidden');
                
                // Here you would typically send the data to your backend
                console.log('Booking data:', { ...data, bookingId });
            }, 2000);
        });
    }

    // Available times based on selected date
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    
    if (dateInput && timeSelect) {
        dateInput.addEventListener('change', function() {
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
document.addEventListener('input', function(e) {
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
