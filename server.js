const express = require('express');
const app = express();
const port = 3000;
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ====================
// VULNERABILIDADES INTENCIONALES
// ====================

// VULNERABILIDAD 1: CORS demasiado permisivo
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});

// Servir archivos estáticos desde public/
app.use(express.static('public'));

// Debug: Mostrar estructura de archivos al iniciar
console.log('\n📁 ESTRUCTURA DE ARCHIVOS:');
console.log('📁 Directorio actual:', __dirname);
console.log('📁 Contenido de public/:');
if (fs.existsSync(path.join(__dirname, 'public'))) {
    fs.readdirSync(path.join(__dirname, 'public')).forEach(file => {
        console.log('   -', file);
    });
} else {
    console.log('   ❌ Carpeta public/ no existe');
}

// Verificar si index.html existe
const indexPath = path.join(__dirname, 'public', 'index.html');
console.log('📄 Ruta de index.html:', indexPath);
console.log('📄 index.html existe:', fs.existsSync(indexPath));

// ====================
// NUEVO: SERVIR ARCHIVOS PHP (VULNERABILIDAD ADICIONAL)
// ====================

// Middleware para procesar formularios PHP
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para servir archivos PHP estáticos (imágenes, CSS, etc.)
app.use('/php-assets', express.static('php-auth'));

