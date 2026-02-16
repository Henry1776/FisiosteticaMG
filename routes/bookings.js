const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Validation rules
const bookingValidation = [
    body('firstName').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Los apellidos deben tener al menos 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').matches(/^[\+]?[0-9\s\-\(\)]{8,}$/).withMessage('Teléfono inválido (mínimo 8 dígitos)'),
    body('service').notEmpty().withMessage('Debe seleccionar un servicio'),
    body('date').isISO8601().withMessage('Fecha inválida'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida')
];

// Create booking (Public)
router.post('/', bookingValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            service,
            date,
            time,
            notes
        } = req.body;

        // Check if the time slot is available
        const [existingBookings] = await db.execute(
            'SELECT id FROM bookings WHERE date = ? AND time = ? AND status != "cancelled"',
            [date, time]
        );

        if (existingBookings.length > 0) {
            return res.status(400).json({ error: 'Este horario ya está reservado' });
        }

        // Generate booking ID
        const bookingId = 'BK' + Date.now().toString().slice(-6);

        // Insert booking
        const [result] = await db.execute(
            `INSERT INTO bookings (booking_id, first_name, last_name, email, phone, service, date, time, notes, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [bookingId, firstName, lastName, email, phone, service, date, time, notes || null]
        );

        res.status(201).json({
            message: 'Reserva creada exitosamente',
            bookingId: bookingId,
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get all bookings (Unique to Admin - Protected)
router.get('/', auth, async (req, res) => {
    try {
        const [bookings] = await db.execute(
            'SELECT * FROM bookings ORDER BY date DESC, time DESC'
        );
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});

// Get booking by ID (Protected)
router.get('/:bookingId', auth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        const [bookings] = await db.execute(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json(bookings[0]);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Update entire booking (Protected)
router.put('/:bookingId', auth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const {
            firstName,
            lastName,
            email,
            phone,
            service,
            date,
            time,
            notes,
            status
        } = req.body;

        // Check if booking exists
        const [existingBooking] = await db.execute(
            'SELECT id FROM bookings WHERE booking_id = ?',
            [bookingId]
        );

        if (existingBooking.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Check if the new time slot is available (excluding current booking)
        if (date && time) {
            const [conflictingBookings] = await db.execute(
                'SELECT id FROM bookings WHERE date = ? AND time = ? AND booking_id != ? AND status != "cancelled"',
                [date, time, bookingId]
            );

            if (conflictingBookings.length > 0) {
                return res.status(400).json({ error: 'Este horario ya está reservado' });
            }
        }

        // Update booking
        const [result] = await db.execute(
            `UPDATE bookings SET 
             first_name = ?, last_name = ?, email = ?, phone = ?, 
             service = ?, date = ?, time = ?, notes = ?, status = ?, 
             updated_at = NOW() 
             WHERE booking_id = ?`,
            [firstName, lastName, email, phone, service, date, time, notes, status, bookingId]
        );

        res.json({ message: 'Reserva actualizada exitosamente' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Delete booking (Protected)
router.delete('/:bookingId', auth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        const [result] = await db.execute(
            'DELETE FROM bookings WHERE booking_id = ?',
            [bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json({ message: 'Reserva eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Update booking status (Protected)
router.patch('/:bookingId/status', auth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const [result] = await db.execute(
            'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
            [status, bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get available time slots for a date (Public)
router.get('/available/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // Get booked times for the date
        const [bookedTimes] = await db.execute(
            'SELECT time FROM bookings WHERE date = ? AND status != "cancelled"',
            [date]
        );

        const bookedTimeSlots = bookedTimes.map(booking => booking.time);

        // Define all possible time slots
        const allTimeSlots = [
            '08:00', '09:00', '10:00', '11:00',
            '13:00', '14:00', '15:00', '16:00', '17:00'
        ];

        // Filter out booked times
        const availableSlots = allTimeSlots.filter(time =>
            !bookedTimeSlots.includes(time)
        );

        res.json({ availableSlots });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
