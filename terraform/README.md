# AWS Infrastructure Terraform Configuration

이 Terraform 구성은 AWS에 다음과 같은 인프라를 생성합니다:

## 구성 요소

### VPC
- **이름**: usinsa
- **CIDR**: 10.0.0.0/16
- **리전**: ap-northeast-2 (서울)

### 서브넷
#### Public Subnets
- **usinsa-public-2a**: 10.0.0.0/20 (ap-northeast-2a)
- **usinsa-public-2b**: 10.0.16.0/20 (ap-northeast-2b)

#### Private Subnets
- **usinsa-private-2a**: 10.0.128.0/20 (ap-northeast-2a)
- **usinsa-private-2b**: 10.0.144.0/20 (ap-northeast-2b)

### 네트워크 구성
- **Internet Gateway**: usinsa-igw (퍼블릭 서브넷 인터넷 연결)
- **VPC Endpoint**: S3용 게이트웨이 엔드포인트

### 라우팅 테이블
- **usinsa-public-rt**: 퍼블릭 서브넷용 (IGW로 라우팅)
- **usinsa-private-rt1**: Private 2a 서브넷용
- **usinsa-private-rt2**: Private 2b 서브넷용

## 사용 방법

### 1. 초기화
```bash
terraform init
```

### 2. 계획 확인
```bash
terraform plan
```

### 3. 적용
```bash
terraform apply
```

### 4. 삭제
```bash
terraform destroy
```

## 파일 구조
- `main.tf`: 주요 리소스 정의
- `variables.tf`: 변수 정의
- `outputs.tf`: 출력 값 정의

## 주의사항
- AWS 자격 증명이 올바르게 구성되어 있어야 합니다
- ap-northeast-2 (서울) 리전을 사용합니다
- 실제 환경에 배포하기 전에 반드시 `terraform plan`으로 검토하세요
