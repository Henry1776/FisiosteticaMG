const bcrypt = require('bcryptjs');

// Test bcrypt comparison
async function testBcrypt() {
    const password = 'admin123';
    const hash = '$2a$10$N9qo8uLOickgx2ZoE5iO4.qUlXuJjGvW7WJqYqMqGZ3FJZh3rZ8R6';

    console.log('Testing bcrypt comparison...');
    console.log('Password:', password);
    console.log('Hash:', hash);

    const isMatch = await bcrypt.compare(password, hash);
    console.log('Match result:', isMatch);

    if (!isMatch) {
        console.log('\nGenerating new hash...');
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(password, salt);
        console.log('New hash:', newHash);
    }
}

testBcrypt();
