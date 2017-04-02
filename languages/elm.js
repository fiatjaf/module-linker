const $ = window.jQuery

const text = require('../helpers').text
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let match = line.match(/^import +([^ ]+)/)
    if (!match) return

    let moduleName = match[1]
    text(`https://raw.githubusercontent.com/fiatjaf/module-linker/backends/data/elm-modules/${moduleName}`)
      .then(packageName => {
        createLink(elem, moduleName, `http://package.elm-lang.org/packages/${packageName}/latest/${moduleName.split('.').join('-')}`)
      })
  })
}
