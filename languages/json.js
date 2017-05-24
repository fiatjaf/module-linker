const resolve = require('resolve-pathname')
const $ = window.jQuery

const npmurl = require('./javascript').npmurl
const composerurl = require('./php').composerurl
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  switch (location.pathname.split('/').slice(-1)[0]) {
    case 'composer.json':
      composerjson()
      break
    case 'package.json':
      packagejson()
      break
    case 'elm-package.json':
      elmpackagejson()
      break
  }
}

function composerjson () {
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line.match(/"require"/) || line.match(/"require-dev"/) ||
        line.match(/"suggest"/) || line.match(/"replace"/) || line.match(/"conflict"/)) {
      depsOpen = true
    }

    if (line.match('}')) {
      depsOpen = false
    }

    if (depsOpen && elem.find('.pl-s').length === 2) {
      lineWithUrlFetcher(elem, composerurl)
    }
  })
}

function packagejson () {
  var depsOpen = false

  $('.blob-code-inner').each((_, rawelem) => {
    let elem = $(rawelem)
    let line = elem.text().trim()

    if (line.match(/"dependencies"/) || line.match(/"devDependencies"/) ||
        line.match(/"peerDependencies"/) || line.match(/"optionalDependencies"/)) {
      depsOpen = true
    }

    if (line.match('}')) {
      depsOpen = false
    }

    if (depsOpen && elem.find('.pl-s').length === 2) {
      lineWithUrlFetcher(elem, npmurl)
    }

    if (line.match(/"main":/)) {
      let main = elem.find('.pl-s').eq(1).text().trim().slice(1, -1)
      let url = resolve(main, location.pathname)
      createLink(rawelem, main, url)
    }
  })
}

function lineWithUrlFetcher (elem, urlfetcher) {
  let link = elem.find('.pl-s').eq(0)
  let moduleName = link.text().trim().slice(1, -1)

  urlfetcher(moduleName)
    .then(url => {
      createLink(link.get(0), moduleName, url)
    })
    .catch(() => {})
}

function elmpackagejson () {
  var depsOpen = false
  var srcDirectoriesOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line.match(/"dependencies"/)) {
      depsOpen = true
      return
    }

    if (line.match(/"source-directories"/)) {
      srcDirectoriesOpen = true
      return
    }

    if (line.match('}')) {
      depsOpen = false
    }

    if (line.match(']')) {
      srcDirectoriesOpen = false
    }

    if (depsOpen && elem.find('.pl-s').length === 2) {
      lineWithUrlFetcher(
        elem,
        (moduleName) =>
          Promise.resolve({
            url: `http://package.elm-lang.org/packages/${moduleName}/latest`,
            kind: 'external'
          })
      )
    }

    if (srcDirectoriesOpen && elem.find('.pl-s').length === 1) {
      let path = elem.find('.pl-s').text().slice(1, -1)
      if (path && path.length > 1) {
        createLink(elem.get(0), path, path)
      }
    }
  })
}
