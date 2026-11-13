<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();
    
    // One-time ID synchronization for asdsfffsd@gmail.com
    $pdo->prepare("UPDATE users SET id = 'usr_1793448954006_621' WHERE email = 'asdsfffsd@gmail.com'")->execute();
    $pdo->prepare("UPDATE records SET user_id = 'usr_1793448954006_621' WHERE user_id = 'usr_1793448958_921'")->execute();

    // Check tables in database
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Count users if table exists
    $userCount = 0;
    $users = [];
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT id, name, email, balance FROM users");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userCount = count($users);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'MySQL connection established successfully!',
        'database' => DB_NAME,
        'user' => DB_USER,
        'tables_found' => $tables,
        'total_users' => $userCount,
        'users' => $users
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
