terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "random_id" "suffix" {
  byte_length = 3
}

locals {
  suffix  = lower(random_id.suffix.hex)
  alb_name = "alb-verify-${local.suffix}"
  sg_name  = "alb-verify-${local.suffix}"
  tg_name  = "tg-eks-verify-${local.suffix}"
}

############################
# Security Group (TEMP direct)
############################
resource "aws_security_group" "alb" {
  name        = local.sg_name
  description = "ALB verify SG (direct access)"
  vpc_id      = var.vpc_id

  tags = { Name = local.sg_name }
}

resource "aws_security_group_rule" "ingress_80" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidrs
  description       = "Allow HTTP to ALB (verify)"
}

resource "aws_security_group_rule" "ingress_443" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidrs
  description       = "Allow HTTPS to ALB (verify)"
}

resource "aws_security_group_rule" "egress_all" {
  type              = "egress"
  security_group_id = aws_security_group.alb.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}

############################
# ALB (Internet-facing)
############################
resource "aws_lb" "verify" {
  name               = local.alb_name
  load_balancer_type = "application"
  internal           = false

  subnets         = var.public_subnet_ids
  security_groups = [aws_security_group.alb.id]

  tags = { Name = local.alb_name }
}

############################
# Target Group (EKS Pod IP)
############################
resource "aws_lb_target_group" "eks" {
  name        = local.tg_name
  target_type = "ip"

  protocol = "HTTP"
  port     = 80
  vpc_id   = var.vpc_id

  health_check {
    enabled  = true
    protocol = "HTTP"
    path     = var.health_check_path
    matcher  = "200-399"
  }

  tags = { Name = local.tg_name }
}

############################
# Listener :80 -> :443 Redirect (GUI와 동일)
############################
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.verify.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      protocol    = "HTTPS"
      port        = "443"
      status_code = "HTTP_301"
      host        = "#{host}"
      path        = "/#{path}"
      query       = "#{query}"
    }
  }
}

############################
# Listener :443 -> TG forward (fixed-response 없음)
############################
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.verify.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.acm_cert_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.eks.arn
  }
}
