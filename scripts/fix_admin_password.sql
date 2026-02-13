-- Update admin password with bcryptjs compatible hash for 'admin123'
USE booking_system;
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZoE5iO4.qUlXuJjGvW7WJqYqMqGZ3FJZh3rZ8R6'
WHERE email = 'admin@example.com';

SELECT 'Admin password updated successfully!' as status;
