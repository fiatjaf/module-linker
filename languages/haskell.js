const $ = window.jQuery
const endswith = require('lodash.endswith')

const text = require('../helpers').text
const treePromise = require('../helpers').treePromise
const createLink = require('../helpers').createLink
const bloburl = require('../helpers').bloburl

function treeProcess (tree) {
  return tree
    .map(path => {
      if (!endswith(path, '.hs')) return false

      let parts = path.slice(0, -3).split('/')
      let modulePaths = []

      // any path that has a module-like ending path is potentially a module path
      var addingToModulePath = true
      for (let i = parts.length - 1; i >= 0; i--) {
        let part = parts[i]

        // this regex checks if the name contains only letters, the 1st uppercase
        if (addingToModulePath && part.match(/[A-Z]\w*/)) {
          modulePaths.unshift(part)
        } else {
          addingToModulePath = false
        }
      }

      return {
        path,
        moduleName: modulePaths.join('.')
      }
    })
    .filter(p => p)
}

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let match = line.match(/^import(?: +qualified)? +([\w.-_\d]+)/)
    if (!match) return

    let moduleName = match[1]

    Promise.resolve()
    .then(() =>
      // search for a local module
      treePromise(treeProcess)
    )
    .then(potentialModules => {
      let {user, repo, ref} = window.pathdata

      for (let i = 0; i < potentialModules.length; i++) {
        let {path, moduleName: potentialModule} = potentialModules[i]

        if (potentialModule === moduleName) {
          let url = bloburl(user, repo, ref, path)

          createLink(
            elem,
            moduleName,
            {url, kind: 'relative'},
            true
          )
          return
        }
      }

      throw new Error('no relative modules found.')
    })
    .catch(() =>
      // search for an external module
      text(`https://raw.githubusercontent.com/fiatjaf/module-linker/backends/data/hackage-modules/${moduleName}`)
      .then(packageName => {
        let info = {
          url: `https://hackage.haskell.org/package/${packageName}/docs/${moduleName.split('.').join('-')}.html`,
          kind: 'docs',
          desc: `from ${packageName.trim()}.`
        }
        createLink(elem, moduleName, info)
      })
    )
  })
}
