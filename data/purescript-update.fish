mkdir -p pursuit

for packageURL in (curl --silent --location 'https://pursuit.purescript.org/' | pup '.multi-col__col:not(:first-child) li a json{}' | jq -r '.[].href')
  echo $packageURL
  for moduleURL in (
    curl --silent --location $packageURL | pup '.grouped-list .grouped-list__item a[href*="/docs/"] json{}' | jq -r '.[].href'
  )
    echo "  $moduleURL"
    set moduleName (echo $moduleURL | string split '/' | tail -n 1)
    set version (echo $moduleURL | string split '/' | tail -n 3 | head -n 1)
    set packageName (echo $moduleURL | string split '/' | tail -n 4 | head -n 1)

    echo "$packageName@$version" > "pursuit/$moduleName"
    sleep 1
  end
  sleep 1
end
