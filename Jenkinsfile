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
                    echo "Repositorio: $(git config --get remote.origin.url)"
                    echo "Branch: $(git branch --show-current)"
                    echo "Commit: $(git log --oneline -1)"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    if (fileExists('package.json')) {
                        sh 'npm install'
                    } else {
                        echo 'No package.json found'
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=app-vulnerable \
                        -Dsonar.projectName="App Vulnerable" \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=node_modules/**,**/*.min.js \
                        -Dsonar.host.url=${SONAR_HOST_URL}
                    '''
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    if (fileExists('package.json')) {
                        sh 'npm test || true'
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline ${currentBuild.currentResult}"
            cleanWs()
        }
        success {
            echo '✅ Pipeline ejecutado exitosamente!'
        }
        failure {
            echo '❌ Pipeline falló!'
        }
    }
}
