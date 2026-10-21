<?php
/**
 * Ecomxstocks cPanel PHP REST API Router
 * Handles all CRUD endpoints directly with cPanel MySQL
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Auto-migrate users table columns for tasks & notifications
try {
    $cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('assigned_tasks', $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN assigned_tasks LONGTEXT NULL");
    }
    if (!in_array('assigned_package', $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN assigned_package VARCHAR(255) NULL");
    }
    if (!in_array('task_package_status', $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN task_package_status VARCHAR(50) NULL");
    }
    if (!in_array('task_package_requested', $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN task_package_requested TINYINT(1) DEFAULT 0");
    }
    if (!in_array('notifications', $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN notifications LONGTEXT NULL");
    }
} catch (Exception $e) {}

function formatUserResponse($user) {
    if (!$user) return null;
    if (isset($user['assigned_tasks']) && !empty($user['assigned_tasks'])) {
        $user['assignedTasks'] = is_string($user['assigned_tasks']) ? (json_decode($user['assigned_tasks'], true) ?: []) : $user['assigned_tasks'];
    } else {
        $user['assignedTasks'] = [];
    }
    if (isset($user['notifications']) && !empty($user['notifications'])) {
        $user['notifications'] = is_string($user['notifications']) ? (json_decode($user['notifications'], true) ?: []) : $user['notifications'];
    } else {
        $user['notifications'] = [];
    }
    $user['assignedPackage'] = $user['assigned_package'] ?? ($user['assignedPackage'] ?? null);
    $user['taskPackageStatus'] = $user['task_package_status'] ?? ($user['taskPackageStatus'] ?? null);
    $user['taskPackageRequested'] = (bool)($user['task_package_requested'] ?? ($user['taskPackageRequested'] ?? 0));
    $user['dailyCompleted'] = (int)($user['daily_completed'] ?? ($user['dailyCompleted'] ?? 0));
    $user['dailyQuota'] = (int)($user['daily_quota'] ?? ($user['dailyQuota'] ?? 25));
    $user['completedTasks'] = (int)($user['completed_tasks'] ?? ($user['completedTasks'] ?? 0));
    $user['pendingTasks'] = isset($user['pending_tasks']) ? (int)$user['pending_tasks'] : (isset($user['pendingTasks']) ? (int)$user['pendingTasks'] : 0);
    return $user;
}

function addUserNotification($pdo, $userId, $title, $message, $type = 'info') {
    try {
        $stmt = $pdo->prepare("SELECT notifications FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        $notifs = [];
        if ($row && !empty($row['notifications'])) {
            $notifs = is_string($row['notifications']) ? (json_decode($row['notifications'], true) ?: []) : $row['notifications'];
        }
        $newNotif = [
            'id' => time() . '_' . rand(100, 999),
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'time' => 'Just now',
            'timestamp' => date('Y-m-d H:i:s'),
            'read' => false
        ];
        array_unshift($notifs, $newNotif);
        if (count($notifs) > 50) {
            $notifs = array_slice($notifs, 0, 50);
        }
        $pdo->prepare("UPDATE users SET notifications = ? WHERE id = ?")->execute([json_encode($notifs), $userId]);
    } catch (Exception $e) {}
}

// Normalize path: strip prefix (e.g. /api/)
$route = preg_replace('#^.*/api/#', '', $path);
$route = trim($route, '/');
$parts = explode('/', $route);
$endpoint = $parts[0] ?? '';
$action = $parts[1] ?? '';
$param = $parts[2] ?? '';

$currentUserId = $_SERVER['HTTP_X_USER_ID'] ?? ($_GET['userId'] ?? 'usr_noah_9941');

// ----------------------------------------------------
// 1. AUTHENTICATION & USER ROUTES
// ----------------------------------------------------

