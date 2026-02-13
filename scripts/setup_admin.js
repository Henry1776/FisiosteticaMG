const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupAdmin() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'booking_system'
        });

        console.log('Connected to database.');

        // Ensure users table exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'staff') DEFAULT 'staff',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);
        console.log('Users table checked/created.');

        // Check if admin exists
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        
        if (rows.length === 0) {
            const password = 'admin123'; // Default password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await connection.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@example.com', hashedPassword, 'admin']
            );
            console.log(`Admin user created. Username: admin, Password: ${password}`);
        } else {
            console.log('Admin user already exists.');
        }

    } catch (error) {
        console.error('Error setting up admin:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupAdmin();
