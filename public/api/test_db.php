<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();
    
    // Check tables in database
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Count users if table exists
    $userCount = 0;
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $userCount = $stmt->fetchColumn();
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'MySQL connection established successfully!',
        'database' => DB_NAME,
        'user' => DB_USER,
        'tables_found' => $tables,
        'total_users' => $userCount
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'database' => DB_NAME,
        'user' => DB_USER
    ], JSON_PRETTY_PRINT);
}
