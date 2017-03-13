const $ = window.jQuery
const startswith = require('lodash.startswith')
const endswith = require('lodash.endswith')

module.exports.process = function process () {
  let block = $('.blob-code-inner')
  let lines = block
    .map((_, elem) => elem.innerText.trim())
    .get()

  processLines(block, lines)
}

module.exports.processLines = processLines

function processLines (block, lines) {
  var importing = false
  var multiLineImport = false

  lines.forEach(line => {
    if (startswith(line, 'import')) importing = true
    if (startswith(line, 'import (')) multiLineImport = true

    if (importing) {
      let link = block.find('.pl-s')
        .filter((_, linkElem) => linkElem.parentNode.tagName !== 'A')
        .eq(0)

      if (link.length) {
        let moduleName = link.text().slice(1, -1)
        let ref = window.location.pathname.split('/')[4] // github branch we're in

        var url
        if (startswith(moduleName, 'github.com/') && ref) {
          let p = moduleName.split('/')
          url = `/${p[1]}/${p[2]}/tree/${ref}/${p.slice(3).join('/')}`
        } else if (moduleName.indexOf('.') === -1) {
          url = 'https://golang.org/pkg/' + moduleName
        } else {
          url = 'https://godoc.org/' + moduleName
        }
        link.wrap(`<a class="module-linker" href="${url}"></a>`)

        // single line import
        if (!multiLineImport) importing = false
      }
    }

    if (endswith(line, ')')) {
      importing = false
      multiLineImport = false
    }
  })
}
