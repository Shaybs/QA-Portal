pipeline{
        agent any

        stages{

                stage('---deploy---'){
                    steps{
                            sh '''ssh -t 35.178.117.104 << EOF
                            cd QA-Portal/
			    git pull origin convert-to-stack
                            docker swarm init
                            docker stack deploy --compose-file QA-portal/docker-compose.yaml qa-portal-app
                            '''
                    }
                }
        }
}