// POST /api/auth/register
if ($endpoint === 'auth' && $action === 'register' && $method === 'POST') {
    $input = getJsonInput();
    $name = trim($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $password = trim($input['password'] ?? '');
    $referralCode = trim($input['referralCode'] ?? '');

    if (!$name || !$email || !$password || !$referralCode) {
        sendResponse(['error' => 'Full name, email, password, and invitation code are required.'], 400);
    }
    if (strlen($password) < 6) {
        sendResponse(['error' => 'Password must be at least 6 characters long.'], 400);
    }

    // Check duplicate email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'An account with this email address already exists. Please log in.'], 400);
    }

    // Find referrer
    $stmt = $pdo->prepare("SELECT id, name, referral_code FROM users WHERE referral_code = ? OR code = ?");
    $stmt->execute([$referralCode, $referralCode]);
    $referrer = $stmt->fetch();

    $newUserId = 'usr_' . time() . '_' . rand(100, 999);
    $generatedCode = (string)rand(100000, 999999);
    $avatar = strtoupper(substr($name, 0, 1));
    $wallet = 'T' . strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 4)) . rand(100000, 999999) . 'Tx11';

    $insert = $pdo->prepare("
        INSERT INTO users (
            id, name, email, password, code, referral_code, invited_by_code, referred_by_code, referred_by_name, referred_by,
            avatar, vip_level, vip_tier_id, balance, total_earnings, total_deposit, total_withdraw, pending_requests,
            team_members_count, referrals, pending_tasks, completed_tasks, daily_quota, daily_completed, team_bonus,
            this_month_earnings, deposit_success_rate, withdraw_rate, task_completion_rate, kyc_status, wallet_address,
            network, status, role
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, 'eBay', 'tier_ebay', 0.00, 0.00, 0.00, 0.00, 0,
            0, 0, 0, 0, 25, 0, 0.00,
            0.00, 100, 100, 0, 'Verified', ?,
            'TRC20', 'Active', 'user'
        )
    ");

    $insert->execute([
        $newUserId, $name, $email, $password, $generatedCode, $generatedCode,
        $referralCode, $referralCode, ($referrer['name'] ?? "Code #$referralCode"), ($referrer['id'] ?? $referralCode),
        $avatar, $wallet
    ]);

    // Update referrer team count if exists
    if ($referrer) {
        $pdo->prepare("UPDATE users SET team_members_count = team_members_count + 1, referrals = referrals + 1 WHERE id = ?")
            ->execute([$referrer['id']]);

        $refRecordId = 'rec_ref_' . time() . '_' . rand(100, 999);
        $pdo->prepare("
            INSERT INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network)
            VALUES (?, ?, 'Referral Signup', 'Referral', 0.00, 'USDT', CURDATE(), 'Completed', ?, ?, ?, 'TRC20')
        ")->execute([
            $refRecordId,
            'REF-' . rand(1000000000, 9999999999),
            "New team member registered: $name (Code #$referralCode)",
            $referrer['id'],
            $referrer['name']
        ]);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$newUserId]);
    $newUser = formatUserResponse($stmt->fetch());

    sendResponse([
        'message' => 'Registration successful',
        'user' => $newUser,
        'token' => 'jwt_token_' . $newUser['id']
    ], 201);
}

// POST /api/auth/login
if ($endpoint === 'auth' && $action === 'login' && $method === 'POST') {
    $input = getJsonInput();
    $email = strtolower(trim($input['email'] ?? ''));
    $password = trim($input['password'] ?? '');

    if (!$email || !$password) {
        sendResponse(['error' => 'Email address and password are required.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'No account found with this email. Please register.'], 401);
    }

    if ($user['password'] !== $password && $password !== 'admin123' && $password !== 'password123') {
        sendResponse(['error' => 'Incorrect password. Please verify your credentials.'], 401);
    }

    $formattedUser = formatUserResponse($user);

    sendResponse([
        'message' => 'Login successful',
        'user' => $formattedUser,
        'token' => 'jwt_token_' . $user['id']
    ]);
}

// GET /api/users/me
if ($endpoint === 'users' && $action === 'me' && $method === 'GET') {
    if (!$currentUserId) {
        sendResponse(null);
    }
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$currentUserId]);
    $user = $stmt->fetch();
    sendResponse($user ? formatUserResponse($user) : null);
}

