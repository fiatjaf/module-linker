const $ = window.jQuery
const resolve = require('resolve-pathname')
const replaceAsync = require('string-replace-async')
const fetch = window.fetch

const bloburl = require('../helpers').bloburl

const normalImportMatcher = /([\w\/_]+)( *,| *$)/g
const fromImportMatcher = /> +([\w\/_]+) +</

module.exports.process = function process () {
  var importing = false
  var from_import = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line.match(/^import /)) {
      importing = true
    }

    if (line.match(/^from /)) {
      importing = true
      from_import = true
    }

    if (importing && !elem.find('.module-linker').length) {
      let lineElem = elem.get(0)
      let regex = from_import ? fromImportMatcher : normalImportMatcher

      replaceAsync(lineElem.innerHTML, regex, (_, moduleName, next) => {
        // first try the external
        return externalurl(moduleName)
          .then(url => {
            // if none found, assume it is a local path
            if (url) {
              return url
            } else {
              let {user, repo, ref, current} = window.pathdata
              let relative = resolve(moduleName, current.join('/'))
              return bloburl(user, repo, ref, relative) + '.nim'
            }
          })
          .then(url => {
            if (typeof next === 'number' /* means this is a from_import */) {
              return `> <a class="module-linker" href="${url}">${moduleName}</a> <`
            } else /* it's a normal import */ {
              return `<a class="module-linker" href="${url}">${moduleName}</a>${next}`
            }
          })
      })
      .then(html => {
        lineElem.innerHTML = html
      })
    }

    if (importing && line.match(/\w$/) /* line ending without a comma */) {
      importing = false
      from_import = false
    }
  })
}

module.exports.externalurl = externalurl
function externalurl (moduleName) {
  if (moduleName in stdlib) {
    return Promise.resolve(`https://nim-lang.org/docs/${moduleName}.html`)
  } else {
    return waitForNimbleList()
      .then(packages => {
        for (let i = 0; i < packages.length; i++) {
          let pack = packages[i]
          if (pack.name === moduleName) {
            return {
              url: pack.url,
              desc: pack.description
            }
          }
        }
      })
      .catch(() => null)
  }
}

const stdlib = {'apis': 1, 'system': 1, 'threads': 1, 'channels': 1, 'locks': 1, 'rlocks': 1, 'macros': 1, 'typeinfo': 1, 'typetraits': 1, 'threadpool': 1, 'cpuinfo': 1, 'algorithm': 1, 'tables': 1, 'sets': 1, 'lists': 1, 'deques': 1, 'intsets': 1, 'critbits': 1, 'sequtils': 1, 'strutils': 1, 'strmisc': 1, 'parseutils': 1, 'strscans': 1, 'strtabs': 1, 'unicode': 1, 'encodings': 1, 'pegs': 1, 'ropes': 1, 'matchers': 1, 'subexes': 1, 'os': 1, 'osproc': 1, 'times': 1, 'dynlib': 1, 'streams': 1, 'marshal': 1, 'terminal': 1, 'memfiles': 1, 'fsmonitor': 1, 'asyncfile': 1, 'math': 1, 'complex': 1, 'rationals': 1, 'fenv': 1, 'basic2d': 1, 'basic3d': 1, 'mersenne': 1, 'random': 1, 'stats': 1, 'cgi': 1, 'scgi': 1, 'browsers': 1, 'httpserver': 1, 'httpclient': 1, 'smtp': 1, 'cookies': 1, 'mimetypes': 1, 'uri': 1, 'asyncdispatch': 1, 'asyncnet': 1, 'asynchttpserver': 1, 'asyncftpclient': 1, 'net': 1, 'nativesockets': 1, 'selectors': 1, 'parseopt': 1, 'parseopt2': 1, 'parsecfg': 1, 'parsexml': 1, 'parsecsv': 1, 'parsesql': 1, 'json': 1, 'lexbase': 1, 'highlite': 1, 'rst': 1, 'rstast': 1, 'rstgen': 1, 'sexp': 1, 'xmldom': 1, 'xmldomparser': 1, 'xmltree': 1, 'xmlparser': 1, 'htmlparser': 1, 'htmlgen': 1, 'hashes': 1, 'md5': 1, 'base64': 1, 'securehash': 1, 'colors': 1, 'events': 1, 'oids': 1, 'endians': 1, 'logging': 1, 'options': 1, 'future': 1, 'coro': 1, 'unittest': 1, 'dom': 1, 'asyncio': 1, 'ftpclient': 1, 'sockets': 1, 'rawsockets': 1, 're': 1, 'nre': 1, 'db_postgres': 1, 'db_mysql': 1, 'db_sqlite': 1, 'ssl': 1, 'winlean': 1, 'posix': 1, 'pcre': 1, 'iup': 1, 'postgres': 1, 'mysql': 1, 'sqlite3': 1, 'odbcsql': 1, 'libuv': 1, 'joyent_http_parser': 1, 'libcurl': 1, 'openssl': 1, 'libsvm': 1}

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
