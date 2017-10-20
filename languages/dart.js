const $ = window.jQuery
const startswith = require('lodash.startswith')
const endswith = require('lodash.endswith')
const resolve = require('resolve-pathname')

const external = require('../helpers').external
const createLink = require('../helpers').createLink
const htmlWithLink = require('../helpers').htmlWithLink
const treePromise = require('../helpers').treePromise
const bloburl = require('../helpers').bloburl

function treeProcess (tree) {
  let paths = tree
    .filter(path => startswith(path, 'lib/'))
    .filter(path => endswith(path, '.dart'))

  var filemap = {}
  for (let i = 0; i < paths.length; i++) {
    let path = paths[i]
    filemap[path.split('/').slice(1).join('/')] = true
  }

  return filemap
}

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
      // may be an external package or a local package submodule
      let [_, importedpath] = moduleName.split(':')
      let [name, ...extra] = importedpath.split('/')
      let extrapath = extra.join('/')

      return treePromise(treeProcess)
        .then(filemap => {
          // found it here -- BEWARE: this code doesn't check the name of the package.
          if (filemap[extrapath]) {
            let {user, repo, ref, _} = window.pathdata
            return bloburl(user, repo, ref, 'lib/' + extrapath)
          }

          return darturl(name)
            .then(info => {
              if (extrapath) {
                let gh = info.url.match(/https?:\/\/github.com\/([^\/]+)\/([^\/]+)/)
                if (gh) {
                  info.url = `https://github.com/${gh[1]}/${gh[2]}` +
                             `/blob/master/lib/${extrapath}`
                }
              }
              return info
            })
        })
    } else if (startswith(moduleName, 'dart:')) {
      // is from the stdlib
      let [_, name] = moduleName.split(':')
      return {
        url: `https://api.dartlang.org/stable/dart-${name}/dart-${name}-library.html`,
        kind: 'stdlib'
      }
    } else {
      // is probably local
      let {user, repo, ref, current} = window.pathdata
      let path = resolve(moduleName, current.join('/'))
      return bloburl(user, repo, ref, path)
    }
  })
  .then(info => {
    if (typeof lineIndex !== 'undefined') {
      // lineIndex is passed from markdown.js, meaning we must replace
      // only in that line -- in this case `elem` is the whole code block,
      // not, as normally, a single line.
      let lines = elem.innerHTML.split('\n')
      lines[lineIndex] = htmlWithLink(lines[lineIndex], moduleName, info)
      elem.innerHTML = lines.join('\n')
      return
    }

    createLink(elem, moduleName, info, true)
  })
}

module.exports.darturl = darturl
function darturl (moduleName) {
  return external('dart', moduleName)
    .catch(() => ({
      url: `https://pub.dartlang.org/packages/${moduleName}`,
      kind: 'maybe'
    }))
}
