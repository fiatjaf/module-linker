const $ = window.jQuery
const startswith = require('lodash.startswith')
const endswith = require('lodash.endswith')

const createLink = require('../helpers').createLink
const treeurl = require('../helpers').treeurl

module.exports.process = function process () {
  var importing = false
  var multiLineImport = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (startswith(line, 'import')) importing = true
    if (startswith(line, 'import (')) multiLineImport = true

    if (importing && line.match(/"[^"]+"/)) {
      let link = elem.find('.pl-s')
        .filter((_, linkElem) => linkElem.parentNode.tagName !== 'A')
        .eq(0)

      if (link.length) {
        let moduleName = link.text().slice(1, -1)
        let url = gourl(moduleName)
        createLink(link.get(0), moduleName, url, true)

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

module.exports.processBlock = processBlock
function processBlock (block) {
  /* for processing blocks in .md files. */
  var modules = {}

  let lines = block.text()
    .split('\n')
    .map(line => line.trim())

  var importing = false
  var multiLineImport = false

  lines.forEach(line => {
    if (startswith(line, 'import')) importing = true
    if (startswith(line, 'import (')) multiLineImport = true

    if (importing) {
      let match = line.match(/"([\w.\/]+)"$/)

      if (match) {
        let moduleName = match[1]
        let url = gourl(moduleName)
        modules[moduleName] = url // store everything here first, to eliminate duplicates.

        // single line import
        if (!multiLineImport) importing = false
      }
    }

    if (endswith(line, ')')) {
      importing = false
      multiLineImport = false
    }
  })

  // now we apply everything:
  for (let moduleName in modules) {
    let url = modules[moduleName]
    createLink(block.get(0), moduleName, url, false)
    // we indeed want backwards=false here because it is safer to do
    // frontwards replacement if we're dealing with the entire block.
  }
}

function gourl (moduleName) {
  let {user, repo, ref} = window.pathdata
  if (startswith(moduleName, 'github.com/')) {
    let p = moduleName.split('/')

    if (p.length === 3) {
      // module is the repo root.
      return `https://${moduleName}`
    } else {
      // module is a directory inside a GitHub repo.
      return treeurl(user, repo, ref, p.slice(3).join('/'))
    }
  } else if (moduleName.indexOf('.') === -1) {
    return 'https://golang.org/pkg/' + moduleName
  } else {
    return 'https://godoc.org/' + moduleName
  }
}
