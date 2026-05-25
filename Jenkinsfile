pipeline {
    agent any

    environment {
        S3_BUCKET = 'cinema-frontend-s3' 
        AWS_REGION = 'us-east-2' 
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install') {
            steps {
                dir('cinema-frontend') {
                    // Instala las dependencias de Node
                    sh 'npm ci' 
                }
            }
        }

        stage('Build') {
            steps {
                dir('cinema-frontend') {
                    // Compila el proyecto de Angular para producción
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy to S3') {
            steps {
                dir('cinema-frontend') {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-s3-credentials'
                    ]]) {
                        sh '''
                            BUILD_PATH="dist/cinema-frontend/browser"

                            # Subir assets con cache larga (1 año)
                            aws s3 sync $BUILD_PATH/ s3://$S3_BUCKET \
                                --region $AWS_REGION \
                                --delete \
                                --cache-control 'max-age=31536000,public' \
                                --exclude 'index.html'
                            
                            # index.html sin cache
                            aws s3 cp $BUILD_PATH/index.html s3://$S3_BUCKET/index.html \
                                --region $AWS_REGION \
                                --cache-control 'no-cache,no-store,must-revalidate'
                        '''
                    }
                }
            }
        }
    }

    post {
        failure { echo 'El pipeline del frontend falló' }
        success { echo 'Frontend de la plataforma desplegado en S3 exitosamente' }
    }
}