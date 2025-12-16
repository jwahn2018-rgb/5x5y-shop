pipeline {
  agent any

  environment {
    IMAGE = "ghcr.io/jwahn2018-rgb/5x5y-shop"
    TAG   = "${env.GIT_COMMIT}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build & Push (buildah)') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-cred',
          usernameVariable: 'GH_USER', passwordVariable: 'GH_PAT')]) {
          sh '''
            set -eux
            sudo buildah login ghcr.io -u "$GH_USER" -p "$GH_PAT"
            sudo buildah bud -f Containerfile -t "$IMAGE:$TAG" .
            sudo buildah push "$IMAGE:$TAG"
          '''
        }
      }
    }

    stage('Bump kustomize tag & push') {
      steps {
        withCredentials([string(credentialsId: 'github-push', variable: 'GIT_PAT')]) {
          sh '''
            set -eux
            git config user.name "jenkins"
            git config user.email "jenkins@local"

            sed -i "s/^\\s*newTag:.*$/  newTag: ${TAG}/" k8s/overlays/dev/kustomization.yaml

            git add k8s/overlays/dev/kustomization.yaml
            git commit -m "dev: bump image tag to ${TAG}" || true

            git remote set-url origin https://jwahn2018-rgb:${GIT_PAT}@github.com/jwahn2018-rgb/5x5y-shop.git
            git push origin HEAD:main
          '''
        }
      }
    }
  }
}
