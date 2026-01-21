pipeline {
    agent any

    environment {
        GITHUB_REPO = 'jwahn2018-rgb/5x5y-shop'
        IMAGE_NAME = 'ghcr.io/jwahn2018-rgb/5x5y-shop'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "sudo buildah bud -t ${imageTag} -f Containerfile ."
                }
            }
        }

        stage('Push Image') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${BUILD_NUMBER}"
                    withCredentials([usernamePassword(credentialsId: 'ghcr-cred', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
                        sh "echo ${GHCR_TOKEN} | sudo buildah login -u ${GHCR_USER} --password-stdin ghcr.io"
                        sh "sudo buildah push ${imageTag}"
                    }
                }
            }
        }

       stage('Update deployment & push') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${BUILD_NUMBER}"
                    // 변경점: 'ghcr-cred'에서 토큰만 꺼내옵니다. (아이디는 안 씁니다)
                    withCredentials([usernamePassword(credentialsId: 'ghcr-cred', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh """
                            sed -i 's|image: ${IMAGE_NAME}:.*|image: ${imageTag}|' k8s/base/deployment.yaml
                            git config user.email "jenkins@example.com"
                            git config user.name "Jenkins"
                            git add k8s/base/deployment.yaml
                            git commit -m "Update image to ${imageTag}"
                            
                            # [⭐️여기가 핵심] 아이디(jwahn2018-rgb)를 아예 빼버리고 토큰만 사용합니다.
                            # GitHub는 토큰만 있으면 누군지 알아서 식별합니다.
                            git push https://${GIT_TOKEN}@github.com/${GITHUB_REPO}.git HEAD:min-test
                        """
                    }
                }
            }
        }
    }
}

