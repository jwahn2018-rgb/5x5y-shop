# ============================================================
# Terraform Variables - WireGuard VPN (vpn.tf 전용)
# 
# 이 파일은 vpn.tf에서만 사용하는 WireGuard VPN 관련 변수를
# 별도로 정의합니다.
# ============================================================

# ============================================================
# 1. EC2 인스턴스 타입
# ============================================================
variable "instance_type" {
  description = "EC2 instance type for WireGuard bastion"
  type        = string
  default     = "t3.micro"
  
  # 설명:
  # - WireGuard 서버로 사용할 EC2 인스턴스 타입
  # - t3.micro = AWS 프리티어 지원, 1vCPU, 1GB RAM
  # 
  # 선택 옵션:
  # - t3.micro    : 개인/테스트 (1vCPU, 1GB) - 프리티어
  # - t3.small    : 소규모 (1vCPU, 2GB)
  # - t3.medium   : 중규모 (2vCPU, 4GB)
  # - t3.large    : 대규모 (2vCPU, 8GB)
  # - t4g.micro   : Graviton 프로세서 (더 저렴)
  # 
  # 비용:
  # - t3.micro: 월 ~$9
  # - t3.small: 월 ~$19
  # 
  # WireGuard 성능 기준:
  # - 클라이언트 < 50명: t3.micro 충분
  # - 클라이언트 < 200명: t3.small 권장
  # - 클라이언트 > 200명: t3.medium 이상 권장
  # 
  # 사용처:
  # - vpn.tf: aws_instance.wireguard_2a/2b의 instance_type
  # 
  # 변경 예시:
  # terraform apply -var="instance_type=t3.small"
  
  # Validation: t-타입만 허용
  validation {
    condition     = can(regex("^t[234]\\.", var.instance_type))
    error_message = "Instance type must be a t-type (t3, t4g, etc.)"
  }
}

# ============================================================
# 2. WireGuard VPN 활성화 여부
# ============================================================
variable "enable_wireguard" {
  description = "Enable WireGuard VPN deployment"
  type        = bool
  default     = true
  
  # 설명:
  # - WireGuard VPN 배포 활성화 여부
  # - true: VPN 서버 생성
  # - false: VPN 서버 생성 안 함 (향후 확장성 고려)
  # 
  # 사용 사례:
  # - Development 환경: true (VPN 필요)
  # - Production 환경: 상황에 따라 결정
  # 
  # 사용처:
  # - vpn.tf에서 count나 dynamic 블록으로 조건부 배포
  # (현재는 사용 안 함, 향후 추가 가능)
  # 
  # 변경 예시:
  # terraform apply -var="enable_wireguard=false"  # 배포 중지
}

# ============================================================
# 3. WireGuard 프로토콜 설정
# ============================================================
variable "wireguard_config" {
  description = "WireGuard configuration"
  type = object({
    port = number
    mtu  = number
  })
  
  default = {
    port = 51820
    mtu  = 1420
  }
  
  # 설명:
  # - WireGuard 프로토콜 설정을 객체(object) 타입으로 정의
  # - 복수의 관련 설정값을 하나의 변수로 관리
  # 
  # 세부 설정:
  # 
  # 1. port = 51820
  #    - WireGuard가 LISTEN할 UDP 포트
  #    - 기본값: 51820 (WireGuard 표준)
  #    - 변경 가능: 1024 ~ 65535 (1024 이하는 root 권한 필요)
  #    - 보안 팁: 21820, 42820 등으로 변경해서 스캔 회피 가능
  #    - 클라이언트 설정에도 반영해야 함
  # 
  # 2. mtu = 1420
  #    - Maximum Transmission Unit (최대 전송 단위)
  #    - 단위: bytes (바이트)
  #    - 일반적인 MTU: 1500 bytes
  #    - WireGuard 오버헤드 고려: 1420 ~ 1280 권장
  #    - 1420: 일반 인터넷 환경
  #    - 1280: 해외 연결 또는 느린 네트워크
  #    - 너무 작으면: 성능 저하
  #    - 너무 크면: 패킷 손실
  # 
  # 사용처:
  # - vpn.tf: wireguard_setup.sh에 전달
  # - wireguard_setup.sh: wg0.conf 생성 시 사용
  # 
  # 변경 예시:
  # terraform apply -var='wireguard_config={port=21820, mtu=1280}'
  
  # Validation: 포트 범위 검증
  validation {
    condition     = var.wireguard_config.port >= 1024 && var.wireguard_config.port <= 65535
    error_message = "WireGuard port must be between 1024 and 65535."
  }
  
  # 참고:
  # - 1024 이상을 권장하는 이유: root 권한 불필요
  # - 1 ~ 1023은 Well-known ports (시스템 포트)
}

