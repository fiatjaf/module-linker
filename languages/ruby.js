const $ = window.jQuery
const resolve = require('resolve-pathname')

const external = require('../helpers').external
const treePromise = require('../helpers').treePromise
const createLink = require('../helpers').createLink
const bloburl = require('../helpers').bloburl

module.exports.process = function process () {
  if (window.pathdata.last === 'Gemfile') {
    gemfile()
    return
  }

  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    let require = /(?:require|load)(?: +|\()?["']([\w-_\/]*)["']\)?/.exec(line)
    let relative = /require_relative(?: +|\()?["']([\w-_\/]*)["']\)?/.exec(line)
    if (!require && !relative) return
    let moduleName = (relative || require)[1]

    Promise.resolve()
    .then(() => {
      if (require) {
        return doRequire(moduleName)
        .then(info => {
          if (info) return info // check if we got a relative url from doRequire, otherwise try external

          if (moduleName in stdlib) {
            return {
              url: 'http://ruby-doc.org/stdlib/libdoc/' + moduleName + '/rdoc/index.html',
              kind: 'stdlib'
            }
          } else {
            moduleName = moduleName.split('/')[0]
            return rubygemsurl(moduleName)
          }
        })
      } else if (relative) {
        return doRelative(moduleName)
      }
    })
    .then(url => {
      createLink(elem, moduleName, url, true)
    })
  })
}

function doRequire (moduleName) {
  let { user, repo, ref } = window.pathdata

  return treePromise()
  .then(tree =>
    tree.map(path => {
      let parts = path.split('/')
      let index = parts.indexOf('lib')
      if (index === -1) return null
      return {
        prefix: parts.slice(0, index).join('/'),
        suffix: parts.slice(index + 1).join('/')
      }
    })
    .filter(path => path)
  )
  .then(paths => {
    for (let i = 0; i < paths.length; i++) {
      let {prefix, suffix} = paths[i]

      if (suffix === moduleName + '.rb') {
        return bloburl(user, repo, ref, `${prefix}/lib/${suffix}`)
      }
    }
  })
}

function doRelative (moduleName) {
  let { user, repo, ref, current } = window.pathdata

  return treePromise()
    .then(paths => {
      for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        let resolved = resolve(moduleName, current.join('/')) + '.rb'
        if (resolved === path) {
          return bloburl(user, repo, ref, path)
        }
      }

      // fallback to default 'require'
      return doRequire(moduleName)
    })
}

function gemfile () {
  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    let gem = /gem ["']([\w-_]*)["']/.exec(line)
    let github = /github: ["']([\w-_\/]*)["']/.exec(line)

    if (gem) {
      let moduleName = gem[1]
      rubygemsurl(moduleName)
      .then(url => { createLink(elem, moduleName, url) })
      .catch(() => {})
    }

    if (github) {
      let path = github[1]
      createLink(elem, path, `https://github.com/${path}`, true)
    }
  })
}

module.exports.rubygemsurl = rubygemsurl
function rubygemsurl (moduleName) {
  return external('rubygems', moduleName)
    .catch(() => ({
      url: `https://rubygems.org/gems/${moduleName}`,
      kind: 'maybe'
    }))
}

const stdlib = {abbrev: 1, base64: 1, benchmark: 1, bigdecimal: 1, cgi: 1, cmath: 1, coverage: 1, csv: 1, date: 1, dbm: 1, debug: 1, delegate: 1, digest: 1, drb: 1, e2mmap: 1, English: 1, erb: 1, etc: 1, expect: 1, extmk: 1, fcntl: 1, fiddle: 1, fileutils: 1, find: 1, forwardable: 1, gdbm: 1, getoptlong: 1, 'io/console': 1, 'io/nonblock': 1, 'io/wait': 1, ipaddr: 1, irb: 1, json: 1, logger: 1, mathn: 1, matrix: 1, mkmf: 1, monitor: 1, mutex_m: 1, 'net/ftp': 1, 'net/http': 1, 'net/imap': 1, 'net/pop': 1, 'net/smtp': 1, 'net/telnet': 1, nkf: 1, objspace: 1, observer: 1, 'open-uri': 1, open3: 1, openssl: 1, optparse: 1, ostruct: 1, pathname: 1, pp: 1, prettyprint: 1, prime: 1, profile: 1, profiler: 1, pstore: 1, psych: 1, pty: 1, racc: 1, 'racc/parser': 1, rake: 1, rdoc: 1, readline: 1, resolv: 1, 'resolv-replace': 1, rexml: 1, rinda: 1, ripper: 1, rss: 1, rubygems: 1, scanf: 1, sdbm: 1, securerandom: 1, set: 1, shell: 1, shellwords: 1, singleton: 1, socket: 1, stringio: 1, strscan: 1, sync: 1, syslog: 1, tempfile: 1, thread: 1, thwait: 1, time: 1, timeout: 1, tk: 1, tmpdir: 1, tracer: 1, tsort: 1, un: 1, unicode_normalize: 1, uri: 1, weakref: 1, webrick: 1, win32ole: 1, xmlrpc: 1, yaml: 1, zlib: 1}
