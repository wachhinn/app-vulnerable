<?php
require_once 'config.php';
// Iniciar sesión usando nuestra función
startInsecureSession();

// VULNERABILIDAD: Sin verificación de sesión robusta
if (!isset($_SESSION['user_id']) && isset($_COOKIE['user_auth'])) {
    // VULNERABILIDAD: Confía en cookie no segura
    $conn = connectDB();
    $username = $_COOKIE['user_auth'];
    $sql = "SELECT * FROM usuarios WHERE username = '$username'";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['logged_in'] = true;
    }
    $conn->close();
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: login.php");
    exit;
}

$conn = connectDB();
$user_id = $_SESSION['user_id'];

// VULNERABILIDAD: SQL Injection en perfil
$sql = "SELECT * FROM usuarios WHERE id = $user_id";
$result = $conn->query($sql);
$user = $result->fetch_assoc();

// VULNERABILIDAD: XSS posible en datos mostrados
$username = $user['username'];
$email = $user['email'];
$password_display = $user['password']; // ¡PELIGRO! Mostrar contraseña

// VULNERABILIDAD: Consulta sin sanitizar para búsqueda
if (isset($_GET['search'])) {
    $search_term = $_GET['search'];
    $search_sql = "SELECT * FROM usuarios WHERE username LIKE '%$search_term%' OR email LIKE '%$search_term%'";
    $search_result = $conn->query($search_sql);
}

$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Perfil Vulnerable</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .profile-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
        }
        .user-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
            font-size: 14px;
        }
        .info-value {
            color: #212529;
            font-size: 16px;
            margin-top: 5px;
        }
        .danger {
            color: #dc3545;
            font-weight: bold;
        }
        .vuln-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .search-form {
            background: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        input[type="text"] {
            padding: 10px;
            width: 300px;
            border: 1px solid #ced4da;
            border-radius: 5px;
        }
        button {
            padding: 10px 20px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background: #5a6268;
        }
        .logout-btn {
            background: #dc3545;
            padding: 8px 15px;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
        }
        .logout-btn:hover {
            background: #c82333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>👤 Perfil del Usuario (VULNERABLE)</h2>
        
        <div class="profile-card">
            <h3>Información Personal</h3>
            <div class="user-info">
                <div class="info-item">
                    <div class="info-label">ID de Usuario:</div>
                    <div class="info-value"><?php echo $user['id']; ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Nombre de Usuario:</div>
                    <div class="info-value"><?php echo htmlspecialchars($username); ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email:</div>
                    <div class="info-value"><?php echo htmlspecialchars($email); ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contraseña (¡TEXTO PLANO!):</div>
                    <div class="info-value danger"><?php echo htmlspecialchars($password_display); ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha de Registro:</div>
                    <div class="info-value"><?php echo $user['created_at']; ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Último Login:</div>
                    <div class="info-value"><?php echo $user['last_login'] ?? 'Nunca'; ?></div>
                </div>
            </div>
        </div>
        
        <div class="search-form">
            <h3>🔍 Buscar Usuarios (VULNERABLE a SQLi)</h3>
            <form method="GET">
                <input type="text" name="search" placeholder="Buscar por usuario o email..." 
                       value="<?php echo isset($_GET['search']) ? htmlspecialchars($_GET['search']) : ''; ?>">
                <button type="submit">Buscar</button>
            </form>
            
            <?php if (isset($search_result) && $search_result->num_rows > 0): ?>
                <h4>Resultados de búsqueda:</h4>
                <ul>
                    <?php while($row = $search_result->fetch_assoc()): ?>
                        <li><?php echo htmlspecialchars($row['username']); ?> - <?php echo htmlspecialchars($row['email']); ?></li>
                    <?php endwhile; ?>
                </ul>
            <?php elseif (isset($_GET['search'])): ?>
                <p>No se encontraron resultados para: <?php echo htmlspecialchars($_GET['search']); ?></p>
            <?php endif; ?>
        </div>
        
        <div class="vuln-section">
            <h4>⚠️ VULNERABILIDADES EN ESTA PÁGINA:</h4>
            <ul>
                <li>Muestra contraseñas en texto plano</li>
                <li>Búsqueda vulnerable a SQL Injection</li>
                <li>Autenticación por cookie no segura</li>
                <li>Posible XSS en datos mostrados</li>
                <li>Información sensible expuesta</li>
            </ul>
        </div>
        
        <div class="vuln-section">
            <h4>🔍 Pruebas de SQL Injection:</h4>
            <p>En la búsqueda, prueba estos payloads:</p>
            <ul>
                <li><code>' OR '1'='1</code> - Ver todos los usuarios</li>
                <li><code>admin' -- </code> - Comentar resto de query</li>
                <li><code>'; DROP TABLE usuarios; -- </code> - Eliminar tabla (¡CUIDADO!)</li>
            </ul>
        </div>
        
        <a href="logout.php" class="logout-btn">Cerrar Sesión</a>
        <a href="../index.html" style="margin-left: 10px; color: #6c757d;">← Volver al inicio</a>
    </div>
</body>
</html>
