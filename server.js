const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
// app.use(helmet({
//     contentSecurityPolicy: false, // Temporarily disable CSP to test if it's the cause
//     crossOriginResourcePolicy: { policy: "cross-origin" }
// }));
// app.use(cors());
app.use(cors()); // Keep cors for API access 

// Log all requests for debugging
app.use((req, res, next) => {
    // Disable caching for development
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.url.includes('bookings')) {
        console.log('[BOOKING REQUEST BODY]:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Log before bookings route
app.use('/api/bookings', (req, res, next) => {
    console.log('[BOOKINGS ROUTE ACCESSED]');
    next();
}, require('./routes/bookings'));// Better to add auth middleware to specific routes inside routes/bookings.js or add it here for all methods except GET (if public booking is allowed). 
// But bookings.js handles public booking creation too. So we can't protect the whole route.
// Let's modify bookings.js later to protect specific endpoints.

app.use('/api/contact', require('./routes/contact'));
app.use('/api/services', require('./routes/services'));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, 'bookings.html'));
});

// Protect Admin Panel access
// Since this is a SPA-like admin panel served as static HTML, we can't fully protect it server-side without sessions/cookies middleware that checks token.
// But we are using JWT in localStorage. The server just serves the HTML. The JS on the page will check the token.
// However, strictly speaking, /admin should redirect if not authenticated? Client-side redirect in admin.js is common for JWT.
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Página no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
