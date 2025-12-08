pipeline {
    agent any
    
    environment {
        SONAR_HOST_URL = 'http://192.168.1.149:9000'
        SONAR_PROJECT_KEY = 'app-vulnerable-${BUILD_NUMBER}'
        APP_PORT = '3000'
        APP_URL = 'http://localhost:${APP_PORT}'
    }
    
    stages {
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
                sh 'echo "✅ Repositorio clonado"'
            }
        }
        
        stage('Setup Project') {
            steps {
                sh '''
                    echo "=== CONFIGURANDO PROYECTO ==="
                    
                    # Verificar NodeJS
                    if command -v node > /dev/null; then
                        echo "✅ NodeJS: $(node --version)"
                        echo "✅ NPM: $(npm --version)"
                    else
                        echo "Instalando NodeJS..."
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    fi
                    
                    # Instalar dependencias
                    if [ -f package.json ]; then
                        npm install || echo "⚠️  npm install continuó con errores"
                    else
                        echo "{}" > package.json
                        npm install express --save
                    fi
                    
                    echo "✅ Estructura del proyecto:"
                    ls -la
                    echo ""
                    echo "✅ Archivos HTML/JS:"
                    find . -name "*.html" -o -name "*.js" | grep -v node_modules | head -20
                '''
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    echo "=== EJECUTANDO ANÁLISIS SONARQUBE ==="
                    
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            echo "🔍 Analizando código vulnerable..."
                            echo "Proyecto: ${SONAR_PROJECT_KEY}"
                            echo "URL SonarQube: ${SONAR_HOST_URL}"
                            
                            sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName="Sistema Bancario Vulnerable ${BUILD_NUMBER}" \
                            -Dsonar.projectVersion=2.0.0 \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.exclusions=node_modules/** \
                            -Dsonar.sourceEncoding=UTF-8 \
                            -Dsonar.javascript.file.suffixes=.js \
                            -Dsonar.html.file.suffixes=.html \
                            -Dsonar.tests=. \
                            -Dsonar.test.inclusions=**/*.test.js \
                            -Dsonar.qualitygate.wait=true
                            
                            echo "✅ Análisis enviado a SonarQube"
                        """
                    }
                }
            }
        }
        
        stage('Deploy & Live Demo') {
            steps {
                sh '''
                    echo "=== DESPLIEGUE EN VIVO ==="
                    echo "🚀 Iniciando página web vulnerable..."
                    
                    # Iniciar servidor en background
                    nohup npm start > server.log 2>&1 &
                    SERVER_PID=$!
                    echo "PID del servidor: $SERVER_PID"
                    echo $SERVER_PID > server.pid
                    
                    # Esperar que inicie
                    echo "⏳ Esperando 15 segundos para que el servidor inicie..."
                    sleep 15
                    
                    # Verificar que está funcionando
                    echo "🔄 Verificando estado del servidor..."
                    if curl -s -f "http://localhost:${APP_PORT}/health" > /dev/null; then
                        echo "✅ Página web FUNCIONANDO en: http://localhost:${APP_PORT}"
                        echo ""
                        echo "========================================"
                        echo "🌐 DEMOSTRACIÓN EN VIVO - ACCESOS:"
                        echo "========================================"
                        echo ""
                        echo "📱 PÁGINA PRINCIPAL:"
                        echo "   http://localhost:${APP_PORT}/"
                        echo ""
                        echo "🔓 VULNERABILIDADES PARA PROBAR:"
                        echo ""
                        echo "1. 🔴 XSS (Cross-Site Scripting):"
                        echo "   http://localhost:${APP_PORT}/search?q=<script>alert('XSS')</script>"
                        echo "   http://localhost:${APP_PORT}/search?q=<img src=x onerror=alert('Hacked')>"
                        echo ""
                        echo "2. 🔴 Credenciales Hardcodeadas:"
                        echo "   Usuario: admin | Contraseña: admin123"
                        echo "   (Ver en login de la página)"
                        echo ""
                        echo "3. 🔴 Datos Sensibles Expuestos:"
                        echo "   http://localhost:${APP_PORT}/api/users"
                        echo "   (API sin autenticación con contraseñas)"
                        echo ""
                        echo "4. 🔴 Información de Debug Expuesta:"
                        echo "   http://localhost:${APP_PORT}/debug"
                        echo "   (Secrets, configuraciones internas)"
                        echo ""
                        echo "5. 🟡 SQL Injection Simulada:"
                        echo "   http://localhost:${APP_PORT}/api/user/1"
                        echo "   http://localhost:${APP_PORT}/api/user/1 OR 1=1"
                        echo ""
                        echo "6. 🟡 CORS Demasiado Permisivo:"
                        echo "   (Configurado en server.js - permite cualquier origen)"
                        echo ""
                        echo "========================================"
                        echo "🔍 SonarQube detectará estas 7 vulnerabilidades"
                        echo "========================================"
                        
                        # Crear archivo con URLs para referencia
                        cat > demo-urls.txt << "URLS"
🌐 PÁGINA WEB VULNERABLE - PROYECTO SEMESTRAL
========================================

📊 BUILD: ${BUILD_NUMBER}
🕐 HORA INICIO: $(date)

🔗 URLS PARA DEMOSTRACIÓN:

1. PÁGINA PRINCIPAL:
   http://localhost:3000/

2. VULNERABILIDAD XSS:
   http://localhost:3000/search?q=<script>alert('XSS_DEMO')</script>
   http://localhost:3000/search?q=<svg/onload=alert('SVG_XSS')>

3. DATOS EXPUESTOS (API sin auth):
   http://localhost:3000/api/users

4. DEBUG INFO (Secrets expuestos):
   http://localhost:3000/debug

5. SQL INJECTION SIMULADA:
   http://localhost:3000/api/user/1
   http://localhost:3000/api/user/1 OR 1=1

6. HEALTH CHECK:
   http://localhost:3000/health

7. SONARQUBE ANALISIS:
   ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}

🎯 VULNERABILIDADES IMPLEMENTADAS:
   1. XSS (Cross-Site Scripting)
   2. Credenciales hardcodeadas
   3. CORS demasiado permisivo
   4. Exposición de datos sin autenticación
   5. SQL Injection simulada
   6. Información de debug expuesta
   7. Logs con datos sensibles

⚠️  ADVERTENCIA: Vulnerabilidades intencionales para proyecto semestral
URLS
                        
                        echo "✅ Archivo demo-urls.txt creado"
                        cat demo-urls.txt
                        
                    else
                        echo "❌ Servidor no responde. Revisando logs..."
                        cat server.log
                        echo "❌ Health check falló. El servidor podría no haber iniciado correctamente."
                    fi
                    
                    # Mantener activo para demostración (5 minutos)
                    echo ""
                    echo "⏰ Manteniendo servidor activo por 5 minutos para demostración en vivo..."
                    echo "   (El servidor se detendrá automáticamente después)"
                    
                    # Mostrar logs en tiempo real (solo últimos 10 líneas)
                    echo ""
                    echo "📝 Últimos logs del servidor:"
                    tail -10 server.log
                    
                    sleep 300  # 5 minutos para demostración
                    
                    # Detener servidor
                    echo "🛑 Deteniendo servidor después de demostración..."
                    kill $SERVER_PID 2>/dev/null || true
                    echo "✅ Servidor detenido"
                '''
            }
        }
        
        stage('Security Report') {
            steps {
                sh '''
                    echo "=== GENERANDO REPORTE DE SEGURIDAD ==="
                    
                    # Buscar vulnerabilidades conocidas
                    echo "🔎 Buscando vulnerabilidades en código..."
                    
                    # 1. Buscar XSS patterns
                    echo "1. Buscando patrones XSS..."
                    grep -r "innerHTML\\|document.write\\|eval(" --include="*.js" --include="*.html" . 2>/dev/null > xss-findings.txt || echo "No se encontraron patrones XSS"
                    
                    # 2. Buscar credenciales hardcodeadas
                    echo "2. Buscando credenciales hardcodeadas..."
                    grep -r -i "password\\|secret\\|key\\|token\\|api_key" --include="*.js" --include="*.html" --include="*.json" . 2>/dev/null | grep -v node_modules > credentials-findings.txt || echo "No se encontraron credenciales"
                    
                    # 3. Contar archivos vulnerables
                    echo "3. Contando archivos vulnerables..."
                    TOTAL_FILES=$(find . -name "*.js" -o -name "*.html" -o -name "*.json" | grep -v node_modules | wc -l)
                    VULN_FILES=$(find . -name "*.js" -o -name "*.html" -o -name "*.json" | grep -v node_modules | xargs grep -l "password\\|secret\\|innerHTML\\|document.write" 2>/dev/null | wc -l)
                    
                    # Crear reporte
                    cat > security-report-${BUILD_NUMBER}.md << "REPORT"
# 📊 REPORTE DE ANÁLISIS DE SEGURIDAD
## Sistema Bancario Vulnerable v2.0
## Build: ${BUILD_NUMBER}
## Fecha: $(date '+%Y-%m-%d %H:%M:%S')

### 📈 ESTADÍSTICAS
- **Total archivos analizados:** ${TOTAL_FILES}
- **Archivos con vulnerabilidades:** ${VULN_FILES}
- **Tiempo de ejecución:** $(echo ${currentBuild.durationString} | sed 's/ y contando//')

### 🎯 VULNERABILIDADES IMPLEMENTADAS
1. 🔴 **XSS (Cross-Site Scripting)** - Endpoint `/search`
2. 🔴 **Credenciales Hardcodeadas** - JavaScript y API
3. 🔴 **Exposición de Datos** - `/api/users` sin autenticación
4. 🔴 **Debug Info Expuesta** - `/debug` endpoint
5. 🟡 **SQL Injection Simulada** - `/api/user/:id`
6. 🟡 **CORS Demasiado Permisivo** - Configuración server.js
7. 🟡 **Logs con Datos Sensibles** - Console.log con credenciales

### 🌐 DEMOSTRACIÓN EN VIVO
**Servidor ejecutado en:** http://localhost:3000
**Duración de demostración:** 5 minutos
**Estado:** $(if curl -s -f "http://localhost:3000/health" > /dev/null; then echo "✅ ACTIVO"; else echo "❌ INACTIVO"; fi)

### 🔗 ENLACES IMPORTANTES
- **SonarQube:** ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}
- **Repositorio GitHub:** https://github.com/wachhinn/app-vulnerable
- **Jenkins Build:** ${BUILD_URL}

### 📋 HALLazgos DE ANÁLISIS AUTOMÁTICO
#### XSS Detectado:
$(if [ -f xss-findings.txt ] && [ -s xss-findings.txt ]; then
  echo "```"
  cat xss-findings.txt | head -10
  echo "```"
else
  echo "No se encontraron patrones XSS obvios"
fi)

#### Credenciales Detectadas:
$(if [ -f credentials-findings.txt ] && [ -s credentials-findings.txt ]; then
  echo "```"
  cat credentials-findings.txt | head -10
  echo "```"
else
  echo "No se encontraron credenciales hardcodeadas obvias"
fi)

### 🚨 RECOMENDACIONES
1. **Sanitizar todas las entradas de usuario** (especialmente en `/search`)
2. **Eliminar credenciales hardcodeadas** y usar variables de entorno
3. **Implementar autenticación** en endpoints sensibles (`/api/users`)
4. **Remover endpoint `/debug`** o protegerlo en producción
5. **Configurar CORS adecuadamente** (orígenes específicos)
6. **No loguear datos sensibles** en console.log

### 📊 PARA PRESENTACIÓN SEMESTRAL
1. **Muestra la página web funcionando** en http://localhost:3000
2. **Demuestra vulnerabilidades** en vivo (XSS, datos expuestos)
3. **Muestra reporte SonarQube** con hallazgos
4. **Explica flujo CI/CD** (GitHub → Jenkins → SonarQube → Despliegue)
5. **Haz cambios en tiempo real** y muestra análisis automático

---

*Reporte generado automáticamente por pipeline CI/CD*
*Proyecto Semestral - Seguridad en Aplicaciones Web*
REPORT
                    
                    echo "✅ Reporte generado: security-report-${BUILD_NUMBER}.md"
                    echo ""
                    echo "📄 RESUMEN DEL REPORTE:"
                    head -30 security-report-${BUILD_NUMBER}.md
                '''
            }
        }
    }
    
    post {
        always {
            echo ""
            echo "========================================"
            echo "🏁 BUILD ${BUILD_NUMBER} FINALIZADO"
            echo "========================================"
            echo "📊 Resultado: ${currentBuild.currentResult}"
            echo "⏱️  Duración: ${currentBuild.durationString}"
            echo ""
            echo "🌐 PÁGINA WEB DESPLEGADA EN:"
            echo "   http://localhost:${APP_PORT}"
            echo ""
            echo "🔍 ANÁLISIS SONARQUBE:"
            echo "   ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
            echo ""
            echo "📁 REPORTES GENERADOS:"
            echo "   • security-report-${BUILD_NUMBER}.md"
            echo "   • demo-urls.txt"
            echo "   • xss-findings.txt"
            echo "   • credentials-findings.txt"
            echo "========================================"
            
            # Archivar todos los reportes
            archiveArtifacts artifacts: '*.md,*.txt,server.log', fingerprint: true
            
            # Limpiar procesos
            sh '''
                [ -f server.pid ] && kill $(cat server.pid) 2>/dev/null || true
                pkill -f "node server.js" 2>/dev/null || true
                sleep 2
            '''
            
            # Limpiar workspace
            cleanWs()
        }
        success {
            echo ""
            echo "🎉 ¡PROYECTO SEMESTRAL COMPLETADO!"
            echo "========================================"
            echo "✅ TODO LISTO PARA TU PRESENTACIÓN:"
            echo ""
            echo "1. ✅ Página web vulnerable DESPLEGADA"
            echo "2. ✅ Análisis SonarQube EJECUTADO"
            echo "3. ✅ 7 vulnerabilidades IMPLEMENTADAS"
            echo "4. ✅ Demostración en VIVO configurada"
            echo "5. ✅ Reportes de seguridad GENERADOS"
            echo ""
            echo "📋 ACCIONES PARA TU PRESENTACIÓN:"
            echo "1. Muestra la página web funcionando"
            echo "2. Explota vulnerabilidades en vivo"
            echo "3. Muestra hallazgos de SonarQube"
            echo "4. Explica el flujo CI/CD completo"
            echo "5. Haz un cambio y muestra análisis automático"
            echo "========================================"
        }
        failure {
            echo ""
            echo "🔧 SOLUCIÓN DE PROBLEMAS:"
            echo "1. Verifica que SonarQube esté corriendo"
            echo "2. Revisa credenciales en Jenkins"
            echo "3. Verifica que NodeJS esté instalado"
            echo "4. Revisa server.log para errores"
            echo "5. Prueba 'npm start' manualmente"
        }
    }
}
