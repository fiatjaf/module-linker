const external = require('../helpers').external

var waiting = {} // a cache of promises to php external modules
module.exports.composerurl = composerurl
function composerurl (moduleName) {
  if (moduleName.split('/').length === 1) {
    // composer packages are like `user-or-project/package`.
    // but sometimes there seems to be a random `php` required on composer.json.
    return Promise.reject()
  }

  if (!waiting[moduleName]) {
    waiting[moduleName] = external('composer', moduleName)
      .then(({url}) => url)
      .catch(() => `https://packagist.org/packages/${moduleName}`)
  }

  return waiting[moduleName]
}
