const external = require('../helpers').external

module.exports.composerurl = composerurl
function composerurl (moduleName) {
  if (moduleName === 'php') {
    // package requires specific PHP version
    // ignore this when parsing
    return Promise.reject()
  }

  if (moduleName.startsWith('ext-') && moduleName.split('/').length === 1) {
    // package require specific PHP extension
    // link it to PHP documentation website
    let ext = moduleName.split('-')[1].toLowerCase()
    return Promise.resolve({
      url: `https://www.php.net/manual/en/book.${ext}.php`,
      kind: 'stdlib'
    })
  }

  // package require normal Composer package
  // link it to Packagist
  return external('composer', moduleName)
    .catch(() => ({
      url: `https://packagist.org/packages/${moduleName}`,
      kind: 'maybe'
    }))
}
