<?php
require_once 'config.php';
session_start();

// VULNERABILIDAD 26: XSS directo
$query = isset($_GET['q']) ? $_GET['q'] : '';

echo "<h1>🔍 Resultados para: " . $query . "</h1>";

if (!empty($query)) {
    $conn = connectDB();
    
    // VULNERABILIDAD 27: SQL Injection en búsqueda
    $sql = "SELECT * FROM usuarios WHERE username LIKE '%$query%' OR email LIKE '%$query%'";
    
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        echo "<table border='1'><tr><th>ID</th><th>Usuario</th><th>Email</th><th>Password</th></tr>";
        
        while ($row = $result->fetch_assoc()) {
            // VULNERABILIDAD 28: XSS en output
            echo "<tr>
                <td>" . $row['id'] . "</td>
                <td>" . $row['username'] . "</td>
                <td>" . $row['email'] . "</td>
                <td><code>" . $row['password'] . "</code></td>
            </tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p>No se encontraron resultados</p>";
    }
    
    $conn->close();
}

echo '<br><a href="../index.html">← Volver</a>';
?>
