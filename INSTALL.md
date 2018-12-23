# Install

Install and configure the following projects in the same root directory.

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
