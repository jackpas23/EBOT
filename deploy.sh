##In firefox extensions add the manfiest, if snap requires different path




if test -e "$HOME/.mozilla/native-messaging-hosts"; then

  echo "Path exists"

else


  mkdir -p "$HOME/.mozilla/native-messaging-hosts"

fi

sed -i "s|\USER|$(whoami)|g" ./host/bbot_host.json


cp ./host/bbot_host.json ~/.mozilla/native-messaging-hosts


chmod +x ./host/bbot_host.py


pipx install bbot
