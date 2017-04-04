const $ = window.jQuery

const text = require('../helpers').text
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let match = line.match(/^import +([^ ]+)/)
    if (!match) return

    let moduleName = match[1]

    // search for this module on our sub-index of pursuit.purescript.org
    Promise.resolve()
    .then(() =>
      text(`https://raw.githubusercontent.com/fiatjaf/module-linker/backends/data/pursuit/${moduleName}`)
    )
    .then(packageAndVersion => {
      let [packageName, version] = packageAndVersion.trim().split('@')
      return {
        url: `https://pursuit.purescript.org/packages/${packageName}/${version}/docs/${moduleName}`,
        kind: 'docs'
      }
    })
    .then(info => { createLink(elem, moduleName, info) })
  })
}
