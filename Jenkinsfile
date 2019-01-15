#!/usr/bin/env groovy

pipeline {
  agent any
    stages {
      stage('Init') {
        steps {
          checkout scm
          sh './build.sh deps'
        }
      }
      stage('Build') {
        steps {
          sh './build.sh build'
        }
      }
      stage('Publish') {
        steps {
          configFileProvider([configFile(fileId: '.npmrc-infra-front', variable: 'NPMRC')]) {
            sh 'cp $NPMRC .npmrc'
            sh './build.sh publish'
          }
        }
      }
    }
}

