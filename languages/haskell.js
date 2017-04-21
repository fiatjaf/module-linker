const $ = window.jQuery

const text = require('../helpers').text
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let match = line.match(/^import(?: +qualified)? +([\w.-_\d]+)/)
    if (!match) return

    let moduleName = match[1]
    text(`https://raw.githubusercontent.com/fiatjaf/module-linker/backends/data/hackage-modules/${moduleName}`)
      .then(packageName => {
        let info = {
          url: `https://hackage.haskell.org/package/${packageName}/docs/${moduleName.split('.').join('-')}.html`,
          kind: 'docs'
        }
        createLink(elem, moduleName, info)
      })
  })
}
