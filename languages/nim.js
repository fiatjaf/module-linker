const $ = window.jQuery
const resolve = require('resolve-pathname')
const fetch = window.fetch

const htmlWithLink = require('../helpers').htmlWithLink
const bloburl = require('../helpers').bloburl

module.exports.process = function process () {
  var importing = false
  var from_import = false
  var hasImported = false

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    if (line.match(/^import\b/)) {
      importing = true
      hasImported = false
    }

    if (line.match(/^from /)) {
      importing = true
      from_import = true
      hasImported = false
    }

    if (importing) {
      var matches = []

      if (from_import) {
        let m = line.match(/from +([\w\/_]+) +import/)
        if (m) {
          matches = [m[1]]
        }
      } else {
        let m = line.match(/([\w\/_]+)( *,| *$)/g)
        if (m) {
          matches = m
            .map(n => n.match(/[\w\/_]+/)[0] /* remove comma and spaces */)
            .filter(n => n !== 'import')
        }
      }

      if (!matches.length) return

      hasImported = true
      Promise.all(matches.map(moduleName => {
        let [moduleFirstName] = moduleName.split('/')

        // first try the stdlib
        if (moduleFirstName in stdlib) {
          return [
            moduleFirstName,
            {
              url: `https://nim-lang.org/docs/${moduleFirstName}.html`,
              kind: 'stdlib'
            }
          ]
        }

        // then try the nimble package list
        return externalurl(moduleFirstName)
        .then(info => {
          if (info) return [moduleFirstName, info]

          // if none found, assume it is a local path
          let {user, repo, ref, current} = window.pathdata
          let relative = resolve(moduleName, current.join('/'))
          return [moduleName, bloburl(user, repo, ref, relative) + '.nim']
        })
      }))
      .then(results => {
        // results is an array of [moduleName, url] for all modules in this line, in order
        // since we may have multiple modules in the same line we must use extra-caution when
        // replacing so one module name don't try to overwrite underlying HTML tags or other
        // module names.

        var baseIndex = 0
        var resultingHTML = ''
        results.forEach(([moduleName, url]) => {
          let index = elem.innerHTML.slice(baseIndex).search(moduleName)
          if (index === -1) return // should never happen.
          let endIndex = baseIndex + index + moduleName.length
          let html = elem.innerHTML.slice(baseIndex, endIndex)
          let withLink = htmlWithLink(html, moduleName, url)

          resultingHTML += withLink
          baseIndex = endIndex
        })

        elem.innerHTML = resultingHTML + elem.innerHTML.slice(baseIndex)
      })
    }

    if (importing && hasImported && line.match(/\w$/) /* line ending without a comma */) {
      importing = false
      from_import = false
    }
  })
}

module.exports.externalurl = externalurl
function externalurl (moduleName) {
  return waitForNimbleList()
    .then(packages => {
      for (let i = 0; i < packages.length; i++) {
        let pack = packages[i]
        if (pack.name === moduleName) {
          return {
            url: pack.url,
            desc: pack.description,
            kind: 'external'
          }
        }
      }
    })
    .catch(() => null)
}

const stdlib = {'apis': 1, 'system': 1, 'threads': 1, 'channels': 1, 'locks': 1, 'rlocks': 1, 'macros': 1, 'typeinfo': 1, 'typetraits': 1, 'threadpool': 1, 'cpuinfo': 1, 'algorithm': 1, 'tables': 1, 'sets': 1, 'lists': 1, 'deques': 1, 'intsets': 1, 'critbits': 1, 'sequtils': 1, 'strutils': 1, 'strmisc': 1, 'parseutils': 1, 'strscans': 1, 'strtabs': 1, 'unicode': 1, 'encodings': 1, 'pegs': 1, 'ropes': 1, 'matchers': 1, 'subexes': 1, 'os': 1, 'osproc': 1, 'times': 1, 'dynlib': 1, 'streams': 1, 'marshal': 1, 'terminal': 1, 'memfiles': 1, 'fsmonitor': 1, 'asyncfile': 1, 'math': 1, 'complex': 1, 'rationals': 1, 'fenv': 1, 'basic2d': 1, 'basic3d': 1, 'mersenne': 1, 'random': 1, 'stats': 1, 'cgi': 1, 'scgi': 1, 'browsers': 1, 'httpserver': 1, 'httpcore': 1, 'posix': 1, 'httpclient': 1, 'smtp': 1, 'cookies': 1, 'mimetypes': 1, 'uri': 1, 'asyncdispatch': 1, 'asyncnet': 1, 'asynchttpserver': 1, 'asyncftpclient': 1, 'net': 1, 'nativesockets': 1, 'selectors': 1, 'parseopt': 1, 'parseopt2': 1, 'parsecfg': 1, 'parsexml': 1, 'parsecsv': 1, 'parsesql': 1, 'json': 1, 'lexbase': 1, 'highlite': 1, 'rst': 1, 'rstast': 1, 'rstgen': 1, 'sexp': 1, 'xmldom': 1, 'xmldomparser': 1, 'xmltree': 1, 'xmlparser': 1, 'htmlparser': 1, 'htmlgen': 1, 'hashes': 1, 'md5': 1, 'base64': 1, 'securehash': 1, 'colors': 1, 'events': 1, 'oids': 1, 'endians': 1, 'logging': 1, 'options': 1, 'future': 1, 'coro': 1, 'unittest': 1, 'dom': 1, 'asyncio': 1, 'ftpclient': 1, 'sockets': 1, 'rawsockets': 1, 're': 1, 'nre': 1, 'db_postgres': 1, 'db_mysql': 1, 'db_sqlite': 1, 'ssl': 1, 'winlean': 1, 'pcre': 1, 'iup': 1, 'postgres': 1, 'mysql': 1, 'sqlite3': 1, 'odbcsql': 1, 'libuv': 1, 'joyent_http_parser': 1, 'libcurl': 1, 'openssl': 1, 'libsvm': 1}

var requested = false
var packagesPromise
function waitForNimbleList () {
  if (requested) {
    return packagesPromise
  } else {
    requested = true
    packagesPromise =
      fetch('https://rawgit.com/nim-lang/packages/master/packages.json')
        .then(r => r.json())
    return packagesPromise
  }
}
