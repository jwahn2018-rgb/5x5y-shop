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
                    // 변경점: 'github-push' 대신 이미 작동 확인된 'ghcr-cred' 사용
                    // string(...) 대신 usernamePassword(...)를 사용하여 토큰만 변수에 담습니다.
                    withCredentials([usernamePassword(credentialsId: 'ghcr-cred', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh """
                            sed -i 's|image: ${IMAGE_NAME}:.*|image: ${imageTag}|' k8s/base/deployment.yaml
                            git config user.email "jenkins@example.com"
                            git config user.name "Jenkins"
                            git add k8s/base/deployment.yaml
                            git commit -m "Update image to ${imageTag}"

                            # 변경점: 사용자명도 변수(${GIT_USER})로 처리하여 더 안전하게 변경
                            git push https://${GIT_USER}:${GIT_TOKEN}@github.com/${GITHUB_REPO}.git HEAD:min-test
                        """
                    }
                }
            }
        }
    }
}

