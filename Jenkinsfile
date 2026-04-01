pipeline {
    agent any

    tools {
        nodejs 'NodeJS'  // Nom configuré dans Jenkins > Global Tool Configuration
    }

    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_TOKEN    = credentials('sonarqube-token') // ID du credential Jenkins
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('BackOffice') {
                    sh 'npm ci'
                }
            }
        }

        stage('Unit Tests & Coverage') {
            steps {
                dir('BackOffice') {
                    sh 'npm run test:cov -- --testPathPattern=auth --forceExit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'BackOffice/coverage/junit.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('BackOffice') {
                    withSonarQubeEnv('SonarQube') {
                        script {
                            def scannerHome = tool 'SonarScanner'
                            sh "${scannerHome}/bin/sonar-scanner"
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline terminé avec succès.'
        }
        failure {
            echo 'Pipeline échoué. Vérifiez les logs.'
        }
    }
}
