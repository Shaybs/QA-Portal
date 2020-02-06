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
                            git checkout keycloak-testing
                            git pull origin keycloak-testing
                            '''
                    }

                }
                
                stage('---Prune, build and push images---'){
                    steps{
                            sh '''
                            pwd
                            cd /home/jenkins/QA-Portal
                            git checkout keycloak-testing
                            
                            docker-compose build
                            docker-compose push
                            '''

                    }
                }
                stage('---deploy---'){
                    steps{
                            sh '''ssh -t 35.178.114.39 << EOF
                            cd QA-Portal/
			    git pull origin keycloak-testing
                            #docker swarm init
                            ls

                            docker-compose up
                            #docker stack deploy --compose-file docker-compose.yml qa-portal-app
                            '''
                    }
                }
        }
}

