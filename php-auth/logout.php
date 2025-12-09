<?php
require_once 'config.php';

// VULNERABILIDAD: Manejo de sesión inseguro
$_SESSION = array();

// VULNERABILIDAD: No destruye sesión completamente
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();

// VULNERABILIDAD: Cookie no eliminada correctamente
setcookie('user_auth', '', time() - 3600, '/');

echo "<script>
    alert('Sesión cerrada');
    window.location.href = 'login.php';
</script>";
?>
