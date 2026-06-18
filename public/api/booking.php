<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$type = $input['type'] ?? 'contact';
$name = $input['name'] ?? 'Unbekannt';
$email = $input['email'] ?? '';
$company = $input['company'] ?? '-';
$phone = $input['phone'] ?? '-';
$message = $input['message'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

$to = 'info@technogrips-vienna.at'; // Change this to actual recipient
$subject = "Neue Anfrage über Website: " . ucfirst($type);

$body = "Sie haben eine neue Anfrage erhalten:\n\n";
$body .= "Typ: $type\n";
$body .= "Name: $name\n";
$body .= "E-Mail: $email\n";
$body .= "Firma: $company\n";
$body .= "Telefon: $phone\n\n";

if ($type === 'booking') {
    $body .= "Produkt: " . ($input['product'] ?? '-') . "\n";
    $body .= "Datum: " . ($input['event_date'] ?? '-') . "\n";
    $body .= "Dauer: " . ($input['duration'] ?? '-') . "\n\n";
}

$body .= "Nachricht:\n$message\n";

$headers = "From: webmaster@technogrips-vienna.at\r\n";
$headers .= "Reply-To: $email\r\n";

// Write to DB
try {
    require_once 'db.php';
    $stmt = $db->prepare('INSERT INTO leads (type, name, email, phone, company, message, product, event_date, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $type, $name, $email, $phone, $company, $message, 
        $input['product'] ?? null, 
        $input['event_date'] ?? null, 
        $input['duration'] ?? null
    ]);
} catch (Exception $e) {
    // Ignore DB errors for email sending
}

// Send Email
if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
}
