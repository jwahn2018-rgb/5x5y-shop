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
                    // 아이디 없이 토큰만 사용하는 방식 유지
                    withCredentials([usernamePassword(credentialsId: 'ghcr-cred', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh """
                            # [1] 파일 내용 수정 (경로: k8s/deployment.yaml) -> 이건 이미 잘 됨
                            sed -i 's|image: ${IMAGE_NAME}:.*|image: ${imageTag}|' k8s/deployment.yaml
                            
                            git config user.email "jenkins@example.com"
                            git config user.name "Jenkins"
                            
                            # [⭐️수정할 부분] 여기 경로에서 'base/'를 지워야 합니다!
                            git add k8s/deployment.yaml
                            
                            git commit -m "Update image to ${imageTag}"
                            
                            # 아이디 없이 토큰으로 푸시
                            git push https://${GIT_TOKEN}@github.com/${GITHUB_REPO}.git HEAD:min-test
                        """
                    }
                }
            }
        }
    }
}

