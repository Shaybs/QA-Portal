resource "aws_instance" "Instances" {
  ami                    = var.ami_id
  instance_type          = var.instance-type
  key_name               = var.pem-key
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.vpc_security_group_ids
  count                  = var.value
  root_block_device {


    volume_size = var.volume

  }

}