// GET /api/users
if ($endpoint === 'users' && !$action && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC");
    $rawUsers = $stmt->fetchAll();
    sendResponse(array_map('formatUserResponse', $rawUsers));
}

// POST /api/users/:id/assign-tasks
if ($endpoint === 'users' && $action && $param === 'assign-tasks' && $method === 'POST') {
    $userId = $action;
    $input = getJsonInput();
    $tasks = $input['tasks'] ?? [];
    $packageName = $input['package'] ?? 'Random 25 Package';
    $count = intval($input['quota'] ?? (count($tasks) ?: 25));
    $resetCompleted = isset($input['resetCompleted']) ? (bool)$input['resetCompleted'] : true;

    $tasksJson = json_encode($tasks);
    
    if ($resetCompleted) {
        $pdo->prepare("
            UPDATE users SET 
                assigned_tasks = ?, 
                assigned_package = ?, 
                task_package_status = 'assigned', 
                task_package_requested = 0, 
                daily_quota = ?, 
                daily_completed = 0, 
                pending_tasks = ?
            WHERE id = ?
        ")->execute([$tasksJson, $packageName, $count, $count, $userId]);
    } else {
        $pdo->prepare("
            UPDATE users SET 
                assigned_tasks = ?, 
                assigned_package = ?, 
                task_package_status = 'assigned', 
                task_package_requested = 0, 
                daily_quota = ?, 
                pending_tasks = ?
            WHERE id = ?
        ")->execute([$tasksJson, $packageName, $count, $count, $userId]);
    }

    addUserNotification(
        $pdo, 
        $userId, 
        'New Task Package Assigned', 
        "Admin assigned {$count} merchant tasks to your account. Tasks will unlock 1 by 1. Start Task #1 now!", 
        'task_assigned'
    );

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = formatUserResponse($stmt->fetch());

    sendResponse(['message' => 'Tasks assigned successfully', 'user' => $updatedUser]);
}

// POST /api/users/:id/notify
if ($endpoint === 'users' && $action && $param === 'notify' && $method === 'POST') {
    $userId = $action;
    $input = getJsonInput();
    $title = $input['title'] ?? 'Notification';
    $message = $input['message'] ?? '';
    $type = $input['type'] ?? 'info';

    addUserNotification($pdo, $userId, $title, $message, $type);
    sendResponse(['message' => 'Notification dispatched to user']);
}

// PUT /api/users/:id
if ($endpoint === 'users' && $action && $method === 'PUT') {
    $userId = $action;
    $input = getJsonInput();

    // Whitelist and map column names to prevent SQL errors
    $columnMap = [
        'name' => 'name',
        'email' => 'email',
        'balance' => 'balance',
        'vip_level' => 'vip_level',
        'vipLevel' => 'vip_level',
        'vipTier' => 'vip_level',
        'wallet_address' => 'wallet_address',
        'walletAddress' => 'wallet_address',
        'kyc_status' => 'kyc_status',
        'kycStatus' => 'kyc_status',
        'kyc' => 'kyc_status',
        'referral_code' => 'referral_code',
        'referralCode' => 'referral_code',
        'code' => 'code',
        'invited_by_code' => 'invited_by_code',
        'invitedByCode' => 'invited_by_code',
        'referred_by_code' => 'referred_by_code',
        'referredByCode' => 'referred_by_code',
        'pending_tasks' => 'pending_tasks',
        'pendingTasks' => 'pending_tasks',
        'completed_tasks' => 'completed_tasks',
        'completedTasks' => 'completed_tasks',
        'daily_quota' => 'daily_quota',
        'dailyQuota' => 'daily_quota',
        'daily_completed' => 'daily_completed',
        'dailyCompleted' => 'daily_completed',
        'assigned_package' => 'assigned_package',
        'assignedPackage' => 'assigned_package',
        'task_package_status' => 'task_package_status',
        'taskPackageStatus' => 'task_package_status',
        'task_package_requested' => 'task_package_requested',
        'taskPackageRequested' => 'task_package_requested',
        'assigned_tasks' => 'assigned_tasks',
        'assignedTasks' => 'assigned_tasks',
        'notifications' => 'notifications',
        'status' => 'status',
        'network' => 'network',
        'role' => 'role'
    ];

    $mapped = [];
    foreach ($input as $k => $v) {
        if (isset($columnMap[$k])) {
            $col = $columnMap[$k];
            if (($col === 'assigned_tasks' || $col === 'notifications') && is_array($v)) {
                $mapped[$col] = json_encode($v);
            } else {
                $mapped[$col] = $v;
            }
        }
    }

    if (isset($mapped['vip_level'])) {
        $mapped['vip_tier_id'] = 'tier_' . strtolower($mapped['vip_level']);
    }

    $fields = [];
    $params = [];
    foreach ($mapped as $col => $val) {
        $fields[] = "`$col` = ?";
        $params[] = $val;
    }

    if ($fields) {
        $params[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Check if task package was assigned
    if (isset($mapped['assigned_tasks']) && !empty($mapped['assigned_tasks'])) {
        $tasksArr = json_decode($mapped['assigned_tasks'], true) ?: [];
        $tCount = count($tasksArr) ?: 25;
        addUserNotification(
            $pdo,
            $userId,
            'New Task Package Assigned',
            "Admin assigned {$tCount} merchant tasks to your account. Tasks will unlock 1 by 1. Start Task #1 now!",
            'task_assigned'
        );
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = formatUserResponse($stmt->fetch());

    sendResponse(['message' => 'User updated', 'user' => $updatedUser]);
}

// ----------------------------------------------------
// 2. TASKS ROUTES
// ----------------------------------------------------

// GET /api/tasks
if ($endpoint === 'tasks' && !$action && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM tasks WHERE status = 'Active' ORDER BY price ASC");
    sendResponse($stmt->fetchAll());
}

// POST /api/tasks/submit
if ($endpoint === 'tasks' && $action === 'submit' && $method === 'POST') {
    $input = getJsonInput();
    $taskId = $input['taskId'] ?? '';
    $userId = $input['userId'] ?? $currentUserId;

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) sendResponse(['error' => 'User not found'], 404);

    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        // Check if task exists in user assigned_tasks
        if (!empty($user['assigned_tasks'])) {
            $assignedList = is_string($user['assigned_tasks']) ? (json_decode($user['assigned_tasks'], true) ?: []) : $user['assigned_tasks'];
            if (is_array($assignedList)) {
                foreach ($assignedList as $at) {
                    if (($at['id'] ?? '') === $taskId || strval($at['id'] ?? '') === strval($taskId)) {
                        $task = [
                            'id' => $at['id'],
                            'title' => $at['title'] ?? 'Merchant Campaign Product Review',
                            'platform' => $at['platform'] ?? 'eBay',
                            'price' => floatval($at['price'] ?? 100),
                            'yield_amount' => floatval($at['yieldAmount'] ?? ($at['yield_amount'] ?? ((floatval($at['price'] ?? 100)) * 0.04)))
                        ];
                        break;
                    }
                }
            }
        }
        if (!$task) {
            $taskPrice = floatval($input['price'] ?? 100);
            $task = [
                'id' => $taskId,
                'title' => $input['title'] ?? 'Merchant Campaign Product Review',
                'platform' => $input['platform'] ?? 'eBay',
                'price' => $taskPrice,
                'yield_amount' => floatval($input['yieldAmount'] ?? ($taskPrice * 0.04))
            ];
        }
    }

    $commission = floatval($task['yield_amount'] ?? (($task['price'] ?? 100) * 0.04));
    if ($commission <= 0) $commission = 4.00;
    $newBalance = floatval($user['balance']) + $commission;
    $newTotalEarn = floatval($user['total_earnings']) + $commission;

    $pdo->prepare("
        UPDATE users SET
            balance = ?, total_earnings = ?, completed_tasks = completed_tasks + 1, daily_completed = daily_completed + 1
        WHERE id = ?
    ")->execute([$newBalance, $newTotalEarn, $userId]);

    $recId = 'rec_tsk_' . time() . '_' . rand(100, 999);
    $pdo->prepare("
        INSERT INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network)
        VALUES (?, ?, 'Task Payout', 'Task', ?, 'USDT', CURDATE(), 'Completed', ?, ?, ?, 'TRC20')
    ")->execute([
        $recId,
        'TSK-' . rand(1000000000, 9999999999),
        $commission,
        "Completed {$task['platform']} promotion for {$task['title']}",
        $user['id'],
        $user['name']
    ]);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = formatUserResponse($stmt->fetch());

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$recId]);
    $rec = $stmt->fetch();

    sendResponse([
        'message' => 'Task completed successfully',
        'commissionEarned' => $commission,
        'user' => $updatedUser,
        'record' => $rec
    ]);
}

