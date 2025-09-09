pipeline {
  agent any
  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds') // username/password
    SONAR_TOKEN = credentials('sonar-token')         // secret text
    APP_SSH = 'app-ssh-key'                          // SSH key credentials id
    IMAGE = "${DOCKERHUB_CREDS_USR}/travel-app:${BUILD_NUMBER}"
    SONAR_HOST = "http://<SONAR_HOST_IP>:9000"
  }
  stages {
    stage('Checkout') {
      steps { git url: 'https://github.com/YOUR_GIT_USER/YOUR_REPO.git', branch: 'main' }
    }
    stage('Install & Test') {
      steps {
        sh 'npm install'
        sh 'npm test || true'
      }
    }
    stage('SonarQube Analysis') {
      steps {
        // use Sonar Scanner Docker image to scan; sonar-project.properties must exist
        sh """
           docker run --rm -e SONAR_HOST_URL=${SONAR_HOST} -e SONAR_TOKEN=${SONAR_TOKEN} -v \$(pwd):/usr/src sonarsource/sonar-scanner-cli \
            -Dsonar.projectKey=travel-app-sample -Dsonar.sources=/usr/src -Dsonar.host.url=${SONAR_HOST} -Dsonar.login=${SONAR_TOKEN}
        """
      }
    }
    stage('Build Docker Image') {
      steps {
        sh "docker build -t ${DOCKERHUB_CREDS_USR}/travel-app:${BUILD_NUMBER} ."
      }
    }
    stage('Push to Docker Hub') {
      steps {
        sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
        sh "docker push ${DOCKERHUB_CREDS_USR}/travel-app:${BUILD_NUMBER}"
      }
    }
    stage('Deploy to App Server') {
      steps {
        sshagent (credentials: [env.APP_SSH]) {
          sh """
            ssh -o StrictHostKeyChecking=no ec2-user@<APP_SERVER_IP> 'mkdir -p ~/app && cd ~/app && cat > docker-compose.yml <<'YAML'
            version: "3"
            services:
              travel-app:
                image: ${DOCKERHUB_CREDS_USR}/travel-app:${BUILD_NUMBER}
                ports:
                  - "8081:8081"
                restart: unless-stopped
            YAML
            docker pull ${DOCKERHUB_CREDS_USR}/travel-app:${BUILD_NUMBER}
            docker-compose -f ~/app/docker-compose.yml up -d
          """
        }
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: '**/target/*.jar', allowEmptyArchive: true
    }
  }
}
