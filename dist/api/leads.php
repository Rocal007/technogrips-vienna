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
        $lead = $stmt->fetch();
        if ($lead) {
            $stmtReplies = $db->prepare('SELECT * FROM lead_replies WHERE lead_id = ? ORDER BY created_at ASC');
            $stmtReplies->execute([$_GET['id']]);
            $lead['replies'] = $stmtReplies->fetchAll();
        }
        echo json_encode($lead);
        exit;
    }
}

if ($method === 'POST') {
    if ($action === 'reply' || isset($_GET['reply'])) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        $lead_id = (int)($input['lead_id'] ?? $_GET['id'] ?? 0);
        $recipient = trim($input['recipient'] ?? '');
        $subject = trim($input['subject'] ?? 'Re: Ihre Anfrage bei Technogrips Vienna');
        $message = trim($input['message'] ?? '');
        $sent_by = trim($input['sent_by'] ?? $_SESSION['admin_username'] ?? 'Technogrips Vienna Team');

        if (!$lead_id || empty($recipient) || empty($message)) {
            http_response_code(400);
            echo json_encode(['error' => 'Lead-ID, Empfänger und Nachricht sind erforderlich.']);
            exit;
        }

        if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültige Empfänger-E-Mail-Adresse.']);
            exit;
        }

        // Verify lead exists
        $stmtLead = $db->prepare('SELECT * FROM leads WHERE id = ?');
        $stmtLead->execute([$lead_id]);
        $lead = $stmtLead->fetch();
        if (!$lead) {
            http_response_code(404);
            echo json_encode(['error' => 'Lead nicht gefunden.']);
            exit;
        }

        // Format HTML Email
        $htmlMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
        $emailHtml = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0d0e12; color: #e5e7eb; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #14161d; border: 1px solid rgba(229,197,0,0.25); border-radius: 16px; overflow: hidden; }
  .header { background: #0b0c10; padding: 24px; border-bottom: 2px solid #e5c500; text-align: center; }
  .header h1 { margin: 0; color: #e5c500; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
  .header p { margin: 4px 0 0; color: #9ca3af; font-size: 13px; }
  .content { padding: 28px; line-height: 1.65; font-size: 15px; color: #f3f4f6; }
  .footer { background: #0b0c10; padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #6b7280; text-align: center; }
  .footer a { color: #e5c500; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TECHNOGRIPS VIENNA</h1>
      <p>Supertechno Kamerakran Vermietung &amp; Operator Service</p>
    </div>
    <div class="content">
      ' . $htmlMessage . '
    </div>
    <div class="footer">
      <p style="margin:0 0 4px; font-weight:bold; color:#e5c500;">Technogrips Vienna</p>
      <p style="margin:0 0 4px;">Gerhard Deimel · Wien, Österreich</p>
      <p style="margin:0;"><a href="https://technogrips-vienna.at">www.technogrips-vienna.at</a> · <a href="mailto:office@technogrips-vienna.at">office@technogrips-vienna.at</a></p>
    </div>
  </div>
</body>
</html>';

        $plainBody = $message . "\n\n--\nTechnogrips Vienna\nGerhard Deimel · Supertechno Kamerakran Vermietung\nWien, Österreich\nhttps://technogrips-vienna.at\noffice@technogrips-vienna.at";

        $boundary = md5(uniqid((string)time()));
        $headers = "From: Technogrips Vienna <office@technogrips-vienna.at>\r\n";
        $headers .= "Reply-To: office@technogrips-vienna.at\r\n";
        $headers .= "Bcc: office@technogrips-vienna.at\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";

        $fullBody = "--$boundary\r\n";
        $fullBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $fullBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $fullBody .= $plainBody . "\r\n\r\n";
        $fullBody .= "--$boundary\r\n";
        $fullBody .= "Content-Type: text/html; charset=UTF-8\r\n";
        $fullBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $fullBody .= $emailHtml . "\r\n\r\n";
        $fullBody .= "--$boundary--";

        // Send to customer
        $mailSent = @mail($recipient, $subject, $fullBody, $headers);

        // Also send direct copy to office@technogrips-vienna.at
        $copyHeaders = "From: Technogrips System <webmaster@technogrips-vienna.at>\r\n";
        $copyHeaders .= "Reply-To: $recipient\r\n";
        $copyHeaders .= "MIME-Version: 1.0\r\n";
        $copyHeaders .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
        $copySubject = "[Admin-Antwort Kopie] " . $subject;
        @mail('office@technogrips-vienna.at', $copySubject, $fullBody, $copyHeaders);

        // Insert reply record into DB
        $stmtInsert = $db->prepare('INSERT INTO lead_replies (lead_id, recipient, subject, message, sent_by, status) VALUES (?, ?, ?, ?, ?, ?)');
        $stmtInsert->execute([$lead_id, $recipient, $subject, $message, $sent_by, $mailSent ? 'sent' : 'logged']);
        $replyId = (int)$db->lastInsertId();

        // Update lead status to 'contacted' if it was 'new'
        $db->prepare("UPDATE leads SET status = 'contacted' WHERE id = ? AND status = 'new'")->execute([$lead_id]);

        echo json_encode([
            'success' => true,
            'message' => 'Antwort wurde erfolgreich versendet und gespeichert (Kopie an office@technogrips-vienna.at übermittelt).',
            'reply' => [
                'id' => $replyId,
                'lead_id' => $lead_id,
                'recipient' => $recipient,
                'subject' => $subject,
                'message' => $message,
                'sent_by' => $sent_by,
                'status' => 'sent',
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
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
