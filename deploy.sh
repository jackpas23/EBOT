#!/bin/bash

##In firefox extensions add the manfiest, if snap requires different path
if snap list | grep -q firefox; then
   mkdir  "$HOME/snap/firefox/common/.mozilla/native-messaging-hosts"
##need to flesh this out, just not concern now
else
   echo "firefox not installed with snap"
if test -e "$HOME/.mozilla/native-messaging-hosts"; then
  echo "Path exists"
else
  mkdir -p "$HOME/.mozilla/native-messaging-hosts"
fi
sed -i "s|\USER|$(whoami)|g" ./host/bbot_host.json
cp ./host/bbot_host.json ~/.mozilla/native-messaging-hosts
chmod +x ./host/bbot_host.py
pipx install bbot
