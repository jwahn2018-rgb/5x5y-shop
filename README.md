# 쇼핑몰 시스템

쿠버네티스 + CI/CD + MySQL 기반의 쇼핑몰 시스템입니다.

## 프로젝트 구조

```
.
├── frontend/          # React 프론트엔드
├── backend/           # Node.js 백엔드 API
├── k8s/              # Kubernetes 매니페스트
├── database/         # 데이터베이스 스키마
├── Jenkinsfile       # Jenkins 파이프라인
└── argocd/           # ArgoCD 설정
```

## 기술 스택

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Axios

### Backend
- Node.js 18
- Express
- MySQL2
- JWT 인증
- bcryptjs

### Infrastructure
- Docker
- Kubernetes
- Nginx
- Jenkins
- ArgoCD

## 시작하기

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p < database/schema.sql
```

### 2. 환경 변수 설정

#### Backend
```bash
cd backend
cp .env.example .env
# .env 파일을 수정하세요
```

#### Frontend
개발 모드에서는 Vite의 프록시 설정을 사용합니다.

### 3. 로컬 개발

#### Backend 실행
```bash
cd backend
npm install
npm run dev
```

#### Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

### 4. Docker 빌드

#### Frontend
```bash
cd frontend
docker build -t frontend:latest .
```

#### Backend
```bash
cd backend
docker build -t backend:latest .
```

### 5. Kubernetes 배포

```bash
# Secrets 생성
kubectl create secret generic db-secret \
  --from-literal=host=mysql-service \
  --from-literal=port=3306 \
  --from-literal=user=root \
  --from-literal=password=your_password \
  --from-literal=database=shopping_mall

kubectl create secret generic app-secret \
  --from-literal=jwt-secret=your_jwt_secret_key

# 배포
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## CI/CD

### Jenkins
Jenkinsfile을 사용하여 자동 빌드 및 배포를 설정할 수 있습니다.

### ArgoCD
ArgoCD를 사용하여 GitOps 방식으로 배포를 관리합니다.

## 주요 기능

- [x] 메인 페이지 (랜덤 상품, 광고, 검색, 카테고리)
- [x] 상품 상세 페이지
- [x] 장바구니
- [x] 사용자 인증
- [x] 파트너사 페이지 (기본 구조)
- [ ] 주문/결제
- [ ] 마이페이지
- [ ] 리뷰 시스템

## 라이선스

MIT

