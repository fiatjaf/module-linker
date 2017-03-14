const fetch = window.fetch

module.exports.composerurl = composerurl
function composerurl (moduleName) {
  if (moduleName.split('/').length === 1) {
    // composer packages are like `user-or-project/package`.
    // but sometimes there seems to be a random `php` required on composer.json.
    return Promise.reject()
  }

  return fetch(`https://githublinker.herokuapp.com/q/composer/${moduleName}`)
    .then(r => r.json())
    .then(({url}) => url)
    .catch(() => `https://packagist.org/packages/${moduleName}`)
}
