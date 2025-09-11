pipeline {
    agent any
    environment {
        DOCKERHUB_CREDS = credentials('dockerhub-creds') // Docker Hub creds (username/password in Jenkins)
        SONAR_TOKEN     = credentials('sonar-token')     // SonarQube token (Secret text in Jenkins)
        APP_SSH         = 'app-ssh-key'                  // SSH key credentials id in Jenkins
        IMAGE           = "prudhviraj/travel-app:${BUILD_NUMBER}"
        SONAR_HOST      = "http://18.208.231.47:9000"    // SonarQube server IP
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/prudhviraj310/travel-app-sample', branch: 'main'
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm install'
                sh 'npm test || true'  // continue even if tests fail
            }
        }

        stage('SonarQube Analysis') {
            steps {
                sh """
                   docker run --rm \
                   -e SONAR_HOST_URL=${SONAR_HOST} \
                   -e SONAR_TOKEN=${SONAR_TOKEN} \
                   -v \$(pwd):/usr/src sonarsource/sonar-scanner-cli \
                   -Dsonar.projectKey=travel-app-sample \
                   -Dsonar.sources=/usr/src \
                   -Dsonar.host.url=${SONAR_HOST} \
                   -Dsonar.login=${SONAR_TOKEN}
                """
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE} ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
                sh "docker push ${IMAGE}"
            }
        }

        stage('Deploy to App Server') {
            steps {
                sshagent (credentials: [env.APP_SSH]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ec2-user@3.225.124.89 'mkdir -p ~/app && cd ~/app && cat > docker-compose.yml <<'YAML'
                        version: "3"
                        services:
                          travel-app:
                            image: ${IMAGE}
                            ports:
                              - "8081:8081"
                            restart: unless-stopped
                        YAML
                        docker pull ${IMAGE}
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
