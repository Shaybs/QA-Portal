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
                            git checkout convert-to-stack
                            git pull origin convert-to-stack
                            '''
                    }

                }
                
                stage('---Prune, build and push images---'){
                    steps{
                            sh '''
                            pwd
                            cd /home/jenkins/QA-Portal
                            git checkout convert-to-stack
                            
                            docker-compose build
                            docker-compose push
                            '''

                    }
                }
                stage('---deploy---'){
                    steps{
                            sh '''ssh -t 35.178.117.104 << BOB
                            cd QA-Portal/
			    git pull origin convert-to-stack
                            docker swarm init
                            docker stack deploy --compose-file QA-portal/docker-compose.yaml qa-portal-app
                            '''
                    }
                }
        }
}

