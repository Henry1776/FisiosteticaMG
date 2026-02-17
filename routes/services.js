const express = require('express');
const router = express.Router();
const db = require('../config/database');

const auth = require('../middleware/auth');

// Get all active services
router.get('/', async (req, res) => {
    try {
        const [services] = await db.execute(
            'SELECT * FROM services WHERE is_active = TRUE ORDER BY name ASC'
        );
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Create or update service (Admin only)
router.post('/', auth, async (req, res) => {

    const { id, name, description, price, duration_minutes } = req.body;
    try {
        if (id) {
            // Update
            await db.execute(
                'UPDATE services SET name = ?, description = ?, price = ?, duration_minutes = ? WHERE id = ?',
                [name, description, price, duration_minutes, id]
            );
            res.json({ message: 'Servicio actualizado correctamente' });
        } else {
            // Create
            await db.execute(
                'INSERT INTO services (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)',
                [name, description, price, duration_minutes]
            );
            res.json({ message: 'Servicio creado correctamente' });
        }
    } catch (error) {
        console.error('Error saving service:', error);
        res.status(500).json({ error: 'Error al guardar el servicio' });
    }
});

// Delete service
router.delete('/:id', auth, async (req, res) => {

    try {
        // Soft delete
        await db.execute('UPDATE services SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Servicio eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Error al eliminar el servicio' });
    }
});

module.exports = router;
