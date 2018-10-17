/** @format */

const $ = window.jQuery
const startswith = require('lodash.startswith')

const {createLink} = require('../helpers')

const ext = window.filetype

module.exports.process = function process() {
  $('.blob-code-inner').each((_, elem) => {
    if (
      !startswith(elem.innerText.trim(), '@import') &&
      !startswith(elem.innerText.trim(), '@require')
    ) {
      return
    }

    const handle = (_, path) => {
      var url = path
      if (
        ['css', 'scss', 'styl', 'sass', 'less'].indexOf(
          path.split('.').slice(-1)[0]
        ) === -1
      ) {
        url = path + '.' + ext
      }

      createLink(elem, path, {
        url,
        kind: 'relative'
      })
    }

    let line = elem.innerText.trim()
    line.replace(/@import url\(['"]([\w\d\/\.-]+)['"]\)/, handle)
    line.replace(/@import ['"]([\w\d\/\.-]+)['"]/, handle)
    line.replace(/@import\(url\(['"]([\w\d\/\.-]+)['"]\)/, handle)
    line.replace(/@import\(['"]([\w\d\/\.-]+)['"]/, handle)
    line.replace(/@require url\(['"]([\w\d\/\.-]+)['"]\)/, handle)
    line.replace(/@require ['"]([\w\d\/\.-]+)['"]/, handle)
    line.replace(/@require\(url\(['"]([\w\d\/\.-]+)['"]\)/, handle)
    line.replace(/@require\(['"]([\w\d\/\.-]+)['"]/, handle)
  })
}
