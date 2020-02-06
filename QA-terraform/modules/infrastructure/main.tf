module "ec2" {
    source                 = "./ec2"
    ami_id                 = var.ami_id
    instance-type          = var.instance-type
    pem-key                = var.pem-key
    subnet_id              = var.subnet_id
    vpc_security_group_ids = var.vpc_security_group_ids
    volume                 = var.volume
    value                  = var.value
}

