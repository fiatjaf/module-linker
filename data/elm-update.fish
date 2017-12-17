set here (pwd)
mkdir -p elm-modules
rm -rf /tmp/elm
mkdir /tmp/elm
cd /tmp/elm
wget 'http://package.elm-lang.org/all-packages' -O elm-all.json
for pkg in (cat elm-all.json | jq -r '.[].name')
  set desc (curl -s "http://package.elm-lang.org/packages/$pkg/latest/elm-package.json" | jq -rc '.summary')
  echo "$pkg: $desc"
  for moduleName in (curl -s "http://package.elm-lang.org/packages/$pkg/latest/documentation.json" | jq -rc '.[].name')
    echo "  $moduleName"
    echo $pkg > $here/elm-modules/$moduleName
    echo "|" >> $here/elm-modules/$moduleName
    echo $desc >> $here/elm-modules/$moduleName
  end
end
rm elm-all.json
