pipeline{
        agent any

        stages{

                stage('--- git pull---'){
                    steps{
                            sh ''' git clone https://github.com/Shaybs/QA-Portal.git "
                            git fetch
                            git checkout convert-to-stack
                            '''
                    }

                }
            

                stage('--- update repo and export build number---'){
                    steps{
                            sh ''' export build="${BUILD_NUMBER}"
                            cd ~/
                            cd QA-Portal/
                            git pull origin convert-to-stack
                            '''
                    }

                }
                
                stage('---Prune, build and push images---'){
                    steps{
                            sh ''' docker system prune -af
                            docker-compose build
                            docker-compose push
                            '''

                    }
                }
                stage('---deploy---'){
                    steps{
                            sh '''ssh -t 
                            cd QA-Portal/
                            docker-compose up -d 
                            # docker swarm init
                            # docker stack deploy --compose-file QA-portal/docker-compose.yaml qa-portal-app
                            '''
                    }
                }
        }
}

