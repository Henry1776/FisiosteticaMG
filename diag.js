const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'booking_system'
};

async function check() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM services');
        console.log('Count:', rows[0].count);
        const [services] = await connection.execute('SELECT * FROM services');
        console.log('Services:', JSON.stringify(services));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
