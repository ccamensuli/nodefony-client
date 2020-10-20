#!/usr/bin/env bash

outdated_packages () {
  cd $pathproject
  echo "Do you wish to search outdated packages nodefony $version ?"
  select yn in "Yes" "No"; do
    case $yn in
      Yes )
        nodefony outdated ;
        break ;;
      No )
        break ;;
    esac
  done
}

npm_publish () {
  cd $1 ;
  #npm_version;
  echo "Build $1 DIRECTORY";
  build;
  sleep 2;
  #npm publish --access=public;
}

npm_version () {
  if [ $1 ]
  then
    npm version $1 --allow-same-version --git-tag-version false
  else
    npm version $version --allow-same-version --git-tag-version false
  fi
}

generate_changelog () {
  cd $pathproject
  mv CHANGELOG.md CHANGELOG.md.old
  if [ $1 ]
  then
    ./node_modules/.bin/gren changelog --username=nodefony  --repo=nodefony-client --tags=$1 --data-source=commits --generate  --override
  else
    ./node_modules/.bin/gren changelog --username=nodefony  --repo=nodefony-client --tags=v$version --data-source=commits --generate  --override
  fi
  sed -i "" 's,# Changelog,---,g' CHANGELOG.md.old
  echo >> CHANGELOG.md;
  cat CHANGELOG.md.old >> CHANGELOG.md ;
  rm CHANGELOG.md.old ;
}

build(){
  rm -rf node_modules ;
  rm -f package.lock.json;
  rm -f yarn.lock;
  yarn;
  npm install;
  sleep 2;
  echo "Build webpackck nodefony-client";
  npm run build
}


menu () {
  declare -a commands=("build" "publish" "changelog" "Quit");
  # MENU
  select yn in ${commands[@]}; do
    case $yn in
      "publish" )
        npm_publish ;
        break ;;
      "build" )
        build ;
        break ;;
      "Quit" )
        exit;
    esac
  done
}


##########
#  Main  #
##########
clear;

cli=$(pwd)/bin/cli;
version=$($cli);
pathproject=$(pwd);
pathdemo=$(pwd)"/demo";
declare -a packages=();

echo "
 _   _    ___    ____    _____   _____    ___    _   _  __   __
| \ | |  / _ \  |  _ \  | ____| |  ___|  / _ \  | \ | | \ \ / /
|  \| | | | | | | | | | |  _|   | |_    | | | | |  \| |  \ V /
| |\  | | |_| | | |_| | | |___  |  _|   | |_| | | |\  |   | |
|_| \_|  \___/  |____/  |_____| |_|      \___/  |_| \_|   |_|

    version : $version
    GIT tags :
`git tag`
    GIT status :
`git status`
";

# PARSE ARGS
case $1 in
  "publish" )
    npm_publish $pathproject ;
    break ;;
  "changelog" )
    generate_changelog $2;
    break ;;
  "build" )
    build;
    break ;;
  "publish_nodefony" )
    publish_nodefony;
    break ;;
  * )
    echo "
    __  __
   |  \/  |   ___   _ __    _   _
   | |\/| |  / _ \ | '_ \  | | | |
   | |  | | |  __/ | | | | | |_| |
   |_|  |_|  \___| |_| |_|  \__,_|

    ";
    menu;
    break ;;
esac
