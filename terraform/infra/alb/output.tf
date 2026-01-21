output "alb_dns_name" {
  value = aws_lb.verify.dns_name
}

output "alb_arn" {
  value = aws_lb.verify.arn
}

output "tg_arn" {
  value = aws_lb_target_group.eks.arn
}

output "verify_http_url" {
  value = "http://${aws_lb.verify.dns_name}/health?x=1"
}

output "verify_https_url" {
  value = "https://${aws_lb.verify.dns_name}/health?x=1"
}
