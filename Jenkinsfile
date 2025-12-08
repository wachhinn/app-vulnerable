pipeline {
    agent any  // Esto crea el contexto 'node' automáticamente
    
    environment {
        SONAR_HOST_URL = 'http://192.168.1.149:9000'
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
                sh 'echo "Repositorio clonado exitosamente"'
            }
        }
        
        stage('Setup Environment') {
            steps {
                sh '''
                    echo "=== CONFIGURANDO ENTORNO ==="
                    echo "Directorio de trabajo: $(pwd)"
                    echo "Usuario Jenkins: $(whoami)"
                    
                    # Verificar NodeJS
                    if command -v node > /dev/null 2>&1; then
                        echo "✅ NodeJS instalado: $(node --version)"
                        echo "✅ NPM instalado: $(npm --version)"
                    else
                        echo "⚠️  NodeJS no encontrado. Continuando sin análisis avanzado."
                        # Crear estructura básica sin npm
                        mkdir -p src
                        echo "console.log('Hello Vulnerable App');" > src/index.js
                    fi
                    
                    # Crear estructura del proyecto si no existe
                    if [ ! -f package.json ]; then
                        echo "Creando estructura básica..."
                        cat > package.json << "EOL"
{
  "name": "app-vulnerable",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  }
}
EOL
                    fi
                    
                    echo "Contenido actual:"
                    ls -la
                '''
            }
        }
        
        stage('Test Basic Operations') {
            steps {
                sh '''
                    echo "=== OPERACIONES BÁSICAS ==="
                    
                    # Crear archivo de prueba
                    echo "Hello from Jenkins Build ${BUILD_NUMBER}" > test-output.txt
                    echo "Test file created successfully"
                    
                    # Verificar creación
                    if [ -f test-output.txt ]; then
                        echo "✅ Archivo creado:"
                        cat test-output.txt
                    else
                        echo "❌ Error creando archivo"
                    fi
                '''
            }
        }
        
        stage('Verify SonarQube') {
            steps {
                sh '''
                    echo "=== VERIFICANDO SONARQUBE ==="
                    echo "URL: ${SONAR_HOST_URL}"
                    
                    # Intentar conexión
                    response=$(curl -s -o /dev/null -w "%{http_code}" ${SONAR_HOST_URL}/api/system/status || echo "ERROR")
                    
                    if [ "$response" = "200" ]; then
                        echo "✅ SonarQube está accesible"
                        echo "Puedes agregar análisis SonarQube en el siguiente paso"
                    else
                        echo "⚠️  SonarQube no responde (código: $response)"
                        echo "Continúo sin análisis de calidad por ahora"
                    fi
                '''
            }
        }
    }
    
    post {
        always {
            echo "========================================"
            echo "  PIPELINE COMPLETADO - RESUMEN"
            echo "========================================"
            echo "Build Number: ${BUILD_NUMBER}"
            echo "Result: ${currentBuild.currentResult}"
            echo "Duration: ${currentBuild.durationString}"
            echo "========================================"
            
            // Limpiar workspace
            cleanWs()
        }
        success {
            echo "🎉 ¡FELICIDADES! Pipeline ejecutado exitosamente"
            echo "Próximo paso: Agregar análisis SonarQube"
        }
        failure {
            echo "🔧 Para solucionar:"
            echo "1. Verificar conexión a internet"
            echo "2. Instalar NodeJS manualmente: sudo apt install nodejs npm"
            echo "3. Verificar SonarQube: sudo docker ps | grep sonarqube"
        }
    }
}
