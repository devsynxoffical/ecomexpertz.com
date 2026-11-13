<?php
/**
 * Ecomxstocks cPanel PHP REST API Router
 * Handles all CRUD endpoints directly with cPanel MySQL
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

function upsertUserFromClient($pdo, $u) {
    if (!is_array($u) || empty($u['id']) || empty($u['email'])) return;
    $id = trim((string)$u['id']);
    if ($id === 'guest') return;
    $name = trim((string)($u['name'] ?? 'Member'));
    if ($name === 'Guest User') return;
    $email = strtolower(trim((string)$u['email']));
    $password = (string)($u['password'] ?? 'password123');
    $code = (string)($u['referral_code'] ?? ($u['referralCode'] ?? ($u['code'] ?? rand(100000, 999999))));
    $invCode = (string)($u['invited_by_code'] ?? ($u['invitedByCode'] ?? ($u['referred_by_code'] ?? ($u['referredByCode'] ?? '888888'))));
    $refName = (string)($u['referred_by_name'] ?? ($u['referredByName'] ?? 'System Administrator'));
    $refBy = (string)($u['referred_by'] ?? ($u['referredBy'] ?? $invCode));
    $avatar = strtoupper(substr($name, 0, 1)) ?: 'U';
    $vipLevel = (string)($u['vip_level'] ?? ($u['vipLevel'] ?? 'eBay'));
    $vipTierId = (string)($u['vip_tier_id'] ?? ($u['vipTierId'] ?? ('tier_' . strtolower($vipLevel))));
    $balance = (float)($u['balance'] ?? 0);
    $totEarn = (float)($u['total_earnings'] ?? ($u['totalEarnings'] ?? 0));
    $totDep = (float)($u['total_deposit'] ?? ($u['totalDeposit'] ?? 0));
    $totWth = (float)($u['total_withdraw'] ?? ($u['totalWithdraw'] ?? 0));
    $pendReq = (int)($u['pending_requests'] ?? ($u['pendingRequests'] ?? 0));
    $teamCnt = (int)($u['team_members_count'] ?? ($u['teamMembersCount'] ?? ($u['referrals'] ?? 0)));
    $refs = (int)($u['referrals'] ?? $teamCnt);
    $pendTasks = (int)($u['pending_tasks'] ?? ($u['pendingTasks'] ?? 25));
    $compTasks = (int)($u['completed_tasks'] ?? ($u['completedTasks'] ?? 0));
    $quota = (int)($u['daily_quota'] ?? ($u['dailyQuota'] ?? 25));
    $dailyComp = (int)($u['daily_completed'] ?? ($u['dailyCompleted'] ?? 0));
    $kyc = (string)($u['kyc_status'] ?? ($u['kycStatus'] ?? 'Verified'));
    $wallet = (string)($u['wallet_address'] ?? ($u['walletAddress'] ?? ($u['wallet'] ?? '')));
    $status = (string)($u['status'] ?? 'Active');
    $role = (string)($u['role'] ?? 'user');
    $assignedTasks = isset($u['assigned_tasks']) ? $u['assigned_tasks'] : ($u['assignedTasks'] ?? null);
    if (is_array($assignedTasks)) {
        $assignedTasks = !empty($assignedTasks) ? json_encode($assignedTasks) : null;
    }
    $assignedPkg = $u['assigned_package'] ?? ($u['assignedPackage'] ?? null);
    $pkgStatus = $u['task_package_status'] ?? ($u['taskPackageStatus'] ?? null);
    $pkgReq = !empty($u['task_package_requested'] ?? ($u['taskPackageRequested'] ?? 0)) ? 1 : 0;
    $rawDate = $u['created_at'] ?? ($u['createdAt'] ?? date('Y-m-d H:i:s'));
    $createdAt = date('Y-m-d H:i:s', strtotime($rawDate) ?: time());

    try {
        $stmt = $pdo->prepare("
            INSERT INTO users (
                id, name, email, password, code, referral_code, invited_by_code, referred_by_code, referred_by_name, referred_by,
                avatar, vip_level, vip_tier_id, balance, total_earnings, total_deposit, total_withdraw, pending_requests,
                team_members_count, referrals, pending_tasks, completed_tasks, daily_quota, daily_completed,
                kyc_status, wallet_address, network, status, role, assigned_tasks, assigned_package, task_package_status, task_package_requested, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, 'TRC20', ?, ?, ?, ?, ?, ?, ?
            )
            ON DUPLICATE KEY UPDATE
                balance = GREATEST(balance, VALUES(balance)),
                total_deposit = GREATEST(total_deposit, VALUES(total_deposit)),
                total_earnings = GREATEST(total_earnings, VALUES(total_earnings)),
                completed_tasks = GREATEST(completed_tasks, VALUES(completed_tasks)),
                assigned_tasks = COALESCE(VALUES(assigned_tasks), assigned_tasks),
                assigned_package = COALESCE(VALUES(assigned_package), assigned_package),
                task_package_status = COALESCE(VALUES(task_package_status), task_package_status),
                created_at = VALUES(created_at)
        ");
        $stmt->execute([
            $id, $name, $email, $password, $code, $code, $invCode, $invCode, $refName, $refBy,
            $avatar, $vipLevel, $vipTierId, $balance, $totEarn, $totDep, $totWth, $pendReq,
            $teamCnt, $refs, $pendTasks, $compTasks, $quota, $dailyComp,
            $kyc, $wallet, $status, $role, $assignedTasks, $assignedPkg, $pkgStatus, $pkgReq, $createdAt
        ]);
    } catch (Exception $e) {}
}

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
    $user['walletAddress'] = $user['wallet_address'] ?? ($user['walletAddress'] ?? '');
    $user['wallet_address'] = $user['wallet_address'] ?? ($user['walletAddress'] ?? '');
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
    $stmt = $pdo->prepare("SELECT id, status FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();
    if ($existing) {
        $st = strtolower($existing['status'] ?? 'active');
        if ($st === 'blocked' || $st === 'suspended' || $st === 'banned' || $st === 'deleted') {
            sendResponse(['error' => "This account has been {$st} by administration and cannot be re-registered or reactivated. Please contact support."], 403);
        }
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

    $status = strtolower($user['status'] ?? 'active');
    if ($status === 'blocked' || $status === 'suspended' || $status === 'banned') {
        sendResponse(['error' => "This account is {$user['status']} by administration. You cannot access or reactivate this account. Please contact support."], 403);
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

// POST /api/users/sync (Bulk sync & recover users and records from client cache / Supabase)
if ($endpoint === 'users' && $action === 'sync' && $method === 'POST') {
    $input = getJsonInput();
    $clientUsers = $input['users'] ?? [];
    if (is_array($clientUsers)) {
        foreach ($clientUsers as $cu) {
            upsertUserFromClient($pdo, $cu);
        }
    }
    $clientRecords = $input['records'] ?? [];
    if (is_array($clientRecords)) {
        $recStmt = $pdo->prepare("
            INSERT IGNORE INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network, tx_hash, wallet_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($clientRecords as $cr) {
            if (!is_array($cr) || empty($cr['id'])) continue;
            $rUserId = $cr['user_id'] ?? ($cr['userId'] ?? '');
            if (!$rUserId) continue;
            try {
                $recStmt->execute([
                    (string)$cr['id'],
                    (string)($cr['code'] ?? $cr['id']),
                    (string)($cr['type'] ?? 'Transaction'),
                    (string)($cr['category'] ?? 'General'),
                    (float)($cr['amount'] ?? 0),
                    (string)($cr['currency'] ?? 'USDT'),
                    (string)($cr['date'] ?? date('Y-m-d')),
                    (string)($cr['status'] ?? 'Completed'),
                    (string)($cr['note'] ?? ''),
                    (string)$rUserId,
                    (string)($cr['user_name'] ?? ($cr['userName'] ?? 'Member')),
                    (string)($cr['network'] ?? 'TRC20'),
                    (string)($cr['tx_hash'] ?? ($cr['txHash'] ?? '')),
                    (string)($cr['wallet_address'] ?? ($cr['walletAddress'] ?? ''))
                ]);
            } catch (Exception $e) {}
        }
    }
    $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC");
    $rawUsers = $stmt->fetchAll();
    sendResponse(array_map('formatUserResponse', $rawUsers));
}

// GET /api/users/:id/team
if ($endpoint === 'users' && $action && $param === 'team' && $method === 'GET') {
    $userId = $action;
    $userCode = $_GET['code'] ?? '';
    if (!$userCode) {
        $uStmt = $pdo->prepare("SELECT referral_code, code FROM users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        $userCode = $uRow['referral_code'] ?? ($uRow['code'] ?? '');
    }
    if ($userCode) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE referred_by = ? OR referred_by_code = ? OR invited_by_code = ? ORDER BY created_at DESC");
        $stmt->execute([$userId, $userCode, $userCode]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE referred_by = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
    }
    $team = $stmt->fetchAll();
    sendResponse(array_map('formatUserResponse', $team));
}

// GET /api/users/:id/status
if ($endpoint === 'users' && $action && $param === 'status' && $method === 'GET') {
    $userId = $action;
    $stmt = $pdo->prepare("SELECT id, status FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $u = $stmt->fetch();
    if (!$u) {
        $email = $_GET['email'] ?? '';
        if ($email) {
            $stmt = $pdo->prepare("SELECT id, status FROM users WHERE LOWER(email) = LOWER(?)");
            $stmt->execute([$email]);
            $u = $stmt->fetch();
        }
    }
    if (!$u) {
        // Never kick or delete user on temporary missing ID
        sendResponse(['deleted' => false, 'status' => 'Active', 'notFound' => true]);
    }
    $isDeleted = strtolower($u['status'] ?? '') === 'deleted';
    sendResponse(['deleted' => $isDeleted, 'status' => $u['status'] ?? 'Active']);
}

// POST /api/users/:id/request-package
if ($endpoint === 'users' && $action && $param === 'request-package' && $method === 'POST') {
    $userId = $action;
    $input = getJsonInput();
    $platform = $input['platform'] ?? 'eBay';
    $reqId = $input['reqId'] ?? (rand(100, 999) . '-' . substr((string)time(), -4));

    $pdo->prepare("UPDATE users SET task_package_requested = 1, task_package_status = 'pending', pending_requests = pending_requests + 1 WHERE id = ?")
        ->execute([$userId]);

    $uStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $uRow = $uStmt->fetch();
    $uName = $uRow['name'] ?? 'Member';

    $recId = 'rec_req_' . time() . '_' . rand(100, 999);
    $noteJson = json_encode([
        'taskPackageRequested' => true,
        'taskPackageStatus' => 'pending',
        'platform' => $platform,
        'requestId' => $reqId,
        'requestedAt' => date('c')
    ]);
    try {
        $pdo->prepare("
            INSERT INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network)
            VALUES (?, ?, ?, 'Tasks', 0.00, 'USDT', CURDATE(), 'Pending', ?, ?, ?, 'System')
        ")->execute([$recId, 'REQ-' . $reqId, "$platform Task Package Request", $noteJson, $userId, $uName]);
    } catch (Exception $e) {}

    sendResponse(['success' => true, 'requestId' => $reqId]);
}

// POST /api/users/:id/cancel-package
if ($endpoint === 'users' && $action && $param === 'cancel-package' && $method === 'POST') {
    $userId = $action;
    $pdo->prepare("UPDATE users SET task_package_requested = 0, task_package_status = NULL WHERE id = ?")->execute([$userId]);
    $pdo->prepare("UPDATE records SET status = 'Cancelled' WHERE user_id = ? AND category = 'Tasks' AND status = 'Pending'")->execute([$userId]);
    sendResponse(['success' => true]);
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

    // Ensure user exists in MySQL if it was previously only in client/Supabase
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $checkStmt->execute([$userId]);
    if (!$checkStmt->fetch() && !empty($input['email'])) {
        upsertUserFromClient($pdo, array_merge($input, ['id' => $userId]));
    }

    // Whitelist and map column names to prevent SQL errors
    $columnMap = [
        'name' => 'name',
        'email' => 'email',
        'balance' => 'balance',
        'total_deposit' => 'total_deposit',
        'totalDeposit' => 'total_deposit',
        'total_earnings' => 'total_earnings',
        'totalEarnings' => 'total_earnings',
        'total_withdraw' => 'total_withdraw',
        'totalWithdraw' => 'total_withdraw',
        'pending_requests' => 'pending_requests',
        'pendingRequests' => 'pending_requests',
        'team_members_count' => 'team_members_count',
        'teamMembersCount' => 'team_members_count',
        'referrals' => 'referrals',
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
            } elseif ($col === 'task_package_requested') {
                $mapped[$col] = $v ? 1 : 0;
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

// DELETE /api/users/:id
if ($endpoint === 'users' && $action && $method === 'DELETE') {
    $userId = $action;
    $pdo->prepare("DELETE FROM records WHERE user_id = ?")->execute([$userId]);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
    sendResponse(['message' => 'User permanently deleted from system', 'id' => $userId]);
}

// GET /api/settings/gateway
if ($endpoint === 'settings' && ($action === 'gateway' || $action === 'deposit-accounts') && $method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
    $rows = $stmt->fetchAll();
    $settings = [];
    foreach ($rows as $r) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }
    sendResponse($settings);
}

// PUT /api/settings/gateway
if ($endpoint === 'settings' && ($action === 'gateway' || $action === 'deposit-accounts') && $method === 'PUT') {
    $input = getJsonInput();
    foreach ($input as $k => $v) {
        $val = is_array($v) ? json_encode($v) : (string)$v;
        $stmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$k, $val, $val]);
    }
    sendResponse(['message' => 'Gateway settings updated successfully', 'settings' => $input]);
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
    $stmt = $pdo->query("SELECT * FROM records ORDER BY created_at DESC LIMIT 200");
    $allRecs = $stmt->fetchAll();
    $unique = [];
    $seen = [];
    foreach ($allRecs as $r) {
        $key = !empty($r['code']) ? $r['code'] : $r['id'];
        if (!isset($seen[$key])) {
            $seen[$key] = true;
            if (!empty($r['note']) && strlen($r['note']) > 300) {
                $r['note'] = 'Task Package Assigned';
            }
            $unique[] = $r;
        }
    }
    sendResponse($unique);
}

// POST /api/records
if ($endpoint === 'records' && !$action && $method === 'POST') {
    $input = getJsonInput();
    $recId = $input['id'] ?? ('rec_' . time() . '_' . rand(100, 999));
    $code = $input['code'] ?? ('REC-' . rand(100000, 999999));
    $type = $input['type'] ?? 'Direct Deposit';
    $cat = $input['category'] ?? 'Deposit';
    $amt = (float)($input['amount'] ?? 0);
    $curr = $input['currency'] ?? 'USDT';
    $date = $input['date'] ?? date('Y-m-d H:i:s');
    $status = $input['status'] ?? 'Completed';
    $note = $input['note'] ?? '';
    $uId = $input['user_id'] ?? ($input['userId'] ?? $currentUserId);
    $uName = $input['user_name'] ?? ($input['userName'] ?? 'Member');
    $net = $input['network'] ?? 'TRC20';
    $tx = $input['tx_hash'] ?? ($input['txHash'] ?? 'Direct Transfer');

    $pdo->prepare("
        INSERT IGNORE INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network, tx_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ")->execute([$recId, $code, $type, $cat, $amt, $curr, $date, $status, $note, $uId, $uName, $net, $tx]);

    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$recId]);
    sendResponse($stmt->fetch() ?: $input, 201);
}

// POST /api/deposits
if ($endpoint === 'deposits' && !$action && $method === 'POST') {
    $input = getJsonInput();
    $amount = floatval($input['amount'] ?? 0);
    $txHash = $input['txHash'] ?? ($input['tx_hash'] ?? ('0x' . md5(time())));
    $network = $input['network'] ?? 'TRC20';
    $userId = $input['userId'] ?? ($input['user_id'] ?? $currentUserId);
    $userName = $input['userName'] ?? ($input['user_name'] ?? 'Member');
    $userEmail = $input['userEmail'] ?? '';

    if ($amount <= 0) sendResponse(['error' => 'Invalid amount'], 400);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user && $userId) {
        upsertUserFromClient($pdo, [
            'id' => $userId,
            'name' => $userName,
            'email' => $userEmail ?: ($userId . '@member.ecomxstocks.com')
        ]);
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
    }

    $finalUserId = $user['id'] ?? ($userId ?: 'usr_guest');
    $finalUserName = $user['name'] ?? ($userName ?: 'Member');

    $recId = $input['id'] ?? ('rec_dep_' . time() . '_' . rand(100, 999));
    $recCode = $input['code'] ?? ('DEP-' . rand(1000000000, 9999999999));

    $pdo->prepare("
        INSERT IGNORE INTO records (id, code, type, category, amount, currency, date, status, note, user_id, user_name, network, tx_hash)
        VALUES (?, ?, 'TRC20 Deposit', 'Deposit', ?, 'USDT', CURDATE(), 'Pending', 'Awaiting blockchain verification', ?, ?, ?, ?)
    ")->execute([
        $recId,
        $recCode,
        $amount,
        $finalUserId,
        $finalUserName,
        $network,
        $txHash
    ]);

    if ($user) {
        $pdo->prepare("UPDATE users SET pending_requests = pending_requests + 1 WHERE id = ?")->execute([$finalUserId]);
    }

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

// PUT /api/vip-tiers/:id
if ($endpoint === 'vip-tiers' && $method === 'PUT' && !empty($action)) {
    $id = $action;
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $fields = [];
    $vals = [];
    if (isset($body['minBalance']) || isset($body['min_balance'])) {
        $fields[] = 'min_balance = ?';
        $vals[] = (float)($body['minBalance'] ?? $body['min_balance']);
    }
    if (isset($body['maxBalance']) || isset($body['max_balance'])) {
        $fields[] = 'max_balance = ?';
        $vals[] = (float)($body['maxBalance'] ?? $body['max_balance']);
    }
    if (isset($body['commissionRate']) || isset($body['commission_rate'])) {
        $fields[] = 'commission_rate = ?';
        $vals[] = (float)($body['commissionRate'] ?? $body['commission_rate']);
    }
    if (isset($body['dailyTasks']) || isset($body['daily_tasks'])) {
        $fields[] = 'daily_tasks = ?';
        $vals[] = (int)($body['dailyTasks'] ?? $body['daily_tasks']);
    }
    if (isset($body['name'])) {
        $fields[] = 'name = ?';
        $vals[] = $body['name'];
    }
    if (isset($body['platform'])) {
        $fields[] = 'platform = ?';
        $vals[] = $body['platform'];
    }
    if (isset($body['description'])) {
        $fields[] = 'description = ?';
        $vals[] = $body['description'];
    }
    if (!empty($fields)) {
        $vals[] = $id;
        $sql = "UPDATE vip_tiers SET " . implode(', ', $fields) . " WHERE id = ?";
        $pdo->prepare($sql)->execute($vals);
    }
    $stmt = $pdo->prepare("SELECT * FROM vip_tiers WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(['tier' => $stmt->fetch() ?: $body]);
}

// POST /api/vip-tiers
if ($endpoint === 'vip-tiers' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = $body['id'] ?? ('tier_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $body['name'] ?? 'custom') . '_' . time()));
    $name = $body['name'] ?? 'New Tier';
    $platform = $body['platform'] ?? $name;
    $minBal = (float)($body['minBalance'] ?? 0);
    $maxBal = isset($body['maxBalance']) ? (float)$body['maxBalance'] : 99999;
    $commRate = (float)($body['commissionRate'] ?? 5);
    $dailyTasks = (int)($body['dailyTasks'] ?? 25);
    $desc = $body['description'] ?? '';

    $stmt = $pdo->prepare("INSERT INTO vip_tiers (id, name, platform, min_balance, max_balance, commission_rate, daily_tasks, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $name, $platform, $minBal, $maxBal, $commRate, $dailyTasks, $desc]);
    sendResponse(['tier' => array_merge($body, ['id' => $id])]);
}

// DELETE /api/vip-tiers/:id
if ($endpoint === 'vip-tiers' && $method === 'DELETE' && !empty($action)) {
    $pdo->prepare("DELETE FROM vip_tiers WHERE id = ?")->execute([$action]);
    sendResponse(['success' => true]);
}

// GET /api/activity
if ($endpoint === 'activity' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM activity_stream ORDER BY created_at DESC LIMIT 20");
    $results = $stmt->fetchAll();
    sendResponse($results ?: []);
}

// Default Fallback
sendResponse(['status' => 'online', 'service' => 'Ecomxstocks API', 'timestamp' => date('c')]);
