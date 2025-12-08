const express = require('express');
const app = express();
const port = 3000;

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

// Servir archivos estáticos
app.use(express.static('public'));

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
            server: 'Sistema Bancario Vulnerable v2.0',
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
            app: 'Sistema Bancario Vulnerable v2.0',
            version: '2.0.0-semestral',
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
            public: ['/', '/search', '/api/users', '/debug', '/health'],
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
                'Tokens predecibles'
            ],
            recommendations: [
                'Implementar sanitización de inputs',
                'Usar variables de entorno para secrets',
                'Configurar CORS adecuadamente',
                'Agregar autenticación JWT',
                'Ocultar información de debug',
                'Usar HTTPS en producción'
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
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            api: 'operational',
            database: 'connected (simulado)',
            memory: 'healthy',
            security: 'VULNERABLE - intencional'
        }
    });
});

// Ruta principal redirige a la página
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 SISTEMA BANCARIO VULNERABLE v2.0`);
    console.log(`========================================`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log(`📊 Health: http://localhost:${port}/health`);
    console.log(`\n🔓 ENDPOINTS VULNERABLES:`);
    console.log(`   • http://localhost:${port}/`);
    console.log(`   • http://localhost:${port}/search?q=<script>alert('xss')</script>`);
    console.log(`   • http://localhost:${port}/api/users`);
    console.log(`   • http://localhost:${port}/debug`);
    console.log(`   • http://localhost:${port}/api/user/1`);
    console.log(`\n🎯 VULNERABILIDADES IMPLEMENTADAS:`);
    console.log(`   1. XSS (Cross-Site Scripting)`);
    console.log(`   2. Credenciales hardcodeadas`);
    console.log(`   3. CORS demasiado permisivo`);
    console.log(`   4. Exposición de datos sin autenticación`);
    console.log(`   5. SQL Injection simulada`);
    console.log(`   6. Información de debug expuesta`);
    console.log(`   7. Logs con datos sensibles`);
    console.log(`\n🔍 Este sistema será analizado por SonarQube automáticamente`);
    console.log(`========================================\n`);
});
