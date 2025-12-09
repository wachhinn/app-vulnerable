<?php
require_once 'config.php';
// Iniciar sesión usando nuestra función
startInsecureSession();

// VULNERABILIDAD: Sin protección contra fuerza bruta
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener datos del formulario POST
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // VULNERABILIDAD: También acepta GET para login (INSEGURO)
} elseif (isset($_GET['login']) && isset($_GET['username']) && isset($_GET['password'])) {
    $username = $_GET['username'];
    $password = $_GET['password'];
    
    // VULNERABILIDAD: Log de login por GET
    logActivity("LOGIN POR GET (INSEGURO): $username | IP: " . $_SERVER['REMOTE_ADDR']);
}

// Solo procesar si hay datos
if (isset($username) && isset($password)) {
    if (empty($username) || empty($password)) {
        $error = "Usuario y contraseña requeridos";
    } else {
        $conn = connectDB();
        
        // VULNERABILIDAD: SQL Injection directa (¡NO usa prepared statements!)
        $sql = "SELECT * FROM usuarios WHERE username = '$username' AND password = '$password'";
        
        // VULNERABILIDAD: Log con credenciales
        logActivity("INTENTO LOGIN: $username / $password | IP: " . $_SERVER['REMOTE_ADDR']);
        
        $result = $conn->query($sql);
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            
            // VULNERABILIDAD: Sesión insegura
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['logged_in'] = true;
            
            // VULNERABILIDAD: Cookie insegura
            setcookie('user_auth', $username, time() + 86400, '/', '', false, false);
            
            // VULNERABILIDAD: Log de éxito con datos
            logActivity("LOGIN EXITOSO: $username | ID: " . $user['id']);
            
            echo "<script>
                alert('✅ Login exitoso (pero INSECURO!)');
                window.location.href = 'profile.php';
            </script>";
            exit;
        } else {
            $error = "Credenciales incorrectas";
            
            // VULNERABILIDAD: Revela si usuario existe
            $check_user = $conn->query("SELECT id FROM usuarios WHERE username = '$username'");
            if ($check_user->num_rows === 0) {
                $error = "Usuario no existe";
            }
        }
        
        $conn->close();
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Login Vulnerable</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #f5576c;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background: #e74c3c;
        }
        .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .vuln-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            margin: 10px 0;
            border-left: 5px solid #ffc107;
        }
        .test-creds {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            margin: 10px 0;
            border-left: 5px solid #17a2b8;
        }
        .get-login {
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>🔓 Login Vulnerable</h2>
        
        <?php if (!empty($error)): ?>
            <div class="message error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="username">Usuario:</label>
                <input type="text" id="username" name="username" required 
                       value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit">Iniciar Sesión</button>
        </form>
        
        <div class="get-login">
            <p><strong>⚠️ LOGIN POR GET (VULNERABLE):</strong></p>
            <p>Prueba esta URL:</p>
            <code style="font-size: 11px;">
                /php/login.php?login=1&username=admin&password=Admin123!
            </code>
        </div>
        
        <p style="text-align:center; margin-top:15px;">
            <a href="register.php">¿No tienes cuenta? Regístrate</a>
        </p>
        
        <div class="test-creds">
            <h4>🧪 Credenciales de prueba:</h4>
            <p><strong>Usuario normal:</strong> admin</p>
            <p><strong>Contraseña:</strong> Admin123!</p>
            <hr>
            <p><strong>SQL Injection:</strong></p>
            <p>Usuario: <code>hacker</code></p>
            <p>Contraseña: <code>' OR '1'='1</code></p>
            <p><small>¡Este payload explota la vulnerabilidad SQLi!</small></p>
        </div>
        
        <div class="vuln-info">
            <h4>⚠️ VULNERABILIDADES ACTIVAS:</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
                <li>SQL Injection directa en query</li>
                <li>Contraseñas en texto plano</li>
                <li>Logs con credenciales</li>
                <li>Cookies inseguras</li>
                <li>Revela existencia de usuarios</li>
                <li>Acepta GET para login</li>
                <li>Sin protección contra fuerza bruta</li>
            </ul>
        </div>
    </div>
</body>
</html>

