<?php
session_start();

// Handle Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

// Handle Login
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username']) && isset($_POST['password'])) {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    try {
        $dbPath = dirname(__DIR__) . '/api/db/data.sqlite';
        
        // Debug Logging
        $logMsg = date('[Y-m-d H:i:s]') . " Attempting login for: $username. DB Path: $dbPath. Exists: " . (file_exists($dbPath) ? 'Yes' : 'No') . "\n";
        file_put_contents(__DIR__ . '/debug.txt', $logMsg, FILE_APPEND);

        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $db->prepare('SELECT password_hash FROM admin_users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $logMsg = date('[Y-m-d H:i:s]') . " User found in DB. Verifying password...\n";
            file_put_contents(__DIR__ . '/debug.txt', $logMsg, FILE_APPEND);

            if (password_verify($password, $user['password_hash'])) {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_username'] = $username;
                
                $logMsg = date('[Y-m-d H:i:s]') . " Login successful!\n";
                file_put_contents(__DIR__ . '/debug.txt', $logMsg, FILE_APPEND);

                header('Location: index.php');
                exit;
            } else {
                $error = 'Ungültiger Benutzername oder Passwort.';
                $logMsg = date('[Y-m-d H:i:s]') . " Password verification failed.\n";
                file_put_contents(__DIR__ . '/debug.txt', $logMsg, FILE_APPEND);
            }
        } else {
            $error = 'Ungültiger Benutzername oder Passwort.';
            $logMsg = date('[Y-m-d H:i:s]') . " User not found in DB.\n";
            file_put_contents(__DIR__ . '/debug.txt', $logMsg, FILE_APPEND);
        }
    } catch (Exception $e) {
        $error = 'Datenbankfehler: ' . $e->getMessage();
        $logMsg = date('[Y-m-d H:i:s]') . " Exception: " . $e->getMessage() . "\n";
        file_put_contents(__DIR__ . '/debug.txt', $logMsg, FILE_APPEND);
    }
}

// Show Login Form if not logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Technogrips Admin Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
    <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div class="flex justify-center mb-6">
            <img src="../assets/images/logo.jpg" alt="Logo" class="h-12" onerror="this.style.display='none'">
        </div>
        <h1 class="text-2xl font-bold text-center mb-6">Admin Panel</h1>
        
        <?php if($error): ?>
        <div class="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl mb-6 text-sm">
            <?= htmlspecialchars($error) ?>
        </div>
        <?php endif; ?>

        <form method="POST" action="index.php">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-400 mb-2">Benutzername (E-Mail)</label>
                <input type="email" name="username" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors" placeholder="E-Mail eingeben" required autofocus>
            </div>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-400 mb-2">Passwort</label>
                <input type="password" name="password" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors" placeholder="Passwort eingeben" required>
            </div>
            <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                Einloggen
            </button>
        </form>
    </div>
</body>
</html>
<?php
    exit;
}

// IF LOGGED IN, output the original admin/index.html content
echo "<script>
localStorage.setItem('admin_user', " . json_encode($_SESSION['admin_username'] ?? 'admin') . ");
window.isPhpSession = true;
</script>";
require_once 'admin_content.html';
?>
