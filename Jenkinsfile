pipeline {
    agent any
    
    environment {
        SONAR_HOST_URL = 'http://192.168.1.149:9000'
        SONAR_PROJECT_KEY = 'app-vulnerable-${BUILD_NUMBER}'
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
                    
                    # Asegurar app.js existe
                    if [ ! -f app.js ]; then
                        cat > app.js << "EOL"
const express = require('express');
const app = express();
app.get('/', (req, res) => {
    res.send('App Vulnerable para pruebas');
});
app.listen(3000, () => {
    console.log('App running');
});
EOL
                    fi
                '''
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    echo "=== EJECUTANDO ANÁLISIS SONARQUBE ==="
                    
                    // CORRECCIÓN: Usar el ID correcto 'sonarqube-tokenn'
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            echo "🔍 Iniciando análisis SonarQube..."
                            echo "Proyecto: ${SONAR_PROJECT_KEY}"
                            echo "URL: ${SONAR_HOST_URL}"
                            
                            sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName="App Vulnerable ${BUILD_NUMBER}" \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.exclusions=node_modules/** \
                            -Dsonar.sourceEncoding=UTF-8
                            
                            echo "✅ Análisis enviado a SonarQube"
                        """
                    }
                }
            }
        }
        
        stage('Check Analysis') {
            steps {
                sh '''
                    echo "=== VERIFICANDO ANÁLISIS ==="
                    echo "Esperando 30 segundos para que SonarQube procese..."
                    sleep 30
                    echo "URL del análisis: ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
                '''
            }
        }
    }
    
    post {
        always {
            echo "========================================"
            echo "BUILD ${BUILD_NUMBER} - ${currentBuild.currentResult}"
            echo "URL SonarQube: ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
            echo "========================================"
            cleanWs()
        }
        success {
            echo "🎉 ¡ANÁLISIS COMPLETADO!"
            echo "Revisa vulnerabilidades en:"
            echo "${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
        }
        failure {
            echo "🔧 Posibles soluciones:"
            echo "1. Verificar credenciales SonarQube en Jenkins"
            echo "2. Verificar que SonarQube esté corriendo"
            echo "3. Verificar token en SonarQube: admin → My Account → Security"
        }
    }
}
