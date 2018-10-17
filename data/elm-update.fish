set here (pwd)
mkdir -p elm-modules
rm -rf /tmp/elm
mkdir /tmp/elm
cd /tmp/elm
wget 'http://package.elm-lang.org/all-packages' -O elm-all.json
for pkg in (cat elm-all.json | jq -r 'keys | .[]')
  echo "$pkg"
  set version (cat elm-all.json | jq -r --arg PKG "$pkg" '.[$PKG][-1]')
  echo "  version: $version"
  set desc (curl -s "https://raw.githubusercontent.com/$pkg/master/elm.json" | jq -rc '.summary' 2> /dev/null)
  if [ -z "$desc" ]
    set desc (curl -s "https://raw.githubusercontent.com/$pkg/master/elm-package.json" | jq -rc '.summary')
  end
  echo "  desc: $desc"
  echo "  modules:"
  for moduleName in (curl -s "https://package.elm-lang.org/packages/$pkg/$version/docs.json" | jq -rc '.[].name')
    echo "    $moduleName"
    echo $pkg > $here/elm-modules/$moduleName
    echo "|" >> $here/elm-modules/$moduleName
    echo $desc >> $here/elm-modules/$moduleName
  end
end
rm elm-all.json
