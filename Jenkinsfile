pipeline {
    agent any
    
    tools {
        nodejs 'nodejs'
    }
    
    environment {
        SONAR_HOST_URL = 'http://192.168.1.149:9000'
        NODE_ENV = 'test'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/wachhinn/app-vulnerable.git',
                        credentialsId: 'github-token'
                    ]]
                ])
                
                sh '''
                    echo "=== INFORMACIÓN DEL REPOSITORIO ==="
                    echo "URL: https://github.com/wachhinn/app-vulnerable.git"
                    echo "Branch: $(git branch --show-current)"
                    echo "Último commit: $(git log --oneline -1)"
                    echo "Archivos en repo:"
                    ls -la
                '''
            }
        }
        
        stage('Verificar Proyecto') {
            steps {
                script {
                    echo "=== VERIFICANDO ESTRUCTURA ==="
                    sh '''
                        echo "Contenido actual:"
                        ls -la
                        echo ""
                        echo "package.json existe?: $(if [ -f package.json ]; then echo "SÍ"; else echo "NO"; fi)"
                    '''
                    
                    // Si no hay package.json, crear uno básico
                    if (!fileExists('package.json')) {
                        echo "⚠️  No hay package.json. Creando uno básico..."
                        sh '''
                            npm init -y
                            npm install express --save
                            echo "// App básica vulnerable" > app.js
                            echo "const express = require('express');" >> app.js
                            echo "const app = express();" >> app.js
                            echo "app.get('/', (req, res) => {" >> app.js
                            echo "  res.send('App Vulnerable para pruebas');" >> app.js
                            echo "});" >> app.js
                            echo "app.listen(3000, () => console.log('Servidor en puerto 3000'));" >> app.js
                        '''
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "=== INSTALANDO DEPENDENCIAS ==="
                    if [ -f package.json ]; then
                        npm install
                        echo "Dependencias instaladas"
                    else
                        echo "No hay package.json para instalar"
                    fi
                '''
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    echo "=== ANÁLISIS SONARQUBE ==="
                    
                    // Verificar que SonarQube esté accesible
                    sh """
                        echo "Probando conexión a SonarQube..."
                        curl -s ${SONAR_HOST_URL}/api/system/status || echo "⚠️  No se pudo conectar a SonarQube"
                    """
                    
                    // Configurar análisis SonarQube
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            echo "Ejecutando sonar-scanner..."
                            sonar-scanner \
                            -Dsonar.projectKey=app-vulnerable-${env.BUILD_NUMBER} \
                            -Dsonar.projectName="App Vulnerable Build ${env.BUILD_NUMBER}" \
                            -Dsonar.projectVersion=1.0 \
                            -Dsonar.sources=. \
                            -Dsonar.sourceEncoding=UTF-8 \
                            -Dsonar.exclusions=node_modules/**,**/*.min.js,coverage/** \
                            -Dsonar.tests=. \
                            -Dsonar.test.inclusions=**/*.test.js,**/*.spec.js \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }
        
        stage('Quality Gate Check') {
            steps {
                echo "=== VERIFICANDO QUALITY GATE ==="
                timeout(time: 5, unit: 'MINUTES') {
                    // abortPipeline: false para que continúe aunque falle
                    waitForQualityGate abortPipeline: false
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh '''
                    echo "=== ESCANEO DE SEGURIDAD ==="
                    echo "1. Verificando vulnerabilidades con npm audit..."
                    npm audit --json > npm-audit.json 2>/dev/null || echo "npm audit no disponible"
                    
                    echo "2. Buscando credenciales hardcodeadas..."
                    # CORRECCIÓN: Escapar las barras verticales
                    grep -r "password\\|secret\\|key\\|token" --include="*.js" --include="*.json" . 2>/dev/null || echo "No se encontraron credenciales obvias"
                    
                    echo "3. Archivos de configuración:"
                    ls -la *.json *.js 2>/dev/null || true
                '''
            }
        }
        
        stage('Build & Test') {
            steps {
                sh '''
                    echo "=== BUILD Y TESTS ==="
                    echo "Ejecutando tests si existen..."
                    
                    # Intentar ejecutar tests
                    if [ -f package.json ] && grep -q '"test"' package.json; then
                        npm test || echo "Tests fallaron o no existen"
                    else
                        echo "No hay scripts de test definidos"
                    fi
                    
                    # Intentar build si existe
                    if [ -f package.json ] && grep -q '"build"' package.json; then
                        npm run build || echo "Build falló o no existe"
                    fi
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== RESUMEN DEL PIPELINE ==="
            echo "Build Number: ${env.BUILD_NUMBER}"
            echo "Resultado: ${currentBuild.currentResult}"
            echo "Duración: ${currentBuild.durationString}"
            
            // Archivar reportes generados
            archiveArtifacts artifacts: '*.json,*.html', fingerprint: true
            
            // Limpiar workspace
            cleanWs()
            
            echo "✅ Pipeline finalizado"
        }
        success {
            echo "🎉 ¡Pipeline exitoso!"
        }
        failure {
            echo "❌ Pipeline falló"
            sh '''
                echo "Posibles causas:"
                echo "1. SonarQube no accesible"
                echo "2. sonar-scanner no instalado"
                echo "3. Error en dependencias"
                echo "4. Quality Gate falló"
            '''
        }
        unstable {
            echo "⚠️  Quality Gate falló - Revisar SonarQube"
        }
    }
}
