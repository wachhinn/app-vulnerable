pipeline {
    agent any
    
    tools {
        nodejs 'nodejs'  // Asegúrate de tener NodeJS configurado en Jenkins
    }
    
    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        // Si SonarQube está en otra máquina: 'http://<IP>:9000'
        NODE_ENV = 'test'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/wachhinn/app-vulnerable.git'
                    ]]
                ])
                
                // Mostrar información del commit
                sh '''
                    echo "Repositorio: $(git config --get remote.origin.url)"
                    echo "Branch: $(git branch --show-current)"
                    echo "Commit: $(git log --oneline -1)"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    // Verificar si es proyecto Node.js
                    if (fileExists('package.json')) {
                        echo 'Instalando dependencias Node.js...'
                        sh 'npm install'
                    } else if (fileExists('pom.xml')) {
                        echo 'Proyecto Java detectado'
                        sh 'mvn clean install -DskipTests'
                    } else if (fileExists('requirements.txt')) {
                        echo 'Proyecto Python detectado'
                        sh 'pip install -r requirements.txt'
                    } else {
                        echo 'No se detectó archivo de dependencias'
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    // Verificar que SonarQube esté accesible
                    sh '''
                        echo "Verificando conexión a SonarQube..."
                        curl -s ${SONAR_HOST_URL}/api/system/status || echo "SonarQube no responde"
                    '''
                    
                    withSonarQubeEnv('SonarQube') {
                        // Configurar análisis según tipo de proyecto
                        if (fileExists('package.json')) {
                            sh '''
                                sonar-scanner \
                                -Dsonar.projectKey=app-vulnerable \
                                -Dsonar.projectName="App Vulnerable" \
                                -Dsonar.projectVersion=1.0 \
                                -Dsonar.sources=src,app.js,server.js \
                                -Dsonar.tests=tests \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.exclusions=node_modules/**,**/*.min.js,coverage/** \
                                -Dsonar.coverage.exclusions=**/*.test.js,**/*.spec.js
                            '''
                        } else {
                            // Análisis genérico
                            sh '''
                                sonar-scanner \
                                -Dsonar.projectKey=app-vulnerable \
                                -Dsonar.projectName="App Vulnerable" \
                                -Dsonar.sources=. \
                                -Dsonar.exclusions=**/node_modules/**,**/target/**,**/dist/**
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Quality Gate Check') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
        
        stage('Security Tests') {
            steps {
                script {
                    if (fileExists('package.json')) {
                        // Ejecutar npm audit para vulnerabilidades conocidas
                        sh 'npm audit --json > npm-audit.json || true'
                        
                        // Si tienes tests de seguridad
                        if (fileExists('package.json') && 
                            sh(script: 'grep -q "security-test" package.json', returnStatus: true) == 0) {
                            sh 'npm run security-test || true'
                        }
                    }
                    
                    // Escaneo básico con OWASP ZAP (si está instalado)
                    sh '''
                        which zap-baseline.py && \
                        zap-baseline.py -t http://localhost:3000 -r zap-report.html || \
                        echo "OWASP ZAP no instalado, omitiendo escaneo"
                    '''
                }
            }
        }
        
        stage('Build Application') {
            steps {
                script {
                    if (fileExists('package.json') && 
                        sh(script: 'grep -q "build" package.json', returnStatus: true) == 0) {
                        sh 'npm run build || true'
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    if (fileExists('package.json') && 
                        sh(script: 'grep -q "test" package.json', returnStatus: true) == 0) {
                        sh 'npm test || true'
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline ${currentBuild.currentResult}"
            
            // Archivar reportes
            archiveArtifacts artifacts: '*.json,*.html,*.xml', fingerprint: true
            
            // Limpiar workspace
            cleanWs()
        }
        success {
            echo '✅ Pipeline ejecutado exitosamente!'
            
            // Opcional: Enviar notificación
            // emailext body: "Build ${env.BUILD_NUMBER} completado", subject: "Pipeline Success", to: 'email@example.com'
        }
        failure {
            echo '❌ Pipeline falló!'
            
            // Mostrar logs de error
            sh 'echo "Últimos 50 logs de error:"; tail -50 /var/log/jenkins/jenkins.log || true'
        }
        unstable {
            echo '⚠️  Quality Gate falló - Revisar SonarQube'
        }
    }
}
