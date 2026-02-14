<?php
$host = 'localhost';
$db = 'booking_system';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ATTR_ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::ATTR_FETCH_MODE_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $stmt = $pdo->query('SELECT * FROM services');
    $services = $stmt->fetchAll();
    echo json_encode($services, JSON_PRETTY_PRINT);
} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>