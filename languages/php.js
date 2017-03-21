const external = require('../helpers').external

module.exports.composerurl = composerurl
function composerurl (moduleName) {
  if (moduleName.split('/').length === 1) {
    // composer packages are like `user-or-project/package`.
    // but sometimes there seems to be a random `php` required on composer.json.
    return Promise.reject()
  }

  return external('composer', moduleName)
    .catch(() => ({
      url: `https://packagist.org/packages/${moduleName}`,
      kind: 'maybe'
    }))
}