// Servir archivos PHP ejecutables
app.get('/php/:file?', (req, res) => {
    const phpFile = req.params.file || 'index.php';
    const phpDir = path.join(__dirname, 'php-auth');
    const phpPath = path.join(phpDir, phpFile);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(phpPath)) {
        // Listar archivos PHP disponibles
        fs.readdir(phpDir, (err, files) => {
            if (err) {
                return res.status(500).send('Error leyendo directorio PHP');
            }
            
            const phpFiles = files.filter(f => f.endsWith('.php'));
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Archivos PHP Disponibles</title>
                    <style>
                        body { font-family: Arial; padding: 20px; }
                        .menu { background: #f5f5f5; padding: 20px; border-radius: 10px; }
                        ul { list-style: none; padding: 0; }
                        li { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
                        a { text-decoration: none; color: #0066cc; font-weight: bold; }
                        a:hover { color: #003366; }
                    </style>
                </head>
                <body>
                    <div class="menu">
                        <h1>🔓 Archivos PHP Vulnerables</h1>
                        <p>Selecciona un archivo:</p>
                        <ul>
                            ${phpFiles.map(file => 
                                `<li><a href="/php/${file}">${file}</a></li>`
                            ).join('')}
                        </ul>
                        <br>
                        <a href="/">← Volver a la aplicación principal</a>
                    </div>
                </body>
                </html>
            `;
            res.send(html);
        });
        return;
    }
    
    // Ejecutar el archivo PHP
    exec(`php ${phpPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error ejecutando PHP: ${error}`);
            return res.status(500).send(`
                <h1>Error PHP</h1>
                <pre>${stderr}</pre>
                <a href="/php/">Volver al menú PHP</a>
            `);
        }
        
        // Enviar resultado con estilos integrados
        const output = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>PHP: ${phpFile}</title>
                <style>
                    body { font-family: Arial; padding: 20px; margin: 0; }
                    .php-header { 
                        background: #4a5568; 
                        color: white; 
                        padding: 15px 20px; 
                        margin: -20px -20px 20px -20px;
                    }
                    .php-content { 
                        background: #f7fafc; 
                        padding: 20px; 
                        border-radius: 8px; 
                        border: 1px solid #e2e8f0;
                    }
                    .back-link { 
                        display: inline-block; 
                        margin-top: 20px; 
                        padding: 10px 15px; 
                        background: #4299e1; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 5px;
                    }
                    .back-link:hover { background: #3182ce; }
                </style>
            </head>
            <body>
                <div class="php-header">
                    <h2>🔓 ${phpFile} (PHP Vulnerable)</h2>
                    <p>Archivo ejecutado desde: ${phpPath}</p>
                </div>
                <div class="php-content">
                    ${stdout}
                </div>
                <a class="back-link" href="/php/">← Ver todos los archivos PHP</a>
                <a class="back-link" href="/" style="background: #48bb78; margin-left: 10px;">🏠 Ir a la app principal</a>
            </body>
            </html>
        `;
        res.send(output);
    });
});

// Manejar POST a archivos PHP
app.post('/php/:file?', (req, res) => {
    const phpFile = req.params.file || 'index.php';
    const phpPath = path.join(__dirname, 'php-auth', phpFile);
    
    if (!fs.existsSync(phpPath)) {
        return res.status(404).send('Archivo PHP no encontrado');
    }
    
    // Crear variables de entorno para los datos POST
    let envVars = '';
    for (const [key, value] of Object.entries(req.body)) {
        envVars += `REQUEST_${key.toUpperCase()}="${value}" `;
    }
    
    // Agregar headers como variables de entorno
    envVars += `REQUEST_METHOD=POST `;
    envVars += `CONTENT_TYPE=${req.headers['content-type'] || 'application/x-www-form-urlencoded'} `;
    
    exec(`${envVars} php ${phpPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error ejecutando PHP (POST): ${error}`);
            return res.status(500).send(`
                <h1>Error PHP</h1>
                <pre>${stderr}</pre>
                <a href="/php/${phpFile}">Volver</a>
            `);
        }
        res.send(stdout);
    });
});

// VULNERABILIDAD 2: XSS potencial (sin sanitización)
app.get('/search', (req, res) => {
    const query = req.query.q || '';
    // ¡PELIGRO! Sin sanitización - XSS intencional
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resultados de Búsqueda</title>
            <style>body { font-family: Arial; padding: 20px; }</style>
        </head>
        <body>
            <h1>🔍 Resultados de Búsqueda</h1>
            <div style="background:#ffe6e6;padding:20px;border-radius:10px;">
                <h3>Consulta: ${query}</h3>
                <p><strong>⚠️ VULNERABILIDAD XSS DEMOSTRADA</strong></p>
                <p>Este endpoint no sanitiza la entrada del usuario.</p>
                <p>Ejemplo malicioso: <code>&lt;script&gt;alert('Hacked')&lt;/script&gt;</code></p>
            </div>
            <br>
            <a href="/" style="padding:10px 20px;background:#667eea;color:white;text-decoration:none;border-radius:5px;">
                ← Volver al inicio
            </a>
            <br><br>
            <div style="font-size:12px;color:#666;">
                <strong>DEBUG:</strong> Query recibida: "${query}"<br>
                <strong>TIP:</strong> SonarQube detectará esta vulnerabilidad como XSS potencial
            </div>
        </body>
        </html>
    `);
});

// VULNERABILIDAD 3: API sin autenticación con datos sensibles
app.get('/api/users', (req, res) => {
    const users = [
        { 
            id: 1, 
            name: 'Administrador', 
            email: 'admin@sistemabancario.com', 
            password: 'admin123',  // ¡PELIGRO! Contraseña expuesta
            role: 'admin',
            balance: 99999.99,
            lastLogin: '2024-12-07T10:30:00Z',
            securityQuestion: 'nombre_mascota',
            securityAnswer: 'firulais'  // ¡PELIGRO! Respuesta expuesta
        },
        { 
            id: 2, 
            name: 'Juan Pérez', 
            email: 'juan.perez@email.com', 
            password: 'Passw0rd!',  // ¡PELIGRO! Contraseña expuesta
            role: 'user',
            balance: 5420.50,
            accountNumber: 'ACC-789456123',
            phone: '+1234567890'
        },
        { 
            id: 3, 
            name: 'María González', 
            email: 'maria.g@empresa.com', 
            password: 'Maria2024*',  // ¡PELIGRO! Contraseña expuesta
            role: 'premium_user',
            balance: 12500.00,
            creditCard: '**** **** **** 1234',  // Info sensible
            creditLimit: 5000
        }
    ];
    res.json({
        success: true,
        message: 'Datos de usuarios (¡EXPUESTOS SIN AUTENTICACIÓN!)',
        warning: 'VULNERABILIDAD: Este endpoint no requiere autenticación',
        totalUsers: users.length,
        users: users,
        debug: {
            timestamp: new Date().toISOString(),
            server: 'Sistema Bancario Vulnerable v3.0',
            vulnerability: 'Exposición de datos sensibles sin autenticación'
        }
    });
});

// VULNERABILIDAD 4: Login inseguro
app.post('/api/login', express.json(), (req, res) => {
    const { username, password } = req.body;
    
    // ¡PELIGRO! Log de credenciales en consola
    console.log(`🔓 INTENTO DE LOGIN (INSECURO): ${username} / ${password}`);
    console.log(`📝 IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
    
    // Validación simple (insegura)
    const validUsers = {
        'admin': 'admin123',
        'user': 'password123',
        'guest': 'guest123'
    };
    
    if (validUsers[username] === password) {
        // ¡PELIGRO! Token débil
        const weakToken = 'jwt_' + Date.now() + '_' + Math.random().toString(36).substr(2);
        
        res.json({
            success: true,
            message: 'Login exitoso (pero INSECURO)',
            token: weakToken,
            user: {
                username: username,
                role: username === 'admin' ? 'administrator' : 'user',
                permissions: ['read', 'write', 'delete']
            },
            securityWarning: 'Este token no está firmado correctamente y es predecible'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas',
            hint: 'Intenta con: admin/admin123'
        });
    }
});

// VULNERABILIDAD 5: Información de debug expuesta
app.get('/debug', (req, res) => {
    res.json({
        // Información de sistema
        system: {
            app: 'Sistema Bancario Vulnerable v3.0',
            version: '3.0.0-semestral',
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        },
        
        // ¡PELIGRO! Secrets expuestos
        secrets: {
            database: {
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'postgres_password_123',  // ¡EXPUESTO!
                database: 'banking_system'
            },
            api: {
                stripeKey: 'sk_live_1234567890abcdef',
                twilioSid: 'AC1234567890abcdef',
                twilioToken: 'abc123def456',  // ¡EXPUESTO!
                sendgridKey: 'SG.1234567890.abcdef'
            },
            encryption: {
                algorithm: 'aes-256-cbc',
                key: 'super_secret_encryption_key_123456',  // ¡EXPUESTO!
                iv: 'initial_vector_123'
            }
        },
        
        // Configuración de la aplicación
        config: {
            environment: process.env.NODE_ENV || 'development',
            port: port,
            sessionSecret: 'insecure_session_secret_123',  // ¡EXPUESTO!
            cookieName: 'vulnerable_session',
            debugMode: true,
            logLevel: 'verbose'
        },
        
        // Información de servidor
        server: {
            hostname: require('os').hostname(),
            cpus: require('os').cpus().length,
            totalMemory: require('os').totalmem(),
            freeMemory: require('os').freemem(),
            loadAverage: require('os').loadavg()
        },
        
        // Endpoints disponibles
        endpoints: {
            public: ['/', '/search', '/api/users', '/debug', '/health', '/php/*'],
            private: ['/api/login', '/api/transfer', '/api/balance'],
            admin: ['/api/admin/users', '/api/admin/logs']
        },
        
        // Información de seguridad (irónicamente expuesta)
        security: {
            vulnerabilities: [
                'XSS en endpoint /search',
                'Credenciales hardcodeadas',
                'CORS demasiado permisivo',
                'API sin autenticación',
                'Secrets en código',
                'Debug info expuesta',
                'Tokens predecibles',
                'Ejecución PHP dinámica sin validación',
                'NUEVO: JWT Secret Hardcodeado',
                'NUEVO: Path Traversal',
                'NUEVO: CSRF sin tokens',
                'NUEVO: Leak de Metadatos',
                'NUEVO: Criptografía Débil',
                'NUEVO: Open Redirect'
            ],
            recommendations: [
                'Implementar sanitización de inputs',
                'Usar variables de entorno para secrets',
                'Configurar CORS adecuadamente',
                'Agregar autenticación JWT',
                'Ocultar información de debug',
                'Usar HTTPS en producción',
                'Validar archivos PHP antes de ejecutar'
            ]
        },
        
        metadata: {
            generatedAt: new Date().toISOString(),
            purpose: 'Proyecto Semestral - Demostración de Vulnerabilidades',
            warning: 'ESTA INFORMACIÓN NUNCA DEBE SER EXPUESTA EN PRODUCCIÓN'
        }
    });
});

// VULNERABILIDAD 6: SQL Injection simulada
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    
    // ¡PELIGRO! Simulación de concatenación SQL
    const fakeQuery = `SELECT * FROM usuarios WHERE id = ${userId}`;
    
    res.json({
        vulnerability: 'SQL Injection (simulada)',
        description: 'Este endpoint demuestra concatenación directa de parámetros en consultas SQL',
        maliciousQuery: fakeQuery,
        examples: {
            basicInjection: '1 OR 1=1',
            unionAttack: '1 UNION SELECT username, password FROM users',
            dropTable: '1; DROP TABLE usuarios;',
            commentBypass: "1' OR '1'='1"
        },
        impact: 'Permite ejecutar código SQL arbitrario en la base de datos',
        remediation: 'Usar prepared statements o consultas parametrizadas'
    });
});

