const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        console.log('[LOGIN] Login attempt for email:', email);

        // Check if user exists (using 'email' or 'username' logic if you want, but sticking to email for now)
        // Adjusting query to check both email and username for flexibility if needed, but strict email is better
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        console.log('[LOGIN] Users found:', users.length);

        if (users.length === 0) {
            console.log('[LOGIN] No user found with email:', email);
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const user = users[0];

        console.log('[LOGIN] User found:', user.username, 'Hash:', user.password_hash.substring(0, 20) + '...');
        console.log('[LOGIN] Password to check:', password);

        // Match password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        console.log('[LOGIN] Password match result:', isMatch);

        if (!isMatch) {
            console.log('[LOGIN] Password does not match');
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }


        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 }, // Long expiration for convenience
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.log('[LOGIN] Error:', err.message);
        res.status(500).send('Server error');
    }
});

// TEMPORARY: Generate hash endpoint (REMOVE AFTER FIXING)
router.get('/generate-hash/:password', async (req, res) => {
    try {
        const password = req.params.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log('Generated hash for password:', password);
        console.log('Hash:', hash);

        // Also test the hash
        const testMatch = await bcrypt.compare(password, hash);
        console.log('Test match:', testMatch);

        res.json({ password, hash, testMatch });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// @route   POST api/auth/register
// @desc    Register a new admin user
// @access  Private (Admin only)
router.post('/register', [
    auth, // Protect route
    body('username', 'Username is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        // Check if user exists
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        await db.execute(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, 'admin'] // Default to admin role for now
        );

        res.json({ msg: 'User registered successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private

router.get('/user', auth, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
        res.json(users[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