# ============================================================
# 4. SSH 접근 제어 (CIDR 블록)
# ============================================================
variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access to WireGuard bastion"
  type        = list(string)
  default     = ["0.0.0.0/0"]
  
  # 설명:
  # - WireGuard 서버에 SSH로 접근 가능한 IP 범위
  # - list(string) = 여러 개의 CIDR 블록을 리스트로 정의
  # 
  # ⚠️ 주의! 기본값이 매우 위험함:
  # - ["0.0.0.0/0"] = 모든 IP에서 접속 가능 (보안상 위험!)
  # - 반드시 특정 IP로 제한할 것을 강력 권고!
  # 
  # 보안 권장 설정:
  # 
  # 예시 1: 회사 고정 IP만
  # allowed_ssh_cidrs = ["203.0.113.0/32"]
  # 
  # 예시 2: 여러 위치
  # allowed_ssh_cidrs = [
  #   "203.0.113.0/32",    # 회사 사무실
  #   "198.51.100.0/24",   # 회사 VPN
  #   "192.0.2.100/32"     # 개인 IP
  # ]
  # 
  # 예시 3: 회사 네트워크 대역
  # allowed_ssh_cidrs = ["10.0.0.0/8"]
  # 
  # 참고: CIDR 표기법
  # - 192.168.1.100/32 = 단일 IP (정확한 하나)
  # - 192.168.1.0/24 = 192.168.1.0 ~ 192.168.1.255 (256개)
  # - 192.168.0.0/16 = 192.168.0.0 ~ 192.168.255.255 (65,536개)
  # 
  # 사용처:
  # - vpn.tf: aws_security_group_rule.wireguard_ssh의 cidr_blocks
  # 
  # 변경 예시:
  # terraform apply -var='allowed_ssh_cidrs=["203.0.113.0/32"]'
  
  # Validation: 모든 요소가 유효한 CIDR 형식인지 검증
  validation {
    condition = alltrue([
      for cidr in var.allowed_ssh_cidrs : can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", cidr))
    ])
    error_message = "All allowed_ssh_cidrs must be valid CIDR blocks."
  }
}

# ============================================================
# 5. WireGuard 클라이언트 설정
# ============================================================
variable "wireguard_client_configs" {
  description = "WireGuard client configurations to generate"
  type = map(object({
    address = string
  }))
  
  default = {
    client1 = {
      address = "10.0.0.2/32"
    }
    client2 = {
      address = "10.0.0.3/32"
    }
  }
  
  # 설명:
  # - WireGuard 클라이언트들의 설정
  # - map(object) = 여러 클라이언트를 map으로 관리
  # 
  # 기본값 분석:
  # 
  # client1:
  #   address = "10.0.0.2/32"
  #   └─ 클라이언트1의 VPN IP 주소
  #      10.0.0.2/32 = 10.0.0.2 (정확한 하나의 IP)
  #      32 = 호스트 IP (서브넷 마스크 255.255.255.255)
  # 
  # client2:
  #   address = "10.0.0.3/32"
  #   └─ 클라이언트2의 VPN IP 주소
  # 
  # VPN IP 주소 풀:
  # - 서버: 10.0.0.1
  # - 클라이언트1: 10.0.0.2
  # - 클라이언트2: 10.0.0.3
  # - 클라이언트3: 10.0.0.4 (추가할 경우)
  # 
  # 중요!
  # - 각 클라이언트는 고유한 IP를 가져야 함
  # - 범위: 10.0.0.2 ~ 10.0.0.254 (254개까지 가능)
  # 
  # 클라이언트 추가 방법:
  # 
  # 방법 1: 변수 파일에서 수정
  # wireguard_client_configs = {
  #   client1 = { address = "10.0.0.2/32" }
  #   client2 = { address = "10.0.0.3/32" }
  #   client3 = { address = "10.0.0.4/32" }
  #   client4 = { address = "10.0.0.5/32" }
  # }
  # 
  # 방법 2: 커맨드 라인
  # terraform apply \
  #   -var='wireguard_client_configs={
  #     client1={address="10.0.0.2/32"},
  #     client2={address="10.0.0.3/32"}
  #   }'
  # 
  # 사용처:
  # - vpn.tf: wireguard_setup.sh에 전달 (향후 확장 가능)
  # - wireguard_setup.sh: wg0.conf에서 Peer 설정 생성
  # 
  # 참고:
  # - 현재는 선언만 되어 있고, 실제 사용은 wireguard_setup.sh에서
  # - Terraform으로 동적으로 peer를 생성할 수도 있음
}

# ============================================================
# 6. 공통 리소스 태그
# ============================================================
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  
  default = {
    Environment = "dev"
    Project     = "usinsa"
    ManagedBy   = "terraform"
  }
  
  # 설명:
  # - 모든 AWS 리소스에 적용할 공통 태그
  # - map(string) = key-value 쌍의 맵
  # 
  # 기본값:
  # 
  # Environment = "dev"
  #   └─ 환경 구분
  #      dev = 개발 환경
  #      stg = 스테이징 환경
  #      prd = 프로덕션 환경
  # 
  # Project = "usinsa"
  #   └─ 프로젝트명
  #      비용 분석, 리소스 그룹화에 유용
  # 
  # ManagedBy = "terraform"
  #   └─ 관리 도구 표시
  #      terraform = Terraform으로 관리
  #      manual = 수동으로 관리
  #      cloudformation = CloudFormation으로 관리
  # 
  # AWS 비용 분석 활용:
  # - AWS Cost Explorer에서 태그별 비용 추적 가능
  # - 예: Environment별로 비용 분리
  # 
  # 추가 권장 태그:
  # 
  # tags = {
  #   Environment = "dev"
  #   Project     = "usinsa"
  #   ManagedBy   = "terraform"
  #   Owner       = "platform-team"   # 담당자
  #   CostCenter  = "engineering"     # 비용 센터
  #   CreatedDate = "2024-12-30"      # 생성일
  # }
  # 
  # 사용처:
  # - vpn.tf: 모든 리소스의 tags 속성
  # 
  # 변경 예시:
  # terraform apply -var='tags={Environment="prd",Project="usinsa",ManagedBy="terraform"}'
  # 
  # 팁:
  # - main.tf의 리소스도 이 변수를 사용하도록 통일하면 관리 편함
  # - 예: tags = merge(var.tags, { Name = "..." })
}
