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
$product = $input['product'] ?? null;
$event_date = $input['event_date'] ?? null;
$duration = $input['duration'] ?? null;
$booking_date = $input['booking_date'] ?? null;
$booking_time = $input['booking_time'] ?? null;

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

require_once 'db.php';

// Write to DB
try {
    $stmt = $db->prepare('INSERT INTO leads (type, name, email, phone, company, message, product, event_date, duration, booking_date, booking_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $type, $name, $email, $phone, $company, $message, 
        $product, $event_date, $duration, $booking_date, $booking_time
    ]);
} catch (Exception $e) {
    // Ignore DB errors for email sending
}

// Fetch recipient email from admin settings
$to = 'office@technogrips-vienna.at';
try {
    $stmtMail = $db->query("SELECT value_de FROM page_content WHERE section = 'contact' AND key = 'email'");
    if ($rowMail = $stmtMail->fetch()) {
        if (!empty($rowMail['value_de'])) {
            $to = trim($rowMail['value_de']);
        }
    }
} catch (Exception $e) {
}

$typeLabels = [
    'contact' => 'Allgemeine Anfrage',
    'product' => 'Produktanfrage / Angebot',
    'booking' => 'Beratungstermin',
    'catalog' => 'Katalog-Download',
    'newsletter' => 'Newsletter-Anmeldung'
];
$typeTitle = $typeLabels[$type] ?? ucfirst($type);

$subject = "Neue Anfrage über Website: " . $typeTitle;

$body = "Sie haben eine neue Anfrage über technogrips-vienna.at erhalten:\n\n";
$body .= "Typ: $typeTitle ($type)\n";
$body .= "Name: $name\n";
$body .= "E-Mail: $email\n";
$body .= "Firma: $company\n";
$body .= "Telefon: $phone\n\n";

if ($type === 'product') {
    $body .= "Kran-Modell: " . ($product ?? '-') . "\n";
    $body .= "Drehtag / Datum: " . ($event_date ?? '-') . "\n";
    $body .= "Dauer: " . ($duration ?? '-') . "\n\n";
} elseif ($type === 'booking') {
    $body .= "Wunschdatum: " . ($booking_date ?? '-') . "\n";
    $body .= "Wunsch-Uhrzeit: " . ($booking_time ?: 'Beliebig') . "\n\n";
}

if (!empty($message)) {
    $body .= "Nachricht:\n$message\n";
}

$headers = "From: webmaster@technogrips-vienna.at\r\n";
$headers .= "Reply-To: $email\r\n";

// Send Email
if (mail($to, $subject, $body, $headers)) {
    $response = ['success' => true, 'message' => 'Ihre Anfrage wurde erfolgreich gesendet.'];
    if ($type === 'catalog') {
        $response['downloadUrl'] = '/assets/docs/supertechno_50_plus_manual.pdf';
    }
    echo json_encode($response);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
}
