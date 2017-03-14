const fetch = window.fetch

module.exports.cratesurl = cratesurl
function cratesurl (moduleName) {
  return fetch(`https://githublinker.herokuapp.com/q/crates/${moduleName}`)
    .then(r => r.json())
    .then(({url}) => url)
    .catch(() => `https://crates.io/crates/${moduleName}`)
}
