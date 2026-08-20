<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['format']) && $_GET['format'] === 'array') {
        $stmt = $db->query('SELECT * FROM page_content ORDER BY section, key');
        echo json_encode($stmt->fetchAll());
        exit;
    }

    $stmt = $db->query('SELECT * FROM page_content ORDER BY section, key');
    $content = [];
    while ($row = $stmt->fetch()) {
        $section = $row['section'];
        $key = $row['key'];
        if (!isset($content[$section])) $content[$section] = [];
        $content[$section][$key] = [
            'de' => $row['value_de'] ?? '',
            'en' => $row['value_en'] ?? '',
            'fr' => $row['value_fr'] ?? ($row['value_en'] ?? ($row['value_de'] ?? '')),
            'cs' => $row['value_cs'] ?? ($row['value_en'] ?? ($row['value_de'] ?? ''))
        ];
    }
    echo json_encode($content);
    exit;
}

if ($method === 'PUT') {
    require_once 'auth.php';
    checkAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Support batch update
    if (isset($input['updates']) && is_array($input['updates'])) {
        $db->beginTransaction();
        $updateStmt = $db->prepare('UPDATE page_content SET value_de = ?, value_en = ?, value_fr = ?, value_cs = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND key = ?');
        $insertStmt = $db->prepare('INSERT INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        
        foreach ($input['updates'] as $item) {
            $updateStmt->execute([
                $item['value_de'] ?? '',
                $item['value_en'] ?? '',
                $item['value_fr'] ?? '',
                $item['value_cs'] ?? '',
                $item['section'],
                $item['key']
            ]);
            if ($updateStmt->rowCount() === 0) {
                $insertStmt->execute([
                    $item['section'],
                    $item['key'],
                    $item['label'] ?? $item['key'],
                    $item['value_de'] ?? '',
                    $item['value_en'] ?? '',
                    $item['value_fr'] ?? '',
                    $item['value_cs'] ?? '',
                    $item['type'] ?? 'text'
                ]);
            }
        }
        $db->commit();
        echo json_encode(['success' => true, 'updated' => count($input['updates'])]);
        exit;
    }
    
    // Single update
    if (isset($input['section'], $input['key'])) {
        $stmt = $db->prepare('UPDATE page_content SET value_de = ?, value_en = ?, value_fr = ?, value_cs = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND key = ?');
        $stmt->execute([
            $input['value_de'] ?? '',
            $input['value_en'] ?? '',
            $input['value_fr'] ?? '',
            $input['value_cs'] ?? '',
            $input['section'],
            $input['key']
        ]);
        if ($stmt->rowCount() === 0) {
            $insertStmt = $db->prepare('INSERT INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $insertStmt->execute([
                $input['section'],
                $input['key'],
                $input['label'] ?? $input['key'],
                $input['value_de'] ?? '',
                $input['value_en'] ?? '',
                $input['value_fr'] ?? '',
                $input['value_cs'] ?? '',
                $input['type'] ?? 'text'
            ]);
        }
        echo json_encode(['success' => true]);
        exit;
    }
    
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
