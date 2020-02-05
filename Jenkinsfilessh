pipeline{
        agent any

        stages{

                stage('---deploy---'){
                    steps{
                            sh '''ssh -t 3.11.13.8 << EOF
                            cd QA-Portal/
			    git pull origin keycloak
                            #docker swarm init
                            ls
                            #docker stack deploy --compose-file docker-compose.yml qa-portal-app
                            '''
                    }
                }
        }
}

