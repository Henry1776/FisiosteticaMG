-- Update admin password with the correct bcryptjs hash for 'admin123'
USE booking_system;
UPDATE users 
SET password_hash = '$2a$10$9adAXaOKBcmn7aT.92lshOopua4zV5sXPcfSDcHojkqakdEqVtxqm'
WHERE email = 'admin@example.com';

SELECT 'Admin password updated with correct hash!' as status;
SELECT username, email, LEFT(password_hash, 30) as hash_start FROM users WHERE email = 'admin@example.com';
