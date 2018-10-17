const $ = window.jQuery
const resolve = require('resolve-pathname')
const endswith = require('lodash.endswith')
const fetch = window.fetch

const htmlWithLink = require('../helpers').htmlWithLink
const treePromise = require('../helpers').treePromise
const treeurl = require('../helpers').treeurl
const bloburl = require('../helpers').bloburl

module.exports.process = function process () {
  var importing = false
  var from_import = false
  var hasImported = false

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    if (line.match(/^import\b/) || line.match(/^include\b/)) {
      importing = true
      hasImported = false

      if (line.match(/^from /)) {
        importing = true
        from_import = true
        hasImported = false
      }
    }

    if (importing) {
      var matches = []

      if (from_import) {
        let m = line.match(/from +([\w\/_]+) +import/)
        if (m) {
          matches = [m[1]]
        }
      } else {
        let m = line.match(/("?[\w\/._]+"?)( +as +[\w_]+| *,| *$)/g)
        if (m) {
          matches = m
            .map(n => n.match(/"?[\w\/._]+"?/)[0] /* remove comma and spaces */)
            .filter(n => n !== 'import')
            .filter(n => n !== 'include')
        }
      }

      if (!matches.length) return

      hasImported = true
      Promise.all(matches.map(moduleName => {
        var names
        if (moduleName[0] === '"') {
          // name has quotes, like "src/path/template.tmpl" or "src/handle"
          names = moduleName.slice(1, -1).split('/')
        } else {
          // name has no quotes, so its parts can be separated by '.' or '/'
          names = moduleName.indexOf('/') !== -1 ? moduleName.split('/') : moduleName.split('.')
        }
        let firstName = names[0]

        // first try the stdlib
        if (firstName in stdlib) {
          return [
            firstName,
            {
              url: `https://nim-lang.org/docs/${firstName}.html`,
              kind: 'stdlib'
            }
          ]
        }

        // then try a relative path
        return treePromise()
          .then(paths => {
            let {user, repo, ref, current} = window.pathdata
            let moduleAsPath = names.join('/')
            let extension = moduleAsPath.indexOf('.') !== -1 ? '' : '.nim'

            var idx

            // trey relative to local module
            let relative = resolve(moduleAsPath, current.join('/')) + extension
            idx = paths.indexOf(relative)
            if (idx !== -1) {
              return [moduleName, bloburl(user, repo, ref, paths[idx])]
            }

            // try relative to root
            idx = paths.indexOf(moduleAsPath + extension)
            if (idx !== -1) {
              return [moduleName, bloburl(user, repo, ref, paths[idx])]
            }

            // fallback to search anywhere
            for (let i = 0; i < paths.length; i++) {
              let path = paths[i]
              let modulepattern = new RegExp(`\b${moduleAsPath.replace('/', '\\/')}\b`)
              if (modulepattern.exec(path)) {
                // found something
                if (endswith(path, moduleAsPath + extension)) {
                  // it is a file
                  return [moduleName, {
                    url: bloburl(user, repo, ref, path),
                    kind: 'maybe'
                  }]
                } else {
                  // it is probably a directory
                  return [moduleName, {
                    url: treeurl(user, repo, ref, path.split('/').slice(0, -1).join('/')),
                    kind: 'maybe'
                  }]
                }
              }
            }

            // found nothing, let's try the nimble package list
            return externalurl(firstName)
            .then(info => {
              if (info) return [firstName, info]
            })
          })
      }))
      .then(results => results.filter(x => x))
      .then(results => {
        // results is an array of [moduleName, url] for all modules in this line, in order
        // since we may have multiple modules in the same line we must use extra-caution when
        // replacing so one module name don't try to overwrite underlying HTML tags or other
        // module names.

        var baseIndex = 0
        var resultingHTML = ''
        results.forEach(([moduleName, info]) => {
          let index = elem.innerHTML.slice(baseIndex).search(moduleName)
          if (index === -1) return // should never happen.
          let endIndex = baseIndex + index + moduleName.length
          let html = elem.innerHTML.slice(baseIndex, endIndex)
          let withLink = htmlWithLink(html, moduleName, info)

          resultingHTML += withLink
          baseIndex = endIndex
        })

        elem.innerHTML = resultingHTML + elem.innerHTML.slice(baseIndex)
      })
      .catch(() => null)
    }

    if (importing && hasImported && line.match(/[^,]$/) /* line ending without a comma */) {
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
      fetch('https://gitcdn.xyz/repo/nim-lang/packages/master/packages.json')
        .then(r => r.json())
    return packagesPromise
  }
}
