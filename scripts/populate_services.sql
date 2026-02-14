USE booking_system;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Clear and re-populate services to ensure they match services.html
TRUNCATE TABLE services;

INSERT INTO services (name, description, price, duration_minutes) VALUES
('Servicio Premium', 'Nuestro servicio más completo que incluye atención personalizada y seguimiento continuo', 99.00, 90),
('Servicio Express', 'Para cuando necesitas resultados rápidos. Servicio eficiente con la misma calidad', 59.00, 45),
('Consultoría', 'Asesoramiento profesional personalizado para ayudarte a tomar las mejores decisiones', 149.00, 120),
('Soporte 24/7', 'Atención continua para resolver cualquier inconveniente o duda', 29.00, 30),
('Capacitación', 'Programas de entrenamiento y capacitación para que tu equipo pueda aprovechar al máximo', 199.00, 180),
('Soluciones Personalizadas', 'Desarrollamos soluciones únicas adaptadas específicamente a tus necesidades', 0.00, 60);

SELECT COUNT(*) as service_count FROM services;
