const $ = window.jQuery
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
      if (!isModule(part)) {
        return
      }

      // append each module in the entire module path along with its
      // ancestors, as an array.
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
        .filter(isModule) // filter out non-modules
        .map(part => [part]) // because declaredModules should be an array of modulePaths
    } catch (e) {
      return
    }
  }

  var noExternalFetchingForThisLine = false
  declaredModules.forEach((modulePath, declaredIndex) => {
    if (modulePath[0] in stdlib) {
      // is from the stdlib (`std` or `core` or `collections` or whatever)
      var url = `https://doc.rust-lang.org/` // the crate
      var i = 0
      while (true) {
        if (modulePath.length >= i + 1 && isModule(modulePath[i])) {
          // a module
          url += `${modulePath[i]}/`
          i++
        } else {
          break
        }
      }

      var kind = 'stdlib'
      if (declaredIndex !== declaredModules.length - 1) {
        // only the module after the last :: gets the floating ball
        kind = 'none'
      }

      createLink(
        lineElem,
        modulePath.slice(-1)[0],
        {url, kind},
        true
      )
      noExternalFetchingForThisLine = true
    } else if (modulePath[0] === 'self' || modulePath[0] === 'super') {
      // these are to refer to locally defined modules etc.
      return
    } else {
      Promise.resolve()
        .then(() => {
          var importingitself = false

          let noextfilename = current.slice(-1)[0].split('.').slice(0, -1).join()
          if (noextfilename === modulePath[0]) {
            importingitself = true
          } else if (noextfilename === 'mod') {
            let dir = current.slice(-2)[0]
            importingitself = (dir === modulePath[0])
          }

          if (importingitself) {
            // if this path is trying to import a module with the same name as itself
            // do not import itself, instead search directly for external crates
            throw new Error('file trying to import itself as module.')
          }

          // look for the module path in the list of files of the repo.
          return treePromise(treeProcess)
        })
        .then(paths => {
          for (let i = 0; i < paths.length; i++) {
            let path = paths[i]
            if (endswith(path, '/' + modulePath.join('/') + '.rs') ||
                endswith(path, '/' + modulePath.join('/') + '/mod.rs')) {
              let url = bloburl(user, repo, ref, path)

              var kind = 'relative'
              if (declaredIndex !== declaredModules.length - 1) {
                // only the module after the last :: gets the floating ball
                kind = 'none'
              }

              createLink(
                lineElem,
                modulePath.slice(-1)[0],
                {url, kind},
                true
              )
              noExternalFetchingForThisLine = true
              return
            }
          }

          throw new Error('no relative modules found.')
        })
        .catch(() => {
          // no compatibility in our file tree -- let's try external modules then
          if (noExternalFetchingForThisLine) return
          cratesurl(modulePath[0])
            .then(url => { createLink(lineElem, modulePath[0], url) })
          noExternalFetchingForThisLine = true
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

const stdlib = {std: 1, core: 1, collections: 1, alloc: 1, std_unicode: 1}

function isModule (name) {
  if (name.length === 0) {
    return
  }

  if (name[0] === name[0].toLowerCase()) {
    // first is lowercase
    return true
  }
  return false
}
