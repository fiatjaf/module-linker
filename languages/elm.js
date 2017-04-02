const $ = window.jQuery

const text = require('../helpers').text
const json = require('../helpers').json
const bloburl = require('../helpers').bloburl
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let match = line.match(/^import +([^ ]+)/)
    if (!match) return

    let moduleName = match[1]

    // search for this module on our sub-index of package.elm-lang.org
    Promise.resolve()
    .then(() =>
      text(`https://raw.githubusercontent.com/fiatjaf/module-linker/backends/data/elm-modules/${moduleName}`)
    )
    .then(packageName => ({
      url: `http://package.elm-lang.org/packages/${packageName}/latest/${moduleName.split('.').join('-')}`,
      kind: 'docs'
    }))
    .catch(() => {
      // if it fails, we'll try a local module
      let {user, repo, ref} = window.pathdata
      return json(
        `https://raw.githubusercontent.com/${user}/${repo}/${ref}/elm-package.json`)
      .then(metadata => {
        let srcdir = metadata['source-directories'][0]
        let {user, repo, ref} = window.pathdata
        return bloburl(user, repo, ref,
          srcdir + '/' + moduleName.split('.').join('/') + '.elm')
      })
    })
    .then(info => { createLink(elem, moduleName, info) })
  })
}
