pipeline{
        agent any

        stages{


                stage('--- update repo and export build number---'){
                    steps{
                            sh ''' export build="${BUILD_NUMBER}"
                            cd ~/
                            pwd
                            echo "/home/jenkins/QA-Portal"
                            cd QA-Portal/
                            git checkout keycloak
                            git pull origin keycloak
                            '''
                    }

                }
                
                stage('---Prune, build and push images---'){
                    steps{
                            sh '''
                            pwd
                            cd /home/jenkins/QA-Portal
                            git checkout keycloak
                            docker-compose build
                            docker-compose push
                            '''

                    }
                }
                stage('---deploy---'){
                    steps{
                            sh '''ssh -t 3.11.121.112 << EOF
                            cd QA-Portal/
			    git pull origin keycloak
                            #docker swarm init
                            ls
                            docker rm -f $(docker ps -qa)
                            docker image prune -af
                            #docker-compose up
                            docker stack deploy --compose-file docker-compose.yml qa-portal-app
                            '''
                    }
                }
        }
}

