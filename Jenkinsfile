pipeline {
    agent any
    
    environment {
        SONAR_HOST_URL = 'http://192.168.1.149:9000'
        SONAR_PROJECT_KEY = 'app-vulnerable-${BUILD_NUMBER}'
        APP_PORT = '3000'
        APP_URL = 'http://localhost:${APP_PORT}'
        APP_VERSION = '3.0.0'
    }
    
    stages {
        stage('Clean Workspace & Kill Previous') {
            steps {
                sh '''
                    echo "🧹 Limpiando workspace y procesos anteriores..."
                    
                    # Matar cualquier proceso en puerto 3000
                    echo "🛑 Deteniendo procesos previos en puerto ${APP_PORT}..."
                    fuser -k ${APP_PORT}/tcp 2>/dev/null || true
                    pkill -f "node.*server.js" 2>/dev/null || true
                    pkill -f "npm start" 2>/dev/null || true
                    sleep 3
                    
                    # Limpiar archivos temporales
                    rm -f server.pid server.log demo-urls.txt *.md *.txt 2>/dev/null || true
                '''
            }
        }
        
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/wachhinn/app-vulnerable.git',
                        credentialsId: 'github-token'
                    ]]
                ])
                sh 'echo "✅ Repositorio clonado - Commit: $(git log --oneline -1)"'
            }
        }
        
        stage('Setup Project') {
            steps {
                sh '''
                    echo "=== CONFIGURANDO PROYECTO v${APP_VERSION} ==="
                    
                    # Verificar Node.js
                    if command -v node > /dev/null; then
                        echo "✅ NodeJS: $(node --version)"
                        echo "✅ NPM: $(npm --version)"
                    else
                        echo "❌ NodeJS no encontrado. Instalando..."
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    fi
                    
                    # Verificar PHP para análisis SonarQube
                    if command -v php > /dev/null; then
                        echo "✅ PHP: $(php --version | head -1)"
                    else
                        echo "⚠️  PHP no encontrado (necesario para análisis de archivos PHP)"
                    fi
                    
                    # Instalar dependencias
                    if [ -f package.json ]; then
                        echo "📦 Instalando dependencias Node.js..."
                        npm install || echo "⚠️  npm install continuó con errores"
                    else
                        echo "❌ package.json no encontrado. Creando..."
                        echo '{"name": "app-vulnerable", "version": "3.0.0"}' > package.json
                        npm install express --save
                    fi
                    
                    # Instalar sonar-scanner si no existe
                    if ! command -v sonar-scanner > /dev/null; then
                        echo "📦 Instalando sonar-scanner..."
                        npm install -g sonar-scanner
                    fi
                    
                    echo ""
                    echo "📁 ESTRUCTURA DEL PROYECTO:"
                    echo "========================================"
                    ls -la
                    echo ""
                    echo "📁 Carpeta public/:"
                    ls -la public/ 2>/dev/null || echo "   ❌ No existe public/"
                    echo ""
                    echo "📁 Carpeta php-auth/:"
                    ls -la php-auth/ 2>/dev/null || echo "   ❌ No existe php-auth/"
                    echo ""
                    echo "📄 Archivos principales:"
                    find . -name "*.html" -o -name "*.js" -o -name "*.php" | grep -v node_modules | sort | head -30
                '''
            }
        }
        
        stage('SonarQube Analysis v3.0') {
    steps {
        script {
            echo "=== EJECUTANDO ANÁLISIS SONARQUBE v${APP_VERSION} ==="
            
            withSonarQubeEnv('SonarQube') {
                sh """
                    echo "🔍 Analizando código vulnerable (15+ vulnerabilidades)..."
                    echo "Proyecto: ${SONAR_PROJECT_KEY}"
                    echo "Versión: ${APP_VERSION}"
                    echo "URL SonarQube: ${SONAR_HOST_URL}"
                    echo ""
                    
                    # Crear archivo de configuración SonarQube temporal
                    cat > sonar-project.properties << EOF
# SonarQube Project Configuration
sonar.projectKey=${SONAR_PROJECT_KEY}
sonar.projectName=Sistema Bancario Vulnerable ${BUILD_NUMBER} - v${APP_VERSION}
sonar.projectVersion=${APP_VERSION}
sonar.host.url=${SONAR_HOST_URL}
sonar.sourceEncoding=UTF-8

# Fuentes a analizar (SOLUCIÓN AL ERROR DE DUPLICADO)
sonar.sources=.
sonar.inclusions=public/**,php-auth/**,*.js,*.json

# Exclusiones
sonar.exclusions=node_modules/**,**/*.test.js

# Configuración de lenguajes
sonar.javascript.file.suffixes=.js
sonar.html.file.suffixes=.html,.htm
sonar.php.file.suffixes=.php

# Tests (usamos inclusión para evitar duplicados)
sonar.tests=.
sonar.test.inclusions=**/*.test.js

# Calidad
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300

# SCM
sonar.scm.provider=git
sonar.scm.disabled=false
EOF
                    
                    echo "📄 Configuración SonarQube generada:"
                    cat sonar-project.properties
                    echo ""
                    
                    echo "📂 Estructura que será analizada:"
                    echo "  • public/index.html (HTML principal - 1 vez)"
                    echo "  • php-auth/*.php (8 archivos PHP)"
                    echo "  • *.js (2 archivos JavaScript)"
                    echo "  • *.json (2 archivos JSON)"
                    echo ""
                    
                    # Ejecutar análisis
                    sonar-scanner
                    
                    echo ""
                    echo "✅ Análisis completado exitosamente"
                    echo "📊 Visita: ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
                """
            }
        }
    }
}
        
        stage('Deploy & Live Demo v3.0') {
            steps {
                script {
                    echo "=== DESPLIEGUE EN VIVO v${APP_VERSION} ==="
                    
                    // Matar procesos previos antes de iniciar
                    sh '''
                        echo "🛑 Asegurando que no hay procesos en puerto ${APP_PORT}..."
                        fuser -k ${APP_PORT}/tcp 2>/dev/null || true
                        sleep 2
                    '''
                    
                    // Iniciar servidor con manejo de errores
                    sh '''
                        echo "🚀 Iniciando SISTEMA BANCARIO VULNERABLE v${APP_VERSION}..."
                        
                        # Iniciar servidor en background
                        nohup npm start > server.log 2>&1 &
                        SERVER_PID=$!
                        echo "PID del servidor: $SERVER_PID"
                        echo $SERVER_PID > server.pid
                        
                        # Esperar con verificación progresiva
                        echo "⏳ Esperando que el servidor inicie (máximo 30s)..."
                        for i in {1..30}; do
                            if curl -s -f "http://localhost:${APP_PORT}/health" > /dev/null 2>&1; then
                                echo "✅ Servidor activo después de ${i}s"
                                break
                            fi
                            
                            if [ $i -eq 30 ]; then
                                echo "❌ Timeout: Servidor no respondió después de 30s"
                                echo "📄 Últimos logs:"
                                tail -50 server.log
                                exit 1
                            fi
                            
                            sleep 1
                        done
                        
                        # Verificar contenido principal
                        echo "🔍 Verificando página principal..."
                        if curl -s "http://localhost:${APP_PORT}/" | grep -q "SISTEMA BANCARIO VULNERABLE"; then
                            echo "✅ Página principal cargada correctamente"
                        else
                            echo "⚠️  Página principal podría no ser la versión 3.0"
                        fi
                    '''
                    
                    // Mostrar información de demo
                    sh '''
                        echo ""
                        echo "========================================"
                        echo "🌐 SISTEMA BANCARIO VULNERABLE v${APP_VERSION}"
                        echo "========================================"
                        echo "✅ Página web FUNCIONANDO en: http://localhost:${APP_PORT}"
                        echo "📊 Health Check: http://localhost:${APP_PORT}/health"
                        echo "🔓 Debug Info: http://localhost:${APP_PORT}/debug"
                        echo ""
                        echo "🎯 15+ VULNERABILIDADES IMPLEMENTADAS:"
                        echo "========================================"
                        echo "1. 🔴 XSS (Cross-Site Scripting)"
                        echo "2. 🔴 Credenciales Hardcodeadas"
                        echo "3. 🔴 CORS demasiado permisivo"
                        echo "4. 🔴 Exposición de datos sin autenticación"
                        echo "5. 🔴 SQL Injection simulada"
                        echo "6. 🔴 Información de debug expuesta"
                        echo "7. 🔴 JWT Secret Hardcodeado"
                        echo "8. 🔴 Path Traversal"
                        echo "9. 🔴 CSRF sin tokens"
                        echo "10. 🔴 Leak de Metadatos"
                        echo "11. 🔴 Criptografía Débil (MD5)"
                        echo "12. 🔴 Open Redirect"
                        echo "13. 🔴 PHP SQL Injection real"
                        echo "14. 🔴 File Upload sin validación"
                        echo "15. 🔴 RCE (Remote Code Execution)"
                        echo ""
                        echo "🔓 DEMOSTRACIÓN EN VIVO - ACCESOS:"
                        echo "========================================"
                        echo ""
                        echo "📱 PÁGINA PRINCIPAL (NUEVO DISEÑO):"
                        echo "   http://localhost:${APP_PORT}/"
                        echo ""
                        echo "🐘 APLICACIONES PHP VULNERABLES:"
                        echo "   http://localhost:${APP_PORT}/php-menu"
                        echo ""
                        echo "🔍 PRUEBAS ESPECÍFICAS:"
                        echo "   1. XSS: http://localhost:${APP_PORT}/search?q=<script>alert('v3.0')</script>"
                        echo "   2. Datos expuestos: http://localhost:${APP_PORT}/api/users"
                        echo "   3. Debug: http://localhost:${APP_PORT}/debug"
                        echo "   4. PHP: http://localhost:${APP_PORT}/php/login.php"
                        echo ""
                        echo "🔍 SONARQUBE DETECTARÁ TODAS ESTAS VULNERABILIDADES"
                        echo "   ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
                        echo "========================================"
                        
                        # Crear archivo de demostración actualizado
                        cat > demo-urls-v${APP_VERSION}.txt << URLS
🌐 SISTEMA BANCARIO VULNERABLE v${APP_VERSION}
========================================

📊 BUILD: ${BUILD_NUMBER}
🕐 HORA INICIO: $(date)
🔗 SONARQUBE: ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}

🎯 15+ VULNERABILIDADES IMPLEMENTADAS:

🔴 CRÍTICAS (10):
   1. XSS en /search
   2. Credenciales hardcodeadas en JS
   3. CORS demasiado permisivo
   4. API sin autenticación (/api/users)
   5. Secrets expuestos (/debug)
   6. JWT Secret Hardcodeado
   7. Path Traversal
   8. CSRF sin tokens
   9. PHP SQL Injection real
   10. File Upload sin validación

🟡 MEDIAS (5):
   11. Leak de Metadatos
   12. Criptografía Débil (MD5)
   13. Open Redirect
   14. RCE (Remote Code Execution)
   15. SQL Injection simulada

🔗 URLS PARA DEMOSTRACIÓN:

1. PÁGINA PRINCIPAL (Nuevo diseño):
   http://localhost:${APP_PORT}/

2. VULNERABILIDADES NUEVAS:
   • JWT: http://localhost:${APP_PORT}/#vulnerabilities
   • CSRF: http://localhost:${APP_PORT}/#vulnerabilities
   • Path Traversal: http://localhost:${APP_PORT}/#vulnerabilities

3. PHP VULNERABLE:
   • Login: http://localhost:${APP_PORT}/php/login.php
   • Registro: http://localhost:${APP_PORT}/php/register.php
   • SQLi: Usuario: hacker | Pass: ' OR '1'='1

4. ENDPOINTS CLÁSICOS:
   • XSS: http://localhost:${APP_PORT}/search?q=<script>alert('XSS_v3')</script>
   • Datos: http://localhost:${APP_PORT}/api/users
   • Debug: http://localhost:${APP_PORT}/debug

📊 PARA PRESENTACIÓN:
1. Muestra nuevo diseño v3.0
2. Demuestra 3 vulnerabilidades nuevas
3. Muestra SonarQube con 15+ hallazgos
4. Explica CI/CD completo
5. Haz cambio en vivo y muestra análisis automático

⚠️  ADVERTENCIA: Vulnerabilidades intencionales para proyecto semestral
URLS
                        
                        echo "✅ Archivo demo-urls-v${APP_VERSION}.txt creado"
                    '''
                    
                    // Mantener servidor activo
                    sh '''
                        echo ""
                        echo "⏰ Manteniendo servidor activo por 5 minutos para demostración..."
                        echo "   (Se detendrá automáticamente después del pipeline)"
                        echo ""
                        echo "📝 Logs del servidor (últimas 10 líneas):"
                        tail -10 server.log
                        
                        # Mantener activo mientras se generan reportes
                        sleep 60
                    '''
                }
            }
        }
        
        stage('Security Report v3.0') {
            steps {
                sh '''
                    echo "=== GENERANDO REPORTE DE SEGURIDAD v${APP_VERSION} ==="
                    
                    echo "🔎 Buscando vulnerabilidades en código (15+ tipos)..."
                    
                    echo "1. Buscando patrones XSS..."
                    find . -name "*.html" -o -name "*.js" -o -name "*.php" | grep -v node_modules | xargs grep -l "innerHTML\\|document.write\\|eval(\\|innerText.*=" 2>/dev/null > xss-findings.txt || echo "No se encontraron patrones XSS"
                    
                    echo "2. Buscando credenciales y secrets..."
                    find . -name "*.js" -o -name "*.json" -o -name "*.php" -o -name "*.html" | grep -v node_modules | xargs grep -i "password\\|secret\\|key\\|token\\|api_key\\|jwt\\|md5\\|sha1" 2>/dev/null > credentials-findings.txt || echo "No se encontraron credenciales"
                    
                    echo "3. Buscando vulnerabilidades de seguridad..."
                    find . -name "*.js" -o -name "*.php" | grep -v node_modules | xargs grep -i "exec(\\|system(\\|eval(\\|shell_exec\\|passthru\\|proc_open" 2>/dev/null > rce-findings.txt || echo "No se encontraron RCE"
                    
                    echo "4. Buscando SQL Injection patterns..."
                    find . -name "*.php" -o -name "*.js" | grep -v node_modules | xargs grep -i "mysql_query\\|query.*concat\\|query.*\\$" 2>/dev/null > sqli-findings.txt || echo "No se encontraron SQLi"
                    
                    echo "5. Contando estadísticas..."
                    TOTAL_FILES=$(find . -name "*.js" -o -name "*.html" -o -name "*.php" -o -name "*.json" | grep -v node_modules | wc -l)
                    VULN_FILES=$(find . -name "*.js" -o -name "*.html" -o -name "*.php" -o -name "*.json" | grep -v node_modules | xargs grep -l "password\\|secret\\|innerHTML\\|document.write\\|eval(\\|exec(" 2>/dev/null | wc -l)
                    
                    echo "📊 Estadísticas:"
                    echo "  • Total archivos analizados: ${TOTAL_FILES}"
                    echo "  • Archivos con vulnerabilidades: ${VULN_FILES}"
                    
                    # Crear reporte actualizado
                    cat > security-report-v${APP_VERSION}-${BUILD_NUMBER}.md << REPORT
# 📊 REPORTE DE ANÁLISIS DE SEGURIDAD
## Sistema Bancario Vulnerable v${APP_VERSION}
## Build: ${BUILD_NUMBER}
## Fecha: $(date '+%Y-%m-%d %H:%M:%S')

### 📈 ESTADÍSTICAS
- **Total archivos analizados:** ${TOTAL_FILES}
- **Archivos con vulnerabilidades:** ${VULN_FILES}
- **Tiempo de ejecución:** $(echo ${currentBuild.durationString} | sed 's/ y contando//')
- **Versión:** ${APP_VERSION}

### 🎯 15+ VULNERABILIDADES IMPLEMENTADAS
#### 🔴 CRÍTICAS (10):
1. **XSS (Cross-Site Scripting)** - Endpoint /search sin sanitización
2. **Credenciales Hardcodeadas** - JS, PHP y API
3. **CORS Demasiado Permisivo** - Configuración server.js
4. **Exposición de Datos** - /api/users sin autenticación
5. **Debug Info Expuesta** - /debug endpoint
6. **JWT Secret Hardcodeado** - Secrets en frontend
7. **Path Traversal** - Acceso a archivos del sistema
8. **CSRF sin Tokens** - Formularios sin protección
9. **PHP SQL Injection real** - Login PHP vulnerable
10. **File Upload sin validación** - PHP upload vulnerable

#### 🟡 MEDIAS (5):
11. **SQL Injection Simulada** - /api/user/:id
12. **Leak de Metadatos** - Headers HTTP expuestos
13. **Criptografía Débil** - MD5 y algoritmos obsoletos
14. **Open Redirect** - Redirecciones no validadas
15. **RCE (Remote Code Execution)** - PHP eval() vulnerable

### 🌐 DEMOSTRACIÓN EN VIVO
**Servidor ejecutado en:** http://localhost:${APP_PORT}
**Duración de demostración:** 5 minutos
**Estado:** $(if curl -s -f "http://localhost:${APP_PORT}/health" > /dev/null; then echo "✅ ACTIVO"; else echo "❌ INACTIVO"; fi)

### 🔗 ENLACES IMPORTANTES
- **SonarQube:** ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}
- **Repositorio GitHub:** https://github.com/wachhinn/app-vulnerable
- **Jenkins Build:** ${BUILD_URL}
- **Dashboard SonarQube:** ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}

### 📋 HALLAZGOS DE ANÁLISIS AUTOMÁTICO
#### XSS Detectado ($(wc -l < xss-findings.txt 2>/dev/null || echo 0) hallazgos):
$(if [ -f xss-findings.txt ] && [ -s xss-findings.txt ]; then
  echo "=== INICIO CÓDIGO XSS ==="
  head -15 xss-findings.txt
  echo "=== FIN CÓDIGO XSS ==="
else
  echo "No se encontraron patrones XSS obvios"
fi)

#### Credenciales Detectadas ($(wc -l < credentials-findings.txt 2>/dev/null || echo 0) hallazgos):
$(if [ -f credentials-findings.txt ] && [ -s credentials-findings.txt ]; then
  echo "=== INICIO CREDENCIALES ==="
  head -15 credentials-findings.txt
  echo "=== FIN CREDENCIALES ==="
else
  echo "No se encontraron credenciales hardcodeadas obvias"
fi)

#### RCE Detectado ($(wc -l < rce-findings.txt 2>/dev/null || echo 0) hallazgos):
$(if [ -f rce-findings.txt ] && [ -s rce-findings.txt ]; then
  echo "=== INICIO RCE ==="
  head -10 rce-findings.txt
  echo "=== FIN RCE ==="
else
  echo "No se encontraron patrones RCE obvios"
fi)

#### SQL Injection Detectado ($(wc -l < sqli-findings.txt 2>/dev/null || echo 0) hallazgos):
$(if [ -f sqli-findings.txt ] && [ -s sqli-findings.txt ]; then
  echo "=== INICIO SQLi ==="
  head -10 sqli-findings.txt
  echo "=== FIN SQLi ==="
else
  echo "No se encontraron patrones SQLi obvios"
fi)

### 🚨 RECOMENDACIONES DE SEGURIDAD
1. **Sanitizar todas las entradas** (HTML, JS, PHP)
2. **Usar variables de entorno** para secrets
3. **Implementar autenticación JWT** con tokens firmados
4. **Configurar CORS** específico por origen
5. **Usar prepared statements** en SQL
6. **Validar tipos de archivo** en uploads
7. **Ocultar información de debug** en producción
8. **Usar HTTPS** con certificados válidos
9. **Implementar CSRF tokens** en formularios
10. **Actualizar algoritmos** de cifrado (evitar MD5)

### 📊 PARA PRESENTACIÓN SEMESTRAL
1. **Muestra nuevo diseño v${APP_VERSION}** en http://localhost:${APP_PORT}
2. **Demuestra 3 vulnerabilidades nuevas** (JWT, CSRF, Path Traversal)
3. **Muestra SonarQube** con 15+ hallazgos de seguridad
4. **Explica flujo CI/CD completo** (GitHub → Jenkins → SonarQube → Despliegue)
5. **Haz cambios en tiempo real** y muestra análisis automático

---

*Reporte generado automáticamente por pipeline CI/CD*
*Proyecto Semestral - Seguridad en Aplicaciones Web v${APP_VERSION}*
REPORT
                    
                    echo "✅ Reporte generado: security-report-v${APP_VERSION}-${BUILD_NUMBER}.md"
                    echo ""
                    echo "📄 RESUMEN DEL REPORTE (v${APP_VERSION}):"
                    head -40 security-report-v${APP_VERSION}-${BUILD_NUMBER}.md
                '''
            }
        }
    }
    
    post {
        always {
            echo ""
            echo "========================================"
            echo "🏁 BUILD ${BUILD_NUMBER} (v${APP_VERSION}) FINALIZADO"
            echo "========================================"
            echo "📊 Resultado: ${currentBuild.currentResult}"
            echo "⏱️  Duración: ${currentBuild.durationString}"
            echo ""
            echo "🌐 PÁGINA WEB DESPLEGADA EN:"
            echo "   http://localhost:${APP_PORT}"
            echo ""
            echo "🔍 ANÁLISIS SONARQUBE (15+ vulnerabilidades):"
            echo "   ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
            echo ""
            echo "📁 REPORTES GENERADOS (v${APP_VERSION}):"
            echo "   • security-report-v${APP_VERSION}-${BUILD_NUMBER}.md"
            echo "   • demo-urls-v${APP_VERSION}.txt"
            echo "   • xss-findings.txt"
            echo "   • credentials-findings.txt"
            echo "   • rce-findings.txt"
            echo "   • sqli-findings.txt"
            echo "========================================"
            
            archiveArtifacts artifacts: '*.md,*.txt,server.log', fingerprint: true
            
            sh '''
                echo "🛑 Limpiando procesos y archivos temporales..."
                [ -f server.pid ] && kill $(cat server.pid) 2>/dev/null || true
                pkill -f "node server.js" 2>/dev/null || true
                fuser -k ${APP_PORT}/tcp 2>/dev/null || true
                sleep 2
                rm -f server.pid 2>/dev/null || true
            '''
        }
        success {
            echo ""
            echo "🎉 ¡PROYECTO SEMESTRAL v${APP_VERSION} COMPLETADO!"
            echo "========================================"
            echo "✅ TODO LISTO PARA TU PRESENTACIÓN:"
            echo ""
            echo "1. ✅ Página web vulnerable v${APP_VERSION} DESPLEGADA"
            echo "2. ✅ Análisis SonarQube con 15+ vulnerabilidades EJECUTADO"
            echo "3. ✅ 15+ vulnerabilidades IMPLEMENTADAS y documentadas"
            echo "4. ✅ Demostración en VIVO con nuevo diseño configurada"
            echo "5. ✅ Reportes de seguridad v${APP_VERSION} GENERADOS"
            echo ""
            echo "📋 ACCIONES PARA TU PRESENTACIÓN:"
            echo "1. Muestra el NUEVO DISEÑO v${APP_VERSION} funcionando"
            echo "2. Explota 3 vulnerabilidades NUEVAS en vivo"
            echo "3. Muestra SonarQube con TODOS los hallazgos"
            echo "4. Explica el flujo CI/CD completo paso a paso"
            echo "5. Haz un cambio en GitHub y muestra análisis automático"
            echo "========================================"
        }
        failure {
            echo ""
            echo "🔧 SOLUCIÓN DE PROBLEMAS:"
            echo "1. Verifica que SonarQube esté corriendo en ${SONAR_HOST_URL}"
            echo "2. Revisa credenciales 'github-token' en Jenkins"
            echo "3. Verifica que NodeJS y PHP estén instalados"
            echo "4. Revisa server.log para errores: tail -100 server.log"
            echo "5. Prueba 'npm start' manualmente en el workspace"
            echo "6. Verifica que el puerto ${APP_PORT} esté libre: netstat -tulpn | grep :${APP_PORT}"
        }
    }
}
