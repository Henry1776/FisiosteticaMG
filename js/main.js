// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (event) {
            if (!mobileMenuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });

        // Close mobile menu when clicking on a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function () {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Contact form functionality
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            try {
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';

                // Determine the correct API base URL
                // - file:// protocol → opened directly, use http://localhost:3000
                // - http on port 80/443 (WAMP) → Node.js is on port 3000
                const { protocol, hostname, port } = window.location;
                let apiBase = '';
                if (protocol === 'file:') {
                    apiBase = 'http://localhost:3000';
                } else if (port === '' || port === '80' || port === '443') {
                    apiBase = `${protocol}//${hostname}:3000`;
                }

                const response = await fetch(`${apiBase}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
                    contactForm.reset();
                } else {
                    const errorMsg = result.errors ? result.errors[0].msg : (result.error || 'Error al enviar el mensaje');
                    alert('Error: ' + errorMsg);
                }
            } catch (error) {
                console.error('Error submitting contact form:', error);
                // Fallback: open mailto link
                const subject = encodeURIComponent(data.subject || 'Contacto desde sitio web');
                const body = encodeURIComponent(
                    `Nombre: ${data.name}\nEmail: ${data.email}\nTeléfono: ${data.phone || 'No proporcionado'}\n\nMensaje:\n${data.message}`
                );
                window.location.href = `mailto:info@fisiosteticamg.com?subject=${subject}&body=${body}`;
                alert('¡Se abrirá tu cliente de correo para enviar el mensaje a info@fisiosteticamg.com!');
                contactForm.reset();
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // Set minimum date for booking form
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add loading animation for forms
function showLoading(button) {
    const originalText = button.textContent;
    button.textContent = 'Enviando...';
    button.disabled = true;

    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}
