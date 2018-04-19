# Développement

Un Springboard doit être installé sur la machine locale.

### Build sur le springboard

*Note : l'option --springboard utilise par defaut le springboard recette. Le springboard doit se trouver dans le même dossier que entcore et infra-front.*

*Ne pas oublier d'ajouter le volume du springboard dans docker-compose.yml* :

    - ../nomDuSpringboard:/home/node/nomDuSpringboard

Dans le repo **infra-front** :

    ./build.sh --springboard=nomDuSpringboard install

Dans le repo **entcore** :

    ./build.sh --springboard=nomDuSpringboard clean infra install

Dans le **springboard** :

    rm -rf mods/*
    ./build.sh stop run buildFront buildLocalFront

### Watcher

Dans le repo **infra-front** :

    ./build.sh --springboard=nomDuSpringboard watch