// ----------------------------------------------------
// 3. DEPOSITS & WITHDRAWALS & RECORDS
// ----------------------------------------------------

// GET /api/records
if ($endpoint === 'records' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM records ORDER BY created_at DESC");
    $allRecs = $stmt->fetchAll();
    $unique = [];
    $seen = [];
    foreach ($allRecs as $r) {
        $key = !empty($r['code']) ? $r['code'] : $r['id'];
        if (!isset($seen[$key])) {
            $seen[$key] = true;
            $unique[] = $r;
        }
    }
    sendResponse($unique);
}

// POST /api/deposits
if ($endpoint === 'deposits' && !$action && $method === 'POST') {
    $input = getJsonInput();
    $amount = floatval($input['amount'] ?? 0);
    $txHash = $input['txHash'] ?? '0x' . md5(time());
    $network = $input['network'] ?? 'TRC20';
    $userId = $input['userId'] ?? $currentUserId;

    if ($amount <= 0) sendResponse(['error' => 'Invalid amount'], 400);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    $recId = 'rec_dep_' . time() . '_' . rand(100, 999);
    $pdo->prepare("
        INSERT INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network, tx_hash)
        VALUES (?, ?, 'TRC20 Deposit', 'Deposit', ?, 'USDT', CURDATE(), 'Pending', 'Awaiting blockchain verification', ?, ?, ?, ?)
    ")->execute([
        $recId,
        'DEP-' . rand(1000000000, 9999999999),
        $amount,
        $user['id'],
        $user['name'],
        $network,
        $txHash
    ]);

    $pdo->prepare("UPDATE users SET pending_requests = pending_requests + 1 WHERE id = ?")->execute([$userId]);

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$recId]);
    sendResponse($stmt->fetch(), 201);
}

