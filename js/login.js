document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Clear previous alerts
    alertPlaceholder.innerHTML = '';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.errors ? data.errors[0].msg : 'Error al iniciar sesión');
        }

        // Store token in localStorage
        localStorage.setItem('token', data.token);

        // Redirect to admin panel
        window.location.href = '/admin';

    } catch (error) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertPlaceholder.append(wrapper);
    }
});

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = '/admin';
}
