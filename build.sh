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
  echo "[init] Generate package.json from package.json.template..."
  NPM_VERSION_SUFFIX=`date +"%Y%m%d%H%M"`
  cp package.json.template package.json
  sed -i "s/%generateVersion%/${NPM_VERSION_SUFFIX}/" package.json

  echo "[init] Install yarn dependencies..."
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install"
}

build () {
  local extras=$1
  docker-compose run --rm \
    -u "$USER_UID:$GROUP_GID" \
    -e EXTRAS=$extras \
    node sh -c "npm run release:build"
}

watch () {
<<<<<<< HEAD
  docker-compose run --rm \
    -u "$USER_UID:$GROUP_GID" \
    -v $PWD/../$SPRINGBOARD:/home/node/$SPRINGBOARD \
    -e SPRINGBOARD=$SPRINGBOARD \
    node sh -c "npm run dev:watch"
=======
  docker-compose run \
    --rm \
    -v $PWD/../$SPRINGBOARD:/home/node/$SPRINGBOARD \
    -u "$USER_UID:$GROUP_GID" \
    node sh -c "node_modules/gulp/bin/gulp.js watch --springboard=/home/node/$SPRINGBOARD"
>>>>>>> 1f7f392 (fix: watch mode)
}

publish () {
  LOCAL_BRANCH=`echo $GIT_BRANCH | sed -e "s|origin/||g"`
  mkdir dist 2> /dev/null
  mkdir dist/template 2> /dev/null
  cp -R src/template/* cp -R dist/template/
  cp -R bundle/* cp -R dist/
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "npm publish --tag $LOCAL_BRANCH"
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