// Health check (para CI/CD)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Sistema Bancario Vulnerable',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            api: 'operational',
            database: 'connected (simulado)',
            memory: 'healthy',
            php: 'available',
            security: 'VULNERABLE - intencional'
        }
    });
});

// Ruta principal - SERVIR INDEX.HTML DESDE PUBLIC/
app.get('/', (req, res) => {
    console.log('📍 Ruta / solicitada');
    console.log('📁 Sirviendo desde:', indexPath);
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <h1>Error: Archivo no encontrado</h1>
            <p>index.html no se encuentra en: ${indexPath}</p>
            <p>Contenido de public/:</p>
            <ul>
                ${fs.readdirSync(path.join(__dirname, 'public')).map(f => `<li>${f}</li>`).join('')}
            </ul>
        `);
    }
});

// Ruta para mostrar menú de PHP
app.get('/php-menu', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>PHP Vulnerable Apps</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .header { background: #4a5568; color: white; padding: 20px; border-radius: 10px; }
                .menu { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
                .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .card h3 { margin-top: 0; color: #2d3748; }
                .card a { display: inline-block; margin-top: 10px; padding: 8px 15px; background: #4299e1; color: white; text-decoration: none; border-radius: 5px; }
                .card a:hover { background: #3182ce; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔓 Aplicaciones PHP Vulnerables</h1>
                <p>Integradas con la aplicación Node.js</p>
            </div>
            <div class="menu">
                <div class="card">
                    <h3>🔐 Login PHP</h3>
                    <p>Sistema de autenticación vulnerable con posibles fallos de seguridad</p>
                    <a href="/php/login.php">Abrir Login</a>
                </div>
                <div class="card">
                    <h3>📝 Registro PHP</h3>
                    <p>Formulario de registro con validaciones inseguras</p>
                    <a href="/php/register.php">Abrir Registro</a>
                </div>
                <div class="card">
                    <h3>👤 Perfil PHP</h3>
                    <p>Perfil de usuario con inyecciones potenciales</p>
                    <a href="/php/profile.php">Abrir Perfil</a>
                </div>
                <div class="card">
                    <h3>🔍 Búsqueda PHP</h3>
                    <p>Búsqueda vulnerable a XSS y otras inyecciones</p>
                    <a href="/php/search.php">Abrir Búsqueda</a>
                </div>
            </div>
            <a href="/" style="padding: 10px 20px; background: #48bb78; color: white; text-decoration: none; border-radius: 5px;">
                ← Volver a la aplicación principal
            </a>
        </body>
        </html>
    `);
});

