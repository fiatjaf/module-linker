const $ = window.jQuery
const resolve = require('resolve-pathname')
const endswith = require('lodash.endswith')
const startswith = require('lodash.startswith')
const fetch = window.fetch

const gh = require('../helpers').gh
const pathdata = require('../helpers').pathdata
const bloburl = require('../helpers').bloburl

var cache = {}
let {user, repo, ref, current} = pathdata()

module.exports.process = function process () {
  let treePromise =
    gh(`repos/${user}/${repo}/git/refs/heads/${ref}`)
    .then(data => data.object.sha)
    .then(sha => gh(`repos/${user}/${repo}/git/trees/${sha}?recursive=4`))
    .then(data => data.tree.map(b => b.path))
    .then(paths =>
      paths.filter(path =>
        startswith(path, current.slice(0, -1).join('/')) && endswith(path, '.rs')
      )
    )

  $('.blob-code-inner > .pl-k').each((_, elem) => {
    switch (elem.innerText) {
      case 'mod':
        handleMod(elem.parentNode)
        break
      case 'use':
        handleUse(elem.parentNode, treePromise)
        break
    }
  })
}

function handleMod (lineElem) {
  if ($(lineElem).find('.module-linker').length) return

  let moduleName = lineElem.innerText.match(/mod ([\w_]+)/)[1]

  let relative = resolve(moduleName, current.join('/'))
  let url = bloburl(user, repo, ref, relative) + '.rs'

  lineElem.innerHTML = lineElem.innerHTML.replace(
    moduleName,
    `<a class="module-linker" href="${url}">${moduleName}</a>`
  )
}

function handleUse (lineElem, treePromise) {
  if ($(lineElem).find('.module-linker').length) return

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

  declaredModules.forEach(modulePath => {
    if (modulePath.length === 2 && modulePath[0] === 'std') {
      lineElem.innerHTML = lineElem.innerHTML.replace(
        modulePath[1],
        `<a class="module-linker" href="https://doc.rust-lang.org/std/${modulePath[1]}/">${modulePath[1]}</a>`
      )
    } else if (modulePath[0] === 'self') {
      return
    } else if (modulePath.length !== 2 && modulePath[0] === 'std') {
      return
    } else {
      // the module path, delimited by ::, resembles the directory structure.
      let absModulePath = resolve(modulePath.join('/'), current.join('/'))

      // check the cache.
      if (cache[absModulePath]) {
        createLink(modulePath, cache[absModulePath])
      }

      // otherwise look for the module path in the list of files of the repo.
      treePromise
        .then(paths => {
          for (let i = 0; i < paths.length; i++) {
            let path = paths[i]
            if (absModulePath + '.rs' === path || absModulePath + '/mod.rs' === path) {
              let url = bloburl(user, repo, ref, path)
              cache[absModulePath] = url // save to cache.
              createLink(modulePath, url)
              return
            }
          }

          // no compatibility in our file tree -- let's try external modules then
          cratesurl(modulePath[0])
            .then(url => {
              cache[absModulePath] = url // save to cache
              createLink([modulePath[0]], url)
            })
        })

      function createLink (modulePath, url) {
        // replace only the last word in the HTML (after the last '::')
        // (also, the previous words must have been replaced by their own
        //  links to parents of the current module)
        let lastPart = modulePath.slice(-1)[0]

        lineElem.innerHTML = lineElem.innerHTML.replace(
          lastPart,
          `<a class="module-linker" href="${url}">${lastPart}</a>`
        )
      }
    }
  })
}

module.exports.cratesurl = cratesurl
function cratesurl (moduleName) {
  return fetch(`https://githublinker.herokuapp.com/q/crates/${moduleName}`)
    .then(r => r.json())
    .then(({url}) => url)
    .catch(() => `https://crates.io/crates/${moduleName}`)
}

// const stdlib = {'std::any': 1, 'std::ascii': 1, 'std::borrow': 1, 'std::boxed': 1, 'std::cell': 1, 'std::char': 1, 'std::clone': 1, 'std::cmp': 1, 'std::collections': 1, 'std::convert': 1, 'std::default': 1, 'std::env': 1, 'std::error': 1, 'std::f32': 1, 'std::f64': 1, 'std::ffi': 1, 'std::fmt': 1, 'std::fs': 1, 'std::hash': 1, 'std::i16': 1, 'std::i32': 1, 'std::i64': 1, 'std::i8': 1, 'std::io': 1, 'std::isize': 1, 'std::iter': 1, 'std::marker': 1, 'std::mem': 1, 'std::net': 1, 'std::num': 1, 'std::ops': 1, 'std::option': 1, 'std::os': 1, 'std::panic': 1, 'std::path': 1, 'std::prelude': 1, 'std::process': 1, 'std::ptr': 1, 'std::rc': 1, 'std::result': 1, 'std::slice': 1, 'std::str': 1, 'std::string': 1, 'std::sync': 1, 'std::thread': 1, 'std::time': 1, 'std::u16': 1, 'std::u32': 1, 'std::u64': 1, 'std::u8': 1, 'std::usize': 1, 'std::vec': 1, 'std::intrinsics': 1, 'std::raw': 1}
