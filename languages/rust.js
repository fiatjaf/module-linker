const $ = window.jQuery
const resolve = require('resolve-pathname')
const endswith = require('lodash.endswith')
const startswith = require('lodash.startswith')

const external = require('../helpers').external
const treePromise = require('../helpers').treePromise
const createLink = require('../helpers').createLink
const bloburl = require('../helpers').bloburl

function treeProcess (tree) {
  let {current} = window.pathdata

  return tree
    .filter(path =>
      startswith(path, current.slice(0, -2).join('/')) &&
      endswith(path, '.rs')
    )
}

module.exports.process = function process () {
  $('.blob-code-inner > .pl-k').each((_, elem) => {
    switch (elem.innerText) {
      case 'mod':
        handleMod(elem.parentNode)
        break
      case 'crate':
        handleExternCrate(elem.parentNode)
        break
      case 'use':
        handleUse(elem.parentNode)
        break
    }
  })
}

function handleMod (lineElem) {
  if (endswith(lineElem.innerText.trim(), '{')) {
    // modules defined in this same file.
    return
  }

  let moduleName = lineElem.innerText.match(/mod +([\w_]+)/)[1]
  let {user, repo, ref} = window.pathdata

  // search the repository tree (only this same path and
  // a path immediately above)
  treePromise(treeProcess)
    .then(paths => {
      for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        if (endswith(path, '/' + moduleName + '.rs') ||
            endswith(path, '/' + moduleName + '/mod.rs')) {
          let url = bloburl(user, repo, ref, path)
          createLink(lineElem, moduleName, url)
          return
        }
      }
    })
}

function handleExternCrate (lineElem) {
  try {
    let moduleName = lineElem.innerText.match(/extern +crate +([\w_]+)/)[1]
    cratesurl(moduleName)
      .then(url => { createLink(lineElem, moduleName, url) })
  } catch (e) {}
}

function handleUse (lineElem) {
  let {user, repo, ref, current} = window.pathdata

  var declaredModules = []
  try {
    // single module, like `use std::io` or `use response::{Body, Response}`
    let declaration = lineElem.innerText.match(/use +([\w:_]+)/)[1]
    declaration.split('::').forEach(part => {
      // filter out non-modules
      if (!part || part[0] !== part[0].toLowerCase()) /* modules are lowercased, it seems. */ {
        return
      }

      // append each module in the entire module path along with its ancestors, as an array.
      var modulePath
      if (declaredModules.length) {
        modulePath = declaredModules.slice(-1)[0].concat(part)
      } else {
        modulePath = [part]
      }
      declaredModules.push(modulePath)
    })
  } catch (e) {
    try {
      // multiple modules, like `use {logger, handler}`
      declaredModules = lineElem.innerText.match(/use { *((?:[\w_]+[, ]*)+) *}/)[1]
        .split(/[, ]+/)
        .map(part => [part] /* just because declaredModules should be an array of modulePaths */)
    } catch (e) {
      return
    }
  }

  var alreadyDidExternalFetchingForThisLine = false
  declaredModules.forEach(modulePath => {
    if (modulePath.length === 2 && modulePath[0] === 'std') {
      // is from the stdlib
      createLink(
        lineElem,
        modulePath[1],
        {
          url: `https://doc.rust-lang.org/std/${modulePath[1]}/`,
          kind: 'stdlib'
        }
      )
    } else if (modulePath[0] === 'self' || modulePath[0] === 'super') {
      return
    } else if (modulePath.length !== 2 && modulePath[0] === 'std') {
      return
    } else {
      // the module path, delimited by ::, resembles the directory structure.
      let absModulePath = resolve(modulePath.join('/'), current.join('/'))

      // otherwise look for the module path in the list of files of the repo.
      treePromise(treeProcess)
        .then(paths => {
          for (let i = 0; i < paths.length; i++) {
            let path = paths[i]
            if (absModulePath + '.rs' === path || absModulePath + '/mod.rs' === path) {
              let url = bloburl(user, repo, ref, path)
              createLink(
                lineElem,
                /* replace only the last word in the HTML (after the last '::') */
                modulePath.slice(-1)[0],
                url
              )
              return
            }
          }

          // no compatibility in our file tree -- let's try external modules then
          if (alreadyDidExternalFetchingForThisLine) return
          cratesurl(modulePath[0])
            .then(url => { createLink(lineElem, modulePath[0], url) })
          alreadyDidExternalFetchingForThisLine = true
        })
    }
  })
}

module.exports.cratesurl = cratesurl
function cratesurl (moduleName) {
  return external('crates', moduleName)
    .catch(() => ({
      url: `https://crates.io/crates/${moduleName}`,
      kind: 'maybe'
    }))
}
