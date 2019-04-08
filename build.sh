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

build () {
  local extras=$1
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "node_modules/gulp/bin/gulp.js build ${extras}"
}

install () {
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "npm install"
}

watch () {
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "node_modules/gulp/bin/gulp.js watch --springboard=/home/node/$SPRINGBOARD"
}

publish () {
  LOCAL_BRANCH=`echo $GIT_BRANCH | sed -e "s|origin/||g"`
  docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "npm publish --tag $LOCAL_BRANCH"
}

for param in "$@"
do
  case $param in
    deps)
      install
      ;;
    build)
      build
      ;;
    install)
      install && build "--springboard=/home/node/${SPRINGBOARD}"
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