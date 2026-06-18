<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';
checkAuth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'stats') {
        $today = date('Y-m-d');
        $weekAgo = date('Y-m-d', strtotime('-7 days'));
        $monthAgo = date('Y-m-d', strtotime('-30 days'));

        $total = $db->query('SELECT COUNT(*) FROM leads')->fetchColumn();
        $todayCount = $db->query("SELECT COUNT(*) FROM leads WHERE DATE(created_at) = '$today'")->fetchColumn();
        $weekCount = $db->query("SELECT COUNT(*) FROM leads WHERE DATE(created_at) >= '$weekAgo'")->fetchColumn();
        $monthCount = $db->query("SELECT COUNT(*) FROM leads WHERE DATE(created_at) >= '$monthAgo'")->fetchColumn();

        $byType = $db->query("SELECT type, COUNT(*) as count FROM leads GROUP BY type")->fetchAll();
        $byStatus = $db->query("SELECT status, COUNT(*) as count FROM leads GROUP BY status")->fetchAll();

        $qualified = $db->query("SELECT COUNT(*) FROM leads WHERE status IN ('qualified','closed')")->fetchColumn();
        $conversionRate = $total > 0 ? round(($qualified / $total) * 100) : 0;

        $timeline = $db->query("SELECT DATE(created_at) as date, COUNT(*) as count FROM leads WHERE DATE(created_at) >= '$monthAgo' GROUP BY DATE(created_at) ORDER BY date ASC")->fetchAll();
        $recent = $db->query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5')->fetchAll();

        echo json_encode(compact('total', 'todayCount', 'weekCount', 'monthCount', 'conversionRate', 'qualified', 'byType', 'byStatus', 'timeline', 'recent'));
        exit;
    }
    
    if ($action === 'list') {
        $type = $_GET['type'] ?? 'all';
        $status = $_GET['status'] ?? 'all';
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 25);
        $offset = ($page - 1) * $limit;

        $where = [];
        $params = [];

        if ($type !== 'all') { $where[] = 'type = ?'; $params[] = $type; }
        if ($status !== 'all') { $where[] = 'status = ?'; $params[] = $status; }
        if ($search) {
            $where[] = '(name LIKE ? OR email LIKE ? OR company LIKE ?)';
            $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%";
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $stmtTotal = $db->prepare("SELECT COUNT(*) FROM leads $whereClause");
        $stmtTotal->execute($params);
        $total = $stmtTotal->fetchColumn();

        $params[] = $limit;
        $params[] = $offset;
        $stmt = $db->prepare("SELECT * FROM leads $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute($params);
        $leads = $stmt->fetchAll();

        echo json_encode([
            'leads' => $leads,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ]);
        exit;
    }
    
    if ($action === 'export') {
        $leads = $db->query('SELECT * FROM leads ORDER BY created_at DESC')->fetchAll();
        $headers = ['id','type','name','email','phone','company','message','product','event_date','duration','booking_date','booking_time','language','status','notes','source','created_at'];
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="technogrips-leads-' . date('Y-m-d') . '.csv"');
        echo "\xEF\xBB\xBF"; // UTF-8 BOM
        echo implode(',', $headers) . "\n";
        foreach ($leads as $lead) {
            $row = [];
            foreach ($headers as $h) {
                $val = $lead[$h] ?? '';
                $row[] = '"' . str_replace('"', '""', $val) . '"';
            }
            echo implode(',', $row) . "\n";
        }
        exit;
    }
    
    if (isset($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM leads WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch());
        exit;
    }
}

if ($method === 'PATCH' && isset($_GET['id'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $updates = [];
    $params = [];
    if (isset($input['status'])) { $updates[] = 'status = ?'; $params[] = $input['status']; }
    if (isset($input['notes'])) { $updates[] = 'notes = ?'; $params[] = $input['notes']; }
    
    if (count($updates) > 0) {
        $params[] = $_GET['id'];
        $stmt = $db->prepare('UPDATE leads SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($params);
    }
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE' && isset($_GET['id'])) {
    $stmt = $db->prepare('DELETE FROM leads WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
