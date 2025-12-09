<?php
$host = 'localhost';
$user = 'vuln_user';
$pass = 'WeakPass123!';
$db = 'vulnerable_auth';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("❌ Error conexión: " . $conn->connect_error);
} else {
    echo "✅ Conexión exitosa a MySQL!\n";
    
    // Probar consulta
    $result = $conn->query("SELECT username, email, password FROM usuarios");
    
    if ($result && $result->num_rows > 0) {
        echo "📊 Usuarios en la base de datos:\n";
        while ($row = $result->fetch_assoc()) {
            echo "👤 {$row['username']} | 📧 {$row['email']} | 🔓 {$row['password']}\n";
        }
    } else {
        echo "⚠️ No se encontraron usuarios\n";
    }
    
    $conn->close();
}
?>
