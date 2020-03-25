# infra-front : Open Digital Education Framework

infra-front is the Open Digital Education (ODE) frontend framework. 
It is wriiten in typescript and it provides features and components to build and run ODE applications :

- angularJS bootstrap and (light) abstraction (Model, Controllers and Direcctives injection)
- portal theming (skin, assets overriding, SASS extensions for applications ...)
- widgets management
- sniplets management (sniplets are small and dynamic pieces of UI useful to mix contents from different applications)
- user session and rights managment
- collections of UI components + domain specific components
- advanced multi-media components : RTE, Image Editor, Sound Recorder, Media Librairy
- animation library

## Install

Install and configure the following projects in the same root direectory.

### 1. ENT Core

```bash
git clone git@github.com:entcore/entcore.git
./build.sh install
```

### 2. Springboard

https://opendigitaleducation.gitbooks.io/reference-manual/content/first-steps/install-with-docker.html

In `docker-compose.yml` add the following volume mapping for `node` container :

```yml
../yourSpringboard:/home/node/yourSpringboard
```

### 3. infra-front

```bash
git clone git@github.com:entcore/infra-front.git
```

In `docker-compose.yml` add the same (than in Springboard) volume mapping for `node` container :

```bash
../yourSpringboard:/home/node/yourSpringboard
```

## Run (watch) and develop 

1. under **/infra-front** run  
    ```bash
    ./build.sh --springboard=yourSpringboard install
    ./build.sh --springboard=yourSpringboard watch
    ```

2. under **/yourSpringboard** run 
    ```bash
    ./build.sh run
    ```

### 4. Audio recorder (Dictaphone)

During development, if you're using docker to run your springboard please open port 6502 to use audio recorder in your vertx container configuration by adding following port mapping:

```
- "6502:6502"
```
