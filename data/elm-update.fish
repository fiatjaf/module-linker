set here (pwd)
mkdir -p elm-modules
rm -rf /tmp/elm
mkdir /tmp/elm
cd /tmp/elm
wget 'http://package.elm-lang.org/all-packages' -O elm-all.json
for pkg in (cat elm-all.json | jq -r '.[].name')
    echo $pkg
    set modules (curl --silent "http://package.elm-lang.org/packages/$pkg/latest/documentation.json" | jq -r '.[].name')
    for module in $modules
        echo $pkg > $here/elm-modules/$module
    end
    sleep 1
end
rm elm-all.json
