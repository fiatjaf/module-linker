const resolve = require('resolve-pathname')
const $ = window.jQuery

const npmurl = require('./javascript').npmurl
const composerurl = require('./php').composerurl
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  switch (window.pathdata.last) {
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
  var contributorsOpen = false
  var authorOpen = false
  var binOpen = false

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

    if (line.match(/"contributors"/) || line.match(/"authors"/)) {
      contributorsOpen = true
    }

    if (line.match(']')) {
      contributorsOpen = false
    }

    if (line.match(/"author"/) && line.match('{')) {
      authorOpen = true
    }

    if (line.match('}')) {
      authorOpen = false
    }

    if (line.match(/"bin"/) && line.match('{')) {
      binOpen = true
    }

    if (line.match('}')) {
      binOpen = false
    }

    if (depsOpen && elem.find('.pl-s').length === 2) {
      lineWithUrlFetcher(elem, npmurl)
    }

    if (!contributorsOpen && !authorOpen && line.match(/"name"\s*:/)) {
      let name = elem.find('.pl-s').eq(1).text().trim().slice(1, -1)
      let url = 'https://npmjs.com/package/' + name
      createLink(rawelem, name, {url, kind: 'maybe'})
    }

    if (binOpen && line.split(':').length == 2) {
      let main = elem.find('.pl-s').eq(1).text().trim().slice(1, -1)
      let url = resolve(main, location.pathname)
      createLink(rawelem, main, url)
    }

    if (line.match(/"main"\s*:/) || line.match(/"module"\s*:/) || line.match(/"es2015"\s*:/) || line.match(/"esnext"\s*:/) || // Files for different Node.js versions
        (line.match(/"browser"\s*:/) && !line.match(/"browser"\s*:\s*{/)) || line.match(/"web"\s*:/) || // Files for web browsers
        line.match(/"unpkg"\s*:/) || line.match(/"jsdelivr"\s*:/) || line.match(/"runkitExampleFilename"\s*:/) || // Files for popular CDNs and examples
        line.match(/"source"\s*:/) || line.match(/"src"\s*:/) || line.match(/"typings"\s*:/) || line.match(/"types"\s*:/) || // Files for sources and typings
        line.match(/"node"\s*:/) || line.match(/"deno"\s*:/) || // Files for different runtimes
        (line.match(/"bin"\s*:/) && !line.match(/"bin"\s*:\s*{/)) // Executable file
    ) {
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
