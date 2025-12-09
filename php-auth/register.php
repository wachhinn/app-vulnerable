<?php
require_once 'config.php';
// Iniciar sesión usando nuestra función
startInsecureSession();

$error = '';

// VULNERABILIDAD 8: Sin token CSRF
// VULNERABILIDAD 9: Método GET aceptado para datos sensibles
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Obtener datos SIN sanitizar (VULNERABILIDAD 10)
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
} elseif (isset($_GET['register']) && isset($_GET['username']) && isset($_GET['email']) && isset($_GET['password'])) {
    
    // VULNERABILIDAD: Acepta GET para registro
    $username = $_GET['username'];
    $email = $_GET['email'];
    $password = $_GET['password'];
    
    logActivity("REGISTRO POR GET: $username | Email: $email");
}

// Solo procesar si hay datos
if (isset($username) && isset($email) && isset($password)) {
    // VULNERABILIDAD 11: Validación mínima
    if (empty($username) || empty($email) || empty($password)) {
        $error = "Todos los campos son requeridos";
    } else {
        $conn = connectDB();
        
        // VULNERABILIDAD 12: SQL Injection directa
        $sql = "INSERT INTO usuarios (username, email, password) 
                VALUES ('$username', '$email', '$password')";
        
        if ($conn->query($sql) === TRUE) {
            $_SESSION['user_id'] = $conn->insert_id;
            $_SESSION['username'] = $username;
            $_SESSION['email'] = $email;
            $_SESSION['logged_in'] = true;
            
            // VULNERABILIDAD 13: Log con datos sensibles
            logActivity("NUEVO USUARIO: $username | Email: $email | Password: $password | IP: " . $_SERVER['REMOTE_ADDR']);
            
            // VULNERABILIDAD 14: Cookie insegura
            setcookie('user_auth', $username, time() + 86400, '/', '', false, false);
            
            echo "<script>
                alert('✅ Registro exitoso (pero INSECURO!)');
                window.location.href = 'profile.php';
            </script>";
            exit;
        } else {
            // VULNERABILIDAD 15: Error SQL expuesto
            $error = "Error: " . $conn->error;
        }
        
        $conn->close();
    }
}

// Mostrar formulario
?>
<!DOCTYPE html>
<html>
<head>
    <title>Registro Vulnerable</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            max-width: 500px;
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
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background: #5a67d8;
        }
        .vuln {
            background: #ffe6e6;
            padding: 15px;
            margin: 15px 0;
            border-left: 5px solid red;
            border-radius: 5px;
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
        .get-register {
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>📝 Registro (PHP Vulnerable)</h2>
        
        <?php if (!empty($error)): ?>
            <div class="message error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="username">Usuario:</label>
                <input type="text" name="username" placeholder="Usuario" required 
                       value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" name="email" placeholder="Email" required 
                       value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" name="password" placeholder="Contraseña" required>
            </div>
            
            <button type="submit">Registrarse</button>
        </form>
        
        <div class="get-register">
            <p><strong>⚠️ REGISTRO POR GET (VULNERABLE):</strong></p>
            <p>Prueba esta URL:</p>
            <code style="font-size: 11px;">
                /php/register.php?register=1&username=test&email=test@test.com&password=123
            </code>
        </div>
        
        <div class="vuln">
            <h3>⚠️ VULNERABILIDADES EN ESTE FORMULARIO:</h3>
            <ol>
                <li>SQL Injection en query</li>
                <li>Passwords en plain text</li>
                <li>Sin sanitización de inputs</li>
                <li>Logs con datos sensibles</li>
                <li>Cookies inseguras</li>
                <li>Acepta GET para registro</li>
            </ol>
        </div>
        
        <div class="vuln">
            <h4>🔍 Ejemplos para probar:</h4>
            <p><strong>SQL Injection:</strong> <code>test' OR '1'='1</code></p>
            <p><strong>XSS en username:</strong> <code>&lt;script&gt;alert('xss')&lt;/script&gt;</code></p>
        </div>
        
        <p style="text-align:center; margin-top:20px;">
            <a href="login.php">¿Ya tienes cuenta? Inicia sesión</a>
        </p>
    </div>
</body>
</html>
