const db = require('./config/database');

async function checkServices() {
    try {
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM services');
        console.log('Services count:', rows[0].count);

        const [services] = await db.execute('SELECT * FROM services');
        console.log('Services:', JSON.stringify(services, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkServices();
