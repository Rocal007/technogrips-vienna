<?php
$dbPath = __DIR__ . '/db/data.sqlite';
try {
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $db->exec("CREATE TABLE IF NOT EXISTS lead_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_by TEXT DEFAULT 'admin',
        status TEXT DEFAULT 'sent',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
