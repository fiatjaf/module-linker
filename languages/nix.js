const $ = window.jQuery

const { createLink } = require('../helpers')

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()
    line.replace(/ (\.*\/[\w\d\/\.-]+)/g, (_, path) => {
      createLink(elem, path, {
        url: path,
        kind: 'relative'
      })
    })
  })
}
