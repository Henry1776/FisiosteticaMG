document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Clear previous alerts
    alertPlaceholder.innerHTML = '';

    try {
        // Determine the correct API base URL
        // - file:// protocol → opened directly, use http://localhost:3000
        // - http on port 80/443 (WAMP) → Node.js is on port 3000
        // - already on port 3000 → no prefix needed
        // Helper to detect correct API base URL (WAMP port 80 vs Node.js port 3000)
        // Reemplaza tu bloque de apiBase por este:

        const { protocol, hostname, port } = window.location;
        let apiBase = '';

        if (protocol === 'file:') {
            apiBase = 'http://localhost:3000';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            apiBase = port === '3000' ? '' : 'http://localhost:3000';
        } else {
            // En Vercel, la API suele estar en el mismo dominio
            apiBase = '';
        }


        const response = await fetch(`${apiBase}/api/auth/login`, {
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
        // If opened via file://, must redirect to the Node.js server URL
        if (window.location.protocol === 'file:') {
            window.location.href = 'http://localhost:3000/admin.html';
        } else {
            window.location.href = 'admin.html';
        }

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
    if (window.location.protocol === 'file:') {
        window.location.href = 'http://localhost:3000/admin.html';
    } else {
        window.location.href = 'admin.html';
    }
}
