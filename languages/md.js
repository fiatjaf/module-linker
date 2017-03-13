const $ = window.jQuery

const lineJS = require('./javascript').processLine
const blockGo = require('./go').processBlock

module.exports.process = function process () {
  $('.highlight-source-js').each((_, elem) => {
    elem.innerText.trim()
      .split('\n')
      .forEach(line => {
        lineJS(elem, line)
      })
  })

  $('.highlight-source-go').each((_, elem) => {
    let block = $(elem)
    blockGo(block)
  })
}

