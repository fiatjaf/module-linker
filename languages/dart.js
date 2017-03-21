const $ = window.jQuery
const startswith = require('lodash.startswith')
const resolve = require('resolve-pathname')

const external = require('../helpers').external
const createLink = require('../helpers').createLink
const htmlWithLink = require('../helpers').htmlWithLink
const bloburl = require('../helpers').bloburl

module.exports.process = function process () {
  let { current } = window.pathdata

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()
    processLine(elem, line, current.join('/'))
  })
}

module.exports.processLine = processLine

function processLine (elem, line, currentPath, lineIndex) {
  var moduleName

  let names = [
    /import +['"`]([^'"`]+)['"`]/.exec(line),
    /export +['"`]([^'"`]+)['"`]/.exec(line),
    /part +['"`]([^'"`]+)['"`]/.exec(line)
  ]
    .filter(x => x)
    .map(regex => regex[1])
  if (names.length) {
    moduleName = names[0]
  } else {
    return
  }

  Promise.resolve()
  .then(() => {
    if (startswith(moduleName, 'package:')) {
      // is an external package.
      let [_, importedpath] = moduleName.split(':')
      let [name, ...extra] = importedpath.split('/')
      let extrapath = extra.join('/')
      return darturl(name)
        .then(url => {
          if (extrapath) {
            let gh = url.match(/https?:\/\/github.com\/([^\/]+)\/([^\/]+)/)
            if (gh) {
              return `https://github.com/${gh[1]}/${gh[2]}/blob/master/lib/${extrapath}`
            }
          }
          return url
        })
    } else if (startswith(moduleName, 'dart:')) {
      // is from the stdlib
      let [_, name] = moduleName.split(':')
      return `https://api.dartlang.org/stable/dart-${name}/dart-${name}-library.html`
    } else {
      // is probably local
      let {user, repo, ref, current} = window.pathdata
      let path = resolve(moduleName, current.join('/'))
      return bloburl(user, repo, ref, path)
    }
  })
  .then(url => {
    if (typeof lineIndex !== 'undefined') {
      // lineIndex is passed from markdown.js, meaning we must replace
      // only in that line -- in this case `elem` is the whole code block,
      // not, as normally, a single line.
      let lines = elem.innerHTML.split('\n')
      lines[lineIndex] = htmlWithLink(lines[lineIndex], moduleName, url)
      elem.innerHTML = lines.join('\n')
      return
    }

    createLink(elem, moduleName, url, true)
  })
}

var waiting = {} // a cache of promises to javascript external modules
module.exports.darturl = darturl
function darturl (moduleName) {
  if (!waiting[moduleName]) {
    waiting[moduleName] = external('dart', moduleName)
      .catch(() => `https://pub.dartlang.org/packages/${moduleName}`)
  }

  return waiting[moduleName]
}
