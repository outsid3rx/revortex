#!/bin/bash

branch=$1
regex="v([0-9].[0-9].[0-9])"

if [[ $branch =~ $regex ]]; then
  version="${BASH_REMATCH[1]}"
  npm pkg set version="$version"
fi