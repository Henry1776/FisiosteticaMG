const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');

// Validation rules
const contactValidation = [
    body('name').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('subject').notEmpty().withMessage('Debe seleccionar un asunto'),
    body('message').trim().isLength({ min: 10 }).withMessage('El mensaje debe tener al menos 10 caracteres')
];

// Submit contact form
router.post('/', contactValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, subject, message } = req.body;

        // Insert contact message
        const [result] = await db.execute(
            `INSERT INTO contact_messages (name, email, phone, subject, message, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [name, email, phone || null, subject, message]
        );

        res.status(201).json({
            message: 'Mensaje enviado exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get all contact messages (admin)
router.get('/', async (req, res) => {
    try {
        const [messages] = await db.execute(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Mark message as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        }

        res.json({ message: 'Mensaje marcado como leído' });
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
