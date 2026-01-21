variable "region" {
  type    = string
  default = "ap-northeast-2"
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  description = "Internet-facing ALB용 퍼블릭 서브넷 2개 이상(AZ 분산)"
  type        = list(string)
}

variable "acm_cert_arn" {
  description = "Issued 상태의 ACM 인증서 ARN"
  type        = string
}

variable "allowed_cidrs" {
  description = "임시 검증용 ALB 접근 허용 CIDR (가능하면 내 공인IP/32)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "health_check_path" {
  type    = string
  default = "/health"
}

variable "ssl_policy" {
  type    = string
  default = "ELBSecurityPolicy-TLS13-1-2-Res-2025-09"
}
