<?php
// ⚠️ VULNERABILIDADES INTENCIONALES PARA SONARQUBE

// Credenciales hardcodeadas (VULNERABILIDAD 1)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'insecure_password_123!'); // ¡EXPUESTO!
define('DB_NAME', 'vulnerable_auth');

// Secret key en código (VULNERABILIDAD 2)
define('APP_SECRET', 'my_super_insecure_secret_2024');

// Modo debug activado (VULNERABILIDAD 3)
define('DEBUG_MODE', true);

// Configuración de sesión insegura (VULNERABILIDAD 4) - NO iniciamos sesión aquí
$session_config = [
    'cookie_httponly' => 0, // ¡DESHABILITADO!
    'cookie_secure' => 0, // ¡HTTP permitido!
    'use_only_cookies' => 0, // ¡DESHABILITADO!
    'cookie_lifetime' => 86400 // 24 horas
];

// Aplicar configuración de sesión
foreach ($session_config as $key => $value) {
    ini_set("session.$key", $value);
}

// Mostrar errores en pantalla (VULNERABILIDAD 5)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Conexión vulnerable a MySQL (VULNERABILIDAD 6)
function connectDB() {
    // VULNERABILIDAD: Sin manejo seguro de errores
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        // VULNERABILIDAD: Error detallado expuesto
        $error_msg = "Error conexión: " . $conn->connect_error . " | User: " . DB_USER . " | Pass: " . DB_PASS;
        die($error_msg);
    }
    
    // VULNERABILIDAD: Sin charset definido (permite inyecciones)
    // $conn->set_charset("utf8mb4"); // ¡COMENTADO INTENCIONALMENTE!
    
    return $conn;
}

// Función SIN sanitización (VULNERABILIDAD 7)
function getUserInput($input) {
    // ¡PELIGRO! Solo trim, no sanitiza SQL ni XSS
    $input = trim($input);
    
    // VULNERABILIDAD: Eliminamos algunas comillas pero no todas
    $input = str_replace("'", "", $input);
    $input = str_replace('"', '', $input);
    
    // VULNERABILIDAD: Dejamos posible SQL Injection con OR 1=1
    return $input;
}

// Función de hash débil (VULNERABILIDAD 8)
function weakHash($password) {
    // ¡PELIGRO! Hash débil y sin salt
    return md5($password . APP_SECRET); // MD5 es vulnerable
}

// Log vulnerable (VULNERABILIDAD 9)
function logActivity($message, $user_data = []) {
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    // VULNERABILIDAD: Log con datos sensibles
    $log_data = array_merge($user_data, [
        'ip' => $ip,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ]);
    
    $log_entry = "$timestamp - $message - " . json_encode($log_data) . "\n";
    
    // VULNERABILIDAD: Log en directorio público accesible
    file_put_contents('activity.log', $log_entry, FILE_APPEND);
    
    if (DEBUG_MODE) {
        // VULNERABILIDAD: También log en sistema
        error_log($log_entry);
    }
}

// Función para mostrar errores SQL (VULNERABILIDAD 10)
function showSQLError($conn, $sql) {
    if (DEBUG_MODE) {
        echo "<div style='background:#ffcccc;padding:10px;margin:10px 0;border:1px solid red;'>";
        echo "<strong>⚠️ DEBUG SQL ERROR:</strong><br>";
        echo "Query: <code>" . htmlspecialchars($sql) . "</code><br>";
        echo "Error: " . $conn->error . "<br>";
        echo "Errno: " . $conn->errno;
        echo "</div>";
        
        // VULNERABILIDAD: Log del error SQL completo
        logActivity("SQL Error: " . $conn->error . " | Query: " . $sql);
    }
    return false;
}

// Configuración de CORS inseguro (VULNERABILIDAD 11)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: *");
header("Access-Control-Allow-Headers: *");

// Token fijo para "seguridad" (VULNERABILIDAD 12)
define('API_TOKEN', 'insecure_api_token_123456');

// Credenciales de admin hardcodeadas (VULNERABILIDAD 13)
$ADMIN_CREDENTIALS = [
    'username' => 'superadmin',
    'password' => 'Admin@123456', // ¡EXPUESTO!
    'email' => 'admin@vulnerable.com'
];

// Variables de configuración expuestas (VULNERABILIDAD 14)
$APP_CONFIG = [
    'version' => '1.0.0-vulnerable',
    'maintenance' => false,
    'allowed_ips' => ['127.0.0.1', '192.168.*', '*'], // ¡DEMASIADO PERMISIVO!
    'upload_path' => '/var/www/uploads/', // ¡RUTA EXPUESTA!
    'backup_path' => '/var/backups/database.sql' // ¡RUTA EXPUESTA!
];

// Función para iniciar sesión insegura
function startInsecureSession() {
    // VULNERABILIDAD: Inicio de sesión sin validaciones
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Mensaje de advertencia (para demostración)
if (DEBUG_MODE) {
    echo "<!-- ⚠️ MODO DEBUG ACTIVADO - TODAS LAS VULNERABILIDADES SON VISIBLES -->";
}
?>