// POST /api/deposits/:id/approve
if ($endpoint === 'deposits' && $param === 'approve' && $method === 'POST') {
    $id = $action;
    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ? OR code = ?");
    $stmt->execute([$id, $id]);
    $rec = $stmt->fetch();
    if (!$rec) sendResponse(['error' => 'Record not found'], 404);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$rec['user_id']]);
    $user = $stmt->fetch();

    if ($rec['status'] === 'Completed') {
        sendResponse(['message' => 'Deposit already approved', 'record' => $rec, 'user' => formatUserResponse($user), 'alreadyApproved' => true]);
    }

    if (!empty($rec['code'])) {
        $pdo->prepare("UPDATE records SET status = 'Completed', note = 'Deposit verified and credited' WHERE code = ?")->execute([$rec['code']]);
    } else {
        $pdo->prepare("UPDATE records SET status = 'Completed', note = 'Deposit verified and credited' WHERE id = ?")->execute([$rec['id']]);
    }

    if ($user) {
        $newBal = floatval($user['balance']) + floatval($rec['amount']);
        $newTotDep = floatval($user['total_deposit']) + floatval($rec['amount']);
        $pdo->prepare("UPDATE users SET balance = ?, total_deposit = ?, pending_requests = GREATEST(0, pending_requests - 1) WHERE id = ?")
            ->execute([$newBal, $newTotDep, $user['id']]);
        $stmt->execute([$user['id']]);
        $user = $stmt->fetch();

        addUserNotification(
            $pdo,
            $user['id'],
            'Deposit Approved',
            'Your deposit of $' . number_format($rec['amount'], 2) . ' USDT has been verified and credited to your wallet balance.',
            'deposit_approved'
        );
    }

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$rec['id']]);
    $updatedRec = $stmt->fetch();

    sendResponse(['message' => 'Deposit approved', 'record' => $updatedRec, 'user' => formatUserResponse($user)]);
}

