class AdminPanel {
    constructor() {
        this.checkAuth();
        this.bookings = [];
        this.filteredBookings = [];
        this.init();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            // Use replace to prevent back navigation
            window.location.replace('/login.html');
            return;
        }
        this.token = token;
        document.getElementById('adminContent').style.display = 'block';
    }

    init() {
        this.loadBookings();
        this.setupEventListeners();
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
                console.log('[ADMIN] Unauthorized, redirecting to login');
                window.location.href = '/login';
                return;
            }
            if (!response.ok) {
                throw new Error('Error al cargar las citas');
            }

            this.bookings = await response.json();
            console.log('[ADMIN] Loaded bookings:', this.bookings.length, 'records');
            console.log('[ADMIN] Bookings data:', this.bookings);
            this.filteredBookings = [...this.bookings];
            this.renderBookings();
            this.updateStats();
        } catch (error) {
            console.error('[ADMIN] Error loading bookings:', error);
            this.showError('Error al cargar las citas');
        } finally {
            this.showLoading(false);
        }
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
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.editBooking('${booking.booking_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1" onclick="adminPanel.updateStatus('${booking.booking_id}', 'confirmed')" 
                            ${booking.status === 'confirmed' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="adminPanel.updateStatus('${booking.booking_id}', 'cancelled')"
                            ${booking.status === 'cancelled' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteBooking('${booking.booking_id}')">
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

    getServiceName(service) {
        const services = {
            'consulta': 'Consulta General',
            'limpieza': 'Limpieza Dental',
            'ortodoncia': 'Ortodoncia',
            'endodoncia': 'Endodoncia',
            'cirugia': 'Cirugía'
        };
        return services[service] || service;
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
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-CR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
        document.getElementById('editDate').value = booking.date;
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
        loading.style.display = show ? 'block' : 'none';
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
