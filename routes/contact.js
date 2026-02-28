const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');
const nodemailer = require('nodemailer');

// Configure transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

        // 1. Insert contact message in DB
        const [result] = await db.execute(
            `INSERT INTO contact_messages (name, email, phone, subject, message, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [name, email, phone || null, subject, message]
        );

        // 2. Send Emails (Non-blocking)
        const companyName = process.env.COMPANY_NAME || 'Fisioestética MG';
        const adminEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_USER;

        // Email to Admin
        const adminMailOptions = {
            from: `"${companyName}" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `Nuevo mensaje de contacto: ${subject}`,
            html: `
                <h3>Nuevo mensaje de contacto recibido</h3>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
                <p><strong>Asunto:</strong> ${subject}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${message}</p>
            `
        };

        // Email to User (Confirmation)
        const userMailOptions = {
            from: `"${companyName}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Confirmación de mensaje - ${companyName}`,
            html: `
                <h3>Hola ${name},</h3>
                <p>Gracias por contactarnos. Hemos recibido tu mensaje sobre "<strong>${subject}</strong>" y te responderemos lo antes posible.</p>
                <br>
                <p>Copia de tu mensaje:</p>
                <blockquote style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">
                    ${message}
                </blockquote>
                <br>
                <p>Saludos,<br>El equipo de ${companyName}</p>
            `
        };

        // Send emails asynchronously
        transporter.sendMail(adminMailOptions).catch(err => console.error('Error sending admin email:', err));
        transporter.sendMail(userMailOptions).catch(err => console.error('Error sending user email:', err));

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
