#!/bin/sh
if [ -f /.dockerenv ]; then
  npm i -g @nestjs/cli
  nest new ~/test-app --skip-git --skip-install --package-manager npm
  mkdir ./dist
  echo '{"repo": "~/test-app", "outDir": "./lib/", "importAliasSrcDir": "~server/"}' > ./dist/revortex.json
fi