-- Ejecutar en MySQL: sudo mysql < database.sql
CREATE DATABASE IF NOT EXISTS vulnerable_auth;
USE vulnerable_auth;

-- Tabla usuarios VULNERABLE (passwords en plain text)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL, -- ⚠️ SIN HASH!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos de prueba VULNERABLES
INSERT INTO usuarios (username, email, password) VALUES
('admin', 'admin@vulnerable.com', 'Admin123!'),     -- ⚠️ Password expuesto
('testuser', 'test@email.com', 'TestPassword456'),   -- ⚠️ Password expuesto
('hacker', 'hacker@demo.com', '\' OR \'1\'=\'1');    -- ⚠️ Ejemplo SQLi

-- Tabla logs VULNERABLE (sin sanitización)
CREATE TABLE user_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action TEXT,  -- ⚠️ Podría tener XSS
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
