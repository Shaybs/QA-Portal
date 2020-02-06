variable "region" {
}
variable "ami_id" {
}
variable "instance-type" {
}          
variable "pem-key" {
}               
variable "subnet_id" {
}              
variable "vpc_security_group_ids" {
}
variable "volume" {
}
variable "value" {
}


provider "aws" {
  region                  = var.region
  version                 = "~> 2.7"
  shared_credentials_file = "~/.aws/credentials"
}
module "infrastructure" {
  source                 = "../../modules/infrastructure"
  ami_id                 = var.ami_id
  instance-type          = var.instance-type
  pem-key                = var.pem-key
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.vpc_security_group_ids
  volume                 = var.volume
  value                  = var.value
}