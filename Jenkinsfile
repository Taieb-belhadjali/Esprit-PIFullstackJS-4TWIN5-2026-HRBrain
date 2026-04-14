pipeline {
  agent any

  environment {
    // Installation native (sans Docker). Avec docker-compose : mettre http://sonarqube:9000
    SONAR_HOST_URL = 'http://localhost:9000'
    // Credentials Jenkins : ID exact = SONAR_TOKEN (type Secret text = token SonarQube)
    SONAR_TOKEN = credentials('SONAR_TOKEN')
  }

  stages {
    stage('Install') {
      steps {
        dir('BackOffice') {
          sh 'npm ci'
        }
      }
    }

    stage('Unit Tests + Coverage') {
      steps {
        dir('BackOffice') {
          sh 'npm run test:cov:department'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'BackOffice/coverage/**', allowEmptyArchive: true
        }
      }
    }

    stage('SonarQube Scan') {
      steps {
        dir('BackOffice') {
          sh '''
            sonar-scanner \
              -Dsonar.host.url=$SONAR_HOST_URL \
              -Dsonar.token=$SONAR_TOKEN
          '''
        }
      }
    }
  }
}