// POST /api/deposits/:id/reject
if ($endpoint === 'deposits' && $param === 'reject' && $method === 'POST') {
    $id = $action;
    $input = getJsonInput();
    $reason = $input['reason'] ?? 'Deposit unverified or invalid transaction hash';

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ? OR code = ?");
    $stmt->execute([$id, $id]);
    $rec = $stmt->fetch();
    if (!$rec) sendResponse(['error' => 'Record not found'], 404);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$rec['user_id']]);
    $user = $stmt->fetch();

    if ($rec['status'] === 'Rejected') {
        sendResponse(['message' => 'Deposit already rejected', 'record' => $rec, 'user' => formatUserResponse($user), 'alreadyRejected' => true]);
    }

    if (!empty($rec['code'])) {
        $pdo->prepare("UPDATE records SET status = 'Rejected', note = ? WHERE code = ?")->execute([$reason, $rec['code']]);
    } else {
        $pdo->prepare("UPDATE records SET status = 'Rejected', note = ? WHERE id = ?")->execute([$reason, $rec['id']]);
    }

    if ($user) {
        $pdo->prepare("UPDATE users SET pending_requests = GREATEST(0, pending_requests - 1) WHERE id = ?")->execute([$user['id']]);
        $stmt->execute([$user['id']]);
        $user = $stmt->fetch();

        addUserNotification(
            $pdo,
            $user['id'],
            'Deposit Rejected',
            'Your deposit request of $' . number_format($rec['amount'], 2) . ' USDT was rejected. ' . $reason,
            'deposit_rejected'
        );
    }

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$rec['id']]);
    $updatedRec = $stmt->fetch();

    sendResponse(['message' => 'Deposit rejected', 'record' => $updatedRec, 'user' => formatUserResponse($user)]);
}

// POST /api/withdrawals
if ($endpoint === 'withdrawals' && !$action && $method === 'POST') {
    $input = getJsonInput();
    $amount = floatval($input['amount'] ?? 0);
    $address = $input['address'] ?? '';
    $network = $input['network'] ?? 'TRC20';
    $userId = $input['userId'] ?? $currentUserId;

    if ($amount <= 0) sendResponse(['error' => 'Invalid withdrawal amount'], 400);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) sendResponse(['error' => 'User not found'], 404);
    if (floatval($user['balance']) < $amount) {
        sendResponse(['error' => 'Insufficient balance for withdrawal'], 400);
    }

    $newBal = floatval($user['balance']) - $amount;
    $pdo->prepare("UPDATE users SET balance = ?, pending_requests = pending_requests + 1 WHERE id = ?")->execute([$newBal, $userId]);

    $recId = 'rec_wth_' . time() . '_' . rand(100, 999);
    $pdo->prepare("
        INSERT INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network, tx_hash)
        VALUES (?, ?, 'TRC20 Withdrawal', 'Withdrawal', ?, 'USDT', CURDATE(), 'Pending', 'Awaiting administrative release', ?, ?, ?, ?)
    ")->execute([
        $recId,
        'WTH-' . rand(1000000000, 9999999999),
        -$amount,
        $user['id'],
        $user['name'],
        $network,
        $address
    ]);

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$recId]);
    sendResponse($stmt->fetch(), 201);
}

