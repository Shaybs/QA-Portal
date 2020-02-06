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
<<<<<<< HEAD
                            git checkout keycloak-testing
                            
=======
                            git checkout keycloak
>>>>>>> 1f97b1d67f3fe925a4806d15669563d8026c4173
                            docker-compose build
                            docker-compose push
                            '''

                    }
                }
                stage('---deploy---'){
                    steps{
<<<<<<< HEAD
                            sh '''ssh -t 35.178.114.39 << EOF
=======
                            sh '''ssh -t 3.11.121.112 << EOF
>>>>>>> 1f97b1d67f3fe925a4806d15669563d8026c4173
                            cd QA-Portal/
			    git pull origin keycloak-testing
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

