class AdminPanel {
    constructor() {
        console.log('[ADMIN] AdminPanel scaling up...');
        this.bookings = [];
        this.filteredBookings = [];
        this.services = [];
        this.users = [];
        this.init();
    }

    handleUnauthorized() {
        console.log('[ADMIN] Unauthorized access detected, clearing token and redirecting');
        localStorage.removeItem('token');
        window.location.replace('/login.html');
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.handleUnauthorized();
            return false;
        }

        try {
            // Verify token with server
            const response = await fetch('/api/auth/user', {
                headers: { 'x-auth-token': token }
            });

            if (!response.ok) {
                this.handleUnauthorized();
                return false;
            }

            this.token = token;
            const adminContent = document.getElementById('adminContent');
            if (adminContent) adminContent.style.display = 'block';
            return true;
        } catch (error) {
            console.error('[ADMIN] Auth verification failed:', error);
            this.handleUnauthorized();
            return false;
        }
    }

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar la sesión?')) {
            localStorage.removeItem('token');
            window.location.replace('/login.html');
        }
    }

    async init() {
        const authenticated = await this.checkAuth();
        if (authenticated) {
            this.setupEventListeners();
            this.loadServices();
            this.loadBookings();
            this.loadUsers();
            window.is_admin_initialized = true;
            console.log('[ADMIN] AdminPanel initialized successfully');
        }
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadBookings();
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('dateFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('searchFilter').addEventListener('input', () => {
            this.applyFilters();
        });

        // Save booking button
        document.getElementById('saveBookingBtn').addEventListener('click', () => {
            this.saveBooking();
        });

        // Register user button
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.registerUser();
        });

        // Edit user button
        document.getElementById('saveEditUserBtn').addEventListener('click', () => {
            this.updateUser();
        });

        // Save service button
        document.getElementById('saveServiceBtn').addEventListener('click', () => {
            this.saveService();
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Tab switching
        const tabs = ['stats', 'bookings', 'users', 'services'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`${tab}TabBtn`);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchTab(tab);
                });
            }
        });

        // Event delegation for booking actions
        document.getElementById('bookingsTableBody').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const id = btn.dataset.id;
            if (!id) return;

            if (btn.classList.contains('action-edit')) {
                this.editBooking(id);
            } else if (btn.classList.contains('action-confirm')) {
                this.updateStatus(id, 'confirmed');
            } else if (btn.classList.contains('action-cancel')) {
                this.updateStatus(id, 'cancelled');
            } else if (btn.classList.contains('action-delete')) {
                this.deleteBooking(id);
            }
        });
    }

    async loadBookings() {
        try {
            console.log('[ADMIN] Loading bookings...');
            this.showLoading(true);
            const response = await fetch('/api/bookings', {
                headers: { 'x-auth-token': this.token }
            });

            console.log('[ADMIN] Bookings response status:', response.status);

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.msg || 'Error al cargar las citas');
            }

            this.bookings = await response.json();
            console.log('[ADMIN] Loaded bookings:', this.bookings.length, 'records');
            console.log('[ADMIN] Bookings data:', this.bookings);
            this.filteredBookings = [...this.bookings];
            this.renderBookings();
            this.updateStats();
        } catch (error) {
            console.error('[ADMIN] Error loading bookings:', error);
            this.showError(error.message || 'Error al cargar las citas');
        } finally {
            this.showLoading(false);
        }
    }

    async loadServices() {
        try {
            const response = await fetch('/api/services');
            this.services = await response.json();
            this.updateServiceDropdown();
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    updateServiceDropdown() {
        const select = document.getElementById('editService');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar servicio</option>';
            this.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.name.toLowerCase().replace(/\s+/g, '_');
                option.textContent = service.name;
                select.appendChild(option);
            });
        }
        this.renderServicesTable();
    }

    renderServicesTable() {
        const tbody = document.getElementById('servicesTableBody');
        if (!tbody) return;

        if (this.services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay servicios configurados</td></tr>';
            return;
        }

        tbody.innerHTML = this.services.map(service => `
            <tr>
                <td><strong>${service.name}</strong></td>
                <td>${service.description || '---'}</td>
                <td>$${Math.round(service.price)}</td>
                <td>${service.duration_minutes} min</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.editServiceObj(${service.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteService(${service.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    switchTab(tab) {
        // Hide all sections
        const sections = ['statsSection', 'bookingsSection', 'usersSection', 'servicesSection'];
        sections.forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = 'none';
        });

        // Show target section
        const target = document.getElementById(`${tab}Section`);
        if (target) target.style.display = 'block';

        // Update active tab button
        const tabs = ['stats', 'bookings', 'users', 'services'];
        tabs.forEach(t => {
            const btn = document.getElementById(`${t}TabBtn`);
            if (btn) {
                if (t === tab) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    async saveService() {
        const id = document.getElementById('serviceId').value;
        const name = document.getElementById('serviceName').value;
        const description = document.getElementById('serviceDescription').value;
        const price = document.getElementById('servicePrice').value;
        const duration_minutes = document.getElementById('serviceDuration').value;

        if (!name || price === '') {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                },
                body: JSON.stringify({ id, name, description, price, duration_minutes })
            });

            if (response.ok) {
                alert(id ? 'Servicio actualizado' : 'Servicio creado');
                const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
                if (modal) modal.hide();
                await this.loadServices();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Error de conexión');
        }
    }

    async deleteService(id) {
        if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

        try {
            const response = await fetch(`/api/services/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': this.token
                }
            });

            if (response.ok) {
                alert('Servicio eliminado');
                await this.loadServices();
            } else {
                alert('Error al eliminar');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Error de conexión');
        }
    }

    editServiceObj(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDuration').value = service.duration_minutes;

        document.getElementById('serviceModalTitle').textContent = 'Editar Servicio';
        const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
        modal.show();
    }

    resetServiceForm() {
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceModalTitle').textContent = 'Nuevo Servicio';
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

        this.filteredBookings = this.bookings.filter(booking => {
            // Status filter
            if (statusFilter && booking.status !== statusFilter) {
                return false;
            }

            // Date filter
            if (dateFilter && booking.date !== dateFilter) {
                return false;
            }

            // Search filter
            if (searchFilter) {
                const searchText = `${booking.first_name} ${booking.last_name} ${booking.email} ${booking.phone}`.toLowerCase();
                if (!searchText.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        });

        this.renderBookings();
    }

    renderBookings() {
        const tbody = document.getElementById('bookingsTableBody');

        if (this.filteredBookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No se encontraron citas</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredBookings.map(booking => `
            <tr>
                <td><strong>${booking.booking_id}</strong></td>
                <td>${booking.first_name} ${booking.last_name}</td>
                <td>${booking.email}</td>
                <td>${booking.phone}</td>
                <td>${this.getServiceName(booking.service)}</td>
                <td>${this.formatDate(booking.date)}</td>
                <td>${booking.time}</td>
                <td>${this.getStatusBadge(booking.status)}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline-primary me-1 action-edit" data-id="${booking.booking_id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1 action-confirm" data-id="${booking.booking_id}" title="Confirmar" 
                            ${booking.status === 'confirmed' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1 action-cancel" data-id="${booking.booking_id}" title="Cancelar"
                            ${booking.status === 'cancelled' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger action-delete" data-id="${booking.booking_id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const total = this.bookings.length;
        const pending = this.bookings.filter(b => b.status === 'pending').length;
        const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;
        const completed = this.bookings.filter(b => b.status === 'completed').length;

        document.getElementById('totalBookings').textContent = total;
        document.getElementById('pendingBookings').textContent = pending;
        document.getElementById('confirmedBookings').textContent = confirmed;
        document.getElementById('completedBookings').textContent = completed;
    }

    getServiceName(serviceValue) {
        if (!serviceValue) return '---';
        const service = this.services.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === serviceValue);
        return service ? service.name : serviceValue;
    }

    getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge bg-warning status-badge">Pendiente</span>',
            'confirmed': '<span class="badge bg-success status-badge">Confirmada</span>',
            'cancelled': '<span class="badge bg-danger status-badge">Cancelada</span>',
            'completed': '<span class="badge bg-info status-badge">Completada</span>'
        };
        return badges[status] || `<span class="badge bg-secondary status-badge">${status}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return '---';

        try {
            let date;
            if (dateString instanceof Date) {
                date = dateString;
            } else if (typeof dateString === 'string') {
                // If it's already YYYY-MM-DD, parsing directly can lead to timezone shifts
                // but for Spanish locale display it's usually fine or we split it.
                if (dateString.includes('T')) {
                    date = new Date(dateString);
                } else {
                    const [year, month, day] = dateString.split('-').map(Number);
                    date = new Date(year, month - 1, day);
                }
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                return 'Fecha inválida';
            }

            return date.toLocaleDateString('es-CR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Error';
        }
    }

    async updateStatus(bookingId, newStatus) {
        if (!confirm(`¿Está seguro de cambiar el estado a "${newStatus}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error('Error al actualizar el estado');
            }

            this.showSuccess('Estado actualizado exitosamente');
            this.loadBookings();
        } catch (error) {
            console.error('Error updating status:', error);
            this.showError('Error al actualizar el estado');
        }
    }

    editBooking(bookingId) {
        const booking = this.bookings.find(b => b.booking_id === bookingId);
        if (!booking) return;

        // Fill form with booking data
        document.getElementById('editBookingId').value = booking.booking_id;
        document.getElementById('editFirstName').value = booking.first_name;
        document.getElementById('editLastName').value = booking.last_name;
        document.getElementById('editEmail').value = booking.email;
        document.getElementById('editPhone').value = booking.phone;
        document.getElementById('editService').value = booking.service;

        // Handle date string (slice YYYY-MM-DD from ISO string or similar)
        if (booking.date) {
            const dateStr = typeof booking.date === 'string' ? booking.date.split('T')[0] : booking.date;
            document.getElementById('editDate').value = dateStr;
        }

        document.getElementById('editTime').value = booking.time;
        document.getElementById('editStatus').value = booking.status;
        document.getElementById('editNotes').value = booking.notes || '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editBookingModal'));
        modal.show();
    }

    async saveBooking() {
        const bookingId = document.getElementById('editBookingId').value;
        const formData = {
            firstName: document.getElementById('editFirstName').value,
            lastName: document.getElementById('editLastName').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            service: document.getElementById('editService').value,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            status: document.getElementById('editStatus').value,
            notes: document.getElementById('editNotes').value
        };

        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                },
                body: JSON.stringify(formData)
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al actualizar la cita');
            }

            this.showSuccess('Cita actualizada exitosamente');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editBookingModal'));
            modal.hide();

            // Reload bookings
            this.loadBookings();
        } catch (error) {
            console.error('Error saving booking:', error);
            this.showError(error.message);
        }
    }

    async loadUsers() {
        try {
            console.log('[ADMIN] Loading users...');
            const response = await fetch('/api/auth/users', {
                headers: { 'x-auth-token': this.token }
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error('Error al cargar administradores');
            }

            this.users = await response.json();
            console.log('[ADMIN] Loaded users:', this.users.length);
            this.renderUsersTable();
        } catch (error) {
            console.error('[ADMIN] Error loading users:', error);
            this.showError('Error al cargar administradores');
        }
    }

    renderUsersTable() {
        console.log('[ADMIN] Rendering users table...', this.users ? this.users.length : 'null', 'users found');
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) {
            console.error('[ADMIN] Element usersTableBody not found!');
            return;
        }

        if (!this.users || this.users.length === 0) {
            console.log('[ADMIN] No users to render or users array is empty');
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay administradores registrados o error de carga</td></tr>';
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td class="ps-4">${user.id}</td>
                <td><strong>${user.username}</strong></td>
                <td>${user.email}</td>
                <td><span class="badge bg-info">${user.role}</span></td>
                <td class="table-actions text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteUser(${user.id})" 
                            ${user.id == this.getCurrentUserId() ? 'disabled' : ''} title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    editUser(id) {
        const user = this.users.find(u => u.id == id);
        if (!user) return;

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editEmailUser').value = user.email;

        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    }

    async updateUser() {
        const id = document.getElementById('editUserId').value;
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmailUser').value;

        try {
            const response = await fetch(`/api/auth/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                },
                body: JSON.stringify({ username, email })
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Error al actualizar');
            }

            this.showSuccess('Administrador actualizado correctamente');
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            this.loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            this.showError(error.message);
        }
    }

    getCurrentUserId() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user.id;
        } catch (e) {
            return null;
        }
    }

    async deleteUser(id) {
        if (!confirm('¿Estás seguro de eliminar este administrador?')) return;

        try {
            const response = await fetch(`/api/auth/users/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': this.token }
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Error al eliminar');
            }

            this.showSuccess('Administrador eliminado correctamente');
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError(error.message);
        }
    }

    async registerUser() {
        console.log('[ADMIN] Register user button clicked');
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        console.log('[ADMIN] Form values:', { username, email, password: '***' });

        if (!username || !email || !password) {
            console.log('[ADMIN] Validation failed: missing fields');
            this.showError('Por favor complete todos los campos');
            return;
        }

        if (password.length < 6) {
            console.log('[ADMIN] Validation failed: password too short');
            this.showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            console.log('[ADMIN] Sending registration request...');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                },
                body: JSON.stringify({ username, email, password })
            });

            console.log('[ADMIN] Registration response status:', response.status);
            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            const data = await response.json();
            console.log('[ADMIN] Registration response data:', data);

            if (!response.ok) {
                throw new Error(data.errors ? data.errors[0].msg : 'Error al registrar usuario');
            }

            console.log('[ADMIN] Registration successful');
            this.showSuccess('Administrador registrado exitosamente');

            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('registerUserModal'));
            modal.hide();
            document.getElementById('registerUserForm').reset();

        } catch (error) {
            console.error('[ADMIN] Error registering user:', error);
            this.showError(error.message);
        }
    }

    async deleteBooking(bookingId) {
        if (!confirm('¿Está seguro de eliminar esta cita? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': this.token }
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error('Error al eliminar la cita');
            }

            this.showSuccess('Cita eliminada exitosamente');
            this.loadBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            this.showError('Error al eliminar la cita');
        }
    }

    showLoading(show) {
        const loading = document.querySelector('.loading');
        if (loading) {
            if (show) {
                loading.classList.add('active');
            } else {
                loading.classList.remove('active');
            }
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of container
        const container = document.querySelector('.container');
        container.insertBefore(alert, container.firstChild);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