// Manejo de errores para puerto en uso
const server = app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 SISTEMA BANCARIO VULNERABLE v3.0`);
    console.log(`========================================`);
    console.log(`🌐 URL PRINCIPAL: http://localhost:${port}`);
    console.log(`📊 Health Check: http://localhost:${port}/health`);
    console.log(`🔓 Debug Info: http://localhost:${port}/debug`);
    console.log(`\n🔓 ENDPOINTS VULNERABLES:`);
    console.log(`   • http://localhost:${port}/ (Nuevo diseño v3.0)`);
    console.log(`   • http://localhost:${port}/search?q=<script>alert('xss')</script>`);
    console.log(`   • http://localhost:${port}/api/users`);
    console.log(`   • http://localhost:${port}/api/user/1`);
    console.log(`\n🔓 APLICACIONES PHP INTEGRADAS:`);
    console.log(`   • http://localhost:${port}/php-menu`);
    console.log(`   • http://localhost:${port}/php/`);
    console.log(`\n🎯 VULNERABILIDADES IMPLEMENTADAS (15+):`);
    console.log(`   1. XSS (Cross-Site Scripting)`);
    console.log(`   2. Credenciales hardcodeadas`);
    console.log(`   3. CORS demasiado permisivo`);
    console.log(`   4. Exposición de datos sin autenticación`);
    console.log(`   5. SQL Injection simulada`);
    console.log(`   6. Información de debug expuesta`);
    console.log(`   7. Logs con datos sensibles`);
    console.log(`   8. Ejecución PHP dinámica sin validación`);
    console.log(`   9. JWT Secret Hardcodeado`);
    console.log(`   10. Path Traversal`);
    console.log(`   11. CSRF sin tokens`);
    console.log(`   12. Leak de Metadatos`);
    console.log(`   13. Criptografía Débil (MD5)`);
    console.log(`   14. Open Redirect`);
    console.log(`   15. PHP SQL Injection real`);
    console.log(`\n🔍 Este sistema será analizado por SonarQube automáticamente`);
    console.log(`========================================\n`);
});

// Manejar errores de puerto en uso
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Puerto ${port} ya está en uso`);
        console.log(`💡 Solución: Detener el proceso anterior:`);
        console.log(`   lsof -ti:${port} | xargs kill -9`);
        console.log(`   O ejecutar: pkill -f "node server.js"`);
        process.exit(1);
    } else {
        console.error(`\n❌ Error del servidor:`, err);
        process.exit(1);
    }
});

// Manejar cierre limpio
process.on('SIGINT', () => {
    console.log('\n\n🔴 Servidor deteniéndose...');
    server.close(() => {
        console.log('✅ Servidor detenido correctamente');
        process.exit(0);
    });
});
