#!/bin/bash

if [ ! -e node_modules ]
then
  mkdir node_modules
fi

if [ -z ${USER_UID:+x} ]
then
  export USER_UID=1000
  export GROUP_GID=1000
fi

# options
SPRINGBOARD="recette"
for i in "$@"
do
case $i in
    -s=*|--springboard=*)
    SPRINGBOARD="${i#*=}"
    shift
    ;;
    *)
    ;;
esac
done

clean () {
  rm -rf node_modules
  rm -rf bundle
  rm -rf dist
  rm -f yarn.lock
}

init () {
  BRANCH_NAME=`echo $GIT_BRANCH | sed -e "s|origin/||g"`
  if [ "$BRANCH_NAME" = "" ]; then
    echo "[init] Get branch name from git..."
    BRANCH_NAME=`git branch | sed -n -e "s/^\* \(.*\)/\1/p"`
  fi

  echo "[init] Generate package.json from package.json.template..."
  NPM_VERSION_SUFFIX=`date +"%Y%m%d%H%M"`
  cp package.json.template package.json
  sed -i "s/%generateVersion%/${NPM_VERSION_SUFFIX}/" package.json
  sed -i "s/%branch%/${BRANCH_NAME}/" package.json

  echo "[init] Install yarn dependencies..."
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install"
}

build () {
  local extras=$1
  docker-compose run --rm \
    -u "$USER_UID:$GROUP_GID" \
    -e EXTRAS=$extras \
    node sh -c "pnpm run release:build"
}

watch () {
  docker-compose run --rm \
    -u "$USER_UID:$GROUP_GID" \
    -v $PWD/../$SPRINGBOARD:/home/node/$SPRINGBOARD \
    -e SPRINGBOARD=$SPRINGBOARD \
    node sh -c "pnpm run dev:watch"
}

publish () {
  LOCAL_BRANCH=`echo $GIT_BRANCH | sed -e "s|origin/||g"`
  mkdir dist 2> /dev/null
  mkdir dist/template 2> /dev/null
  cp -R src/template/* cp -R dist/template/
  cp -R bundle/* cp -R dist/
  
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "pnpm publish --no-git-checks --tag $LOCAL_BRANCH"
}

for param in "$@"
do
  case $param in
    clean)
      clean
      ;;
    init)
      init
      ;;
    build)
      build
      ;;
    install)
      init && build "--springboard=../${SPRINGBOARD}"
      ;;
    watch)
      watch
      ;;
    publish)
      publish
      ;;
    *)
      echo "Invalid argument : $param"
  esac
  if [ ! $? -eq 0 ]; then
    exit 1
  fi
done
