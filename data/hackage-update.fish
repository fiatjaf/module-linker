set here (pwd)
mkdir -p $here/hackage-modules
rm -fr /tmp/hackage
mkdir /tmp/hackage
cd /tmp/hackage
wget https://hackage.haskell.org/packages/index.tar.gz -O hackage-all.tar.gz
tar -xvf hackage-all.tar.gz > /dev/null
rm hackage-all.tar.gz

for pack in (ls -r)
  echo $pack
  set vers (ls -t1 $pack/ | grep -v 'version' | tail -n 1)
  set modules (cat $pack/$vers/$pack.cabal | python3 $here/hackage-parse.py)
  for m in $modules
    echo $pack > "$here/hackage-modules/$m"
  end
end
