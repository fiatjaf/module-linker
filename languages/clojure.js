const $ = window.jQuery
const startswith = require('lodash.startswith')
const endswith = require('lodash.endswith')
const fetch = window.fetch

const treePromise = require('../helpers').treePromise
const createLink = require('../helpers').createLink
const bloburl = require('../helpers').bloburl

function treeProcess (tree) {
  return tree
    .filter(path => startswith(path, 'src/') &&
                    path.match(/\.(clj|cljs|cljc|edn)$/))
}

module.exports.process = function process () {
  if (window.pathdata.last === 'project.clj') {
    projectclj()
  } else {
    normal()
  }
}

function projectclj () {
  var depsOpen = false
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    if (line.match(/:(dependencies|plugins) /)) {
      depsOpen = true
    }

    if (depsOpen) {
      let match = line.match(/\[([\w._\/-]+)/)
      if (match) {
        processModuleLine(elem, match[1])
      }

      if (line === '' || line.match(/\]\]/)) {
        depsOpen = false
      }
    }
  })
}

function normal () {
  var requireOpen = false
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    if (line.match(/\(:require /)) {
      requireOpen = true
    }

    if (requireOpen) {
      let match = line.match(/\[([\w._\/-]+)/)
      if (match) {
        processModuleLine(elem, match[1])
      }

      if (line === '' || endswith(line, ']))')) {
        requireOpen = false
      }
    }
  })
}

function processModuleLine (line, moduleName) {
  treePromise(treeProcess)
  .then(paths => {
    // it may be a relative module
    for (let i = 0; i < paths.length; i++) {
      let path = paths[i]
      let pathWithoutExt = path.split('.').slice(0, -1).join('.')
      let moduleNameAsPath = 'src/' + moduleName.split('.').join('/')
      if (pathWithoutExt === moduleNameAsPath) {
        let {user, repo, ref} = window.pathdata
        createLink(line, moduleName, bloburl(user, repo, ref, path))
        return
      }
    }

    // not a relative module, try the stdlib
    if (moduleName in stdlib) {
      createLink(line, moduleName, `https://clojuredocs.org/${moduleName}`)
      return
    }

    // ok, let's try clojars, then
    fetch(`https://clojars.org/api/artifacts/${moduleName}`)
    .then(r => r.json())
    .then(info => {
      createLink(line, moduleName, info.homepage || `https://clojars.org/${moduleName}`)
    })
    .catch(() => {
      // ok, it is not on clojars, so perhaps it has its own namespace somehow
      // (I don't know how this thing works)
      let parts = moduleName.split('.')
      if (parts.length > 1) {
        let url = 'http://' + parts.reverse().join('.')
        createLink(line, moduleName, url)
      } else {
        // nothing. forget about this line.
      }
    })
  })
}

const stdlib = {'clojure.core': true, 'clojure.core.async': true, 'clojure.core.logic': true, 'clojure.core.logic.fd': true, 'clojure.core.logic.pldb': true, 'clojure.core.reducers': true, 'clojure.data': true, 'clojure.edn': true, 'clojure.inspector': true, 'clojure.instant': true, 'clojure.java.browse': true, 'clojure.java.io': true, 'clojure.java.javadoc': true, 'clojure.java.shell': true, 'clojure.main': true, 'clojure.pprint': true, 'clojure.reflect': true, 'clojure.repl': true, 'clojure.set': true, 'clojure.spec': true, 'clojure.stacktrace': true, 'clojure.string': true, 'clojure.template': true, 'clojure.test': true, 'clojure.walk': true, 'clojure.xml': true, 'clojure.zip': true}
