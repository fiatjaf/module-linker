const $ = window.jQuery

const lineJS = require('./javascript').processLine
const lineDart = require('./dart').processLine
const blockGo = require('./go').processBlock

module.exports.process = function process () {
  $('.highlight-source-js, .highlight-source-js-jsx').each((_, elem) => {
    elem.innerText.trim()
      .split('\n')
      .forEach((line, i) => {
        lineJS(elem, line, null, i)
      })
  })

  $('.highlight-source-dart').each((_, elem) => {
    elem.innerText.trim()
      .split('\n')
      .forEach((line, i) => {
        lineDart(elem, line, null, i)
      })
  })

  $('.highlight-source-go').each((_, elem) => {
    let block = $(elem)
    blockGo(block)
  })
}

