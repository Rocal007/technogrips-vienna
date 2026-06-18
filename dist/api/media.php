<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/media
if ($method === 'GET') {
    $sql = 'SELECT * FROM media';
    $params = [];
    if (isset($_GET['category']) && $_GET['category'] !== 'all') {
        $sql .= ' WHERE category = ?';
        $params[] = $_GET['category'];
    }
    $sql .= ' ORDER BY uploaded_at DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
    exit;
}

require_once 'auth.php';
checkAuth();

// POST /api/media (Upload)
if ($method === 'POST') {
    if (empty($_FILES['files']['name'][0])) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Dateien empfangen']);
        exit;
    }
    
    $uploadDir = __DIR__ . '/../assets/images/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    
    $category = $_POST['category'] ?? 'uploads';
    $inserted = [];
    $stmt = $db->prepare('INSERT INTO media (filename, original_name, mime_type, size_bytes, path, url, category) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    foreach ($_FILES['files']['name'] as $key => $name) {
        $tmpName = $_FILES['files']['tmp_name'][$key];
        $size = $_FILES['files']['size'][$key];
        $type = $_FILES['files']['type'][$key];
        
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $safeName = preg_replace('/[^a-z0-9._-]/i', '_', basename($name, ".$ext")) . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $safeName;
        $url = '/assets/images/uploads/' . $safeName;
        
        if (move_uploaded_file($tmpName, $destPath)) {
            $stmt->execute([$safeName, $name, $type, $size, $destPath, $url, $category]);
            $inserted[] = ['filename' => $safeName, 'url' => $url, 'original_name' => $name];
        }
    }
    
    echo json_encode(['success' => true, 'files' => $inserted]);
    exit;
}

// DELETE /api/media?id=123
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    $url = $_GET['url'] ?? null;
    
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM media WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) {
            $db->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
            if (strpos($row['path'], 'uploads') !== false && file_exists($row['path'])) {
                @unlink($row['path']);
            }
            echo json_encode(['success' => true]);
            exit;
        }
    } else if ($url) {
        $stmt = $db->prepare('SELECT * FROM media WHERE url = ?');
        $stmt->execute([$url]);
        $row = $stmt->fetch();
        if ($row) {
            $db->prepare('DELETE FROM media WHERE url = ?')->execute([$url]);
            $filePath = __DIR__ . '/..' . $url;
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
            echo json_encode(['success' => true]);
            exit;
        }
    }
    
    http_response_code(404);
    echo json_encode(['error' => 'Nicht gefunden']);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
