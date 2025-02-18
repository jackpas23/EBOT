#!/bin/bash

##In firefox extensions add the manfiest, if snap requires different path

if test -e "~/.mozilla/native-messaging-hosts"; then
  echo "Path exists"
else
  mkdir -p "~/.mozilla/native-messaging-hosts"
fi
sed -i "s|\USER|$(whoami)|g" ./host/bbot_host.json

