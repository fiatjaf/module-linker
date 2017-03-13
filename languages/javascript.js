const $ = window.jQuery
const startswith = require('lodash.startswith')
const endswith = require('lodash.endswith')
const resolve = require('resolve-pathname')
const fetch = window.fetch

const gh = require('../helpers').gh
const pathdata = require('../helpers').pathdata
const bloburl = require('../helpers').bloburl

const stdlib = {assert: 1, buffer: 1, addons: 1, child_process: 1, cluster: 1, console: 1, crypto: 1, debugger: 1, dns: 1, domain: 1, errors: 1, events: 1, fs: 1, globals: 1, http: 1, https: 1, modules: 1, net: 1, os: 1, path: 1, process: 1, punycode: 1, querystring: 1, readline: 1, repl: 1, stream: 1, string_decoder: 1, timers: 1, tls: 1, tty: 1, dgram: 1, url: 1, util: 1, v8: 1, vm: 1, zlib: 1}

module.exports.process = function process () {
  let { user, repo, ref, current } = pathdata()

  let treePromise =
    gh(`repos/${user}/${repo}/git/refs/heads/${ref}`)
    .then(data => data.object.sha)
    .then(sha => gh(`repos/${user}/${repo}/git/trees/${sha}?recursive=4`))
    .then(data => data.tree.map(b => b.path))
    .then(paths => paths.filter(path => path.match(/index\.\w+$/)))

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()
    processLine(elem, line, treePromise, current.join('/'))
  })
}

module.exports.processLine = processLine

function processLine (elem, line, treePromise, currentPath) {
  var moduleName

  let names = [
    /import *.* *from ['"`]([^'"`]+)['"`]/.exec(line),
    /import *['"`]([^'"`]+)['"`]/.exec(line),
    /} * from *['"`]([^'"`]+)['"`]/.exec(line),
    /export .* from ['"`]([^'"`]+)['"`]/.exec(line),
    /require *\(['"`]([^)]+)['"`]\)/.exec(line),
    /require *['"`]([^)]+)['"`]/.exec(line)
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
    if (startswith(moduleName, '.')) {
      // is a local file.
      if (endswith(moduleName, '.js') || endswith(moduleName, '.coffee') || endswith(moduleName, '.ts') ||
          endswith(moduleName, '.jsx') || endswith(moduleName, '.es' || endswith(moduleName, '.json'))) {
        return moduleName
      } else {
        return treePromise
          .then(paths => {
            for (let i = 0; i < paths.length; i++) {
              let path = paths[i]
              let resolved = resolve(moduleName, currentPath)
              if (path.split('/').slice(0, -1).join('/') === resolved) {
                let {user, repo, ref} = pathdata()
                return bloburl(user, repo, ref, path)
              }
            }
            throw new Error('fallback.')
          })
          .catch(() => {
            // fallback to appending the same filetype as the file in which we are now.
            // normally === '.js', but can be '.ts' or '.coffee'.
            return moduleName + '.' + window.filetype
          })
      }
    } else if (moduleName in stdlib) {
      // is not local, is a file from the stdlib.
      return 'https://nodejs.org/api/' + moduleName + '.html'
    } else {
      // is an npm module.
      return fetch(`https://githublinker.herokuapp.com/q/npm/${moduleName}`)
        .then(r => r.json())
        .then(({url}) => url)
        .catch(() =>
          'https://npmjs.com/package/' + (
            startswith(moduleName, '@')
              ? moduleName.split('/').slice(0, 2).join('/')
              : moduleName.split('/')[0]
            )
        )
    }
  })
  .then(url => {
    $(elem).find('.pl-s').each((_, linkedElem) => {
      let link = $(linkedElem)
      if (linkedElem.parentNode.tagName === 'A') return
      if (link.text().slice(1, -1) !== moduleName) return

      link.wrap(`<a class="module-linker" href="${url}"></a>`)
    })
  })
}
