<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // If request asks for array format (admin view)
    if (isset($_GET['format']) && $_GET['format'] === 'array') {
        $stmt = $db->query('SELECT * FROM page_sections ORDER BY page, sort_order ASC');
        echo json_encode($stmt->fetchAll());
        exit;
    }
    
    // Default: return nested object for frontend
    $stmt = $db->query('SELECT page, section_key, visible, sort_order FROM page_sections');
    $result = [];
    while ($row = $stmt->fetch()) {
        $page = $row['page'];
        $key = $row['section_key'];
        if (!isset($result[$page])) $result[$page] = [];
        $result[$page][$key] = [
            'visible' => $row['visible'] == 1,
            'sort_order' => (int)$row['sort_order']
        ];
    }
    echo json_encode($result);
    exit;
}

if ($method === 'PATCH') {
    require_once 'auth.php';
    checkAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['page'], $input['section_key'], $input['visible'])) {
        $stmt = $db->prepare('UPDATE page_sections SET visible = ?, updated_at = CURRENT_TIMESTAMP WHERE page = ? AND section_key = ?');
        $stmt->execute([$input['visible'] ? 1 : 0, $input['page'], $input['section_key']]);
        echo json_encode(['success' => true]);
        exit;
    }
}

if ($method === 'PUT') {
    require_once 'auth.php';
    checkAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Batch update sort order
    if (isset($input['orders']) && is_array($input['orders'])) {
        $db->beginTransaction();
        $stmt = $db->prepare('UPDATE page_sections SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE page = ? AND section_key = ?');
        foreach ($input['orders'] as $item) {
            $stmt->execute([$item['sort_order'], $item['page'], $item['section_key']]);
        }
        $db->commit();
        echo json_encode(['success' => true]);
        exit;
    }
    
    // Batch update visibility
    if (isset($input['updates']) && is_array($input['updates'])) {
        $db->beginTransaction();
        $stmt = $db->prepare('UPDATE page_sections SET visible = ?, updated_at = CURRENT_TIMESTAMP WHERE page = ? AND section_key = ?');
        foreach ($input['updates'] as $item) {
            $stmt->execute([$item['visible'] ? 1 : 0, $item['page'], $item['section_key']]);
        }
        $db->commit();
        echo json_encode(['success' => true]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