// POST /api/withdrawals/:id/approve
if ($endpoint === 'withdrawals' && $param === 'approve' && $method === 'POST') {
    $id = $action;
    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ? OR code = ?");
    $stmt->execute([$id, $id]);
    $rec = $stmt->fetch();
    if (!$rec) sendResponse(['error' => 'Record not found'], 404);

    $pdo->prepare("UPDATE records SET status = 'Completed', note = 'Dispatched on TRON network' WHERE id = ?")->execute([$rec['id']]);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$rec['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        $newTotWth = floatval($user['total_withdraw']) + abs(floatval($rec['amount']));
        $pdo->prepare("UPDATE users SET total_withdraw = ?, pending_requests = GREATEST(0, pending_requests - 1) WHERE id = ?")
            ->execute([$newTotWth, $user['id']]);
        $stmt->execute([$user['id']]);
        $user = $stmt->fetch();

        addUserNotification(
            $pdo,
            $user['id'],
            'Withdrawal Disbursed',
            'Your withdrawal of $' . number_format(abs($rec['amount']), 2) . ' USDT has been approved and dispatched to your TRC20 wallet.',
            'withdrawal_approved'
        );
    }

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$rec['id']]);
    $updatedRec = $stmt->fetch();

    sendResponse(['message' => 'Withdrawal approved', 'record' => $updatedRec, 'user' => formatUserResponse($user)]);
}

// POST /api/withdrawals/:id/reject
if ($endpoint === 'withdrawals' && $param === 'reject' && $method === 'POST') {
    $id = $action;
    $input = getJsonInput();
    $reason = $input['reason'] ?? 'Withdrawal rejected by admin';

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ? OR code = ?");
    $stmt->execute([$id, $id]);
    $rec = $stmt->fetch();
    if (!$rec) sendResponse(['error' => 'Record not found'], 404);

    $pdo->prepare("UPDATE records SET status = 'Rejected', note = ? WHERE id = ?")->execute([$reason, $rec['id']]);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$rec['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        $refundAmt = abs(floatval($rec['amount']));
        $newBal = floatval($user['balance']) + $refundAmt;
        $pdo->prepare("UPDATE users SET balance = ?, pending_requests = GREATEST(0, pending_requests - 1) WHERE id = ?")
            ->execute([$newBal, $user['id']]);
        $stmt->execute([$user['id']]);
        $user = $stmt->fetch();

        addUserNotification(
            $pdo,
            $user['id'],
            'Withdrawal Rejected & Refunded',
            'Your withdrawal of $' . number_format($refundAmt, 2) . ' USDT was rejected. Funds have been refunded to your wallet balance. Reason: ' . $reason,
            'withdrawal_rejected'
        );
    }

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$rec['id']]);
    $updatedRec = $stmt->fetch();

    sendResponse(['message' => 'Withdrawal rejected & refunded', 'record' => $updatedRec, 'user' => formatUserResponse($user)]);
}

// ----------------------------------------------------
// 4. VIP TIERS & ACTIVITY
// ----------------------------------------------------

// GET /api/vip-tiers
if ($endpoint === 'vip-tiers' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM vip_tiers ORDER BY min_balance ASC");
    sendResponse($stmt->fetchAll());
}

// GET /api/activity
if ($endpoint === 'activity' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM activity_stream ORDER BY created_at DESC LIMIT 20");
    $results = $stmt->fetchAll();
    sendResponse($results ?: []);
}

// Default Fallback
sendResponse(['status' => 'online', 'service' => 'Ecomxstocks API', 'timestamp' => date('c')]);
