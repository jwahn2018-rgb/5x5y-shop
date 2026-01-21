variable "cluster_name" {
  default = "eks-cluster"
}

variable "vpc_id" {
  default = "vpc-0168a89e19241e267"
}

variable "private_subnets" {
  default = [
    "subnet-0e2319f6fc4ac049b", # usinsa-private-2a
    "subnet-053c2baca72350359" # usinsa-private-2b
  ]
}
