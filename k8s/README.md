# Kubernetes 배포 가이드

## 사전 준비

1. Kubernetes 클러스터가 실행 중이어야 합니다.
2. Docker 이미지가 레지스트리에 푸시되어 있어야 합니다.

## 배포 순서

### 1. Secrets 생성

```bash
# DB Secret
kubectl create secret generic db-secret \
  --from-literal=host=mysql-service \
  --from-literal=port=3306 \
  --from-literal=user=root \
  --from-literal=password=your_password \
  --from-literal=database=shopping_mall

# App Secret
kubectl create secret generic app-secret \
  --from-literal=jwt-secret=your_jwt_secret_key_here
```

### 2. 배포 실행

```bash
# Backend 배포
kubectl apply -f backend-deployment.yaml

# Frontend 배포
kubectl apply -f frontend-deployment.yaml

# Ingress 설정 (선택사항)
kubectl apply -f ingress.yaml
```

### 3. 상태 확인

```bash
# Pod 상태 확인
kubectl get pods

# Service 확인
kubectl get services

# 로그 확인
kubectl logs -f deployment/backend-deployment
kubectl logs -f deployment/frontend-deployment
```

### 4. 이미지 업데이트

```bash
# 이미지 태그 업데이트 후
kubectl set image deployment/backend-deployment backend=your-registry/backend:new-tag
kubectl set image deployment/frontend-deployment frontend=your-registry/frontend:new-tag
```

