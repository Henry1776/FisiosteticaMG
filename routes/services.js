const express = require('express');
const router = express.Router();
const db = require('../config/db');

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

module.exports = router;
